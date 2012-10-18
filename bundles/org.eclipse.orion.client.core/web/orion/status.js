/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - _initial API and implementation
 *******************************************************************************/
/*global define window Image */
 
define(['require', 'dojo', 'orion/globalCommands'], function(require, dojo, mGlobalCommands) {
	
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
		this._serviceRegistration = serviceRegistry.registerService("orion.page.message", this); //$NON-NLS-0$
		this._operationsClient = operationsClient;
		this.notificationContainerDomId = notificationContainerDomId;
		this.domId = domId;
		this.progressDomId = progressDomId || domId;
		this._hookedClose = false;
	}
 
	StatusReportingService.prototype = /** @lends orion.status.StatusReportingService.prototype */ {
	
		_init: function() {
			// this is a cheat, all dom ids should be passed in
			var closeButton = dojo.byId("closeNotifications"); //$NON-NLS-0$
			if (closeButton && !this._hookedClose) {
				dojo.connect(closeButton, "onclick", this, function() { //$NON-NLS-0$
					this.setProgressMessage("");
				});	
				// onClick events do not register for spans when using the keyboard
				dojo.connect(closeButton, "onkeypress", this, function(e) { //$NON-NLS-0$
					if (e.keyCode === dojo.keys.ENTER || e.keyCode === dojo.keys.SPACE) {						
						this.setProgressMessage("");
					}				
				});
			}
		},
		
		_getNotifierElements: function() {
			if (!this._notifierElements) {
				this._notifierElements = mGlobalCommands.getToolbarElements(this.notificationContainerDomId);
			}
			return this._notifierElements;
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
			if(typeof(isAccessible) === "boolean") { //$NON-NLS-0$
				var that = this;
				var node = dojo.byId(this.domId);
				// this is kind of a hack; when there is good screen reader support for aria-busy,
				// this should be done by toggling that instead
				var readSetting = dojo.attr(node, "aria-live"); //$NON-NLS-0$
				dojo.attr(node, "aria-live", isAccessible ? "polite" : "off"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				window.setTimeout(function() {
					if (msg === that.currentMessage) {
						dojo.place(window.document.createTextNode(msg), that.domId, "only"); //$NON-NLS-0$
						window.setTimeout(function() { dojo.attr(node, "aria-live", readSetting); }, 100); //$NON-NLS-0$
					}
				}, 100);
			}
			else { 
				dojo.place(window.document.createTextNode(msg), this.domId, "only");  //$NON-NLS-0$
			}
			if (typeof(timeout) === "number") { //$NON-NLS-0$
				var that = this;
				window.setTimeout(function() {
					if (msg === that.currentMessage) {
						dojo.place(window.document.createTextNode(""), that.domId, "only"); //$NON-NLS-0$
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
			var color = "red"; //$NON-NLS-0$
			if (status.Severity) {
				switch (status.Severity) {
				case "Warning": //$NON-NLS-0$
					color = "#FFCC00"; //$NON-NLS-0$
					break;
				case "Error": //$NON-NLS-0$
					color = "red"; //$NON-NLS-0$
					break;
				case "Info": //$NON-NLS-0$
				case "Ok": //$NON-NLS-0$
					color = "green"; //$NON-NLS-0$
					break;
				}
			}
			var span = dojo.create("span", {style: {color: color}});  //$NON-NLS-0$
			dojo.place(window.document.createTextNode(message), span);
			dojo.place(span, this.domId, "only"); //$NON-NLS-0$
		},
		
		/**
		 * Set a message that will be shown in the progress reporting area on the page.
		 * @param {String} message The progress message to display. 
		 */
		setProgressMessage : function(message) {
			this._init();
			this.currentMessage = message;
			var image = dojo.create("span", {"class": "imageSprite core-sprite-progress"}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.place(image, this.progressDomId, "only"); //$NON-NLS-0$
			dojo.place(window.document.createTextNode(message), this.progressDomId, "last"); //$NON-NLS-0$
			dojo.addClass(this.notificationContainerDomId, "progressNormal"); //$NON-NLS-0$
			if (message && message.length > 0) {
				dojo.addClass(this.notificationContainerDomId, "slideContainerActive"); //$NON-NLS-0$
			} else if(this._progressMonitors && this._progressMonitors.length > 0){
				return this._renderOngoingMonitors();
			}else{
				dojo.removeClass(this.notificationContainerDomId, "slideContainerActive"); //$NON-NLS-0$
			}
			mGlobalCommands.layoutToolbarElements(this._getNotifierElements());
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
			var imageClass = "imageSprite core-sprite-info"; //$NON-NLS-0$
			var extraClass = "progressInfo"; //$NON-NLS-0$
			var removedClasses = "progressWarning progressError progressNormal"; //$NON-NLS-0$
			var alt = "info"; //$NON-NLS-0$
			if (status.Severity) {
				switch (status.Severity) {
				case "Warning": //$NON-NLS-0$
					imageClass = "imageSprite core-sprite-warning"; //$NON-NLS-0$
					alt = "warning"; //$NON-NLS-0$
					extraClass="progressWarning"; //$NON-NLS-0$
					removedClasses = "progressInfo progressError progressNormal"; //$NON-NLS-0$
					break;
				case "Error": //$NON-NLS-0$
					imageClass = "imageSprite core-sprite-error"; //$NON-NLS-0$
					alt = "error"; //$NON-NLS-0$
					extraClass="progressError"; //$NON-NLS-0$
					removedClasses = "progressWarning progressInfo progressNormal"; //$NON-NLS-0$
					break;
				}
			}
			var image = dojo.create("span", {"class": imageClass}); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.place(image, this.progressDomId, "only"); //$NON-NLS-0$
			if (status.HTML) { // msg is HTML to be inserted directly
				dojo.place(msg, this.progressDomId, "last"); //$NON-NLS-0$
			} else {  // msg is plain text
				dojo.place(window.document.createTextNode("   " + msg), this.progressDomId, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			}
			if (extraClass && this.progressDomId !== this.domId) {
				dojo.addClass(this.notificationContainerDomId, extraClass);
				dojo.removeClass(this.notificationContainerDomId, removedClasses);
			}
			dojo.addClass(this.notificationContainerDomId, "slideContainerActive"); //$NON-NLS-0$
			mGlobalCommands.layoutToolbarElements(this._getNotifierElements());
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
							msg+=", "; //$NON-NLS-0$
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
