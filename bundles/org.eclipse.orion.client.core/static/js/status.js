/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global dojo window */
 
/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * Service for reporting status
 * @class Service for reporting status
 * @param {eclipse.ServiceRegistry} serviceRegistry
 * @param {String} domId ID of the DOM node under which status will be displayed.
 */
eclipse.StatusReportingService = function(serviceRegistry, domId) {
	this._serviceRegistry = serviceRegistry;
	this._serviceRegistration = serviceRegistry.registerService("IStatusReporter", this);
	this.domId = domId;
};
 
eclipse.StatusReportingService.prototype = {
	/**
	 * @param {String} msg Message to display.
	 * @param [Number] timeout Optional time to display the message before hiding it.
	 */
	setMessage : function(msg, timeout) {
		dojo.place(window.document.createTextNode(msg), this.domId, "only");
		if (typeof(timeout) === "number") {
			var that = this;
			window.setTimeout(function() {
				var node = dojo.byId(that.domId);
				var text = typeof(node.textContent) === "string" ? node.textContent : node.innerText;
				if (text === msg) {
					dojo.place(window.document.createTextNode(""), that.domId, "only");
				}
			}, timeout);
		}
	},

	/**
	 * @param {String|dojoError|orionError} st The error to display. Can be a simple String,
	 * or an error object from a dojo XHR error callback, or the body of an error response 
	 * from the Orion server.
	 */
	setErrorMessage : function(st) {
		//could either be responseText from xhrGet or just a string
		var status = st.responseText || st;
		//accept either a string or a JSON representation of an IStatus
		try {
			status = JSON.parse(status);
		} catch(error) {
			//it is not JSON, just continue;
		}
		var message = status.message || status;
		var color = "red";
		if (status.Severity) {
			switch (status.Severity) {
			case "Warning":
				color = "#FFCC00";
				break;
			case "Error":
				color = "red";
				break;
			case "Info":
			case "Ok":
				color = "green";
				break;
			}
		}
		var span = dojo.create("span", {style: {color: color}}); 
		dojo.place(window.document.createTextNode(message), span);
		dojo.place(span, this.domId, "only");
	},
	
		/**
	 * Shows a progress message until the given deferred is resolved. Returns a deferred that resolves when
	 * the operation completes.
	 */
	showWhile: function(deferred, message) {
		var that = this;
		that.setMessage(message);
		return deferred.then(function(result) {
			//see if we are dealing with a progress resource
			if (result && result.Location && result.Message && result.Running) {
				return that._doProgressWhile(result);
			}
			//otherwise just return the result
			that.setMessage("");
			return result;
		});
	},
	
	_doProgressWhile: function(progress) {
		var deferred = new dojo.Deferred();
		//sleep for awhile before we get more progress
		window.setTimeout(function() {
			dojo.xhrGet({
				url: progress.Location,
				headers: { "Orion-Version" : "1"},
				handleAs: "json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					//jsonData is either the final result or a progress resource
					deferred.callback(jsonData);
				}
			});
		}, 2000);
		//recurse until operation completes
		return this.showWhile(deferred, progress.Message);
	}

};
	