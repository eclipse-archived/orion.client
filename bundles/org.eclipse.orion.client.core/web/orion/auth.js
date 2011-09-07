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

define(['dojo', 'orion/globalCommands', 'dojo/date/locale', 'orion/widgets/LoginDialog'], function(dojo, mGlobalCommands) {

var authenticationInProgress = false;

var forbiddenAccessDlg;
var loginDialog;
var pendingAuthentication = {}

dojo.addOnLoad(function () {
	
	// work around global problems in auth2 -- FIXME!!!
	window.dojo = dojo;
	window.eclipse = window.eclipse || {};
	eclipse.globalCommandUtils = mGlobalCommands; 
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
		

			// open popup and add OP response handler
			// TODO add error handling here
			try{
				var responseObj = JSON.parse(error.responseText);
				var lastSignInKeyValue = localStorage.getItem(responseObj.SignInKey);
				
				var storageListener = function(e){
					var userItem = localStorage.getItem(responseObj.SignInKey);

					if(lastSignInKeyValue===userItem){
						return;
					}
					window.removeEventListener("storage", storageListener, false); // ... but only once
					delete pendingAuthentication[responseObj.SignInKey];
					if(loginDialog && loginDialog.open){
						loginDialog.setAuthenticationServices(pendingAuthentication);
					}
					retry();

				};
				
				window.addEventListener("storage", storageListener, false);
				
				if(responseObj.SignInKey){
					
					if (!loginDialog || !loginDialog.open) {
						
						loginDialog = new orion.widgets.LoginDialog();
						loginDialog.startup();
						dijit._curFocus = null; // Workaround for dojo bug #12534
						loginDialog.show();
						
					}
				
					pendingAuthentication[responseObj.SignInKey] = responseObj;
					loginDialog.setAuthenticationServices(pendingAuthentication);
				}
				
			} catch (e){
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
