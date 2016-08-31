/*eslint-env amd */
define([
	'i18n!javascript/nls/problems',
	'module'
], function(ProblemMessages, module) {
/**
 * @fileoverview A rule to disallow negated left operands of the `in` operator
 * @author Michael Ficarra
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {

    return {

        "BinaryExpression": function(node) {
            if (node.operator === "in" && node.left.type === "UnaryExpression" && node.left.operator === "!") {
                context.report(node, ProblemMessages.NoNegatedInLhs);
            }
        }
    };

};

module.exports.schema = [];

return module.exports;
});
