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
	this._serviceRegistry = serviceRegistry;
	this._serviceRegistration = serviceRegistry.registerService("IInputProvider", this);
	this._subscribed = false;
	this._previousInput = null;
	this._triggeringEvent = null;
	this._shouldManageDocumentTitle = false;
	this._init();
};
 
eclipse.InputService.prototype = {
	initializeContext : function(options) {
		if (options.manageDocumentTitle !== undefined) {
			this._shouldManageDocumentTitle = options.manageDocumentTitle;
		}
	},
	
	_init : function() {
	   	if (this._subscribed)
	   		return;
	   	this._subscribed = true;
	   	this._previousInput = dojo.hash();
	   	var input = this;
	   	// I'm beginning to think this is a bad idea, that we shouldn't be the ones monitoring hashes.
	   	// See WorkItem 408
	   	dojo.subscribe("/dojo/hashchange", input, function() {
	   	    // if we are restoring the hash to what we think it should be, ignore
	   	    if (dojo.hash() === this._previousInput)
	   	    	return;
	   		this._previousInput = dojo.hash();
	   		this._serviceRegistration.dispatchEvent("inputChanged", this._getInputSync());
	   		this._triggeringEvent = null;
	   	});
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