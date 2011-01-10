/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

 /*
 	Authentication error handling. Adds methods that handle 401 responses for 
 	XHR calls.
 	
 	To handle 401 error add the following line to 'error' function in your dojo.xhr<method> request,
 	where <method> is the method you would like to call
 		handle<method>AuthenticationError(this, ioArgs);

 */

var authenticationInProgress = false;

function handleGetAuthenticationError(xhrArgs, ioArgs) {
	handleAuthenticationError(ioArgs, function(){
		dojo.xhrGet(xhrArgs); // retry GET
	});
}

function handleGetAuthenticationError(xhrArgs, ioArgs, cb, eb) {
	handleAuthenticationError(ioArgs, function(){
		var dfd = dojo.xhrGet(xhrArgs); // retry GET
		dfd.then(cb, eb); // add callback and errback
	});
}

function handlePostAuthenticationError(xhrArgs, ioArgs) {
	handleAuthenticationError(ioArgs, function(){
		dojo.xhrPost(xhrArgs); // retry POST
	});
}

function handleDeleteAuthenticationError(xhrArgs, ioArgs) {
	handleAuthenticationError(ioArgs, function(){
		dojo.xhrDelete(xhrArgs); // retry DELETE
	});
}

function handlePutAuthenticationError(xhrArgs, ioArgs) {
	handleAuthenticationError(ioArgs, function(){
		dojo.xhrPut(xhrArgs); // retry PUT
	});
}

function handleAuthenticationError(ioArgs, channelListener) {
	if (ioArgs.xhr.status == 401) { 
		if (ioArgs.xhr.getResponseHeader("WWW-Authenticate") == "OpenID") {
			var handle = dojo.subscribe("/auth", function(message){
				channelListener(); // retry...
				dojo.unsubscribe(handle); // ... but only once
			});
			if (!authenticationInProgress) {
				authenticationInProgress = true;
				// open popup and add OP response handler
				eval(ioArgs.xhr.responseText);
			}
		} else if (ioArgs.xhr.getResponseHeader("WWW-Authenticate") == "BASIC") {
			/* Nothing to do here: 
			 * Browser catches the 401 error first and displays a browser specific login/password prompt. 
			 * Any subsequent, unauthenticated XHR calls are blocked until the user enters her password.
			 * If authentication succeed all awaiting calls pass through, otherwise the prompt will pop up again.
			 * On cancel, the prompt for the next call in the row will be displayed.
			 * */
		} else if (ioArgs.xhr.getResponseHeader("WWW-Authenticate") == "FORM") {
			var handle = dojo.subscribe("/auth", function(message){
				channelListener(); // retry...
				dojo.unsubscribe(handle); // ... but only once
			});
			if (!authenticationInProgress) {
				authenticationInProgress = true;
				// open popup and add OP response handler
				eval(ioArgs.xhr.responseText);
			}
		}
	}
}