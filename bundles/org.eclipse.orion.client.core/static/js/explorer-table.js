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
	function Explorer(serviceRegistry, treeRoot, searcher, parentId, toolbarId) {
		this.registry = serviceRegistry;
		this.treeRoot = treeRoot;
		this.searcher = searcher;
		this.parentId = parentId;
		this.innerId = parentId+"inner";
		this.toolbarId = toolbarId;
		this.model = null;
		this.myTree = null;
	}
	Explorer.prototype = /** @lends eclipse.Explorer.prototype */ {
		// we have changed an item on the server at the specified parent node
		changedItem: function(parent, /* optional */ children) {
			var self = this;
			this.registry.getService("IFileService").then(function(service) {
				service.getChildren(parent, dojo.hitch(self.myTree, self.myTree.refreshAndExpand));
			});
		},
				
		removeResourceList: function() {
			var container = dojo.byId(this.innerId);
			if (container) {
				dojo.empty(container);
			}
		},
		
		loadResourceList: function(path) {
			// console.log("loadResourceList old " + this._lastHash + " new " + path);
			path = eclipse.util.makeRelative(path);
			if (path === this._lastHash) {
				return;
			}
			
			//TODO we need a reliable way to infer search from the path
			var isSearch = path.indexOf("search?") > 0;
			
			this._lastHash = path;
			dojo.hash(path, !isSearch);
			// empty the inner area (progress, breadcrumbs, etc.)
			this.removeResourceList();
			var parent = dojo.byId(this.parentId);

			// Progress indicator
			var inner = dojo.byId(this.innerId);
			if (!inner) {
				inner= dojo.create("div", {id: this.innerId}, parent);
			}
			var progress = dojo.create("div", {id: this.innerId+"progress"}, progress);
			b = dojo.create("b");
			dojo.place(document.createTextNode("Loading "), progress, "last");
			dojo.place(document.createTextNode("..."), progress, "last");
			dojo.place(document.createTextNode(path), b, "last");

			// we are refetching everything so clean up the root
			this.treeRoot = {};
	
			if (isSearch) {
				var results = dojo.create("div", null, inner);
				this.searcher.search(results, path, null, true); // true means generate a "save search" link and heading
				//fall through and set the tree root to be the workspace root
				path ="";
				dojo.place(results, inner, "only");
			}
			if (path !== this.treeRoot.Path) {
				//the tree root object has changed so we need to load the new one
				this.treeRoot.Path = path;
				var self = this;
					this.registry.getService("IFileService").then(function(service) {
						service.loadWorkspace(path,
							dojo.hitch(self, function(loadedWorkspace) {
								// Show an error message when a problem happens during getting the workspace
								// Don't show the error for 401 since the login dialog is shown anyway
								if (loadedWorkspace.status != null && loadedWorkspace.status != 401){
									dojo.place(document.createTextNode("Sorry, an error ocurred: " + loadedWorkspace.message), progress, "only");
									return;
								}
								//copy fields of resulting object into the tree root
								for (var i  in loadedWorkspace) {
									this.treeRoot[i] = loadedWorkspace[i];
								}
								eclipse.util.processNavigatorParent(this.treeRoot, loadedWorkspace);
								if (!isSearch) {
									dojo.empty(inner);
									new eclipse.BreadCrumbs({container: this.innerId, resource: this.treeRoot});
									this.updateNavTools(this.innerId, this.toolbarId, this.treeRoot);
									this.createTree();
								}
							}));
					});
			}
		},
		
		createTree: function (){
			this.model = new eclipse.Model(this.registry, this.treeRoot);
			this.myTree = new eclipse.TableTree({
				id: "innerTree",
				model: this.model,
				showRoot: false,
				parent: this.innerId,
				labelColumnIndex: 1,  // 0 if no checkboxes
				renderer: new eclipse.FileRenderer({checkbox: true }, this)
			});
		},
		
		updateNavTools: function(parentId, toolbarId, item) {
			var parent = dojo.byId(parentId);
			var toolbar = dojo.byId(toolbarId);
			if (toolbar) {
				dojo.empty(toolbar);
			} else {
				toolbar = dojo.create("div",{id: toolbarId}, parent, "last");
				dojo.addClass(toolbar, "domCommandToolbar");
			}
			this.registry.getService("ICommandService").then(dojo.hitch(this, function(service) {
				service.renderCommands(toolbar, "dom", item, this, "image");
			}));

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
	function Model(serviceRegistry, root) {
		this.registry = serviceRegistry;
		this.root = root;
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
				this.registry.getService("IFileService").then(function(service) {
					service.getChildren(parentItem, 
						dojo.hitch(this, function(parent, children) {
							onComplete(children);
						}));
				});
			} else {
				onComplete([]);
			}
		},
		getId: function(/* item */ item){
			var result;
			if (item === this.root) {
				result = "innerTree";
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
			var th, actions, size;
			if (this._useCheckboxSelection) {
				th = document.createElement('th');
				row.appendChild(th);
			}
			th = document.createElement('th');
			th.innerHTML = "Name";
			row.appendChild(th);

			actions= document.createElement('th');
			actions.innerHTML = "Actions";
			row.appendChild(actions);

			th = document.createElement('th');
			th.innerHTML = "Date";
			row.appendChild(th);

			size= document.createElement('th');
			size.innerHTML = "Size";
			row.appendChild(size);
			
			thead.appendChild(row);
			tableNode.appendChild(thead);
			
			dojo.style(actions, "textAlign", "center");
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
				
				dojo.connect(check, "onclick", function(evt) {
					dojo.toggleClass(tableRow, "checkedRow", !!evt.target.checked);
				});
			}
			var col, div, link;
			if (item.Directory) {
				col = document.createElement('td');
				tableRow.appendChild(col);
				var nameId =  tableRow.id + "__expand";
				div = dojo.create("div", null, col, "only");
				var expandImg = dojo.create("img", {src: "/images/collapsed-gray.png", name: nameId}, div, "last");
				dojo.create("img", {src: "/images/silk/folder.png"}, div, "last");
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
				dojo.create("img", {src: "/images/silk/page.png"}, div, "last");
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
			dojo.query(".selectionCheckmark").forEach(function(node) {
				if (node.checked) {
					selected.push(node.itemId);
				}
			});
			return selected;
		},
		
		rowsChanged: function() {
			dojo.query(".treeTableRow").forEach(function(node, i) {
				var color = i % 2 ? "FFFFFF" : "EFEFEF";
				dojo.style(node, "backgroundColor", color);
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



