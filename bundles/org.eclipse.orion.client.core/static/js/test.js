/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
var orion = orion || {};
orion.Test = (function(assert) {
	var exports = {};
	var AssertionError = assert.AssertionError;
	
	function _run(obj) {
		var failures = 0;
		
	   for (var property in obj) {
	        if (property.match(/^test.+/)) {
	        	var test = obj[property];
	        	if (typeof test === "function") {
	        		try {
	        			test();
	        		} catch (e) {
        				failures++;
	        			if (e instanceof AssertionError) {
	        				console.log(e.toString());
	        			} else {
	        				console.err(e);
	        			}
	        		}
	        	} else if (typeof test === "object") {
	        		failures += _run(test);
	        	}
        	} 
        }
	   return failures;
	}
	
	
	exports.run = function(obj) {
		if (!obj || typeof obj !== "object")
			throw Error("not a test object");
		
		return _run(obj);
	};

	return exports;
}(orion.Assert));
