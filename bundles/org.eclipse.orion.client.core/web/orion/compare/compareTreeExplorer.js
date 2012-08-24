/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
define(['i18n!orion/search/nls/messages', 'require', 'dojo', 'dijit','orion/explorer', 'orion/explorerNavHandler', 'orion/util', 'orion/fileClient', 'orion/commands', 'orion/searchUtils', 'orion/globalSearch/search-features', 'orion/compare/compare-features', 'orion/compare/compare-container', 'orion/navigationUtils', 'orion/crawler/searchCrawler', 'dijit/TooltipDialog'], 
		function(messages, require, dojo, dijit, mExplorer, mNavHandler, mUtil, mFileClient, mCommands, mSearchUtils, mSearchFeatures, mCompareFeatures, mCompareContainer, mNavUtils, mSearchCrawler) {
	/**
	 * Creates a new compare tree explorer.
	 * @name orion.CompareTreeExplorer
	 */
	function CompareTreeExplorerRenderer(options, explorer){
		this._init(options);
		this.options = options;
		this.explorer = explorer;
	};
	
	CompareTreeExplorerRenderer.prototype = new mExplorer.SelectionRenderer();
	
	CompareTreeExplorerRenderer.prototype.getCellHeaderElement = function(col_no){
		switch(col_no){
			case 0: 
				return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>"+messages["Files replaced"]+"</h2>"}); //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 1: 
				return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>"+messages["Status"]+"</h2>"}); //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				break;
		}
	};
	
	CompareTreeExplorerRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		switch(col_no){
		case 0:
			var col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
			var div = dojo.create("div", null, col, "only"); //$NON-NLS-1$ //$NON-NLS-0$
			var span = dojo.create("span", { className: "primaryColumn"}, div, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

			dojo.place(document.createTextNode(item.model.fullPathName + "/" + item.model.name), span, "only"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.connect(span, "onclick", span, function() { //$NON-NLS-0$
				window.open(item.model.linkLocation);
			});
			dojo.connect(span, "onmouseover", span, function() { //$NON-NLS-0$
				span.style.cursor ="pointer"; //$NON-NLS-0$
			});
			dojo.connect(span, "onmouseout", span, function() { //$NON-NLS-0$
				span.style.cursor ="default"; //$NON-NLS-0$
			});
			
			var operationIcon = dojo.create("span", null, div, "first"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(operationIcon, "imageSprite"); //$NON-NLS-0$
			
			if(item.status){
				switch (item.status) {
					case "warning": //$NON-NLS-0$
						dojo.addClass(operationIcon, "core-sprite-warning"); //$NON-NLS-0$
						return col;
					case "failed": //$NON-NLS-0$
						dojo.addClass(operationIcon, "core-sprite-error"); //$NON-NLS-0$
						return col;
					case "pass": //$NON-NLS-0$
						dojo.addClass(operationIcon, "core-sprite-ok"); //$NON-NLS-0$
						return col;
				}
			}
			return col;
		case 1:
			var statusMessage;
			if(item.status){
				switch (item.status) {
					case "warning": //$NON-NLS-0$
						statusMessage = item.message;
						break;
					case "failed": //$NON-NLS-0$
						statusMessage = item.message;
						break;
					case "pass": //$NON-NLS-0$
						statusMessage = dojo.string.substitute(messages["${0} out of ${1}  matches replaced."], [item.matchesReplaced, item.model.totalMatches]);
						break;
				}
				return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: statusMessage}); //$NON-NLS-1$ //$NON-NLS-0$
			}
		}
	};
	
	CompareTreeExplorerRenderer.prototype.constructor = CompareTreeExplorerRenderer;
	
	function CompareTreeExplorer(registry, parentId, commandService){
		this.registry = registry;
		this._commandService = commandService;
		this.fileClient = new mFileClient.FileClient(this.registry);
		this.parentId = parentId;
		this.renderer = new CompareTreeExplorerRenderer({checkbox: false}, this);
		//this.declareCommands();
	}
	CompareTreeExplorer.prototype = new mExplorer.Explorer();
	
	CompareTreeExplorer.prototype.reportStatus = function(message) {
		this.registry.getService("orion.page.message").setProgressMessage(message);	 //$NON-NLS-0$
	};

	CompareTreeExplorer.prototype.compareSkeletons = function(skeletonNew, skeletonBase) {
	};

	CompareTreeExplorer.prototype.prepareResults = function(twoFolders) {
		var twoFoldersIndex = twoFolders.indexOf(","); //$NON-NLS-0$
		if(twoFoldersIndex > 0){
			var folderNew = twoFolders.substring(0, twoFoldersIndex);
			var folderBase = twoFolders.substring(twoFoldersIndex+1);
			var that = this;
			var crawlerNew = new mSearchCrawler.SearchCrawler(this.registry, this.fileClient, "", {buildSkeletonOnly: true, location: folderNew}); 
			var crawlerBase = new mSearchCrawler.SearchCrawler(this.registry, this.fileClient, "", {buildSkeletonOnly: true, location: folderBase}); 
			crawlerNew.buildSkeleton(
				function(){
				}, 
				function(){
					crawlerBase.buildSkeleton(
						function(){
						}, 
						function(){
							that.compareSkeletons(crawlerNew.fileSkeleton, crawlerBase.fileSkeleton);
					});
			});
		} 
	};

	CompareTreeExplorer.prototype.startup = function(twoFolders) {
		this.reportStatus("Generating compare tree result...");	
		this.prepareResults(twoFolders);
		//this.createTree(this.parentId, new mExplorer.ExplorerFlatModel(null, null, this._compareitems));
	};

	CompareTreeExplorer.prototype.constructor = CompareTreeExplorer;

	//return module exports
	return {
		CompareTreeExplorer: CompareTreeExplorer
	};
});
