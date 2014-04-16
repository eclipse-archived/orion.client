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
/*global define*/
define([
	'orion/plugin'
], function(PluginProvider) {
	var headers = {
		name: "Terminal Page Service",
		version: "1.0",
		description: "This plugin integrates access to Orion's Terminal page into other Orion pages."
	};

	var provider = new PluginProvider(headers);
	
	provider.registerService("orion.navigate.command", {}, {
		nameKey: "Terminal",
		id: "eclipse.terminal.open",
		tooltipKey: "Open Terminal page",
		nls: "orion/terminal/nls/messages",
		validationProperties: [{
			source: "ChildrenLocation|ContentLocation",
			variableName: "TerminalLocation",
			replacements: [{pattern: "\\?depth=1$", replacement: ""}] 
		}],
		//uriTemplate: "{+OrionHome}/terminal/terminal.html#{,TerminalLocation}",
		uriTemplate: "{+OrionHome}/terminal/terminal.html",
		forceSingleItem: true
	});
	provider.registerService("orion.page.link.related", null, {
		id: "eclipse.terminal.open",
		category: "shell",
		order: 10 // First link in Shell category
	});

	provider.connect();
});