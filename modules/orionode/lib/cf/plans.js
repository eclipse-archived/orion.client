/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node, express, body-parser, js-yaml*/
var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
var path = require("path");
var manifests = require("./manifests");
var api = require("../api"), writeError = api.writeError, writeResponse = api.writeResponse;

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.fileRoot is required'); }
	return express.Router()
	.use(bodyParser.json())
	.get(fileRoot + "*", getplans);
	
function planJson(type, manifest, planner, wizard, required){
	return {
		"ApplicationType": type,
		"Manifest": manifest,
		"ManifestPath": "manifest.yml",
		"Planner": "org.eclipse.orion.server.cf." + planner,
		"Required": required || [],
		"Type": "Plan",
		"Wizard": "org.eclipse.orion.client.cf.wizard." + wizard
	};
}

function checkFileExists(path) {
	try {
		return fs.statSync(path).isFile();
	}
	catch (err) {
		return false;
	}
}
	
function getplans(req, res){
	var uri = req.originalUrl.substring(req.baseUrl.length + req.contextPath.length);
	req.user.checkRights(req.user.username, uri, req, res, function(){
		var filePath = manifests.retrieveProjectFilePath(req);
		fs.lstat(filePath, function(err, state){
			if(err){
				return writeError(404, res, err.message);
			}
			if(state.isFile()){
				filePath = path.dirname(filePath);
			}
			return manifests.retrieveManifestFile(req, res)
			.then(function(manifest){
				var children = [];
				function generatePlansforManifest(){
					function generateGenericPlan(){
						return planJson("generic", manifest, "ds.GenericDeploymentPlanner", "generic");
					}
					function generateNodePlan(){
						if(checkFileExists(path.join(filePath, "package.json"))){
							var applicationKeys = Object.keys(manifest.applications[0]);
							var cloneManifest = { "applications": [{}] };
							var required = [];
							applicationKeys.forEach(function(key){
								cloneManifest.applications[0][key] = manifest.applications[0][key];
							});
							if (!cloneManifest.applications[0]["command"]) {
								// TODO "command" attribute checking by looking up Procfile
								// TODO "command" attribute checking by looking up package.json
								if (checkFileExists(path.join(filePath, "server.js"))) { // node.js application requires a start command
									cloneManifest.applications[0]["command"] = "node server.js";
								}
								else if (checkFileExists(path.join(filePath, "app.js"))) {
									cloneManifest.applications[0]["command"] = "node app.js";
								}
								else {
									required.push("command");
								}
							}
							return planJson("node.js", cloneManifest, "nodejs.NodeJSDeploymentPlanner", "nodejs", required);
						}
					}
					var genericPlan = generateGenericPlan();
					var nodePlan = generateNodePlan();
					children.push(genericPlan);
					if(nodePlan){
						children.push(nodePlan);
					}
				}
				generatePlansforManifest();
				var result =  {"Children": children};
				writeResponse(200, res, null, result);
			}).catch(function(err){
				return writeError(404, res, err.message);
			});
		});
	});
}
};