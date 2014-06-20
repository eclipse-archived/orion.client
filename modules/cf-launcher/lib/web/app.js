/*******************************************************************************
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/
var bodyParser = require("body-parser"),
    compression = require("compression"),
    express = require("express"),
    flash = require("connect-flash"),
    http = require("http"),
    httpProxy = require("http-proxy"),
    path = require("path"),
    sessions = require("client-sessions"),
    nodeurl = require("url"),
    nodeutil = require("util"),
    appControl = require("./appctl"),
    ProcessManager = require("../proc"),
    util = require("../util");

var moduleDir = path.join(__dirname, "..", "..");
var PROXY_ERR = "Error proxying to %s. Check application logs.";

function startProcesses(appName, appCommand, port_app, port_debug) {
	var procman = new ProcessManager();
	// Chose DEBUG state here for initial launch, it's less confusing that way
	procman.startApp(appName, appCommand, port_app, ProcessManager.State.DEBUG);
	procman.startDebugger("debugger", port_debug);
	return procman;
}

function createProxyApp(options) {
	util.checker(options)
		.array("appCommand")
		.string("appName")
		.string("urlPrefix")
		.optString("password") // password is optional
		.numbery("port")
		.numbery("debugPort")
		.numbery("appPort");

	var appCommand = options.appCommand,
	    appName = options.appName,
	    launcherPrefix = "/" + options.urlPrefix,
	    password = options.password,
	    port = options.port,
	    port_debug = options.debugPort,
	    port_app = options.appPort,
	    useAuth = (typeof options.password === "string");
	var procman;

	util.log("Password %s", (useAuth ? "set" : "not set"));
	util.log("Application command line: %s", appCommand);
	util.log("VCAP_APP_PORT: %s", port);
	util.log("Application port: %s", port_app);
	util.log("Debug UI port: %s", port_debug);
	util.log("Launcher URL prefix: %s", launcherPrefix);
	util.log();

	procman = startProcesses(appName, appCommand, port_app, port_debug);

	// Create proxies: one for proxying to node-inspector server..
	var debugProxy = new httpProxy.createProxyServer({
		target: {
			protocol: "http:",
			hostname: "localhost",
//			pathname: "/debug", // TODO get node-inspector UI to work at the root instead
//			query: { port: util.V8_DEBUG_PORT },
			port: port_debug
		}
	}),
	// ..another for proxying to the user app
	targetProxy = new httpProxy.createProxyServer({
		target: {
			hostname: "localhost",
			port: port_app
		}
	});

	debugProxy.on("error", function(err, socket, res) {
		util.log("Error proxying to debugger: %s", err);
		if (res.writeHead)
			res.send(500, nodeutil.format(PROXY_ERR, "debugger"));
		else if (socket.close)
			socket.close();
	});
	targetProxy.on("error", function(err, socket, res) {
		util.log("Error proxying to %s: %s", appName, err);
		if (res.writeHead)
			res.send(500, nodeutil.format(PROXY_ERR, appName));
		else if (socket.close)
			socket.close();
	});

	// ===================================================================
	// Setup authentication and client-side session.
	var sessionMiddleware, isLoggedIn;
	if (useAuth) {
		sessionMiddleware = sessions({
			cookieName: "cfLauncherSession",
			requestKey: "session", // connect-flash requires this key to be "session"
			secret: password,
			duration: 24 * 60 * 60 * 1000,
			activeDuration: 1000 * 60 * 5,
		});
		isLoggedIn = function(req) {
			return req.session.loggedIn;
		};
	} else {
		sessionMiddleware = function(req, res, next) {
			req.session = { reset: function(){} };
			next();
		};
		isLoggedIn = function() { return true; };
	}

	// ===================================================================
	var launcherApp = express.Router(), appPrefix = "/apps";
	launcherApp.use(bodyParser());
	launcherApp.post("/login", function(req, res) {
		if (req.body.password === password) {
			util.log("Successful login from: %s", req.ip);
			req.session.loggedIn = true;
			res.redirect(launcherPrefix);
		} else {
			util.log("Failed login attempt from: %s", req.ip);
			req.flash("error", "Incorrect password.");
			res.redirect("login");
		}
	});
	launcherApp.get("/login", function(req, res) {
		if (isLoggedIn(req, res)) {
			return res.redirect(launcherPrefix);
		}
		res.render("login", { error: req.flash().error });
	});
	launcherApp.get("/logout", function(req, res) {
		util.log("Logout %s", req.ip);
		req.session.reset();
		res.redirect("login");
	});
	launcherApp.use(function(req, res, next) {
		if (isLoggedIn(req))
				return next();
		res.redirect(launcherPrefix + "/login");
	});
	// Routes below this point require a valid session
	launcherApp.all(appPrefix, function(req, res, next) {
		// Redirect /apps to /apps. This would be better in appctrl.js
		if (req.originalUrl.slice(-1) !== "/")
			res.redirect(appPrefix.substr(1) + "/"); // "apps/"
		else next();
	});
	launcherApp.use(appPrefix, appControl(procman, appName));
	launcherApp.use("/", express.static(path.join(moduleDir, "public")));
	//launcherApp.use("/tty", function(req, res) {res.end("not implemented")});
	launcherApp.use(debugProxy.web.bind(debugProxy));

	// ===================================================================
	var app = express();
	app.set("view engine", "ejs");
	app.set("views", path.join(moduleDir, "views"));
	// At runtime on CF, if the parent module being debugged uses express 4.x, npm satisfies our express dependency using
	// the parent module's copy of express rather than install express locally to us. When the parent express tries to load
	// view engines, it simply calls require("{engine}"), which fails from the parent module's context (as it likely does
	// not depend on the same view engine that we do.)
	// The fix is to load the engine here, from the correct require context.
	app.engine("ejs", require("ejs").__express);
	app.use(compression());
	app.use(sessionMiddleware);
	app.use(flash());
	app.use(launcherPrefix, launcherApp);
	app.use(function(req, res/*, next*/) {
		if (procman.get(appName).state !== ProcessManager.State.STOP) {
			// App is running, proxy the request to it
			targetProxy.web(req, res);
		} else {
			// App not running, redirect user to launcher for convenience
			res.redirect(303, launcherPrefix);
		}
	});
	return {
		targetProxy: debugProxy,
		debugProxy: debugProxy,
		serverApp: app,
		processManager: procman,
		sessionMiddleware: sessionMiddleware,
		isLoggedIn: isLoggedIn,
	};
}

/**
 * @param {String} options.appName
 * @param {String[]} options.appCommand
 * @param {String} options.urlPrefix
 * @param {Number} options.port
 * @param {Number} options.port_app
 * @param {Number} options.port_debug
 */
function startServer(options) {
	var launcherPrefix = options.urlPrefix,
	    port = options.port;

	var result = createProxyApp(options),
	    targetProxy = result.targetProxy,
	    debugProxy = result.debugProxy,
	    serverApp = result.serverApp,
	    processManager = result.processManager,
	    sessionMiddleware = result.sessionMiddleware,
	    isLoggedIn = result.isLoggedIn;

	var server = http.createServer(serverApp);
	// Listen to the `upgrade` event and proxy the WebSocket requests as well.
	server.on("upgrade", function(req, socket, head) {
		var url = req._parsedUrl || nodeurl.parse(req.url);
		var segs = url.pathname.split("/").slice(1), rootSegment = segs[0];
		if (rootSegment !== launcherPrefix)
			return targetProxy.ws(req, socket, head);

		// node-inspector makes a websocket connection to "/launcher/ws?", which we handle here.
		// Only authenticated users can talk to the inspector.
		if (segs[1] === "ws") {
			sessionMiddleware(req, {}, function(err) {
				if (isLoggedIn(req))
					return debugProxy.ws(req, socket, head);
				util.log("Rejected unauthenticated access to node-inspector from %s", req.ip);
				return socket.destroy();
			});
		}
	});
	processManager.on("debuggerListening", function() {
		server.emit("initialized");
	});
	server.listen(port);
	return server;
}

module.exports = startServer;
