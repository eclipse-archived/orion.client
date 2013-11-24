/*global define module require exports */
(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory(require, exports, module);
    }
    else if(typeof define === 'function' && define.amd) {
        define(['require', 'exports', 'module'], factory);
    }
    else {
        var req = function(id) {return root[id];},
            exp = root,
            mod = {exports: exp};
        root.util = factory(req, exp, mod);
    }
}(this, function(require, exports, module) {
/**
 * @fileoverview Common utilities.
 */

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------
exports.mixin = function(target, source) {
    Object.keys(source).forEach(function(key) {
        target[key] = source[key];
    });
};

    return module.exports;
}));
