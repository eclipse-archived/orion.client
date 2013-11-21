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

	var userName = "bog";

	mBootstrap.startup().then(function(core) {
		pluginRegistry = core.pluginRegistry;
		serviceRegistry = core.serviceRegistry;
		preferences = core.preferences;

		var output = document.getElementById("dockerPage-output"); //$NON-NLS-0$
		var input = document.getElementById("dockerCmd"); //$NON-NLS-0$
		
		function startContainer() {
			return xhr("GET", "/docker", {  //$NON-NLS-1$ //$NON-NLS-0$
				headers: {
					"Orion-Version": "1", //$NON-NLS-1$ //$NON-NLS-0$
					"Content-Type": "application/json; charset=UTF-8" //$NON-NLS-1$ //$NON-NLS-0$
				},
				timeout: 15000,
				handleAs: "json" //$NON-NLS-0$
			});
		}
		
		function execute() {
			window.console.log("send cmd to docker servlet: \"" + input.value + "\"");
			input.value = "";
		}
		
		function _keyDown(e){
			if (e.keyCode === 13) {
				execute();
				e.preventDefault();
			}
		}
		startContainer().then(function(result) {
			window.console.log(result);
			input.addEventListener("keydown", function (e) { //$NON-NLS-0$
				_keyDown(e);
			});
		}, function(error){
			window.console.log(error);
		});
	});
});
