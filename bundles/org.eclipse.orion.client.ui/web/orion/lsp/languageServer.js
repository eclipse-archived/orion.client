/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/* eslint-env amd */
define([
	"orion/Deferred",
	"orion/lsp/ipc"
], function(Deferred, IPC) {
	/**
	 * @name LanguageServer
	 * @description Creates a new instance of the language server placeholder. This object wraps the server impl, 
	 * options and identifying information in one place. The functions from the underlying IPC instance are wrapped in the promise-like
	 * function and set directly on this instance
	 * @class 
	 * @param {LanguageService} service The backing language service that instantiated this server
	 * @param {String} id The optional identifier for this language server
	 * @param {String} url The URL for the location for this language server
	 * @param {?} ls The language server client side hooks
	 * @param {?} options The optional collection of options
	 * @returns {LanguageServer} Returns a new instance of LanguageServer
	 * @since 13.0
	 */
	function LanguageServer(service, id, url, options) {
		this._service = service;
		this._id = id;
		this._url = url;
		this._options = options || Object.create(null);
		this._ipc = new IPC(url, id);
		Object.keys(this._ipc).forEach(function(key) { //this mitigates having to check for own property
			if(typeof this._ipc[key] === 'function') {
				this[key] = _ipcCall(key, this._ipc);				
			}
		}, this);
		
	}
	
	/**
	 * @name _ipcCall
	 * @description Create a deferred-wrappped function call
	 * @private
	 * @param {String} method The name of the method to wrap
	 * @param {IPC} ls The protocol impl to call back to
	 * @returns {function} Returns a function wrapper for the named IPC function
	 */
	function _ipcCall(method, ls) {
		return function() {
			var d;
			try {
				var result = ls[method].apply(ls, Array.prototype.slice.call(arguments));
				if (result && typeof result.then === "function") {
					return result;
				} 
				d = new Deferred();
				d.resolve(result);
			} catch (e) {
				d = new Deferred();
				d.reject(e);
			}
			return d.promise;
		};
	}
	
	return LanguageServer;
});