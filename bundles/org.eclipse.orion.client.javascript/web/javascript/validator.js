/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define*/
define([
	"eslint",
	"orion/objects",
	"javascript/astManager",
	"javascript/finder",
	'orion/Deferred'
], function(eslint, Objects, ASTManager, Finder, Deferred) {
	// Should have a better way of keeping this up-to-date with ./load-rules-async.js
	var config = {
		// 0:off, 1:warning, 2:error
		rules: {
			"eqeqeq": 1, //$NON-NLS-0$
			"no-redeclare": 1, //$NON-NLS-0$
			"no-undef": 2, //$NON-NLS-0$
			"no-unused-vars": 1, //$NON-NLS-0$
			"no-use-before-define": 1, //$NON-NLS-0$
			"semi": 1, //$NON-NLS-0$
			"no-extra-semi": 1, //$NON-NLS-0$
			"missing-func-decl-doc": [0, 'decl'], //$NON-NLS-0$ //$NON-NLS-1$
			"missing-func-expr-doc": [0, 'expr'], //$NON-NLS-0$ //$NON-NLS-1$
			'no-debugger' : 1, //$NON-NLS-0$
			'no-dupe-keys' : 2, //$NON-NLS-0$ 
			'no-eval' : 0, //$NON-NLS-0$ 
			'curly' : 0, //$NON-NLS-0$ 
			'new-parens' : 2, //$NON-NLS-0$
			'use-isnan' : 2, //$NON-NLS-0$
			'no-unused-params' : 1 //$NON-NLS-0$
		},
		/**
		 * @description Sets the given rule to the given enabled value
		 * @function
		 * @private
		 * @param {String} ruleId The id of the rule to change
		 * @param {Number} value The vlaue to set the rule to
		 */
		setOption: function(ruleId, value) {
			if (typeof value === "number") {
				if(Array.isArray(this.rules[ruleId])) {
					this.rules[ruleId][0] = value;
				}
				else {
					this.rules[ruleId] = value;
				}
			}
		}
	};

	/**
	 * @description Creates a new ESLintValidator
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} astManager The AST manager backing this validator
	 * @returns {ESLintValidator} Returns a new validator
	 */
	function ESLintValidator(astManager) {
		this.astManager = astManager;
	}
	
	/**
	 * @description Converts the configuration rule value to an eslint string. One of 'warning', 'error', 'ignore'
	 * @public
	 * @param {Object} prob The problem object
	 * @returns {String} the severity string
	 */
	function getSeverity(prob) {
		var val = 2;
		if(Array.isArray(config.rules[prob.ruleId])) {
			val = config.rules[prob.ruleId][0];
		}
		else {
			val = config.rules[prob.ruleId];
		}
		switch (val) {
			case 1: return "warning"; //$NON-NLS-0$
			case 2: return "error"; //$NON-NLS-0$
		}
		return "error"; //$NON-NLS-0$
	}
	
	/**
	 * @description Converts an eslint / esprima problem object to an Orion problem object
	 * @public
	 * @param {eslint.Error|esprima.Error} e Either an eslint error or an esprima parse error.
	 * @returns {Object} Orion Problem object
	 */
	function toProblem(e) {
		var start, end;
		if (e.node) {
			// Error produced by eslint
			start = e.node.range[0];
			end = e.node.range[1];
			if (e.related) {
				// Flagging the entire node is distracting. Just flag the bad token.
				var relatedToken = e.related;
				start = relatedToken.range[0];
				end = relatedToken.range[1];
			}
		}
		var prob = {
			description: e.message,
			severity: getSeverity(e),
			start: start,
			end: end
		};
		return prob;
	}

	Objects.mixin(ESLintValidator.prototype, {
		/**
		 * @description Extracts any errors captured by the tolerant Esprima parser and returns them
		 * @function
		 * @private
		 * @param {esprima.AST} ast The AST
		 * @returns {esprima.Error[]} The array of AST errors (if any)
		 */
		_extractParseErrors: function(ast) {
			var errors = [], errorMap = Object.create(null);
			var asterrors = ast.errors;
			if(asterrors) {
				var len = asterrors.length;
				for(var i = 0; i < len; i++) {
					var error = asterrors[i];
					var token = null;
					if(error.end && error.token) {
						token = {range: [error.index, error.end], value: error.token};
					}
					else if(ast.tokens.length > 0) {
						//error object did not contain the token infos, try to find it
						token = Finder.findToken(error.index, ast.tokens);	
					} 
					if(!token) {
						//failed to compute it, continue
						continue;
					}
					var msg = error.message;
					if(errorMap[error.index] === msg) {
						continue;
					}
					errorMap[error.index] = msg;
					if(error.type) {
						switch(error.type) {
							case ASTManager.ErrorTypes.Unexpected:
								error.message = msg = "Syntax error on token '"+token.value+"', delete this token.";
								break;
							case ASTManager.ErrorTypes.EndOfInput:
								error.message = "Syntax error, incomplete statement.";
								break;
						}
					}
					error.node = token;
					errors.push(error);
				}
			}
			return errors;
		},
		/**
		 * @description Callback to create problems from orion.edit.validator
		 * @function
		 * @public
		 * @param {orion.edit.EditorContext} editorContext The editor context
		 * @param {Object} context The in-editor context (selection, offset, etc)
		 * @returns {orion.Promise} A promise to compute some problems
		 */
		computeProblems: function(editorContext, context) {
			var _self = this;
			switch(context.contentType) {
				case 'text/html': 
					return editorContext.getText().then(function(text) {
						var blocks = Finder.findScriptBlocks(text);
						var len = blocks.length;
						var allproblems = [];
						for(var i = 0; i < len; i++) {
							//we don't want to cache these ASTs so call into the private parse method of the manager
							var block = blocks[i];
							var ast = _self.astManager.parse(block.text);
							var problems = _self._validateAst(ast).problems;
							var len2 = problems.length;
							for(var j = 0; j < len2; j++) {
								//patch the start of the problem for the script block offset
								problems[j].start += block.offset; 
								problems[j].end += block.offset; 
							}
							allproblems = allproblems.concat(problems);
						}
						return {problems: allproblems};
					});
				case 'application/javascript': 
					return this.astManager.getAST(editorContext).then(function(ast) {
						return _self._validateAst(ast);
					});
			}
		},
		
		/**
		 * @description Validates the given AST
		 * @function
		 * @private
		 * @param {Object} ast The AST
		 * @returns {Array|Object} The array of problem objects
		 * @since 6.0
		 */
		_validateAst: function(ast) {
			var eslintErrors = [], error;
			try {
				eslintErrors = eslint.verify(ast, config);
			} catch (e) {
				error = e;
			}
			var parseErrors = this._extractParseErrors(ast);
			var problems = []
				.concat(eslintErrors)
				.concat(parseErrors)
				.map(toProblem);
			if (error && !parseErrors.length) {
				// Warn about ESLint failure
				problems.push({
					start: 0,
					description: "ESLint could not validate this file because an error occurred: " + error.toString(),
					severity: "error" //$NON-NLS-0$
				});
			}
			return { problems: problems };
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
			config.setOption("missing-func-decl-doc", properties.validate_func_decl); //$NON-NLS-0$
			config.setOption("missing-func-expr-doc", properties.validate_func_expr); //$NON-NLS-0$
			config.setOption("eqeqeq", properties.validate_eqeqeq); //$NON-NLS-0$
			config.setOption("no-redeclare", properties.validate_no_redeclare); //$NON-NLS-0$
			config.setOption("no-undef", properties.validate_no_undef); //$NON-NLS-0$
			config.setOption("no-unused-vars", properties.validate_no_unused_vars); //$NON-NLS-0$
			config.setOption("no-use-before-define", properties.validate_use_before_define); //$NON-NLS-0$
			config.setOption("semi", properties.validate_missing_semi); //$NON-NLS-0$
			config.setOption("no-extra-semi", properties.validate_unnecessary_semi); //$NON-NLS-0$
			config.setOption("no-debugger", properties.validate_debugger); //$NON-NLS-0$
			config.setOption("no-dupe-keys", properties.validate_dupe_obj_keys); //$NON-NLS-0$
			config.setOption("no-eval", properties.validate_eval); //$NON-NLS-0$
			config.setOption("curly", properties.validate_curly); //$NON-NLS-0$
			config.setOption("new-parens", properties.validate_new_parens); //$NON-NLS-0$
			config.setOption("use-isnan", properties.validate_use_isnan); //$NON-NLS-0$
			config.setOption("no-unused-params", properties.validate_unused_params); //$NON-NLS-0$
		}
	});

	/**
	 * @name eslint.Error
	 * @class
	 * @property {String} ruleId
	 * @property {esprima.ASTNode} node
	 * @property {String} message
	 * @property {Number} line
	 * @property {Number} col
	 */
	/**
	 * @name esprima.Error
	 * @property {Number} index
	 * @property {String} message
	 */
	return ESLintValidator;
});
