/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define(["orion/plugin","orion/Deferred"], function(PluginProvider, Deferred) {
	var headers = {
		name: "Hover Test Plugin (2)",
		version: "1.0", //$NON-NLS-0$
		description: "Second Plugin to test Hover Help",
	};
	var provider = new PluginProvider(headers);

	function getHoverInfo(editorContext, context) {
		var resultWrapper = new Deferred();
		window.setTimeout(function (){
			resultWrapper.resolve("< Some auto-corect links...markup? >");
		}, 750);
		return resultWrapper;
	}

	var serviceImpl = {
		computeHoverInfo: function(editorContext, context) {
			return getHoverInfo(editorContext, context);
		}
	};
	var properties = {
		name: "Hover Help",
		tipTitle: "Auto Correct",
		contentType: ["text/css"]
	};
	provider.registerService("orion.edit.hover", serviceImpl, //$NON-NLS-0$
	properties);
	provider.connect();
});