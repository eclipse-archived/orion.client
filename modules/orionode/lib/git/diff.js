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
var url = require('url');

function getDiff(workspaceDir, fileRoot, req, res, next, rest) {
	var query = url.parse(req.url, true).query;
	var parts = (query.parts || "").split(",");
	var paths = query.Path;
	var segments = rest.split("/");
	var hasScope = segments[1] !== "file";
	var scope = hasScope ? segments[1].replace(/%252F/g, '/') : "";
	var pattern = (hasScope ? segments.slice(4) : segments.slice(3)).join("/");
	var repoPath = hasScope ? segments[3] : segments[2];
	var fileDir = api.join(fileRoot, repoPath);
	repoPath = api.join(workspaceDir, repoPath);
	
	var diff;
	if (scope.indexOf("..") !== -1) {
		diff = getDiffBetweenTwoCommits(repoPath, scope.split(".."));
	} else if (scope === "Default") {
		diff = getDiffBetweenWorkingTreeAndHead(repoPath);
	} else if (scope === "Cached") {
		diff = getDiffBetweenIndexAndHead(repoPath);
	} else {
		diff = getDiffBetweenWorkingTreeAndHead(repoPath);
	}
	return diff
	.then(function(diff) {
		processDiff(diff, pattern, paths, fileDir, res, parts.indexOf("diff") !== -1, parts.indexOf("uris") !== -1, parts.indexOf("diffs") !== -1, query, scope);
	});
}

function changeType(patch, status) {
	if (patch.isAdded()) return "Added";
	if (patch.isConflicted()) return "Conflicting";
//	if (patch.isCopied()) return "Added";
	if (patch.isDeleted()) return patch.isTypeChange() ? "Removed" : "Missing";
//	if (patch.isIgnored()) return "Added";
	if (patch.isModified()) return patch.isTypeChange() ? "Modified" : "Changed";
//	if (patch.isRenamed()) return "Added";
//	if (patch.isUnmodified()) return "Added";
	if (patch.isUntracked) return "Untracked";
	return "";
}

function processDiff(diff, filePath, paths, fileDir, res, includeDiff, includeURIs, includeDiffs, query, scope) {
	var page = Number(query.page) || 1;
	var pageSize = Number(query.pageSize) || Number.MAX_SAFE_INTEGER;
	var URIs = [], diffContents = [], diffs = [], patches = [], i;
	diff.patches()
	.then(function(patches) {
		var result = [];
		var start = pageSize * (page - 1);
		var end = Math.min(pageSize + start, patches.length);
		i = start;
		patches.forEach(function(patch, pi) {
	        var newFile = patch.newFile();
	        var newFilePath = newFile.path();
			var oldFile = patch.oldFile();
			var oldFilePath = oldFile.path();
	        if ((!filePath || newFilePath.startsWith(filePath)) && (!paths || paths.indexOf(newFilePath) !== -1)) {
				patches.push(patch);
				
				if (includeURIs) {
		            URIs.push({
		                "Base": "/gitapi/index" + fileDir + "/" + newFilePath,
		                "CloneLocation": "/gitapi/clone" + fileDir,
		                "Location": "/gitapi/diff/Default" + fileDir + "/" + newFilePath,
		                "New": fileDir + "/" + newFilePath,
		                "Old": "/gitapi/index" + fileDir + "/" + newFilePath,
		                "Type": "Diff"
		            });
		        }
		        
		        if (includeDiffs && (start <= pi && pi < end)) {
		        	i = pi;
		        	var type = changeType(patch);
		        	var path = type !== "Deleted" ? newFilePath : oldFilePath;
		        	diffs.push({
		        		"ChangeType": type,
				        "ContentLocation": fileDir + "/" + path,
				        "DiffLocation": "/gitapi/diff/" + scope + fileDir + "/" + path,
				        "NewPath": newFilePath,
				        "OldPath": oldFilePath,
				        "Type": "Diff"
		        	});
		        }
		
		        if (includeDiff) {
		        	var buffer = "";
		            buffer += "diff --git a/" + oldFilePath + " b/" + newFilePath + "\n";
		            buffer += "index " + oldFile.id().toString().substring(0, 7) + ".." + newFile.id().toString().substring(0, 7) + " " + newFile.mode().toString(8) + "\n";
		            buffer += "--- a/" + oldFilePath + "\n";
		            buffer += "+++ b/" + newFilePath + "\n"; 
		
					result.push(patch.hunks()
					.then(function(hunks) {
						var lresult = [];
						hunks.forEach(function(hunk) {
							lresult.push(hunk.lines()
							.then(function(lines) {
								buffer += hunk.header() + "\n";
								lines.forEach(function(line) {
				                    var prefix = " ";
				                    switch(line.origin()) {
				                        case git.Diff.LINE.ADDITION:
				                            prefix = "+";
				                            break;
				                        case git.Diff.LINE.DELETION:
				                            prefix = "-";
				                            break;
				                        case git.Diff.LINE.DEL_EOFNL:
				                            prefix = "\\ No newline at end of file";
				                            break;
				                        case git.Diff.LINE.ADD_EOFNL:
				                            prefix = "\\ No newline at end of file";
				                            break;
				                    }
				                    buffer += prefix + line.content().split("\n")[0] + "\n";
				            	});
							}));
						});
						return Promise.all(lresult).then(function() {
				        	diffContents.push(buffer);
						});
					}));
				}
        	}
		});
		return Promise.all(result);
	})
	.done(function() {
		var body = "";
        if (includeDiff && includeURIs) {
            body += "--BOUNDARY\n";
            body += "Content-Type: application/json\n\n";
            body += JSON.stringify(URIs[0]);
            body += "--BOUNDARY\n";
            body += "Content-Type: plain/text\n\n";
            body += diffContents.join("");
            res.setHeader('Content-Type', 'multipart/related; boundary="BOUNDARY"');
        } else if (includeDiff) {
            body += diffContents.join("");
            res.setHeader('Content-Type', 'plain/text');
        } else if (includeDiffs) {
        	var result = {
            	"Type": "Diff",
            	"Length": patches.length,
            	"Children": diffs
            };
            if (i < patches.length) {
            	result.NextLocation = "";
            }
            body += JSON.stringify(result);
            res.setHeader('Content-Type', 'application/json');
        } else if (includeURIs) {
            body += JSON.stringify(URIs[0]);
            res.setHeader('Content-Type', 'application/json');
        }
        res.statusCode = 200;
        res.setHeader('Content-Length', body.length);
        return res.end(body);
	});
}

function getDiffBetweenWorkingTreeAndHead(repoPath) {
    return git.Repository.open(repoPath)
    .then(function(repo) {
        return git.Diff.indexToWorkdir(repo, null, {
            flags: 
                git.Diff.OPTION.SHOW_UNTRACKED_CONTENT |
                git.Diff.OPTION.INCLUDE_UNTRACKED | 
                git.Diff.OPTION.RECURSE_UNTRACKED_DIRS |
                git.Diff.OPTION.IGNORE_SUBMODULES,
            contextLines: 0
        });
    });
}

function getDiffBetweenIndexAndHead(repoPath) {
    var repo;

    return git.Repository.open(repoPath)
    .then(function(r) {
    	repo = r;
        return repo.head();
    })
    .then(function(ref) {
    	return repo.getReferenceCommit(ref);
    })
	.then(function(commit) {
		return commit.getTree();
	})
    .then(function(tree) {
        return git.Diff.treeToWorkdir(repo, tree, null);
    });
}

function getDiffBetweenTwoCommits(repoPath, commits) {
    var repo;
    var tree1;
    var tree2;

    return git.Repository.open(repoPath)
    .then(function(r) {
        repo = r;
    })
    .then(function() {
        return repo.getCommit(commits[0]);
    })
    .then(function(commit) {
        return commit.getTree();
    })
    .then(function(tree) {
        tree1 = tree;
    })
    .then(function() {
        return repo.getCommit(commits[1]);
    })
    .then(function(commit) {
        return commit.getTree();
    })
    .then(function(tree) {
        tree2 = tree;
    })
    .then(function() {
        return git.Diff.treeToTree(repo, tree2, tree1, null);
    });
}

function getDiffLocation(workspaceDir, fileRoot, req, res, next, rest) {
	var segments = rest.split("/");
	var oldCommit = segments[1];
    var newCommit = req.body.New;
    segments[1] = oldCommit + ".." + newCommit.replace(/\//g, '%252F');
    var location = "/gitapi/" + segments.join("/");
    location = url.format({pathname: location, query: url.parse(req.url, true).query});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Location', location);
    res.end(JSON.stringify({Location: location}));
}

module.exports = {
	getDiff: getDiff,
    changeType: changeType,
    getDiffLocation: getDiffLocation
};