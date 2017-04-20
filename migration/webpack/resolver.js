// Resolver for language files

var _ = require("lodash");
var fs = require("fs");
var path = require("path");

// TODO: Import a config file to get the locale
var LOCALE = "root";

var ROOT_DIR = path.join(__dirname, "../");
var MODULE_DIRS = [
  'bundles/org.eclipse.orion.client.core/web/',
  'bundles/org.eclipse.orion.client.editor/web/',
  'bundles/org.eclipse.orion.client.javascript/web/',
  'bundles/org.eclipse.orion.client.ui/web/',
  'bundles/org.eclipse.orion.client.help/web/',
  'bundles/org.eclipse.orion.client.git/web/',
  'bundles/org.eclipse.orion.client.webtools/web/',
  'bundles/org.eclipse.orion.client.users/web/',
  'bundles/org.eclipse.orion.client.cf/web/'
];

module.exports = {
  apply: function(resolver) {
    resolver.plugin('module', function(request, callback) {
			var requestPath = request.request;
      // Replaces nls/message.js imports with one in the appropriate locale folder
      if (requestPath.includes("/nls/")){
        var sliceIdx = requestPath.indexOf("/nls/") + "/nls/".length;
        requestPath = requestPath.substring(0, sliceIdx) + LOCALE + "/" + requestPath.slice(sliceIdx, requestPath.length);
        // Tries all possible paths in the module dirs for in the locale
        for (var idx in MODULE_DIRS){
          var filePath = "./" + path.join(MODULE_DIRS[idx], requestPath + ".js");
          if (fs.existsSync(path.join(ROOT_DIR, filePath))){
            this.doResolve("resolved", _.assign(request, {
              path: path.join(ROOT_DIR, filePath),
            }), requestPath, callback);
            return;
          }
        }
        // If it cant be found, just use the literal path rather than breaking the build
      }
      callback();
    });
  }
};
