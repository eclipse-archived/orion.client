/*******************************************************************************
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var path = require('path'),
	Promise = require('bluebird'),
	fs = Promise.promisifyAll(require('fs'));
/**
 * @description Class to handle cf ignore file
 * @since 17.0
 */
class CFIgnoreManager {
	/**
	 * @description Create a new instance of the class
	 */
	constructor() {		
		// By default, all . start hidden files are ignored.
		this.cfIgnoreRules = [new RegExp("(^|.*\/)\\..*")]; //start with "."  or  "somepath/."
	}
	
	/**
	 * @public
	 * @description Load cf ignore file and parse it. Note cf ignore only respect the .cfignore file on the project root(doesn't like .gitignore)
	 * @param {string} .cfignore file root directory path;
	 * @return {Promise} which resolves nothing, but means the cfignore file is loaded and parsed if exist.
	 */
	loadCfIgnoreFile(rootPath){
		var cfIgnorefile = path.join(rootPath,".cfignore");
		return fs.readFileAsync(cfIgnorefile, 'utf-8')
		.then(function(content){
			this.parse(content);
			return;
		}.bind(this))
		.catch(function(error){
			// ignore error
			return;
		});
	}
	
	/**
	 * @public
	 * @description Used to get filter function
	 * @return a filter function, which takes relative path to check if that path should be cf ignored
	 */
	generateFilter(){
		var rules = this.cfIgnoreRules;
		return function(pathRelativeToRoot){
			var result = rules.some(function(rule){
				return rule.test(pathRelativeToRoot);
			});
			return result;
		};
	}
	
	/**
	 * @private
	 * @description parse .cfignore file content, split file by line, and add rules for good lines
	 * @param {string} .cfignore file content
	 */
	parse(content){
		var lines = content.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);
		lines.forEach(function(line){
			if(line.startsWith("\\")){
				throw new Error("invalid glob pattern ", line);
			}
			if(line && !line.startsWith("#") && !line.startsWith("!")){
				// # is comment, ! is ignored in .cfignore file, not like what in .gitignore file
				this.addRule(line.trim());
			}
		}.bind(this));
	}
	
	/**
	 * @private
	 * @description Add a rule to cfIgnoreRules list
	 * @param {string} an un-empty string, used to convert into a regex as a single rule
	 */
	addRule(line){
		var appender = "(\/|$)"; // always ends with a slash or completely ends
		var prepender = "(^|.*\/)"; // Start from begining or "somepath/"
		if (line.startsWith("\/")) {
			line = line.substring(1);
			prepender = "^"; // In case there is already a leading slash, then relativePath must start from begining
		}
		if (line.startsWith("**")) {
			line = line.substring(1); // Change ** to *, because they work same for cfignore when they are in the begining
		}
		if (line.endsWith("**")) {
			line = slice(0, -1); // Change ** to *, because they work same for cfignore when they are in the end
		}
		if (line.endsWith("\/")) {
			line = line.slice(0, -1); // end with "/" or not doesn't make any difference in cf ignore
		}
		if (line.indexOf("**") === -1 && line.indexOf("*") !== -1) {
			line = line.replace("*","[^\/]*"); // Single * means every charecter but slashes
		}
		if (line.indexOf("**") !== -1 ) {
			line = line.replace("**",".*"); // Dowblu * means every charecter
		}
		line = line + appender;
		line = prepender + line;
		this.cfIgnoreRules.push(new RegExp(line));
	}
}

module.exports.CFIgnoreManager = CFIgnoreManager;