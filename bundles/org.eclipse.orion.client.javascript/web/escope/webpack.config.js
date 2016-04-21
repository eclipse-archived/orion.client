module.exports = {
    entry: './lib/index.js',
    output: {
    	libraryTarget: 'amd',
        filename: './built-js/escope.js',
        sourceMapFilename: '[file].map'
    },
    module: {
        loaders: [
            {
                test: /\.json$/,
                loader: "json-loader" 
            }
        ]
    },
    //debug: true,
    devtool: "source-map"
};