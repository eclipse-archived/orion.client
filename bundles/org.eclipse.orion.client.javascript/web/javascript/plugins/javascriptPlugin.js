/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global URL console*/
/*jslint amd:true browser:true*/
define([
	'orion/EventTarget',
	'orion/URL-shim'
], function(EventTarget, _) {
	// Talk directly to the framework message plumbing
	var framework;
	if (window !== window.parent)
		framework = window.parent;
	else
		framework = window.opener;
	addEventListener("message", onFrameworkMessage);

	// Start the worker
	var worker = new Worker(new URL("javascriptPluginWorker.js", window.location.href).href);
	worker.addEventListener("message", onWorkerMessage);
	worker.addEventListener("error", onWorkerError);

	function onWorkerError(err) {
		console.log('javascriptPluginWorker encountered an error:');
		console.log(err);
	}

	function onWorkerMessage(event) {
		var msg = event.data;
		// Plugin-related messages have either a "method" field (for regular messages) or an "id" field (for errors)
		if (msg && (msg.method || msg.id)) {
			framework.postMessage(event.data, "*");
			return;
		}
	}

	function onFrameworkMessage(event) {
		if (event.source !== framework) {
			return;
		}
		worker.postMessage(event.data);
	}
});
