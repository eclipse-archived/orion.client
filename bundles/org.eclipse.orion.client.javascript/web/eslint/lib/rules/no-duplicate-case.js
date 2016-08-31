/*eslint-env amd */
define([
	'i18n!javascript/nls/problems',
	'module'
], function (ProblemMessages, module) {
/**
 * @fileoverview Rule to disallow a duplicate case label.
 * @author Dieter Oberkofler
 * @author Burak Yigit Kaya
 * @copyright 2015 Dieter Oberkofler. All rights reserved.
 * @copyright 2015 Burak Yigit Kaya. All rights reserved.
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {

    return {
        "SwitchStatement": function(node) {
            var mapping = {};

            node.cases.forEach(function(switchCase) {
                var key = context.getSource(switchCase.test);
                if (mapping[key]) {
                    context.report(switchCase.test, ProblemMessages.noDuplicateCase);
                } else {
                    mapping[key] = switchCase;
                }
            });
        }
    };
};

module.exports.schema = [];

return module.exports;
});
