/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global Packages*/
({
    //optimizeCss: "standard.keepLines",

    closure: {
        CompilerOptions: {
            // Avoids a TypeError when running r.js in Node
            languageIn: (typeof Packages === "object" && Packages) ?
                Packages.com.google.javascript.jscomp.CompilerOptions.LanguageMode.valueOf(Packages.com.google.javascript.jscomp.CompilerOptions.LanguageMode, "ECMASCRIPT5") 
                : "ECMASCRIPT5"
        },
        CompilationLevel: 'SIMPLE_OPTIMIZATIONS',
        loggingLevel: 'WARNING'
    },

    pragmas: {
        asynchLoader: true
    },

    locale: 'en-us',
    inlineText: true,
    baseUrl: '.',
    paths: {
        text: 'requirejs/text',
        i18n: 'requirejs/i18n',
        domReady: 'requirejs/domReady',
        gcli: 'gcli/gcli',
        util: 'gcli/util',
        estraverse: 'estraverse/estraverse',
        escope: 'escope/escope'
    },
    packages: [
        {
            name: "eslint",
            location: "eslint/lib",
            main: "eslint"
        },
        {
            name: "eslint/conf",
            main: "eslint/conf"
        }]
})