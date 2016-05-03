/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *		 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var api = require('../api'), writeError = api.writeError;
var git = require('nodegit');
var clone = require('./clone');
var path = require('path');
var express = require('express');
var util = require('./util');
var request = require('request');
var https = require('https');
var bodyParser = require('body-parser');
var url = require("url");
var fs = require('fs');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.root is required'); }

	return express.Router()
	.use(bodyParser.json())
	.post('/file*', getPullRequest);
	
function pullRequestJSON(cloneDir,remoteDir,bodyJson) {
	var children = [];
	for(var i = 0; i < bodyJson.length; i ++){
		var child = 
		{
			"CloneLocation": cloneDir,
			"RemoteLocation": remoteDir,
			"Type":"PullRequest",
			"PullRequest": bodyJson[i]
		};
		children.push(child); 
	}
	var pullrequestJson =  {
		"Type":"PullRequest",
		"Children":children
	};	
	return pullrequestJson;
}

function getPullRequest(req, res) {
	var gitUrl = req.body["GitUrl"];	
	if(gitUrl){
		var parsedURL = url.parse(gitUrl);
		var pathnames = parsedURL["pathname"].split("/");   
		var username = pathnames[1];
		var projectname = pathnames[2].replace(/\.git$/g, "");
		var pullrequestUrl = "https://api.github.com/repos/" + username +"/" + projectname + "/pulls";
	}
	var userAgentHeader = {
		url: pullrequestUrl,
		headers: {
			'User-Agent': 'request'
	  }
	};
	
	var fileDir, cloneDir, remoteDir;
	clone.getRepo(req)
	.then(function(repo) {
		fileDir = api.join(fileRoot, repo.workdir().substring(req.user.workspaceDir.length + 1));
		cloneDir = "/gitapi/clone" + fileDir;
		remoteDir = "/gitapi/remote" + fileDir;
	}).then(function(){
		request(userAgentHeader, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				var bodyJson = JSON.parse(body);
				res.status(200).json(pullRequestJSON(cloneDir,remoteDir,bodyJson));
			} else {
				writeError(404, res, "Fail to fetch url");
			}
		});
	});
}
};