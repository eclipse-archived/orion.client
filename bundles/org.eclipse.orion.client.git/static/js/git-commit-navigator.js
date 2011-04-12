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
		this.renderer = new eclipse.FileRenderer({checkbox: this.checkbox, cachePrefix: "GitCommitsNavigator"}, this);
	}
	
	GitCommitNavigator.prototype = eclipse.Explorer.prototype;
	
	GitCommitNavigator.prototype.loadCommitsList= function(path) {
			path = eclipse.util.makeRelative(path);
			if (path === this._lastHash) {
				return;
			}
						
			this._lastHash = path;
			//dojo.hash(path, true);
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
			
			self = this;
			
			eclipse.gitCommandUtils.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, this.treeRoot);
						
			this.registry.getService("IGitService").then(function(service){
				dojo.hitch(self, self.createTree(self.parentId, new eclipse.ExplorerFlatModel(path, service.doGitLog)));
			});
			
		};
	return GitCommitNavigator;
}());

/********* Rendering json items into columns in the tree **************/

eclipse = eclipse || {};
eclipse.FileRenderer = (function() {
	function FileRenderer (options, explorer) {
		this._init(options);
		this.explorer = explorer;
	}
	FileRenderer.prototype = eclipse.SelectionRenderer.prototype;
	
	FileRenderer.prototype.getCellHeaderElement = function(col_no){
		
		switch(col_no){
		case 0: 
			return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Message</h2>"});
			break;
		case 1:
			return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Author</h2>"});
			break;
		case 2:
			return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Date</h2>"});
			break;
		case 3:
			return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Actions</h2>"});
			break;
		};
		
	};
	
	FileRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		
		switch(col_no){
		case 0:
			
			var col, div, link;

			col = document.createElement('td');
			div = dojo.create("div", {style: "padding-left: 5px; padding-right: 5px; ; padding-top: 5px; padding-bottom: 5px"}, col, "only");
			link = dojo.create("a", {className: "navlinkonpage", href: "/coding.html#" + item.ContentLocation}, div, "last");
			dojo.place(document.createTextNode(item.Message), link, "only");			
			return col;
			break;
		case 1:
			return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: item.AuthorName});
			break;
		case 2:
			return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: dojo.date.locale.format(new Date(item.Time), {formatLength: "short"})});
			break;
		case 3:
			var actionsColumn = this.getActionsColumn(item, tableRow);
			dojo.style(actionsColumn, "padding-left", "5px");
			dojo.style(actionsColumn, "padding-right", "5px");
			return actionsColumn;
			break;
		};
		
	};
	
	return FileRenderer;
}());
