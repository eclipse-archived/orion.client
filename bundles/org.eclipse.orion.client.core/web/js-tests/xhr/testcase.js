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

/*global define setTimeout XMLHttpRequest*/
define(["orion/assert", "orion/test", "orion/testHelpers", "orion/Deferred", "orion/xhr", "orion/textview/eventTarget"],
		function(assert, mTest, testHelpers, Deferred, xhr, mEventTarget) {
	var EventTarget = mEventTarget.EventTarget;
	var getTimeoutable = testHelpers.getTimeoutable;
	/**
	 * Fake version of XMLHttpRequest for testing without actual network accesses.
	 */
	function MockXMLHttpRequest() {
		this.readyState = 0;
		this.headers = {};
	}
	MockXMLHttpRequest.prototype = {
		UNSENT: 0,
		OPENED: 1,
		HEADERS_RECEIVED: 2,
		LOADING: 3,
		DONE: 4,
		open: function() {
			if (this.readyState !== this.UNSENT) {
				throw new Error('open called out of order');
			}
			this._setReadyState(this.OPENED);
		},
		send: function() {
			if (this.readyState !== this.OPENED) {
				throw new Error('send called out of order');
			}
		},
		setRequestHeader: function(name, value) {
			if (this.readyState !== this.OPENED) {
				throw new Error('setRequestHeader called out of order');
			}
			this.headers[name] = value;
		},
		_getRequestHeaders: function() {
			return this.headers;
		},
		_setReadyState: function(value) {
			this.readyState = value;
			if (typeof this.onreadystatechange === 'function') {
				this.onreadystatechange();
			}
		},
		_setResponse: function(response) {
			this.response = response;
			if (typeof response === 'string') {
				this.responseText = response;
			}
		},
		_setStatus: function(status) {
			this.status = status;
		},
		_fakeComplete: function(status, response) {
			this._setStatus(status);
			this._setResponse(response);
			this._setReadyState(this.DONE);
		},
		_fakeTimeout: function(err) {
			this.dispatchEvent({type: 'timeout'});
		}
	};
	EventTarget.addMixin(MockXMLHttpRequest.prototype);

	/** A mock XHR request that succeeds. */
	function OkXhr() {
		MockXMLHttpRequest.apply(this, Array.prototype.slice.call(arguments));
		this.send = function() {
			var self = this;
			setTimeout(function() {
				self._fakeComplete(200, 'success!');
			}, 75);
		};
	}
	OkXhr.prototype = new MockXMLHttpRequest();

	/** A mock XHR request that 404s. */
	function FailXhr() {
		MockXMLHttpRequest.apply(this, Array.prototype.slice.call(arguments));
		this.send = function() {
			var self = this;
			setTimeout(function() {
				self._fakeComplete(404, 'i failed');
			}, 100);
		};
	}
	FailXhr.prototype = new MockXMLHttpRequest();

	function succeed(result) {
		var d = new Deferred();
		d.resolve.apply(d, Array.prototype.slice.call(arguments));
		return d;
	}

	function fail(err) {
		var d = new Deferred();
		d.reject.apply(d, Array.prototype.slice.call(arguments));
		return d;
	}

	var tests = {};
	tests['test GET resolve'] = getTimeoutable(function() {
		return xhr('GET', '/', null, new OkXhr()).then(succeed, fail);
	});

	tests['test GET reject'] = getTimeoutable(function() {
		return xhr('GET', '/bogus/url/that/doesnt/exist', null, new FailXhr()).then(fail, succeed);
	});

	tests['test timeout causes reject'] = getTimeoutable(function() {
		var timeoutingXhr = new OkXhr();
		timeoutingXhr.send = function() {
			var self = this;
			setTimeout(function() {
				self._fakeTimeout();
			}, 50);
		};
		return xhr('GET', '/', {
				timeout: 25 // the value is not important here
			}, timeoutingXhr).then(fail, succeed);
	});

	tests['test resolve value has expected shape'] = getTimeoutable(function() {
		return xhr('GET', '/foo', {
				data: 'my request body',
				headers: {'X-Foo': 'bar'},
				log: true,
				query: {param: 'value'},
				responseType: 'text',
				timeout: 1500
			}, new OkXhr())
			.then(function(result) {
				assert.ok(!!result.args);
				assert.equal(result.args.data, 'my request body');
				assert.equal(result.args.headers['X-Foo'], 'bar');
				assert.equal(result.args.log, true);
				assert.ok(!!result.args.query);
				assert.equal(result.args.query.param, 'value');
				assert.equal(result.args.responseType, 'text');
				assert.equal(result.args.timeout, 1500);
				assert.equal(result.status, 200);
				assert.equal(result.responseText, 'success!');
				assert.equal(result.response, 'success!');
				assert.ok(result.xhr instanceof MockXMLHttpRequest);
			}, fail);
	});

	tests['test reject value has expected shape'] = getTimeoutable(function() {
		return xhr('GET', '/bar', {
				data: 'my request body',
				headers: {'X-Foo': 'bar'},
				log: false,
				query: {param: 'value'},
				responseType: 'text',
				timeout: 1500
			}, new FailXhr())
			.then(fail, function(result) {
				assert.ok(!!result.args);
				assert.equal(result.args.data, 'my request body');
				assert.equal(result.args.headers['X-Foo'], 'bar');
				assert.equal(result.args.log, false);
				assert.ok(!!result.args.query);
				assert.equal(result.args.query.param, 'value');
				assert.equal(result.args.responseType, 'text');
				assert.equal(result.args.timeout, 1500);
				assert.ok(result.xhr instanceof MockXMLHttpRequest);
			});
	});

	tests['test \'X-Requested-With\' is set'] = getTimeoutable(function() {
		var d = new Deferred();
		var headerCheckerXhr = new MockXMLHttpRequest();
		headerCheckerXhr.send = function() {
			var headers = this._getRequestHeaders();
			if (headers['X-Requested-With'] === 'XMLHttpRequest') {
				d.resolve();
			} else {
				d.reject();
			}
			this._fakeComplete(200, 'OK');
		};
		xhr('GET', '/', null, headerCheckerXhr);
		return d;
	});

	tests['test GET query params'] = getTimeoutable(function() {
		return xhr('GET', '/', {
			query: {
				'foo': 3,
				'bar': 'baz'
			}
		}, new OkXhr())
		.then(function(result) {
			assert.strictEqual(result.url, '/?foo=3&bar=baz', null);
		}, fail);
	});

	tests['test GET query params encoding'] = getTimeoutable(function() {
		return xhr('GET', '/', {
			query: {
				'foo!bar': 31337,
				'baz': 'fizz buzz'
			}
		}, new OkXhr())
		.then(function(result) {
			assert.strictEqual(result.url, '/?foo%21bar=31337&baz=fizz%20buzz', null);
		}, fail);
	});

	tests['test GET query params with fragment'] = getTimeoutable(function() {
		return xhr('GET', '/#some?junk&we?dont&care?about', {
			query: {
				'foo*bar': 'baz',
				'quux': 'a b'
			}
		}, new OkXhr())
		.then(function(result) {
			assert.strictEqual(result.url, '/?foo%2Abar=baz&quux=a%20b#some?junk&we?dont&care?about', null);
		}, fail);
	});

	tests['test GET query params with existing params and fragment'] = getTimeoutable(function() {
		return xhr('GET', '/?a%20=b#some?junk&we?dont&care?about', {
			query: {
				'foo*bar': 'baz'
			}
		}, new OkXhr())
		.then(function(result) {
			assert.strictEqual(result.url, '/?a%20=b&foo%2Abar=baz#some?junk&we?dont&care?about', null);
		}, fail);
	});

	tests['test GET with headers'] = getTimeoutable(function() {
		return xhr('GET', '/', {
			headers: {
				'X-Foo-Bar': 'baz'
			}
		}, new OkXhr())
		.then(succeed, fail);
	});

	tests['test open() exception causes reject'] = getTimeoutable(function() {
		var alreadyOpenXhr = new OkXhr();
		alreadyOpenXhr.open('GET', '/foo');
		// Since request is already OPEN the next call to open() will throw, and xhr should catch & reject
		return xhr('GET', '/bar', null, alreadyOpenXhr).then(fail, succeed);
	});

return tests;
});