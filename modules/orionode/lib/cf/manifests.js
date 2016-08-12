/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node, express, body-parser*/
var express = require("express");
var bodyParser = require("body-parser");
var api = require("../api"), writeError = api.writeError;
var fs = require("fs");
var path = require("path");
var yaml = require("js-yaml");

module.exports.router = function() {
	
	module.exports.retrieveManifestFile = retrieveManifestFile;
	module.exports.retrieveProjectFilePath = retrieveProjectFilePath;

	return express.Router()
	.use(bodyParser.json())
	.get("/file*", getManifests)
	.get("*", getManifests);
	
function getManifests(req, res){
	Promise.resolve(retrieveManifestFile(req,res))
	.then(function(manifest){
		var respond = {
			"Contents": manifest,
			"Type": "Manifest"
		};
		res.status(200).json(respond);			
	});
}

function retrieveManifestFile(req, res, manifestAbsuluteLocation){
	return new Promise(function(fulfill) {
		var filePath = manifestAbsuluteLocation ? manifestAbsuluteLocation : retrieveProjectFilePath(req);
		if(filePath.indexOf("manifest.yml") === -1){
			filePath += "manifest.yml";
		}
		try {
			var manifest = yaml.safeLoad(fs.readFileSync(filePath, "utf8"));
		} catch (err) {
			writeError(404, res, err.message);
		}
		transformManifest(manifest);
		// TODO when meet the case where need to do symbolResolver (as in JAVA) then implement.
//		analizeManifest(manifest,res);
		fulfill(manifest);
	});
}

function transformManifest(manifest){
	if(!manifest.applications){
		return;  // Do nothing
	}
	var globals = [];
	var APPLICATION_PROPERTIES = ["name", "memory", "host", "buildpack", "command", //   //$NON-NLS-1$//$NON-NLS-2$ //$NON-NLS-3$//$NON-NLS-4$ //$NON-NLS-5$
			"domain", "instances", "path", "timeout", "no-route", "services"]; //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$ //$NON-NLS-5$ //$NON-NLS-6$
	Object.keys(manifest).forEach(function(key){
		if(APPLICATION_PROPERTIES.indexOf(key) !== -1){
			globals.push(key);
		}
	});
	if(!globals){
		return; // nothing to do
	}
	manifest.applications.forEach(function(application){
		for( var k = 0; k < globals.length ; k++){
			if(!application.hasOwnProperty(globals[k])){
				application[globals[k]] = manifest[globals[k]];
			}
		}
	});
}
//function analizeManifest(manifest, res){
//	if(!manifest.applications){
//		return; // Do nothing
//	}
//	manifest.applications.forEach(function(application){
//		var keys = Object.keys(application);
//		keys.forEach(function(key){
//			if(!application[key]){
//				// Null Check
//				
//			}
//		});
//	});
//	function analizeInvalidResult(message, lineNumber ,res){
//		res.statusCode = 400;
//		var resultJson = {
//			"Severity":"Warning",
//			"Message": message,
//			"Line": lineNumber
//		};
//		var resp = JSON.stringify(resultJson);
//		res.setHeader("Content-Type", "application/json");
//		res.setHeader("Content-Length", resp.length);
//		res.end(resp);
//	}
//}
function retrieveProjectFilePath(req){
	var projectPath = req.params[0];
	return path.join(req.user.workspaceDir, projectPath);
}
};