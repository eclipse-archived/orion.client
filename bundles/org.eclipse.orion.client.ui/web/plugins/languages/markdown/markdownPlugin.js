/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global esprima*/
/*jslint amd:true*/
define(['orion/plugin', 'orion/editor/stylers/text_x-markdown/syntax'], function(PluginProvider, mMD) {

	/**
	 * Plug-in headers
	 */
	var headers = {
		name: "Orion Markdown Tool Support",
		version: "1.0",
		description: "This plugin provides Markdown tools support for Orion."
	};
	var provider = new PluginProvider(headers);

	/**
	 * Register the Markdown content type
	 */
	provider.registerServiceProvider("orion.core.contenttype", {}, {
		contentTypes: [
			{	id: "text/x-markdown",
				"extends": "text/plain",
				name: "markdown",
				extension: ["md"]
			}
		] 
	});

	/**
	 * Register syntax styling
	 */
	provider.registerServiceProvider("orion.edit.highlighter", {}, mMD.grammars[mMD.grammars.length - 1]);

	provider.connect();
});
