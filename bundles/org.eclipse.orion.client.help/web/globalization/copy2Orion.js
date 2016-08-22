/*******************************************************************************
 * @license Licensed Materials - Property of IBM (c) Copyright IBM Corporation
 *          2014, 2015. All Rights Reserved.
 * 
 * Note to U.S. Government Users Restricted Rights: Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
/**
 * Usage: node copyf.js
 */

/*global __dirname Buffer console process require*/
/*jslint regexp:false laxbreak:true*/

// compat shim for v0.6-0.8 differences
//require('../lib/compat');

var child_process = require('child_process');
var dfs = require('deferred-fs'), Deferred = dfs.Deferred;
var path = require('path');
var IS_WINDOWS = process.platform === 'win32';

var pathToTranslationRoot = 'C:/IDSDev/OrionTranslation/';
var pathToDestBundle = 'C:/IESDev/IES_TVT/bundles/';
var configFile = 'C:/IDSDev/OrionTranslation/configOrion.js';
var pathToCWDDir = path.resolve(__dirname, './');
/**
 * Pass varargs to get numbered parameters, or a single object for named parameters.
 * eg. format('${0} dollars and ${1} cents', 3, 50);
 * eg. format('${dollars} dollars and ${cents} cents', {dollars:3, cents:50});
 * @param {String} str String to format.
 * @param {varags|Object} arguments 
 */
function format(str/*, args..*/) {
	var maybeObject = arguments[1];
	var args = (maybeObject !== null && typeof maybeObject === 'object') ? maybeObject : Array.prototype.slice.call(arguments, 1);
	return str.replace(/\$\{([^}]+)\}/g, function(match, param) {
		return args[param];
	});
}

/**
 * @param {Object} [options]
 * @returns {Deferred} Doesn't reject (but perhaps it should -- TODO)
 */
function execCommand(cmd, options, suppressError) {
	options = options || {};
	suppressError = typeof suppressError === 'undefined' ? false : suppressError;
	var d = new Deferred();
	console.log(cmd);
	child_process.exec(cmd, {
		cwd: options.cwd || pathToCWDDir,
		stdio: options.stdio || 'inherit'
	}, function (error, stdout, stderr) {
		if (error && !suppressError) {
			console.log(error.stack || error);
		}
		if (stdout) { console.log(stdout); }
		d.resolve();
	});
	return d;
}

/** @returns {String} command for performing recursive copy of src directory to dest directory. */
function getCopyDirCmd(src, dest) {
	return IS_WINDOWS ? format('xcopy /e /h /q /y /i "${0}" "${1}"', src, dest) : format("cp -R ${0}/* ${1}", src, dest);
}

function getCopyFileCmd(src, dest) {
	return IS_WINDOWS ? format('xcopy /y "${0}" "${1}"', src, dest) : format("cp -R ${0}/* ${1}", src, dest);
}

function section(name) {
	console.log('-------------------------------------------------------\n' + name + '...\n');
}

function copySingleFile(copyEntry) {
	var pathToDest = path.resolve(__dirname, copyEntry.dest);
	var pathToSource = path.resolve(__dirname, copyEntry.source);
	var pathToDestConfig = path.resolve(__dirname, copyEntry.destConfig);
	var pathToConfigFile = path.resolve(__dirname, configFile);
	/*
	 * Copy steps begin here
	 */
	return dfs.exists(pathToDest).then(function(exists) {
		if (!exists) {
			section('Creating destination dir ' + pathToDest);
			return dfs.mkdir(pathToDest);
		}
	}).then(function() {
		return execCommand(getCopyFileCmd(pathToSource, pathToDest)).then(function() {
			section(" copy " + pathToSource  + "  to " + pathToDest);
			return execCommand(getCopyFileCmd(pathToConfigFile, pathToDestConfig));}
		);
	});
}

function exitFail(error) {
	if (error) { console.log('An error occurred: ' + (error.stack || error)); }
	process.exit(1);
}

function exitSuccess() { process.exit(0); }

var folderTemplate = [
	'org.eclipse.orion.client.webtools/web/webtools/nls/dummy_language/messages',
	'org.eclipse.orion.client.cf/web/cfui/nls/dummy_language/messages',
	'org.eclipse.orion.client.users/web/profile/nls/dummy_language/messages',
	'org.eclipse.orion.client.javascript/web/javascript/nls/dummy_language/messages',
	'org.eclipse.orion.client.javascript/web/javascript/nls/dummy_language/problems',
	'org.eclipse.orion.client.help/web/orion/help/nls/dummy_language/messages',
	'org.eclipse.orion.client.editor/web/orion/editor/nls/dummy_language/messages',
	'org.eclipse.orion.client.git/web/git/nls/dummy_language/gitmessages',
	'org.eclipse.orion.client.ui/web/orion/compare/nls/dummy_language/messages', 
	'org.eclipse.orion.client.ui/web/orion/content/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/crawler/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/edit/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/mixloginstatic/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/navigate/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/jslint/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/plugins/languages/json/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/operations/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/problems/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/search/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/settings/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/shell/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/sites/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/stringexternalizer/nls/dummy_language/messages',
	'org.eclipse.orion.client.ui/web/orion/widgets/nls/dummy_language/messages'
];

var allLanguages = {
	"ar":true,
	"cs":true,
	"da":true,
	"de":true,
	"el":true,
	"en-aa":true,
	"en-rr":true,
	"en-zz":true,
	"es":true,
	"fi":true,
	"fr":true,
	"hu":true,
	"it":true,
	"iw":true,
	"ja":true,
	"ko":true,
	"nb":true,
	"nl":true,
	"nn":true,
	"no":true,
	"pl":true,
	"pt":true,
	"pt-br":true,
	"ru":true,
	"sv":true,
	"th":true,
	"tr":true,
	"zh":true,
	"zh-hk":true,
	"zh-tw":true
};

function generateCopyArray(sourceRoot, destRoot, relativeDest) {
	var copyArray = [];
	var keys = Object.keys(allLanguages);
	keys.forEach(function(language) {
		section(language);
		var sourceTemplate = folderTemplate.map(function(folder){
			return sourceRoot + folder.replace("/dummy_language/", "/" + language + "/") + ".js";
		}); 
		var destTemplate = folderTemplate.map(function(folder){
			var folderNew = folder;
			if(relativeDest) {
				var newFolder = folder.split("/");
				newFolder.shift();
				newFolder.shift();
				folderNew = newFolder.join("/");
			}
			return destRoot + folderNew.replace(/dummy_language.*/, language);
		}); 
		var destTemplateConfig = folderTemplate.map(function(folder){
			var folderNew = folder;
			if(relativeDest) {
				var newFolder = folder.split("/");
				newFolder.shift();
				newFolder.shift();
				folderNew = newFolder.join("/");
			}
			return destRoot + folderNew.replace("/dummy_language/", "/") + ".js";
		}); 
		for(var i = 0; i < sourceTemplate.length; i++) {
			copyArray.push({source: sourceTemplate[i], dest: destTemplate[i], destConfig: destTemplateConfig[i]});
		}
	});
	return copyArray;
}

function processFile() {
	var result =  generateCopyArray(pathToTranslationRoot, pathToDestBundle);
	var buildPromise = new Deferred();
    var promises = [];
	result.forEach(function(wrapper) {
		promises.push(copySingleFile(wrapper));
	}.bind(this));
	Deferred.all(promises, function(error) { console.log(error); }).then(buildPromise.resolve, buildPromise.reject);
	return buildPromise;
}
/*
 * The fun starts here
 */
processFile().then(exitSuccess,	exitFail);
