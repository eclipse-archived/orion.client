/*******************************************************************************
  * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser,amd*/
require(["cfui/plugins/cFDeployService", "orion/plugin", "i18n!cfui/nls/messages"], function(CFDeployService, PluginProvider, messages){
	
	var provider = new PluginProvider({
		name: "Cloud Foundry Deploy",
		version: "1.0",
		description: "This plugin integrates with Cloud Foundry."
	});
		
	provider.registerServiceProvider("orion.project.deploy",
		new CFDeployService(),
		{
			id: "org.eclipse.orion.client.cf.deploy",
			deployTypes: ["Cloud Foundry"],
			name: messages["createNew"],
			tooltip: messages["deploy.cf.tooltip"],
			validationProperties: [{source: "NoShow" }],
			logLocationTemplate: "{+OrionHome}/cfui/logs.html#{Name,Target*}",
			priorityForDefault: 9
		});
			
	provider.connect();
});