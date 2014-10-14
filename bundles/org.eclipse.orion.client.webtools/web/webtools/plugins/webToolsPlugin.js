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
/*eslint-env browser, amd*/
define(['orion/plugin', 
'webtools/htmlContentAssist', 
'webtools/htmlOutliner',
'orion/editor/stylers/text_html/syntax', 
'webtools/cssContentAssist', 
'webtools/cssValidator',
'webtools/cssOutliner',
'orion/editor/stylers/text_css/syntax'
], function(PluginProvider, htmlContentAssist, htmlOutliner, mHTML, cssContentAssist, mCssValidator, mCssOutliner, mCSS) {
	/**
	 * Plug-in headers
	 */
	var headers = {
		name: "Orion Web Tools Support", //$NON-NLS-0$
		version: "1.0", //$NON-NLS-0$
		description: "This plug-in provides web language tools support for Orion, including HTML and CSS." //$NON-NLS-0$
	};
	var provider = new PluginProvider(headers);

	/**
	 * Register the content types: HTML, CSS
	 */
	provider.registerServiceProvider("orion.core.contenttype", {}, { //$NON-NLS-0$
		contentTypes: [
			{	id: "text/html", //$NON-NLS-0$
				"extends": "text/plain", //$NON-NLS-0$ //$NON-NLS-1$
				name: "HTML", //$NON-NLS-0$
				extension: ["html", "htm"], //$NON-NLS-0$ //$NON-NLS-1$
				imageClass: "file-sprite-html modelDecorationSprite" //$NON-NLS-0$
			},
			{	id: "text/css", //$NON-NLS-0$
				"extends": "text/plain", //$NON-NLS-0$ //$NON-NLS-1$
				name: "CSS", //$NON-NLS-0$
				extension: ["css"], //$NON-NLS-0$
				imageClass: "file-sprite-css modelDecorationSprite" //$NON-NLS-0$
			}
		] 
	});
	
	/**
	 * Register content assist providers
	 */
	provider.registerService("orion.edit.contentassist", //$NON-NLS-0$
		new htmlContentAssist.HTMLContentAssistProvider(),
		{	name: 'htmlContentAssist', //$NON-NLS-0$
			nls: 'webtools/nls/messages',  //$NON-NLS-0$
			contentType: ["text/html"], //$NON-NLS-0$
			charTriggers: "<", //$NON-NLS-0$
			excludedStyles: "(comment.*|string.*)" //$NON-NLS-0$
		});
	provider.registerService("orion.edit.contentassist", //$NON-NLS-0$
		new cssContentAssist.CssContentAssistProvider(),
		{	name: "cssContentAssist", //$NON-NLS-0$
			nls: 'webtools/nls/messages',  //$NON-NLS-0$
			contentType: ["text/css"] //$NON-NLS-0$
		});

	/**
	 * Register validators
	 */
	provider.registerService(["orion.edit.validator", "orion.cm.managedservice"], new mCssValidator(), //$NON-NLS-0$  //$NON-NLS-1$
		{
			contentType: ["text/css"], //$NON-NLS-0$
			pid: 'csslint.config'  //$NON-NLS-0$
		});
		
	/**
	* Register outliners
	*/
	provider.registerService("orion.edit.outliner", new htmlOutliner.HtmlOutliner(), //$NON-NLS-0$
		{
			id: "orion.webtools.html.outliner", //$NON-NLS-0$
			nls: 'webtools/nls/messages',  //$NON-NLS-0$
			nameKey: 'htmlOutline', //$NON-NLS-0$
			contentType: ["text/html"] //$NON-NLS-0$
		});
	
	provider.registerService("orion.edit.outliner", new mCssOutliner.CssOutliner(),  //$NON-NLS-0$
		{
			id: "orion.outline.css.outliner", //$NON-NLS-0$
			nls: 'webtools/nls/messages',  //$NON-NLS-0$
			nameKey: 'cssOutline', //$NON-NLS-0$
			contentType: ["text/css"] //$NON-NLS-0$
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
   			provider.registerService("orion.edit.highlighter", {}, newGrammars[current]); //$NON-NLS-0$
  		}
    }
    
    /**
	 * CSSLint settings
	 */
	var ignore = 0, warning = 1, error = 2, severities = [
		{labelKey: 'ignore',  value: ignore},  //$NON-NLS-0$
		{labelKey: 'warning', value: warning},  //$NON-NLS-0$
		{labelKey: 'error',   value: error}  //$NON-NLS-0$
	];
	provider.registerService("orion.core.setting",  //$NON-NLS-0$
		{},
		{	settings: [
				{	pid: "csslint.config",  //$NON-NLS-0$
					nls: 'webtools/nls/messages',  //$NON-NLS-0$
					nameKey: 'csslintValidator',  //$NON-NLS-0$
					tags: "validation webtools css csslint".split(" "),  //$NON-NLS-0$  //$NON-NLS-1$
					category: "css",  //$NON-NLS-0$
					properties: [
						{
							id: "validate_adjoining_classes", //$NON-NLS-0$
							nameKey: "adjoining-classes", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_box_model", //$NON-NLS-0$
							nameKey: "box-model", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_box_sizing", //$NON-NLS-0$
							nameKey: "box-sizing", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_bulletproof_font_face", //$NON-NLS-0$
							nameKey: "bulletproof-font-face", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_compatible_vendor_prefixes", //$NON-NLS-0$
							nameKey: "compatible-vendor-prefixes", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_display_property_grouping", //$NON-NLS-0$
							nameKey: "display-property-grouping", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},{
							id: "validate_duplicate_background_images", //$NON-NLS-0$
							nameKey: "duplicate-background-images", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_duplicate_properties", //$NON-NLS-0$
							nameKey: "duplicate-properties", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_empty_rules", //$NON-NLS-0$
							nameKey: "empty-rules", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_fallback_colors", //$NON-NLS-0$
							nameKey: "fallback-colors", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_floats", //$NON-NLS-0$
							nameKey: "floats", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_font_faces", //$NON-NLS-0$
							nameKey: "font-faces", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_font_sizes", //$NON-NLS-0$
							nameKey: "font-sizes", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_gradients", //$NON-NLS-0$
							nameKey: "gradients", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_ids", //$NON-NLS-0$
							nameKey: "ids", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_imports", //$NON-NLS-0$
							nameKey: "import", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_important", //$NON-NLS-0$
							nameKey: "important", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_known_properties", //$NON-NLS-0$
							nameKey: "known-properties", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_outline_none", //$NON-NLS-0$
							nameKey: "outline-none", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_overqualified_elements", //$NON-NLS-0$
							nameKey: "overqualified-elements", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_qualified_headings", //$NON-NLS-0$
							nameKey: "qualified-headings", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_regex_selectors", //$NON-NLS-0$
							nameKey: "regex-selectors", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_rules_count", //$NON-NLS-0$
							nameKey: "rules-count", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_selector_max_approaching", //$NON-NLS-0$
							nameKey: "selector-max-approaching", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_selector_max", //$NON-NLS-0$
							nameKey: "selector-max", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_shorthand", //$NON-NLS-0$
							nameKey: "shorthand", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_star_property_hack", //$NON-NLS-0$
							nameKey: "star-property-hack", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_text_indent", //$NON-NLS-0$
							nameKey: "text-indent", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_underscore_property_hack", //$NON-NLS-0$
							nameKey: "underscore-property-hack", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_unique_headings", //$NON-NLS-0$
							nameKey: "unique-headings", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_universal_selector", //$NON-NLS-0$
							nameKey: "universal-selector", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_unqualified_attributes", //$NON-NLS-0$
							nameKey: "unqualified-attributes", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_vendor_prefix", //$NON-NLS-0$
							nameKey: "vendor-prefix", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						},
						{
							id: "validate_zero_units", //$NON-NLS-0$
							nameKey: "zero-units", //$NON-NLS-0$
							type: "number", //$NON-NLS-0$
							defaultValue: warning, //$NON-NLS-0$
							options: severities //$NON-NLS-0$
						}]
				}]
		}
	);

	provider.connect();
});
