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
/*eslint-env node*/
var connect = require('connect');
var url = require('url');
var fs = require('fs');
var util = require('util');
var api = require('./api'), writeError = api.writeError;
var fileUtil = require('./fileUtil');
var resource = require('./resource');

module.exports = function(options) {
	var workspaceRoot = options.root;
	var workspaceDir = options.workspaceDir;
	if (!workspaceRoot) { throw 'options.root path required'; }

	return connect()
	.use(connect.json())
	.use(resource(workspaceRoot, {
		GET: function(req, res, next, rest) {
			var queryObject = url.parse(req.url, true).query;
			var ws = JSON.stringify({
					    "responseHeader": {
					        "status": 0,
					        "QTime": 1,
					        "params": {
					            "wt": "json",
					            "fl": "Name,NameLower,Length,Directory,LastModified,Location,Path",
					            "fq": [
					                "Location:/file*",
					                "UserName:rsong6"
					            ],
					            "rows": "10000",
					            "start": "0",
					            "sort": "Path asc",
					            "q": ". Name:plugin.js Location:/file*"
					        }
					    },
					    "response": {
					        "numFound": 0,
					        "start": 0,
					        "docs": []
					    }
					});
			res.setHeader('Content-Type', 'application/json');
			res.end(ws);
		}
	}));
};
