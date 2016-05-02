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
/*eslint-env node */
var api = require('../api'), writeError = api.writeError;
var path = require('path');
var git = require('nodegit');
var express = require('express');
var bodyParser = require('body-parser');
var clone = require('./clone');
var commitm = require('./commit');

module.exports = {};

module.exports.router = function(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.root is required'); }

	return express.Router()
	.use(bodyParser.json())
	.get('/:refName/file/*', getBlame);
	
function getBlame(req, res) {
	var blamerepo,fileDir;
	var fileRelativePath = path.join(req.user.workspaceDir, req.params["0"]);
	clone.getRepo(req)
	.then(function(repo) {
		blamerepo = repo;
		fileDir = api.join(fileRoot, repo.workdir().substring(req.user.workspaceDir.length + 1));
		fileRelativePath = api.toURLPath(fileRelativePath.substring(repo.workdir().length));
		return git.Blame.file(repo,fileRelativePath, git.Blame.FLAG.NORMAL);
	})
	.then(function(blame){
		var hunkNum = blame.getHunkCount(); 
		var hunks = new Array();
		for(var i = 0; i < hunkNum; i++){
			hunks.push(blame.getHunkByIndex(i));
		}
		
		return createhunkCommitArray(blamerepo,hunks).then(function(hunkCommitArray){
			var hunkMergedArray = mergeChildren(hunkCommitArray);
			var blamejason = createBlameJson(hunkMergedArray,fileDir);
			var sendingBlamejason;
			sendingBlamejason = {
				"Children" : blamejason,
				"CloneLocation": "/gitapi/clone" + fileDir ,
				"Location": "/gitapi/blame/"+ req.params.refName + fileDir + fileRelativePath,
				"Type" : "Blame"
			};
			res.status(200).json(sendingBlamejason);
		});
	}).catch(function(err){
		writeError(403, res);
	});
}

function createhunkCommitArray(blamerepo, hunks){
	return Promise.all(hunks.map(function(hunk){
		return getHunkCommit(blamerepo,hunk);
	}));
}

function getHunkCommit(blamerepo,hunk){
	return git.Commit.lookup(blamerepo, hunk.finalCommitId())
			.then(function(commit){
				return {
					commit:commit,
					hunk: hunk
				};
			});
}	

function hunklines(hunk){
	var starttemp = hunk.finalStartLineNumber();
	var lines = hunk.linesInHunk();
	return {
		"End": starttemp + lines - 1,
		"Start": starttemp
	};
}	

function mergeChildren(hunkArray){
	// Coming object in the array {commit:XX,hunk:XX}
	var hunkArraywithChildren = hunkArray.map(function(hunkcommit){
		return {
			Commit: hunkcommit.commit,
			Children: [hunklines(hunkcommit.hunk)]
		};
	});
	
	var result = [];
	for(var i = 0; i < hunkArraywithChildren.length; i++) {
		var indexInResult = arrayContains(result,hunkArraywithChildren[i]);
		if( indexInResult === -1 ) {
			result.push(hunkArraywithChildren[i]);
		}else{
			// Merge Children
			result[indexInResult].Children = result[indexInResult].Children.concat(hunkArraywithChildren[i].Children);
		}
	}
	// Going object int he array {commit:XX ,children:[XX,XX]}
	return 	result;
	
	function arrayContains(array , element){
		for(var j = 0; j < array.length; j++) {
			if(array[j].Commit.sha() === element.Commit.sha()) 
			return j;
		}
		return -1;
	}
}

function createBlameJson(hunkMergedArray, fileDir){
	// Coming object in the array {commit: ,children:}
	return hunkMergedArray.map(function(hunkCommit){
		var hunkCommitJson = commitm.commitJSON(hunkCommit.Commit,fileDir);
		delete hunkCommitJson.Branches;
		delete hunkCommitJson.CloneLocation;
		delete hunkCommitJson.ContentLocation;
		delete hunkCommitJson.DiffLocation;
		delete hunkCommitJson.CloneLocation;
		delete hunkCommitJson.Diffs;
		delete hunkCommitJson.Parents;
		delete hunkCommitJson.Id;
		delete hunkCommitJson.Type;
		hunkCommitJson.Children = hunkCommit.Children;
		return hunkCommitJson;
	});
	// Going object in the array {authorname:,committer:.....,children:} 
}
};