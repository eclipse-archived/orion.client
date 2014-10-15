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
/*global CSSLint*/
/*eslint-env amd*/
define("webtools/cssValidator", [ //$NON-NLS-0$
	'csslint', //$NON-NLS-0$
	'orion/objects' //$NON-NLS-0$
], function(csslint, Objects) {

	// TODO How to keep this list up to date with rules definitions and settings options
	var config = {
		// Define the default values for the rules
		// 0:off, 1:warning, 2:error
		rules: {
			"adjoining-classes" : 1, //$NON-NLS-0$
			"box-model" : 1, //$NON-NLS-0$
			"box-sizing" : 1, //$NON-NLS-0$
			"bulletproof-font-face" : 1, //$NON-NLS-0$
			"compatible-vendor-prefixes" : 1, //$NON-NLS-0$
			"display-property-grouping" : 1, //$NON-NLS-0$
			"duplicate-background-images" : 1, //$NON-NLS-0$
			"duplicate-properties" : 1, //$NON-NLS-0$
			"empty-rules" : 1, //$NON-NLS-0$
			"fallback-colors" : 1, //$NON-NLS-0$
			"floats" : 1, //$NON-NLS-0$
			"font-faces" : 1, //$NON-NLS-0$
			"font-sizes" : 1, //$NON-NLS-0$
			"gradients" : 1, //$NON-NLS-0$
			"ids" : 1, //$NON-NLS-0$
			"import" : 1, //$NON-NLS-0$
			"important" : 1, //$NON-NLS-0$
			"known-properties" : 1, //$NON-NLS-0$
			"outline-none" : 1, //$NON-NLS-0$
			"overqualified-elements" : 1, //$NON-NLS-0$
			"qualified-headings" : 1, //$NON-NLS-0$
			"regex-selectors" : 1, //$NON-NLS-0$
			"rules-count" : 1, //$NON-NLS-0$
			"selector-max-approaching" : 1, //$NON-NLS-0$
			"selector-max" : 1, //$NON-NLS-0$
			"shorthand" : 1, //$NON-NLS-0$
			"star-property-hack" : 1, //$NON-NLS-0$
			"text-indent" : 1, //$NON-NLS-0$
			"underscore-property-hack" : 1, //$NON-NLS-0$
			"unique-headings" : 1, //$NON-NLS-0$
			"universal-selector" : 1, //$NON-NLS-0$
			"unqualified-attributes" : 1, //$NON-NLS-0$
			"vendor-prefix" : 1, //$NON-NLS-0$
			"zero-units" : 1 //$NON-NLS-0$
		},
		
		/**
		 * @name getRuleSet
		 * @description Returns an editable ruleset to pass into verify() based on values set in the config settings
		 * @function
		 * @returns {Object} A ruleset based on the config settings
		 */
		getRuleSet: function(){
			// TODO Versions of CSSLint >0.10.0 create a copy of the ruleset inside verify (CSSLint Issue 458)
			return JSON.parse( JSON.stringify( this.rules ) );
		},
		
		/**
		 * @description Sets the given rule to the given enabled value
		 * @function
		 * @private
		 * @param {String} ruleId The id of the rule to change
		 * @param {Number} value The value to set the rule to
		 * @param {Object} [key] Optional key to use for complex rule configuration.
		 */
		setOption: function(ruleId, value, key) {
			if (typeof value === "number") {
				if(Array.isArray(this.rules[ruleId])) {
					var ruleConfig = this.rules[ruleId];
					if (key) {
						ruleConfig[1] = ruleConfig[1] || {};
						ruleConfig[1][key] = value;
					} else {
						ruleConfig[0] = value;
					}
				}
				else {
					this.rules[ruleId] = value;
				}
			}
		}
	};
	
	/**
	 * @description Creates a new validator
	 * @constructor
	 * @public
	 * @since 6.0
	 */
	function CssValidator() {
	}

	Objects.mixin(CssValidator.prototype, /** @lends webtools.CssValidator.prototype*/ {
		
		/**
		 * @description Callback to create problems from orion.edit.validator
		 * @function
		 * @public
		 * @param {orion.edit.EditorContext} editorContext The editor context
		 * @param {Object} context The in-editor context (selection, offset, etc)
		 * @returns {orion.Promise} A promise to compute some problems
		 */
		computeProblems: function(editorContext, context) {
			var that = this;
			return editorContext.getText().then(function(text) {
				return that._computeProblems(text);
			});
		},
		
		/**
		 * @description Create the problems 
		 * @function
		 * @private
		 * @param {String} contents The file contents
		 * @returns {Array} The problem array
		 */
		_computeProblems: function(contents) {
			var cssResult = csslint.verify(contents, config.getRuleSet()),
			    messages = cssResult.messages,
			    problems = [];
			for (var i=0; i < messages.length; i++) {
				var message = messages[i];
				if (message.line) {
					var problem = {
						description: message.message,
						line: message.line,
						start: message.col,
						end: message.col + message.evidence.length,
						severity: message.type
					};
					problems.push(problem);
				}
			}
			return {problems: problems};
		},
		
		/**
		 * @description Callback from orion.cm.managedservice
		 * @function
		 * @public
		 * @param {Object} properties The properties that have been changed
		 */
		updated: function(properties) {
			if (!properties) {
				return;
			}
			// TODO these option -> setting mappings are becoming hard to manage
			// And they must be kept in sync with webToolsPlugin.js
			config.setOption("adjoining-classes", properties.validate_adjoining_classes); //$NON-NLS-0$
			config.setOption("box-model", properties.validate_box_model); //$NON-NLS-0$
			config.setOption("box-sizing", properties.validate_box_sizing); //$NON-NLS-0$
			config.setOption("compatible-vendor-prefixes", properties.validate_compatible_vendor_prefixes); //$NON-NLS-0$
			config.setOption("display-property-grouping", properties.validate_display_property_grouping); //$NON-NLS-0$
			config.setOption("duplicate-background-images", properties.validate_duplicate_background_images); //$NON-NLS-0$
			config.setOption("duplicate-properties", properties.validate_duplicate_properties); //$NON-NLS-0$
			config.setOption("empty-rules", properties.validate_empty_rules); //$NON-NLS-0$
			config.setOption("fallback-colors", properties.validate_fallback_colors); //$NON-NLS-0$
			config.setOption("floats", properties.validate_floats); //$NON-NLS-0$
			config.setOption("font-faces", properties.validate_font_faces); //$NON-NLS-0$
			config.setOption("font-sizes", properties.validate_font_sizes); //$NON-NLS-0$
			config.setOption("gradients", properties.validate_gradients); //$NON-NLS-0$
			config.setOption("ids", properties.validate_ids); //$NON-NLS-0$
			config.setOption("import", properties.validate_imports); //$NON-NLS-0$ // import is restricted key word
			config.setOption("important", properties.validate_important); //$NON-NLS-0$
			config.setOption("known-properties", properties.validate_known_properties); //$NON-NLS-0$
			config.setOption("outline-none", properties.validate_outline_none); //$NON-NLS-0$
			config.setOption("overqualified-elements", properties.validate_overqualified_elements); //$NON-NLS-0$
			config.setOption("qualified-headings", properties.validate_qualified_headings); //$NON-NLS-0$
			config.setOption("regex-selectors", properties.validate_regex_selectors); //$NON-NLS-0$
			config.setOption("rules-count", properties.validate_rules_count); //$NON-NLS-0$
			config.setOption("selector-max-approaching", properties.validate_selector_max_approaching); //$NON-NLS-0$
			config.setOption("selector-max", properties.validate_selector_max); //$NON-NLS-0$
			config.setOption("shorthand", properties.validate_shorthand); //$NON-NLS-0$
			config.setOption("star-property-hack", properties.validate_star_property_hack); //$NON-NLS-0$
			config.setOption("text-indent", properties.validate_text_indent); //$NON-NLS-0$
			config.setOption("underscore-property-hack", properties.validate_underscore_property_hack); //$NON-NLS-0$
			config.setOption("unique-headings", properties.validate_unique_headings); //$NON-NLS-0$
			config.setOption("universal-selector", properties.validate_universal_selector); //$NON-NLS-0$
			config.setOption("unqualified-attributes", properties.validate_unqualified_attributes); //$NON-NLS-0$
			config.setOption("vendor-prefix", properties.validate_vendor_prefix); //$NON-NLS-0$
			config.setOption("zero-units", properties.validate_zero_units); //$NON-NLS-0$
		}
	});
	
	return CssValidator;
});