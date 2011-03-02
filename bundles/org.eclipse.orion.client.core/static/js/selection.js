/*******************************************************************************
 * Copyright (c) 2009, 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
 
/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * Selection Service
 * @class Service for providing selections
 */
eclipse.SelectionService = function(serviceRegistry) {
	this._serviceRegistry = serviceRegistry;
	this._serviceRegistration = serviceRegistry.registerService("ISelectionService", this);
	this.selections = null;
};
 
eclipse.SelectionService.prototype = {
	// provider
	_setSelection: function(selections) {
		this.selections = selections;
		this._serviceRegistration.dispatchEvent("selectionChanged", selections);

	},
	
	getSelection: function(onDone) {
		onDone(this.selections);
	}   
};