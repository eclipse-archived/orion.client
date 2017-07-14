/*
 * Resigter fingerPrint task for grunt.
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
		var newObj = {
			"md5": crypto.createHash('md5')
		};

		fpArr[target] = {};
		fpArr[target]['fileInputList'] = [];
		var wholeFilesTofingerPrint = [];
		this.data.src.forEach(function(each){
			wholeFilesTofingerPrint.push(each+ ".js");
			wholeFilesTofingerPrint.push(each+ ".css");
		});
		
		async.forEach(wholeFilesTofingerPrint, function(file, next) {
			var filePath = _path.join(getOption('path'), file);
			if(grunt.file.exists(filePath)){
				newObj.md5.update(grunt.file.read(filePath));
				fpArr[target]['fileInputList'].push(filePath);
			}
			next();
		}, function() {
			var baseVal = getOption('baseVal') || 'hex';
			baseVal = baseVal === "base16" ? "hex" : baseVal;
			var cryptoVal = newObj.md5.digest(baseVal).replace(/\//g, '-');
			var fpResult = cryptoVal;
			grunt.config.set('fingerPrintString', cryptoVal);
			save({
				"fingerprint": fpResult,
				"target": target
			}, done);
		});
		creteFingerPrint();
	});


	function save(options, done) {
		var context = {
			rekai: options.fingerprint,
			target:options.target
		};
		fpArr[context.target]['fp'] = context.rekai;
		done();
	}

	function creteFingerPrint() {
		//delete templates, and rename files
		var count = 0;
		for (var i in fpArr) {
			var fp = fpArr[i]["fp"];
			//grunt.file.delete(fpArr[i]["srcFile"]);
			var ipFileList = fpArr[i]['fileInputList'];
			for (var j in ipFileList) {
				var filePath = ipFileList[j];
				var filePathRef = ipFileList[j];
				filePath = filePath.split('.');
				var fileExt = filePath.length > 1 ? '.' + filePath.pop() : "";
				var newFilePath = filePath.join('.') + '-' + fp + fileExt;

				//avoid multiple fingerprint value on file name
				var regex = new RegExp('-' + fp + '-' + fp, "g");
				newFilePath = newFilePath.replace(regex, '-' + fp);

				try {
					var tempFileCnt = grunt.file.read(filePathRef);
					grunt.file.delete(filePathRef);
					grunt.file.write(newFilePath, tempFileCnt);
					count++;
				} catch (e) {}

			}
			fpArr[i]['fileInputList'] = [];
		}
		grunt.log.writeln(chalk.cyan(count) + ' files updated.');
	}
};