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
var git = require('nodegit');

function getFileIndex(workspaceDir, fileRoot, req, res, next, rest) {
        var repo;
        var index;

        var repoPath = rest.replace("index/file/", "");
        var file = repoPath.substring(repoPath.indexOf("/")+1);
        repoPath = repoPath.substring(0, repoPath.indexOf("/"));
        repoPath = api.join(workspaceDir, repoPath);

        git.Repository.open(repoPath)
        .then(function(repoResult) {
          repo = repoResult;
          return repo;
        })
        .then(function(repo) {
          return repo.openIndex();
        })
        .then(function(indexResult) {
          index = indexResult;
          return index.read(1);
        })
        .then(function() {
          var indexEntry = index.getByPath(file);
          return git.Blob.lookup(repo, indexEntry.id);
        })
        .then(function(blob) {
          res.write(blob.toString());
          res.statusCode = 200;
          res.end();
        })
        .catch(function(err) {
          console.log(err);
          writeError(404, res);
        });
}

// Stage files
function putStage(workspaceDir, fileRoot, req, res, next, rest) {
  var index;

  var repoPath = rest.replace("index/file/", "");
  var filePath = repoPath.substring(repoPath.indexOf("/")+1);
  repoPath = repoPath.indexOf("/") === -1 ? repoPath : repoPath.substring(0, repoPath.indexOf("/"));
  repoPath = api.join(workspaceDir, repoPath);

  git.Repository.open(repoPath)
  .then(function(repoResult) {
    return repoResult;
  })
  .then(function(repo) {
    return repo.openIndex();
  })
  .then(function(indexResult) {
    index = indexResult;
    return index.read(1);
  })
  .then(function() {
    if (req.body.Path) {
      req.body.Path.forEach(function(path) {
        index.addByPath(path);
      });
    } else {
      return index.addByPath(filePath);
    }
  })
  .then(function() {
    // this will write both files to the index
    return index.write();
  })
  .then(function() {
    return index.writeTree();
  })
  .done(function(tree) {
    res.statusCode = 200;
    res.end();
  });
}

// unstage files
function postStage(workspaceDir, fileRoot, req, res, next, rest) {
  var repo;

  var repoPath = rest.replace("index/file/", "");
  var filePath = repoPath.substring(repoPath.indexOf("/")+1);
  repoPath = repoPath.indexOf("/") === -1 ? repoPath : repoPath.substring(0, repoPath.indexOf("/"));
  repoPath = api.join(workspaceDir, repoPath);

  git.Repository.open(repoPath)
  .then(function(repoResult) {
    repo = repoResult;
    return repoResult;
  })
  .then(function(repo) {
      return git.Reference.nameToId(repo, "HEAD");
  })
  .then(function(head) {
    return repo.getCommit(head);
  })
  .then(function(commit) {
    if (req.body.Path) {
      if (typeof req.body.Path === "string") {
        return git.Reset.default(repo, commit, req.body.Path);
      } else {
        req.body.Path.forEach(function(path) {
          return git.Reset.default(repo, commit, path);
        });
      }
    } else if (req.body.Reset) {
      return git.Reset.default(repo, commit, ".");
    } else {
      return git.Reset.default(repo, commit, filePath);

    }
  })
  .done(function() {
    res.statusCode = 200;
    res.end();
  });
}

module.exports = {
    putStage: putStage,
    postStage: postStage,
    getFileIndex: getFileIndex
};
