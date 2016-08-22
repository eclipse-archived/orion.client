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
var breakableTypePattern = /^(?:(?:Do)?While|For(?:In|Of)?|Switch)Statement$/;

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
 * Gets the label if the parent node of a given node is a LabeledStatement.
 *
 * @param {ASTNode} node - A node to get.
 * @returns {string|null} The label or `null`.
 */
exports.getLabel = function(node) {
	if (node.parent.type === "LabeledStatement") {
		return node.parent.label.name;
	}
	return null;
};

exports.isBreakableStatement = function(node) {
	return breakableTypePattern.test(node.type);
};

	return exports;
});
