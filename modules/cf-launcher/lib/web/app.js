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
    path = require("path"),
    appControl = require("./appctl"),
    Auth = require("./auth"),
    dav = require("./dav"),
    logger = require("../logger"),
    authlogger = logger("auth"),
    proxylogger = logger("proxy"),
    ProcessManager = require("../proc"),
    ProxyManager = require("./proxy"),
    tty = require("./tty"),
    util = require("../util");

var TARGET_APP = "target";

var moduleDir = path.join(__dirname, "..", "..");

function startProcesses(appCommand, label, port_app, port_debug) {
	var procman = new ProcessManager();
	// Chose DEBUG state here for initial launch, it's less confusing than DEBUG_BREAK
	procman.startApp(TARGET_APP, appCommand, label, port_app, ProcessManager.State.DEBUG);
	procman.startDebugger("debugger", port_debug);
	return procman;
}

function createProxyApp(options) {
	util.checker(options)
		.array("appCommand")
//		.string("appName")
		.string("urlPrefix")
		.string("password")
		.numbery("port");

	var appCommand = options.appCommand,
	    launcherPrefix = "/" + options.urlPrefix,
	    password = options.password,
	    port = options.port;

	logger("Application command line: %s", appCommand);
	logger("VCAP_APP_PORT: %s", port);
	logger("Launcher URL prefix: %s", launcherPrefix);
	logger();

	// ===================================================================
	// Create auth & session management
	var isAuthenticated = Auth.isAuthenticated,
	    realm = "cf-launcher (username is 'vcap')",
	    auth = Auth({ password: password, realm: realm });

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
	var davServer = dav.createServer({
			port: proxies.dav.port,
			password: password,
			authBackend: auth.digestBackend,
			realm: realm,
	});
	logger("[Internal] Application port: %s", target.port);
	logger("[Internal] node-inspector port: %s", inspector.port);

	// ===================================================================
	var launcherApp = express.Router(), appPrefix = "/apps";
	launcherApp.use(bodyParser());
	launcherApp.use(auth); // Middleware to lookup auth status
	launcherApp.post("/login", function(req, res) {
		if (req.body.password === password) {
			authlogger("Successful login from: %s", req.ip);
			auth.setClientSession(req, true);
			res.redirect(launcherPrefix);
		} else {
			authlogger("Failed login attempt from: %s", req.ip);
			req.flash("error", "Incorrect password.");
			res.redirect("login");
		}
	});
	launcherApp.get("/login", function(req, res) {
		if (isAuthenticated(req, res)) {
			return res.redirect(launcherPrefix);
		}
		res.render("login", { error: req.flash().error });
	});
	launcherApp.get("/logout", function(req, res) {
		authlogger("Logout %s", req.ip);
		auth.setClientSession(req, false);
		res.redirect("login");
	});
	// jsDAV supplies its own auth strategy, so it goes outside the session check
	launcherApp.use("/dav/", function(req, res) {
		proxylogger("%s %s -> dav", req.method, req.url);
		proxies.dav.proxy.web(req, res);
	});
	// CSS resources can be accessed without session
	launcherApp.use("/css", express.static(path.join(moduleDir, "public/css")));
	launcherApp.use(function(req, res, next) {
		if (isAuthenticated(req))
				return next();
		// If it's a request for the cf-launcher root, redirect to login page, otherwise 401
		if (req.url === "/")
			res.redirect(launcherPrefix + "/login");
		else
			res.status(401).send("Unauthorized");
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
		logger: proxylogger,
		serverApp: app,
		processManager: procman,
		authMiddleware: auth,
		isAuthenticated: isAuthenticated,
	};
}

module.exports = createProxyApp;
