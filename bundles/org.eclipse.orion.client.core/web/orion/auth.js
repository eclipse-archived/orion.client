/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define eclipse window handleAuthenticationError localStorage*/
 /*
	Authentication and authorization error handling. Adds methods that handle 401 and 403 responses for 
	XHR calls.

	To handle 401 and 403 error add the following line to 'error' function in your service request,
		handleAuthenticationError(error, <optional retry function>)

 */

define(['dojo', 'dijit', 'orion/globalCommands', 'dojo/date/locale', 'orion/widgets/LoginDialog'], function(dojo, dijit, mGlobalCommands) {

	var forbiddenAccessDlg;
	var pendingAuthentication = {};
	
	dojo.addOnLoad(function () {
		
		// work around global problems in auth2 -- FIXME!!!
		window.dojo = dojo;
		window.eclipse = window.eclipse || {};
		eclipse.globalCommandUtils = mGlobalCommands; 
	});
	
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
						mGlobalCommands.setPendingAuthentication(pendingAuthentication);
						if (retry) {
							retry();
						}
					};
					
					window.addEventListener("storage", storageListener, false);
					
					if(responseObj.SignInKey){
										
						pendingAuthentication[responseObj.SignInKey] = responseObj;
						mGlobalCommands.setPendingAuthentication(pendingAuthentication);
					}
					
				} catch (e){
				}
		}
	}
	return {
		handleAuthenticationError : handleAuthenticationError
	};

});
