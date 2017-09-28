/*******************************************************************************
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var git = require('nodegit');
var url = require('url');

module.exports = {};

var BITBUCKET = "bitbucket.org";
var GITLAB = "gitlab.com";
var OAUTH2 = "oauth2";
var XTOKENAUTH = "x-token-auth";

var tokenProviders = [];

module.exports.addTokenProvider = function(value) {
	if (typeof value === "function") {
		tokenProviders.push(value);
	}
};

module.exports.removeTokenProvider = function(value) {
	if (typeof value === "function") {
		for (var i = 0; i < tokenProviders.length; i++) {
			if (tokenProviders[i] === value) {
				tokenProviders.splice(i, 1);
				return;
			}
		}
	}
};

module.exports.getCredentials = function(uri, user) {
	return new Promise(function(fulfill, reject) {
		if (!tokenProviders.length) {
			reject();
			return;
		}

		/* resolve with the result from the first token provider that succeeds */
		var doneCount = 0;
		for (var i = 0; i < tokenProviders.length; i++) {
			tokenProviders[i](uri, user).then(
				function(result) {
					if (++doneCount <= tokenProviders.length) {
						doneCount = tokenProviders.length;
						var username = result; /* typical case */
						var host = url.parse(uri).host.toLowerCase();
						if (host === GITLAB) {
							username = OAUTH2;
						} else if (host === BITBUCKET) {
							username = XTOKENAUTH;
						}

						fulfill(git.Cred.userpassPlaintextNew(username, result));
					}
				},
				function(error) {
					if (++doneCount === tokenProviders.length) {
						reject();
					}
				}
			);
		}
	});
};
