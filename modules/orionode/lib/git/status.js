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
var api = require('../api'),
    writeError = api.writeError;
var git = require('nodegit');

function getStatus(workspaceDir, fileRoot, req, res, next, rest) {
    var repoPath = rest.replace("status/file/", "");
    var fileDir = repoPath;
    repoPath = api.join(workspaceDir, repoPath);

    git.Repository.open(repoPath)
    .then(function(repo) {
        var statuses = repo.getStatusExt({
            flags: 
                git.Status.OPT.INCLUDE_UNTRACKED | 
                git.Status.OPT.RECURSE_UNTRACKED_DIRS
        });

        var added = [],
            changed = [], // no idea
            conflicting = [], // merge conflict??
            missing = [], // no idea
            modified = [],
            removed = [], 
            untracked = [];

        function returnContent(file) {
        	var orionFilePath = api.join(fileDir, file.path());
            return {
                "Git": {
                    "CommitLocation": "/gitapi/commit/HEAD/file/" + orionFilePath,
                    "DiffLocation": "/gitapi/diff/Default/file/"+ orionFilePath,
                    "IndexLocation": "/gitapi/index/file/" + orionFilePath
                },
                "Location": "/file/" + orionFilePath,
                "Name": file.path(),
                "Path": file.path()
            };
        }

        statuses.forEach(function(file) {
            var bit = file.statusBit();

            switch(bit) {
                case git.Status.STATUS.WT_MODIFIED:
                    modified.push(returnContent(file));
                    break;
                case git.Status.STATUS.WT_DELETED:
                    removed.push(returnContent(file));
                    break;
                case git.Status.STATUS.WT_TYPECHANGE:
                    changed.push(returnContent(file));
                    break;
                case git.Status.STATUS.WT_NEW:
                    untracked.push(returnContent(file));
                    break;
                default:
                    added.push(returnContent(file));
                    break;
            }
           
            //		        if (status.isRenamed()) { words.push("RENAMED"); }
            //		        if (status.isIgnored()) { words.push("IGNORED"); }
        });

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
            "RepositoryState": "SAFE",
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

}

module.exports = {
    getStatus: getStatus
};