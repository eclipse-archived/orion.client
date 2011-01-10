/*******************************************************************************
 * Copyright (c) 2009, 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse:true confirm document TableTree*/

var eclipse = eclipse || {};
eclipse.Explorer = (function() {
	/**
	 * @name eclipse.Explorer
	 * @class A table-based explorer component
	 */
	function Explorer(newItemDialogProvider, serviceRegistry, treeRoot, breadcrumbParentId, searcher, parentId, navToolBarId) {
		this.newItemDialogProvider = newItemDialogProvider;
		this.registry = serviceRegistry;
		this.treeRoot = treeRoot;
		this.breadcrumbParentId = breadcrumbParentId;
		this.searcher = searcher;
		this.parentId = parentId;
		this.navToolBarId = navToolBarId;
		
		this.model = null;
		this.myTree = null;
	}
	Explorer.prototype = /** @lends eclipse.Explorer.prototype */ {
		// we have changed an item on the server at the specified parent node
		changedItem: function(parent, /* optional */ children) {
			this.registry.callService("IFileService", "getChildren", null, [parent, dojo.hitch(this.myTree, this.myTree.refreshAndExpand)]);
		},
		
		makeFavorite: function(itemOrId) {
			var item = this.myTree.getItem(itemOrId);
			this.registry.callService("IFavorites", "makeFavorites", null, [item]);
		},
		
	    removeResourceList: function() {
	    	var container = dojo.byId(this.parentId);
	    	dojo.empty(container);
	    },
	    
		createProject: function(name, serverPath) {
			this.registry.callService("IFileService", "createProject", null, 
					[this.treeRoot.ChildrenLocation, name, serverPath,
					 dojo.hitch(this, function() {this.changedItem(this.treeRoot);})]);
		},
		
		createFolder: function(name, itemOrId) {
			var item = itemOrId;
			if (typeof(item) === "string") {
				item = this.myTree.getItem(itemOrId);
			}
			this.registry.callService("IFileService", "createFolder", null, [name, item, dojo.hitch(this, this.changedItem)]);
		},
		
		createFile: function(name, itemOrId) {
			var item = itemOrId;
			if (typeof(item) === "string") {
				item = this.myTree.getItem(itemOrId);
			}
			this.registry.callService("IFileService", "createFile", null, [name, item, dojo.hitch(this, this.changedItem)]); 
		},
	    
	    deleteFile: function(itemId) {
	   		var item = this.myTree.getItem(itemId);
	   		if (!item)
	   			return;
			// prompt since it's so easy to push that X!
			this.registry.callService("IDialogService", "confirm", null, ["Are you sure you want to delete '" + item.Name + "'?", function(doit) {
				if (!doit) {
					return;
				}
				if (item.parent.Path === "") {
					this.registry.callService("IFileService", "removeProject", null,
						[item.parent, item, dojo.hitch(this, function() {this.changedItem(this.treeRoot);})]);
				} else {
					this.registry.callService("IFileService", "deleteFile", null, [item, dojo.hitch(this, this.changedItem)]);
				}
			}]);
	    },
	    
	    loadResourceList: function(path) {
	    	path = eclipse.util.makeRelative(path);
	    	if (path == this._lastHash)
	    		return;
	    	this._lastHash = path;
	    	dojo.hash(path, true);
	   	
	  		// Progress indicator
	  		var progress = document.createElement('div');
	  		progress.innerHTML = "Loading <b>" + path + "</b>...";
	  		progress.id = "innerTree";
	  		this.removeResourceList();
	  		var parent = dojo.byId(this.parentId);
	  		dojo.place(progress, parent, "only");
	  		// we are refetching everything so clean up the root
	  		this.treeRoot = {}
	
	  		//TODO we need a reliable way to infer search from the path
	  		var isSearch = path.indexOf("search?") > 0;
	  		if (isSearch) {
	 		  	var results = document.createElement('div');
	 		  	// TODO this must be the same id as the table or else the search won't get deleted
	 		  	// when a breadcrumb or favorite is chosen
	 		  	results.id = "innerTree";
	  			this.searcher.search(results, path, null, true); // true means generate a "save search" link and heading
	  			//fall through and set the tree root to be the workspace root
	  			path ="";
	  			dojo.place(results, parent, "only");
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
									this.registry.callService("IFileService", "getChildren", null, 
											[this.treeRoot, dojo.hitch(this, function(parent, children) {
												new eclipse.BreadCrumbs({container: this.breadcrumbParentId, resource: parent});
												this.updateNavTools(parent.Location);
												this.createTree();
											})]);
								}
							})]);
	 		}
		},
		
		createTree: function (){
			this.model = new eclipse.Model(this.registry, this.treeRoot);
	
			// remove any existing tree or other DOM element occupying that space
			this.removeResourceList();
	
			this.myTree = new TableTree({
				id: "innerTree",
				model: this.model,
				showRoot: false,
				parent: this.parentId,
				labelColumnIndex: 1,  // 0 if no checkboxes
				renderer: new eclipse.FileRenderer({checkbox: true }, this)
			});
		},
		
		updateNavTools: function(path) {
			var bar = dojo.byId(this.navToolBarId);
			if (bar) {
				dojo.empty(bar);
				// FIXME this should be populated by command service
				if (eclipse.util.isAtRoot(path)) {
					bar.appendChild(this._newProjectCommand._asImage("NewProject", this.treeRoot, this));
					bar.appendChild(this._linkProjectCommand._asImage("LinkProject", this.treeRoot, this));
					bar.appendChild(this._openResourceCommand._asImage("Open Resource", this.treeRoot, this));
				} else {
					bar.appendChild(this._newFolderCommand._asImage("NewFolder", this.treeRoot, this));
					bar.appendChild(this._newFileCommand._asImage("NewFile", this.treeRoot, this));
					bar.appendChild(this._openResourceCommand._asImage("Open Resource", this.treeRoot, this));
				}
			}
		},
	    
	    _lastHash: null, 
	    _newFileCommand: new eclipse.Command({
					name: "New File",
					image: "images/silk/page_add-gray.png",
					hotImage: "images/silk/page_add.png",
					callback: function(item) {
						this.newItemDialogProvider.show('Create File', 'File name:',
								dojo.hitch(this, function(name){this.createFile(name, item);}));
					}}),
		_newFolderCommand: new eclipse.Command({
					name: "New Folder",
					image: "images/silk/folder_add-gray.png",
					hotImage: "images/silk/folder_add.png",
					callback: function(item) {
						this.newItemDialogProvider.show('Create Folder', 'Folder name:',
								dojo.hitch(this, function(name){this.createFolder(name, item);}));
					}}),
		_newProjectCommand: new eclipse.Command({
					name: "New Folder",
					image: "images/silk/folder_add-gray.png",
					hotImage: "images/silk/folder_add.png",
					callback: function(item) {
						this.newItemDialogProvider.show('Create Folder', 'Folder name:',
								dojo.hitch(this, function(name){this.createProject(name);}));
					}}),
		_linkProjectCommand: new eclipse.Command({
					name: "Link Folder",
					image: "images/silk/link_add-gray.png",
					hotImage: "images/silk/link_add.png",
					callback: function(item) {
						this.newItemDialogProvider.show('Link Folder', 'Folder name:',
								dojo.hitch(this, function(name,url){this.createProject(name, url);}),
								true);
					}}),
		_openResourceCommand: new eclipse.Command({
					name: "Open Resource",
					image: "images/silk/find-gray.png",
					hotImage: "images/silk/find.png",
					callback: function(item) {
						var that = this;
						setTimeout(function() {
							new widgets.OpenResourceDialog({
								SearchLocation: that.treeRoot.SearchLocation,
								searcher: that.searcher
							}).show();
						}, 0);
					}})
		};
	return Explorer;
})();

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
			// the root already has the children fetched
			if (parentItem.children) {
				onComplete(parentItem.children);
			} else if (parentItem.Directory!==undefined && parentItem.Directory===false) {
				onComplete([]);
			} else if (parentItem.Location) {
				this.registry.callService("IFileService", "getChildren", null, [parentItem, 
						dojo.hitch(this, function(parent, children) {
							onComplete(children);
						})]);
			} else {
				onComplete([]);
			}
		},
		getId: function(/* item */ item){
			var result;
			if (item === this.root)
				result = "innerTree";
			else {
				result = item.Location;
				// remove all non valid chars to make a dom id. 
				result = result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
			} 
			return result;
		}
	};
	return Model;
})();

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
			var th;
			if (this._useCheckboxSelection) {
				th = document.createElement('th');
				row.appendChild(th);
			}
			// name
			th = document.createElement('th');
			th.innerHTML = "Name";
			row.appendChild(th);
			// date
			th = document.createElement('th');
			th.innerHTML = "Date";
			row.appendChild(th);
			// size
			th = document.createElement('th');
			th.innerHTML = "Size";
			row.appendChild(th);
			// size
			th = document.createElement('th');
			th.innerHTML = "Actions";
			row.appendChild(th);
			
			thead.appendChild(row);
			tableNode.appendChild(thead);
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
			var col;
			if (item.Directory) {
				col = document.createElement('td');
				tableRow.appendChild(col);
				var nameId =  tableRow.id + "__expand";
				col.innerHTML = "<div><img name=\"" + nameId + "\" src=\"/images/collapsed-gray.png\"><img src=\"/images/silk/folder.png\">" + "<a class=\"navlinkonpage\" href=\"#" + item.ChildrenLocation + "\">" + item.Name + "</a>" + "</div>";
				col.onclick = dojo.hitch(this, function(evt) {
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
				col.innerHTML = "<div><img src=\"/images/none.png\"><img src=\"/images/silk/page.png\"><a class=\"navlink\" href=\"" + href + "\">" + item.Name + "</a></div>";
			}
			var dateColumn = document.createElement('td');
			tableRow.appendChild(dateColumn);
			if (item.LocalTimeStamp)
				dateColumn.innerHTML = new Date(item.LocalTimeStamp).toLocaleDateString();
			dojo.addClass(dateColumn, 'secondaryColumn');
			
			var sizeColumn = document.createElement('td');
			tableRow.appendChild(sizeColumn);
			if (!item.Directory && typeof item.Length === "number") {
				var length = parseInt(item.Length),
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
			
			var actionsColumn = document.createElement('td');
			actionsColumn.id = tableRow.id + "actions";
			tableRow.appendChild(actionsColumn);
			var actionsWrapper = document.createElement('span');
			actionsWrapper.id = tableRow.id + "actionswrapper";
			actionsColumn.appendChild(actionsWrapper);
			dojo.style(actionsWrapper, "visibility", "hidden");
			// contact the command service to render appropriate commands here.
			this.explorer.registry.callService("ICommandService", "renderCommands", null, [actionsWrapper, "object", tableRow.id, this.explorer, "image"]);
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



