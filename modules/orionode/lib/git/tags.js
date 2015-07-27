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

function getTags(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("tag/file/", "");
	var tags = [];
  
  repoPath = api.join(workspaceDir, repoPath);
	
  git.Repository.open(repoPath)
	.then(function(repo) {
    git.Reference.list(repo)
  	.then(function(refNames) { // all of the refs names, as strings.
      var counts = 0;
      var total = refNames.length;
      refNames.forEach(function(refName) { 
        git.Reference.lookup(repo, refName)
        .then(function(ref) {
          if (ref.isTag()) {
            tags.push({
              "FullName": refName,
              "Name": refName.replace("refs/tags/", "")
            });
          }
          counts++;

          if (counts === total) {
            var resp = JSON.stringify({
              "Children": tags
            });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Length', resp.length);
            res.end(resp);
          }
        });
    	});
  	});
  });
}

function deleteTags(workspaceDir, fileRoot, req, res, next, rest) {
  var restOfTheUrl = rest.replace("tag/", "");
  var index = restOfTheUrl.indexOf("/");
  var tag = restOfTheUrl.substring(0, index);
  var repoPath = restOfTheUrl.substring(index+1).replace("file/", "");
  
  repoPath = api.join(workspaceDir, repoPath);

  git.Repository.open(repoPath)
  .then(function(repo) {
    if (repo) {
      var resp = git.Tag.delete(repo, tag);
      if (resp === 0) {
        res.statusCode = 200;
        res.end();
      } else {
        writeError(403, res);
      } 
    }
  });
}

module.exports = {
	getTags: getTags,
  deleteTags: deleteTags
};
