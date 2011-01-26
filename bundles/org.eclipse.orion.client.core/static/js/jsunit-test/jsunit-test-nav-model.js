/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
eclipse = eclipse || {};

eclipse.TestNavigatorModel = (function() {
  function Model(root , rootId, serviceRegistry) {
	this.root=root;
	this.rootId = rootId;
	this.registry = serviceRegistry;
  }
  Model.prototype = {
	  destroy: function(){
	  },
	  
	  getRoot: function(onItem){
	    onItem(this.root);
	  },
	  
	  getChildren: function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete , postExpandFunc , args){
	    // the root already has the children fetched
	    if (parentItem.children) {
			onComplete(parentItem.children);
	    } else if (parentItem.Directory!==undefined && parentItem.Directory===false) {
			onComplete([]);
	    } else if (parentItem.Location) {
	    	this.registry.getService("IFileService").then(function(service) {
	    		service.getChildren(parentItem,
    				dojo.hitch(this, function(parent, children) {
    					onComplete(children);
    					if(postExpandFunc)
    						postExpandFunc(args);
    				}));
	    	});
	    	return;
	    } else {
			onComplete([]);
	    }
		if(postExpandFunc)
			postExpandFunc(args);
	  },
	  
	  getId: function(/* item */ item){
	    var result;
	    if (item === this.root)
	    	result = this.rootId;
	    else {
			result = item.Location;
			// remove all non valid chars to make a dom id. 
			//result = result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
	    } 
	    return result;
	  }
  };
  return Model;
}());