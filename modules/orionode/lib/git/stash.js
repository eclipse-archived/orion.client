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
var api = require('../api');
var git = require('nodegit');

/*
 * Stash for_each available after Nodegit commit f91c501
 * Merge pull request #495 from nodegit/enable-stash
 * Enable `git_stash_foreach`
 *
 */ 
function getStash(workspaceDir, fileRoot, req, res, next, rest) {
	
	var url = JSON.stringify(req.url);
	var repoName = rest.replace("stash/file/", "");
	var repoPath = api.join(workspaceDir, repoName);

	var location = url.substring(0, url.indexOf('?'));
	var cloneLocation = location.replace("/stash","/clone");
//	var stashType = "StashCommit";

	var stashesArray = [];
        var stashCb = function(index, message, oid) {
          stashesArray.push({
			"ApplyLocation" : "/gitapi/stash/" + oid + "/" + repoName, 
			"AuthorEmail" : "admin@orion.eclipse.org",
			"AuthorName" : "admin",
			"CloneLocation" : cloneLocation,
			"CommitterEmail" : "admin@orion.eclipse.org",
			"CommitterName" : "admin",
			"DiffLocation" : "/gitapi/diff/" + oid + "/" + repoName,
			"DropLocation" : "/gitapi/stash/" + oid + "/" + repoName,
			"Location:" : location.replace("/stash","/commit"),
			"Message" : message, 
			"Name" : String(oid),
			"Time" : 1424471958000, //hardcoded local variable
			"TreeLocation" : "/gitapi/tree/file/" + repoName + "/" + oid,
                        "Type" : "StashCommit" 
			});
	};

	git.Repository.open(repoPath).then(function(repo) {

		return git.Stash.foreach(repo, stashCb).then(function(){
			var resp = JSON.stringify({
                                "Children" : stashesArray,
                                "Location" : location,
				"CloneLocation" : cloneLocation,
				"Type" : "StashCommit"
                        });

                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Content-Length', resp.length);
                        res.end(resp);

		}); 
	});
}

module.exports = {
        getStash: getStash
};
