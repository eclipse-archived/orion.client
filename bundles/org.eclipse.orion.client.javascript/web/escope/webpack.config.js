/**
 * THe follow steps describe how to use this build file
 *
 * 1. Clone the escope repo: https://github.com/estools/escope.git
 * 2. Change to the repo directory
 * 3. Install the node modules needed for building
 *  > npm i babel babel-core babel-loader babel-preset-es2015
 *  > npm i webpack
 *  > npm i json-loader
 * 4. Open the package.json file and remove the dependencies for es6-map and es6-weakmap
 * 5. Install the dependencies
 *  > npm install
 * 6. Edit the following files:
 *  - remove 'assert' use in referencer.js
 *  - remove 'es6-map' and 'assert' use in scope.js
 *  - remove 'es6-weak-map' and 'assert' use in scope-manager.js
 *  - remove the package.json/version import in index.js and put in the version directly
 * 7. Run 
 *  > webpack -p
 *  there should be no errors reported
 */
module.exports = {
    entry: './src/index.js',
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
            },
            {
                test: /\.js$/,
                loaders: ['babel']
              }
        ]
    }
    //debug: true,
    //devtool: "source-map"
};