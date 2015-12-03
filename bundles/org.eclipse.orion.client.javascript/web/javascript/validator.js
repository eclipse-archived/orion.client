/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
define([
	"orion/objects",
	"json!javascript/rules.json",
	"orion/i18nUtil",
	"i18n!javascript/nls/problems",
	'orion/Deferred',
	"javascript/finder"
], function(Objects, Rules, i18nUtil, messages, Deferred, Finder) {
	var config = {
		// 0:off, 1:warning, 2:error
		defaults: Rules.rules,
		
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
		},
		
		setDefaults: function setDefaults() {
		    this.rules = Object.create(null);
		    var keys = Object.keys(this.defaults);
		    for(var i = 0; i < keys.length; i++) {
		        var key = keys[i];
		        this.rules[key] = this.defaults[key];
		    }
		}
	};

	/**
	 * @description Creates a new ESLintValidator
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} astManager The AST manager backing this validator
	 * @param {javascript.CUProvider} cuProvider
	 * @returns {ESLintValidator} Returns a new validator
	 */
	function ESLintValidator(ternWorker, cuProvider) {
		this.ternWorker = ternWorker;
		this.cuprovider = cuProvider;
		config.setDefaults();
	}
	
	/**
	 * @description Converts the configuration rule value to an Orion problem severity string. One of 'warning', 'error'.
	 * @param {Object} prob The problem object
	 * @returns {String} the severity string
	 */
	function getSeverity(prob) {
		var val = 2;
		var ruleConfig = config.rules[prob.ruleId];
		if(Array.isArray(ruleConfig)) {
			// Hack for missing-doc which overloads the prob.related object to expose which subrule
			// generated the problem
			var related = prob.related, ruleType = related && related.type;
			if (prob.ruleId === "missing-doc" && ruleConfig[1][ruleType] !== undefined) {
				val = ruleConfig[1][ruleType];
			} else {
				val = ruleConfig[0];
			}
		}
		else {
			val = ruleConfig;
		}
		switch (val) {
			case 1: return "warning"; //$NON-NLS-0$
			case 2: return "error"; //$NON-NLS-0$
		}
		return "error"; //$NON-NLS-0$
	}
	
	/**
	 * @description Computes the problem id to use in the framework from the ESLint problem object
	 * @param {Object} pb The original ESLint problem
	 * @returns {String} The problem id to pass into the framework
	 * @since 8.0
	 */
	function getProblemId(pb) {
	    if(pb.args) {
	        if(pb.args.pid) {
	            return pb.args.pid;
	        } else if(pb.args.nls) {
	            return pb.args.nls;
	        }
	    }
	    return pb.ruleId;
	}
	
	/**
	 * @description Converts an eslint / esprima problem object to an Orion problem object
	 * @public
	 * @param {eslint.Error|esprima.Error} e Either an eslint error or an esprima parse error.
	 * @returns {Object} Orion Problem object
	 */
	function toProblem(e) {
		var start = e.start, end = e.end;
		if (e.node) {
			// Error produced by eslint
			start = e.node.range[0];
			end = e.node.range[1];
			if (e.related && e.related.range) {
				// Flagging the entire node is distracting. Just flag the bad token.
				var relatedToken = e.related;
				start = relatedToken.range[0];
				end = relatedToken.range[1];
			}
		}
		var descriptionKey = e.args && e.args.nls ? e.args.nls : e.ruleId;
		var descriptionArgs = e.args || Object.create(null);
		var description = e.message;
		if (descriptionKey && messages[descriptionKey]) {
			description = i18nUtil.formatMessage.call(null, messages[descriptionKey], descriptionArgs);
		}
		var prob = {
			id: getProblemId(e),
			description: description,
			severity: getSeverity(e)
		};
		if (e.node && e.nodeType === "Program" && typeof(e.line) !== 'undefined') {
			prob.line = e.line;
			prob.start = e.column;
		} else if(typeof(start) !== 'undefined') {
			prob.start = start;
			prob.end = end;
		} else if(typeof(e.index) === 'number') {
			prob.start = end;
			prob.end = e.index;
		} else if(typeof(e.lineNumber) !== 'undefined') {
			prob.line = e.lineNumber;
			prob.start = e.column;
		} else {
			prob.start = 0;
			prob.end = 0;
		}
		if (e.args && e.args.data){
			// Pass along any additional data to the problem annotation (Bug 464538)
			prob.data = e.args.data;
		}
		return prob;
	}

	Objects.mixin(ESLintValidator.prototype, {
		/**
		 * @description Callback to create problems from orion.edit.validator
		 * @function
		 * @public
		 * @param {orion.edit.EditorContext} editorContext The editor context
		 * @param {Object} context The in-editor context (selection, offset, etc)
		 * @returns {orion.Promise} A promise to compute some problems
		 */
		computeProblems: function(editorContext /*, context*/) {
			var _self = this;
			var deferred = new Deferred();
			editorContext.getFileMetadata().then(function(meta) {
				if(meta.contentType.id === 'text/html') {
					editorContext.getText().then(function(text) {
						//auto-assume browser env - https://bugs.eclipse.org/bugs/show_bug.cgi?id=458676
						var env = Object.create(null);
						env.browser = true;
						// need to extract all scripts from the html text
						var cu = _self.cuprovider.getCompilationUnit(function(){
							return Finder.findScriptBlocks(text);
						}, meta);
						var cuText = cu.getEditorContext().getText();
						cuText.then(function(cuSource) {
							_self._validate(meta, cuSource, env, true, deferred);
						});
					});
				} else {
					editorContext.getText().then(function(text) {
						_self._validate(meta, text, null, false, deferred);
					});
				}
			});
			return deferred;
		},
		
		/**
		 * @description Validates the given AST
		 * @function
		 * @private
		 * @param {Object} text The given text
		 * @param {Object} env An environment object to set in the config
		 * @param {Boolean} htmlMode Set to <code>true</code> to ignore rules that are inaccurate for html script snippets
		 * @returns {Array|Object} The array of problem objects
		 * @since 6.0
		 */
		_validate: function(meta, text, env, htmlMode, deferred) {
			// When validating snippets in an html file ignore undefined rule because other scripts may add to the window object
			var undefRuleValue;
			if (htmlMode) {
				undefRuleValue = config.rules['no-undef'];
				config.rules['no-undef'] = 0;
			}
			
			config.env = env;
			var files = [{type: 'full', name: meta.location, text: text}]; //$NON-NLS-1$
			var request = {request: 'lint', args: {meta: {location: meta.location}, files: files, rules: config.rules}}; //$NON-NLS-1$
			if(env) {
				request.env = config.env;
			}
			this.ternWorker.postMessage(
				request, 
				/* @callback */ function(type, err) {
						var eslintErrors = []; 
						if(err) {
							eslintErrors.push({
								start: 0,
								args: {0: err.error, nls: "eslintValidationFailure" }, //$NON-NLS-0$
								severity: "error" //$NON-NLS-0$
							});
						} else if (type.problems) {
							type.problems.forEach(function(element) {
								eslintErrors.push(element);
							});
						}
						deferred.resolve({ problems: eslintErrors.map(toProblem) });
				});
			if (htmlMode) {
				config.rules['no-undef'] = undefRuleValue;
			}
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
			var oldconfig = properties.pid === 'eslint.config';
			var keys = Object.keys(properties);
			var seen = Object.create(null);
			for(var i = 0; i < keys.length; i++) {
			    var key = keys[i];
			    var ruleId = key;
			    if(oldconfig && config.rules[key] !== config.defaults[key]) {
			        //don't overwrite a new setting with an old one
		            continue;
			    }
			    var legacy = this._legacy[ruleId];
			    if(typeof(legacy) === 'string') {
			        ruleId = legacy;
			        if(seen[ruleId]) {
			            //don't overwrite a new pref name with a legacy one
			            continue;
			        }
			    }
			    seen[ruleId] = true;
			    config.setOption(ruleId, properties[key]);
			}
		},
		
		/**
		 * @description Hook for the test suite to enable only the given rule
		 * @function
		 * @private
		 * @param {String} ruleid The id for the rule
		 * @param {Number} severity The desired severity or null
		 * @param {String} opts Option for a given rule, for example the missing-doc rule has 'decl' or 'expr'
		 * @since 8.0
		 */
		_enableOnly: function _enableOnly(ruleid, severity, opts) {
		    var keys = Object.keys(config.rules);
		    for(var i = 0; i < keys.length; i++) {
		        if(keys[i] === ruleid) {
		            config.setOption(ruleid, severity ? severity : 2, opts);
		        } else {
		            config.setOption(keys[i], 0);
		        }
		    }
		},
		
		/**
		 * All new pref ids MUST be the id of the rule they are for, but to 
		 * not break existing prefs this object translates the old pref name to its rule name
		 * @private 
		 * @since 8.0
		 */
		_legacy: {
		    'throw-error': 'no-throw-literal', //$NON-NLS-1$
		    validate_no_cond_assign: 'no-cond-assign', //$NON-NLS-1$
		    validate_no_constant_condition: 'no-constant-condition', //$NON-NLS-1$
		    validate_no_caller: 'no-caller', //$NON-NLS-1$
		    validate_eqeqeq: 'eqeqeq', //$NON-NLS-1$
		    validate_no_console: 'no-console', //$NON-NLS-1$
		    validate_debugger: 'no-debugger', //$NON-NLS-1$
		    validate_eval: 'no-eval', //$NON-NLS-1$
		    validate_no_iterator:'no-iterator', //$NON-NLS-1$
		    validate_dupe_obj_keys: 'no-dupe-keys', //$NON-NLS-1$
		    validate_typeof: 'valid-typeof', //$NON-NLS-1$
		    validate_use_before_define: 'no-use-before-define', //$NON-NLS-1$
		    validate_new_parens: 'new-parens', //$NON-NLS-1$
		    validate_radix: 'radix', //$NON-NLS-1$
		    validate_missing_semi: 'semi', //$NON-NLS-1$
		    validate_no_regex_spaces: 'no-spaces-regex', //$NON-NLS-1$
		    validate_use_isnan: 'use-isnan', //$NON-NLS-1$
		    validate_throw_error: 'no-throw-literal', //$NON-NLS-1$
		    validate_no_reserved_keys: 'no-reserved-keys', //$NON-NLS-1$
		    validate_no_sparse_arrays: 'no-sparse-arrays', //$NON-NLS-1$
		    validate_curly: 'curly', //$NON-NLS-1$
		    validate_no_fallthrough: 'no-fallthrough', //$NON-NLS-1$
		    validate_no_comma_dangle: 'no-comma-dangle', //$NON-NLS-1$
		    validate_no_undef: 'no-undef', //$NON-NLS-1$
		    validate_no_empty_block: 'no-empty-block', //$NON-NLS-1$
		    validate_unnecessary_semi: 'no-extra-semi', //$NON-NLS-1$
		    validate_no_jslint: 'no-jslint', //$NON-NLS-1$
		    validate_unused_params: 'no-unused-params', //$NON-NLS-1$
		    validate_no_unused_vars: 'no-unused-vars', //$NON-NLS-1$
		    validate_no_unreachable: 'no-unreachable', //$NON-NLS-1$
		    validate_no_redeclare: 'no-redeclare', //$NON-NLS-1$
		    validate_no_shadow: 'no-shadow' //$NON-NLS-1$
		}
		
	});
	return ESLintValidator;
});
