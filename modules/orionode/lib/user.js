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

var expressSession = require('express-session'),
    passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth20').Strategy,
    GithubStrategy = require('passport-github2').Strategy,
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
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

	var GITHUB_CLIENT_ID = "dfb875039786a7c65c43";
	var GITHUB_CLIENT_SECRET = "284f56b250a4b353b9ca3aea48879a716026179b";

	var GOOGLE_CLIENT_ID = "548631316801-ojnibs648he2it9kaur1p7o8nn9roe75.apps.googleusercontent.com";
	var GOOGLE_CLIENT_SECRET = "vo0Wit5_A3VbMmh_FBdiGYSf";


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
		type: String,
		required: false,
		unique: true
	},
	workspace: {
		type: String
	},
	created_at: {
		type: Date,
		default: Date.now
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
		 
		console.log(body);
		// transport.sendMail(mailOptions, function(error, info){
		//     if(error){
		//        // return console.log(error);
		//     }
		//     //console.log('Message sent: ' + info.response);
		// });
	});
}

function setupUser(opt) {
	var options = opt.options;
	var singleUser = options.configParams["orion.single.user"];
	var app = opt.app;
	if (!singleUser) {
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: false }));
		app.use(cookieParser());
		app.use(expressSession({ secret: 'keyboard cat' }));
		app.use(passport.initialize());
		app.use(passport.session());

		passport.use(orionAccount.createStrategy());

		passport.use(new GoogleStrategy({
		    clientID: GOOGLE_CLIENT_ID,
		    clientSecret: GOOGLE_CLIENT_SECRET,
		    callbackURL: "http://127.0.0.1:8081/auth/google/callback",
		    scope: "openid email"
		  },
		  function(accessToken, refreshToken, profile, done){
				orionAccount.find({oauth: profile.provider + "/" + profile.id}, function(err, user) {
				if (err) {
					return done(err, null);
				}

				if (user && user.length) {
					return done(null, user[0]);
				}
				
				return done(null, {
					__newUser:true,
					email: profile.emails[0].value,
					username: profile.emails[0].value.split("@")[0],
					id: profile.provider + "/" + profile.id
				});
			});
		  }
		));

		passport.use(new GithubStrategy({
			clientID: GITHUB_CLIENT_ID,
		    clientSecret: GITHUB_CLIENT_SECRET,
		    callbackURL: "http://127.0.0.1:8081/auth/github/callback",
		    scope: "user:email"
		}, function(accessToken, refreshToken, profile, done){
			orionAccount.find({oauth: profile.provider + "/" + profile.id}, function(err, user) {
				if (err) {
					return done(err, null);
				}

				if (user && user.length) {
					return done(null, user[0]);
				}
				
				return done(null, {
					__newUser:true,
					email: profile.emails[0].value,
					username: profile.username,
					id: profile.provider + "/" + profile.id
				});
			});
		}));

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
				req.logIn(user, function(err) {
					if (err) { return next(err); }
					return res.sendStatus(200);
				});
			})(req, res, next);
		});


		app.get('/login/oauth/google', passport.authenticate('google'));

		var createNewUser = function(req, res, err,user,info) {
			if (user && user.__newUser) {
					//
					var url = "/mixloginstatic/LoginWindow.html";
		            url += "?oauth=create&email=" + user.email;
		            url += "&username=" + user.username;
		            url += "&identifier=" + user.id;
		           
					return res.redirect(url);
				}

				req.logIn(user, function(err) {
					if (err) { return err; }
					return res.redirect('/');
				});
			};

		app.get('/auth/google/callback',
		  function(req, res) {
			return passport.authenticate('google', {}, function(err, user, info){
				createNewUser(req,res,err,user,info);
			})(req,res)}
		);


		app.get('/login/oauth/github', passport.authenticate('github'));

		

		app.get('/auth/github/callback',
		  function(req, res) {
			return passport.authenticate('github', {}, function(err, user, info){
				createNewUser(req,res,err,user,info);
			})(req,res)}
		);

		app.get("/users/:id", function(req,res){
			if (!req.user) {
				return res.status(404).end();
			}

			return res.status(200).json({
				FullName: req.user.fullname,
				UserName: req.user.username,
				Location: "/users/" + req.user.username,
				Email: req.user.email,
				EmailConfirmed: req.user.isAuthenticated,
				HasPassword: true,
				OAuth: req.user.oauth,
				LastLoginTimestamp: 0,
				DiskUsageTimestamp: 0,
				DiskUsage: 0 
			});
		});
		

		app.post('/users', function(req, res){
			orionAccount.register(new orionAccount({username: req.body.UserName, email: req.body.Email, oauth: req.body.identifier}), req.body.Password ,function(err, user){
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
					return res.status(201).json({error: "Created"});
				}
			});
		});

		//auth token verify
		app.get('/useremailconfirmation/verifyEmail', function(req,res){
			var authToken = req.query.authToken;
			orionAccount.verifyEmail(authToken, function(err, user) {
				if (err) {
					//log
				}
				//remove auth token?
				// user.authToken = undefined;
				// user.save(function (err) {
				// 	//log err

				var workspacePath = [options.workspaceDir, user.username.substring(0,2), user.username, "OrionContent"];
				var localPath = workspacePath.slice(1).join("/");
				args.createDirs(workspacePath, function(err) {
					if (err) {
						//do something
					}

					user.workspace = localPath;
					user.save(function(err) {
						if (err) throw err;
					});

					return res.status(200).send("<html><body><p>Your email address has been confirmed. Thank you! <a href=\"" + ( req.protocol + '://' + req.get('host'))
			+ "\">Click here</a> to continue and login to your account.</p></body></html>");
				})
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

		app.post("/useremailconfirmation/cansendemails", function(req,res){
			res.status(200).json({EmailConfigured: !!options.configParams["mail.smtp.host"]});
		});

		//password reset verify
		app.post('/useremailconfirmation', function(req,res){
			
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
				orionAccount.find({email: req.body.Email}, function(err, user) {resetPwd(err, user[0])});
			}

		});

	} else {
		app.use(function(req,res,next){
			req.user = {username: "anonymous"};
			next();
		});
	}

	app.post('/login', function(req, res) {
		if (!req.user) {
			return res.status(200).end();
		}

		return res.status(200).json({
			FullName: req.user.fullname,
			UserName: req.user.username,
			Location: "/users/" + req.user.username,
			Email: req.user.email,
			EmailConfirmed: req.user.isAuthenticated,
			HasPassword: true,
			OAuth: req.user.oauth,
			LastLoginTimestamp: 0,
			DiskUsageTimestamp: 0,
			DiskUsage: 0 });
	});

	app.post('/login/canaddusers', function(req, res) {
		return res.status(200).json({
			CanAddUsers: options.configParams["orion.auth.user.creation"], 
			ForceEmail: options.configParams["orion.auth.user.creation.force.email"], 
			RegistrationURI:options.configParams["orion.auth.registration.uri"] || undefined});
	});
}


module.exports = function(options) {
	setupUser(options);
}