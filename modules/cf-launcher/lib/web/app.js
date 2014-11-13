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
    cfAppEnv = require("cfenv").getAppEnv(),
    compression = require("compression"),
    express = require("express"),
    flash = require("connect-flash"),
    http = require("http"),
    path = require("path"),
    sessions = require("client-sessions"),
    nodeurl = require("url"),
    appControl = require("./appctl"),
    dav = require("./dav"),
    logger = require("../logger"),
    proxylogger = require("../logger")("proxy"),
    ProcessManager = require("../proc"),
    ProxyManager = require("./proxy"),
    tty = require("./tty"),
    util = require("../util");

var TARGET_APP = "target";

var moduleDir = path.join(__dirname, "..", "..");

function startProcesses(appCommand, label, port_app, port_debug) {
	var procman = new ProcessManager();
	// Chose DEBUG state here for initial launch, it's less confusing that way
	procman.startApp(TARGET_APP, appCommand, label, port_app, ProcessManager.State.DEBUG);
	procman.startDebugger("debugger", port_debug);
	return procman;
}

function createProxyApp(options) {
	util.checker(options)
		.array("appCommand")
//		.string("appName")
		.string("urlPrefix")
		.optString("password") // password is optional
		.numbery("port");

	var appCommand = options.appCommand,
	    launcherPrefix = "/" + options.urlPrefix,
	    password = options.password,
	    port = options.port,
	    useAuth = (typeof options.password === "string");

	logger("Password %s", (useAuth ? "set" : "not set"));
	logger("Application command line: %s", appCommand);
	logger("VCAP_APP_PORT: %s", port);
	logger("Launcher URL prefix: %s", launcherPrefix);
	logger();

	// Create proxies, start app & inspector
	var proxyman = new ProxyManager(port);
	var proxies = proxyman.createProxies({
		target: {},
		inspector: {},
		dav: {},
		tty: { ws: true, },
	});
	var inspector = proxies.inspector,
	    target = proxies.target;
	var procman = startProcesses(appCommand, options.appName, target.port, inspector.port);
	var ttyServer = tty.createServer({ port: proxies.tty.port }).listen();
	var davServer = dav.createServer(proxies.dav.port, password);
	logger("[Internal] Application port: %s", target.port);
	logger("[Internal] node-inspector port: %s", inspector.port);

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
	// jsDAV supplies its own auth, so it goes outside the session check
	launcherApp.use("/dav/", function(req, res) {
		proxylogger("%s %s -> dav", req.method, req.url);
		proxies.dav.proxy.web(req, res);
	});
	// CSS resources can be accessed without session
	launcherApp.use("/css", express.static(path.join(moduleDir, "public/css")));
	launcherApp.use(function(req, res, next) {
		if (isLoggedIn(req))
				return next();
		res.redirect(launcherPrefix + "/login");
	});
	// ---> Routes below this point require a valid session <---
	launcherApp.use("/", express.static(path.join(moduleDir, "public")));
	launcherApp.all(appPrefix, function(req, res, next) {
		// Redirect /apps to /apps. This would be better in appctrl.js
		if (req.originalUrl.slice(-1) !== "/")
			res.redirect(appPrefix.substr(1) + "/"); // "apps/"
		else next();
	});
	launcherApp.use(appPrefix, appControl(procman, TARGET_APP));
	launcherApp.use("/tty/", function(req, res) {
		proxylogger("%s %s -> tty", req.method, req.url);
		proxies.tty.proxy.web(req, res);
	});
	launcherApp.use("/help/dav", function(req, res) {
		res.render("help_dav.ejs", {
			url: cfAppEnv.url + launcherPrefix + "/dav",
			password: password
		});
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
		if (procman.get(TARGET_APP).state !== ProcessManager.State.STOP) {
			// App is running, proxy the request to it
			proxylogger("%s -> target app", req.url);
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
		var url = req._parsedUrl || nodeurl.parse(req.url),
		    url_str = nodeurl.format(url),
		    segs = url.pathname.split("/").slice(1), rootSegment = segs[0];
		if (rootSegment !== launcherPrefix) {
			proxylogger("ws request %s -> target app", url_str);
			return proxies.target.proxy.ws(req, socket, head); // not for us, send to user app
		}

		// At this point we know the request is for something in the launcher, either inspector or TTY
		var service = segs[1], destinationProxy, destProxyName;
		if (service === "ws") {
			// node-inspector makes a ws connection to "ws://[whatever]/launcher/ws?", which we catch here.
			destProxyName = "node-inspector";
			destinationProxy = proxies.inspector.proxy;
		} else if (service === "tty") {
			// Hack: we have a url like /launcher/tty/socket.io?foo but tty.js is expecting /socket.io?foo
			// so chop off the leading 2 segments and shove the result back into req.url before proxying
			// TODO try http-proxy forward or forwardPath
			proxylogger("ws request %s --> rewrite for tty", url_str);
			url.pathname = "/" + segs.slice(2).join("/");
			req._parsedUrl = url;
			req.url = nodeurl.format(url);
			destProxyName = "tty.js";
			destinationProxy = proxies.tty.proxy;
		}
		// Check login
		sessionMiddleware(req, {}, function(/*err*/) {
			if (isLoggedIn(req)) {
				proxylogger("  Auth check passed, ws %s --> %s ", req.url, destProxyName);
				return destinationProxy.ws(req, socket, head);
			}
			proxylogger("  Auth check failed, destroying ws socket: %s (%s)", req.url, req.ip);
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
