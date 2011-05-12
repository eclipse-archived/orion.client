/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse:true widgets*/
/*jslint regexp:false browser:true forin:true*/

dojo.require("dojo.date.locale");

var eclipse = eclipse || {};
eclipse.FileExplorer = (function() {
	/**
	 * @name eclipse.FileExplorer
	 * @class A table-based explorer component
	 */
	function FileExplorer(serviceRegistry, treeRoot, selection, searcher, fileClient, parentId, pageTitleId, toolbarId, selectionToolsId) {
		this.registry = serviceRegistry;
		this.treeRoot = treeRoot;
		this.selection = selection;
		this.searcher = searcher;
		this.fileClient = fileClient;
		this.parentId = parentId;
		this.pageTitleId = pageTitleId;
		this.toolbarId = toolbarId;
		this.selectionToolsId = selectionToolsId;
		this.model = null;
		this.myTree = null;
		this.renderer = new eclipse.FileRenderer({checkbox: true, cachePrefix: "Navigator" }, this);
	}
	
	FileExplorer.prototype = eclipse.Explorer.prototype;
	
		// we have changed an item on the server at the specified parent node
		FileExplorer.prototype.changedItem = function(parent) {
			var self = this;
			this.fileClient.fetchChildren(parent.ChildrenLocation).then(function(children) {
				eclipse.util.processNavigatorParent(parent, children);
				dojo.hitch(self.myTree, self.myTree.refreshAndExpand)(parent, children);
			});
		};
		
		FileExplorer.prototype.getNameNode = function(item) {
			var rowId = this.model.getId(item);
			if (rowId) {
				// I know this from my renderer below.
				return dojo.byId(rowId+"NameColumn");
			}
		};
						
		FileExplorer.prototype.loadResourceList = function(path) {
			// console.log("loadResourceList old " + this._lastHash + " new " + path);
			path = eclipse.util.makeRelative(path);
			if (path === this._lastHash) {
				return;
			}
						
			this._lastHash = path;
			var parent = dojo.byId(this.parentId);			

			// we are refetching everything so clean up the root
			this.treeRoot = {};
	
			if (path !== this.treeRoot.Path) {
				//the tree root object has changed so we need to load the new one
				
				// Progress indicator
				var progress = dojo.byId("progress"); 
				if(!progress){
					progress = dojo.create("div", {id: "progress"}, parent, "only");
				}
				dojo.empty(progress);
				
				var progressTimeout = setTimeout(function() {
					dojo.empty(progress);
					var b = dojo.create("b");
					dojo.place(document.createTextNode("Loading "), progress, "last");
					dojo.place(document.createTextNode(path), b, "last");
					dojo.place(b, progress, "last");
					dojo.place(document.createTextNode("..."), progress, "last");
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
						eclipse.util.rememberSuccessfulTraversal(this.treeRoot, this.registry);
						eclipse.util.processNavigatorParent(this.treeRoot, loadedWorkspace.Children);					
						// erase any old page title
						var pageTitle = dojo.byId(this.pageTitleId);
						if (pageTitle) {
							dojo.empty(pageTitle);
							new eclipse.BreadCrumbs({container: pageTitle, resource: this.treeRoot});
						}
						eclipse.fileCommandUtils.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, this.treeRoot);
						this.model = new eclipse.Model(this.registry, this.treeRoot, this.fileClient);
						this.createTree(this.parentId, this.model);
					}),
					dojo.hitch(self, function(error) {
						clearTimeout(progressTimeout);
						// Show an error message when a problem happens during getting the workspace
						if (error.status !== null && error.status !== 401){
							dojo.place(document.createTextNode("Sorry, an error occurred: " + error.message), progress, "only");
						}
					})
				);
			}
		};
		
	return FileExplorer;
}());

eclipse = eclipse || {};
eclipse.Model = (function() {
	/**
	 * @name eclipse.Model
	 * @class Tree model used by eclipse.FileExplorer.
	 * TODO: Consolidate with eclipse.TreeModel.
	 */
	function Model(serviceRegistry, root, fileClient, treeId) {
		this.registry = serviceRegistry;
		this.root = root;
		this.fileClient = fileClient;
		this.treeId = treeId;
	}
	Model.prototype = eclipse.ExplorerModel.prototype; 
	
	
	Model.prototype.getRoot = function(onItem){
			onItem(this.root);
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
						eclipse.util.processNavigatorParent(parentItem, children);
						onComplete(children);
					})
				);
			} else {
				onComplete([]);
			}
		};
	return Model;
}());

/********* Rendering json items into columns in the tree **************/
eclipse = eclipse || {};
eclipse.FileRenderer = (function() {
	function FileRenderer (options, explorer) {
		this.explorer = explorer;
		this._init(options);
	}
	FileRenderer.prototype = eclipse.SelectionRenderer.prototype; 
	
	
	FileRenderer.prototype.getCellHeaderElement = function(col_no){
		
		switch(col_no){
		case 0: 
			return dojo.create("th", {innerHTML: "<h2>Name</h2>"});
		case 1:
			return dojo.create("th", {innerHTML: "<h2>Actions</h2>"});
		case 2:
			return dojo.create("th", {innerHTML: "<h2>Date/Time</h2>"});
		case 3:
			var th = dojo.create("th", {innerHTML: "<h2>Size</h2>"});
			dojo.style(th, "textAlign", "right");
			return th;
		};
	};
		
		FileRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		
		switch(col_no){
		case 0:
			var col, div, link;
			if (item.Directory) {
				col = document.createElement('td');
				var nameId =  tableRow.id + "__expand";
				div = dojo.create("div", null, col, "only");
				// defined in ExplorerRenderer.  Sets up the expand/collapse behavior
				this.getExpandImage(tableRow, div);
				link = dojo.create("a", {className: "navlinkonpage", id: tableRow.id+"NameColumn", href: "#" + item.ChildrenLocation}, div, "last");
				dojo.place(document.createTextNode(item.Name), link, "only");
			} else {
				col = document.createElement('td');
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
							case "php":
							case "txt":
								href = "/coding.html#" + item.Location;
								break;
					}
				}
				div = dojo.create("div", null, col, "only");
				dojo.create("img", {src: "/images/none.png"}, div, "last");
				dojo.create("img", {src: "/images/file_obj.gif"}, div, "last");
				link = dojo.create("a", {className: "navlink", id: tableRow.id+"NameColumn", href: href}, div, "last");
				dojo.place(document.createTextNode(item.Name), link, "only");
			}
			return col;
			break;
		case 1:
			return this.getActionsColumn(item, tableRow);
			break;
		case 2:
			var dateColumn = document.createElement('td');
			if (item.LocalTimeStamp) {
				var fileDate = new Date(item.LocalTimeStamp);
				dateColumn.innerHTML = dojo.date.locale.format(fileDate);
			}

			return dateColumn;
			break;
		case 3:
			var sizeColumn = document.createElement('td');
			if (!item.Directory && typeof item.Length === "number") {
				var length = parseInt(item.Length, 10),
					kb = length / 1024;
				sizeColumn.innerHTML = dojo.number.format(Math.ceil(kb)) + " KB";
			}
			dojo.style(sizeColumn, "textAlign", "right");
			return sizeColumn;
			break;
		};
		
	};
	

	return FileRenderer;
}());


