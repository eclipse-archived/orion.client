/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var eclipse = eclipse || {};
eclipse.testService = {
	createTestSuite: function(mock) {
		return new eclipse.testSuite(mock);
	}
};

eclipse.testSuite = function(mock) {
	this.mock = mock || null;
};

eclipse.testSuite.prototype.load = function(files, callback) {
	if (this.mock) {
		var name = this.mock.load;
		setTimeout(function(){callback(name);} , 0);
	} else {
		setTimeout(callback({
			success: true
		}), 0)
	}
};

eclipse.testSuite.prototype.testNames = function(callback) {
	if (this.mock) {
		var name = this.mock.testName;
		setTimeout(function(){callback(name);} , 0);
	} else {
		setTimeout(callback({
			testNames: [ "TestCase1.testName1", "TestCase1.testName2", "TestCase2.testName1" ]
		}), 0)
	}
};

eclipse.testSuite.prototype.runTest = function(testName, callback) {
	if (this.mock) {
		var name = this.mock.runTest[testName];
		setTimeout(function(){callback(name);} , 0);
	} else {
		setTimeout(callback({
			success: true,
			testName: testName,
			stack: null
		}), 0)
	}
};

// commented out by Simon
/*
eclipse.testService.loadFailMock = {
	load : {success: false},
	testName : {testNames:[]},
	runTest : {
		"TC.TN":{success:true, testName:"TC.TN", stack: null},
		"TC2.TN":{success:false, testName:"TC2.TN", stack: "somestack"}
	}
};

var suite = eclipse.testService.createTestSuite();
suite.load([], function(result) {console.log(JSON.stringify())});
suite.testNames(function(result) {console.log(JSON.stringify())});
suite.runTest("TC.TN", function(result) {console.log(JSON.stringify())});
suite.runTest("TC2.TN", function(result) {console.log(JSON.stringify())});

var mockSuite = eclipse.testService.createTestSuite(loadFailMock);
mockSuite.load([], function(result) {console.log(JSON.stringify())});
mockSuite.testNames(function(result) {console.log(JSON.stringify())});
mockSuite.runTest("TC.TN", function(result) {console.log(JSON.stringify())});
mockSuite.runTest("TC2.TN", function(result) {console.log(JSON.stringify())});
*/

