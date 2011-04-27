/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/* Globals */

loadFailMock = {
	load : {success: false},
	testName : {testNames:["TC.TN" , "TC2.TN", "TC.TN1" , "TC2.TN1"]},
	runTest : {
		"TC.TN":{success:true, testName:"TC.TN", stack: null},
		"TC2.TN":{success:false, testName:"TC2.TN", stack: "AssertError: expected true but was false\n    at fail (http://localhost:8080/file/QIUIkqv5AB8QAqmCzGMD6Q/org.eclipse.e4.webide/static/js/jsunit-test/jsunit-test-stack-renderer.js:23:13)\n  at assertTrue (http://localhost:8080/javascript/runner.css:342:10)\n   at [object Object].testGreet3 (http://localhost:8080/javascript/GreeterTest.js:22:2)\n     at [object Object].runTest (http://localhost:8080/javascript/runner.js:3916:32)\n     at bound (http://localhost:8080/javascript/runner.js:1009:17)\n    at [object Object].runTestLoop_ (http://localhost:8080/javascript/runner.js:3853:12)\n    at [object Object].runTestConfiguration (http://localhost:8080/javascript/runner.js:3881:8)\n    at [object Object].runTestConfiguration (http://localhost:8080/javascript/runner.js:4248:33)\n     at [object Object].dispatch_ (http://localhost:8080/javascript/runner.js:1273:26)\n     at [object Object].runTestConfiguration (http://localhost:8080/javascript/runner.js:1363:8)"},
		"TC.TN1":{success:true, testName:"TC.TN", stack: null},
		"TC2.TN1":{success:false, testName:"TC2.TN", stack: "AssertError: expected true but was false\n    at fail (http://localhost:8080/javascript/runner.js:234:13)\n  at assertTrue (http://localhost:8080/javascript/runner.css:342:10)\n   at [object Object].testGreet3 (http://localhost:8080/javascript/GreeterTest.js:22:2)\n     at [object Object].runTest (http://localhost:8080/javascript/runner.js:3916:32)\n     at bound (http://localhost:8080/javascript/runner.js:1009:17)\n    at [object Object].runTestLoop_ (http://localhost:8080/javascript/runner.js:3853:12)\n    at [object Object].runTestConfiguration (http://localhost:8080/javascript/runner.js:3881:8)\n    at [object Object].runTestConfiguration (http://localhost:8080/javascript/runner.js:4248:33)\n     at [object Object].dispatch_ (http://localhost:8080/javascript/runner.js:1273:26)\n     at [object Object].runTestConfiguration (http://localhost:8080/javascript/runner.js:1363:8)"}
	}
};
var uTestResult;
var uTestNavigator;
var testConfig;


function createResModel(root ,rootId ,filter) {
    return new eclipse.TestResultModel(root,rootId,filter);
}

function createNavModel(root , rootId  ,reg) {
    return new eclipse.TestNavigatorModel(root,rootId , reg);
}

function handleMessage(evt) {
	uTestResult.handleMessage(evt);
}

dojo.addOnLoad(function(){
	// create registry and instantiate needed services
	serviceRegistry = new eclipse.ServiceRegistry();
	new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	new eclipse.TestConfigService({serviceRegistry: serviceRegistry});
	

	//Create the unit test result tree
	//It is a container of 3 separated component :
	// A indicator , rendering the general test result : test runed , failures , state bar (green :success ,  red : failed)
	// A test result pane , rendering a tree structured test suite - case - test 
	// A stack renderer  , rendering the failure stack of a selected test .
	var failureStackRenderer = new eclipse.TestStackRenderer();
    var resRenderer = new eclipse.TestResultRenderer({checkbox: false, stackRenderer:failureStackRenderer });
    var statueIndicator = new eclipse.TestIndicator();
	uTestResult = new eclipse.UnitTestResult(resRenderer, createResModel,
											{resultDivId: eclipse.uTestConsts.RESULT_DIV_ID, 
											 resultTreeId: eclipse.uTestConsts.RESULT_TREE_ID,
											 indicator:statueIndicator});
	
	
	// Create the unit test navigator and load the file workspace
    var navRenderer = new eclipse.TestNavigatorRenderer({checkbox: true});
	uTestNavigator = new eclipse.TestNavigator(navRenderer, createNavModel, serviceRegistry);
   	uTestNavigator.loadResourceList(dojo.hash());
   	
	testConfig = new eclipse.TestConfigurator({serviceRegistry: serviceRegistry, navigator: uTestNavigator , resultController:uTestResult});
	
	dojo.subscribe("/dojo/hashchange", navRenderer, function() {
	   	uTestNavigator.loadResourceList(dojo.hash());
	});
	window.addEventListener("message", handleMessage, false);
});

function createNewConfig(){
	testConfig.showNewItemDialog();
}

function deleteTestConfig(){
	testConfig.deleteConfig();
}

function editTestConfig(){
	testConfig.updateConfig();
}

function loadTestResultMock(){
	uTestResult.loadTestResultMock(loadFailMock);
}
	
function loadTestResultFiles(){
	//var fileNames =  uTestNavigator._renderer.getSelectedURL(true);
	//var fileNames = 
	testConfig.testCurrentConfig(function(arg){uTestResult.loadTestResultFiles(arg);} );
	
}
