/*******************************************************************************
 * Copyright (c) 2009, 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse*/
/*jslint browser:true*/

dojo.require("dijit.Tree");
dojo.require("dijit.Menu");
dojo.require("dijit.MenuItem");
dojo.require("dijit._Widget");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.TitlePane");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojox.layout.ScrollPane");
dojo.require("widgets.ExplorerTree");

var eclipse = eclipse || {};
eclipse.ExplorerTree = (function() {
	/**
	 * @name eclipse.ExplorerTree
	 */
	function ExplorerTree(serviceRegistry, treeRoot, searcher, parentId, 
			/**dijit.Menu*/ contextMenu, /**dijit._Widget*/ newFileFolderMenu,
			makeFavoriteDomNode, deleteFilesDomNode, newFolderDomNode, newFileDomNode,
			newItemDialogProvider) {
		this.registry = serviceRegistry;
		this.treeRoot = treeRoot;
		this.searcher = searcher;
		this.parentId = parentId;
		
		this.contextMenu = contextMenu;
		this.newFileFolderMenu = newFileFolderMenu;
		this.makeFavoriteDomNode = makeFavoriteDomNode;
		
		this.deleteFilesDomNode = deleteFilesDomNode;
		this.newFolderDomNode = newFolderDomNode;
		this.newFileDomNode = newFileDomNode;
		
		this.newItemDialogProvider = newItemDialogProvider;
		
		this.model = null;
		this.myTree = null; /**{dijit.Widget}*/

		this._selectedItem = null;
		this._selectedNode = null;
		this._contextMenuNode = null;
		this._lastHash = null;
	}
	ExplorerTree.prototype = /**@lends eclipse.ExplorerTree.prototype*/ {
		selected : function(item, treeNode, event) {
			this._selectedItem = item;
			this._selectedNode = treeNode;
			if (item.Directory===false && item.Location) {
				this.registry.callService("IInputProvider", "setInput", null, [item.Location, event]);
	 		}
			
		},
	    getSelectedItem : function() {
	    	return this._selectedItem;
	    },
	    getCurrentContainerPath : function() {
	      if (this._selectedItem) {
	        if (this._selectedItem.file) {
	          return this._selectedItem.path.substring(0, this._selectedItem.path.length - this._selectedItem.name.length - 1);
	        }
	        return this._selectedItem.path;
	      }
	    },
		// we have changed an item on the server at the specified parent node
		changedItem: function(parent, /* optional */ children) {
			this.registry.callService("IFileService", "getChildren", null, [parent, dojo.hitch(this.model, this.model.onChildrenChange)]);
		},
	    makeFavorite: function() {
	    	if (this._contextMenuNode) {
	    		var items = this._contextMenuNode.attr("tree").getSelectedItems();
			this.registry.callService("IFavorites", "makeFavorites", null, [items]);
	    	}
	    },
	    removeResourceList: function() {
	  		if (this.myTree)
	  			this.myTree.destroyRecursive();
	  		// there may be something else, such as a progress div, occupying this space.
	  		// TODO kind of hokey that we use the same id
	  		var container = dojo.byId(this.parentId);
	  		var another = dojo.byId("myTree");
			if (another) {
	  			container.removeChild(another);
	  		}
	    },
		createProject: function(name, url) {
			this.registry.callService("IFileService", "createProject", null, [this.treeRoot.ChildrenLocation, name, url, 
							dojo.hitch(this, function() {this.changedItem(this.treeRoot);})]);
		},
		createFolder: function(name) {
			if (this._contextMenuNode) {
				var item = this._contextMenuNode.item;
				this.registry.callService("IFileService", "createFolder", null, [name, item, dojo.hitch(this, this.changedItem)]);
			}
		},
		createFile: function(name) {
			if (this._contextMenuNode) {
				var item = this._contextMenuNode.item;
				this.registry.callService("IFileService", "createFile", null, [name, item, dojo.hitch(this, this.changedItem)]);
			}
		},
		
		deleteFiles: function() {
			if (this._contextMenuNode) {
				var items = this._contextMenuNode.get("tree").getSelectedItems();
				if (items.length < 1) {
					return;
				}
				var confirmMessage = items.length === 1 ? "Are you sure you want to delete '" + items[0].Name + "'?" : "Are you sure you want to delete these " + items.length + " items?";
				this.registry.callService("IDialogService", "confirm", null, [confirmMessage, new function(doit) {
					if (!doit)
						return;
					for (var i=0; i < items.length; i++) {
						var item = items[i];
						if (item.parent.Path === "") {
							this.registry.callService("IFileService", "removeProject", null, [item.parent /*workspace*/, item /*project*/, 
								dojo.hitch(this, function() { this.changedItem(this.treeRoot); })]);
						} else {
							this.registry.callService("IFileService", "deleteFile", null, [item, dojo.hitch(this, this.changedItem)]);
						}
					}
				}]);
			}
		},
	    // TODO right now we blow away the tree because we might be replacing it
	    // with a search div.  We could optimize by detecting when we go tree to tree
	    // and simply update the model.
	    loadResourceList: function(path) {
	    	path = eclipse.util.makeRelative(path);
	       	if (path == this._lastHash)
	    		return;
	    	this._lastHash = path;
	    	dojo.hash(path, true);
	    	var container = dojo.byId(this.parentId);
	  		// Progress indicator
	  		var progress = document.createElement('div');
	  		progress.innerHTML = "Loading <b>" + path + "</b>...";
	  		progress.id = "myTree";
	  		this.removeResourceList();
	  		dojo.place(progress, container, "only");
	  		// we are refetching everything so clean up the root
	  		this.treeRoot = {}
	  		
	  		//TODO we need a reliable way to infer search from the path
	  		var isSearch = path.indexOf("search?") > 0;
	  		if (isSearch) {
	  		  	var results = document.createElement('div');
	 	 		results.id = "myTree";
	 	 		
	  			this.searcher.search(results, path, null, true); // true means generate a "save search" link and header
	  			//fall through and set the tree root to be the workspace root
	  			path ="";
	  			dojo.place(results, container, "only");
	  		}
	  		if (path != this.treeRoot.Path) {
	  			//the tree root object has changed so we need to load the new one
	  			this.treeRoot.Path = path;
	  			this.registry.callService("IFileService", "loadWorkspace", null, [path,
	  					dojo.hitch(this, function(loadedWorkspace) {
	  						//copy fields of resulting object into the tree root
	  						for (var i  in loadedWorkspace) {
	  							this.treeRoot[i] = loadedWorkspace[i];
	  						}
	  						if (!isSearch) {
	  							this.registry.callService("IFileService", "getChildren", null, [this.treeRoot, 
			  							dojo.hitch(this, function(parent, children) {
			  								new eclipse.BreadCrumbs({container: this.parentId, resource: parent});
			  								this.createTree();
			  							})]); 
	  						}})]);
	 		}
	    },
		createTree: function(){
			this.model = new eclipse.TreeModel(this.registry, this.treeRoot);
			
			// remove any existing tree or other DOM element occupying that space
			this.removeResourceList();

			this.myTree = new widgets.ExplorerTree({
				id: "myTree",
				model: this.model,
				showRoot: false,
				persist: false,
				openOnClick: true,
				getLabel: function(item) {
					return item.Name;
				},
				getIconClass: function(/* dojo.data.Item */ item, /* Boolean */ opened){
					if (item.Directory != false) {
						return "folderItem";
					}
					return "fileItem";
				},
				getFollowClass: function(/*dojo.data.Item*/ item, /*Boolean*/ opened) {
					if (!item.Directory) {
						return "followFile";
					}
				},
				updateFollowLink: function(/*dojo.data.Item*/ item, /*HTMLLinkElement*/ link) {
					link.href = "/coding.html#" + item.Location;
				}
//				onFollowClick: function(/* dojo.data */ item, /*TreeNode*/ node, /*Event*/ evt) {
//					this.selected(item, node, event);
//				}
			});
			this.myTree.startup();
			var container = dojo.byId(this.parentId);
			container.appendChild(this.myTree.domNode);
			if (this.contextMenu) {
				// Hook up listeners to MenuItems
				var explorer = this;
				this.makeFavoriteDomNode.onclick = function(evt) { explorer.makeFavorite(); };
				this.deleteFilesDomNode.onclick = function(evt) { explorer.deleteFiles(); };
				this.newFolderDomNode.onclick = function(evt) {
						explorer.newItemDialogProvider.show('Create Folder', 'Folder name:', function() { explorer.createFolder(); });
					};
				this.newFileDomNode.onclick = function(evt) {
						explorer.newItemDialogProvider.show('Create File', 'File name:', function() { explorer.createFile(); });
					};
				
				this.contextMenu.bindDomNode(this.myTree.domNode);
				// establish which item the menu applies to
				dojo.connect(this.contextMenu, "_openMyself", this, function(event) {
					var treeNode = dijit.getEnclosingWidget(event.target);
					var tree = treeNode.get("tree");
					var selectedNodes = tree._getSelectedNodes();
					if (dojo.indexOf(selectedNodes, treeNode) === -1) {
						// change selection to match where menu appears
						tree._selectNode(treeNode);
						selectedNodes = tree._getSelectedNodes();
					}
					this._contextMenuNode = treeNode;
					if(selectedNodes.length === 1 && treeNode.item.Directory){
						dojo.style(this.newFileFolderMenu.domNode, "display", "");
					}else{
						dojo.style(this.newFileFolderMenu.domNode, "display", "none");
					}
				});
			}
		}
	};
	return ExplorerTree;
})();

eclipse.TreeModel = (function() {
	/**
	 * @name eclipse.TreeModel
	 * @class Tree model used by eclipse.ExplorerTree.
	 * TODO Consolidate with eclipse.Model.
	 */
	function TreeModel(serviceRegistry, root) {
		this.registry = serviceRegistry;
		this.root = root;
	}
	TreeModel.prototype = {
		destroy: function(){
		},
		getRoot: function(onItem){
			onItem(this.root);
		},
		mayHaveChildren: function(/* dojo.data.Item */ item){
			return item.Directory != false;
		},
		getChildren: function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
			// the root already has the children fetched
			if (parentItem.children) {
				onComplete(parentItem.children);
			} else if (parentItem.Directory!==undefined && parentItem.Directory===false) {
				onComplete([]);
			} else if (parentItem.Location) {
				this.registry.callService("IFileService", "getChildren", null, [parentItem, 
						function(parent, children) { onComplete(children); }]);
			} else {
				onComplete([]);
			}
		},
		getIdentity: function(/* item */ item){
			var result;
			if (item.Name) {
				result = item.Location;
			} else {
				result = "ROOT";
			}
			return result;
		},
		getLabel: function(/* dojo.data.Item */ item){
			return item.Name;
		},
		onChildrenChange: function(/* dojo.data.Item */ parent, /* dojo.data.Item[] */ newChildrenList) {
			// No implementation is necessary, this method is here so client code
			// can connect to it
		}
	};
	return TreeModel;
})();

