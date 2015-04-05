/*eslint-env amd */
define([
    './globals'
], function(globals) {
/**
 * @fileoverview Defines environment settings and globals.
 * @author Elan Shanker
 * @copyright 2014 Elan Shanker. All rights reserved.
 */
"use strict";

var exports = {
    builtin: globals.builtin,
    browser: {
        globals: globals.browser
    },
    node: {
        globals: globals.node,
        ecmaFeatures: {
            globalReturn: true
        }
    },
    amd: {
        globals: globals.amd
    },
    mocha: {
        globals: globals.mocha
    },
    jasmine: {
        globals: globals.jasmine
    },
    phantomjs: {
        globals: globals.phantom
    },
    jquery: {
        globals: globals.jquery
    },
    prototypejs: {
        globals: globals.prototypejs
    },
    shelljs: {
        globals: globals.shelljs
    },
    meteor: {
        globals: globals.meteor
    }
};

    return exports;
});
