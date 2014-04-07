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
    optimizeCss: "standard.keepLines",
    optimize: "closure",
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

    pragmas: {
        asynchLoader: true
    },

    // Only minify files listed in modules section, ignore other .js files in staging directory.
    // This option seems to be problematic: r.js does not minify the modules we *want* minified. So, omit it for now.
    //skipDirOptimize: true,

    baseUrl: '.',
    locale: 'en-us',
    inlineText: true,
    paths: {
        text: 'requirejs/text',
        i18n: 'requirejs/i18n',
        domReady: 'requirejs/domReady',
        gcli: 'gcli/gcli',
        util: 'gcli/util',
        esprima: 'esprima/esprima',
        estraverse: 'estraverse/estraverse',
        escope: 'escope/escope',
    },
    packages: [
        {
            name: "eslint",
            location: "eslint/lib",
            main: "eslint"
        },
        // As eslint/conf/ is not located in eslint/lib/, override the previous package
        {
            name: "eslint/conf",
            location: "eslint/conf",
        }],
    // Bundles whose ./web/ folders will be copied into the staging directory by the builder.
    bundles: [
        "${orionClient}/bundles/org.eclipse.orion.client.core",
        "${orionClient}/bundles/org.eclipse.orion.client.cf",
        "${orionClient}/bundles/org.eclipse.orion.client.ui",
        "${orionClient}/bundles/org.eclipse.orion.client.editor",
        "${orionClient}/bundles/org.eclipse.orion.client.git",
        "${orionClient}/bundles/org.eclipse.orion.client.javascript",
        "${orionClient}/bundles/org.eclipse.orion.client.users"
    ],
    // Folders that should be searched for JSDoc
    jsdocs: [
        "${orionClient}/bundles/org.eclipse.orion.client.core/web/orion/",
        "${orionClient}/bundles/org.eclipse.orion.client.cf/web/orion/",
        "${orionClient}/bundles/org.eclipse.orion.client.ui/web/orion/",
        "${orionClient}/bundles/org.eclipse.orion.client.editor/web/orion/",
        "${orionClient}/bundles/org.eclipse.orion.client.git/web/orion/",
        "${orionClient}/bundles/org.eclipse.orion.client.javascript/web/javascript/",
        "${orionClient}/bundles/org.eclipse.orion.client.users/web/orion/"
    ],
    // List of modules that r.js will optimize
    modules: [
        { name: "index" },
        { name: "cfui/logs" },
        { name: "cfui/plugins/cFDeployService" },
        { name: "cfui/plugins/cFPlugin" },
        { name: "compare/compare" },
        { name: "edit/content/imageViewerPlugin" },
        { name: "edit/content/jsonEditorPlugin" },
        { name: "edit/edit" },
        { name: "git/git-commit" },
        { name: "git/git-log" },
        { name: "git/git-repository" },
        { name: "git/git-status" },
        { name: "git/plugins/gitPlugin" },
        { name: "javascript/plugins/javascriptPluginLoader" },
        { name: "javascript/plugins/javascriptPlugin" },
        { name: "mixloginstatic/LoginWindow" },
        { name: "mixloginstatic/manageOpenids" },
        { name: "operations/list" },
        { name: "plugins/GerritFilePlugin" },
        { name: "plugins/GitHubFilePlugin" },
        { name: "plugins/authenticationPlugin" },
        { name: "plugins/csslintPlugin" },
        { name: "plugins/fileClientPlugin" },
        { name: "plugins/gitBlamePlugin" },
        { name: "plugins/jslintPlugin" },
        { name: "plugins/languages/arduino/arduinoPlugin" },
        { name: "plugins/languages/c/cPlugin" },
        { name: "plugins/languages/cpp/cppPlugin" },
        { name: "plugins/languages/css/cssPlugin" },
        { name: "plugins/languages/html/htmlPlugin" },
        { name: "plugins/languages/java/javaPlugin" },
        { name: "plugins/languages/php/phpPlugin" },
        { name: "plugins/languages/python/pythonPlugin" },
        { name: "plugins/languages/ruby/rubyPlugin" },
        { name: "plugins/languages/xml/xmlPlugin" },
        { name: "plugins/languages/yaml/yamlPlugin" },
        { name: "plugins/npmPlugin" },
        { name: "plugins/pageLinksPlugin" },
        { name: "plugins/preferencesPlugin" },
        { name: "plugins/site/sitePlugin" },
        { name: "plugins/taskPlugin" },
        { name: "plugins/webEditingPlugin" },
        { name: "profile/user-list" },
        { name: "profile/userservicePlugin" },
        { name: "search/search" },
        { name: "settings/settings" },
        { name: "shell/plugins/shellPagePlugin" },
        { name: "shell/shellPage" },
        { name: "sites/site" },
        { name: "sites/sites" },
        { name: "sites/view" },
    ]
})
