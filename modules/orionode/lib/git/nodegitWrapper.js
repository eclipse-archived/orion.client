/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var os = require("os");
var globalmodules = require('global-modules');

// Handle optional nodegit dependency
var git = null;
try {
	git = require('nodegit');
} catch (e) {
	if (e.code === "MODULE_NOT_FOUND" && e.message.indexOf("nodegit") >= 0) {
		try{
			if(os.type() === "Windows_NT"){		
				git = require(globalmodules + '/nodegit');
			}
		}catch(e){
			if (e.code === "MODULE_NOT_FOUND" && e.message.indexOf("nodegit") >= 0) {
				console.error("nodegit is not installed. Some features will be unavailable.");
			} else {
				console.error("nodegit failed to load. " + e.message);
			}
		}
	}
}
module.exports = git;