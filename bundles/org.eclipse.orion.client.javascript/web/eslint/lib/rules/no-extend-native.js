/*eslint-env amd */
define([
	'eslint/conf/globals',
	'i18n!javascript/nls/problems',
	'module',
], function(globals, ProblemMessages, module) {
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

		var config = context.options[0] || {};
		var exceptions = config.exceptions || [];
		var modifiedBuiltins = Object.keys(globals.builtin).filter(function(builtin) {
			return builtin[0].toUpperCase() === builtin[0];
		});

		if (exceptions.length) {
			modifiedBuiltins = modifiedBuiltins.filter(function(builtIn) {
				return exceptions.indexOf(builtIn) === -1;
			});
		}

		return {

			// handle the Array.prototype.extra style case
			"AssignmentExpression": function(node) {
				var lhs = node.left,
					affectsProto;

				if (lhs.type !== "MemberExpression" || lhs.object.type !== "MemberExpression") {
					return;
				}

				affectsProto = lhs.object.computed ?
					lhs.object.property.type === "Literal" && lhs.object.property.value === "prototype" :
					lhs.object.property.name === "prototype";

				if (!affectsProto) {
					return;
				}

				modifiedBuiltins.forEach(function(builtin) {
					if (lhs.object.object.name === builtin) {
						context.report(node, ProblemMessages.noExtendNative, {builtin: builtin});
					}
				});
			},

			// handle the Object.definePropert[y|ies](Array.prototype) case
			"CallExpression": function(node) {

				var callee = node.callee,
					subject,
					object;

				// only worry about Object.definePropert[y|ies]
				if (callee.type === "MemberExpression"
						&& callee.object.name === "Object"
						&& (callee.property.name === "defineProperty" || callee.property.name === "defineProperties")) {

					// verify the object being added to is a native prototype
					subject = node.arguments[0];
					object = subject.object;

					if (object &&
						object.type === "Identifier" &&
						modifiedBuiltins.indexOf(object.name) > -1 &&
						subject.property.name === "prototype") {

						context.report(node, ProblemMessages.noExtendNative, {builtin: object.name});
					}
				}

			}
		};

	};

	module.exports.schema = [{
		"type": "object",
		"properties": {
			"exceptions": {
				"type": "array",
				"items": {
					"type": "string"
				},
				"uniqueItems": true
			}
		},
		"additionalProperties": false
	}];


	return module.exports;
});