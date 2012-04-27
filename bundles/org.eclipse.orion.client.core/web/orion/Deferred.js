/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define*/

(function() {
	var global = this;
	if (!global.define) {
		global.define = function(f) {
			global.orion = global.orion || {};
			global.orion.Deferred = f();
			delete global.define;
		};
	}
}());

define(function() {
	var head, tail, remainingHead, remainingTail, running = false;

	function queueNotification(notify) {
		if (running) {
			if (!head) {
				head = {
					notify: notify,
					next: null
				};
				tail = head;
			} else {
				tail.next = {
					notify: notify,
					next: null
				};
				tail = tail.next;
			}
			return;
		}
		running = true;
		do {
			while (notify) {
				notify();
				if (remainingHead) {
					if (!head) {
						head = remainingHead;
					} else {
						tail.next = remainingHead;
					}
					tail = remainingTail;
				}
				if (head) {
					remainingHead = head.next;
					remainingTail = tail;
					notify = head.notify;
					head = tail = null;
				} else {
					notify = null;
				}
			}
			running = false;
		} while (running);
	}

	function Deferred() {
		var result, state, head, tail;

		function notify() {
			while (head) {
				var listener = head;
				head = head.next;
				var deferred = listener.deferred;
				if (listener[state]) {
					try {
						var listenerResult = listener[state](result);
						if (listenerResult && typeof listenerResult.then === "function") {
							listenerResult.then(deferred.resolve, deferred.reject, deferred.update);
							continue;
						}
						deferred.resolve(listenerResult);
					} catch (e) {
						deferred.reject(e);
					}
				} else {
					deferred[state](result);
				}
			}
			head = tail = null;
		}

		this.resolve = function(value) {
			if (state) {
				throw new Error("'" + state + "' already called");
			}
			state = "resolve";
			result = value;
			queueNotification(notify);
		};

		this.reject = function(error) {
			if (state) {
				throw new Error("'" + state + "' already called");
			}
			state = "reject";
			result = error;
			queueNotification(notify);
		};

		this.update = this.progress = this.notify = function(progress) {
			var listener = head;
			while (listener) {
				if (listener.update) {
					try {
						listener.update(progress);
					} catch (e) {}
				}
				listener = listener.next;
			}
		};

		this.then = function(onResolve, onReject, onUpdate) {
			var listener = {
				resolve: onResolve,
				reject: onReject,
				update: onUpdate,
				deferred: new Deferred()
			};
			if (head) {
				tail.next = listener;
			} else {
				head = listener;
			}
			tail = listener;
			if (state) {
				queueNotification(notify);
			}
			return listener.deferred.promise;
		};

		this.promise = {
			then: this.then
		};

		this.state = function() {
			return state || "wait";
		};
		
		this.all = function(promises, optOnError) {
			var count = promises.length, result = [], deferred = this;

			function onResolve(i, value) {
				if (!state) {
					result[i] = value;
					if (--count === 0) {
						deferred.resolve(result);
					}
				}
			}
			
			function onReject(i, error) {
				if (!state) {
					if (optOnError) {
						try {
							onResolve(i, optOnError(error)); 
							return;
						} catch (e) {
							error = e;
						}
					}
					deferred.reject(error);
				}
			}
			
			if (count === 0) {
				this.resolve(result);
			} else {
				promises.forEach(function(promise, i) {
					promise.then(onResolve.bind(null, i), onReject.bind(null, i));
				});
			}
			return this.promise;
		};
	}
	return Deferred;
});