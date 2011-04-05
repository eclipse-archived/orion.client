/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
 /*global dojo */
 
/**
 * @namespace The global container for orion APIs.
 */ 
var orion = orion || {};

/**
 * Selection 
 * @class Can provide one or more selections describing objects of interest.  Used to
 *		establish input and output relationships between components.  For example, the selection
 *		in one component can serve as the input of another component.
 */
orion.Selection = function(serviceRegistry) {
	this._serviceRegistry = serviceRegistry;
	this._serviceRegistration = serviceRegistry.registerService("Selection", this);
	this._selections = [];
};
 
orion.Selection.prototype = {
	// consumer
	getSelection : function(onDone) {
		onDone(this._getSingleSelection());
	},
	
	getSelections: function(onDone) {
		return this._selections;
	},
	
	_getSingleSelection: function() {
		if (this._selections && this._selections.length > 0) {
			return this._selections[0];
		} 
		return null;
	},
	
	// provider
	setSelections: function(itemOrArray) {
		if (dojo.isArray(itemOrArray)) {	
			this._selections = itemOrArray;
		} else if (itemOrArray) {
			this._selections = [itemOrArray];
		} else {
			this._selections = null;
		}
		this._serviceRegistration.dispatchEvent("selectionChanged", this._getSingleSelection(), this._selections);
	}
};