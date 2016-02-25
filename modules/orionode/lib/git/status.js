/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var api = require('../api'),
	writeError = api.writeError;
var git = require('nodegit');

function getStatus(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var repoPath = segments[2];
	var fileDir = api.join(fileRoot, repoPath);
	repoPath = api.join(workspaceDir, repoPath);

	git.Repository.open(repoPath)
	.then(function(repo) {
		repo.getStatusExt({
			flags: 
				git.Status.OPT.INCLUDE_UNTRACKED | 
				git.Status.OPT.RECURSE_UNTRACKED_DIRS
		}).then(function(statuses) {

			var added = [],
				changed = [],
				conflicting = [],
				missing = [],
				modified = [],
				removed = [], 
				untracked = [];
	
			function returnContent(file, diffType) {
				diffType = diffType || "Default";
				var orionFilePath = api.join(fileDir, file.path());
				return {
					"Git": {
						"CommitLocation": "/gitapi/commit/HEAD" + orionFilePath,
						"DiffLocation": "/gitapi/diff/" + diffType + orionFilePath,
						"IndexLocation": "/gitapi/index" + orionFilePath
					},
					"Location": orionFilePath,
					"Name": file.path(),
					"Path": file.path()
				};
			}
		
			statuses.forEach(function(file) {
				var bit = file.statusBit();
				
				if (bit & git.Status.STATUS.CONFLICTED) {
					conflicting.push(returnContent(file));
				}
				
				if (bit & git.Status.STATUS.WT_MODIFIED) {
					modified.push(returnContent(file));
				}
				
				if (bit & git.Status.STATUS.WT_DELETED) {
					missing.push(returnContent(file));
				}
				
				if (bit & git.Status.STATUS.WT_NEW) {
					untracked.push(returnContent(file));
				}
				
				if (bit & git.Status.STATUS.INDEX_NEW) {
					added.push(returnContent(file));
				}
				
				if (bit & git.Status.STATUS.INDEX_MODIFIED) {
					changed.push(returnContent(file));
				}
				
				if (bit & git.Status.STATUS.INDEX_DELETED) {
					removed.push(returnContent(file));
				}
				
			});
		
			var repoState = "SAFE";
			
			if (repo.isRebasing()) {
				repoState = "REBASING";
			} 
			else if (repo.isReverting()) {
				repoState = "REVERTING";
			}
			else if (repo.isMerging()) {
				repoState = "MERGING";
			}
			else if (repo.isCherrypicking()){
				repoState = "CHERRY_PICKING";
			}
			
			var resp = JSON.stringify({
				"Added": added,
				"Changed": changed,
				"CloneLocation": "/gitapi/clone/file/" + rest.replace("status/file/", ""),
				"CommitLocation": "/gitapi/commit/HEAD/file/" + rest.replace("status/file/", ""),
				"Conflicting": conflicting,
				"IndexLocation": "/gitapi/index/file/" + rest.replace("status/file/", ""),
				"Location": "/gitapi/status/file/" + rest.replace("status/file/", ""),
				"Missing": missing,
				"Modified": modified,
				"Removed": removed,
				"RepositoryState": repoState,
				"Type": "Status",
				"Untracked": untracked   
			});
	
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', resp.length);
			res.end(resp);
		})
		.catch(function(err) {
			console.log(err);
			writeError(403, res);
		});
	})
	.catch(function(err) {
		console.log(err);
		writeError(403, res);
	});

}

module.exports = {
	getStatus: getStatus
};