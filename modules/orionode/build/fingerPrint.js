/*
 * Resigter fingerPrint task for grunt. Using crypto sha1 to read each file, generate a hash based on the content. Then use the hash to create a new corresponding file
 * by inserting -<finger-print-value> after file name before extention. Recording all the change pairs in <%= fingerPrints.allMaps %> with ready format for string-repace task
 * , and then run string-replace:replaceFingerPrint task immediately in this task, which will replace all the dependencies in html and js file. For example edit/edit to edit/edit-123qwe,
 * edit.css to edit-123asd.css
 */
/*eslint-env browser, node*/
/*eslint no-new-func:0*/
module.exports = function(grunt) {
	var fs = require('fs');
	var crypto = require('crypto');
	var chalk = require('chalk');
	var async = require('async');
	var _path = require("path");
	var fpArr = {};
	
	grunt.registerMultiTask('fingerprint', 'Fingerprint based on the file content', function() {
		var target = this.target;
		var configPrefix = this.name + '.' + target;
		var getOption = function(op) {
			return grunt.config.getRaw(configPrefix + '.' + op);
		};
		this.requiresConfig(configPrefix + '.' + 'src');
		var done = this.async();
		fpArr[target] = {};
		fpArr[target]['fileInputList'] = [];
		var wholeFilesTofingerPrint = [];
		// this.data.src are all the modules names in orion.build.js, which looks like edit/edit, it need to be extended to edit/edit.js and edit/edit.css
		this.data.src.forEach(function(each){
			wholeFilesTofingerPrint.push(each+ ".js");
			wholeFilesTofingerPrint.push(each+ ".css");
		});
		var fingerprintModules = grunt.config.get('fingerPrints.fingerprintModules');
		// Need to save the whole map, which including js and css file, needed for HTML file;
		var allMaps = grunt.config.get('fingerPrints.allMaps');
		// Need to save the js map, which including js files only, needed for js file of the modules;
		var jsMaps = grunt.config.get('fingerPrints.jsMaps');
		async.forEach(wholeFilesTofingerPrint, function(file, next) {
			var filePath = _path.join(getOption('path'), file);
			if(grunt.file.exists(filePath)){
				var sha1 = crypto.createHash('sha1');
				sha1.update(grunt.file.read(filePath));
				var cryptoVal = sha1.digest('hex');
				fpArr[target]['fileInputList'].push({
					filePath:filePath,
					fp:cryptoVal
				});
				var fpFile = "";
				var patternReg;
				if(file.indexOf(".js") !== -1){
					file = file.slice(0, -3);
					fpFile = file + "." + cryptoVal;
					// pattern and replacement object are for string-replace grunt task, this can't be changed to others
					patternReg = new RegExp('"' + file + '"', "g"); // should not replace the "index" of tabindex, should not replace "edit/edit" of 'edit/edit.html'
					// Need to save the finger printed js modules files, with in which, dependencies of other js files will be replaced with fingerprinted ones.
					fingerprintModules.push(fpFile + ".js");
					jsMaps.push({
						pattern: patternReg,
						replacement: '"' + fpFile + '"'
					});
				}else{
					var segs = file.split("/");
					file = segs[segs.length - 1];
					patternReg = new RegExp('"' + file + '"', "g");
					fpFile = file.slice(0, -4) + "." + cryptoVal + ".css";
				}
				allMaps.push({
					pattern: patternReg,
					replacement: '"' + fpFile + '"'
				});
			}
			next();
		}, function() {
			done();
		});
		grunt.config.set('fingerPrints.fingerprintModules', fingerprintModules);
		grunt.config.set('fingerPrints.jsMaps', jsMaps);
		grunt.config.set('fingerPrints.allMaps', allMaps);
		creteFingerPrint();
		grunt.task.run("replaceFp");
	});

	function creteFingerPrint() {
		//delete templates, and rename files
		var count = 0;
		for (var i in fpArr) {
			var ipFileList = fpArr[i]['fileInputList'];
			for (var j in ipFileList) {
				var filePath = ipFileList[j].filePath;
				var filePathRef = ipFileList[j].filePath;
				var fp = ipFileList[j].fp;
				filePath = filePath.split('.'); // Used to split name and ext
				var fileExt = filePath.length > 1 ? '.' + filePath.pop() : "";
				var newFilePath = filePath.join('.') + '.' + fp + fileExt;

				//avoid multiple fingerprint value on file name
				var regex = new RegExp('.' + fp + '.' + fp, "g");
				newFilePath = newFilePath.replace(regex, '.' + fp);

				try {
					var tempFileCnt = grunt.file.read(filePathRef);
					grunt.file.write(newFilePath, tempFileCnt);
					count++;
				} catch (e) {}

			}
			fpArr[i]['fileInputList'] = [];
		}
		grunt.log.writeln(chalk.cyan(count) + ' files updated.');
	}
};