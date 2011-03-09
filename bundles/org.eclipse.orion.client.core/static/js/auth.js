/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit handleAuthenticationError */
 /*
	Authentication and authorization error handling. Adds methods that handle 401 and 403 responses for 
	XHR calls.

	To handle 401 and 403 error add the following line to 'error' function in your dojo.xhr<method> request,
	where <method> is the method you would like to call
		handle<method>AuthenticationError(this, ioArgs);

 */
 
var authenticationInProgress = false;

var forbiddenAccessDlg;

dojo.addOnLoad(function () {
	dojo.xhrGet({
		url: "/auth2",
		handleAs: 'javascript',
        sync:true,
        headers: {
			"Orion-Version" : "1"
		}
	});
});


//function handleGetAuthenticationError(xhrArgs, ioArgs) {
//	handleAuthenticationError(ioArgs.xhr, function(){
//		dojo.xhrGet(xhrArgs); // retry GET
//	});
//}

function handleGetAuthenticationError(xhrArgs, ioArgs, cb, eb) {
	handleAuthenticationError(ioArgs.xhr, function(){
		var dfd = dojo.xhrGet(xhrArgs); // retry GET
		if (cb) {
			dfd.then(cb, eb); // add callback and errback
		}
	});
}

function handlePostAuthenticationError(xhrArgs, ioArgs) {
	handleAuthenticationError(ioArgs.xhr, function(){
		dojo.xhrPost(xhrArgs); // retry POST
	});
}

function handleDeleteAuthenticationError(xhrArgs, ioArgs) {
	handleAuthenticationError(ioArgs.xhr, function(){
		dojo.xhrDelete(xhrArgs); // retry DELETE
	});
}

function handlePutAuthenticationError(xhrArgs, ioArgs) {
	handleAuthenticationError(ioArgs.xhr, function(){
		dojo.xhrPut(xhrArgs); // retry PUT
	});
}

/**
 * Handles authentication problems coming from remote xhr service calls.
 * @param error The error object returned by xhr
 * @param retry A function to invoke after authentication to retry the server request.
 */
function handleAuthenticationError(error, retry) {
	if (error.status === 403) { 
		if (forbiddenAccessDlg === null) {
			forbiddenAccessDlg = new dijit.Dialog({
		        title: "Forbidden access"
		    });
		}
		
		forbiddenAccessDlg.set("content", error.message);
		forbiddenAccessDlg.show();
	}
	if (error.status === 401) { 
		var handle = dojo.subscribe("/auth", function(message){
			retry();
			dojo.unsubscribe(handle); // ... but only once
		});
		if (!authenticationInProgress) {
			authenticationInProgress = true;
			// open popup and add OP response handler
			eval(error.responseText);
		}
	}
}