/*eslint-env amd */
define([
	'i18n!javascript/nls/problems',
	'module'
], function (ProblemMessages, module) {
	/**
	 * @fileoverview Rule to forbid control charactes from regular expressions.
	 * @author Nicholas C. Zakas
	 */

	"use strict";

	//------------------------------------------------------------------------------
	// Rule Definition
	//------------------------------------------------------------------------------

	module.exports = function(context) {
		/**
		 * Checks reference if is non initializer and writable.
		 * @param {Reference} reference - A reference to check.
		 * @param {int} index - The index of the reference in the references.
		 * @param {Reference[]} references - The array that the reference belongs to.
		 * @returns {boolean} Success/Failure
		 * @private
		 */
		function isModifyingReference(reference, index, references) {
			var identifier = reference.identifier;

			return identifier &&
				reference.init === false &&
				reference.isWrite() &&
				// Destructuring assignments can have multiple default value,
				// so possibly there are multiple writeable references for the same identifier.
				(index === 0 || references[index - 1].identifier !== identifier
			);
		}

		function getModifyingReferences(references) {
			return references.filter(isModifyingReference);
		}

		/**
		 * Finds and reports references that are non initializer and writable.
		 * @param {Variable} variable - A variable to check.
		 * @returns {void}
		 */
		function checkVariable(variable) {
			getModifyingReferences(variable.references).forEach(function(reference) {
				context.report(
					reference.identifier,
					ProblemMessages.noConstantAssign,
					{
						name: reference.identifier.name
					});
			});
		}

		return {
			VariableDeclaration: function(node) {
				if (node.kind === "const") {
					context.getDeclaredVariables(node).forEach(checkVariable);
				}
			}
		};

	};
	module.exports.schema = [];

	return module.exports;
});