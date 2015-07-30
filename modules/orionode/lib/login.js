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
function login() {
    return function(req, res, next) {
        // Fake login response
        if (req.url === "/login" && req.method === "POST") {
            return res.end(JSON.stringify({
                "EmailConfirmed": false,
                "FullName": "anonymous",
                "HasPassword": true,
                "LastLoginTimestamp": "1416865840208",
                "Location": "/workspace/orionode",
                "UserName": "anonymous"
            }));
        }
        next();
    };
}

module.exports = login;
