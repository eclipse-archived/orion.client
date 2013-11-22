/**
 * @fileoverview Main CLI object.
 * @author Nicholas C. Zakas
 */
/*globals exports require*/

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------
var loadRules = require("./load-rules");

//------------------------------------------------------------------------------
// Privates
//------------------------------------------------------------------------------

var rules = {};

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

var defineRule = exports.define = function(ruleId, rule) {
    rules[ruleId] = rule;
};

var load = exports.load = function(directory) {
    var rulesToLoad = loadRules(directory);
    Object.keys(rulesToLoad).forEach(function(ruleId) {
        defineRule(ruleId, rulesToLoad[ruleId]);
    });
};

exports.get = function(ruleId) {
    return rules[ruleId];
};

//------------------------------------------------------------------------------
// Initialization
//------------------------------------------------------------------------------
load();