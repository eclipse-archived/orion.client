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
var tasks = require('../tasks');

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
	var gitSshUsername = req.body["GitSshUsername"];
	var gitSshPassword = req.body["GitSshPassword"];
	var authHeader;
	if(gitSshUsername && gitSshPassword){
		var header = gitSshUsername + ':' + gitSshPassword;
		authHeader = 'Basic ' + toBase64(header);
	}
	
	var clientID,clientSecret;
	if(options.configParams){
		clientID =  options.configParams["orion.oauth.github.client"];
		clientSecret =  options.configParams["orion.oauth.github.secret"];
	}
    
	var task = new tasks.Task(res, false, true, 0, false);
	if(gitUrl){
		var parsedURL = url.parse(gitUrl);
		var pathnames = parsedURL["pathname"].split("/");   
		var username = pathnames[1];
		var projectname = pathnames[2].replace(/\.git$/g, "");
		var pullrequestUrl = "https://api.github.com/repos/" + username +"/" + projectname + "/pulls";
		if(clientID && clientSecret){
			pullrequestUrl += "?client_id="+clientID+"&client_secret="+clientSecret+"";
		}
	}
	var userAgentHeader = {
		url: pullrequestUrl,
		headers: authHeader ? {'User-Agent': 'request',	'Authorization': authHeader} : {'User-Agent': 'request'}
	};
	
	var fileDir, cloneDir, remoteDir,bodyJson;
	clone.getRepo(req)
	.then(function(repo) {
		fileDir = clone.getfileDir(repo,req); 
		cloneDir = "/gitapi/clone" + fileDir;
		remoteDir = "/gitapi/remote" + fileDir;
		return request(userAgentHeader, function (error, response, body) {
				if (!error && response.statusCode === 200) {
					bodyJson = JSON.parse(body);
					task.done({
						HttpCode: 200,
						Code: 0,
						DetailedMessage: "OK",
						JsonData: pullRequestJSON(cloneDir,remoteDir,bodyJson),
						Message: "OK",
						Severity: "Ok"
					});
				} else if (!error && response.statusCode === 404 || response.statusCode === 401){
					var message = "Repository not found, might be a private repository that requires authentication.";
					if(response.statusCode === 401){
						message = "Not authorized to get the repository information.";
					}
					task.done({
						HttpCode: 401,
						Code: 0,
						JsonData: {"Url": gitUrl},
						DetailedMessage: message,
						Message: message,
						Severity: "Error"
					});
				} else {
					task.done({
						HttpCode: 403,
						Code: 0,
						JsonData: {},
						DetailedMessage: "Unable to fetch pull request info.",
						Message: "Unable to fetch pull request info.",
						Severity: "Error"
					});
				}
			});
	});
	function toBase64 (str) {
		return (new Buffer(str || '', 'utf8')).toString('base64');
	}
}
};
