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
		this.cfIgnoreRules = [new RegExp("(^|.*\/)\\..*")];
	}
	
	loadCfIgnoreFile(rootPath){
		var cfIgnorefile = path.join(rootPath,".cfignore");
		return fs.readFileAsync(cfIgnorefile, 'utf-8')
		.then(function(content){
			this.parse(content);
		}.bind(this))
		.catch(function(error){
			// ignore error
			return;
		});
	}
	
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
	
	generateFilter(){
		var rules = this.cfIgnoreRules;
		return function(pathRelativeToRoot){
			var result = rules.some(function(rule){
				return rule.test(pathRelativeToRoot)
			});
			return result;
		};
	}
	
	addRule(line){
		var rule = null;
		if(line.indexOf("**") === -1 && line.indexOf("*") !== -1){
			if(line.startsWith("*")){
				
			} else if (line.endsWith("*")){
				rule = RegExp("(^|.*\/)" + line.slice(0, -1) + ".*");
			} else {
				
			}
		}
		if(rule !== null){
			this.cfIgnoreRules.push(rule)
		}
	}
}

module.exports.CFIgnoreManager = CFIgnoreManager;