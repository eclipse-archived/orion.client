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
	'i18n!orion/shell/nls/messages'
], function(PluginProvider, messages) {
	var headers = {
		name: "Orion Shell Page Service",
		version: "1.0",
		description: "This plugin integrates access to Orion's Shell page into other Orion pages."
	};

	var provider = new PluginProvider(headers);
	
	provider.registerService("orion.navigate.command", {}, {
		name: messages["Shell"],
		id: "eclipse.shell.open",
		tooltip: messages["Open Shell page"],
		validationProperties: [{
			source: "ChildrenLocation|ContentLocation",
			variableName: "ShellLocation",
			replacements: [{pattern: "\\?depth=1$", replacement: ""}] 
		}],
		uriTemplate: "{+OrionHome}/shell/shellPage.html#{,ShellLocation}",
		forceSingleItem: true
	});
	provider.registerService("orion.page.link.related", null, {
		id: "eclipse.shell.open",
		category: "shell",
		order: 10 // First link in Shell category
	});

	provider.connect();
});