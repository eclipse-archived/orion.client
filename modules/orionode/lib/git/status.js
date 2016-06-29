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
var clone = require('./clone');
var express = require('express');
var bodyParser = require('body-parser');

function router(options) {
	var fileRoot = options.fileRoot;
	if (!fileRoot) { throw new Error('options.root is required'); }

	return express.Router()
	.use(bodyParser.json())
	.get('*', getStatus);
	
	function getStatus(req, res) {
		return clone.getRepo(req)
		.then(function(repo) {
			var fileDir = clone.getfileDir(repo,req);
			return repo.getStatusExt({
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
						added.push(returnContent(file, "Cached"));
					}
					
					if (bit & git.Status.STATUS.INDEX_MODIFIED) {
						changed.push(returnContent(file, "Cached"));
					}
					
					if (bit & git.Status.STATUS.INDEX_DELETED) {
						removed.push(returnContent(file, "Cached"));
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
				
				res.status(200).json({
					"Added": added,
					"Changed": changed,
					"CloneLocation": "/gitapi/clone" + fileDir,
					"CommitLocation": "/gitapi/commit/HEAD" + fileDir,
					"Conflicting": conflicting,
					"IndexLocation": "/gitapi/index" + fileDir,
					"Location": "/gitapi/status/file" + fileDir,
					"Missing": missing,
					"Modified": modified,
					"Removed": removed,
					"RepositoryState": repoState,
					"Type": "Status",
					"Untracked": untracked   
				});
			});
		})
		.catch(function(err) {
			writeError(400, res, err);
		});
	}
}

module.exports = {
	router: router
};
