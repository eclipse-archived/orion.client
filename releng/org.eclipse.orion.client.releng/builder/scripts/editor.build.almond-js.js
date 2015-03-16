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
// optimization script to concat/minify the Orion editor javascript code
 
({
    baseUrl: '.',
	closure: {
		CompilerOptions: {
			languageIn: Packages.com.google.javascript.jscomp.CompilerOptions.LanguageMode.valueOf(Packages.com.google.javascript.jscomp.CompilerOptions.LanguageMode, "ECMASCRIPT5")
		},
		CompilationLevel: 'SIMPLE_OPTIMIZATIONS',
		loggingLevel: 'WARNING'
	},
	paths: {
        almond: 'requirejs/almond',
        i18n: 'requirejs/i18n',
        csslint: 'csslint/csslint',
	},
	name: "almond",
	locales: ["ja", "zh", "zh-tw", "fr", "de", "it", "es", "pt-br"],						
	include: "orion/editor/edit",
	preserveLicenseComments: false,
	generateSourceMaps: true,
	uglify: {
		ascii_only: true
	},
	// https://github.com/jrburke/almond#exporting-a-public-api
	wrap: {
		start: "\
			(function (root, factory) {\n\
				if (typeof define === 'function' && define.amd) {\n\
					define([], factory);\n\
				} else {\n\
					root.orion = root.orion || {};\n\
					root.orion.editor = root.orion.editor || {};\n\
					root.orion.editor.edit = factory();\n\
				}\n\
			}(this, function () {\n\
		",
		end: "\n\
				return require('orion/editor/edit');\n\
			}));"
	}
})