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
        { name: "index", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "cfui/logs", bundle: "${orionClient}/bundles/org.eclipse.orion.client.cf" },
        { name: "cfui/plugins/cFDeployService", bundle: "${orionClient}/bundles/org.eclipse.orion.client.cf" },
        { name: "cfui/plugins/cFPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.cf" },
        { name: "compare/compare", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "edit/content/imageViewerPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "edit/content/jsonEditorPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "edit/edit", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "git/git-commit", bundle: "${orionClient}/bundles/org.eclipse.orion.client.git" },
        { name: "git/git-log", bundle: "${orionClient}/bundles/org.eclipse.orion.client.git" },
        { name: "git/git-repository", bundle: "${orionClient}/bundles/org.eclipse.orion.client.git" },
        { name: "git/git-status", bundle: "${orionClient}/bundles/org.eclipse.orion.client.git" },
        { name: "git/plugins/gitPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.git" },
        { name: "javascript/plugins/javascriptPluginLoader",
          bundle: "${orionClient}/bundles/org.eclipse.orion.client.javascript",
          caller: "javascriptPlugin.html"
        },
        { name: "javascript/plugins/javascriptPlugin",
          bundle: "${orionClient}/bundles/org.eclipse.orion.client.javascript",
          caller: ["javascriptPluginLoader.js", "javascriptWorker.js"]
        },
        { name: "mixloginstatic/LoginWindow", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "mixloginstatic/manageOpenids", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "operations/list", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/GerritFilePlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/GitHubFilePlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/authenticationPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/csslintPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/fileClientPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/gitBlamePlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/jslintPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/css/cssPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/html/htmlPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/java/javaPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/php/phpPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/python/pythonPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/ruby/rubyPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/xml/xmlPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/languages/yaml/yamlPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/npmPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/pageLinksPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/preferencesPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/site/sitePlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/taskPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "plugins/webEditingPlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "profile/user-list", bundle: "${orionClient}/bundles/org.eclipse.orion.client.users" },
        { name: "profile/userservicePlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.users" },
        { name: "search/search", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "settings/settings", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "shell/plugins/shellPagePlugin", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "shell/shellPage", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "sites/site", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "sites/sites", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
        { name: "sites/view", bundle: "${orionClient}/bundles/org.eclipse.orion.client.ui" },
    ]
})