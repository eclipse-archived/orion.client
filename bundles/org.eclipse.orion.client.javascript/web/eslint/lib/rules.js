/*global define module require exports */
(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory(require('./load-rules'), require, exports, module);
    }
    else if(typeof define === 'function' && define.amd) {
        define(['./load-rules-async', 'require', 'exports', 'module'], factory);
    }
    else {
        var req = function(id) {return root[id];},
            exp = root,
            mod = {exports: exp};
        root.Rules = factory(req, exp, mod);
    }
}(this, function(loadRules, require, exports, module) {
/**
 * @fileoverview Main CLI object.
 * @author Nicholas C. Zakas
 */
/*globals exports require*/

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------
//var loadRules = require("./load-rules");

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

    return exports;
}));
