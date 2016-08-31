/*eslint-env amd */
define([
	'i18n!javascript/nls/problems',
	'module'
], function(ProblemMessages, module) {
	/**
	 * @fileoverview Rule to flag comparisons to null without a type-checking
	 * operator.
	 * @author Ian Christian Myers
	 */

	"use strict";

	//------------------------------------------------------------------------------
	// Rule Definition
	//------------------------------------------------------------------------------

	module.exports = function(context) {

		function getOperatorToken(context, node) {
			var tokens = context.getTokens(node),
				len = tokens.length,
				operator = node.operator;
			for (var i = 0; i < len; i++) {
				var t = tokens[i];
				if (t.value === operator) {
					return t;
				}
			}
			return null;
		}

		return {

			"BinaryExpression": function(node) {
				var badOperator = node.operator === "==" || node.operator === "!=";
				if (node.right.type === "Literal" && node.right.raw === "null" && badOperator ||
					node.left.type === "Literal" && node.left.raw === "null" && badOperator) {
					context.report(node, ProblemMessages.noEqNull, {op: node.operator}, getOperatorToken(context, node)); //$NON-NLS-1$ //$NON-NLS-2$
				}
			}
		};

	};

	module.exports.schema = [];

	return module.exports;
});