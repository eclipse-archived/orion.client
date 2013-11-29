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
			"eqeqeq": 1,
			"no-redeclare": 1,
			"no-undef": 2,
			"semi": 1
		}
	};

	function ESLintValidator() {
		this.active = true; // enabled by default
	}

	function getSeverity(prob) {
		switch (config.rules[prob.ruleId]) {
			case 1: return "warning";
			case 2: return "error";
		}
		return "error";
	}
	/**
	 * @param {Object} p { ruleId, node, message, line, col }
	 */
	function toProblem(p) {
		var start, end;
		if (p.node) {
			// Problem produced by eslint
			start = p.node.range[0];
			end = p.node.range[1];
		} else if (typeof p.index === "number") {
			// Esprima parse error
			start = p.index;
		}
		var prob = {
			description: p.message,
			severity: getSeverity(p),
			start: start,
			end: end
		};
		console.log(prob);
		return prob;
	}
	/**
	 * Extracts any errors captured by the tolerant esprima parser
	 */
	function extractParseErrors(ast) {
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
	}
	objects.mixin(ESLintValidator.prototype, {
		// orion.edit.validator
		computeProblems: function(editorContext, context) {
			if (!this.active) {
				return {};
			}
			return editorContext.getAST().then(function(ast) {
				var problems;
				try {
					problems = eslint.verify(ast, config);
					problems = problems.concat(extractParseErrors(ast));
					problems = problems.map(toProblem);
				} catch (e) {
					problems = [{
						start: 0,
						description: "Error validating file: " + e.toString(),
						severity: "error"
					}];
				}
				return { problems: problems };
			});
		},
		// orion.cm.managedservice
		updated: function(properties) {
			if (!properties) {
				return;
			}
			if (typeof properties.active === "boolean") {
				this.active = properties.active;
			}
		}
	});
	return ESLintValidator;
});