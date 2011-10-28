/******************************************************************************* 
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation 
 ******************************************************************************/

/*jslint */
/*global define*/

define(["orion/assert", "orion/editor/editor"],
		function(assert, mEditor) {
	var tests = {};
	
	// ************************************************************************************************
	// Test supporting util methods
	
	// Test our implementation of "bind"
	tests["test Editor - bind"] = function() {
		var binder = mEditor.util.bind;
		
		// Test: bound function gets proper context
		var context1 = {},
		    bound1 = binder.call(
				function () {
					assert.strictEqual(this, context1);
				}, context1);
		bound1();
		
		// Test: argument is passed to bound function
		var context2 = {},
		    bound2 = binder.call(
				function(arg1) {
					assert.strictEqual(this, context2);
					assert.strictEqual(arg1, "foo");
				}, context2);
		bound2("foo");
		
		// Test: fixed arguments are passed to bound function
		var context3 = {},
		    bound3 = binder.call(
				function(arg1, arg2) {
					assert.strictEqual(context3, this);
					assert.strictEqual(arg1, "a");
					assert.strictEqual(arg2, "b");
				}, context3, "a", "b");
		bound3();
		
		// Test: fixed arguments prepend arguments passed to bound function
		var context4 = {},
		    bound4 = binder.call(
				function(arg1, arg2, arg3, arg4) {
					assert.strictEqual(context4, this);
					assert.strictEqual(arg1, "a");
					assert.strictEqual(arg2, "b");
					assert.strictEqual(arg3, "c");
					assert.strictEqual(arg4, "d");
				}, context4, "a", "b");
		bound4("c", "d");
	};
	
	return tests;
});