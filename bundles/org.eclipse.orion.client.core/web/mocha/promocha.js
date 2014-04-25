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
/*jslint amd:true*/
/*global it:true*/

/*
 * A shim allowing mocha tests to return a promise. Works by returning a wrapped `it()`
 * function that is promise-aware. This shim should be removed once mocha is updated to 1.18.x.
 */
define([
	"mocha/mocha"
], function() {
	function wrap(obj, funcName) {
		if (typeof obj[funcName] !== "function")
			throw new Error("Could not find " + funcName + "()");

		var original = obj[funcName];
		return function(name, test) {
			original(name, function(done) {
				var result = test(done); // Traditional case: test calls done()
				if (result && result.then) {
					// Promise case
					result.then(done.bind(null, undefined /*no error*/), done /*error*/);
				}
				// mocha will handle the timeout if result never calls back.
			});
		};
	}

	var global = new Function("return this;")();
	return {
		it: wrap(global, "it")
	};
});