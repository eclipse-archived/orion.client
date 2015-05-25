/*******************************************************************************
 * Copyright (c) 2013, 2014 IBM Corporation and others.
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
    generateSourceMaps: true,
    preserveLicenseComments: false,
    closure: {
        CompilerOptions: {
            // Need this check to avoid TypeError when eval'ing this buildfile without the Closure jars loaded, or from Node.
            languageIn: (typeof Packages === "object" && typeof Packages.com.google.javascript.jscomp.CompilerOptions.LanguageMode.valueOf === "function")
                ? Packages.com.google.javascript.jscomp.CompilerOptions.LanguageMode.valueOf(Packages.com.google.javascript.jscomp.CompilerOptions.LanguageMode, "ECMASCRIPT5")
                : "ECMASCRIPT5"
        },
        CompilationLevel: 'SIMPLE_OPTIMIZATIONS',
        loggingLevel: 'WARNING'
    },
	baseUrl: ".", //$NON-NLS-1$
	paths: {
		text: "requirejs/text", //$NON-NLS-1$
		esprima: "esprima/esprima", //$NON-NLS-1$
		estraverse: "estraverse/estraverse", //$NON-NLS-1$
		escope: "escope/escope", //$NON-NLS-1$
		logger: "javascript/logger", //$NON-NLS-1$
		doctrine: 'doctrine/doctrine', //$NON-NLS-1$
		i18n: "requirejs/i18n" //$NON-NLS-1$
	},
	packages: [
		{
			name: "eslint/conf", //$NON-NLS-1$
			location: "eslint/conf" //$NON-NLS-1$
		},
		{
			name: "eslint", //$NON-NLS-1$
			location: "eslint/lib", //$NON-NLS-1$
			main: "eslint" //$NON-NLS-1$
		},
	],
	name: "javascript/plugins/ternWorkerCore",
	wrap: {
		start: "importScripts('../../requirejs/require.min.js');\n",
		end: ""
	}
})
