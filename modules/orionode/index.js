/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var express = require('express'),
    path = require('path'),
    orionFile = require('./lib/file'),
    orionLogin = require('./lib/login'),
    orionWorkspace = require('./lib/workspace'),
    orionGit = require('./lib/git'),
    orionNodeStatic = require('./lib/orionode_static'),
    orionPrefs = require('./lib/controllers/prefs'),
    orionStatic = require('./lib/orion_static'),
    orionTasks = require('./lib/tasks'),
    orionSearch = require('./lib/search'),
    expressSession = require('express-session'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    nodemailer = require('nodemailer'),
    fs = require('fs'),
    orionAccount = require('./multitenant/orionaccount'),
    generator = require('generate-password'),
    term = require('term.js');

var LIBS = path.normalize(path.join(__dirname, 'lib/')),
    ORION_CLIENT = path.normalize(path.join(__dirname, '../../'));

var CONFIRM_MAIL = "./multitenant/EmailConfirmation.txt",
	PWD_CONFIRM_RESET_MAIL = "./multitenant/EmailConfirmationPasswordReset.txt",
	PWD_RESET_MAIL = "./multitenant/PasswordReset.txt";

var CONFIRM_MAIL_AUTH = "/users/verify?authToken=",
	RESET_PWD_AUTH = "/users/resetPwd?authToken=";

function handleError(err) {
	throw err;
}

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
			var body = emailText.substr(subjLineIndex)
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

		var transport = nodemailer.createTransport(smtpConfig);

		var mailOptions = {
		    from: opt.options.configParams["mail.from"],
		    to: opt.user.email,
		    subject: subject,
		    text: body, 
		    //html: '<b>Orion</b>' // html body 
		};
		 
		transport.sendMail(mailOptions, function(error, info){
		    if(error){
		       // return console.log(error);
		    }
		    //console.log('Message sent: ' + info.response);
		});
	});
}

function startServer(options) {
	options = options || {};
	options.maxAge = typeof options.maxAge === "number" ? options.maxAge : undefined;
	var workspaceDir = options.workspaceDir;
	var singleUser = options.configParams["orion.single.user"];
	
	try {
		var app = express();
		
		if (!singleUser) {
			app.use(bodyParser.json());
			app.use(bodyParser.urlencoded({ extended: false }));
			app.use(cookieParser());
			app.use(expressSession({ secret: 'keyboard cat' }));
			app.use(passport.initialize());
			app.use(passport.session());

			passport.use(orionAccount.createStrategy());
			passport.serializeUser(orionAccount.serializeUser());
			passport.deserializeUser(orionAccount.deserializeUser());

			mongoose.connect('mongodb://localhost/orion_multitenant');

			app.post('/logout', function(req, res){
				req.logout();
				res.end();
			});
			
			app.post('/login/form', function(req, res, next) {
				passport.authenticate('local', function(err, user, info) {
					if (err) { 
						console.log("Auth err: " + err.message);
						return next(err); 
					}
					if (!user) { 
						return res.status(401).json({error: info.message});
					 }
					// user.setPassword("tonic", function(err, result){
					// 	result.save(function(err){
					// 		console.log(err);
					// 	});
					// });
					req.logIn(user, function(err) {
						if (err) { return next(err); }
						return res.sendStatus(200);
					});
				})(req, res, next);
			});

			app.post('/users', function(req, res){
				orionAccount.register(new orionAccount({username: req.body.UserName, email: req.body.Email}), req.body.Password ,function(err, user){
					if (!err) {
						if (options.configParams["orion.auth.user.creation.force.email"]){
							sendMail({user: user, options: options, template: CONFIRM_MAIL, auth: CONFIRM_MAIL_AUTH, req: req});
						} else {
							user.isAuthenticated = true;
							//remove auth token?
							user.save(function(err) {
							    if (err) throw err;
							    console.log('Updated');
							  });
						}
						return res.sendStatus(201);
					}
				});
			});

			//auth token verify
			app.use('/users/verify', function(req,res, next){
				var authToken = req.query.authToken;
				orionAccount.verifyEmail(authToken, function(err, user) {
					if (err) {
						//log
					}
					//remove auth token?
					// user.authToken = undefined;
					// user.save(function (err) {
					// 	//log err
					// });
					//res.render("<html><body><p>Your email address has been confirmed. Thank you!</p></body></html>");
				});
			});

			app.use('/users/resetPwd', function(req,res, next){
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
						});
					});
				});
			});

			//password reset verify
			app.use('/useremailconfirmation', function(req,res, next){
				
				if (req.body.UserName) {
					user = orionAccount.findByUsername(req.body.UserName, function(err, user) {
						user.setAuthToken(function (err, user){
							user.save(function(err){
								if (err) {
									//log err
								}
								sendMail({user: user, options: options, template: PWD_CONFIRM_RESET_MAIL, auth: RESET_PWD_AUTH, req: req});
							});
							
						});
						
					});
				} else if (req.body.Email) {
					user = orionAccount.find({email: req.body.UserName}, function(err, user){
						sendMail({user: user, options: options, template: PWD_CONFIRM_RESET_MAIL, auth: RESET_PWD_AUTH, req: req});
					})
				}

			

				// var authToken = req.query.authToken;
				// orionAccount.verifyEmail(authToken, function(err, user) {
				// 	if (err) {
				// 		//log
				// 	}
				// 	//remove auth token?
				// 	// user.authToken = undefined;
				// 	// user.save(function (err) {
				// 	// 	//log err
				// 	// });
				// 	//res.render("<html><body><p>Your email address has been confirmed. Thank you!</p></body></html>");
				// });
			});

		} else {
			app.use(function(req,res,next){
				req.user = {username: "anonymous"};
			});
		}
	
		app.use(term.middleware());
		app.use(orionNodeStatic(path.normalize(path.join(LIBS, 'orionode.client/'))));
		app.use(orionStatic({
			orionClientRoot: ORION_CLIENT,
			maxAge: options.maxAge
		}));

		// API handlers
		app.use('/login', orionLogin());
		
		app.use(function (req, res, next) {
			if (!req.user) {
				res.writeHead(401, "Not authenticated");
				res.end();
				return;
			}
			next();
		});
		
		app.use('/task', orionTasks.orionTasksAPI({
			root: '/task'
		}));
		app.use('/file', orionFile({
			root: '/file',
			workspaceDir: workspaceDir
		}));
		app.use('/workspace', orionWorkspace({
			root: '/workspace',
			fileRoot: '/file',
			workspaceDir: workspaceDir
		}));
		app.use(orionGit({ 
			root: '/gitapi',
			fileRoot: '/file',
			workspaceDir: workspaceDir
		}));
		app.use('/filesearch', orionSearch({
			root: '/filesearch',
			fileRoot: '/file',
			workspaceDir: workspaceDir
		}));
		app.use('/prefs', orionPrefs({
			workspaceDir: workspaceDir
		}));

		//error handling
		app.use(function(req, res, next){
			res.status(404);

			// respond with html page
			if (req.accepts('html')) {
				//res.render('404', { url: req.url });
				return;
			}

			// respond with json
			if (req.accepts('json')) {
				res.send({ error: 'Not found' });
				return;
			}

			// default to plain-text. send()
			res.type('txt').send('Not found');
		});

		return app;
	} catch (e) {
		handleError(e);
	}
}

module.exports = startServer;
