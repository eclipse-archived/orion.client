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
var express = require('express');
var bodyParser = require('body-parser');
var api = require('../api'), writeError = api.writeError;
var fs = require('fs');
var path = require("path");
var yaml = require('js-yaml');

module.exports.router = function() {
	
	module.exports.retrieveManifestFile = retrieveManifestFile;
	module.exports.retrieveProjectFilePath = retrieveProjectFilePath;

	return express.Router()
	.use(bodyParser.json())
	.get('/file*', getManifests)
	.get('*', getManifests);
	
function getManifests(req, res){
	Promise.resolve(retrieveManifestFile(req))
	.then(function(manifest){
		var respond = {
			"Contents": manifest,
			"Type": "Manifest"
		};
		res.status(200).json(respond);			
	});
}

function retrieveManifestFile(req, res){
	return new Promise(function(fulfill) {
		var filePath = retrieveProjectFilePath(req);
		if(filePath.indexOf('manifest.yml') === -1){
			filePath += 'manifest.yml';
		}
		try {
			var manifest = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
		} catch (err) {
			writeError(404, res, err.message);
		}
		fulfill(manifest);
	});
}

function retrieveProjectFilePath(req, res){
	var projectPath = req.params[0];
	return path.join(req.user.workspaceDir, projectPath);
}
};