/*******************************************************************************
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var api = require('./api'),
	fileUtil = require('./fileUtil');

var POST = 1;
var PUT = 2;
var GET = 4;
var DELETE = 8;
var FULLACCESSRIGHT = 15; // 15 is POST | PUT | GET | DELETE
var CURRENT_VERSION = 3;

var getAccessRight = function (){
	return FULLACCESSRIGHT;
};

var getCurrentVersion = function(){
	return CURRENT_VERSION;
};

var createWorkspaceAccess = function(workspaceId){
	return [{
		"Method": getAccessRight(),
		"Uri": "/workspace/" + workspaceId
	},
	{
		"Method": getAccessRight(),
		"Uri": "/workspace/" + workspaceId + "/*"
	},
	{
		"Method": getAccessRight(),
		"Uri": "/file/" + workspaceId
	},
	{
		"Method": getAccessRight(),
		"Uri": "/file/" + workspaceId + "/*"
	}];
};

var createUserAccess = function(UserId){
	return [{
		"Method": getAccessRight(),
		"Uri": "/user/" + UserId
	}];
};

/**
 * uri is req.wholeUri stubstring from req.contextpath
 * methodMask is either POST=1,PUT=2,GET=4,DELETE=8
 */
var checkRights = function (userId, uri, req, res, next, method){
	var	methodMask = getMethod(method || req.method);
	if (uri === "/workspace"){
		return done(true);
	}
	
	// any user can access their site configurations
	if (uri.startsWith("/site")){
		return done(true);
	}
	
	// any user can access their own profile
	if (uri === "/users/" + userId){
		return done(true);
	}
	
	// any user can access tasks
	if (uri.startsWith("/task")){
		return done(true);
	}
	
	// import/export rights depend on access to the file content
	if (uri.startsWith("/xfer/export/") && uri.endsWith(".zip")){
		uri = "/file/" + uri.substring("/xfer/export/".length, uri.length - 4) + '/';
	} else if (uri.startsWith("/xfer/import/")) {
		uri = "/file/" + uri.substring("/xfer/import/".length); //$NON-NLS-1$
		if (!uri.endsWith("/")) //$NON-NLS-1$
			uri += '/';
	}
	
	var store = fileUtil.getMetastore(req);
	store.getUser(userId, function(err, metadata){
		if (err) {
			return done(null, err);
		}
		if (typeof metadata === "undefined") {
			return done(false);
		}
		var userRightArray = getAuthorizationData(metadata);
		var hasAccess = userRightArray.some(function(userRight){
			if(wildCardMatch(uri, userRight.Uri) && ((methodMask & userRight.Method) === methodMask)){
				return true;
			}
		});
		return done(hasAccess);
	});	
	function done(hasAccess, err){
		if (err) {
			api.writeError(404, res, err);
		} 
		if(hasAccess) {
			next();
		}else {
			api.writeError(403, res, "You are not authorized to access " + uri);
		}
	}
	function wildCardMatch(text, pattern){
		var cards = pattern.split("*");
		if (!pattern.startsWith("*") && !text.startsWith(cards[0])) { //$NON-NLS-1$
			return false;
		}
		if (!pattern.endsWith("*") && !text.endsWith(cards[cards.length - 1])) { //$NON-NLS-1$
			return false;
		}
		return !cards.some(function(card){
			var idx = text.indexOf(card);
			if (idx === -1){
				return true;
			}
			text = text.substring(idx + card.length);
		});
	}
	function getMethod(methodName){
		if(methodName === "POST"){
			return POST;
		}else if(methodName === "PUT"){
			return PUT;
		}else if(methodName === "GET"){
			return GET;
		}else if(methodName === "DELETE"){
			return DELETE;
		}
		return 0;
	}
	function getAuthorizationData(metadata){
		var properties;
		var workspaceIDs;
		if (typeof metadata.properties === "string") {
			properties = JSON.parse(metadata.properties); // metadata.properties need to be parse when using MongoDB
		} else {
			properties = metadata.properties; // metadata.properties don't need to be parse when using FS
			workspaceIDs = metadata.WorkspaceIds; // This is only needed for Java server's metadata migration from old Java code
		}
		var version = properties["UserRightsVersion"];
		var userRightArray = [];
		if (version === 1 || version === 2) { // This only for Java server's metadata migration 
			workspaceIDs.forEach(function(workspaceId){
				userRightArray = userRightArray.concat(createUserAccess(metadata["UniqueId"]).concat(createWorkspaceAccess(workspaceId)));
			});
		} else {
			userRightArray = properties.UserRights;
		}
		return userRightArray;
	}
};

module.exports.checkRights = checkRights;
module.exports.createWorkspaceAccess = createWorkspaceAccess;
module.exports.createUserAccess = createUserAccess;
module.exports.getCurrentVersion = getCurrentVersion;