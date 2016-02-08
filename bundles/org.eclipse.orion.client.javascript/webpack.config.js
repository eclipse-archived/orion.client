/*eslint-env node */
/* eslint-disable missing-nls */
var path = require('path');

module.exports = {
    entry: './web/javascript/javaScript.js',
    output: {
    	libraryTarget: 'umd',
        filename: 'orionJavaScript.js',
        sourceMapFilename: '[file].map'
    },
    resolve: {
    	root: [
    	       path.resolve('./web'),  //the js bundle path
    	       path.resolve('../org.eclipse.orion.client.core/web'), // core
    	       path.resolve('../org.eclipse.orion.client.editor/web'), // editor
    	       path.resolve('../org.eclipse.orion.client.ui/web') //UI
    	       ]
    },
    resolveLoader: {
    	alias: {
    		json: 'json-loader',
    		i18n: 'amdi18n-loader'
    	}
    },
    //debug: true,
    devtool: "#inline-source-map"
};
