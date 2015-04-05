/* eslint-env amd */
define([
'exports', 
], function(exports) {
/**
 * @fileoverview Common utilities.
 */
"use strict";

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

var PLUGIN_NAME_PREFIX = "eslint-plugin-";

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------
/**
 * Merges two objects together and assigns the result to the initial object. Can be used for shallow cloning.
 * @param {Object} target of the cloning operation
 * @param {Object} source object
 * @returns {void}
 */
exports.mixin = function(target, source) {
    Object.keys(source).forEach(function(key) {
        target[key] = source[key];
    });
};

/**
 * Merges two config objects. This will not only add missing keys, but will also modify values to match.
 * @param {Object} base config object
 * @param {Object} custom config object. Overrides in this config object will take priority over base.
 * @returns {Object} merged config object.
 */
exports.mergeConfigs = function mergeConfigs(base, custom) {

    Object.keys(custom).forEach(function (key) {
        var property = custom[key];

        if (key === "plugins") {
            if (!base[key]) {
                base[key] = [];
            }

            property.forEach(function (plugin) {
                // skip duplicates
                if (base[key].indexOf(plugin) === -1) {
                    base[key].push(plugin);
                }
            });
            return;
        }

        if (Array.isArray(base[key]) && !Array.isArray(property) && typeof property === "number") {
            // assume that we are just overriding first attribute
            base[key][0] = custom[key];
            return;
        }

        if (typeof property === "object" && !Array.isArray(property)) {
            // base[key] might not exist, so be careful with recursion here
            base[key] = mergeConfigs(base[key] || {}, custom[key]);
        } else {
            base[key] = custom[key];
        }
    });

    return base;
};

/**
 * Removes the prefix `eslint-plugin-` from a plugin name.
 * @param {string} pluginName The name of the plugin which may has the prefix.
 * @returns {string} The name of the plugin without prefix.
 */
exports.removePluginPrefix = function removePluginPrefix(pluginName) {
    var nameWithoutPrefix;

    if (pluginName.indexOf(PLUGIN_NAME_PREFIX) === 0) {
        nameWithoutPrefix = pluginName.substring(PLUGIN_NAME_PREFIX.length);
    } else {
        nameWithoutPrefix = pluginName;
    }

    return nameWithoutPrefix;
};

exports.PLUGIN_NAME_PREFIX = PLUGIN_NAME_PREFIX;

/**
 * @description Looks up the given reference in the current scope and its parent scopes
 * @param {Object} ref The AST node reference
 * @param {Object} scope The current EScope object
 * @returns The AST node the declares the given reference node or null if no declaration is found
 * @since 6.0
 */
exports.getDeclaration = function(ref, scope) {
	for (var curScope = scope; true; ) {
		if (!curScope) {
			return null;
		}
		var name = (ref.name ? ref.name : ref.identifier.name);
		var decl;
		curScope.variables.some(function(v) {
			if (v.name === name) {
				decl = v;
				return true;
			}
			return false;
		});
		if (decl) {
			return decl;
		}
		curScope = curScope.upper;
	}
};

/**
 * @description Returns if the node can lead to an unreachable statement
 * @param {Object} node The AST node
 * @returns {Boolean} If the node can lead to an unreachable warning
 * @since 6.0
 */
exports.returnableStatement = function(node) {
    switch (node.type) {
        case "ReturnStatement":
        case "ThrowStatement":
        case "ContinueStatement":
        case "BreakStatement":
            return true;
    }
    return false;
};

/**
 * Generalized helper for 'no-new-array'-like rules. Creates a a rule capable of flagging NewExpression
 * applied to a callee that is a builtin.
 * @param {String|String[]} symbol The name of the builtin symbol to check (eg "Array", "Object"),
 * or an array of symbol names.
 * @param {String|Function} message Error message to report, or a function that performs the reporting
 * itself.
 * @param {Object} context The rule context
 * @returns {Object} The rule
 */
exports.createNewBuiltinRule = function(symbol, messageOrFunc, context) {
	var symbols = Array.isArray(symbol) ? symbol : [symbol];
	var message = typeof messageOrFunc === "string" ? messageOrFunc : null; //$NON-NLS-0$
	var reportCallback = message ? null : messageOrFunc;

	function isGlobalScope(scope) {
		return scope.type === "global"; //$NON-NLS-0$
	}

	function isSynthetic(variable) {
		// Synthetic vars created by eslint (due to environments.json or a /*global block) have no defs
		return !variable.defs.length;
	}

	/**
	 * @returns {Boolean} true if name is declared as an explicit variable in scope
	 */
	function isDeclaredIn(name, scope) {
		return scope.variables.some(function(variable) {
			return name === variable.name && !isSynthetic(variable);
		});
	}

	/**
	 * @returns {Boolean} true if callee refers to a builtin
	 */
	function isBuiltin(callee) {
		var decl = exports.getDeclaration(callee, context.getScope());
		return decl && isGlobalScope(decl.scope) && !isDeclaredIn(callee.name, decl.scope);
	}

	return {
		"NewExpression": function(node) { //$NON-NLS-0$
			var callee = node.callee, index;
			if (callee && (index = symbols.indexOf(callee.name)) !== -1) {
				var badSymbol = symbols[index];
				if (isBuiltin(callee)) {
					// callee refers to the builtin `badSymbol`, so flag it
					if (message) {
						context.report(callee, message);
					}
					else {
						reportCallback(context, callee, badSymbol);
					}
				}
			}
		}
	};
};

    return exports;
});
