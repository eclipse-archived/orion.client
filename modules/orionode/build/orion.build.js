({
    optimizeCss: "standard.keepLines",

    closure: {
        CompilerOptions: {},
        CompilationLevel: 'SIMPLE_OPTIMIZATIONS',
        loggingLevel: 'WARNING'
    },

    pragmas: {
        asynchLoader: true
    },

    locale: 'en-us',
    inlineText: true,

    baseUrl: '.',

    // set the paths to our library packages
    // mamacdon: I hacked the dojo path to resolve --  dojo is just too gigantic to copy into a staging dir
    packages: [{
        name: 'dojo',
        location: '../../node_modules/dojo',
        main: 'lib/main-browser',
        lib: '.'
    }, {
        name: 'dijit',
        location: '../../node_modules/dijit',
        main: 'lib/main',
        lib: '.'
    }, {
        name: 'dojox',
        location: '../../node_modules/dojox',
        main: 'lib/main',
        lib: '.'
    }],
    paths: {
        text: 'requirejs/text',
        i18n: 'requirejs/i18n',
	    domReady: 'requirejs/domReady'
    }
})