/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global exports module process require*/
/*jslint devel:true forin:true*/
var child_process = require('child_process');
var events = require('events'), EventEmitter = events.EventEmitter;
var path = require('path');
var util = require('util');
var url = require('url');

var api = require('./api');
var fileUtil = require('./fileUtil');

var PATH_TO_NODE = process.execPath;
var PATH_TO_NODE_INSPECTOR = 'node-inspector/bin/inspector';
var INSPECT_PORT = 8900;

/**
 * @name orionode.App
 * @class
 */
/**
 * @name orionode.App#exit
 * @event
 */
/**
 * @name orionode.App#stdout
 * @event
 */
/**
 * @name orionode.App#stderr
 * @event
 */
var App = function(pid, proc, hidden) {
	EventEmitter.call(this);
	this.pid = pid;
	this.process = proc;
	this.hidden = typeof hidden === 'undefined' ? false : !!hidden;
	proc.on('exit', this.emit.bind(this, 'exit'));
	proc.stdout.on('data', this.emit.bind(this, 'stdout'));
	proc.stderr.on('data', this.emit.bind(this, 'stderr'));
};
util.inherits(App, EventEmitter);
/** @returns {Object} */
App.prototype.toJson = function() {
	var json = {
		Id: this.pid
	};
	var app = this;
	this.decorators.forEach(function(decorator) {
		decorator.call(null, app, json);
	});
	return json;
};
App.prototype.decorators = [
	function debugDecorator(app, json) {
		if (app.debug) {
			json.DebugURL = app.debug;
		}
	}
];

/**
 * @name orionode.AppTable
 * @class
 */
var AppTable = function() {
	this.map = Object.create(null);
};
AppTable.prototype = /** @lends orionode.AppTable.prototype */ {
	/** @returns {orionode.App} */
	get: function(/**String*/ pid) {
		return this.map[pid] || null;
	},
	put: function(/**String*/ pid, /**orionode.App*/ app) {
		if (this.map[pid]) {
			throw new Error('pid in use: ' + pid);
		}
		this.map[pid] = app;
	},
	/** @returns {orionode.App} */
	remove: function(/**String*/ pid) {
		if (!Object.prototype.hasOwnProperty.call(this.map, pid)) {
			return false;
		}
		var app = this.map[pid];
		delete this.map[pid];
		return app;
	},
	/** @returns {orionode.App[]} */
	apps: function(includeHidden) {
		var map = this.map;
		var values = [];
		for (var prop in map) {
			var app = map[prop];
			if (!app.hidden || includeHidden) {
				values.push(map[prop]);
			}
		}
		return values;
	}
};

function spawnNode(args, options) {
	args = Array.isArray(args) ? args : null;
	options = options || {};
	var child = child_process.spawn(PATH_TO_NODE, args, options);
	child.on('error', function(e) {
		console.log('PID ' + child.pid + ' error: ' + e);
	});
	return child;
}

/**
 * @name orionode.AppContext
 * @class
 */
var AppContext = function(options) {
//	function checkArgs(args) {	
//		if (args && !Array.isArray(args)) {
//			throw new Error('Parameter "args" must be an array, or omitted');
//		}
//		return true;
//	}

	/** @throws {Error} If modulePath is unsafe */
	function resolveModulePath(fileRoot, workspaceDir, modulePath) {
		var filePath = api.rest(fileRoot, modulePath);
		return fileUtil.safeFilePath(workspaceDir, filePath);
	}

	var fileRoot = options.fileRoot, workspaceDir = options.workspaceDir;
	if (!fileRoot || !workspaceDir) {
		throw new Error('Missing fileRoot or workspaceDir');
	}
	var inspector = null;

	/**
	 * @name orionode.AppContext#appTable
	 * @type orionode.AppTable
	 */
	var appTable = new AppTable();
	Object.defineProperty(this, 'appTable', {
		get: function() { return appTable; }
	});

	/**
	 * @param {String[]} [args]
	 * @param {String} cwd
	 * @param {Boolean} [hidden=false]
	 */
	var _startApp = function(args, cwd, hidden) {
		hidden = typeof hidden === 'boolean' ? hidden : false;
		var app;
		try {
			var proc = spawnNode(args, {cwd: cwd});
			app = new App(proc.pid, proc, hidden);
			appTable.put(proc.pid, app);
			app.on('exit', function() {
				appTable.remove(proc.pid);
			});
			return app;
		} catch (e) {
			console.log(e.stack || e);
			this.stopApp(app);
			throw e;
		}
	};
	/**
	 * @function
	 * @private
	 */
	var _startInspectorApp = function(args, cwd, headers, requestUrl, restartOnExit){
		var app;
		try {
			app = _startApp(args, cwd, true /*hidden*/);
			var parsedRequestUrl = url.parse(requestUrl);
			app.inspect = url.format({
				protocol: parsedRequestUrl.protocol,
				host: headers.host,
				pathname: parsedRequestUrl.pathname + 'node-inspector/' + app.pid
			});
			app.on('exit', function() {
				console.log('Exit inspector, PID: ' + app.pid);
				if(restartOnExit){
					_startInspectorApp(args, cwd, headers, requestUrl, restartOnExit);
				}
			});
			console.log('Started inspector, PID: ' + app.pid);
			return app;
		} catch (e) {
			console.log(e.stack || e);
			this.stopApp(app);
			return null;
		}
	}.bind(this);
	/**
	 * @name orionode.AppContext#startApp
	 * @function
	 * @param {String} modulePath The Orionode-filesystem path (ie. starting with '/file') of the module to execute
	 * @param {Array} [args]
	 * @param {Boolean} [hidden]
	 */
	this.startApp = function(modulePath, args, hidden) {
		modulePath = resolveModulePath(fileRoot, workspaceDir, modulePath);
		// TODO cwd should be passed in, not assumed to be the module's parent folder.
		var app = _startApp([modulePath].concat(args || []), path.dirname(modulePath), hidden);
		app.on('exit', function(code) {
			console.log('App # ' + app.pid + ' exited, code=' + code);
		});
		return app;
	};
	/**
	 * @name orion.AppContext#debugApp
	 * @param {String} modulePath
	 * @param {Number} port
	 */
	this.debugApp = function(modulePath, port, headers, requestUrl) {
		var resolvedPath = resolveModulePath(fileRoot, workspaceDir, modulePath);
		// TODO cwd should be passed in, not assumed to be the module's parent folder.
		var app = _startApp(["--debug-brk=" + port, resolvedPath], path.dirname(resolvedPath));
		var parsedRequestUrl = url.parse(requestUrl);
		app.debug = url.format({
			protocol: parsedRequestUrl.protocol,
			// TODO this is bizarre. Can we host node-inspector on the same port as Orionode?
			hostname: url.parse('http://' + headers.host).hostname,
			port:  INSPECT_PORT,
			pathname: url.resolve(parsedRequestUrl.pathname, '../../debug?port=' + port)
		});
		//Lazy spawn the node inspector procees for the first time when user wants to debug an app.
		if(app && !inspector) {
			var inspectorPath = require.resolve(PATH_TO_NODE_INSPECTOR);
			inspector = _startInspectorApp([inspectorPath, "--web-port=" + INSPECT_PORT], path.dirname(inspectorPath), headers, requestUrl, true);
		}
		return app;
	}.bind(this);
	/**
	 * @name orionode.AppContext#stopApp
	 * @function
	 * @param {orionode.App} app
	 */
	this.stopApp = function(app) {
		if (app) {
			appTable.remove(app.pid);
			app.process.kill();
			return app;
		}
		return null;
	};
};

exports.AppContext = AppContext;
exports.App = App;
