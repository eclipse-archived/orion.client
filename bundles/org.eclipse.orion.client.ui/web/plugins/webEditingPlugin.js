/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
define([
	'orion/plugin',
	'i18n!orion/nls/messages'
], function(PluginProvider, messages) {

	function connect() {
		var headers = {
			name: "Orion Web Editing Plugin",
			version: "1.0",
			description: "This plugin provides editor link support for the navigator."
		};
		var pluginProvider = new PluginProvider(headers);
		registerServiceProviders(pluginProvider);
		pluginProvider.connect();
	}

	function registerServiceProviders(provider) {
		provider.registerService("orion.core.contenttype", {}, {
			contentTypes:
				// Text types
				[{	id: "text/plain",
					name: "Text",
					extension: ["txt"],
					imageClass: "file-sprite-text modelDecorationSprite"
				},
				{	id: "application/xml",
					"extends": "text/plain",
					name: "XML",
					extension: ["xml"],
					imageClass: "file-sprite-xml modelDecorationSprite"
				},
				{	id: "text/x-markdown",
					"extends": "text/plain",
					name: "Markdown",
					extension: ["md"]
				},
				{	id: "text/conf",
					"extends": "text/plain",
					name: "Conf",
					extension: ["conf"]
				},
				{	id: "text/sh",
					"extends": "text/plain",
					name: "sh",
					extension: ["sh"]
				},
				{	id: "application/pdf",
					"extends": "application/browser-renderable",
					name: "PDF",
					extension: ["pdf"]
				},
				// binary files
				{	id: "application/octet-stream",
					name: "octet-stream",
					extension: ["exe", "bin", "doc", "ppt"]
				},
				{	id: "application/zip",
					"extends": "application/octet-stream",
					name: "ZIP",
					extension: ["war", "jar", "zip", "rar"]
				},
				// Image types
				{	id: "image/gif",
					name: "GIF",
					extension: ["gif"],
					imageClass: "file-sprite-image modelDecorationSprite"
				},
				{	id: "image/jpeg",
					name: "JPG",
					extension: ["jpg", "jpeg", "jpe"],
					imageClass: "file-sprite-image modelDecorationSprite"
				},
				{	id: "image/ico",
					name: "ICO",
					extension: ["ico"],
					imageClass: "file-sprite-image modelDecorationSprite"
				},
				{	id: "image/png",
					name: "PNG",
					extension: ["png"],
					imageClass: "file-sprite-image modelDecorationSprite"
				},
				{	id: "image/tiff",
					name: "TIFF",
					extension: ["tif", "tiff"],
					imageClass: "file-sprite-image modelDecorationSprite"
				},
				{	id: "image/svg",
					name: "SVG",
					extension: ["svg"],
					imageClass: "file-sprite-image modelDecorationSprite"
				}]
			});
	
		provider.registerService("orion.edit.editor", {}, {
			id: "orion.editor",
			"default": true, 
			name: messages["Orion Editor"],
			nls: "orion/nls/messages",
			uriTemplate: "../edit/edit.html#{,Location,params*}",
			orionTemplate: "../edit/edit.html#{,Location,params*}",
			validationProperties: [{
				source: "!Projects" // Filter out workspace;
			}]});
	
		// only providing excludedContentTypes for orion.editor because we want
		// to attempt to open files with unknown content types with it for now
		// e.g. A text file with no extension is currently of an unknown content
		// type, we want to use the orion.editor to open it
		provider.registerService("orion.navigate.openWith", {}, {
			editor: "orion.editor",
			excludedContentTypes: ["image/*", "application/zip"]});
	
		var MARKDOWN_VIEWER_ID = "orion.viewer.markdown";
		provider.registerService("orion.edit.editor", {}, {
			id: MARKDOWN_VIEWER_ID,
			name: messages["Orion Markdown Viewer"],
			nls: "orion/nls/messages",
			uriTemplate: "../edit/edit.html#{,Location,params*},editor=" + MARKDOWN_VIEWER_ID});
	
		provider.registerService("orion.navigate.openWith", {}, {
				editor: MARKDOWN_VIEWER_ID,
				contentType: ["text/x-markdown"]});
	
		var MARKDOWN_EDITOR_ID = "orion.editor.markdown";
		provider.registerService("orion.edit.editor", {}, {
			id: MARKDOWN_EDITOR_ID,
			name: messages["Orion Markdown Editor"],
			nls: "orion/nls/messages",
			"default": true,
			uriTemplate: "../edit/edit.html#{,Location,params*},editor=" + MARKDOWN_EDITOR_ID});
	
		provider.registerService("orion.navigate.openWith", {}, {
				editor: MARKDOWN_EDITOR_ID,
				contentType: ["text/x-markdown"]});
	
		// open file with browser, no associated orion.navigate.openWith command means that any content type is valid
		if (!parent.window.isElectron) {
			provider.registerService("orion.edit.editor", {}, {
				id: "orion.viewer.raw",
				name: messages["Browser"],
				nls: "orion/nls/messages",
				uriTemplate:  "{+Location}",
				validationProperties: [{
					source: "!Projects" // Filter out workspace; Raw only applies to regular files and folders.
				}]
			});
		}
	}

	return {
		connect: connect,
		registerServiceProviders: registerServiceProviders
	};
});
