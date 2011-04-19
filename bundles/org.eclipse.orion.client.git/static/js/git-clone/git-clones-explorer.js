/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse:true widgets*/

var eclipse = eclipse || {};
eclipse.git = eclipse.git || {};


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
		case 2:
			return dojo.create("th", {innerHTML: "<h2>Id</h2>"});
			break;
		case 3:
			return dojo.create("th", {innerHTML: "<h2>Content Location</h2>"});
			break;
		};
		
	};
	
	GitClonesRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		
		switch(col_no){
		case 0:
			return dojo.create("td", {innerHTML: item.Name});
			break;
		case 1:
			return this.getActionsColumn(item, tableRow);
			break;
		case 2:
			return dojo.create("td", {innerHTML: item.Id});
			break;
		case 3:
			return dojo.create("td", {innerHTML: item.ContentLocation});
			break;
		};
		
	};
	
	
	return GitClonesRenderer;
}());

eclipse.git.GitClonesExplorer = (function() {
	
	function GitClonesExplorer(registry, selection, defaultPath, parentId, toolbarId, selectionToolsId){
		this.parentId = parentId;
		this.registry = registry;
		this.selection = selection;
		this.toolbarId = toolbarId;
		this.selectionToolsId = selectionToolsId;
		this.defaultPath = defaultPath;
		this.renderer = new eclipse.git.GitClonesRenderer({checkbox: this.checkbox }, this);
		
	}
	GitClonesExplorer.prototype = eclipse.Explorer.prototype;
	GitClonesExplorer.prototype.displayClonesList = function(path){
		
			var self = this;
			
			path = path || this.defaultPath;
			
			path = eclipse.util.makeRelative(path);
			if (path === this._lastHash) {
				return;
			}
						
			this._lastHash = path;
			dojo.hash(path, true);
			
			var d = dojo.create("div", null, dojo.byId(this.parentId), "only");
			d.innerHTML = "Loading <b>" + path + "</b>...";
			
			this.registry.getService("IGitService").then(function(service){
				dojo.hitch(self, self.createTree(self.parentId, new eclipse.ExplorerModel(path, service.getGitClone)));
			});
		};
		
	GitClonesExplorer.prototype.redisplayClonesList = function(){

		if(!this._lastHash){
			return;
		}
		
		var self = this;	
		var path = this._lastHash;		
		var d = dojo.create("div", null, dojo.byId(this.parentId), "only");
		d.innerHTML = "Loading <b>" + path + "</b>...";
		
		this.registry.getService("IGitService").then(function(service){
			dojo.hitch(self, self.createTree(self.parentId, new eclipse.ExplorerModel(path, service.getGitClone)));
		});
	};

return GitClonesExplorer;
}());