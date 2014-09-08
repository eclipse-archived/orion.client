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
define(["require", "orion/plugin", "orion/Deferred", "plugins/help/helpFileService"], function(require, PluginProvider, Deferred, mHelpFileService) {
	var provider = new PluginProvider({
		name: "Help Plugin", //$NON-NLS-0$
		version: "1.0", //$NON-NLS-0$
		description: "Help Plugin" //$NON-NLS-0$
	});

	var helpFileService = new mHelpFileService.HelpFileService();
	var serviceImpl = helpFileService;
	var properties = {
		location: "{+OrionHome}/Orion User Guide/Getting Started.md" //$NON-NLS-0$
	};
	provider.registerService("orion.help.pages", serviceImpl, properties); //$NON-NLS-0$
	provider.connect();
});