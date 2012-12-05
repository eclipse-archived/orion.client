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
/*global exports module define*/
(function(root, factory) { // UMD
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.orion = root.orion || {};
		root.orion.Deferred = factory();
	}
}(this, function() {
	var head, tail, remainingHead, remainingTail, running = false;

	function enqueue(fn) {
		if (running) {
			if (!head) {
				head = {
					fn: fn,
					next: null
				};
				tail = head;
			} else {
				tail.next = {
					fn: fn,
					next: null
				};
				tail = tail.next;
			}
			return;
		}
		running = true;
		do {
			while (fn) {
				fn();
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
					fn = head.fn;
					head = tail = null;
				} else {
					fn = null;
				}
			}
			running = false;
		} while (running);
	}

	function noReturn(fn) {
		return function() {
			fn.apply(null, arguments);
		};
	}


	/**
	 * @name orion.Promise
	 * @class Interface representing an eventual value.
	 * @description Promise is an interface that represents an eventual value returned from the single completion of an operation.
	 *
	 * <p>For a concrete class that provides Promise-based APIs, see {@link orion.Deferred}.</p>
	 * @see orion.Deferred#promise
	 * @see orion.Deferred
	 */
	/**
	 * @name then
	 * @methodOf orion.Promise.prototype
	 * @description Adds handlers to be called on fulfillment or progress of this promise.
	 * @param {Function} [onResolve] Called when this promise is resolved.
	 * @param {Function} [onReject] Called when this promise is rejected.
	 * @param {Function} [onProgress] May be called to report progress events on this promise.
	 * @returns {orion.Promise} A new promise that is fulfilled when the given onResolve or onReject callback is finished.
	 * The callback's return value gives the fulfillment value of the returned promise.
	 */

	/**
	 * @name orion.Deferred
	 * @borrows orion.Promise#then as #then
	 * @class Provides abstraction over asynchronous operations.
	 * @description Deferred provides abstraction over asynchronous operations.
	 *
	 * <p>Because Deferred implements the {@link orion.Promise} interface, a Deferred may be used anywhere a Promise is called for.
	 * However, in most such cases it is recommended to use the Deferred's {@link #promise} field instead, which exposes a read-only
	 * interface to callers.</p>
	 * @param {Function} [optOnCancel] Will be invoked if the Deferred is canceled. The <code>optOnCancel</code> function is invoked
	 * passing the reason the Deferred was canceled (or a new <code>Error</code> if no reason was provided).
	 */
	function Deferred(optOnCancel) {
		var result, state, head, tail, canceled = false,
			_this = this;

		function notify() {
			while (head) {
				var listener = head;
				head = head.next;
				var deferred = listener.deferred;
				var methodName = _this.isResolved() ? "resolve" : "reject"; //$NON-NLS-0$ $NON-NLS-1$
				if (listener[methodName]) {
					try {
						var listenerResult = listener[methodName](result);
						if (listenerResult && typeof listenerResult.then === "function") { //$NON-NLS-0$
							listener.cancel = listenerResult.cancel;
							listenerResult.then(noReturn(deferred.resolve), noReturn(deferred.reject), deferred.progress);
							continue;
						}
						deferred.resolve(listenerResult);
					} catch (e) {
						deferred.reject(e);
					}
				} else {
					deferred[methodName](result);
				}
			}
			head = tail = null;
		}

		function checkFulfilled(strict) {
			if (state) {
				if (strict) {
					throw new Error("already " + state); //$NON-NLS-0$
				}
				return true;
			}
			return false;
		}

		/**
		 * Rejects this Deferred.
		 * @name reject
		 * @methodOf orion.Deferred.prototype
		 * @param {Object} error
		 * @param {Boolean} [strict]
		 * @returns {orion.Promise}
		 */
		this.reject = function(error, strict) {
			if (!checkFulfilled(strict)) {
				state = "rejected"; //$NON-NLS-0$
				result = error;
				if (head) {
					enqueue(notify);
				}
			}
			return _this.promise;
		};

		/**
		 * Resolves this Deferred.
		 * @name resolve
		 * @methodOf orion.Deferred.prototype
		 * @param {Object} value
		 * @param {Boolean} [strict]
		 * @returns {orion.Promise}
		 */
		this.resolve = function(value, strict) {
			if (!checkFulfilled(strict)) {
				state = "resolved"; //$NON-NLS-0$
				result = value;
				if (head) {
					enqueue(notify);
				}
			}
			return _this.promise;
		};

		/**
		 * Notifies listeners of progress on this Deferred.
		 * @name progress
		 * @methodOf orion.Deferred.prototype
		 * @param {Object} update The progress update.
		 * @param {Boolean} [strict]
		 * @returns {orion.Promise}
		 */
		this.progress = function(update, strict) {
			if (!checkFulfilled(strict)) {
				var listener = head;
				while (listener) {
					if (listener.progress) {
						listener.progress(update);
					}
					listener = listener.next;
				}
			}
			return _this.promise;
		};

		/**
		 * Cancels this Deferred.
		 * @name cancel
		 * @methodOf orion.Deferred.prototype
		 * @param {Object} reason The reason for canceling this Deferred.
		 * @param {Boolean} [strict]
		 */
		this.cancel = function(reason, strict) {
			if (!checkFulfilled(strict)) {
				canceled = true;
				if (optOnCancel) {
					reason = optOnCancel(reason) || reason;
				}
				reason = reason || new Error("canceled"); //$NON-NLS-0$
				enqueue(_this.reject.bind(_this, reason));
				return reason;
			}
			var listener = head;
			while (listener) {
				if (listener.canceling) {
					delete listener.canceling;
					notify();
					return listener.cancel && listener.cancel(reason);
				}
				listener = listener.next;
			}
		};

		this.then = function(onResolve, onReject, onProgress) {
			var listener = {
				resolve: onResolve,
				reject: onReject,
				progress: onProgress,
				cancel: this.cancel,
				deferred: new Deferred(function(reason) {
					listener.canceling = true;
					return listener.cancel && listener.cancel(reason);
				})
			};
			if (head) {
				tail.next = listener;
			} else {
				head = listener;
			}
			tail = listener;
			if (state) {
				enqueue(notify);
			}
			return listener.deferred.promise;
		};

		/**
		 * Returns whether this Deferred was resolved.
		 * @name isResolved
		 * @methodOf orion.Deferred.prototype
		 * @returns {Boolean} <code>true</code> if this Deferred was resolved, otherwise <code>false</code>.
		 */
		this.isResolved = function() {
			return state === "resolved"; //$NON-NLS-0$
		};

		/**
		 * Returns whether this Deferred was rejected.
		 * @name isRejected
		 * @methodOf orion.Deferred.prototype
		 * @returns {Boolean} <code>true</code> if this Deferred was rejected, otherwise <code>false</code>.
		 */
		this.isRejected = function() {
			return state === "rejected"; //$NON-NLS-0$
		};

		/**
		 * Returns whether this Deferred was fulfilled. A Deferred is <dfn>fulfilled</dfn> iff it was rejected or resolved.
		 * Thus, calling this method is equivalent to checking <code>deferred.isResolved() || deferred.isRejected()</code>.
		 * @name isFulfilled
		 * @methodOf orion.Deferred.prototype
		 * @returns {Boolean} <code>true</code> if this Deferred was fulfilled, otherwise <code>false</code>.
		 */
		this.isFulfilled = function() {
			return !!state;
		};

		/**
		 * Returns whether this Deferred was canceled.
		 * @name isCanceled
		 * @methodOf orion.Deferred.prototype
		 * @returns {Boolean} <code>true</code> if this Deferred was canceled, otherwise <code>false</code>.
		 */
		this.isCanceled = function() {
			return canceled;
		};

		/**
		 * The read-only promise underlying this Deferred.
		 * @name promise
		 * @fieldOf orion.Deferred.prototype
		 * @type orion.Promise
		 */
		this.promise = {
			then: this.then,
			cancel: this.cancel,
			isResolved: this.isResolved,
			isRejected: this.isRejected,
			isFulfilled: this.isFulfilled,
			isCanceled: this.isCanceled
		};

		//for jQuery compatibility
		this.notify = this.progress;
		this.state = function() {
			return state || "pending"; //$NON-NLS-0$
		};
		this.promise.state = this.state;
	}

	/**
	 * Takes multiple promises and returns a new promise that represents the outcome of all the promises.
	 * <p>When <code>all</code> is called with a single parameter, the returned promise has <dfn>eager</dfn> semantics,
	 * meaning if one of the input promises is rejected, the returned promise also rejects, without waiting for the 
	 * rest of the promises to fulfill.</p>
	 *
	 * To obtain <dfn>lazy</dfn> semantics (meaning the returned promise waits for all input promises to fulfill), pass the
	 * optional parameter <code>optOnError</code>.
	 * @name all
	 * @methodOf orion.Deferred
	 * @static
	 * @param {orion.Promise[]} promises The promises.
	 * @param {Function} [optOnError] Handles a rejected input promise. When invoked, <code>optOnError</code> is passed the reason 
	 * the input promise was rejected. The return value of this <code>optOnError</code> call serves as the value of the rejected promise.
	 * @returns {orion.Promise} A new promise. The returned promise is generally fulfilled to an <code>Array</code> whose elements
	 * give the fulfillment values of the input promises. However if an input promise is rejected and eager semantics is used, the 
	 * returned promise will instead be fulfilled to a single error value.</p>
	 */
	Deferred.all = function(promises, optOnError) {
		var count = promises.length,
			result = [],
			deferred = new Deferred(function(reason) {
				promises.forEach(function(promise) {
					if (promise.cancel) {
						promise.cancel(reason);
					}
				});
			});

		function onResolve(i, value) {
			if (!deferred.isFulfilled()) {
				result[i] = value;
				if (--count === 0) {
					deferred.resolve(result);
				}
			}
		}

		function onReject(i, error) {
			if (!deferred.isFulfilled()) {
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
			deferred.resolve(result);
		} else {
			promises.forEach(function(promise, i) {
				promise.then(onResolve.bind(null, i), onReject.bind(null, i));
			});
		}
		return deferred.promise;
	};

	/**
	 * Applies callbacks to a promise or to a regular object.
	 * @name when
	 * @methodOf orion.Deferred
	 * @static
	 * @param {Object|orion.Promise} value Either a {@link orion.Promise}, or a normal value.
	 * @param {Function} onResolve Called when the <code>value</code> promise is resolved. If <code>value</code> is not a promise,
	 * this function is called immediately.
	 * @param {Function} onReject Called when the <code>value</code> promise is rejected. If <code>value</code> is not a promise, 
	 * this function is never called.
	 * @param {Function} onProgress Called when the <code>value</code> promise provides a progress update. If <code>value</code> is
	 * not a promise, this function is never called.
	 * @returns {orion.Promise} A new promise.
	 */
	Deferred.when = function(value, onResolve, onReject, onProgress) {
		var promise, deferred;
		if (value && typeof value.then === "function") { //$NON-NLS-0$
			promise = value;
		} else {
			deferred = new Deferred();
			deferred.resolve(value);
			promise = deferred.promise;
		}
		return promise.then(onResolve, onReject, onProgress);
	};

	return Deferred;
}));