/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

var messages = [{response :[{"testCaseName":"TextModelTestCase111","testName":"test_Empty","result":"passed","message":"","log":"","time":0,"data":{}},{"testCaseName":"TextModelTestCase","testName":"test_Insert","result":"passed","message":"","log":"","time":2,"data":{}},{"testCaseName":"PerformanceTestCase","testName":"test_pageDownScrolling","result":"error","message":"{\"message\":\"editor is not defined\",\"name\":\"ReferenceError\",\"fileName\":\"http://localhost:8080/file/C/org.eclipse.orion.client/bundles/org.eclipse.orion.client.editor/web/js-tests/test-performance.js\",\"lineNumber\":18,\"number\":null,\"description\":\"undefined\",\"stack\":\"()@http://localhost:8080/file/C/org.eclipse.orion.client/bundles/org.eclipse.orion.client.editor/web/js-tests/test-performance.js:18\\u000a(\\\"PerformanceTestCase\\\",(function () {}),\\\"test_pageDownScrolling\\\")@http://localhost:8080/jstest/jstestdriver/runner.js:3916\\u000abound(\\\"PerformanceTestCase\\\",(function () {}),\\\"test_pageDownScrolling\\\")@http://localhost:8080/jstest/jstestdriver/runner.js:1009\\u000a(\\\"PerformanceTestCase\\\",(function () {}),[object Array],bound,bound,(function () {testBreather(runNextConfiguration_);}))@http://localhost:8080/jstest/jstestdriver/runner.js:3853\\u000a([object Object],bound,(function () {testBreather(runNextConfiguration_);}))@http://localhost:8080/jstest/jstestdriver/runner.js:3886\\u000a([object Object],bound,(function () {testBreather(runNextConfiguration_);}))@http://localhost:8080/jstest/jstestdriver/runner.js:4249\\u000a(\\\"runTestConfiguration\\\",[object Object])@http://localhost:8080/jstest/jstestdriver/runner.js:1273\\u000a([object Object],bound,(function () {testBreather(runNextConfiguration_);}))@http://localhost:8080/jstest/jstestdriver/runner.js:1363\\u000a([object Object],bound,(function () {testBreather(runNextConfiguration_);}))@http://localhost:8080/jstest/jstestdriver/runner.js:2194\\u000a(2)@http://localhost:8080/jstest/jstestdriver/runner.js:2173\\u000abound(2)@http://localhost:8080/jstest/jstestdriver/runner.js:1009\\u000a\"}","log":"","time":4,"data":{}}]}
                ];
var counter = 0;

function postContinue() {
	if (counter > messages.length - 1) {
		postMessageToOwner("close", []);
	} else {
		postMessageToOwner("continue", messages[counter]);
		counter++;
		setTimeout(function(){postContinue();},100);
	}
}

var startTesting = function(files , closeCallBack , continuecallBack){
	//setTimeout(function(){postContinue();},100);
	setTimeout(function(){postMessageToOwner("close", messages[counter]);},100);
};

var postMessageToOwner = function( mType , mResponse){
	var message = {type:mType , response:mResponse};
	if (window.opener) {
		window.opener.postMessage(JSON.stringify(message),"*");
	} else if (window.content) {
		window.content.postMessage(JSON.stringify(message),"*");
	}
};
