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

var  expressSession = require('express-session'),
    passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth').Strategy,
    GithubStrategy = require('passport-github2').Strategy,
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    passportLocalMongooseEmail = require('passport-local-mongoose-email'),
    nodemailer = require('nodemailer'),
    fs = require('fs'),
    generator = require('generate-password');

    var CONFIRM_MAIL = "./multitenant/EmailConfirmation.txt",
		PWD_CONFIRM_RESET_MAIL = "./multitenant/EmailConfirmationPasswordReset.txt",
		PWD_RESET_MAIL = "./multitenant/PasswordReset.txt";

	var CONFIRM_MAIL_AUTH = "/useremailconfirmation/verifyEmail?authToken=",
		RESET_PWD_AUTH = "/useremailconfirmation/resetPwd?authToken=";



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

			// passport.use(new GoogleStrategy({
			//     returnURL: 'http://localhost/auth/google/return',
			//     realm: 'http://localhost/'
			//   },
			//   function(identifier, profile, done) {
			//     // User.findOrCreate({ openId: identifier }, function(err, user) {
			//     //   done(err, user);
			//     // });
			//   }
			// ));

			passport.use(new GithubStrategy({
			  clientID: 'dfb875039786a7c65c43',
			  clientSecret: '284f56b250a4b353b9ca3aea48879a716026179b',
			  callbackURL: 'http://localhost:8081/auth/github/callback'
			}, function(accessToken, refreshToken, profile, done){
			  done(null, {
			    accessToken: accessToken,
			    profile: profile
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

			app.get('/login/oauth', function(req, res, next) {
				var oauthType = (req.query && req.query.oauth) || "";
				if (oauthType === "google") {
					console.log("google");
				} else if (oauthType === "github") {
					  passport.authenticate('github');
				}
			});

			app.get('/auth/error', function(req, res){
				console.log("error");
			});

			app.get('/auth/github/callback',
			  passport.authenticate('github', {failureRedirect: '/auth/error'}),
			  function(req, res) {
				console.log("ok");
			  }
			);


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
					
					return res.status(200).send("<html><body><p>Your email address has been confirmed. Thank you! <a href=\"" + ( req.protocol + '://' + req.get('host'))
				+ "\">Click here</a> to continue and login to your account.</p></body></html>");
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

		app.post('/login', function(req, res) {
			return res.status(200).json(req.user);
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