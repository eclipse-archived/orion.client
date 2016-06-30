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
/*eslint-env node, express, body-parser, js-yaml*/
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require("path");
var yaml = require('js-yaml');

module.exports.router = function(options) {

	return express.Router()
	.use(bodyParser.json())
	.get('/file*', getplans);
	
function planJson(type, manifest , planner , wizard){
	return {
	    "ApplicationType": type,
	    "Manifest": manifest,
	    "ManifestPath": "manifest.yml",
	    "Planner": "org.eclipse.orion.server.cf." + planner,
	    "Required": [],
	    "Type": "Plan",
	    "Wizard": "org.eclipse.orion.client.cf.wizard." + wizard
	  };
}
	
function getplans(req, res){
	var projectPath = req.params[0];
	var filePath = path.join(req.user.workspaceDir, projectPath);
	
	try {
		var manifest = yaml.safeLoad(fs.readFileSync( filePath +'manifest.yml', 'utf8'));
	} catch (e) {
		console.log(e);
	}
	var children = [];
	
	function generatePlansforManifest(manifest,children){
		function generateGenericPlan(manifest){
			return planJson("generic",manifest,"ds.GenericDeploymentPlanner","generic");
		}
		function generateNodePlan(manifest){
			if(fs.existsSync(path.join(filePath,'package.json'))){
				return planJson("node.js",manifest,"nodejs.NodeJSDeploymentPlanner","nodejs");
			}
		}
		var genericPlan = generateGenericPlan(manifest);
		var nodePlan = generateNodePlan(manifest);
		children.push(genericPlan);
		if(nodePlan){
			children.push(nodePlan);
		}
	}
	
	generatePlansforManifest(manifest,children);
	var result =  {"Children": children};
	res.status(200).json(result);
}
};