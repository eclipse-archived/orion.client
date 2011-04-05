/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse:true widgets*/
/*jslint regexp:false browser:true forin:true*/

var eclipse = eclipse || {};
eclipse.GitCommitNavigator = (function() {
	/**
	 * @name eclipse.GitCommitNavigator
	 * @class A table-based git commit navigator
	 */
	function GitCommitNavigator(serviceRegistry, treeRoot, selection, searcher, gitClient, parentId, pageTitleId, toolbarId, selectionToolsId) {
		this.registry = serviceRegistry;
		this.treeRoot = treeRoot;
		this.selection = selection;
		this.searcher = searcher;
		this.gitClient = gitClient;
		this.parentId = parentId;
		this.pageTitleId = pageTitleId;
		this.toolbarId = toolbarId;
		this.selectionToolsId = selectionToolsId;
		this.model = null;
		this.myTree = null;
	}
	GitCommitNavigator.prototype = /** @lends eclipse.GitCommitNavigator.prototype */ {
			
		loadCommitsList: function(path) {
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
			
			this.gitClient.doGitLog(path, dojo.hitch(this, 
					function(jsonData, secondArg){
						for (var i  in jsonData) {
							this.treeRoot[i] = jsonData[i];
						};
						
						eclipse.gitCommandUtils.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, this.treeRoot);
						
						this.createTree();
			
						var pageTitle = dojo.byId(this.pageTitleId);
						if (pageTitle) {
							dojo.empty(pageTitle);
							new eclipse.BreadCrumbs({container: pageTitle, resource: this.treeRoot[0]});
						}
					}
			));
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
			this.model = new eclipse.Model(this.registry, this.treeRoot, this.gitClient, treeId);
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
	return GitCommitNavigator;
}());

eclipse = eclipse || {};
eclipse.Model = (function() {
	/**
	 * @name eclipse.Model
	 * @class Tree model used by eclipse.GitCommitNavigator.
	 * TODO: Consolidate with eclipse.TreeModel.
	 */
	function Model(serviceRegistry, root, gitClient, treeId) {
		this.registry = serviceRegistry;
		this.root = root;
		this.gitClient = gitClient;
		this.treeId = treeId;
	}
	Model.prototype = {
		destroy: function(){
		},
		getRoot: function(onItem){
			onItem(this.root);
		},
		getChildren: function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
			onComplete(parentItem);
		},
		getId: function(/* item */ item){
			var result;
			if (item === this.root) {
				result = this.treeId;
			} else {
				result = item.Name;
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
			var th, authorName, date, actions;
			if (this._useCheckboxSelection) {
				th = document.createElement('th');
				row.appendChild(th);
			}
			
			th = dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Message</h2>"}, row);
			dojo.addClass(th, "navColumn");
			
			authorName = dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Author</h2>"}, row);
			dojo.addClass(authorName, "navColumn");
			
			date = dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Date</h2>"}, row);
			dojo.addClass(date, "navColumn");
			
			actions = dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Actions</h2>"}, row);
			dojo.addClass(actions, "navColumn");
			
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
				
				dojo.connect(check, "onclick", dojo.hitch(this, function(evt) {
					dojo.toggleClass(tableRow, "checkedRow", !!evt.target.checked);
					this.explorer.selection.setSelections(this.getSelected());			
				}));
			}
			var col, div, link;
			

			col = document.createElement('td');
			tableRow.appendChild(col);
				
			var nameId =  tableRow.id + "__expand";
			div = dojo.create("div", {style: "padding-left: 5px; padding-right: 5px; ; padding-top: 5px; padding-bottom: 5px"}, col, "only");
//			var expandImg = dojo.create("img", {src: "/images/collapsed-gray.png", name: nameId}, div, "last");
			link = dojo.create("a", {className: "navlinkonpage", href: "/coding.html#" + item.ContentLocation}, div, "last");
			dojo.place(document.createTextNode(item.Message), link, "only");
//			expandImg.onclick = dojo.hitch(this, function(evt) {
//				this.tableTree.toggle(tableRow.id, nameId, '/images/expanded-gray.png', '/images/collapsed-gray.png');
//			});
//			dojo.addClass(div, 'primaryColumn');
			
			var authorName = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}, tableRow);
			authorName.innerHTML = item.AuthorName;
			dojo.addClass(authorName, 'secondaryColumn');
			
			var commitTime = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}, tableRow);
			commitTime.innerHTML = dojo.date.locale.format(new Date(item.Time), {formatLength: "short"});
			dojo.addClass(commitTime, 'secondaryColumn');
						
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
			this.explorer.selection.setSelections(this.getSelected());
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



