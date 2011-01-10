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
 
/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * Dialog Service
 * @class Common dialog services
 */
eclipse.DialogService = function(serviceRegistry) {
	this.serviceRegistry = serviceRegistry;
};
 
eclipse.DialogService.prototype = {
	confirm : function(msg, onDone) {
		onDone(window.confirm(msg));;
	},
	openFiles : function(onDone) {
		// TODO
	}
};
	
		