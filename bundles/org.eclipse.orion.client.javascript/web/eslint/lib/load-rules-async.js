/*global define require*/

/**
 * Implements eslint's load-rules API for AMD. Our rules are loaded as AMD dependencies.
 */
define([
    "eslint/rules/no-undef"
], function(noundef) {
    var rules = {
        "no-undef": noundef
    };

    return function() {
        return rules;
    };
});
