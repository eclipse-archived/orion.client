/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
define("webtools/cssValidator", [
	"orion/objects",
	"webtools/compilationUnit",
	"webtools/util",
	"i18n!webtools/nls/problems",
	"orion/i18nUtil"
], function(Objects, CU, Util, Messages, i18nUtil) {

	// TODO How to keep this list up to date with rules definitions, settings options and content assist
	var config = {
		// Define the default values for the rules
		// 0:off, 1:warning, 2:error 3:info
		rules: {
			"adjoining-classes" : 0,
			"box-model" : 3,
			"box-sizing" : 0,
			"bulletproof-font-face" : 3,
			"compatible-vendor-prefixes" : 3,
			"display-property-grouping" : 3,
			"duplicate-background-images" : 3,
			"duplicate-properties" : 3,
			"empty-rules" : 3,
			"fallback-colors" : 3,
			"floats" : 3,
			"font-faces" : 3,
			"font-sizes" : 3,
			"gradients" : 3,
			"ids" : 3,
			"import" : 3,
			"important" : 3,
			"known-properties" : 1,
			"outline-none" : 3,
			"overqualified-elements" : 3,
			"qualified-headings" : 3,
			"regex-selectors" : 3,
			"rules-count" : 3,
			"selector-max-approaching" : 0,
			"selector-max" : 3,
			"shorthand" : 3,
			"star-property-hack" : 3,
			"text-indent" : 3,
			"underscore-property-hack" : 3,
			"unique-headings" : 3,
			"universal-selector" : 3,
			"unqualified-attributes" : 3,
			"vendor-prefix" : 3,
			"zero-units" : 3
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
	 * @param {CssResultManager} cssResultManager The back result manager
	 * @since 6.0
	 */
	function CssValidator(cssResultManager) {
	    this.cssResultManager = cssResultManager;
	}

	Objects.mixin(CssValidator.prototype, /** @lends webtools.CssValidator.prototype*/ {
		
		/**
		 * @description Callback to create problems from orion.edit.validator
		 * @function
		 * @public
		 * @param {orion.edit.EditorContext} editorContext The editor context
		 * @param {Object} context The in-editor context (selection, offset, etc)
		 * @returns {orion.Promise} A promise to compute some problems
		 * @callback
		 */
		computeProblems: function(editorContext, context) {
			return editorContext.getFileMetadata().then(function(meta) {
			    if(meta && meta.contentType.id === "text/html") {
			    	// Only run the validator if we have line information because cssLint uses line num and column, not offsets
			    	if (!editorContext.getLineAtOffset){
			    		return null;
			    	}
			        return editorContext.getText().then(function(text) {
    			         var blocks = Util.findStyleBlocks(text, context.offset);
    			         if(blocks && blocks.length > 0) {
    			             var cu = new CU(blocks, meta, editorContext);
    			             return this.cssResultManager.getResult(cu.getEditorContext(), config).then(function(results) {
                			    if(results) {
                			         return this._computeProblems(results);
                			    }
                			    return null;
        			         }.bind(this));
    			         }
			         }.bind(this));
			    }
			    return this.cssResultManager.getResult(editorContext, config).then(function(results) {
    			    if(results) {
    			         return this._computeProblems(results);
    			    }
    			    return null;
    			}.bind(this));
			}.bind(this));
		},
		
		/**
		 * @description Create the problems
		 * @function
		 * @private
		 * @param {String} contents The file contents
		 * @returns {Array} The problem array
		 */
		_computeProblems: function(results) {
			    var messages = results.messages,
			    problems = [];
			for (var i=0; i < messages.length; i++) {
				var message = messages[i],
					range = null,
					id = this._getProblemId(message);
				if(!id) {
					continue;
				}
				if(message.token) {
				    range = [message.token.range[0]+1, message.token.range[1]+1];
				} else if (message.line) {
					range = this._getProblemRange(message);
				} else {
					range = [0,0];
				}
				if(range) {
    				problems.push({
						id: id,
						description: this._getMessage(message),
						line: message.line,
						start: range[0],
						end: range[1],
						severity: message.type
					});
				}
			}
			return {problems: problems};
		},
		 /**
 		 * @name _getMessage
 		 * @description Get the message from the problem object. This fuction also checks for an
 		 * NLS'd version of the message using its problem id
 		 * @function
 		 * @private
 		 * @param {?} problem The problem object
 		 * @returns {string} The problem message to display to the user
 		 * @since 13.0
 		 */
 		_getMessage: function _getMessage(problem) {
		 	var id = this._getProblemId(problem);
		 	if(id) {
		 		var key = problem.data && problem.data.nls ? problem.data.nls : id,
		 			m = Messages[key];
		 		if(m) {
		 			return i18nUtil.formatMessage.call(null, m, problem.data || {});
		 		}
		 	}
		 	return problem.message;
		 },
		 
		/**
		 * @description Computes the problem id to use in the framework from the cssLint message
		 * @param {Object} message The original CSSLint problem message
		 * @returns {String} The problem id to pass into the framework
		 * @since 8.0
		 */
		_getProblemId: function(message) {
		    if(message.rule) {
		        if(message.rule.id) {
		            return message.rule.id;
		        }
		    }
		    if(message.data && message.data.nls) {
		    	return message.data.nls;
		    }
		    return null;
		},
		
		/**
		 * @description Computes the problem range (within the line) for the problem annotation
		 * @param {Object} message The original CSSLint problem message
		 * @returns {Object} Object containing start and end properties to pass into the framework
		 * @since 8.0
		 */
		_getProblemRange: function(message) {
			if (!message.rule || !message.rule.id || message.rule.id === "errors"){
				// Parsing errors often don't have a token to select, so instead select the line
				return [1, message.evidence.length + 1];
			}
		    var token = this._findToken(message.evidence, message.col);
		    var end = message.col + (token ? token.length : 1);
		    return [message.col, end];
		},
		
		_punc: "\n\t\r (){}[]:;,",  //$NON-NLS-0$
		
		/**
		 * @description Returns the token or word found at the given offset
		 * @param {String} contents The text to search for the token
		 * @param {Number} offset The offset in the contents to start the search
		 * @returns {String} Returns the computed token from the given string and offset or <code>null</code>
		 * @since 8.0
		 */
		_findToken: function(contents, offset) {
			if(contents && offset) {
				var ispunc = this._punc.indexOf(contents.charAt(offset)) > -1;
				var pos = ispunc ? offset-1 : offset;
				while(pos >= 0) {
					if(this._punc.indexOf(contents.charAt(pos)) > -1) {
						break;
					}
					pos--;
				}
				var s = pos;
				pos = offset;
				while(pos <= contents.length) {
					if(this._punc.indexOf(contents.charAt(pos)) > -1) {
						break;
					}
					pos++;
				}
				if((s === offset || (ispunc && (s === offset-1))) && pos === offset) {
					return null;
				}
				else if(s === offset) {
					return contents.substring(s, pos);
				}
				return contents.substring(s+1, pos);
			}
			return null;
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
		},
		
		/**
		 * @description Hook for the test suite to enable only the given rule, or set all rules to a certain severity
		 * @function
		 * @private
		 * @param {String} ruleid The id for the rule, if null all rules will be set to the given severity
		 * @param {Number} severity The desired severity or null
		 * @since 8.0
		 */
		_enableOnly: function _enableOnly(ruleid, severity) {
			config.archivedRules = {};
		    var keys = Object.keys(config.rules);
		    for(var i = 0; i < keys.length; i++) {
		    	if (!ruleid){
		    		config.archivedRules[keys[i]] = config.rules[ruleid];
			        config.setOption(keys[i], severity ? severity : 2);
		    	} else {
			        if(keys[i] === ruleid) {
			        	config.archivedRules[ruleid] = config.rules[ruleid];
			            config.setOption(ruleid, severity ? severity : 2);
			        } else {
			        	config.archivedRules[keys[i]] = config.rules[ruleid];
			            config.setOption(keys[i], 0);
			        }
		        }
		    }
		},
		
		/**
		 * @description Hook for the test suite to restore the rule settings after
		 * calling _enableOnly.  Does not support complex rules (csslint doesn't have any currently)
		 * @function
		 * @private
		 * @since 8.0
		 */
		_restoreRules: function _enableOnly() {
			if (config.archivedRules){
				config.rules = config.archivedRules;
				config.archivedRules = undefined;
			}
		},
	   
	   /**
	    * @description Hook for the parser test suite
	    * @function
	    * @private
	    * @since 8.0
	    */
		_defaultRuleSet: function _defaultConfig() {
		    return config.getRuleSet();
		}
	});
	
	return CssValidator;
});