/*******************************************************************************
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var express = require("express");

module.exports = function login() {
    return express.Router()
    .post("/", function(req, res/*, next*/) {
    	    return res.json(req.user);
//        // Fake login response
//        res.json({
//            "EmailConfirmed": false,
//            "FullName": "anonymous",
//            "HasPassword": true,
//            "LastLoginTimestamp": "1416865840208",
//            "Location": "/workspace/orionode",
//            "UserName": "anonymous"
//        });
    })
};