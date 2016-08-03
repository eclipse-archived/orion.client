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
var nodemailer = require('nodemailer'),
	fs = require('fs');

module.exports = function sendMail(opt){
	var read = function(cb) {
		var emailText;
		fs.readFile(opt.template, 'utf8', function (err,data) {
			if (err) {
				return cb(err);
			}
			var authUrl = opt.req.protocol + '://' + opt.req.get('host') + opt.auth + opt.user.authToken;
			emailText  = data.replace(/<EMAIL>/g, opt.user.email || "");
			emailText  = emailText.replace(/<USER>/g, opt.user.username || "");
			emailText  = emailText.replace(/<URL>/g, authUrl);
			emailText  = emailText.replace(/<PASSWORD>/g, opt.pwd || "");
			var subjLineIndex = emailText.indexOf("\n");
			var subject = emailText.substr(0, subjLineIndex);
			var body = emailText.substr(subjLineIndex);
			cb(null, subject, body);
		});
	};
	read(function(err, subject, body){
		var smtpConfig = {
			host: opt.options.configParams["mail.smtp.host"],
			port: opt.options.configParams["mail.smtp.port"],
			secure: true,
			auth: {
				user: opt.options.configParams["mail.smtp.user"],
				pass: opt.options.configParams["mail.smtp.password"]
			}
		};

		if (opt.options.configParams["mail.from"]) {
			var transport = nodemailer.createTransport(smtpConfig);
			var mailOptions = {
				from: opt.options.configParams["mail.from"],
				to: opt.user.email,
				subject: subject,
				text: body, 
			};
			transport.sendMail(mailOptions, function(error, info){
				if (error){
					return console.log(error + " " + info);
				}
				//console.log('Message sent: ' + info.response);
			});
		} else {
			// dev
			console.log(body);
		}
	});
}