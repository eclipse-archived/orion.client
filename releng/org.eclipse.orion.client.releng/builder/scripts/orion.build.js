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
    optimizeCss: "standard.keepLines",
    optimize: "closure",
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
        "${buildDirectory}/bundles/org.eclipse.orion.client.core",
        "${buildDirectory}/bundles/org.eclipse.orion.client.cf",
        "${buildDirectory}/bundles/org.eclipse.orion.client.ui",
        "${buildDirectory}/bundles/org.eclipse.orion.client.editor",
        "${buildDirectory}/bundles/org.eclipse.orion.client.git",
        "${buildDirectory}/bundles/org.eclipse.orion.client.javascript",
        "${buildDirectory}/bundles/org.eclipse.orion.client.users"
    ],
    // Folders that should be searched for JSDoc
    jsdocs: [
        "${buildDirectory}/bundles/org.eclipse.orion.client.core/web/orion/",
        "${buildDirectory}/bundles/org.eclipse.orion.client.cf/web/orion/",
        "${buildDirectory}/bundles/org.eclipse.orion.client.ui/web/orion/",
        "${buildDirectory}/bundles/org.eclipse.orion.client.editor/web/orion/",
        "${buildDirectory}/bundles/org.eclipse.orion.client.git/web/orion/",
        "${buildDirectory}/bundles/org.eclipse.orion.client.javascript/web/javascript/",
        "${buildDirectory}/bundles/org.eclipse.orion.client.users/web/orion/"
    ],
    // List of modules that r.js will optimize
    modules: [
        { name: "index", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "cfui/logs", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.cf" },
        { name: "cfui/plugins/cFDeployService", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.cf" },
        { name: "cfui/plugins/cFPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.cf" },
        { name: "compare/compare", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "edit/content/imageViewerPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "edit/content/jsonEditorPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "edit/edit", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "git/git-commit", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.git" },
        { name: "git/git-log", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.git" },
        { name: "git/git-repository", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.git" },
        { name: "git/git-status", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.git" },
        { name: "git/plugins/gitPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.git" },
        { name: "javascript/plugins/javascriptPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.javascript" },
        { name: "mixloginstatic/LoginWindow", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "mixloginstatic/manageOpenids", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "operations/list", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/GerritFilePlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/GitHubFilePlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/authenticationPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/csslintPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/fileClientPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/gitBlamePlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/jslintPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/css/cssPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/html/htmlPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/java/javaPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/php/phpPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/python/pythonPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/ruby/rubyPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/xml/xmlPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/yaml/yamlPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/npmPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/pageLinksPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/preferencesPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/site/sitePlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/taskPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/webEditingPlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "profile/user-list", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.users" },
        { name: "profile/userservicePlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.users" },
        { name: "search/search", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "settings/settings", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "shell/plugins/shellPagePlugin", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "shell/shellPage", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "sites/site", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "sites/sites", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
        { name: "sites/view", bundle: "${buildDirectory}/bundles/org.eclipse.orion.client.ui" },
    ]
})