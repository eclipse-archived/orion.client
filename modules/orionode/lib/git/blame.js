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
var finder = require('findit');

function getBlame(workspaceDir, fileRoot, req, res, next, rest) {

    finder(workspaceDir).on('directory', function (dir, stat, stop) {
        git.Repository.open(dir)
        .then(function(repo) {
            git.Blame.file(repo, dir).then(function(blame) {
                var resp = JSON.stringify(blame);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Length', resp.length);
                res.end(resp);

                return blame;
            });
        });

    });
}

module.exports = {
    getBlame: getBlame
};
