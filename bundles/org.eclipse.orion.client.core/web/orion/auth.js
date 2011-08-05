/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define dojo dijit handleAuthenticationError */
 /*
	Authentication and authorization error handling. Adds methods that handle 401 and 403 responses for 
	XHR calls.

	To handle 401 and 403 error add the following line to 'error' function in your dojo.xhr<method> request,
	where <method> is the method you would like to call
		handle<method>AuthenticationError(this, ioArgs);

 */

define(['dojo', 'orion/globalCommands', 'dojo/date/locale'], function(dojo, mGlobalCommands) {

var authenticationInProgress = false;

var forbiddenAccessDlg;

dojo.addOnLoad(function () {
	
	// work around global problems in auth2 -- FIXME!!!
	window.dojo = dojo;
	window.eclipse = window.eclipse || {};
	eclipse.globalCommandUtils = mGlobalCommands; 

	dojo.xhrGet({
		url: "/auth2",
		handleAs: 'javascript',
        //sync:true, the javascript load is asynchronous already so not sure this would work -- we should also avoid sync calls!
        headers: {
			"Orion-Version" : "1"
		}
	});
});

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
		if (typeof forbiddenAccessDlg === "undefined") {
			forbiddenAccessDlg = new dijit.Dialog({
		        title: "Forbidden access"
		    });
		}
		var message = error.message;
		if (error.responseText) {
			var responseObject = JSON.parse(error.responseText);
			message = responseObject.Message || error.message;
		}
		forbiddenAccessDlg.set("content", message);
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
			// TODO add error handling here
			window.open(dojo.fromJson(error.responseText).SignInLocation, 
					'Login Window', 'width=400, height=200');
		}
	}
}
return {
	handleGetAuthenticationError : handleGetAuthenticationError,
	handlePostAuthenticationError : handlePostAuthenticationError,
	handleDeleteAuthenticationError : handleDeleteAuthenticationError,
	handlePutAuthenticationError : handlePutAuthenticationError,
	handleAuthenticationError : handleAuthenticationError
};

});