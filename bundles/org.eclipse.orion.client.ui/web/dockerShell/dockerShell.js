/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 * 	IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global define window*/

define(["require", "orion/browserCompatibility", "orion/bootstrap", "orion/xhr", "orion/Deferred"],
	function(require, mBrowserCompatibility, mBootstrap, xhr, Deferred) {
	var pluginRegistry, serviceRegistry, preferences;

	var connected = false;
	mBootstrap.startup().then(function(core) {
		pluginRegistry = core.pluginRegistry;
		serviceRegistry = core.serviceRegistry;
		preferences = core.preferences;
		
		function startContainer() {
			return xhr("POST", "/docker", {  //$NON-NLS-1$ //$NON-NLS-0$
				headers: {
					"Orion-Version": "1", //$NON-NLS-1$ //$NON-NLS-0$
					"Content-Type": "application/json; charset=UTF-8" //$NON-NLS-1$ //$NON-NLS-0$
				},
				data: JSON.stringify({
					"dockerCmd": "start"
				}),
				timeout: 15000,
				handleAs: "json" //$NON-NLS-0$
			});
		}
			
		function stopContainer() {
			return xhr("POST", "/docker", {  //$NON-NLS-1$ //$NON-NLS-0$
				headers: {
					"Orion-Version": "1", //$NON-NLS-1$ //$NON-NLS-0$
					"Content-Type": "application/json; charset=UTF-8" //$NON-NLS-1$ //$NON-NLS-0$
				},
				data: JSON.stringify({
					"dockerCmd": "stop"
				}),
				timeout: 15000,
				handleAs: "json" //$NON-NLS-0$
			});
		}

		var output = document.getElementById("dockerPage-output"); //$NON-NLS-0$
		var input = document.getElementById("dockerCmd"); //$NON-NLS-0$
		var button = document.getElementById("dockerConnect"); //$NON-NLS-0$
		button.textContent="Connect";
		button.addEventListener("click", function(e) {
			if (!connected) {
				//connect
				startContainer().then(function(result) {
					window.console.log(result);
					input.addEventListener("keydown", function (e) { //$NON-NLS-0$
						if (e.keyCode === 13) {
							window.console.log("send cmd to docker servlet: \"" + input.value + "\"");
							input.value = "";
							e.preventDefault();
						}
					});
					button.textContent="Disconnect";
					connected = !connected;
					input.disabled = !connected;
				}, function(error){
					window.console.log(error);
				});
			} else {
				stopContainer().then(function(result) {
					button.textContent="Connect";
					connected = !connected;
					input.disabled = !connected;
				}, function(error){
					window.console.log(error);
				});
			}
			
		});
	});
});
