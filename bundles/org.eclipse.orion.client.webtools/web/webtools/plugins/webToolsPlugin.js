/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
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
'orion/bootstrap',
'orion/fileClient',
'orion/metrics',
'javascript/scriptResolver',
'webtools/htmlAstManager',
'webtools/htmlHover',
'webtools/htmlContentAssist',
'webtools/htmlOutliner',
'orion/editor/stylers/text_html/syntax',
'webtools/cssContentAssist',
'webtools/cssValidator',
'webtools/cssOutliner',
'webtools/cssHover',
'webtools/cssQuickFixes',
'webtools/cssResultManager',
'orion/editor/stylers/text_css/syntax',
'i18n!webtools/nls/messages'
], function(PluginProvider, Bootstrap, FileClient, Metrics, ScriptResolver, HtmlAstManager, htmlHover, htmlContentAssist, htmlOutliner,
            mHTML, cssContentAssist, mCssValidator, mCssOutliner, cssHover, cssQuickFixes, cssResultManager, mCSS, messages) {

	/**
	 * Plug-in headers
	 */
	var headers = {
		name: messages["pluginName"], //$NON-NLS-1$
		version: "1.0", //$NON-NLS-1$
		description: messages["pluginDescription"] //$NON-NLS-1$
	};
	var provider = new PluginProvider(headers);

	Bootstrap.startup().then(function(core) {

    	/**
    	 * Register the content types: HTML, CSS
    	 */
    	provider.registerServiceProvider("orion.core.contenttype", {}, { //$NON-NLS-1$
    		contentTypes: [
    			{	id: "text/html", //$NON-NLS-1$
    				"extends": "text/plain", //$NON-NLS-1$ //$NON-NLS-1$
    				name: "HTML", //$NON-NLS-1$
    				extension: ["html", "htm"], //$NON-NLS-1$ //$NON-NLS-2$
    				imageClass: "file-sprite-html modelDecorationSprite" //$NON-NLS-1$
    			},
    			{	id: "text/css", //$NON-NLS-1$
    				"extends": "text/plain", //$NON-NLS-1$ //$NON-NLS-1$
    				name: "CSS", //$NON-NLS-1$
    				extension: ["css"], //$NON-NLS-1$
    				imageClass: "file-sprite-css modelDecorationSprite" //$NON-NLS-1$
    			}
    		]
    	});
    	/**
    	 * Re-init
    	 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=462878
    	 */
    	Metrics.initFromRegistry(core.serviceRegistry);
    	/**
    	 * load file client early
    	 */
    	var fileClient = new FileClient.FileClient(core.serviceRegistry);
        var cssResultMgr = new cssResultManager();

    	/**
    	 * Register result manager as model changed listener
    	 */
    	provider.registerService("orion.edit.model", {  //$NON-NLS-1$
    		onModelChanging: cssResultMgr.onModelChanging.bind(cssResultMgr),
    		onInputChanged: cssResultMgr.onInputChanged.bind(cssResultMgr)
    	},
    	{
    		contentType: ["text/css", "text/html"],  //$NON-NLS-1$ //$NON-NLS-2$
    		types: ["ModelChanging", 'Destroy', 'onSaving', 'onInputChanged']  //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
    	});

        provider.registerService("orion.edit.contentassist", //$NON-NLS-1$
    		new cssContentAssist.CssContentAssistProvider(cssResultMgr),
    		{	name: messages["cssContentAssist"],
    			contentType: ["text/css", "text/html"] //$NON-NLS-1$ //$NON-NLS-2$
    		});

    	/**
    	 * Register validators
    	 */
    	provider.registerService(["orion.edit.validator", "orion.cm.managedservice"], new mCssValidator(cssResultMgr), //$NON-NLS-1$ //$NON-NLS-2$
    		{
    			contentType: ["text/css", "text/html"], //$NON-NLS-1$ //$NON-NLS-2$
    			pid: 'csslint.config'  //$NON-NLS-1$
    		});

    	var htmlAstManager = new HtmlAstManager.HtmlAstManager();

    	/**
    	 * Register content assist providers
    	 */
    	provider.registerService("orion.edit.contentassist", //$NON-NLS-1$
    		new htmlContentAssist.HTMLContentAssistProvider(htmlAstManager),
    		{	name: messages['htmlContentAssist'],
    			contentType: ["text/html"], //$NON-NLS-1$
    			charTriggers: "<", //$NON-NLS-1$
    			excludedStyles: "(comment.*|string.*)" //$NON-NLS-1$
    		});

    	/**
    	 * Register AST manager as Model Change listener
    	 */
    	provider.registerService("orion.edit.model", {  //$NON-NLS-1$
    		onModelChanging: htmlAstManager.onModelChanging.bind(htmlAstManager),
    		onInputChanged: htmlAstManager.onInputChanged.bind(htmlAstManager)
    	},
    	{
    		contentType: ["text/html"],  //$NON-NLS-1$
    		types: ["ModelChanging", 'Destroy', 'onSaving', 'onInputChanged']  //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
    	});

    	/**
    	* Register outliners
    	*/
    	provider.registerService("orion.edit.outliner", new htmlOutliner.HtmlOutliner(htmlAstManager), //$NON-NLS-1$
    		{
    			id: "orion.webtools.html.outliner", //$NON-NLS-1$
    			name: messages["htmlOutline"],
    			contentType: ["text/html"] //$NON-NLS-1$
    		});

    	provider.registerService("orion.edit.outliner", new mCssOutliner.CssOutliner(),  //$NON-NLS-1$
    		{
    			id: "orion.outline.css.outliner", //$NON-NLS-1$
    			name: messages["cssOutline"],
    			contentType: ["text/css"] //$NON-NLS-1$
    		});

    	/**
    	 * Register syntax styling
    	 */
    	var newGrammars = {};
    	mCSS.grammars.forEach(function(current){
    		newGrammars[current.id] = current;
    	});
    	mHTML.grammars.forEach(function(current){
    		newGrammars[current.id] = current;
    	});
    	for (var current in newGrammars) {
    	    if (newGrammars.hasOwnProperty(current)) {
       			provider.registerService("orion.edit.highlighter", {}, newGrammars[current]); //$NON-NLS-1$
      		}
        }

        var resolver = new ScriptResolver.ScriptResolver(fileClient);

        /**
    	 * Register the hover support
    	 */
    	provider.registerService("orion.edit.hover", new cssHover.CSSHover(resolver, cssResultMgr),  //$NON-NLS-1$
    		{
    		    name: messages['cssHover'],
    			contentType: ["text/css", "text/html"]	//$NON-NLS-1$ //$NON-NLS-2$
    	});

    	/**
    	 * Register the hover support
    	 */
    	provider.registerService("orion.edit.hover", new htmlHover.HTMLHover(htmlAstManager, resolver),  //$NON-NLS-1$
    		{
    		    name: messages['htmlHover'],
    			contentType: ["text/html"]	//$NON-NLS-1$
    	});

    	/**
    	 * Register quick fixes as editor commands
    	 */
    	var cssQuickFixComputer = new cssQuickFixes.CssQuickFixes();

    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    		cssQuickFixComputer,
    		{
	    		name: messages["quickfix-empty-rules"],
	    		scopeId: "orion.edit.quickfix", //$NON-NLS-1$
	    		id : "quickfix-empty-rules",  //$NON-NLS-1$
	    		contentType: ['text/css','text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
	    		validationProperties: [
    				{source: "annotation:id", match: "empty-rules"} //$NON-NLS-1$ //$NON-NLS-2$
    		    ]
    		}
    	);
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    		cssQuickFixComputer,
    		{
	    		name: messages["quickfix-important"],
	    		scopeId: "orion.edit.quickfix", //$NON-NLS-1$
	    		id : "quickfix-important",  //$NON-NLS-1$
	    		contentType: ['text/css','text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
	    		validationProperties: [
    		    	{source: "annotation:id", match: "important"} //$NON-NLS-1$ //$NON-NLS-2$
    		    ]
    		}
    	);
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    		cssQuickFixComputer,
    		{
	    		name: messages["quickfix-zero-units"],
	    		scopeId: "orion.edit.quickfix", //$NON-NLS-1$
	    		id : "quickfix-zero-units",  //$NON-NLS-1$
	    		contentType: ['text/css','text/html'],  //$NON-NLS-1$ //$NON-NLS-2$
	    		validationProperties: [
 		        	{source: "annotation:id", match: "zero-units"} //$NON-NLS-1$ //$NON-NLS-2$
    		    ]
    		}
    	);

        /**
    	 * CSSLint settings
    	 */
    	var ignore = 0, warning = 1, error = 2, severities = [
    		{label: messages.ignore,  value: ignore},
    		{label: messages.warning, value: warning},
    		{label: messages.error,   value: error}
    	];
    	provider.registerService("orion.core.setting",  //$NON-NLS-1$
    		{},
    		{	settings: [
    				{	pid: "csslint.config",  //$NON-NLS-1$
    					name: messages["csslintValidator"],
    					tags: "validation webtools css csslint".split(" "),  //$NON-NLS-1$  //$NON-NLS-1$
    					category: "css",  //$NON-NLS-1$
    					categoryLabel: messages["css"],
    					properties: [
    						{
    							id: "validate_adjoining_classes", //$NON-NLS-1$
    							name: messages["adjoining-classes"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_box_model", //$NON-NLS-1$
    							name: messages["box-model"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_box_sizing", //$NON-NLS-1$
    							name: messages["box-sizing"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_bulletproof_font_face", //$NON-NLS-1$
    							name: messages["bulletproof-font-face"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_compatible_vendor_prefixes", //$NON-NLS-1$
    							name: messages["compatible-vendor-prefixes"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_display_property_grouping", //$NON-NLS-1$
    							name: messages["display-property-grouping"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},{
    							id: "validate_duplicate_background_images", //$NON-NLS-1$
    							name: messages["duplicate-background-images"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_duplicate_properties", //$NON-NLS-1$
    							name: messages["duplicate-properties"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_empty_rules", //$NON-NLS-1$
    							name: messages["empty-rules"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_fallback_colors", //$NON-NLS-1$
    							name: messages["fallback-colors"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_floats", //$NON-NLS-1$
    							name: messages["floats"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_font_faces", //$NON-NLS-1$
    							name: messages["font-faces"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_font_sizes", //$NON-NLS-1$
    							name: messages["font-sizes"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_gradients", //$NON-NLS-1$
    							name: messages["gradients"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_ids", //$NON-NLS-1$
    							name: messages["ids"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_imports", //$NON-NLS-1$
    							name: messages["import"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_important", //$NON-NLS-1$
    							name: messages["important"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_known_properties", //$NON-NLS-1$
    							name: messages["known-properties"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_outline_none", //$NON-NLS-1$
    							name: messages["outline-none"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_overqualified_elements", //$NON-NLS-1$
    							name: messages["overqualified-elements"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_qualified_headings", //$NON-NLS-1$
    							name: messages["qualified-headings"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_regex_selectors", //$NON-NLS-1$
    							name: messages["regex-selectors"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_rules_count", //$NON-NLS-1$
    							name: messages["rules-count"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_selector_max_approaching", //$NON-NLS-1$
    							name: messages["selector-max-approaching"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_selector_max", //$NON-NLS-1$
    							name: messages["selector-max"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_shorthand", //$NON-NLS-1$
    							name: messages["shorthand"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_star_property_hack", //$NON-NLS-1$
    							name: messages["star-property-hack"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_text_indent", //$NON-NLS-1$
    							name: messages["text-indent"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_underscore_property_hack", //$NON-NLS-1$
    							name: messages["underscore-property-hack"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_unique_headings", //$NON-NLS-1$
    							name: messages["unique-headings"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_universal_selector", //$NON-NLS-1$
    							name: messages["universal-selector"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_unqualified_attributes", //$NON-NLS-1$
    							name: messages["unqualified-attributes"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_vendor_prefix", //$NON-NLS-1$
    							name: messages["vendor-prefix"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						},
    						{
    							id: "validate_zero_units", //$NON-NLS-1$
    							name: messages["zero-units"],
    							type: "number", //$NON-NLS-1$
    							defaultValue: warning,
    							options: severities
    						}]
    				}]
    		}
    	);

    	provider.connect();
	});
});
