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

/*global dojo eclipse:true widgets*/
/*jslint regexp:false browser:true forin:true*/

define(['dojo', 'orion/explorer', 'orion/util', 'orion/git/gitCommands', 'orion/git/widgets/CommitTooltipDialog'], function(dojo, mExplorer, mUtil, mGitCommands) {

var exports =  {};
exports.GitCommitNavigator = (function() {
	/**
	 * Creates a new Git commit navigator.
	 * @name orion.git.GitCommitNavigator
	 * @class A table-based git commit navigator
	 */
	function GitCommitNavigator(serviceRegistry, selection, options, parentId, pageTitleId, toolbarId, selectionToolsId, pageNavId) {
		this.registry = serviceRegistry;
		this.selection = selection;
		this.checkbox = options != null ? options.checkbox : true;
		this.minimal = options != null ? options.minimal : false;
		this.parentId = parentId;
		this.pageTitleId = pageTitleId;
		this.toolbarId = toolbarId;
		this.pageNavId = pageNavId;
		this.selectionToolsId = selectionToolsId;
		this.isDirectory = true;
		this.model = null;
		this.myTree = null;
		this.renderer = new exports.GitCommitRenderer({checkbox: this.checkbox, cachePrefix: "GitCommitsNavigator", minimal: this.minimal}, this);
	}
	
	GitCommitNavigator.prototype = new mExplorer.Explorer();
	

	GitCommitNavigator.prototype.loadCommitsList = function(path, treeRoot, force) {

		var waitDeferred = new dojo.Deferred();

		path = mUtil.makeRelative(path);
		if (path === this._lastHash && !force) {
			waitDeferred.callback();
			return waitDeferred;
		}

		this._lastHash = path;
		this._lastTreeRoot = treeRoot;
		// dojo.hash(path, true);
		var parent = dojo.byId(this.parentId);

		// Progress indicator
		var progress = dojo.byId(parent.id + "progress");
		if (!progress) {
			progress = dojo.create("div", {
				id: parent.id + "progress"
			}, parent, "only");
		}
		dojo.empty(progress);

		if (treeRoot.status && treeRoot.status != 200) {
			var response = treeRoot.message;
			try {
				var obj = JSON.parse(treeRoot.responseText);
				if (obj.Message) {
					response = obj.Message;
				}
			} catch (error) {
				// it is not JSON, just continue;
			}
			if (treeRoot.status != 404 && response !== "")
				dojo.create("b", {
					innerHTML: "Error " + treeRoot.status + ": "
				}, progress, "only");
			dojo.place(document.createTextNode(response), progress, "last");

			if (this.toolbarId && this.selectionToolsId)
				mGitCommands.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, treeRoot, this.pageNavId);
			waitDeferred.callback();
			return waitDeferred;
		}

		b = dojo.create("b");
		dojo.place(document.createTextNode("Loading "), progress, "last");
		dojo.place(document.createTextNode(path), b, "last");
		dojo.place(b, progress, "last");
		dojo.place(document.createTextNode("..."), progress, "last");

		var self = this;

		if (this.toolbarId && this.selectionToolsId)
			mGitCommands.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, treeRoot, this.pageNavId);

		var service = this.registry.getService("orion.git.provider");

		var doGitLog = function(gitLogURI, onLoad) {
			var ret = new dojo.Deferred();
			service.doGitLog(gitLogURI, function(jsonData) {
					waitDeferred.callback();
					if (onLoad)
						onLoad(jsonData.Children);
					else {
						ret.callback(jsonData.Children);
					}

			});
			return ret;
		};

		if (treeRoot.Children) {
			this.createTree(this.parentId, new mExplorer.ExplorerFlatModel(path, doGitLog, treeRoot.Children));
			waitDeferred.callback();
		} else {
			this.createTree(this.parentId, new mExplorer.ExplorerFlatModel(path, doGitLog));
		}

		return waitDeferred;

	};
	
	return GitCommitNavigator;
}());

/********* Rendering json items into columns in the tree **************/


exports.GitCommitRenderer = (function() {
 	
	function GitCommitRenderer (options, explorer) {
		this._init(options);
		this.options = options;
		this.explorer = explorer;
	}
	GitCommitRenderer.prototype = new mExplorer.SelectionRenderer();
	
	GitCommitRenderer.prototype.getCellHeaderElement = function(col_no){
		
		if (this.options['minimal'])
			return;
		
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
			case 4:
				return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Branches</h2>"});
				break;
			case 5:
				return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Tags</h2>"});
				break;
		};
		
	};
	
	GitCommitRenderer.prototype.setIncomingCommits = function(scopedCommits){
		this.incomingCommits = scopedCommits;
	};
	
	GitCommitRenderer.prototype.setOutgoingCommits = function(scopedCommits){
		this.outgoingCommits = scopedCommits;
	};
	
	GitCommitRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		
		var incomingCommit = false;
		
		dojo.forEach(this.incomingCommits, function(commit, i){
			if (item.Name === commit.Name){
				incomingCommit = true;
			}
		});
		
		var outgoingCommit = false;
		
		dojo.forEach(this.outgoingCommits, function(commit, i){
			if (item.Name === commit.Name){
				outgoingCommit = true;
			}
		});

		switch(col_no){
		case 0:
			var col, div, link;

			col = document.createElement('td');
			div = dojo.create("div", {style: "margin-left: 5px; margin-right: 5px; margin-top: 5px; margin-bottom: 5px; padding-left: 20px;"}, col, "only");
				
			link = dojo.create("a", {className: "navlinkonpage", href: "/git/git-commit.html#" + item.Location + "?page=1&pageSize=1"}, div, "last");			
			dojo.place(document.createTextNode(item.Message), link, "only");		
			
			var _timer;
			
			var tooltipDialog = new orion.git.widgets.CommitTooltipDialog({
			    commit: item,
			    onMouseLeave: function(){
			    	if(dijit.popup.hide)
						dijit.popup.hide(tooltipDialog); //close doesn't work on FF
					dijit.popup.close(tooltipDialog);
	            },
	            onMouseEnter: function(){
			    	clearTimeout(_timer);
	            }
			});
			
			dojo.connect(link, "onmouseover", link, function() {
				dijit.popup.open({
					popup: tooltipDialog,
					around: link,
					orient: {'BR':'TL', 'TR':'BL'}
				});
			});
			
			dojo.connect(link, "onmouseout", link, function() {
				_timer = setTimeout(function(){
					if(dijit.popup.hide)
						dijit.popup.hide(tooltipDialog); //close doesn't work on FF
					dijit.popup.close(tooltipDialog);
				}, 200);
			});
			
			if (incomingCommit)
				dojo.toggleClass(tableRow, "incomingCommitsdRow", true);
			else if (outgoingCommit)
				dojo.toggleClass(tableRow, "outgoingCommitsdRow", true);
			
			return col;
			break;
		case 1:
			return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: item.AuthorName + " (" + item.AuthorEmail + ")"});
			break;
		case 2:
			return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: dojo.date.locale.format(new Date(item.Time), {formatLength: "short"})});
			break;
		case 3:
			if (this.options['minimal'])
				break;
			
			var actionsColumn = this.getActionsColumn(item, tableRow);
			dojo.style(actionsColumn, "padding-left", "5px");
			dojo.style(actionsColumn, "padding-right", "5px");
			return actionsColumn;
			break;
		case 4:
			if (this.options['minimal'])
				break;
			
			var td = document.createElement("td", {style: "padding-left: 5px; padding-right: 5px"});
			dojo.forEach(item.Branches, function(branch, i){
				dojo.place(document.createTextNode(branch.FullName), dojo.create("p", {style: "margin: 5px"}, td, "last"), "only");
			});
			return td;
			break;
		case 5:
			if (this.options['minimal'])
				break;
			
			var td = document.createElement("td", {style: "padding-left: 5px; padding-right: 5px"});
			dojo.forEach(item.Tags, function(tag, i){
				dojo.place(document.createTextNode(tag.Name), dojo.create("p", {style: "margin: 5px"}, td, "last"), "only");
			});
			return td;
			break;
		};
	};
	
	return GitCommitRenderer;
}());
return exports;
});

