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
	'orion/PageLinks',
	'orion/plugin',
	'orion/URITemplate',
], function(PageLinks, PluginProvider, URITemplate) {

	var serviceImpl = { /* All data is in properties */ };

	var headers = {
		name: "Orion Page Links",
		version: "1.0",
		description: "This plugin provides the top-level page links for Orion."
	};

	var provider = new PluginProvider(headers);

	// Categories for primary nav and related links
	provider.registerService("orion.page.link.category", null, {
		id: "edit",
		nameKey: "Edit",
		nls: "orion/nls/messages",
		imageClass: "core-sprite-edit",
		order: 10
	});

	provider.registerService("orion.page.link.category", null, {
		id: "shell",
		nameKey: "Shell",
		nls: "orion/nls/messages",
		imageClass: "core-sprite-shell",
		order: 40
	});
	
	provider.registerService("orion.page.link.category", null, {
		id: "settings",
		nameKey: "Settings",
		nls: "orion/widgets/nls/messages",
		imageClass: "core-sprite-gear",
		order: 60
	});

	// Primary navigation links
	provider.registerService("orion.page.link", null, {
		nameKey: "EditorLinkWorkspace",
		nls: "orion/nls/messages",
		tooltip: "Edit code",
		category: "edit",
		order: 1000, // low priority
		uriTemplate: "{+OrionHome}/edit/edit.html"
	});
	provider.registerService("orion.page.link", serviceImpl, {
		nameKey: "ShellLinkWorkspace",
		id: "orion.shell",
		nls: "orion/nls/messages",
		category: "shell",
		order: 1000, // low priority
		uriTemplate: "{+OrionHome}/shell/shellPage.html"
	});

	provider.registerService("orion.page.link", null, {
		nameKey: "Settings",
		id: "orion.settings",
		nls: "orion/widgets/nls/messages",
		category: "settings",
		order: 1000, // low priority
		uriTemplate: "{+OrionHome}/settings/settings.html"
	});

	// Links to an Editor view of current folder. This is only useful from non-Editor pages
	provider.registerService("orion.page.link.related", null, {
		id: "orion.editFromMetadata",
		nameKey: "EditorRelatedLink",
		nls: "orion/nls/messages",
		tooltip: "Open Editor page",
		category: "edit",
		order: 1, // First link in edit category on Shell
		validationProperties: [{
			source: "ChildrenLocation|ContentLocation",
			variableName: "EditorLocation",
			replacements: [{pattern: "\\?depth=1$", replacement: ""}]  /* strip off depth=1 if it is there because we always add it back */
		}],
		uriTemplate: "{+OrionHome}/edit/edit.html#{,EditorLocation}"
	});

	// Links to an Editor view of the parent folder (Enclosing Folder)
	provider.registerService("orion.page.link.related", null, {
		id: "orion.editProjectRoot",
		nameKey: "EditorRelatedLinkParent",
		nls: "orion/nls/messages",
		category: "edit",
		order: 3,
		validationProperties: [{
			source: "Parents[0]:Location",
			variableName: "EditorLocation",
			replacements: [{pattern: "\\?depth=1$", replacement: ""}]  /* strip off depth=1 if it is there because we always add it back */
		}],
		uriTemplate: "{+OrionHome}/edit/edit.html#{,EditorLocation}"
	});

	// Links to an Editor view of the topmost parent folder (Project Root)
	provider.registerService("orion.page.link.related", null, {
		id: "orion.editProjectRoot",
		nameKey: "EditorRelatedLinkProj",
		nls: "orion/nls/messages",
		category: "edit",
		order: 5,
		validationProperties: [{
			source: "Parents[-1]:Location",
			variableName: "EditorLocation",
			replacements: [{pattern: "\\?depth=1$", replacement: ""}]  /* strip off depth=1 if it is there because we always add it back */
		}],
		uriTemplate: "{+OrionHome}/edit/edit.html#{,EditorLocation}"
	});

	provider.registerService("orion.page.link.user", null, {
		id: "orion.help",
		nameKey: "Help",
		nls: "orion/widgets/nls/messages",
		uriTemplate: "{+OrionHome}/help/help.html",
		category: "user.0"
	});

	var htmlHelloWorld = document.createElement('a');
	htmlHelloWorld.href = "./contentTemplates/helloWorld.zip";
	var pluginHelloWorld = document.createElement('a');
	pluginHelloWorld.href = "./contentTemplates/pluginHelloWorld.zip";

	provider.registerService("orion.core.content", null, {
		id: "orion.content.html5",
		name: "Sample HTML5 Site",
		description: 'Generate an HTML5 "Hello World" website, including JavaScript, HTML, and CSS files.',
		contentURITemplate: htmlHelloWorld.href
	});

	provider.registerService("orion.core.content", null, {
		id: "orion.content.plugin",
		name: "Sample Orion Plugin",
		description: "Generate a sample plugin for integrating with Orion.",
		contentURITemplate: pluginHelloWorld.href
	});

	var getPluginsTemplate = "http://orion-plugins.googlecode.com/git/index.html#?target={InstallTarget}&version={Version}&OrionHome={OrionHome}";
	provider.registerService("orion.core.getplugins", null, {
		uri: decodeURIComponent(new URITemplate(getPluginsTemplate).expand({
			Version: "5.0",
			InstallTarget: PageLinks.getOrionHome() + "/settings/settings.html",
			OrionHome: PageLinks.getOrionHome()
		}))
	});

	provider.connect();
});
