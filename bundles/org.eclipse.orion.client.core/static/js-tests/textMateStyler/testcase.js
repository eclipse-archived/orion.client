/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global orion*/

//You don't need to extend TextMateStyler -- just use it

// create editor
// create TextMateStyler
// change editor contents
// check styled regions

var testcase = function(assert) {
	var tests = {};
	
	tests.createStyler = function() {
		// do whatever
		var expected = "fizz";
		var actual = "fizz";
		assert.equal(actual, expected);
	};
	
	tests["test style single keyword"] = function() {
		// do whatever
	};
	
	tests["test style after changing model"] = function() {
		// do whatever
	};
	
	tests["test grammar with unsupported regex feature"] = function() {
		// expect Error
	};
	
	tests["test grammar with other unsupported feature"] = function() {
		// expect Error
	};
	
	return tests;
}(orion.Assert);
