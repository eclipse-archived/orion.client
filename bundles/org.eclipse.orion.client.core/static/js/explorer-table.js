/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse:true widgets*/
/*jslint regexp:false browser:true forin:true*/

var eclipse = eclipse || {};
eclipse.Explorer = (function() {
	/**
	 * @name eclipse.Explorer
	 * @class A table-based explorer component
	 */
	function Explorer(serviceRegistry, treeRoot, searcher, fileClient, parentId, pageTitleId, toolbarId, selectionToolsId) {
		this.registry = serviceRegistry;
		this.treeRoot = treeRoot;
		this.searcher = searcher;
		this.fileClient = fileClient;
		this.parentId = parentId;
		this.pageTitleId = pageTitleId;
		this.toolbarId = toolbarId;
		this.selectionToolsId = selectionToolsId;
		this.model = null;
		this.myTree = null;
	}
	Explorer.prototype = /** @lends eclipse.Explorer.prototype */ {
		// we have changed an item on the server at the specified parent node
		changedItem: function(parent) {
			var self = this;
			this.fileClient.fetchChildren(parent.ChildrenLocation).then(function(children) {
				eclipse.util.processNavigatorParent(parent, children);
				dojo.hitch(self.myTree, self.myTree.refreshAndExpand)(parent, children);
			});
		},
						
		loadResourceList: function(path) {
			// console.log("loadResourceList old " + this._lastHash + " new " + path);
			path = eclipse.util.makeRelative(path);
			if (path === this._lastHash) {
				return;
			}
						
			this._lastHash = path;
			dojo.hash(path, true);
			var parent = dojo.byId(this.parentId);

			// Progress indicator
			var progress = dojo.byId("progress"); 
			if(!progress){
				progress = dojo.create("div", {id: "progress"}, parent, "only");
			}
			dojo.empty(progress);
			b = dojo.create("b");
			dojo.place(document.createTextNode("Loading "), progress, "last");
			dojo.place(document.createTextNode(path), b, "last");
			dojo.place(b, progress, "last");
			dojo.place(document.createTextNode("..."), progress, "last");
			

			// we are refetching everything so clean up the root
			this.treeRoot = {};
	
			if (path !== this.treeRoot.Path) {
				//the tree root object has changed so we need to load the new one
				this.treeRoot.Path = path;
				var self = this;
				this.fileClient.loadWorkspace(path).then(
					//do we really need hitch - could just refer to self rather than this
					dojo.hitch(self, function(loadedWorkspace) {
						//copy fields of resulting object into the tree root
						for (var i  in loadedWorkspace) {
							this.treeRoot[i] = loadedWorkspace[i];
						}
						eclipse.util.processNavigatorParent(this.treeRoot, loadedWorkspace.Children);
						// erase any old page title
						var pageTitle = dojo.byId(this.pageTitleId);
						if (pageTitle) {
							dojo.empty(pageTitle);
							new eclipse.BreadCrumbs({container: pageTitle, resource: this.treeRoot});
						}
						eclipse.fileCommandUtils.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, this.treeRoot);
						this.createTree();
					}),
					dojo.hitch(self, function(error) {
						// Show an error message when a problem happens during getting the workspace
						if (error.status !== null && error.status !== 401){
							dojo.place(document.createTextNode("Sorry, an error occurred: " + error.message), progress, "only");
						}
					})
				);
			}
		},

		updateCommands: function(item){
			// update the commands in the tree if the tree exists.
			if (this.myTree) {
				dojo.hitch(this.myTree._renderer, this.myTree._renderer.updateCommands(item));
			}
		},
		createTree: function (){
			var treeId = this.parentId+"innerTree";
			var existing = dojo.byId(treeId);
			if (existing) {
				dojo.destroy(existing);
			}
			dojo.empty(this.parentId);
			this.model = new eclipse.Model(this.registry, this.treeRoot, this.fileClient, treeId);
			this.myTree = new eclipse.TableTree({
				id: treeId,
				model: this.model,
				showRoot: false,
				parent: this.parentId,
				labelColumnIndex: 1,  // 0 if no checkboxes
				renderer: new eclipse.FileRenderer({checkbox: true }, this)
			});
		},
	    
	    _lastHash: null
	};
	return Explorer;
}());

eclipse = eclipse || {};
eclipse.Model = (function() {
	/**
	 * @name eclipse.Model
	 * @class Tree model used by eclipse.Explorer.
	 * TODO: Consolidate with eclipse.TreeModel.
	 */
	function Model(serviceRegistry, root, fileClient, treeId) {
		this.registry = serviceRegistry;
		this.root = root;
		this.fileClient = fileClient;
		this.treeId = treeId;
	}
	Model.prototype = {
		destroy: function(){
		},
		getRoot: function(onItem){
			onItem(this.root);
		},
		getChildren: function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
			// the parent already has the children fetched
			if (parentItem.children) {
				onComplete(parentItem.children);
			} else if (parentItem.Directory!==undefined && parentItem.Directory===false) {
				onComplete([]);
			} else if (parentItem.Location) {
				this.fileClient.fetchChildren(parentItem.ChildrenLocation).then( 
					dojo.hitch(this, function(children) {
						eclipse.util.processNavigatorParent(parentItem, children);
						onComplete(children);
					})
				);
			} else {
				onComplete([]);
			}
		},
		getId: function(/* item */ item){
			var result;
			if (item === this.root) {
				result = this.treeId;
			} else {
				result = item.Location;
				// remove all non valid chars to make a dom id. 
				result = result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
			} 
			return result;
		}
	};
	return Model;
}());

/********* Rendering json items into columns in the tree **************/
eclipse = eclipse || {};
eclipse.FileRenderer = (function() {
	function FileRenderer (options, explorer) {
		this._init(options);
		this.explorer = explorer;
	}
	FileRenderer.prototype = {
		initTable: function (tableNode, tableTree) {
			this.tableTree = tableTree;
			
			dojo.addClass(tableNode, 'treetable');
			var thead = document.createElement('thead');
			var row = document.createElement('tr');
			dojo.addClass(thead, "navTableHeading");
			var th, actions, size;
			if (this._useCheckboxSelection) {
				th = document.createElement('th');
				row.appendChild(th);
			}
			th = document.createElement('th');
			th.innerHTML = "<h2>Name</h2>";
			dojo.addClass(th, "navColumn");
			row.appendChild(th);

			actions= document.createElement('th');
			actions.innerHTML = "<h2>Actions</h2>";
			dojo.addClass(actions, "navColumn");
			row.appendChild(actions);

			th = document.createElement('th');
			th.innerHTML = "<h2>Date</h2>";
			dojo.addClass(th, "navColumn");
			row.appendChild(th);

			size= document.createElement('th');
			size.innerHTML = "<h2>Size</h2>";
			dojo.addClass(size, "navColumn");
			row.appendChild(size);
			
			thead.appendChild(row);
			tableNode.appendChild(thead);
			
			dojo.style(size, "textAlign", "right");

		},
		
		render: function(item, tableRow) {
			tableRow.cellSpacing = "8px";
			dojo.style(tableRow, "verticalAlign", "baseline");
			dojo.addClass(tableRow, "treeTableRow");
			dojo.connect(tableRow, "onmouseover", tableRow, function() {
				var actionsColumn = dojo.byId(this.id+"actionswrapper");
				dojo.style(actionsColumn, "visibility", "visible");
			});
			dojo.connect(tableRow, "onmouseout", tableRow, function() {
				var actionsColumn = dojo.byId(this.id+"actionswrapper");
				dojo.style(actionsColumn, "visibility", "hidden");
			});
			if (this._useCheckboxSelection) {
				var checkColumn = document.createElement('td');
				var check = document.createElement('input');
				check.type = "checkbox";
				check.id = tableRow+"selectedState";
				dojo.addClass(check, "selectionCheckmark");
				check.itemId = tableRow.id;
				checkColumn.appendChild(check);
				tableRow.appendChild(checkColumn);
				
				dojo.connect(check, "onclick", dojo.hitch(this, function(evt) {
					dojo.toggleClass(tableRow, "checkedRow", !!evt.target.checked);
					this.explorer.registry.getService("ISelectionService").then(dojo.hitch(this, function(service) {
						service._setSelection(this.getSelected());
					}));				
				}));
			}
			var col, div, link;
			if (item.Directory) {
				col = document.createElement('td');
				tableRow.appendChild(col);
				var nameId =  tableRow.id + "__expand";
				div = dojo.create("div", null, col, "only");
				var expandImg = dojo.create("img", {src: "/images/collapsed-gray.png", name: nameId}, div, "last");
				dojo.create("img", {src: "/images/fldr_obj.gif"}, div, "last");
				link = dojo.create("a", {className: "navlinkonpage", href: "#" + item.ChildrenLocation}, div, "last");
				dojo.place(document.createTextNode(item.Name), link, "only");
				expandImg.onclick = dojo.hitch(this, function(evt) {
					this.tableTree.toggle(tableRow.id, nameId, '/images/expanded-gray.png', '/images/collapsed-gray.png');
				});
			} else {
				col = document.createElement('td');
				tableRow.appendChild(col);
				// only go to the coding page for things we know how to edit.  This way we can still view images, etc.
				var splits = item.Location.split(".");
				var href = item.Location;
				if (splits.length > 0) {
					var extension = splits.pop().toLowerCase();
					// we should really start thinking about editor lookup
					switch(extension) {
							case "js":
							case "java":
							case "html":
							case "xml":
							case "css":
							case "txt":
								href = "/coding.html#" + item.Location;
								break;
					}
				}
				div = dojo.create("div", null, col, "only");
				dojo.create("img", {src: "/images/none.png"}, div, "last");
				dojo.create("img", {src: "/images/file_obj.gif"}, div, "last");
				link = dojo.create("a", {className: "navlink", href: href}, div, "last");
				dojo.place(document.createTextNode(item.Name), link, "only");
			}
			
			var actionsColumn = document.createElement('td');
			actionsColumn.id = tableRow.id + "actions";
			tableRow.appendChild(actionsColumn);
			var actionsWrapper = document.createElement('span');
			actionsWrapper.id = tableRow.id + "actionswrapper";
			actionsColumn.appendChild(actionsWrapper);
			dojo.style(actionsWrapper, "visibility", "hidden");
			// contact the command service to render appropriate commands here.
			this.explorer.registry.getService("ICommandService").then(function(service) {
				service.renderCommands(actionsWrapper, "object", item, this.explorer, "image");
			});

			var dateColumn = document.createElement('td');
			tableRow.appendChild(dateColumn);
			if (item.LocalTimeStamp) {
				dateColumn.innerHTML = new Date(item.LocalTimeStamp).toLocaleDateString();
			}
			dojo.addClass(dateColumn, 'secondaryColumn');
			
			var sizeColumn = document.createElement('td');
			tableRow.appendChild(sizeColumn);
			if (!item.Directory && typeof item.Length === "number") {
				var length = parseInt(item.Length, 10),
					kb = length / 1024,
					mb = length / 1048576,
					label = "";
				if (kb < 1) {
					label = length + " bytes";
				} else if (mb < 1) {
					label = Math.floor(kb * 100)/100 + " KB";
				} else {
					label = Math.floor(mb * 100)/100 + " MB";
				}
				sizeColumn.innerHTML = label;
			}
			dojo.style(sizeColumn, "textAlign", "right");
			dojo.addClass(sizeColumn, 'secondaryColumn');
		},
		
		getSelected: function() {
			var selected = [];
			dojo.query(".selectionCheckmark").forEach(dojo.hitch(this, function(node) {
				if (node.checked) {
					var row = node.parentNode.parentNode;
					selected.push(this.tableTree.getItem(row));
				}
			}));
			return selected;
		},
		
		rowsChanged: function() {
			dojo.query(".treeTableRow").forEach(function(node, i) {
				if (i % 2) {
					dojo.addClass(node, "darkTreeTableRow");
					dojo.removeClass(node, "lightTreeTableRow");
				} else {
					dojo.addClass(node, "lightTreeTableRow");
					dojo.removeClass(node, "darkTreeTableRow");
				}
			});
			// update the selections so that any checked rows that may no longer be around are not
			// remembered.  This is a temporary solution, 
			// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=339450
			this.explorer.registry.getService("ISelectionService").then(dojo.hitch(this,
				function(selService) {
					selService._setSelection(this.getSelected());
				}));
		},
		updateCommands: function(){
			var registry = this.explorer.registry;
			dojo.query(".treeTableRow").forEach(function(node, i) {
				
				var actionsWrapperId = node.id + "actionswrapper";
				var actionsWrapper = dojo.byId(actionsWrapperId);
				
				dojo.empty(actionsWrapper);
				// contact the command service to render appropriate commands here.
				registry.getService("ICommandService").then(function(service) {
					service.renderCommands(actionsWrapper, "object", node._item, this.explorer, "image");
				});

			});
		},
		
		_init: function(options) {
			if (options) {
				this._useCheckboxSelection = options.checkbox === undefined ? false : options.checkbox;
			}
		}
	};
	return FileRenderer;
}());



