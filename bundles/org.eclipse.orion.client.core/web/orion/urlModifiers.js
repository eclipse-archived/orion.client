/*******************************************************************************
 * @license
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/

/*eslint-env browser, amd*/
define(function() {

	var modifiers = [];

	function addModifier(value) {
		if (typeof value === "function") {
			modifiers.push(value);
		}
	}
	
	function removeModifier(value) {
		if (typeof value === "function") {
			for (var i = 0; i < modifiers.length; i++) {
				if (modifiers[i] === value) {
					modifiers.splice(i, 1);
					return;
				}
			}
		}
	}
	
	function modifyUrl(value) {
		var result = value;
		modifiers.forEach(function(current) {
			result = current(result) || result;
		});
		return result;
	}

	return {
		addModifier: addModifier,		
		removeModifier: removeModifier,
		modifyUrl: modifyUrl
	};
});
