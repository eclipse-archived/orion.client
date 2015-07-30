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
/*eslint no-console:1*/
var api = require('../api'), writeError = api.writeError;
var git = require('nodegit');
var path = require("path");
var fs = require('fs');
var async = require('async');

function getClone(workspaceDir, fileRoot, req, res, next, rest) {
	var repos = [];

	fs.readdir(workspaceDir, function(err, files) {
		if (err) return writeError(500);
		
		files = files.map(function(file) {
			return path.join(workspaceDir, file);
		});

		async.each(files, checkDirectory, function(err) {
			if (err) return writeError(403);
			var resp = JSON.stringify({
				"Children": repos,
				"Type": "Clone"
			});

			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', resp.length);
			res.end(resp);	
		});
	});

	function checkDirectory(dir, cb) {
		//Check if the dir is a directory
		fs.lstat(dir, function(err, stat) {
			if (err || !stat.isDirectory()) return cb(err);
			var base = path.basename(dir);
			git.Repository.open(dir)
			.then(function(repo) {
				var location = api.join(fileRoot, dir.replace(workspaceDir + "/", ""));
				var repoInfo = {
					"BranchLocation": "/gitapi/branch" + location,
					"CommitLocation": "/gitapi/commit" + location,
					"ConfigLocation": "/gitapi/config/clone" + location,
					"ContentLocation": location,
					"DiffLocation": "/gitapi/diff/Default" + location,
					"HeadLocation": "/gitapi/commit/HEAD" + location,
					"IndexLocation": "/gitapi/index" + location,
					"Location": "/gitapi/clone" + location,
					"Name": base,
					"RemoteLocation": "/gitapi/remote" + location,
					"StashLocation": "/gitapi/stash" + location,
					"StatusLocation": "/gitapi/status" + location,
					"TagLocation": "/gitapi/tag" + location,
					"Type": "Clone"
				};

				repo.getRemotes()
				.then(function(remotes){
					async.each(remotes, function(remote, callback) {
						if (remote === "origin") {
							repo.getRemote(remote)
							.then(function(remote){
								repoInfo.GitUrl = remote.url();
								callback();
							});
						} else {
							callback();
						}
					}, function(err) {
						repos.push(repoInfo);
						return cb();	
					});
				});
	 		})
			.catch(function(err) {
				fs.readdir(dir, function(err, files) {
					if (err) {
						return cb(err);
					}

					files = files.map(function(file) {
						return path.join(dir, file);
					});
					async.each(files, checkDirectory, cb);
				});
			});
		});
	}
}

function postInit(workspaceDir, fileRoot, req, res, next, rest) {
	if (req.body.GitUrl) {
		postClone(workspaceDir, fileRoot, req, res, next, rest);
	} else {
		var initDir = workspaceDir + '/' + req.body.Name;
		var theRepo, index, author, committer;

	    fs.mkdir(initDir, function(err){
			if (err) {
		    	return writeError(409, res);
	        }

	        git.Repository.init(initDir, 0)
		    .then(function(repo) {
		    	theRepo = repo;
		    	return repo;
		    })
		    .then(function(repo){
				return repo.openIndex();
			})
			.then(function(idx) {
				index = idx;
				index.read(1);
			})
			.then(function() {
				return index.writeTree();
			})
			.then(function(oid) {
				author = git.Signature.default(theRepo);	
				committer = git.Signature.default(theRepo);

				// Since we're creating an inital commit, it has no parents. Note that unlike
				// normal we don't get the head either, because there isn't one yet.
				return theRepo.createCommit("HEAD", author, committer, "Initial commit", oid, []);
			})
			.then(function(id) {
				var response = {
			       	"Location": "/gitapi/clone/file/" + req.body.Name
			    }
			    var resp = JSON.stringify(response)
			    res.statusCode = 201;
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);

		    })
		    .catch(function(err){
		    	console.log(err);
		    	writeError(403, res);
		    });

	    });
	}
}

function postClone(workspaceDir, fileRoot, req, res, next, rest) {
	var url = req.body.GitUrl;
	var dirName = url.substring(url.lastIndexOf("/") + 1).replace(".git", "")

	git.Clone.clone(url, path.join(workspaceDir, dirName),
		{
    		remoteCallbacks: {
	        	certificateCheck: function() {
	        		return 1; //Ignore SSL certificate check
        		}
        	}
		})
	.then(function() {
		// I think clone will return when it finishes cloning, so we just give it a fake task and 100%
		var resp = JSON.stringify({
			"Id": "11111",
			"Location": "/task/id/THISISAPLACEHOLDER",
			"Message": "Cloning " + workspaceDir + " @ " + url,
			"PercentComplete": 100,
			"Running": false
		});

		res.statusCode = 201;
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', resp.length);
		res.end(resp);
	})
	.catch(function(err) {
		// some kind of error with cloning a repo
		console.log("POST git/clone: failure!");
		console.log(err);
		writeError(403, res);
	});
}

module.exports = {
	getClone: getClone,
	postClone: postClone,
	postInit: postInit
};
