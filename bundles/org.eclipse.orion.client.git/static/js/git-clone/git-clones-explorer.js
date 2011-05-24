/******************************************************************************* 
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse:true widgets*/

var eclipse = eclipse || {};
eclipse.git = eclipse.git || {};

eclipse.git.GitClonesExplorer = (function() {
	
	function GitClonesExplorer(registry, selection, defaultPath, parentId, toolbarId, selectionToolsId){
		this.parentId = parentId;
		this.registry = registry;
		this.selection = selection;
		this.toolbarId = toolbarId;
		this.selectionToolsId = selectionToolsId;
		this.defaultPath = defaultPath;
		this.renderer = new eclipse.git.GitClonesRenderer({checkbox: this.checkbox}, this);
		
	}
	GitClonesExplorer.prototype = eclipse.Explorer.prototype;
	
	GitClonesExplorer.prototype.getGitLocation = function(path){
		return "/git/clone/"+eclipse.util.makeRelative(path);
	};
	
	GitClonesExplorer.prototype.displayClonesList = function(path){
		
			var self = this;
			
			path = path || this.defaultPath;
			
			path = eclipse.util.makeRelative(path);
			if (path === this._lastHash) {
				return;
			}
						
			this._lastHash = path;
			dojo.hash(path, true);
			
			var gitPath = this.getGitLocation(path);
			
			var d = dojo.create("div", null, dojo.byId(this.parentId), "only");
			d.innerHTML = "Loading <b>" + gitPath + "</b>...";
			
			this.registry.getService("orion.git.provider").then(function(service){
				dojo.hitch(self, self.createTree(self.parentId, new eclipse.GitClonesModel(service, gitPath, service.getGitClone)));
			});
		};
		
	GitClonesExplorer.prototype.redisplayClonesList = function(){

		if(!this._lastHash){
			return;
		}
		
		var self = this;	
		var gitPath = this.getGitLocation(this._lastHash);		
		var d = dojo.create("div", null, dojo.byId(this.parentId), "only");
		d.innerHTML = "Loading <b>" + gitPath + "</b>...";
		
		this.registry.getService("orion.git.provider").then(function(service){
			dojo.hitch(self, self.createTree(self.parentId, new eclipse.GitClonesModel(service, gitPath, service.getGitClone)));
		});
	};

	return GitClonesExplorer;
}());

var eclipse = eclipse || {};
eclipse.GitClonesModel = (function() {
	/**
	 * @name eclipse.Model
	 * @class Tree model used by eclipse.FileExplorer.
	 * TODO: Consolidate with eclipse.TreeModel.
	 */
	function GitClonesModel(gitClient, rootPath, fetchItems) {
		this.gitClient = gitClient;
		this.rootPath = rootPath;
		this.fetchItems = fetchItems;
		this.root = null;
	}
	GitClonesModel.prototype = eclipse.ExplorerModel.prototype; 
	
	
	GitClonesModel.prototype.getRoot = function(onItem){
		this.fetchItems(this.rootPath).then(
			dojo.hitch(this, function(item){
				this.root = item;
				onItem(item);
			})
		);
	};
		
	GitClonesModel.prototype.getChildren = function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
			// the parent already has the children fetched
			if (parentItem.Children) {
				onComplete(parentItem.Children);
			}
			else if (parentItem.BranchLocation || parentItem.RemoteLocation){
				onComplete([{GroupNode : "true", Location : parentItem.BranchLocation, Name : "Branch"}, {GroupNode : "true", Location : parentItem.RemoteLocation, Name : "Remote"}]);
			}
			else if (parentItem.GroupNode){
				this.gitClient.getGitBranch(parentItem.Location).then( 
					dojo.hitch(this, function(children) {
						onComplete(children.Children);
					})
				);
			}
			else if (parentItem.Type === "Remote"){
				this.gitClient.getGitBranch(parentItem.Location).then( 
					dojo.hitch(this, function(children) {
						onComplete(children.Children);
					})
				);
			}
		};
		
	return GitClonesModel;
}());

var eclipse = eclipse || {};
eclipse.git.GitClonesRenderer = (function(){
	
	function GitClonesRenderer(options, explorer){
		this._init(options);
		this.explorer = explorer;
	}
	GitClonesRenderer.prototype = eclipse.SelectionRenderer.prototype;
	
	GitClonesRenderer.prototype.getCellHeaderElement = function(col_no){
		
		switch(col_no){
		case 0: 
			return dojo.create("th", {innerHTML: "<h2>Name</h2>"});
			break;
		case 1:
			return dojo.create("th", {innerHTML: "<h2>Actions</h2>"});
			break;
		};
		
	};
	
	GitClonesRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		
		switch(col_no){
		case 0:
			var col, div, link;
			if (item.BranchLocation || item.RemoteLocation) {
				col = document.createElement('td');
				var nameId =  tableRow.id + "__expand";
				div = dojo.create("div", null, col, "only");
				// defined in ExplorerRenderer.  Sets up the expand/collapse behavior
				this.getExpandImage(tableRow, div);
				
				link = dojo.create("a", {innerHTML: item.Name, className: "navlinkonpage", href: "/navigate/table.html#" + item.ContentLocation+"?depth=1"}, div, "last");
				dojo.place(document.createTextNode(item.Name), link, "only");
			} else if (item.GroupNode){
				col = document.createElement('td');
				var nameId =  tableRow.id + "__expand";
				div = dojo.create("div", null, col, "only");
				// defined in ExplorerRenderer.  Sets up the expand/collapse behavior
				this.getExpandImage(tableRow, div);
				
				link = dojo.create("a", {innerHTML: item.Name, className: "navlinkonpage"}, div, "last");
				dojo.place(document.createTextNode(item.Name), link, "only");
			} else if (item.Type === "Branch"){
				col = document.createElement('td');
				div = dojo.create("div", null, col, "only");
				
				link = dojo.create("a", {innerHTML: item.Name, className: "navlinkonpage"}, div, "last");
				if (item.Current)
					link.style.fontWeight = "bold";
				dojo.place(document.createTextNode(item.Name), link, "only");
			} else if (item.Type === "Remote"){
				col = document.createElement('td');
				var nameId =  tableRow.id + "__expand";
				div = dojo.create("div", null, col, "only");
				// defined in ExplorerRenderer.  Sets up the expand/collapse behavior
				this.getExpandImage(tableRow, div);
				
				link = dojo.create("a", {innerHTML: item.Name, className: "navlinkonpage"}, div, "last");
				dojo.place(document.createTextNode(item.Name), link, "only");
			} else if (item.Type === "RemoteTrackingBranch"){
				col = document.createElement('td');
				div = dojo.create("div", null, col, "only");
				
				link = dojo.create("a", {innerHTML: item.Name, className: "navlinkonpage"}, div, "last");
				dojo.place(document.createTextNode(item.Name), link, "only");
			}	
			return col;
		case 1:
			return this.getActionsColumn(item, tableRow);
		};
	};

	return GitClonesRenderer;
}());