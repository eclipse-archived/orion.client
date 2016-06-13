/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *		 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var api = require('../api');
var clone = require('./clone');
var util = require('./util');

module.exports = {};
	
module.exports.gitFileDecorator = function(rootName, req, filepath, originalJson){
	var result = originalJson;
	if (!"/file" === rootName && !"/workspace" ===rootName) {//$NON-NLS-1$ //$NON-NLS-2$
		return; 
	}
	var isWorkspace = "/workspace"=== rootName;	
	if (isWorkspace && req.method === "GET") {
		var children = result.Children;
		return Promise.all(children.map(function(child){
				var name = child["Name"];
				return addWorkSpaceGitLinks(child, req, name);		
			})
		);
	}
	if (!isWorkspace && req.method === "GET") {
		return clone.getRepoByPath(filepath, req.user.workspaceDir)
		.then(function(repo) {
			if(repo){
				var fileDir = api.join(clone.getfileDir(repo,req), "/");
				return Promise.resolve(getBranch(repo))
				.then(function(branchname){
					addGitLinks(result,branchname,fileDir);
					var fileChildren = result.Children;
					if(fileChildren){
						calcGitLinks(fileChildren,branchname,fileDir);
					}
				});
			}
		})
		.catch(function(){
			return;
		});
	}			
	
function getBranch(repo){
	return repo.getCurrentBranch().then(function(reference) {
		return reference.shorthand();
	});
}
	
function calcGitLinks(fileChildren,branchname,fileDir){
	if (fileChildren) {
		for (var j = 0; j < fileChildren.length; j++) {
			var filechild = fileChildren[j];
			addGitLinks(filechild,branchname,fileDir);
			var childItems = filechild.Children;
			if (childItems) {
				calcGitLinks(childItems,branchname,fileDir);
			}
		}
	}
}	
	
function addWorkSpaceGitLinks(workspacechild,req, name){
	var fullpath = api.join(req.user.workspaceDir,name);
	return clone.getRepoByPath(fullpath, req.user.workspaceDir)
	.then(
		function(repo) {
			if(repo){
				return Promise.resolve(getBranch(repo))
					.then(function(branchname){
						var workDir = api.join(clone.getfileDir(repo,req) , "/");
						addGitLinks(workspacechild,branchname,workDir);
					});
			}
		}
	).catch(function(){
			return;
	});
}
	
function addGitLinks(comingJson,branchname,fileDir){
	var fileTarget = comingJson.Location.substr(fileDir.length);
	if(fileTarget === "/") fileTarget = "";
	comingJson.Git ={
		"BlameLocation": "/gitapi/blame/HEAD" + fileDir + fileTarget,
		"CloneLocation": "/gitapi/clone" + fileDir,
		"CommitLocation": "/gitapi/commit/" + util.encodeURIComponent(branchname) + fileDir + fileTarget,
		"ConfigLocation": "/gitapi/config/clone" + fileDir + fileTarget,
		"DefaultRemoteBranchLocation": "/gitapi/remote/origin/"+ util.encodeURIComponent(branchname) + fileDir,
		"DiffLocation": "/gitapi/diff/Default" + fileDir + fileTarget,
		"HeadLocation": "/gitapi/commit/HEAD" + fileDir + fileTarget,
		"IndexLocation": "/gitapi/index" + fileDir + fileTarget,
		"RemoteLocation": "/gitapi/remote" + fileDir + fileTarget,
		"StatusLocation": "/gitapi/status" + fileDir + fileTarget,
		"TagLocation": "/gitapi/tag" + fileDir + fileTarget,
		"TreeLocation": "/gitapi/tree" + fileDir + "HEAD/" + fileTarget
	};
	if(!branchname){
		delete comingJson.Git.CommitLocation;
		delete comingJson.Git.DefaultRemoteBranchLocation;
	}
}
};
