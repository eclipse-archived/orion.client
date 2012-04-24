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
		 * @param [Boolean] isAccessible Optional, if <code>true</code>, a screen reader will read this message.
		 * Otherwise defaults to the domNode default.
		 */
		setMessage : function(msg, timeout, isAccessible) {
			this._init();
			this.currentMessage = msg;
			if(typeof(isAccessible) === "boolean") {
				var that = this;
				var node = dojo.byId(this.domId);
				// this is kind of a hack; when there is good screen reader support for aria-busy,
				// this should be done by toggling that instead
				var readSetting = dojo.attr(node, "aria-live");
				dojo.attr(node, "aria-live", isAccessible ? "polite" : "off");
				window.setTimeout(function() { dojo.place(window.document.createTextNode(msg), that.domId, "only"); }, 100);
				window.setTimeout(function() { dojo.attr(node, "aria-live", readSetting); }, 200);
			}
			else { 
				dojo.place(window.document.createTextNode(msg), this.domId, "only"); 
			}
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
			this.currentMessage = st;
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
			this.currentMessage = message;
			var image = dojo.create("span", {"class": "imageSprite core-sprite-progress"});
			dojo.place(image, this.progressDomId, "only");
			dojo.place(window.document.createTextNode(message), this.progressDomId, "last");
			dojo.addClass(this.notificationContainerDomId, "progressNormal");
			if (message && message.length > 0) {
				dojo.addClass(this.notificationContainerDomId, "slideContainerActive");
			} else if(this._progressMonitors && this._progressMonitors.length > 0){
				this._renderOngoingMonitors();
			}else{
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
			this.currentMessage = message;
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
		 * Shows a progress message until the given deferred is resolved.
		 */
		showWhile: function(deferred, message) {
			var that = this;
			if(message){
				that.setProgressMessage(message);
				deferred.addBoth(function(){
					if(message === that.currentMessage){
						that.setProgressMessage("");		
					}
				});
			}
			return deferred;
		},
		
		_lastProgressId: 0,
		_progressMonitors: {length: 0},
		
		/**
		 * Creates a ProgressMonitor that will be displayed on the status area.
		 * @param {dojo.Deferred} deferred [optional] that updates this monitor
		 * @param {String} message [optional] messaged to be shown until deferred is not resolved
		 * @returns {ProgressMonitor}
		 */
		createProgressMonitor: function(deferred, message){
			return new ProgressMonitor(this, ++this._lastProgressId, deferred, message);
		},
		
		_renderOngoingMonitors: function(){
			if(this._progressMonitors.length > 0){
				var msg = "";
				var isFirst = true;
				for(var progressMonitorId in this._progressMonitors){
					if(this._progressMonitors[progressMonitorId].status){
						if(!isFirst)
							msg+=", ";
						msg+=this._progressMonitors[progressMonitorId].status;
						isFirst = false;
					}
				}
				this.setProgressMessage(msg);
			} else {
				this.setProgressMessage("");
			}
		},
		
		_beginProgressMonitor: function(monitor){
			this._progressMonitors[monitor.progressId] = monitor;
			this._progressMonitors.length++;
			this._renderOngoingMonitors();
		},
		
		_workedProgressMonitor: function(monitor){
			this._progressMonitors[monitor.progressId] = monitor;
			this._renderOngoingMonitors();
		},
		
		_doneProgressMonitor: function(monitor){
			delete this._progressMonitors[monitor.progressId];
			this._progressMonitors.length--;
			if(monitor.status){
				this.setProgressResult(monitor.status);
			}else{				
				this._renderOngoingMonitors();
			}
		}
		
	};
	StatusReportingService.prototype.constructor = StatusReportingService;
	
	function ProgressMonitor(statusService, progressId, deferred, message){
		this.statusService = statusService;
		this.progressId = progressId;
		if(deferred){
			this.deferred = deferred;
			this.begin(message);
			var that = this;
			deferred.then(
					function(response, secondArg){
						dojo.hitch(that, that.done)();
					},
					function(error, secondArg){
						dojo.hitch(that, that.done)();
					});
		}
	}
	
	ProgressMonitor.prototype = new dojo.Deferred();
	
	/**
	 * Starts the progress monitor. Message will be shown in the status area.
	 * @param {String} message
	 */
	ProgressMonitor.prototype.begin = function(message){
				this.status = message;
				this.statusService._beginProgressMonitor(this);
			};
	/**
	 * Sets the progress monitor as done. If no status is provided the message will be
	 * removed from the status.
	 * @param {String|dojoError|orionError} status [optional] The error to display. Can be a simple String,
	 * or an error object from a dojo XHR error callback, or the body of an error response 
	 * from the Orion server.
	 */
	ProgressMonitor.prototype.done = function(status){
				this.status = status;
				this.statusService._doneProgressMonitor(this);
				this.callback(status);
			};
	/**
	 * Changes the message in the monitor.
	 * @param {String} message
	 */
	ProgressMonitor.prototype.worked = function(message){
				this.status = message;
				this.statusService._workedProgressMonitor(this);
			};
	
	ProgressMonitor.prototype.constructor = ProgressMonitor;

	//return module exports
	return {StatusReportingService: StatusReportingService,
			ProgressMonitor: ProgressMonitor};
});