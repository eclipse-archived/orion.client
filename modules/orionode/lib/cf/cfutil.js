/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node, request*/
var target = require('./target');
var request = require('request');

module.exports.cfRequest = function (method, userId ,task, url, query, body, headers, requestHeader) {
    return new Promise(function(fulfill, reject) {
        if(!requestHeader){
        	var cloudAccessToken = target.getAccessToken(userId, task);
	        if (!cloudAccessToken) {
	            return;
	        }
        	headers = headers || {};
	        headers.Authorization = cloudAccessToken;
	        requestHeader = {};
	        requestHeader.url = url;
	        requestHeader.headers = headers;
	        query && (requestHeader.qs = query);
	        body && (requestHeader.body = body);
			requestHeader.method = method;
        }
        request(requestHeader, function (error, response, body) {
            if (error) {
                return reject(error);
            }
//            if (response.status) {
//                /// 
//                return reject();
//            }
            fulfill(target.parsebody(body));
        });
    });
};