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

define(['i18n!git/nls/gitmessages', 'dojo', 'orion/explorers/explorer', 'orion/fileUtils', 'orion/git/gitCommands', 'orion/explorers/navigationUtils', 'orion/git/widgets/CommitTooltipDialog'], function(messages, dojo, mExplorer, mFileUtils, mGitCommands, mNavUtils) {

var exports =  {};
exports.GitCommitNavigator = (function() {
	/**
	 * Creates a new Git commit navigator.
	 * @name orion.git.GitCommitNavigator
	 * @class A table-based git commit navigator
	 */
	function GitCommitNavigator(serviceRegistry, selection, options, parentId, pageTitleId, toolbarId, selectionToolsId, pageNavId, actionScopeId) {
		this.registry = serviceRegistry;
		this.selection = selection;
		this.checkbox = options != null ? options.checkbox : true;
		this.minimal = options != null ? options.minimal : false;
		this.parentId = parentId;
		this.pageTitleId = pageTitleId;
		this.toolbarId = toolbarId;
		this.pageNavId = pageNavId;
		this.selectionToolsId = selectionToolsId;
		this.actionScopeId = actionScopeId || options.actionScopeId;
		this.isDirectory = true;
		this.model = null;
		this.myTree = null;
		this.renderer = new exports.GitCommitRenderer({actionScopeId: this.actionScopeId, cachePrefix: "GitCommitsNavigator", minimal: this.minimal}, this); //$NON-NLS-0$
	}
	
	GitCommitNavigator.prototype = new mExplorer.Explorer();
	
	GitCommitNavigator.prototype.loadCommitsList = function(path, treeRoot, force) {

		var waitDeferred = new dojo.Deferred();

		this.renderer._useCheckboxSelection = false;
		
		path = mFileUtils.makeRelative(path);
		if (path === this._lastHash && !force) {
			waitDeferred.callback();
			return waitDeferred;
		}

		this._lastHash = path;
		this._lastTreeRoot = treeRoot;
		// dojo.hash(path, true);
		var parent = dojo.byId(this.parentId);

		// Progress indicator
		var progress = dojo.byId(parent.id + "progress"); //$NON-NLS-0$
		if (!progress) {
			progress = dojo.create("div", { //$NON-NLS-0$
				id: parent.id + "progress" //$NON-NLS-0$
			}, parent, "only"); //$NON-NLS-0$
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
				dojo.create("b", { //$NON-NLS-0$
					innerHTML: dojo.string.substitute(messages["Error ${0}: "], [treeRoot.status])
				}, progress, "only"); //$NON-NLS-0$
			dojo.place(document.createTextNode(response), progress, "last"); //$NON-NLS-0$

			if (this.toolbarId && this.selectionToolsId)
				mGitCommands.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, treeRoot, this.pageNavId);
			waitDeferred.callback();
			return waitDeferred;
		}

		b = dojo.create("b"); //$NON-NLS-0$
		dojo.place(document.createTextNode(messages["Loading "]), progress, "last"); //$NON-NLS-1$
		dojo.place(document.createTextNode(path), b, "last"); //$NON-NLS-0$
		dojo.place(b, progress, "last"); //$NON-NLS-0$
		dojo.place(document.createTextNode("..."), progress, "last"); //$NON-NLS-1$ //$NON-NLS-0$

		if (this.toolbarId && this.selectionToolsId)
			mGitCommands.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, treeRoot, this.pageNavId);

		var service = this.registry.getService("orion.git.provider"); //$NON-NLS-0$

		var doGitLog = function(gitLogURI, onLoad) {
			var ret = new dojo.Deferred();
			service.doGitLog(gitLogURI).then(function(jsonData) {
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
			this.createTree(this.parentId, new mExplorer.ExplorerFlatModel(path, doGitLog, treeRoot.Children), {setFocus: !this.minimal});
			waitDeferred.callback();
		} else {
			this.createTree(this.parentId, new mExplorer.ExplorerFlatModel(path, doGitLog), {setFocus: !this.minimal});
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
		
		if (this.options['minimal']) //$NON-NLS-0$
			return;
		
		switch(col_no){		
			case 0: 
				return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>"+messages["Message"]+"</h2>"}); //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 1:
				return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>"+messages["Author"]+"</h2>"}); //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 2:
				return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>"+messages["Date"]+"</h2>"}); //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 3:
				return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>"+messages["Actions"]+"</h2>"}); //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 4:
				return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>"+messages["Branches"]+"</h2>"}); //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 5:
				return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>"+messages["Tags"]+"</h2>"}); //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
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

			col = document.createElement('td'); //$NON-NLS-0$
			div = dojo.create("div", {style: "margin-left: 5px; margin-right: 5px; margin-top: 5px; margin-bottom: 5px; padding-left: 20px;"}, col, "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				
			link = dojo.create("a", {className: "navlink", href: "/git/git-commit.html#" + item.Location + "?page=1&pageSize=1"}, div, "last");			 //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.place(document.createTextNode(item.Message), link, "only");		 //$NON-NLS-0$
			mNavUtils.addNavGrid(this.explorer.getNavDict(), item, link);
			
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
			
			dojo.connect(link, "onmouseover", link, function() { //$NON-NLS-0$
				clearTimeout(_timer);
				
				_timer = setTimeout(function(){
					dijit.popup.open({
						popup: tooltipDialog,
						around: link,
						orient: {'BR':'TL', 'TR':'BL'} //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					});
				}, 600);
			});
			
			dojo.connect(link, "onmouseout", link, function() { //$NON-NLS-0$
				clearTimeout(_timer);
				
				_timer = setTimeout(function(){
					if(dijit.popup.hide)
						dijit.popup.hide(tooltipDialog); //close doesn't work on FF
					dijit.popup.close(tooltipDialog);
				}, 200);
			});
			
			if (incomingCommit)
				dojo.toggleClass(tableRow, "incomingCommitsdRow", true); //$NON-NLS-0$
			else if (outgoingCommit)
				dojo.toggleClass(tableRow, "outgoingCommitsdRow", true); //$NON-NLS-0$
			
			return col;
			break;
		case 1:
			return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: item.AuthorName + " (" + item.AuthorEmail + ")"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			break;
		case 2:
			return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: dojo.date.locale.format(new Date(item.Time), {formatLength: "short"})}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			break;
		case 3:
			if (this.options['minimal']) //$NON-NLS-0$
				break;
			
			var actionsColumn = this.getActionsColumn(item, tableRow, null, null, true);
			dojo.style(actionsColumn, "padding-left", "5px"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.style(actionsColumn, "padding-right", "5px"); //$NON-NLS-1$ //$NON-NLS-0$
			return actionsColumn;
			break;
		case 4:
			if (this.options['minimal']) //$NON-NLS-0$
				break;
			
			var td = document.createElement("td", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.forEach(item.Branches, function(branch, i){
				dojo.place(document.createTextNode(branch.FullName), dojo.create("p", {style: "margin: 5px"}, td, "last"), "only"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			});
			return td;
			break;
		case 5:
			if (this.options['minimal']) //$NON-NLS-0$
				break;
			
			var td = document.createElement("td", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.forEach(item.Tags, function(tag, i){
				dojo.place(document.createTextNode(tag.Name), dojo.create("p", {style: "margin: 5px"}, td, "last"), "only"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			});
			return td;
			break;
		};
	};
	
	return GitCommitRenderer;
}());
return exports;
});

