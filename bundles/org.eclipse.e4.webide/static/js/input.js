/*******************************************************************************
 * Copyright (c) 2009, 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
 
"use strict";
 
dojo.require("dojo.hash");

/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * Input Service
 * @class Services for editor inputs
 */
eclipse.InputService = function(serviceRegistry) {
	this.serviceRegistry = serviceRegistry;
	this._verifyInputChangeCallback = [];
	this._inputChangedCallback = [];
	this._subscribed = false;
	this._previousInput = null;
	this._triggeringEvent = null;
	this._shouldManageDocumentTitle = false;
};
 
eclipse.InputService.prototype = {
	initializeContext : function(options) {
		if (options.manageDocumentTitle !== undefined) {
			this._shouldManageDocumentTitle = options.manageDocumentTitle;
		}
	},
	
	_checkSubscribed : function() {
	   	if (this._subscribed)
	   		return;
	   	this._subscribed = true;
	   	this._previousInput = dojo.hash();
	   	var input = this;
	   	// I'm beginning to think this is a bad idea, that we shouldn't be the ones monitoring hashes.
	   	// See https://kanrtc01.ottawa.ibm.com:9446/ies/web/projects/EclipseWeb#action=com.ibm.team.workitem.viewWorkItem&id=408
	   	dojo.subscribe("/dojo/hashchange", input, function() {
	   	    // if we are restoring the hash to what we think it should be, ignore
	   	    if (dojo.hash() === this._previousInput)
	   	    	return;
	   		if (this._okToChange()) {
	   			this._previousInput = dojo.hash();
	   			for (var i = 0; i < this._inputChangedCallback.length; i++) {
	   				this._inputChangedCallback[i].call(this, this._getInputSync(), this._triggeringEvent);
	   			}
	   			this._triggeringEvent = null;
	   		} else {
	   			// restore hash, user rejected the change
	   			dojo.hash(this._previousInput);
	   		}
	   	});
	},
	
	_okToChange : function() {
		for (var i = 0; i < this._verifyInputChangeCallback.length; i++) {
      		var ok = this._verifyInputChangeCallback[i].apply(this);
      		if (!ok) {
      			return false;
      		}
		}
	    return true;
	},
	    
	// TODO This callback is used by parties that want to veto the input change from afar.  For the editor,
	// it is not necessary because the onunload performs the check.  
	// See https://kanrtc01.ottawa.ibm.com:9446/ies/web/projects/EclipseWeb#action=com.ibm.team.workitem.viewWorkItem&id=408
	verifyInputChange : function(callback) {
		this._checkSubscribed();
		this._verifyInputChangeCallback.push(callback);
	},
	  
	inputChanged : function(callback) {
		this._checkSubscribed();
		this._inputChangedCallback.push(callback);
		var hash = dojo.hash();
		if (hash) {
			callback(hash);
		}
			
	},
	
	_getInputSync: function() {
		return dojo.hash();
	},
		
	getInput : function(onDone) {
		onDone(this._getInputSync());
	},
		
	setInput : function(fileURI, event) {
		if (fileURI !== dojo.hash() && this._okToChange()) {
			this._triggeringEvent = event;
			dojo.hash(fileURI);
		}
	},

	setTitle : function(title) {
		if (this._shouldManageDocumentTitle) {
			window.document.title = title;
		}
	}
};