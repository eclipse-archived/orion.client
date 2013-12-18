/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
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
	"orion/objects"
], function(eslint, objects) {
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
			"missing-func-decl-doc": [0, 'decl'], //$NON-NLS-0$ //$NON-NLS-1$
			"missing-func-expr-doc": [0, 'expr'] //$NON-NLS-0$ //$NON-NLS-1$
		},
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

	function ESLintValidator(astManager) {
		this.active = true; // enabled by default
		this.astManager = astManager;
	}
	/**
	 * @name getSeverity
	 * @description Computes the severity string from the given problem
	 * @private
	 * @param {eslint.Error} prob The ESLint problem to compute the severity from
	 * @returns {String} The severity string. One of <code>warning</code> or <code>error</code>
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
		return "ignore"; //$NON-NLS-0$
	}
	/**
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
		} else if (typeof e.index === "number") { //$NON-NLS-0$
			// Esprima parse error
			start = e.index;
		}
		var prob = {
			description: e.message,
			severity: getSeverity(e),
			start: start,
			end: end
		};
		return prob;
	}

	objects.mixin(ESLintValidator.prototype, {
		/**
		 * Extracts any errors captured by the tolerant esprima parser and returns them
		 * @param {esprima.ASTNode} ast
		 * @returns {esprima.Error[]}
		 */
		_extractParseErrors: function(ast) {
			var errors = [], errorMap = Object.create(null);
			(ast.errors || []).forEach(function(error) {
				var msg = error.message, match;
				// Errors come as 'Line nn: Unexpected foo'. Strip off the first part
				if ((match = /^Line \d+: /.exec(msg))) {
					error.message = msg = "Parse error: " + msg.substring(match.index + match[0].length) + ".";
				}
				// Hack to filter out duplicate error produced by our esprima, having same index and message as previous error.
				if (errorMap[error.index] === msg) {
					return;
				}
				errorMap[error.index] = msg;
				errors.push(error);
			});
			return errors;
		},
		// orion.edit.validator
		computeProblems: function(editorContext, context) {
			if (!this.active) {
				return {};
			}
			var _self = this;
			return this.astManager.getAST(editorContext).then(function(ast) {
				var eslintErrors = [], error;
				try {
					eslintErrors = eslint.verify(ast, config);
				} catch (e) {
					error = e;
				}
				var parseErrors = _self._extractParseErrors(ast);
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
			});
		},
		// orion.cm.managedservice
		updated: function(properties) {
			if (!properties) {
				return;
			}
			if (typeof properties.active === "boolean") { //$NON-NLS-0$
				this.active = properties.active;
			}
			config.setOption("missing-func-decl-doc", properties.validate_func_decl); //$NON-NLS-0$
			config.setOption("missing-func-expr-doc", properties.validate_func_expr); //$NON-NLS-0$
			config.setOption("eqeqeq", properties.validate_eqeqeq); //$NON-NLS-0$
			config.setOption("no-redeclare", properties.validate_no_redeclare); //$NON-NLS-0$
			config.setOption("no-undef", properties.validate_no_undef); //$NON-NLS-0$
			config.setOption("no-unused-vars", properties.validate_no_unused_vars); //$NON-NLS-0$
			config.setOption("no-use-before-define", properties.validate_use_before_define); //$NON-NLS-0$
			config.setOption("semi", properties.validate_missing_semi); //$NON-NLS-0$
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
