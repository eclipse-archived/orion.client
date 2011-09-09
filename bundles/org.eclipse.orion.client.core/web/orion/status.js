/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define window Image */
 
define(['dojo'], function(dojo) {
	
	/**
	 * Service for reporting status
	 * @class Service for reporting status
	 * @name orion.status.StatusReportingService
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 * @param {String} domId ID of the DOM node under which status will be displayed.
	 * @param {String} progressDomId ID of the DOM node used to display progress messages.
	 */
	function StatusReportingService(serviceRegistry, domId, progressDomId) {
		this._serviceRegistry = serviceRegistry;
		this._serviceRegistration = serviceRegistry.registerService("orion.page.message", this);
		this.domId = domId;
		this.progressDomId = progressDomId || domId;
	}
 
	StatusReportingService.prototype = /** @lends orion.status.StatusReportingService.prototype */ {
		/**
		 * Displays a status message to the user.
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
		 * Displays an error message to the user.
		 *
		 * @param {String|dojoError|orionError} st The error to display. Can be a simple String,
		 * or an error object from a dojo XHR error callback, or the body of an error response 
		 * from the Orion server.
		 */
		setErrorMessage : function(st) {
			//could be: responseText from xhrGet, dojo deferred error object, or plain string
			var status = st.responseText || st.message || st;
			//accept either a string or a JSON representation of an IStatus
			try {
				status = JSON.parse(status);
			} catch(error) {
				//it is not JSON, just continue;
			}
			var message = status.Message || status;
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
		 * Set a message that will be shown in the progress reporting area on the page.
		 * @param {String} message The progress message to display. 
		 */
		setProgressMessage : function(message) {
			dojo.place(window.document.createTextNode(message), this.progressDomId, "only");
		},
		
		/**
		 * Set a message that indicates that a long-running (progress) task is complete.
		 * @param {String|dojoError|orionError} message The error to display. Can be a simple String,
		 * or an error object from a dojo XHR error callback, or the body of an error response 
		 * from the Orion server.
		 */
		setProgressResult : function(message) {
			//could either be responseText from xhrGet or just a string
			var status = message.responseText || message;
			//accept either a string or a JSON representation of an IStatus
			try {
				status = JSON.parse(status);
			} catch(error) {
				//it is not JSON, just continue;
			}
			var msg = status.Message || status;
			var src = "/images/info.gif";
			var alt = "info";
			if (status.Severity) {
				switch (status.Severity) {
				case "Warning":
					src = "/images/warning.gif";
					alt = "warning";
					break;
				case "Error":
					src = "/images/error.gif";
					alt = "error";
					break;
				}
			}
			var image = new Image();
			image.alt = alt;
			image.title = "Press to clear message";
			image.name = alt;
			image.src = src;
			dojo.style(image, "opacity", "0.7");
			dojo.connect(image, "onmouseover", this, function() {
				dojo.style(image, "opacity", "1");
			});
			dojo.connect(image, "onmouseout", this, function() {
				dojo.style(image, "opacity", "0.7");
			});
			dojo.connect(image, "onclick", this, function() {
				this.setProgressMessage("");
			});
			dojo.place(image, this.progressDomId, "only");
			if (status.HTML) { // msg is HTML to be inserted directly
				dojo.place(msg, this.progressDomId, "last");
			} else {  // msg is plain text
				dojo.place(window.document.createTextNode("   " + msg), this.progressDomId, "last");
			}
		},
		
		/**
		 * Shows a progress message until the given deferred is resolved. Returns a deferred that resolves when
		 * the operation completes.
		 */
		showWhile: function(deferred, message) {
			var that = this;
			that.setProgressMessage(message);
			return deferred.then(function(result) {
				//see if we are dealing with a progress resource
				if (result && result.Location && result.Message && result.Running) {
					return that._doProgressWhile(result);
				}
				//clear the progress message
				that.setProgressMessage("");
				// if there is a result, show it.
				if (result && result.Result) {
					that.setProgressResult(result.Result);
				}
				//return the final result so it is available to caller's deferred chain
				return result;
			});
		},
	
		/**
		 * Helper method used to implement showWhile.
		 * @private
		 */	
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
	StatusReportingService.prototype.constructor = StatusReportingService;
	//return module exports
	return {StatusReportingService: StatusReportingService};
});