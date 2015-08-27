/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, browser*/
/* eslint-disable missing-nls */
define([
], function() {

	/**
	 * @description Create a new instance of the worker
	 * @param {String} script The URL to load
	 * @param {Function} onMessage The default onmessage callback
	 * @param {Function} onError The default onerror callback
	 * @returns {WrappedWorker} A new WrappedWorker instance
	 * @since 10.0
	 */
	function WrappedWorker(script, onMessage, onError) {
		/*if(typeof(SharedWorker) === 'function') {
			this.shared = true;
			var wUrl = new URL(script, window.location.href);
			wUrl.query.set("worker-language", navigator.language);
			this.worker = new SharedWorker(wUrl.href);
			this.worker.port.onmessage = onMessage;
			this.worker.port.onerror = onError;
			this.worker.port.start();
			this.worker.port.postMessage('');
			this.messageId = 0;
    		this.callbacks = Object.create(null);
    		this._state;
		} else { */
 			var wUrl = new URL(script, window.location.href);
    		this.worker = new Worker(wUrl.href);
    		this.worker.onmessage = onMessage.bind(this);
    		this.worker.onerror = onError.bind(this);
    		this.worker.postMessage('start_server'); //$NON-NLS-1$
    		this.messageId = 0;
    		this.callbacks = Object.create(null);
    		this._state;
    	//}
	}

	/**
	 * @name WrappedWorker.prototype.postMessage
	 * @description Wraps the default postMessage function from the underlying worker to allow 
	 * IDs to be added to the messages
	 * @function
	 * @param {Object} msg The message to send
	 * @param {Function} f The callback function to call when the Tern server responds
	 */
	WrappedWorker.prototype.postMessage = function(msg, f) {
		if(msg != null && typeof(msg) === 'object') {
			if(typeof(msg.messageID) !== 'number') {
				//don't overwrite an id from a tern-side request
				msg.messageID = this.messageId++;
				this.callbacks[msg.messageID] = f;
			}
		}
		if(this.shared) {
			this.worker.port.postMessage(msg);
		} else {
			this.worker.postMessage(msg);
		}
	};
	
	/**
	 * @name WrappedWorker.prototype.terminate
	 * @description Stops the underlying worker
	 * @function
	 */
	WrappedWorker.prototype.terminate = function() {
		this.worker.terminate();
	};
	
	/**
	 * @name WrappedWorker.prototype.setTestState
	 * @description Sets the test state, must be called per test to ensure the correct state is being tested
	 * @function
	 * @param {Object} state The state for the worker to use per test
	 */
	WrappedWorker.prototype.setTestState = function(state) {
		this._state = state;
	};
	
	return {
		instance: function instance() {
			var _instance = new WrappedWorker('../../javascript/plugins/ternWorker.js',
				function(ev) {
					if(typeof(ev.data) === 'object') {
						var _d = ev.data;
						var id  = _d.messageID;
						var f = _instance.callbacks[id];
						if(typeof(f) === 'function') {
							f(_d);
							delete _instance.callbacks[id];
						} else if(_d.request === 'read') {
							_instance.postMessage({request: 'read', messageID: _d.messageID, args: {contents: _instance._state.buffer, file: _instance._state.file}});
						} else if(typeof(_d.request) === 'string') {
							//don't process requests other than the ones we want
							return;
						} else if(_d.error) {
							var err = _d.error;
							if(err instanceof Error) {
								_instance._state.callback(err);
							} else if(typeof(err) === 'string') {
								if(typeof(_d.message) === 'string') {
									_instance._state.callback(new Error(err+": "+_d.message));
								} else {
									//wrap it
									_instance._state.callback(new Error(err));
								}
							} else if(err && typeof(err.message) === 'string') {
								_instance._state.callback(new Error(err.message));
							}
						}
						else {
							_instance._state.callback(new Error('Got message I don\'t know'));
						}
					} else if(typeof(ev.data) === 'string' && ev.data === 'server_ready' && _instance._state.warmup) {
						delete _instance._state.warmup;
						_instance._state.callback();
					}
				}.bind(this),
				function(err) {
					if(err instanceof Error) {
						_instance._state.callback(err);
					} else if(typeof(err) === 'string') {
						//wrap it
						_instance._state.callback(new Error(err));
					} else if(err && typeof(err.message) === 'string') {
						_instance._state.callback(new Error(err.message));
					}
				});
			return _instance;
		}
	};
});