/**
 * Load rules synchronously from a filesystem directory.
 */
/*global __dirname console module process require*/

var fs = require("fs"),
    path = require("path");

var JS_EXT = ".js";

module.exports = function(directory) {
    try {
        directory = directory || path.join(__dirname, "./rules");
        var fullPath = path.resolve(process.cwd(), directory),
            files = fs.readdirSync(fullPath),
            rules = {};

        files.forEach(function(file) {
            if (path.extname(file) === JS_EXT) {
                var ruleId = file.replace(JS_EXT, "");
                rules[ruleId] = require(path.join(fullPath, ruleId));
            }
        });
        return rules;
    } catch (ex) {
        console.error("Couldn't load rules from " + directory + ": " + ex.message);
        process.exit(1);
    }
};

