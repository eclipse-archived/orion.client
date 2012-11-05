/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define window */
/*jslint regexp:false browser:true forin:true*/

define(['i18n!orion/navigate/nls/messages', 'require', 'dojo', 'orion/fileUtils', 'orion/explorers/explorer'],
		function(messages, require, dojo, mFileUtils, mExplorer){

	/**
	 * Tree model used by the FileExplorer
	 */
	function Model(serviceRegistry, root, fileClient, idPrefix, excludeFiles, excludeFolders) {
		this.registry = serviceRegistry;
		this.root = root;
		this.fileClient = fileClient;
		this.idPrefix = idPrefix || "";
		this.excludeFiles = !!excludeFiles;
		this.excludeFolders = !!excludeFolders;
	}
	Model.prototype = new mExplorer.ExplorerModel(); 
	
	Model.prototype.getRoot = function(onItem){
		onItem(this.root);
	};
	
	/*
		Process the parent and children, doing any filtering or sorting that may be necessary.
	*/
	Model.prototype.processParent = function(parent, children) {
		if (this.excludeFiles || this.excludeFolders) {
			var filtered = [];
			for (var i in children) {
				var exclude = children[i].Directory ? this.excludeFolders : this.excludeFiles;
				if (!exclude) {
					filtered.push(children[i]);
					children[i].parent = parent;
				}
			}
			children = filtered;
		} else {
			for (var j in children) {
				children[j].parent = parent;
			}
		}
	
		//link the parent and children together
		parent.children = children;

		// not ideal, but for now, sort here so it's done in one place.
		// this should really be something pluggable that the UI defines
		parent.children.sort(function(a, b) {
			var isDir1 = a.Directory;
			var isDir2 = b.Directory;
			if (isDir1 !== isDir2) {
				return isDir1 ? -1 : 1;
			}
			var n1 = a.Name && a.Name.toLowerCase();
			var n2 = b.Name && b.Name.toLowerCase();
			if (n1 < n2) { return -1; }
			if (n1 > n2) { return 1; }
			return 0;
		}); 
		return children;
	};
		
	Model.prototype.getChildren = function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
		// the parent already has the children fetched
		if (parentItem.children) {
			onComplete(parentItem.children);
		} else if (parentItem.Directory!==undefined && parentItem.Directory===false) {
			onComplete([]);
		} else if (parentItem.Location) {
			this.fileClient.fetchChildren(parentItem.ChildrenLocation).then( 
				dojo.hitch(this, function(children) {
					onComplete(this.processParent(parentItem, children));
				})
			);
		} else {
			onComplete([]);
		}
	};
	Model.prototype.constructor = Model;


	/**
	 * Creates a new file explorer.
	 * @name orion.explorers.explorer-table.FileExplorer
	 * @class A user interface component that displays a table-oriented file explorer
	 * @param {Object} options.treeRoot an Object representing the root of the tree.
	 * @param {orion.selection.Selection} options.selection the selection service used to track selections.
	 * @param {orion.fileClient.FileClient} options.fileClient the file service used to retrieve file information
	 * @param {String} options.parentId the id of the parent DOM element
	 * @param {Function} options.rendererFactory a factory that creates a renderer
	 * @param {Boolean} options.excludeFiles specifies that files should not be shown. Optional.
	 * @param {Boolean} options.excludeFolders specifies that folders should not be shown.  Optional.
	 * @param {orion.serviceRegistry.ServiceRegistry} options.serviceRegistry  the service registry to use for retrieving other
	 *	Orion services.  Optional.  If not specified, then some features of the explorer will not be enabled, such as status reporting,
	 *  honoring preference settings, etc.
	 */
	function FileExplorer(options) {
		this.registry = options.serviceRegistry;
		this.treeRoot = options.treeRoot;
		this.selection = options.selection;
		this.fileClient = options.fileClient;
		this.excludeFiles = options.excludeFiles;
		this.excludeFolders = options.excludeFolders;
		this.parentId = options.parentId;
		this.renderer = options.rendererFactory(this);
		this.dragAndDrop = options.dragAndDrop;
		this.model = null;
		this.myTree = null;
		this.checkbox = false;
		this._hookedDrag = false;

		var renderer = this.renderer;
		if (this.registry) {
			this.registry.registerService("orion.cm.managedservice", //$NON-NLS-0$
				{	updated: function(properties) {
						var target;
						if (properties && properties["links.newtab"] !== "undefined") { //$NON-NLS-1$ //$NON-NLS-0$
							target = properties["links.newtab"] ? "_blank" : "_self"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						} else {
							target = "_self"; //$NON-NLS-0$
						}
						renderer.setTarget(target);
					}
				}, {pid: "nav.config"}); //$NON-NLS-0$
		}
	}
	
	FileExplorer.prototype = new mExplorer.Explorer();
	
	FileExplorer.prototype._makeDropTarget = function(item, node, persistAndReplace) {
		function dropFileEntry(entry, path, target, explorer, performDrop, fileClient) {
			path = path || "";
			if (entry.isFile) {
				// can't drop files directly into workspace.
				if (target.Location.indexOf('/workspace') === 0){ //$NON-NLS-0$
					explorer.registry.getService("orion.page.message").setProgressResult({ //$NON-NLS-0$
						Severity: "Error", Message: messages["You cannot copy files directly into the workspace.  Create a folder first."]});	 //$NON-NLS-1$ //$NON-NLS-0$ 
				} else {
					entry.file(function(file) {
						performDrop(target, file, explorer, file.name.indexOf(".zip") === file.name.length-4 && window.confirm(dojo.string.substitute(messages["Unzip ${0}?"], [file.name]))); //$NON-NLS-1$ //$NON-NLS-0$ 
					});
				}
			} else if (entry.isDirectory) {
				var dirReader = entry.createReader();
				fileClient.createFolder(target.Location, entry.name).then(function(subFolder) {
					explorer.changedItem(target, true);
					dirReader.readEntries(function(entries) {
						for (var i=0; i<entries.length; i++) {
							dropFileEntry(entries[i], path + entry.name + "/", subFolder, explorer, performDrop, fileClient); //$NON-NLS-0$
						}
					});
				});
			}
		}
		
		if (this.dragAndDrop) {
			var explorer = this;
			var performDrop = this.dragAndDrop;
			
			var dragLeave = dojo.hitch(this, function(evt) { //$NON-NLS-0$
				dojo.removeClass(node, "dragOver"); //$NON-NLS-0$
				evt.preventDefault();
				evt.stopPropagation();
			});
			// if we are rehooking listeners on a node, unhook old before hooking and remembering new
			if (persistAndReplace) {
				if (this._oldDragLeave) {
					node.removeEventListener("dragleave", this._oldDragLeave, false); //$NON-NLS-0$
				}
				this._oldDragLeave = dragLeave;
			}
			node.addEventListener("dragleave", dragLeave, false); //$NON-NLS-0$

			var dragEnter = dojo.hitch(this, function (evt) { //$NON-NLS-0$
				dojo.addClass(node, "dragOver"); //$NON-NLS-0$
				evt.preventDefault();
				evt.stopPropagation();
			});
			if (persistAndReplace) {
				if (this._oldDragEnter) {
					node.removeEventListener("dragenter", this._oldDragEnter, false); //$NON-NLS-0$
				}
				this._oldDragEnter = dragEnter;
			}
			node.addEventListener("dragenter", dragEnter, false); //$NON-NLS-0$

			// this listener is the same for any time, so we don't need to remove/rehook.
			var dragOver = function (evt) { //$NON-NLS-0$
				// default behavior is to not trigger a drop, so we override the default
				// behavior in order to enable drop.  
				evt.preventDefault();
				evt.stopPropagation();
			};
			if (persistAndReplace && !this._oldDragOver) {
				node.addEventListener("dragover", dragOver, false); //$NON-NLS-0$
				this._oldDragOver = dragOver;
			}

			var drop = dojo.hitch(this, function(evt) { //$NON-NLS-0$
				dojo.removeClass(node, "dragOver"); //$NON-NLS-0$
				// webkit supports testing for and traversing directories
				// http://wiki.whatwg.org/wiki/DragAndDropEntries
				if (evt.dataTransfer.items && evt.dataTransfer.items.length > 0) {
					for (var i=0; i<evt.dataTransfer.items.length; i++) {
						var entry = null;
						if (typeof evt.dataTransfer.items[i].getAsEntry === "function") { //$NON-NLS-0$
							entry = evt.dataTransfer.items[i].getAsEntry();
						} else if (typeof evt.dataTransfer.items[i].webkitGetAsEntry === "function") { //$NON-NLS-0$
							entry = evt.dataTransfer.items[i].webkitGetAsEntry();
						}
						if (entry) {
							dropFileEntry(entry, null, item, explorer, performDrop, this.fileClient);
						}
					}
				} else if (evt.dataTransfer.files && evt.dataTransfer.files.length > 0) {
					for (var i=0; i<evt.dataTransfer.files.length; i++) {
						var file = evt.dataTransfer.files[i];
						// this test is reverse engineered as a way to figure out when a file entry is a directory.
						// The File API in HTML5 doesn't specify a way to check explicitly (when this code was written).
						// see http://www.w3.org/TR/FileAPI/#file
						if (!file.length && (!file.type || file.type === "")) {
							this.registry.getService("orion.page.message").setProgressResult( //$NON-NLS-0$
								{Severity: "Error", Message: dojo.string.substitute(messages["Did not drop ${0}.  Folder drop is not supported in this browser."], [file.name])}); //$NON-NLS-1$ //$NON-NLS-0$ 
						} else if (item.Location.indexOf('/workspace') === 0){ //$NON-NLS-0$
							this.registry.getService("orion.page.message").setProgressResult({ //$NON-NLS-0$
								Severity: "Error", Message: messages["You cannot copy files directly into the workspace.  Create a folder first."]});	 //$NON-NLS-1$ //$NON-NLS-0$ 
						} else {
							performDrop(item, file, explorer, file.name.indexOf(".zip") === file.name.length-4 && window.confirm(dojo.string.substitute(messages["Unzip ${0}?"], [file.name]))); //$NON-NLS-1$ //$NON-NLS-0$ 
						}
					}
				}
				evt.preventDefault();
				evt.stopPropagation();
			});
			if (persistAndReplace) {
				if (this._oldDrop) {
					node.removeEventListener("drop", this._oldDrop, false); //$NON-NLS-0$
				}
				this._oldDrop = drop;
			}
			node.addEventListener("drop", drop, false); //$NON-NLS-0$
		}
	};
	
	// we have changed an item on the server at the specified parent node
	FileExplorer.prototype.changedItem = function(parent, forceExpand) {
		var that = this;
		this.fileClient.fetchChildren(parent.ChildrenLocation).then(function(children) {
			children = that.model.processParent(parent, children);
			//If a key board navigator is hooked up, we need to sync up the model
			if(that.getNavHandler()){
				//that._initSelModel();
			}
			dojo.hitch(that.myTree, that.myTree.refresh)(parent, children, forceExpand);
		});
	};
	
	FileExplorer.prototype.isExpanded = function(item) {
		var rowId = this.model.getId(item);
		return this.renderer.tableTree.isExpanded(rowId);
	};
		
	FileExplorer.prototype.getNameNode = function(item) {
		var rowId = this.model.getId(item);
		if (rowId) {
			// I know this from my renderer below.
			return dojo.byId(rowId+"NameLink"); //$NON-NLS-0$
		}
	};
		
	//This is an optional function for explorerNavHandler. It changes the href of the window.location to navigate to the parent page.
	//The explorerNavHandler hooked up by the explorer will check if this optional function exist and call it when left arrow key hits on a top level item that is aleady collapsed.
	FileExplorer.prototype.scopeUp = function(){
		if(this.treeRoot && this.treeRoot.Parents){
			if(this.treeRoot.Parents.length === 0){
				window.location.href = "#"; //$NON-NLS-0$
			} else if(this.treeRoot.Parents[0].ChildrenLocation){
				window.location.href = "#" + this.treeRoot.Parents[0].ChildrenLocation; //$NON-NLS-0$
			}
		}
	};
	
	/**
	 * Load the resource at the given path.
	 * @param path The path of the resource to load
	 * @param [force] If true, force reload even if the path is unchanged. Useful
	 * when the client knows the resource underlying the current path has changed.
	 * @param postLoad a function to call after loading the resource
	 */
	FileExplorer.prototype.loadResourceList = function(path, force, postLoad) {
		path = mFileUtils.makeRelative(path);
		if (!force && path === this._lastPath) {
			return;
		}
					
		this._lastPath = path;
		var parent = dojo.byId(this.parentId);			

		// we are refetching everything so clean up the root
		this.treeRoot = {};

		if (force || (path !== this.treeRoot.Path)) {
			//the tree root object has changed so we need to load the new one
			
			// Progress indicator
			var progress = dojo.byId("progress");  //$NON-NLS-0$
			if(!progress){
				progress = dojo.create("div", {id: "progress"}, parent, "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
			dojo.empty(progress);
			
			var progressTimeout = setTimeout(function() {
				dojo.empty(progress);
				var b = dojo.create("b"); //$NON-NLS-0$
				dojo.place(document.createTextNode(messages["Loading "]), progress, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				dojo.place(document.createTextNode(path), b, "last"); //$NON-NLS-0$
				dojo.place(b, progress, "last"); //$NON-NLS-0$
				dojo.place(document.createTextNode("..."), progress, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			}, 500); // wait 500ms before displaying
				
			this.treeRoot.Path = path;
			var self = this;
			
			this.fileClient.loadWorkspace(path).then(
				//do we really need hitch - could just refer to self rather than this
				dojo.hitch(self, function(loadedWorkspace) {
					clearTimeout(progressTimeout);
					//copy fields of resulting object into the tree root
					for (var i in loadedWorkspace) {
						this.treeRoot[i] = loadedWorkspace[i];
					}
					this.model = new Model(this.registry, this.treeRoot, this.fileClient, this.parentId, this.excludeFiles, this.excludeFolders);
					this.model.processParent(this.treeRoot, loadedWorkspace.Children);	
					if (typeof postLoad === "function") { //$NON-NLS-0$
						try {
							postLoad();
						} catch(e){
							if (this.registry) {
								this.registry.getService("orion.page.message").setErrorMessage(e);	 //$NON-NLS-0$
							}
						}
					}
					if (this.dragAndDrop) {
						if (this._hookedDrag) {
							// rehook on the parent to indicate the new root location
							this._makeDropTarget(this.treeRoot, parent, true);
						} else {
							// uses two different techniques from Modernizr
							// first ascertain that drag and drop in general is supported
							var supportsDragAndDrop = parent && (('draggable' in parent) || ('ondragstart' in parent && 'ondrop' in parent));  //$NON-NLS-2$  //$NON-NLS-1$  //$NON-NLS-0$ 
							// then check that file transfer is actually supported, since this is what we will be doing.
							// For example IE9 has drag and drop but not file transfer
							supportsDragAndDrop = supportsDragAndDrop && !!(window.File && window.FileList && window.FileReader);
							this._hookedDrag = true;
							if (supportsDragAndDrop) {
								this._makeDropTarget(this.treeRoot, parent, true);
							} else {
								this.dragAndDrop = null;
								window.console.log("Local file drag and drop is not supported in this browser."); //$NON-NLS-0$
							}
						}
					}

					this.createTree(this.parentId, this.model, {setFocus: true, selectionPolicy: this.renderer.selectionPolicy, onCollapse: function(model){if(self.getNavHandler()){self.getNavHandler().onCollapse(model);}}});
					// We only need to hook drag and drop up once
					if (typeof this.onchange === "function") { //$NON-NLS-0$
						this.onchange(this.treeRoot);
					}
				}),
				dojo.hitch(self, function(error) {
					clearTimeout(progressTimeout);
					// Show an error message when a problem happens during getting the workspace
					if (error.status && error.status !== 401){
						try {
							error = JSON.parse(error.responseText);
						} catch(e) {
						}
						dojo.place(document.createTextNode(messages["Sorry, an error occurred: "] + error.Message), progress, "only"); //$NON-NLS-1$
					} else {
						this.registry.getService("orion.page.message").setProgressResult(error); //$NON-NLS-0$
					}
				})
			);
		}
	};
	/**
	 * Clients can connect to this function to receive notification when the root item changes.
	 * @param {Object} item
	 */
	FileExplorer.prototype.onchange = function(item) {
	};
	FileExplorer.prototype.constructor = FileExplorer;

	//return module exports
	return {
		FileExplorer: FileExplorer
	};
});
