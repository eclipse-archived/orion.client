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
var api = require('./api'), writeError = api.writeError;
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var os = require('os');
var Promise = require('bluebird');
var mkdirpAsync = Promise.promisify(require('mkdirp'));
var url = require('url');
var mPath = require('path');

var SITES_FILENAME = "sites.json";
var RUNNING_SITES_FILENAME = "runningSites.json";
var hosts = {};
var vhosts = [];

module.exports = function(options) {
	loadRunningSites();
	
	vhosts = (options.configParams["orion.site.virtualHosts"] || "").split(",");

	vhosts.forEach(function(host) {
		if (host === "") {
			return;
		}
		options.app.use(vhost(host, virtualHost));
	});

	return express.Router()
	.use(bodyParser.json())
	.get('/:site', getSite)
	.get('/', getSites)
	.put('/:site', putSite)
	.post('/', postSite)
	.delete('/:site', deleteSite);
	
function vhost(hostname, handler) {
	var regex = new RegExp("^" + hostname.replace(/\*/g, "[^\/\:\.]+") + "$");
	return function(req, res, next) {
		if ([req.hostname, req.headers.host, req.protocol + "://" + req.headers.host].some(function(h) {
			if (regex.exec(h)) {
				handler(h, req, res, next);				
				return true;
			}
		})) {
			return;
		}
		next();
	};
}

function virtualHost(vhost, req, res, next) {
	var host = hosts && hosts[vhost];
	if (host) {
		var username = host.Id.split("-")[0];
		var urlPath = url.parse(req.url).pathname;
		if (host.Mappings.some(function(mapping) {
			if (req.url.indexOf(mapping.Source) === 0) {
				var u = url.parse(mapping.Target);
				if (u.protocol) {
					next();
					return true;
				}
				var relative  = urlPath.substring(mapping.Source.length);
				var path;
				if (options.configParams["orion.single.user"]) {
					path = mPath.join(options.workspaceDir, mapping.Target, relative);
				} else {
					path = mPath.join(options.workspaceDir, username.substring(0, 2), username, "OrionContent", mapping.Target, relative);
				}
				if (fs.existsSync(path)) {
					res.sendFile(path);
					return true;
				}
			}
		})) return;
	}
	res.status(404).send(host ? "Not found" : "Site stopped: " + vhost);
}

function getHostedSiteURL(site) {
	var result;
	Object.keys(hosts).some(function(hostname) {
		if (hosts[hostname].Id === site.Id) {
			result = hostname;
			return true;
		}
	});
	return result;
}

function siteJSON(site, req) {
	site.Location = "/site/" + site.Id;
	var siteURL = getHostedSiteURL(site);
	if (siteURL) {
		if (siteURL.indexOf("://") === -1) {
			siteURL = req.protocol + "://" + siteURL;
		}
		var parsedURL = url.parse(siteURL);
		if (!parsedURL.port) {
			var port = req.get("host").split(":")[1];
			if (port) {
				parsedURL.host = null;
				parsedURL.port = port;
			}
		}
		siteURL = url.format(parsedURL);
		if (siteURL[siteURL.length - 1] === '/') siteURL = siteURL.substring(0, siteURL.length - 1);
	}
	site.HostingStatus = {
		Status: siteURL ? "started" : "stopped",
		URL: siteURL
	};
	return site;
}

function getSitesFile(req) {
	var folder = options.configParams['orion.single.user'] ? os.homedir() : req.user.workspaceDir;
	return mPath.join(folder, '.orion', SITES_FILENAME);
}

function loadRunningSites() {
	if (!options.configParams["orion.sites.save.running"]) return;
	try {
		hosts = JSON.parse(fs.readFileSync(mPath.join(options.workspaceDir, RUNNING_SITES_FILENAME), "utf8"));
	} catch (e) {}
}

function saveRunningSites() {
	if (!options.configParams["orion.sites.save.running"]) return;
	fs.writeFile(mPath.join(options.workspaceDir, RUNNING_SITES_FILENAME), JSON.stringify(hosts), "utf8");
}

function loadSites(req, callback) {
	fs.readFile(getSitesFile(req), 'utf8', function (err,data) {
		if (err) {
			// assume that the file does not exits
			return callback(null, {});
		}
		var sites = {};
		try {
			sites = JSON.parse(data);
		} catch (e) {}
		return callback(null, sites);
	});
}

function saveSites(req, sites, callback) {
	var file = getSitesFile(req);
	mkdirpAsync(mPath.dirname(file)) // create parent folder(s) if necessary
	.then(function() {
		fs.writeFile(file, JSON.stringify(sites, null, "\t"), callback);
	});
}

function getSite(req, res) {
	loadSites(req, function (err, sites) {
		if (err) {
			return writeError(404, res, err.message);
		}
		var site = sites[req.params.site];
		if (site) {
			res.status(200).json(siteJSON(site, req));
		} else {
			res.writeHead(400, "Site not found:" + req.params.id);
			res.end();
		}
	});
}

function getSites(req, res) {
	loadSites(req, function (err, sites) {
		if (err) {
			return writeError(404, res, err.message);
		}
		var result = Object.keys(sites).map(function(id) {
			return siteJSON(sites[id], req);
		});
		res.status(200).json({SiteConfigurations: result});
	});
}

function updateSite(req, res, callback, okStatus) {
	loadSites(req, function (err, sites) {
		if (err) {
			return writeError(404, res, err.message);
		}
		if (!req.params.site) {
		}
		var site = sites[req.params.site];
		if (site || !req.params.site) {
			site = callback(site, sites);
			if (site && site.error) {
				res.writeHead(site.status, site.error);
				return res.end();
			}
			saveSites(req, sites, function() {
				if (err) res.writeHead(400, "Failed to update site:" + req.params.id);
				res.status(okStatus || 200);
				site ? res.json(siteJSON(site, req)) : res.end();
			});
		} else {
			res.writeHead(400, "Site not found:" + req.params.id);
			res.end();
		}
	});
}

function copySite(site, req) {
	if (typeof req.body.Name === "string") site.Name = req.body.Name;
	if (typeof req.body.HostHint === "string") site.HostHint = req.body.HostHint;
	if (typeof req.body.Workspace === "string") site.Workspace = req.body.Workspace;
	if (req.body.Mappings) site.Mappings = req.body.Mappings;
	if (!site.Mappings) site.Mappings = [];
}

function acquireURL(site) {
	for (var i=0; i<vhosts.length; i++) {
		var vhostname = vhosts[i];
		var siteURL;
		if (vhostname.indexOf("*") !== -1) {// wildcard host
			var hint = site.HostHint, count = 0;
			do {
				siteURL = vhostname.replace("*", hint);
				hint += count++;
			} while (hosts[siteURL]);// URL already in use
		} else {
			siteURL = vhostname;
		}
		if (!hosts[siteURL]) {// URL already in use
			return siteURL;
		}
	}
	return null;
}

function startSite(site) {
	if (getHostedSiteURL(site)) return; // already started
	var siteURL = acquireURL(site);
	if (!siteURL) {
		return {status: 500, error: "No more hosts available"};
	}
	hosts[siteURL] = site;
	return site;
}

function stopSite(site) {
	var siteURL = getHostedSiteURL(site);
	delete hosts[siteURL];
	return site;
}

function putSite(req, res) {
	updateSite(req, res, function(site) {
		copySite(site, req);
		if (req.body.HostingStatus) {
			if (req.body.HostingStatus.Status === "started") {
				site = startSite(site);
			} else if (req.body.HostingStatus.Status === "stopped") {
				site = stopSite(site);
			}
			saveRunningSites();
		}
		return site;
	});
}

function postSite(req, res) {
	updateSite(req, res, function(site, sites) {
		site = {};
		copySite(site, req);
		var counter = 0;
		while (sites[req.user.username + "-" + counter]) {
			counter++;
		}
		site.Id = req.user.username + "-" + counter;
		sites[site.Id] = site;
		return site;
	}, 201);
}
	
function deleteSite(req, res) {
	updateSite(req, res, function(site, sites) {
		delete sites[site.Id];
		return null;
	});
}
		
};