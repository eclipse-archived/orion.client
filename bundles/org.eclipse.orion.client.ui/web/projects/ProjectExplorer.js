/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define window orion document */
/*jslint browser:true */

define(['i18n!orion/widgets/nls/messages', 'orion/explorers/explorer-table', 'orion/webui/littlelib', 'orion/fileUtils', 'orion/explorers/explorer'], 
function(messages, mExplorerTable, lib, mFileUtils, mExplorer) {


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
		
	Model.prototype.getChildren = function(parentItem, /* function(items) */ onComplete){
		var self = this;
		// the parent already has the children fetched
		if (parentItem.children) {
			onComplete(parentItem.children);
		} else if (parentItem.Directory!==undefined && parentItem.Directory===false) {
			onComplete([]);
		} else if (parentItem.Location) {
			var progress = this.registry.getService("orion.page.progress");
			progress.progress(this.fileClient.fetchChildren(parentItem.ChildrenLocation), "Fetching children of " + parentItem.Name).then( 
				function(children) {
					onComplete(self.processParent(parentItem, children));
				}
			);
		} else {
			onComplete([]);
		}
	};
	Model.prototype.constructor = Model;

	function ProjectExplorer(){
		mExplorerTable.FileExplorer.apply( this, arguments );
	}
	
	ProjectExplorer.prototype = Object.create( mExplorerTable.FileExplorer.prototype ); 
	
	ProjectExplorer.prototype.loadResourceList = function(path, force, postLoad) {
		path = mFileUtils.makeRelative(path);
		if (!force && path === this._lastPath) {
			return;
		}
					
		this._lastPath = path;
		var parent = lib.node(this.parentId);			

		// we are refetching everything so clean up the root
		this.treeRoot = {Name: "Orion Content", ChildrenLocation: ""};

		if (force || (path !== this.treeRoot.Path)) {
			//the tree root object has changed so we need to load the new one
			
			// Progress indicator
			var progress = lib.node("progress");  //$NON-NLS-0$
			if(!progress){
				progress = document.createElement("div"); //$NON-NLS-0$
				progress.id = "progress"; //$NON-NLS-0$
				lib.empty(parent);
				parent.appendChild(progress);
			}
			lib.empty(progress);
			
			var progressTimeout = setTimeout(function() {
				lib.empty(progress);
				var b = document.createElement("b"); //$NON-NLS-0$
				progress.appendChild(document.createTextNode(messages["Loading "]));
				b.appendChild(document.createTextNode(path));
				progress.appendChild(b);
				progress.appendChild(document.createTextNode("..."));
			}, 500); // wait 500ms before displaying
				
			this.treeRoot.Path = path;
			var self = this;
			
			(this.registry ? this.registry.getService("orion.page.progress").progress(this.fileClient.loadWorkspace(path), "Loading workspace " + path) : this.fileClient.loadWorkspace(path)).then(
				function(loadedWorkspace) {
					clearTimeout(progressTimeout);
					//copy fields of resulting object into the tree root
					for (var i in loadedWorkspace) {
						self.treeRoot[i] = loadedWorkspace[i];
					}
					self.model = new Model(self.registry, self.treeRoot, self.fileClient, self.parentId, self.excludeFiles, self.excludeFolders);
					self.model.processParent(self.treeRoot, loadedWorkspace.Children);	
					if (typeof postLoad === "function") { //$NON-NLS-0$
						try {
							postLoad();
						} catch(e){
							if (self.registry) {
								self.registry.getService("orion.page.message").setErrorMessage(e);	 //$NON-NLS-0$
							}
						}
					}
					if (self.dragAndDrop) {
						if (self._hookedDrag) {
							// rehook on the parent to indicate the new root location
							self._makeDropTarget(self.treeRoot, parent, true);
						} else {
							// uses two different techniques from Modernizr
							// first ascertain that drag and drop in general is supported
							var supportsDragAndDrop = parent && (('draggable' in parent) || ('ondragstart' in parent && 'ondrop' in parent));  //$NON-NLS-2$  //$NON-NLS-1$  //$NON-NLS-0$ 
							// then check that file transfer is actually supported, since this is what we will be doing.
							// For example IE9 has drag and drop but not file transfer
							supportsDragAndDrop = supportsDragAndDrop && !!(window.File && window.FileList && window.FileReader);
							self._hookedDrag = true;
							if (supportsDragAndDrop) {
								self._makeDropTarget(self.treeRoot, parent, true);
							} else {
								self.dragAndDrop = null;
								window.console.log("Local file drag and drop is not supported in this browser."); //$NON-NLS-0$
							}
						}
					}

					self.createTree( 	self.parentId, 
										self.model, 
										{	setFocus: true, 
											selectionPolicy: self.renderer.selectionPolicy, 
											showRoot: true,
											onCollapse: 
											function(model){
												if( self.getNavHandler() ){
													self.getNavHandler().onCollapse(model);
												}
											}
										} );
										
					// We only need to hook drag and drop up once
					if (typeof self.onchange === "function") { //$NON-NLS-0$
						self.onchange(self.treeRoot);
					}
				},
				function(error) {
					clearTimeout(progressTimeout);
					// Show an error message when a problem happens during getting the workspace
					if (error.status && error.status !== 401){
						try {
							error = JSON.parse(error.responseText);
						} catch(e) {
						}
						lib.empty(progress);
						progress.appendChild(document.createTextNode(messages["Sorry, an error occurred: "] + error.Message)); 
					} else {
						self.registry.getService("orion.page.message").setProgressResult(error); //$NON-NLS-0$
					}
				}
			);
		}
	};
	
	return ProjectExplorer;
});