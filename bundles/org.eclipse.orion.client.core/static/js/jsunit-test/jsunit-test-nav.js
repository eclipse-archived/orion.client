/*******************************************************************************
 * Copyright (c) 2009, 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

 /*global dojo */

eclipse = eclipse || {};

eclipse.TestNavigator = (function() {
	function Navigator(renderer, createModel , serviceRegistry, options) {
		this._renderer = renderer;
		this._createModel = createModel;
		this._registry = serviceRegistry;
		var ccc = eclipse.uTestUtils;
		
		this._navDivId  = eclipse.uTestUtils.getOptionValue(options , "resultDivId" , eclipse.uTestConsts.NAVIGATOR_DIV_ID);
		this._navTreeId  = eclipse.uTestUtils.getOptionValue(options , "resultTreeId" , eclipse.uTestConsts.NAVIGATOR_TREE_ID);
			  	
		this._navDivDomNode = dojo.byId( this._navDivId);
		this._navRoot = {
			children:[]
		};
	}
	  
	Navigator.prototype = {
		createNavTree: function(){
			this._navModel = this._createModel(this._navRoot , this._navTreeId, this._registry);
			this.removeResourceList();
			this._navTree = new eclipse.TableTree({
			    id: this._navTreeId,
			    model: this._navModel,
			    showRoot: true,
			    parent: this._navDivId,
			    labelColumnIndex: 1,  // 0 if no checkboxes
			    renderer: this._renderer
			});
		},
			
		removeResourceList: function() {
	       	var tree = dijit.byId(this._navTreeId);
	  		if (tree)
	  			tree.destroyRecursive();
	  		var treeDom = dojo.byId(this._navTreeId);
	  		if (treeDom) {
	  		    if (this._navDivDomNode)
	  		    	this._navDivDomNode.removeChild(treeDom);
	  		}
		},
    
		loadResourceList: function(path) {
	    	path = eclipse.util.makeRelative(path);
	    	if (path == this._lastHash)
	    		return;
	    	this._lastHash = path;
	    	dojo.hash(path, true);
	   	
	  		// Progress indicator
	  		var progress = document.createElement('div');
	  		dojo.place(document.createTextNode("Loading " + path + "..."), progress, "only");
	  		progress.id = this._navTreeId;
	  		this.removeResourceList();
	  		this._navDivDomNode.appendChild(progress);
	  		this._navRoot.children = [];
	
	  		if (path != this._navRoot.Path) {
	  			//the tree root object has changed so we need to load the new one
	  			this._navRoot.Path = path;
	  			var self = this;
	  			this._registry.getService("IFileService").then(function(service) {
	  				service.loadWorkspace( 
					 path, dojo.hitch(self, function(loadedWorkspace) {
						//copy fields of resulting object into the tree root
						for (var i  in loadedWorkspace)
							this._navRoot[i] = loadedWorkspace[i];
						this._registry.getService("IFileService").then(function(service) {
							service.getChildren(
							 self._navRoot, dojo.hitch(self, function(parent, children) {
								this.createNavTree();
							}));
						});
					}));
				});
	 		}
		}
	};
	return Navigator;
}());