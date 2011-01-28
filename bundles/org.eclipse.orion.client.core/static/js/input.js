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
		this.dirty = false;
	   	if (this._subscribed)
	   		return;
	   	this._subscribed = true;
	   	this._previousInput = dojo.hash();
	   	var input = this;
	   	// I'm think this is a bad idea, that we shouldn't be the ones monitoring hashes.
	   	// See https://bugs.eclipse.org/bugs/show_bug.cgi?id=334195
	   	dojo.subscribe("/dojo/hashchange", input, function() {
			// if we are restoring the hash to what we think it should be, ignore
			if (dojo.hash() === this._previousInput)
				return;
			if (this._okToChange(this._previousInput, dojo.hash())) {
	   			this._previousInput = dojo.hash();
	   			this._serviceRegistration.dispatchEvent("inputChanged", this._getInputSync());
	   			this._triggeringEvent = null;
	   		} else {
	   			// restore hash, user rejected the change
	   			dojo.hash(this._previousInput);
	   		}
	   	
	   	});
	},
	
	_getInputSync: function() {
		return dojo.hash();
	},
		
	getInput : function(onDone) {
		onDone(this._getInputSync());
	},
		
	setInput : function(fileURI, event) {
		if (fileURI !== dojo.hash() && this._okToChange(this._previousInput, fileURI)) {
			this._triggeringEvent = event;
			dojo.hash(fileURI);
		}
	},
	
	// Strip out all line number and char info so we don't prompt when simply navigating
	// the file.  This is starting to get ridiculous.  See
	// https://bugs.eclipse.org/bugs/show_bug.cgi?id=334195
	_okToChange : function(oldURI, newURI) {
		if (this.dirty) {
			var oldStripped = eclipse.util.getPositionInfo(oldURI).filePath;
			var newStripped = eclipse.util.getPositionInfo(newURI).filePath;
			if (oldStripped !== newStripped) 
				return window.confirm("There are unsaved changes.  Do you still want to navigate away?");
		}
		return true;
	},
	
	setDirty : function(isDirty) {
		this.dirty = isDirty;
	},

	setTitle : function(title) {
		if (this._shouldManageDocumentTitle) {
			window.document.title = title;
		}
	}
};