var LangResolver = require("./resolver.js");
var webpack = require('webpack');
var path = require("path");

var MINIFY = JSON.parse(process.env.PROD || process.env.MINIFY || "false");;

module.exports = {
  devtool: 'source-map',
  entry: {
      index: path.join(__dirname, "../bundles/org.eclipse.orion.client.ui/web/index.js"),
      edit: path.join(__dirname, "../bundles/org.eclipse.orion.client.ui/web/edit/edit.js"),
      apps: path.join(__dirname, "../bundles/org.eclipse.orion.client.cf/web/cfui/apps.js"),
      logs: path.join(__dirname, "../bundles/org.eclipse.orion.client.cf/web/cfui/logs.js"),
      orionPlugin: path.join(__dirname, "../bundles/org.eclipse.orion.client.ui/web/plugins/orionPluginEntry.js"),
      cfDeployPlugin: path.join(__dirname, "../bundles/org.eclipse.orion.client.cf/web/cfui/plugins/cFDeployPlugin.js"),
      genericDeploymentWizard: path.join(__dirname, "../bundles/org.eclipse.orion.client.cf/web/cfui/plugins/wizards/generic/genericDeploymentWizard.js"),
      orionSharedWorker: path.join(__dirname, "../bundles/org.eclipse.orion.client.ui/web/plugins/orionSharedWorker.js"),
      gitPlugin: path.join(__dirname, "../bundles/org.eclipse.orion.client.git/web/git/plugins/gitPlugin.js"),
      webToolsPlugin: path.join(__dirname, "../bundles/org.eclipse.orion.client.webtools/web/webtools/plugins/webToolsPlugin.js"),
      javascriptPlugin: path.join(__dirname, "../bundles/org.eclipse.orion.client.javascript/web/javascript/plugins/javascriptPlugin.js"),
      imageViewerPlugin: path.join(__dirname, "../bundles/org.eclipse.orion.client.ui/web/edit/content/imageViewerPlugin.js"),
      jsonEditorPlugin: path.join(__dirname, "../bundles/org.eclipse.orion.client.ui/web/edit/content/jsonEditorPlugin.js"),
      cFPlugin: path.join(__dirname, "../bundles/org.eclipse.orion.client.cf/web/cfui/plugins/cFPlugin.js"),
      shellPage: path.join(__dirname, "../bundles/org.eclipse.orion.client.ui/web/shell/shellPage.js"),
      shellPagePlugin: path.join(__dirname, "../bundles/org.eclipse.orion.client.ui/web/shell/plugins/shellPagePluginEntry.js"),
      login: path.join(__dirname, "../bundles/org.eclipse.orion.client.ui/web/mixloginstatic/javascript/login.js"),
      register: path.join(__dirname, "../bundles/org.eclipse.orion.client.ui/web/mixloginstatic/javascript/register.js"),
      gitRepository: path.join(__dirname, "../bundles/org.eclipse.orion.client.git/web/git/git-repository.js"),
      settings: path.join(__dirname, "../bundles/org.eclipse.orion.client.ui/web/settings/settings.js"),
      ternWorker: path.join(__dirname, "../bundles/org.eclipse.orion.client.javascript/web/javascript/plugins/ternWorker.js")
  },
  output: {
      path: path.join(__dirname, "../build"),
      sourceMapFilename: "[file].map",
      filename: "[name].js"
  },
  resolveLoader: {
    alias: {
      "placeholder-loader": path.join(__dirname, "./placeholder-loader.js")
    }
  },
  plugins: MINIFY ? [
	 	new webpack.optimize.UglifyJsPlugin() 
  ] : [],
  resolve: {
    plugins: [
      LangResolver
    ],
    alias: {
      "orion/compare/builder/compare": "compare/builder/compare"
    },
    modules: [
      'node_modules',
      path.join(__dirname, '../node_modules'),
      path.join(__dirname, '../bundles/org.eclipse.orion.client.javascript/web/acorn/dist/'),
      path.join(__dirname, './shim'),
      path.join(__dirname, '../bundles/org.eclipse.orion.client.core/web/'),
      path.join(__dirname, '../bundles/org.eclipse.orion.client.editor/web/'),
      path.join(__dirname, '../bundles/org.eclipse.orion.client.javascript/web/'),
      path.join(__dirname, '../bundles/org.eclipse.orion.client.ui/web/'),
      path.join(__dirname, '../bundles/org.eclipse.orion.client.help/web/'),
      path.join(__dirname, '../bundles/org.eclipse.orion.client.git/web/'),
      path.join(__dirname, '../bundles/org.eclipse.orion.client.webtools/web/'),
      path.join(__dirname, '../bundles/org.eclipse.orion.client.users/web/'),
      path.join(__dirname, '../bundles/org.eclipse.orion.client.cf/web/'),
      path.join(__dirname, '../bundles/org.eclipse.orion.client.core/web/orion'),
      path.join(__dirname, '../bundles/org.eclipse.orion.client.ui/web/gcli')
    ]
  },
	module: {
		loaders: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader'
			}, {
				test: /\.json$/,
				exclude: /node_modules/,
				loader: 'json-loader'
			}, {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
            'file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
            'image-webpack-loader?bypassOnDebug&optimizationLevel=7&interlaced=false'
        ]
      }, {
        test: /\.(css|html|java)$/,
        loader: 'placeholder-loader'
      }
    ],
	}
};

