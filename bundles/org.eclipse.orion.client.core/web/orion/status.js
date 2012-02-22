/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - _initial API and implementation
 *******************************************************************************/
/*global define window Image */
 
define(['require', 'dojo', 'orion/util'], function(require, dojo, mUtil) {
	
	/**
	 * Service for reporting status
	 * @class Service for reporting status
	 * @name orion.status.StatusReportingService
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 * @param {orion.operationclient.OperationsClient} operationsClient
	 * @param {String} domId ID of the DOM node under which status will be displayed.
	 * @param {String} progressDomId ID of the DOM node used to display progress messages.
	 */
	function StatusReportingService(serviceRegistry, operationsClient, domId, progressDomId, notificationContainerDomId) {
		this._serviceRegistry = serviceRegistry;
		this._serviceRegistration = serviceRegistry.registerService("orion.page.message", this);
		this._operationsClient = operationsClient;
		this.notificationContainerDomId = notificationContainerDomId;
		this.domId = domId;
		this.progressDomId = progressDomId || domId;
		this._hookedClose = false;
	}
 
	StatusReportingService.prototype = /** @lends orion.status.StatusReportingService.prototype */ {
	
		_init: function() {
			// this is a cheat, all dom ids should be passed in
			var closeButton = dojo.byId("closeNotifications");
			if (closeButton && !this._hookedClose) {
				dojo.connect(closeButton, "onclick", this, function() {
					this.setProgressMessage("");
					dojo.removeClass(this.notificationContainerDomId, "slideContainerActive");
				});	
				// onClick events do not register for spans when using the keyboard
				dojo.connect(closeButton, "onkeypress", this, function(e) {
					if (e.keyCode === dojo.keys.ENTER || e.keyCode === dojo.keys.SPACE) {						
						this.setProgressMessage("");
						dojo.removeClass(this.notificationContainerDomId, "slideContainerActive");
					}				
				});
			}
		},
		/**
		 * Displays a status message to the user.
		 * @param {String} msg Message to display.
		 * @param [Number] timeout Optional time to display the message before hiding it.
		 */
		setMessage : function(msg, timeout) {
			this._init();
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
			this._init();
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
			this._init();
			var image = dojo.create("span", {"class": "imageSprite core-sprite-progress"});
			dojo.place(image, this.progressDomId, "only");
			dojo.place(window.document.createTextNode(message), this.progressDomId, "last");
			dojo.addClass(this.notificationContainerDomId, "progressNormal");
			if (message.length > 0) {
				dojo.addClass(this.notificationContainerDomId, "slideContainerActive");
			} else {
				dojo.removeClass(this.notificationContainerDomId, "slideContainerActive");
			}
			mUtil.forceLayout(this.notificationContainerDomId);
		},
		
		/**
		 * Set a message that indicates that a long-running (progress) operation is complete.
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
			this._init();
			var msg = status.Message || status;
			var imageClass = "imageSprite core-sprite-info";
			var extraClass = "progressInfo";
			var removedClasses = "progressWarning progressError progressNormal";
			var alt = "info";
			if (status.Severity) {
				switch (status.Severity) {
				case "Warning":
					imageClass = "imageSprite core-sprite-warning";
					alt = "warning";
					extraClass="progressWarning";
					removedClasses = "progressInfo progressError progressNormal";
					break;
				case "Error":
					imageClass = "imageSprite core-sprite-error";
					alt = "error";
					extraClass="progressError";
					removedClasses = "progressWarning progressInfo progressNormal";
					break;
				}
			}
			var image = dojo.create("span", {"class": imageClass});
			dojo.place(image, this.progressDomId, "only");
			if (status.HTML) { // msg is HTML to be inserted directly
				dojo.place(msg, this.progressDomId, "last");
			} else {  // msg is plain text
				dojo.place(window.document.createTextNode("   " + msg), this.progressDomId, "last");
				if (extraClass && this.progressDomId !== this.domId) {
					dojo.addClass(this.notificationContainerDomId, extraClass);
					dojo.removeClass(this.notificationContainerDomId, removedClasses);
				}
			}
			dojo.addClass(this.notificationContainerDomId, "slideContainerActive");
			mUtil.forceLayout(this.notificationContainerDomId);
		},
		
		/**
		 * Shows a progress message until the given deferred is resolved. Returns a deferred that resolves when
		 * the operation completes.
		 * 
		 * @Deprecated use orion.page.progress showWhile method with the same signature
		 */
		showWhile: function(deferred, message) {
			var that = this;
			that.setProgressMessage(message);
			return deferred.then(function(result) {
				//see if we are dealing with a progress resource
				if (result && result.Location && result.Message && result.Running) {
					return dojo.hitch(that, that._doProgressWhile)(result);
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
			var that = this;
			//sleep for awhile before we get more progress
			window.setTimeout(function() {
				that._operationsClient.getOperation(progress.Location).then(function(jsonData, ioArgs) {
						//jsonData is either the final result or a progress resource
						deferred.callback(jsonData);
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