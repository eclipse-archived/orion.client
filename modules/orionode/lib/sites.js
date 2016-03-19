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
var url = require('url');
var vhost = require( 'vhost' );
var mPath = require('path');

var SITES = "sites.json";
var hosts = {};
var vhosts = [];

module.exports = function(options) {
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
	
function virtualHost(req, res, next) {
	var host = hosts && hosts[req.vhost.hostname];
	if (host) {
		var username = host.Id.split("-")[0];
		var urlPath = url.parse(req.url).pathname;
		if (host.Mappings.some(function(mapping) {
			var u = url.parse(mapping.Target);
			if (u.protocol) {
				//TODO - not sure what to do with sites mapping that have protocol
//				req.url = mapping.Source;
				next();
				return true;
			}
			if (req.url.indexOf(mapping.Source) === 0) {
				var relative  = urlPath.substring(mapping.Source.length);
				var path = mPath.join(options.workspaceDir, username.substring(0, 2), username, "OrionContent", mapping.Target, relative);
				if (fs.existsSync(path)) {
					res.sendFile(path);
					return true;
				}
			}
		})) return;
	}
	res.status(404).send(host ? "Not found" : "Site stopped: " + req.vhost.host);
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
		siteURL = req.protocol + "://" + siteURL;
		var port = req.get("host").split(":")[1];
		if (port) {
			siteURL += ":" + port;
		}
	}
	site.HostingStatus = {
		Status: siteURL ? "started" : "stopped",
		URL: siteURL
	};
	return site;
}

function loadSites(req, callback) {
	fs.readFile(api.join(req.user.workspaceDir, SITES), 'utf8', function (err,data) {
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
	fs.writeFile(api.join(req.user.workspaceDir, SITES), JSON.stringify(sites, null, "\t"), callback);
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