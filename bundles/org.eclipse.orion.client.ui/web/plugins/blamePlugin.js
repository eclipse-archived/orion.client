/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define  document*/

define(["orion/xhr", "orion/plugin", "orion/Deferred", 'orion/operation'], function(xhr, PluginProvider, Deferred, operation) {

	var headers = {
		name: "Git Blame Plugin",
		version: "1.0",
		description: "Git Blame Plugin"
	};
	var provider = new PluginProvider(headers);

	var blameRequest = {
		getCommitInfo: function(location) {
			var service = this;
			var clientDeferred = new Deferred();
			xhr("GET", location, {
				headers: {
					"Orion-Version": "1",
					"Content-Type": "charset=UTF-8"
				},
				timeout: 15000,
				handleAs: "json" //$NON-NLS-0$
			}).then(function(result) {
				service._getGitServiceResponse(clientDeferred, result);
			}, function(error) {
				service._handleGitServiceResponseError(clientDeferred, error);
			});

			return clientDeferred;
		},
		getBlameInfo: function(location) {
			var service = this;

			var clientDeferred = new Deferred();

			xhr("GET", "/gitapi/blame/master" + location, {
				headers: {
					"Orion-Version": "1",
					"Content-Type": "charset=UTF-8"
				},
				timeout: 15000,
				handleAs: "json" //$NON-NLS-0$
			}).then(function(result) {
				service._getGitServiceResponse(clientDeferred, result);
			}, function(error) {
				service._handleGitServiceResponseError(clientDeferred, error);
			});	

			return clientDeferred;
		},

		_getGitServiceResponse: function(deferred, result) {
			var response = result.response ? JSON.parse(result.response) : null;

			if (result.xhr && result.xhr.status === 202) {
				var def = operation.handle(response.Location);
				def.then(deferred.resolve, function(data) {
					data.failedOperation = response.Location;
					deferred.reject(data);
				}, deferred.progress);
				deferred.then(null, function(error) {
					def.reject(error);
				});
				return;
			}

	   		deferred.resolve(response);
			return;
		},

		_handleGitServiceResponseError: function(deferred, error) {
			deferred.reject(error);
		}
	};

	/*
	 * Makes a server requests for the blame data, as well as server requests for
	 * all of the commits that make up the blame data
	 */
	function blameFile(url) {
		var wrappedResult = new Deferred();
		blameRequest.getBlameInfo(url).then(function(response) {
			var range = [];
			var commits = [];
			var j;
			var i;
			var found;
			for (i = 0; i < response.Children.length; i++) {
				range = response.Children[i];
				j = 0;
				found = false;
				var id = range.CommitLocation;
				while (j < commits.length && !found) {
					if (commits[j] === id) {
						found = true;
					}
					j++;
				}
				if (!found) {
					commits.push(id);
				}
			}

			for (i = 0; i < commits.length; i++) {
				commits[i] = blameRequest.getCommitInfo(commits[i] + "?pageSize=1");
			}

			Deferred.all(commits, function(error) {
				return {
					_error: error
				};
			}).then(function(blame) {

				blame.sort(function compare(a, b) {
					if (a.Children[0].Time < b.Children[0].Time) {
						return 1;
					}
					if (a.Children[0].Time > b.Children[0].Time) {
						return -1;
					}
					return 0;
				});

				for (var i = 0; i < response.Children.length; i++) {
					range = response.Children[i];
					for (var j = 0; j < blame.length; j++) {
						var c = blame[j].Children[0];
						if (c.Location === range.CommitLocation) {
							range.AuthorName = c.AuthorName;
							range.AuthorEmail = c.AuthorEmail;
							range.CommitterName = c.CommitterName;
							range.CommitterEmail = c.CommitterEmail;
							range.Message = c.Message;
							range.AuthorImage = c.AuthorImage;
							range.Name = c.Name;
							range.Time = new Date(c.Time).toLocaleString();
							range.Shade = (1 / (blame.length + 1)) * (blame.length - j + 1);
							break;
						}
					}
				}
				wrappedResult.resolve(response.Children);
			});
		});
		return wrappedResult;
	}

	var serviceImpl = {
		doBlame: function(fileName) {
			return blameFile(fileName);
		}
	};
	var properties = {
		name: "Git Blame",
		key: ["b", true, false, true] // Ctrl+Alt+b
	};

	provider.registerService("orion.edit.blamer", serviceImpl, properties);
	provider.connect();
});