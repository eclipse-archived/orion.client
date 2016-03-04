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
/*eslint-env node*/

var mongoose = require('mongoose'),
passportLocalMongooseEmail = require('passport-local-mongoose-email');

var orionAccount = new mongoose.Schema({
    username: {
    	type: String,
		unique: true,
		required: true
    },
	email: {
		type: String,
		required: true,
		unique: true
	},
	created_at: {
		type: Date,
		default: Date.now
	}

});

orionAccount.plugin(passportLocalMongooseEmail);

module.exports = mongoose.model('orionAccount', orionAccount);