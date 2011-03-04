/*******************************************************************************
 * Copyright (c) 2009, 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dijit dojo eclipse:true widgets*/
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
dojo.require("widgets.ExplorerTree");
dojo.require("widgets.NewItemDialog");

var eclipse = eclipse || {};
eclipse.ExplorerTree = (function() {
	/**
	 * @name eclipse.ExplorerTree
	 */
	function ExplorerTree(serviceRegistry, treeRoot, searcher, fileClient, parentId, toolbarId,
			/**dijit.Menu*/ contextMenu) {
		this.registry = serviceRegistry;
		this.treeRoot = treeRoot;
		this.searcher = searcher;
		this.fileClient = fileClient;
		this.parentId = parentId;
		this.toolbarId = toolbarId;
		
		this.contextMenu = contextMenu;		
		this.model = null;
		this.myTree = null; /**{dijit.Widget}*/

		this._selectedItem = null;
		this._selectedNode = null;
		this._lastHash = null;
	}
	ExplorerTree.prototype = /**@lends eclipse.ExplorerTree.prototype*/ {
		selected : function(item, treeNode, event) {
			this._selectedItem = item;
			this._selectedNode = treeNode;
			if (item.Directory===false && item.Location) {
				this.registry.getService("IInputProvider").then(function(service) {
					service.setInput(item.Location, event);
				});
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
		changedItem: function(parent) {
			var self = this;
			this.fileClient.fetchChildren(parent.ChildrenLocation).then(function(children) {
				eclipse.util.processNavigatorParent(parent, children);
				dojo.hitch(self.model, self.model.onChildrenChange)(parent, children);
			});
		},
		removeResourceList: function() {
			if (this.myTree) {
				this.myTree.destroyRecursive();
			}
			// there may be something else, such as a progress div, occupying this space.
			// TODO kind of hokey that we use the same id
			var container = dojo.byId(this.parentId);
			var another = dojo.byId("myTree");
				if (another) {
				container.removeChild(another);
			}
		},
		

		// TODO right now we blow away the tree because we might be replacing it
		// with a search div.  We could optimize by detecting when we go tree to tree
		// and simply update the model.
		loadResourceList: function(path) {
			path = eclipse.util.makeRelative(path);
			if (path === this._lastHash) {
				return;
			}
			
			this._lastHash = path;
			dojo.hash(path, true);
			
			var container = dojo.byId(this.parentId);
			// Progress indicator
			var progress = document.createElement('div');
			
			dojo.place(document.createTextNode("Loading "), progress);
			var b = dojo.create("b", null, progress);
			dojo.place(document.createTextNode(path), b);
			dojo.place(document.createTextNode("..."), progress);
			
			progress.id = "myTree";
			this.removeResourceList();
			dojo.place(progress, container, "only");
			// we are refetching everything so clean up the root
			this.treeRoot = {};
			
			if (path != this.treeRoot.Path) {
				//the tree root object has changed so we need to load the new one
				this.treeRoot.Path = path;
				var self = this;
				this.fileClient.loadWorkspace(path).then(
					dojo.hitch(self, function(loadedWorkspace) {
						//copy fields of resulting object into the tree root
						for (var i in loadedWorkspace) {
							this.treeRoot[i] = loadedWorkspace[i];
						}
						eclipse.util.processNavigatorParent(this.treeRoot, loadedWorkspace.Children);
						new eclipse.BreadCrumbs({container: this.parentId, resource: this.treeRoot});
						eclipse.fileCommandUtils.updateNavTools(this.registry, this, this.parentId, this.toolbarId, this.treeRoot);
						this.createTree();
					}));
			}
		},
		createTree: function(){
			this.model = new eclipse.TreeModel(this.registry, this.treeRoot, this.fileClient);
			
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
				var contextMenu = this.contextMenu;
				contextMenu.bindDomNode(this.myTree.domNode);
				// establish which item the menu applies to
				dojo.connect(contextMenu, "_openMyself", this, function(event) {
					// see http://bugs.dojotoolkit.org/ticket/10296
					contextMenu.focusedChild = null;
					dojo.forEach(contextMenu.getChildren(), function(child) {
						contextMenu.removeChild(child);
						child.destroy();
					});
					var treeNode = dijit.getEnclosingWidget(event.target);
					var tree = treeNode.get("tree");
					var selectedNodes = tree._getSelectedNodes();
					if (dojo.indexOf(selectedNodes, treeNode) === -1) {
						// change selection to match where menu appears
						tree._selectNode(treeNode);
					}
					// contact the command service to render appropriate commands here.
					this.registry.getService("ICommandService").then(function(service) {
						service.renderCommands(contextMenu, "object", tree.getSelectedItems(), this, "menu");
					});
				});
			}
		},
		updateCommands: function(){
			//commands build dynamically, no need to refresh
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
	function TreeModel(serviceRegistry, root, fileClient) {
		this.registry = serviceRegistry;
		this.root = root;
		this.fileClient = fileClient;
	}
	TreeModel.prototype = {
		destroy: function(){
		},
		getRoot: function(onItem){
			onItem(this.root);
		},
		mayHaveChildren: function(/* dojo.data.Item */ item){
			return item.Directory !== false;
		},
		getChildren: function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
			// the parent item may already have the children fetched
			if (parentItem.children) {
				onComplete(parentItem.children);
			} else if (parentItem.Directory!==undefined && parentItem.Directory===false) {
				onComplete([]);
			} else if (parentItem.Location) {
				this.fileClient.fetchChildren(parentItem.ChildrenLocation).then(
					dojo.hitch(this, function(children) {
						eclipse.util.processNavigatorParent(parentItem, children);
						onComplete(children);
					}));
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

