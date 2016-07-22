/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
define(['orion/plugin', 
	"orion/editor/stylers/application_json/syntax",
	"orion/editor/stylers/application_schema_json/syntax",
	"plugins/languages/json/validator",
	"i18n!plugins/languages/json/nls/messages",
], function(PluginProvider, mJSON, mJSONSchema, mValidator, Messages) {

	function registerServiceProviders(pluginProvider) {
    	pluginProvider.registerService("orion.core.contenttype", {}, { //$NON-NLS-1$
    		contentTypes: [
    		               {id: "application/json", //$NON-NLS-1$
    		            	   "extends": "text/plain", //$NON-NLS-1$ //$NON-NLS-1$
    		            	   name: "JSON", //$NON-NLS-1$
    		            	   extension: ["json"], //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
    		            	   imageClass: "file-sprite-javascript modelDecorationSprite" //$NON-NLS-1$
    		               }    		               
    		              ]
    	});
		/**
		 * Register content type
		 */
		pluginProvider.registerServiceProvider("orion.core.contenttype", {}, {
			contentTypes: [{
				id: "application/json", //$NON-NLS-1$
        	   "extends": "text/plain", //$NON-NLS-1$ //$NON-NLS-1$
        	   name: "JSON", //$NON-NLS-1$
        	   extension: ["json"]
			}] 
		});
		/**
		 * Validation
		 */
		pluginProvider.registerService(["orion.edit.validator"], new mValidator(), { //$NON-NLS-1$
			contentType: ["application/json"], //$NON-NLS-1$
		});
		
    	var newGrammars = {};
    	mJSON.grammars.forEach(function(current){
    		newGrammars[current.id] = current;
    	});
    	mJSONSchema.grammars.forEach(function(current){
    		newGrammars[current.id] = current;
    	});
    	for (var current in newGrammars) {
    		if (newGrammars.hasOwnProperty(current)) {
    			pluginProvider.registerService("orion.edit.highlighter", {}, newGrammars[current]); //$NON-NLS-1$
    		}
    	}
	}

	return {
		connect: function connect() {
			var headers = {
				name: Messages['pluginName'],
				version: "1.0",
				description: Messages['pluginDescription']
			};
			var pluginProvider = new PluginProvider(headers);
			registerServiceProviders(pluginProvider);
			pluginProvider.connect();
		},
		registerServiceProviders: registerServiceProviders
	};
});
