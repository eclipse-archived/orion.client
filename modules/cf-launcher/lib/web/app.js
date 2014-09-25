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
    path = require("path"),
    sessions = require("client-sessions"),
    nodeurl = require("url"),
    appControl = require("./appctl"),
    ProcessManager = require("../proc"),
    ProxyManager = require("./proxy"),
    tty = require("./tty"),
    util = require("../util");

var moduleDir = path.join(__dirname, "..", "..");


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
		.numbery("port");

	var appCommand = options.appCommand,
	    appName = options.appName,
	    launcherPrefix = "/" + options.urlPrefix,
	    password = options.password,
	    port = options.port,
	    useAuth = (typeof options.password === "string");

	util.log("Password %s", (useAuth ? "set" : "not set"));
	util.log("Application command line: %s", appCommand);
	util.log("VCAP_APP_PORT: %s", port);
	util.log("Launcher URL prefix: %s", launcherPrefix);
	util.log();

	// Create proxies, start app & inspector
	var proxyman = new ProxyManager(port);
	var proxies = proxyman.createProxies({
		target: {},
		inspector: {},
		tty: { ws: true, },
	});
	var inspector = proxies.inspector,
	    target = proxies.target;
	var procman = startProcesses(appName, appCommand, target.port, inspector.port);
	var ttyServer = tty.createServer({ port: proxies.tty.port }).listen();
	util.log("[Internal] Application port: %s", target.port);
	util.log("[Internal] node-inspector port: %s", inspector.port);

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
	launcherApp.use("/tty/", function(req, res) {
		proxies.tty.proxy.web(req, res);
	});
	launcherApp.use(inspector.proxy.web.bind(inspector.proxy));

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
			target.proxy.web(req, res);
		} else {
			// App not running, redirect user to launcher for convenience
			res.redirect(303, launcherPrefix);
		}
	});
	return {
		proxies: proxies,
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
 * @param {Number} options.port Port we should listen on.
 */
function startServer(options) {
	var launcherPrefix = options.urlPrefix,
	    port = options.port;

	var result = createProxyApp(options),
	    proxies = result.proxies,
	    serverApp = result.serverApp,
	    processManager = result.processManager,
	    sessionMiddleware = result.sessionMiddleware,
	    isLoggedIn = result.isLoggedIn;

	var server = http.createServer(serverApp);
	// Listen to `upgrade` event and proxy incoming WebSocket requests to either inspector, tty, or user app.
	// TODO: clean this up -- there has to be a better way
	server.on("upgrade", function(req, socket, head) {
		var url = req._parsedUrl || nodeurl.parse(req.url);
		var segs = url.pathname.split("/").slice(1), rootSegment = segs[0];
		if (rootSegment !== launcherPrefix)
			return proxies.target.proxy.ws(req, socket, head); // not for us, send to user app

		// At this point we know the request is for something in the launcher, either inspector or TTY
		var destinationProxy;
		if (segs[1] === "ws") {
			// node-inspector makes a ws connection to "ws://[whatever]/launcher/ws?", which we catch here.
			destinationProxy = proxies.inspector.proxy;
		} else if (segs[1] === "tty") {
			// Hack: we have a url like /launcher/tty/socket.io?foo but tty.js is expecting /socket.io?foo
			// so chop off the leading 2 segments and shove the result back into req.url before proxying
			// TODO try http-proxy forward or forwardPath
			url.pathname = "/" + segs.slice(2).join("/");
			req._parsedUrl = url;
			req.url = nodeurl.format(url);
			util.log("TTY.js-bound URL rewritten to: " + nodeurl.format(req.url));
			destinationProxy = proxies.tty.proxy;
		}
		// Check login
		sessionMiddleware(req, {}, function(err) {
			if (isLoggedIn(req)) {
				return destinationProxy.ws(req, socket, head);
			}
			util.log("Rejected unauthenticated websocket access from %s", req.ip);
			return socket.destroy();
		});
	});
	processManager.on("debuggerListening", function() {
		server.emit("initialized");
	});
	server.listen(port);
	return server;
}

module.exports = startServer;
