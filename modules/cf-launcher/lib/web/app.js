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
    cfAppEnv = require("cfenv").getAppEnv({ protocol: "https:" }), // Always generate https: urls to ourself
    compression = require("compression"),
    express = require("express"),
    flash = require("connect-flash"),
    path = require("path"),
    appControl = require("./appctl"),
    Auth = require("./auth"),
    Cors = require("./cors"),
    dav = require("./dav"),
    Logger = require("../logger"),
    log = Logger(""), // main
    authlog = Logger("auth"),
    proxylog = Logger("proxy"),
    ProcessManager = require("../proc"),
    ProxyManager = require("./proxy"),
    tty = require("./tty");

var TARGET_APP = "target";

var moduleDir = path.join(__dirname, "..", "..");

function startProcesses(appCommand, label, port_app, port_debug) {
	var procman = new ProcessManager();
	// Chose DEBUG state here for initial launch, it's less confusing than DEBUG_BREAK
	procman.startApp(TARGET_APP, appCommand, label, port_app, ProcessManager.State.DEBUG);
	procman.startDebugger("debugger", port_debug);
	return procman;
}

function checkParams(options) {
	function fail(p) {
		throw new Error("Missing or invalid parameter: " + p);
	}

	!Array.isArray(options.appCommand)    && fail("appCommand");
	typeof options.urlPrefix !== "string" && fail("urlPrefix");
	typeof options.password !== "string"  && fail("password");
	isNaN(Number(options.port))           && fail("port");

	options.port = Number(options.port); // coerce to number
}

function createProxyApp(options) {
	checkParams(options);

	var appCommand = options.appCommand,
	    corsWhitelist = options.corsWhitelist,
	    launcherPrefix = "/" + options.urlPrefix,
	    password = options.password,
	    port = options.port;

	log("Application command line: %s", appCommand);
	log("VCAP_APP_PORT: %s", port);
	log("Launcher URL prefix: %s", launcherPrefix);
	log("CORS origins: [%s]", corsWhitelist.join(", "));
	log();

	// ===================================================================
	// Create auth & session management
	var isAuthenticated = Auth.isAuthenticated,
	    realm = "cf-launcher (username is 'vcap')",
	    auth = Auth({ password: password, realm: realm }),
	    cors = Cors({ whitelist: corsWhitelist });

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
			authBackend: auth.backend,
			realm: realm,
	});
	log("[Internal] Application port: %s", target.port);
	log("[Internal] node-inspector port: %s", inspector.port);

	// ===================================================================
	var launcherApp = express.Router(), appPrefix = "/apps";
	launcherApp.use(bodyParser());
	launcherApp.use(cors);
	launcherApp.options("*", cors); // enable pre-flight request for all routes
	launcherApp.use(auth); // Middleware to lookup auth status
	launcherApp.post("/login", function(req, res) {
		if (req.body.password === password) {
			authlog("Successful login from: %s", req.ip);
			auth.setClientSession(req, true);
			res.redirect(launcherPrefix);
		} else {
			authlog("Failed login attempt from: %s", req.ip);
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
		authlog("Logout %s", req.ip);
		auth.setClientSession(req, false);
		res.redirect("login");
	});
	// jsDAV supplies its own auth strategy, so it goes outside the session check
	launcherApp.use("/dav/", function(req, res) {
		proxylog("%s %s -> dav", req.method, req.url);
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
		// Redirect /apps to /apps/. Note that code 308 prevents clients from changing the method to GET upon
		// following the redirect. TODO This code would be better in appctrl.js.
		if (req.originalUrl.slice(-1) !== "/")
			res.redirect(308 /*permanent*/, appPrefix.substr(1) + "/"); // "apps/"
		else next();
	});
	launcherApp.use(appPrefix, appControl(procman, TARGET_APP));
	launcherApp.use("/tty/", function(req, res) {
		proxylog("%s %s -> tty", req.method, req.url);
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
			proxylog("%s -> target app", req.url);
			target.proxy.web(req, res);
		} else {
			// App not running, redirect user to launcher for convenience
			res.redirect(303, launcherPrefix);
		}
	});
	return {
		proxies: proxies,
		logger: proxylog,
		serverApp: app,
		processManager: procman,
		authMiddleware: auth,
		isAuthenticated: isAuthenticated,
	};
}

module.exports = createProxyApp;
