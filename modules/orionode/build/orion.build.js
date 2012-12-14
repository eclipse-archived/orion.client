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
        location: '../../lib/dojo/org.dojotoolkit/dojo',
        main: 'lib/main-browser',
        lib: '.'
    }, {
        name: 'dijit',
        location: '../../lib/dojo/org.dojotoolkit/dijit',
        main: 'lib/main',
        lib: '.'
    }, {
        name: 'dojox',
        location: '../../lib/dojo/org.dojotoolkit/dojox',
        main: 'lib/main',
        lib: '.'
    }],
    paths: {
        text: 'requirejs/text',
        i18n: 'requirejs/i18n',
	    domReady: 'requirejs/domReady'
    }
})