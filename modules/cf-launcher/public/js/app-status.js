/*eslint-env browser */
/*eslint no-unused-params:0 */
/*global $ */

// @returns A Promise resolving with the parsed application
function appxhr(method, url, appData) {
	if (appData) {
		appData = JSON.stringify(appData);
	}
	return $.ajax(url, {
		type: method,
		contentType: "application/json",
		data: appData,
		processData: false, // don't do any query-string hackery with body
	}).then(function(result, state, xhr) {
		var text = xhr.responseText, app = parseApp(text);
		return app || new $.Deferred().reject(new Error(text)).promise();
	});
}

// @returns A Promise that resolves after the specified number of ms
function wait(ms) {
	var d = new $.Deferred();
	setTimeout(d.resolve.bind(d), ms);
	return d.promise();
}

function parseApp(responseText) {
	try {
		return JSON.parse(responseText);
	} catch (e) {
		return null;
	}
}

function clone(app) {
	return JSON.parse(JSON.stringify(app));
}

function log() {
	if (typeof console !== "undefined")
		console.log.apply(console, arguments);
}

function replaceSubtree(node, messages) {
	function processNodes(node, replace) {
		if (node.nodeType === 3) { // TEXT_NODE
			var matches = /\$\{([^\}]+)\}/.exec(node.nodeValue);
			if (matches && matches.length > 1) {
				replace(node, matches);
			}
		}
		if (node.hasChildNodes()) {
			for (var i=0; i<node.childNodes.length; i++) {
				processNodes(node.childNodes[i], replace);
			}
		}
	}
	processNodes(node, function(targetNode, matches) {
		var replaceText = messages[matches[1]] || matches[1];
		targetNode.parentNode.replaceChild(document.createTextNode(replaceText), targetNode);
	});
}

var control = {
	app: null,
	breakOnStart: false,
	get: function(name) {
		name = name || "";
		return this._withapp(appxhr("GET", "apps/" + encodeURIComponent(name)));
	},
	stop: function() {
		return this._changeState("stop");
	},
	debug: function(breakOnStart) {
		return this._changeState(breakOnStart ? "debugbreak" : "debug");
	},
	_changeState: function(newState) {
		var app = clone(this.app);
		app.state = newState;
		delete app.tail; // don't bother sending the log back to the server
		var putxhr = appxhr("PUT", "apps/" + encodeURIComponent(app.name), app);
		var _self = this;
		return this._withapp(putxhr).then(function(app) {
			if (app.state === "stop")
				return app;
			// (re)starting app. There's often important output that happens shortly after launch. To capture
			// that, wait for a bit, fetch the app again, then resolve.
			return wait(2000).then(function() {
				return _self.get(app.name);
			});
		});
	},
	_withapp: function(appxhr) {
		var _self = this;
		return appxhr.then(function(app) {
			_self.app = app;
			return app;
		});
	},
};

var view = {
	render: function() {
		var panel = $("#app-status-panel");
		var app = control.app,
		    isDebugging = (app.state === "debug" || app.state === "debugbreak"),
		    template = isDebugging ? $("#template-debug") : $("#template-stop"),
		    status = template[0].cloneNode(true /*deep*/); // Element
		replaceSubtree(status, {
			name: app.name
		});
		panel.empty().append(status);

		var tail = $("#logtail");
		var oldtail = tail.text(), newtail = app.tail.join("\n");
		if (oldtail !== newtail)
			tail.text(newtail);
		view.bind(); 
	},
	renderErr: function(err) {
		$("#app-status-panel").text(err && err.toString());
	},
	renderProgress: function(msg) {
		$("#app-status-panel").text("\u23F0 " + msg);
		$("#log-panel")[0].classList.add("hide");
	},
	bind: function() {
		var panel = $("#app-status-panel");
		// TODO prevent multiple clicks
		$("#btn-stop", panel).unbind().click(function() {
			control.stop().then(view.render.bind(view));
		});
		$("#btn-start, #btn-restart", panel).unbind().click(function() {
			var dialog = $("#startPrompt").modal("show");
			$("#btn-break, #btn-no-break").unbind().click(function(e) {
				control.breakOnStart = /^btn-break/.test(e.target.id);
			});
			dialog.unbind("hide.bs.modal").on("hide.bs.modal", function() {
				log("starting app, --debug-brk: " + control.breakOnStart);
				view.renderProgress("Starting...");
				control.debug(control.breakOnStart).then(view.render.bind(view));
			});
		});
	}
};

function init() {
	function refresh() {
		return control.get().then(view.render, view.renderErr);
	}

//	function tick() {
//		refresh().then(function() {
//			setTimeout(tick, 10000);
//		});
//	}
//	tick();
	refresh();
}

document.addEventListener("DOMContentLoaded", init);
