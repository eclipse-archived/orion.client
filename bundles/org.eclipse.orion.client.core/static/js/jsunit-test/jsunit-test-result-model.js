/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
eclipse = eclipse || {};

eclipse.TestResultModel = (function() {
  function Model(root , rootId , onlyFailure) {
	this.root=root;
	this.rootId = rootId;
	this._onlyFailure = onlyFailure;
  }
  Model.prototype = {
	  destroy: function(){
	  },
	  
	  getRoot: function(onItem){
	    onItem(this.root);
	  },
	  
	  getChildren: function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
	    // the root already has the children fetched
	    if (parentItem.children) {
	    	if(this._onlyFailure){
	    		var children = parentItem.children;
	    		var failures = [];
	    		for(var i = 0; i < children.length ; i++ ){
	    			if(!children[i].succeed)
	    				failures.push(children[i]);
	    		}
	    		onComplete(failures);
	    	} else {
				onComplete(parentItem.children);
	    	}
	    } else if (parentItem.type!==undefined && parentItem.type==="test") {
			onComplete([]);
	    }  else {
			onComplete([]);
	    }
	  },
	  
	  getId: function(/* item */ item){
	    var result;
	    if (item === this.root)
	    	result = this.rootId;
	    else {
			result = item.name;
			// remove all non valid chars to make a dom id. 
			result = result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
	    } 
	    return result;
	  }
  };
  return Model;
}());