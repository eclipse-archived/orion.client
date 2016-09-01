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

var express = require('express'),
	expressSession = require('express-session'),
	MongoStore = require('connect-mongo')(expressSession),
	passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth20').Strategy,
	GithubStrategy = require('passport-github2').Strategy,
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	mongoose = require('mongoose'),
	Promise = require('bluebird'),
	passportLocalMongooseEmail = require('passport-local-mongoose-email'),
	nodemailer = require('nodemailer'),
	fs = require('fs'),
	args = require('./args'),
	generator = require('generate-password');
	
var CONFIRM_MAIL = "./multitenant/EmailConfirmation.txt",
	PWD_CONFIRM_RESET_MAIL = "./multitenant/EmailConfirmationPasswordReset.txt",
	PWD_RESET_MAIL = "./multitenant/PasswordReset.txt";

var CONFIRM_MAIL_AUTH = "/useremailconfirmation/verifyEmail?authToken=",
	RESET_PWD_AUTH = "/useremailconfirmation/resetPwd?authToken=";

function userJSON(user) {
	return {
		FullName: user.fullname,
		UserName: user.username,
		Location: "/users/" + user.username,
		Email: user.email,
		EmailConfirmed: user.isAuthenticated,
		HasPassword: true,
		OAuth: user.oauth || undefined,
		LastLoginTimestamp: user.login_timestamp ? user.login_timestamp.getTime() : 0,
		DiskUsageTimestamp: user.disk_usage_timestamp ? user.disk_usage_timestamp.getTime() : 0,
		DiskUsage: user.disk_usage || 0 
	};
}

mongoose.Promise = Promise;

module.exports = function(options) {
	var app = express.Router();
	
	var orionAccountSchema = new mongoose.Schema({
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
		fullname: {
			type: String
		},
		oauth: {
			type: String
		},
		workspace: {
			type: String
		},
		login_timestamp: {
			type: Date
		},
		disk_usage: {
			type: String
		},
		disk_usage_timestamp: {
			type: Date
		},
		created_at: {
			type: Date,
			"default": Date.now
		}
	});
	
	orionAccountSchema.plugin(passportLocalMongooseEmail);
	
	var orionAccount = mongoose.model('orionAccount', orionAccountSchema);
	
	function sendMail(opt){
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
	
	mongoose.connect('mongodb://localhost/orion_multitenant');

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(expressSession({
		resave: false,
		saveUninitialized: false,
		secret: 'keyboard cat',
		store: new MongoStore({ mongooseConnection: mongoose.connection })
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	passport.use(orionAccount.createStrategy());
	passport.serializeUser(orionAccount.serializeUser());
	passport.deserializeUser(orionAccount.deserializeUser());
	
	function canAddUsers() {
		return !options.configParams["orion.auth.user.creation"];
	}
	function isAdmin(username) {
		return (options.configParams["orion.auth.user.creation"]	 || "").split(",").some(function(user) {
			return user === username;
		});
	}
	function oauth(id, username, email, req, done) {
		if (req.params["0"] === "/link") {
			return done(null, {
				__linkUser:true,
				email: email,
				username: username,
				id: id
			});
		}
		orionAccount.find({oauth: new RegExp("^" + id + "$", "m")}, function(err, user) {
			if (err) {
				return done(err, null);
			}
			if (user && user.length) {
				return done(null, user[0]);
			}
			return done(null, {
				__newUser:true,
				email: email,
				username: username,
				id: id
			});
		});
	}
	function createNewUser(req, res, err, user, info) {
		if (user) {
			if (user.__newUser) {
				if (!canAddUsers()) {
					var errorUrl = "/mixloginstatic/LoginWindow.html?error=" +
						new Buffer("There is no Orion account associated with this Id. Please register or contact your system administrator for assistance.").toString('base64');
					return res.redirect(errorUrl);
				}
				var registerUrl = "/mixloginstatic/LoginWindow.html";
				registerUrl += "?oauth=create&email=" + user.email;
				registerUrl += "&username=" + user.username;
				registerUrl += "&identifier=" + user.id;
				return res.redirect(registerUrl);
			} else if (user.__linkUser) {
				return res.status(200).send("<html><head></head><body onload=\"window.opener.handleOAuthResponse('" + user.id + "');window.close();\"></body></html>");
			}
		}
		req.logIn(user, function(err) {
			if (err) { return err; }
			user.login_timestamp = new Date();
			user.save(function(err){
				if (err) {
				}
				return res.redirect('/');
			});
		});
	}

	if (options.configParams["orion.oauth.google.client"]) {
		passport.use(new GoogleStrategy({
			clientID: options.configParams["orion.oauth.google.client"],
			clientSecret: options.configParams["orion.oauth.google.secret"],
			passReqToCallback: true,
			callbackURL: (options.configParams["orion.auth.host"] || "") + "/auth/google/callback",
			scope: "openid email"
		}, /* @callback */ function(req, accessToken, refreshToken, profile, done) {
			var email = profile.emails[0].value;
			oauth(profile.provider + "/" + profile.id, email.split("@")[0], email, req, done);
		}));
		app.get('/login/oauth/google', passport.authenticate('google'));
		app.get('/mixlogin/manageoauth/oauth/google', passport.authenticate('google', {callbackURL: (options.configParams["orion.auth.host"] || "") + "/auth/google/callback/link"}));
		app.get('/auth/google/callback*', function(req, res) {
			return passport.authenticate('google', {callbackURL: (options.configParams["orion.auth.host"] || "") + "/auth/google/callback" + (req.params["0"] || "")}, function(err, user, info){
				createNewUser(req,res,err,user,info);
			})(req,res);
		});
	}

	if (options.configParams["orion.oauth.github.client"]) {
		passport.use(new GithubStrategy({
			clientID: options.configParams["orion.oauth.github.client"],
			clientSecret: options.configParams["orion.oauth.github.secret"],
			passReqToCallback: true,
			callbackURL: (options.configParams["orion.auth.host"] || "") + "/auth/github/callback",
			scope: "user:email"
		}, /* @callback */ function(req, accessToken, refreshToken, profile, done) {
			var email = profile.emails[0].value;
			oauth(profile.provider + "/" + profile.id, profile.username, email, req, done);
		}));
		app.get('/login/oauth/github', passport.authenticate('github'));
		app.get('/mixlogin/manageoauth/oauth/github', passport.authenticate('github', {callbackURL: (options.configParams["orion.auth.host"] || "") + "/auth/github/callback/link"}));
		app.get('/auth/github/callback*', function(req, res) {
			return passport.authenticate('github', {callbackURL: (options.configParams["orion.auth.host"] || "") + "/auth/github/callback" + (req.params["0"] || "")}, function(err, user, info){
				createNewUser(req,res,err,user,info);
			})(req,res);
		});
	}

	app.post('/logout', function(req, res){
		req.logout();
		res.end();
	});
	
	app.post('/login/form', function(req, res, next) {
		passport.authenticate('local', function(err, user, info) {
			if (err) { 
				return next(err);  
			}
			if (!user) {
				return res.status(401).json({error: info.message});
			}
			req.logIn(user, function(err) {
				if (err) { return next(err); }
				user.login_timestamp = new Date();
				user.save(function(err){
					if (err) {
					}
					return res.status(200).end();
				});
			});
		})(req, res, next);
	});

	function checkUserAccess(req, res, next) {
		if (!req.user || !(req.params.id === req.user.username || isAdmin(req.user.username))) {
			return res.status(403).end();
		}
		next();
	}

	app.get("/users", checkUserAccess, function(req,res){
		orionAccount.find({}, function(err, users) {
			if (err) {
				return res.status(404).end();
			}
			var start = Math.min(users.length, Math.max(0, Number(req.query.start)) || 0);
			var rows = Math.min(users.length, Math.max(0, Number(req.query.rows)) || 20);
			var end = start + rows;
			var result = [];
			for (var i=start; i<end; i++) {
				result.push(userJSON(users[i]));
			}
			return res.status(200).json({
				Users: result,
				UsersStart: start,
				UsersRows: rows,
				UsersLength: users.length
			});
		});
	});

	app.get("/users/:id", checkUserAccess, function(req,res){
		orionAccount.findByUsername(req.params.id, function(err, user) {
			if (err) return res.status(404).end();
			if (!user) {
				res.writeHead(400, "User not fount: " + req.params.id);
				return res.end();
			}
			return res.status(200).json(userJSON(user));
		});
	});

	app.put("/users/:id", checkUserAccess, function(req,res){
		orionAccount.findByUsername(req.params.id, function(err, user) {
			if (err) return res.status(404).end();
			if (!user) {
				res.writeHead(400, "User not fount: " + req.params.id);
				return res.end();
			}
			var hasNewPassword = typeof req.body.Password !== "undefined";
			// users other than admin have to know the old password to set a new one
			if (!isAdmin(req.params.id)) {
				//TODO
			}
			if (typeof req.body.UserName !== "undefined") user.username = req.body.UserName;
			if (typeof req.body.FullName !== "undefined") user.fullname = req.body.FullName;
			if (typeof req.body.Email !== "undefined") user.email = req.body.Email;
			if (typeof req.body.OAuth !== "undefined") user.oauth = req.body.OAuth;
			function save(err) {
				if (err) res.writeHead(400, "Failed to update: " + req.params.id);
				return res.status(200).end();
			}
			if (hasNewPassword) {
				user.setPassword(req.body.Password, function(err, user) {
					if (err) res.writeHead(400, "Failed to update: " + req.params.id);
					user.save(save);
				});
			} else {
				user.save(save);
			}
		});
	});

	app.delete("/users/:id", checkUserAccess, function(req,res){
		orionAccount.remove({username: req.params.id}, function(err) {
			if (err) return res.status(400).end();
			return res.status(200).end();
		});
	});

	app.post("/users/:id", checkUserAccess, function(req,res){
		orionAccount.findByUsername(req.params.id, function(err, user) {
			if (err) return res.status(404).end();
			if (!user) {
				res.writeHead(400, "User not fount: " + req.params.id);
				return res.end();
			}
			user.setPassword(req.body.Password, function(err, user) {
				if (err) res.writeHead(400, "Failed to update: " + req.params.id);
				user.save(function save(err) {
					if (err) res.writeHead(400, "Failed to update: " + req.params.id);
					return res.status(200).end();
				});
			});
		});
	});

	function createUserDir(user, callback) {
		var workspacePath = [options.workspaceDir, user.username.substring(0,2), user.username, "OrionContent"];
		var localPath = workspacePath.slice(1).join("/");
		args.createDirs(workspacePath, function(err) {
			if (err) {
				//do something
			}
			user.workspace = localPath;
			user.save(function(err) {
				if (err) throw err;
				callback(null, localPath);
			});
		});
	}

	app.post('/users', function(req, res){
		// If there are admin accounts, only admin accounts can create users
		if (options.configParams["orion.auth.user.creation"] && !isAdmin(req.user && req.user.username)) {
			return res.status(403).end();
		}
		orionAccount.register(new orionAccount({username: req.body.UserName, email: req.body.Email, fullname: req.body.FullName, oauth: req.body.identifier}), req.body.Password ,function(err, user){
			if (err) {
				return res.status(404).json({Message: err.message});
			}
			if (options.configParams["orion.auth.user.creation.force.email"]) {
				sendMail({user: user, options: options, template: CONFIRM_MAIL, auth: CONFIRM_MAIL_AUTH, req: req});
			} else {
				user.isAuthenticated = true;
				createUserDir(user, function(err) {
					if (err) {
						//log
					}
				});
			}
			return res.status(201).json({error: "Created"});
		});
	});

	//auth token verify
	app.get('/useremailconfirmation/verifyEmail', function(req,res){
		var authToken = req.query.authToken;
		orionAccount.verifyEmail(authToken, function(err, user) {
			if (err) {
				//log
			}
			createUserDir(user, function(err) {
				if (err) {
					//log
				}
				return res.status(200).send("<html><body><p>Your email address has been confirmed. Thank you! <a href=\"" + ( req.protocol + '://' + req.get('host'))
				+ "\">Click here</a> to continue and login to your account.</p></body></html>");
			});
		});
	});

	app.get('/useremailconfirmation/resetPwd', function(req,res){
		var authToken = req.query.authToken;
		orionAccount.verifyEmail(authToken, function(err, user) {
			if (err) {
				//log
			}
			//generate pwd
			var password = generator.generate({
				length: 8,
				numbers: true,
				excludeSimilarCharacters:true
			});
			user.setPassword(password, function(err, user) {
				user.save(function(err){
					if (err) {
						//log
					}
					sendMail({user: user, options: options, template: PWD_RESET_MAIL, auth: "", req: req, pwd: password});
					return res.status(200).send("<html><body><p>Your password has been successfully reset. Your new password has been sent to the email address associated with your account.</p></body></html>");
				});
			});
		});
	});

	app.post("/useremailconfirmation/cansendemails", /* @callback */ function(req, res){
		res.status(200).json({EmailConfigured: !!options.configParams["mail.smtp.host"]});
	});

	app.post('/useremailconfirmation', function(req, res){
		var resetPwd = function(err, user) {
			if (err || !user) {
				res.writeHead(404, "User " +  (req.body.UserName || req.body.Email) + " not found");
				return res.end();
			}
			if (!user.isAuthenticated){
				res.writeHead(400, "Email confirmation has not completed. Please follow the instructions from the confirmation email in your inbox and then request a password reset again.");
				return res.end();
			}
			user.setAuthToken(function (err, user){
				user.save(function(err){
					sendMail({user: user, options: options, template: PWD_CONFIRM_RESET_MAIL, auth: RESET_PWD_AUTH, req: req});
					return res.status(200).json({"Severity":"Info","Message":"Confirmation email has been sent.","HttpCode":200,"BundleId":"org.eclipse.orion.server.core","Code":0});
				});
			});
		};
		if (req.body.UserName) {
			orionAccount.findByUsername(req.body.UserName, resetPwd);
		} else if (req.body.Email) {
			orionAccount.find({email: req.body.Email}, function(err, user) {resetPwd(err, user[0]);});
		}
	});

	app.post('/login/canaddusers', /* @callback */ function(req, res) {
		return res.status(200).json({
			CanAddUsers: canAddUsers(), 
			ForceEmail: !!options.configParams["orion.auth.user.creation.force.email"], 
			RegistrationURI:options.configParams["orion.auth.registration.uri"] || undefined});
	});
	
	app.post('/login', function(req, res) {
		if (!req.user) {
			return res.status(200).end();
		}
		return res.status(200).json(userJSON(req.user));
	});
	
	return app;
};