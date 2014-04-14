/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global console:true define*/
define([
	'chai/chai',
	'orion/Deferred',
	'webtools/cssValidator'
], function(chai, Deferred, CssValidator) {
	var assert = chai.assert;	
	var validator = new CssValidator.CssValidator();
	
	var context = {
		text: "",
		/**
		 * gets the text
		 */
		getText: function() {
			return new Deferred().resolve(this.text);
		}
	};
		
	/**
	 * @name tearDown
	 * @description Resets the test state between runs, must explicitly be called per-test
	 * @function
	 * @public
	 */
	function tearDown() {
		context.text = "";
	}
	
	var Tests = {};
		
	/**
	 * Tests a bad property decl
	 */
	Tests.test_bad_prop1 = function() {
			context.text = "h1:{f: 22px}";
			return validator.computeProblems(context).then(function(result) {
				try {
					var problems = result.problems;
					assert(problems != null, 'There should be CSS problems');
					assert(problems.length === 1, 'There should only be one CSS problem');
					assert.equal(problems[0].description, 'Unknown property \'f\'.', 'problem text is wrong');
				}
				finally {
					tearDown();
				}
			});
	};
	
	return Tests;
});