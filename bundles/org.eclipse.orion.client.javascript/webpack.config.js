/*eslint-env node */
/* eslint-disable missing-nls */
var path = require('path');
var name = "./built-js/orionJavaScript.js";
if(process.argv.indexOf('-p') > -1) {
	name = "./built-js/orionJavaScript.min.js";
}

module.exports = {
    entry: './web/javascript/api/javaScript.js',
    output: {
    	libraryTarget: 'umd',
        filename: name,
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
    devtool: "source-map"
};
