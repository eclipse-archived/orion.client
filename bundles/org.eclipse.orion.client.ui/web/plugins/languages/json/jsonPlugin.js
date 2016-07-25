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
	"plugins/languages/json/jsonFormatter",
	"i18n!plugins/languages/json/nls/messages",
], function(PluginProvider, mJSON, mJSONSchema, mValidator, JsonFormatter, Messages) {

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
		
		var jsonFormatter = new JsonFormatter();
		/**
		 * Formatting
		 */
		pluginProvider.registerServiceProvider("orion.edit.format",
			jsonFormatter,
			{
				contentType: ["application/json"], //$NON-NLS-1$
				id: "orion.format.json.formatter", //$NON-NLS-1$
				name: Messages["jsonFormatter"],//$NON-NLS-1$
			}
		);
		/**
		 * Formatting preferences callback
		 */
		pluginProvider.registerService("orion.cm.managedservice", jsonFormatter, {pid: 'json.config.format'}); //$NON-NLS-1$ //$NON-NLS-2$
		
		var space = ' ',
			tab= '\t',
			indentation_characters = [
				{label: Messages['indentation_space'],  value: space},
				{label: Messages['indentation_tab'],  value: tab},
			],
			unix = "\n",
			mac = "\r",
			windows = "\n\r",
			eof_characters = [
			{label: Messages['indentation_unix'],  value: unix},
			{label: Messages['indentation_mac'], value: mac},
			{label: Messages['indentation_windows'], value: windows}
		];
		/**
		 * Formatting preferences
		 */
		pluginProvider.registerServiceProvider("orion.core.setting", {}, {
			settings: [
				{
					pid: 'json.config.format',
					name: Messages['jsonFormattingOptions'],
					tags: 'beautify json formatting'.split(' '),
					category: 'jsonFormatting',
					categoryLabel: Messages['jsonFormatting'],
					properties: [
						{
							id: 'json_indent_size',  //$NON-NLS-1$
							name: Messages['json_indent_size'],
							type: 'number', //$NON-NLS-1$
							defaultValue: 4
						},
						{
							id: 'json_indent_char',  //$NON-NLS-1$
							name: Messages['json_indent_char'],
							type: 'string', //$NON-NLS-1$
							defaultValue: space,
							options: indentation_characters
						},
						{
							id: 'json_eol',  //$NON-NLS-1$
							name: Messages['json_eol'],
							type: 'string', //$NON-NLS-1$
							defaultValue: unix,
							options: eof_characters
						},
						{
							id: 'json_end_with_newline',  //$NON-NLS-1$
							name: Messages['json_end_with_newline'],
							type: 'boolean', //$NON-NLS-1$
							defaultValue: false
						},
					]
				}
			]
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
