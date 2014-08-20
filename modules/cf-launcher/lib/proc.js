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
var child_process = require("child_process"),
    EventEmitter = require("events").EventEmitter,
    nodeutil = require("util"),
    streamtailer = require("./streamtailer"),
    util = require("./util");

var CHILD_ERR = "[%s] error: %s",
    CHILD_EXIT_CODE = "[%s] exited with code: %s",
    CHILD_EXIT_SIGNAL = "[%s] exited due to signal: %s";

var State = {
	STOP: "stop",
	RUN: "run",
	DEBUG: "debug",
	DEBUG_BREAK: "debugbreak",
};
Object.defineProperty(State, "fromString", {
	enumerable: false,
	value: function(s) {
		var found;
		Object.keys(State).some(function(key) {
			if (State[key] === s)
				return !!(found = s);
			return false;
		});
		return found;
	}
});

function ProcessInfo(name, proc, launchFn, state) {
	this.name = name;
	this.proc = proc;
	this.launchFn = launchFn;
	this._state = state;
	this.tailer = null;
}
util.extend(ProcessInfo.prototype, {
	get process() {
		return this.proc;
	},
	set process(proc) {
		this.proc = proc;
	},
	get state() {
		return this._state;
	},
	set state(value) {
		this._state = value;
	},
	setOutputStreams: function(stdout, stderr) {
		this.tailer = streamtailer();
		stdout.pipe(this.tailer);
		stderr.pipe(this.tailer);
	},
	getTail: function() {
		return this.tailer ? this.tailer.getLines() : null;
	}
});

function ProcessManager() {
	this.map = Object.create(null); // name -> ProcessInfo

	var _self = this;
	process.on("exit", function() {
		// child processes probably exit automatically when the parent dies, but just in case..
		_self.shutdown = true;
		Object.keys(_self.map).forEach(_self._kill.bind(_self));
	});
}
nodeutil.inherits(ProcessManager, EventEmitter);
ProcessManager.State = State;
util.extend(ProcessManager.prototype, {
	/**
	 * @param {String} name
	 * @param {ChildProcess} proc
	 * @param {Function} launchFn A function that can restart the process in a given State. Invoked as launchFn(state)
	 * @param {State} [state=RUN]
	 */
	_put: function(name, proc, launchFn, state) {
		state = state || State.RUN;
		if (!name || !proc || !launchFn)
			throw new Error("missing param");
		var info = this.map[name];
		if (!info) {
			info = this.map[name] = new ProcessInfo(name, proc, launchFn, state);
		}
		info.process = proc;
		info.state = state;
		return info;
	},
	_kill: function(name) {
		var info = this.get(name);
		try {
			info.process.kill();
		} catch (err) {
			util.log("Error killing %s: %s", name, err);
		}
	},
	/**
	 * @returns {ProcessInfo}
	 */
	get: function(name) {
		return this.map[name] || null;
	},
	/**
	 * @param {Object} [options]
	 * @param {boolean} [state]
	 * @param {Function} callback
	 */
	changeState: function(name, newState, callback) {
		var asyncCallback = function(opt_err) {
			process.nextTick(callback.bind(null, opt_err));
		};
		var info = this.get(name);
		if (!info) {
			asyncCallback(new Error("Not found:" + name));
			return;
		} else if (!(State.fromString(newState))) {
			asyncCallback(new Error("Invalid state: " + newState));
			return;
		}
		var relaunch = function() {
			if (newState === State.STOP) {
				asyncCallback();
				return;
			}
			try {
				info.launchFn(newState);
				asyncCallback();
			} catch (e) {
				asyncCallback(e);
			}
		}.bind(this);
		var state = info.state;
		if (state === newState) {
			asyncCallback();
		} else if (state === State.STOP) { // already stopped
			relaunch();
		} else { // stop, then relaunch in the desired state
			this._kill(name);
			info.process.once("exit", relaunch);
		}
	},
	/**
	 * Start the user app in debug mode.
	 * @param {String}   name Name to refer to app by.
	 * @param {String[]} args Command that launches the application. (eg. ["grunt"], ["node", "foo.js"])
	 * @param {Number}   port The VCAP_APP_PORT that the app should listen on.
	 * @param {Object}   options Options that may change across different invocations.
	 * @param {Boolean}  options.state DEBUG | DEBUG_BREAK
	 */
	startApp: function(name, args, port, state) {
		if (state !== State.DEBUG && state !== State.DEBUG_BREAK)
			throw new Error(nodeutil.format("Only states %s, %s are allowed for apps.", State.DEBUG, State.DEBUG_BREAK));
		args = args.slice();
		if (typeof args === "string")
			args = args.trim().split(/\s+/);
		if (args[0] === "node")
			args.shift();
		var isBreak = state === State.DEBUG_BREAK;
		args.unshift(isBreak ? "--debug-brk" : "--debug");

		var childenv = util.extend({}, process.env);
		childenv.PORT = childenv.VCAP_APP_PORT = port;
		var childopts = {
			env: childenv,
			stdio: ["ignore", "pipe", "pipe"]
		};

		var launchFn = this.startApp.bind(this, name, args.slice(1) /*omit --debug*/, port);
		var procInfo = this._spawn("node", args, childopts, name, launchFn, state);
		var child = procInfo.process;
		isBreak && util.log("[%s] stopped at breakpoint. Visit debugger to continue.", name);

		procInfo.setOutputStreams(child.stdout, child.stderr);
		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);
	},
	/**
	 * Forks node inspector. We use the node<->node message channel.
	 * @param {String} name Name to refer to debugger process by.
	 * @param {Number} port Web port the debugger will listen on
	 */
	startDebugger: function(name, port) {
		var args = ["--web-port=" + port, "--debug-port=" + util.V8_DEBUG_PORT];
		var childopts = {
			silent: true, // what does this even do
		};
		var launchFn = this.startDebugger.bind(this, name, port);
		var procInfo = this._fork(inspectorPath(), args, childopts, name, launchFn, State.RUN);
		var child = procInfo.process;
		// TODO perhaps node-inspector process should be persistent. If killed && !shutdown, launch it again.

		var _self = this;
		child.on("message", function(msg) {
			switch (msg.event) {
				case "SERVER.LISTENING":
					util.log("[%s] is listening.", name);
					_self.emit("debuggerListening");
					break;
				case "SERVER.ERROR":
					var err = msg.error;
					if (err.code === "EADDRINUSE") {
						util.log("[%s] Failed to start because web-port %s is already in use", name, port);
					} else {
						util.log("[%s] Failed to start. Error: %s", name, err.message || err);
					}
				break;
			}
		});
	},
	_spawn: function(/*command, args, options, name, launchFn, state*/) {
		return this._spork.apply(this, ["spawn"].concat(Array.prototype.slice.call(arguments)));
	},
	_fork: function(/*command, args, options, name, launchFn, state*/) {
		return this._spork.apply(this, ["fork"].concat(Array.prototype.slice.call(arguments)));
	},
	/**
	 * spawn or fork
	 * @param {String} method fork|spawn
	 */
	_spork: function(method, command, args, options, name, launchFn, state) {
		if (!child_process[method])
			throw new Error("Bad method " + method);
		util.log("[%s] starting %s %s", name, command, args.join(" "));
		var child = child_process[method].call(child_process, command, args, options);
		var info = this._put(name, child, launchFn, state);
		child.on("error", function(err) {
			util.log(CHILD_ERR, name, err);
		});
		child.once("exit", function(code, signal) {
			info.process = null;
			info.state = State.STOP;
			if (typeof code === "number")
				util.log(CHILD_EXIT_CODE, name, code);
			else
				util.log(CHILD_EXIT_SIGNAL, name, signal);
		}.bind(this));
		return info;
	}
});

function inspectorPath() {
	return require.resolve("node-inspector/bin/inspector");
}

module.exports = ProcessManager;