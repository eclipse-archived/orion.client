/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/

function FsMetastore() {
}
FsMetastore.prototype.initRoutes = function(app) {
	app.use(/* @callback */ function(req, res, next){
		req.user = {username: "anonymous"};
		next();
	});

	// app.post('/login', function(req, res) {
	// 	if (!req.user) {
	// 		return res.status(200).end();
	// 	}
	// 	return res.status(200).json({UserName: req.user.username});
	// });
};

function Factory() {
	return new FsMetastore();
}

module.exports = Factory;