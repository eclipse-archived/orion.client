/*eslint-env amd */
define([
	'i18n!javascript/nls/problems',
	'module'
], function(ProblemMessages, module) {
	/**
	 * @fileoverview Rule to flag unnecessary double negation in Boolean contexts
	 * @author Brandon Mills
	 */

	"use strict";

	//------------------------------------------------------------------------------
	// Rule Definition
	//------------------------------------------------------------------------------

	module.exports = function(context) {

		return {
			"UnaryExpression": function(node) {
				var ancestors = context.getAncestors(),
					parent = ancestors.pop(),
					grandparent = ancestors.pop();

				// Exit early if it's guaranteed not to match
				if (node.operator !== "!" ||
					parent.type !== "UnaryExpression" ||
					parent.operator !== "!") {
					return;
				}

				// if (<bool>) ...
				if (grandparent.type === "IfStatement") {
					context.report(node, ProblemMessages.noExtraBooleanCastIfStatement);

					// do ... while (<bool>)
				} else if (grandparent.type === "DoWhileStatement") {
					context.report(node, ProblemMessages.noExtraBooleanCastDoWhileStatement);

					// while (<bool>) ...
				} else if (grandparent.type === "WhileStatement") {
					context.report(node, ProblemMessages.noExtraBooleanCastWhileStatement);

					// <bool> ? ... : ...
				} else if (grandparent.type === "ConditionalExpression" &&
					parent === grandparent.test) {
					context.report(node, ProblemMessages.noExtraBooleanCastConditionalExpression);

					// for (...; <bool>; ...) ...
				} else if (grandparent.type === "ForStatement" &&
					parent === grandparent.test) {
					context.report(node, ProblemMessages.noExtraBooleanCastForStatement);

					// !<bool>
				} else if (grandparent.type === "UnaryExpression" &&
					grandparent.operator === "!") {
					context.report(node, ProblemMessages.noExtraBooleanCastUnaryExpression);

					// Boolean(<bool>)
				} else if (grandparent.type === "CallExpression" &&
					grandparent.callee.type === "Identifier" &&
					grandparent.callee.name === "Boolean") {
					context.report(node, ProblemMessages.noExtraBooleanCastToBoolean);

					// new Boolean(<bool>)
				} else if (grandparent.type === "NewExpression" &&
					grandparent.callee.type === "Identifier" &&
					grandparent.callee.name === "Boolean") {
					context.report(node, ProblemMessages.noExtraBooleanCastConstructorCall);
				}
			}
		};

	};

	module.exports.schema = [];

	return module.exports;
});