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
var ACCESS_TOKEN = {};

exports.getBearerTokenfromUserId = function(userId){
	return ACCESS_TOKEN[userId];
};
exports.setBearerTokenforUserId = function(userID, accessToken){
	ACCESS_TOKEN[userID] = accessToken;
};