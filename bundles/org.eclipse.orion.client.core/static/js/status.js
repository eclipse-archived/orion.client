/*******************************************************************************
 * Copyright (c) 2009, 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
 
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
		dojo.place(document.createTextNode(msg), this.domId, "only");
		if (typeof(timeout) === "number") {
			var that = this;
			setTimeout(function() {
				var node = dojo.byId(that.domId);
				var text = typeof(node.textContent) === "string" ? node.textContent : node.innerText;
				if (text === msg) {
					dojo.place(document.createTextNode(""), that.domId, "only");
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
		dojo.place(document.createTextNode(message), span);
		dojo.place(span, this.domId, "only");
	}
};
	