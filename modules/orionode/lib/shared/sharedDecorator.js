/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *		 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var api = require('../api');
var sharedUtil = require('./sharedUtil');
var sharedProjects = require('./db/sharedProjects');

module.exports = {};
	
module.exports.sharedDecorator = function(contextPath, rootName, req, filepath, originalJson){
	var result = originalJson;
	if (!"/file" === rootName && !"/workspace" ===rootName) {//$NON-NLS-1$ //$NON-NLS-2$
		return; 
	}
	var isWorkspace = "/workspace"=== rootName;	
	if (isWorkspace) {
        return;
	}
	if (!isWorkspace && req.method === "GET") {
		return Promise.resolve(sharedProjects.getHubID(filepath))
		.then(function(hubID) {
			if(hubID){
                return addHubMetadata(result,hubID);
			}
		})
		.catch(function(){
			return;
		});
	}

    function addHubMetadata(comingJson,hub){
        comingJson["Attributes"].hubID = hub;
        return comingJson;
    }
};
