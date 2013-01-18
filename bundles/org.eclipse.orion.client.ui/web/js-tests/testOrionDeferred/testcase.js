/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define setTimeout console*/

define(["orion/assert", "orion/test", "orion/Deferred"], function(assert, mTest, Deferred) {

	var tests = {};
	// dummy change
	tests["test basic synch"] = function() {};

	tests["test subtest"] = {
		"test sub1": function() {},
		"test sub2": function() {}
	};

	tests["test basic asynch"] = function() {
		var d = new Deferred();
		setTimeout(function() {
			assert.ok(true);
			d.resolve();
		}, 100);
		return d;
	};

	tests["test expected asynch failure"] = function() {

		var failureTest = {
			"test Failure": function() {
				var d = new Deferred();
				setTimeout(function() {
					try {
						assert.ok(false, "expected failure");
					} catch (e) {
						d.reject(e);
					}
				}, 100);
				return d;
			}
		};
		var newTest = new mTest.Test();
		// by adding a dummy listener we avoid the error from useConsole() which is added if there are no listeners
		var failures = 0;
		newTest.addEventListener("testDone", function(event) {
			if (event.result === false) {
				failures++;
			}
		});
		newTest.useLocal = true;

		return newTest.run(failureTest).then(function() {
			assert.equal(failures, 1);
		});
	};

	tests["test basic asynch2"] = function() {
		var d = new Deferred();
		setTimeout(function() {
			d.resolve();
		}, 100);
		return d.then(function() {
			assert.ok(true);
		});
	};

	tests["test expected asynch2 failure"] = function() {
		var d = new Deferred();
		setTimeout(function() {
			d.resolve();
		}, 100);
		return d.then(function() {
			throw "expected";
		}).then(function() {
			assert.ok(false); // unexpected, should be an error
		}, function() {
			assert.ok(true); // expected, catch the error and continue
		});
	};

	tests["test basic list"] = function() {
		var listTests = {
			"test 1": function() {},
			"test obj": {
				"test2": function() {}
			}
		};
		assert.deepEqual(mTest.list(listTests), ["test 1", "test obj.test2"]);
	};

	tests["test blow stack with promise"] = function() {
		var first = new Deferred(),
			d = first,
			i, recurses = 0,
			max = 2000;

		function returnPromise() {
			recurses++;
			return first;
		}
		for (i = 0; i < max; i++) {
			d = d.then(returnPromise);
		}
		first.resolve();

		return d.then(function() {
			assert.ok(max === recurses, "Stack blown at " + recurses + " recurses.");
		});
	};

	tests["test blow stack with value"] = function() {
		var first = new Deferred(),
			d = first,
			i, recurses = 0,
			max = 2000;

		function returnValue() {
			recurses++;
			return 1;
		}

		for (i = 0; i < max; i++) {
			d = d.then(returnValue);
		}
		first.resolve();

		return d.then(function() {
			assert.ok(max === recurses, "Stack blown at " + recurses + " recurses.");
		});
	};

	tests["test blow stack with exception"] = function() {
		var first = new Deferred(),
			d = first,
			i, recurses = 0,
			max = 2000;

		function throwException() {
			recurses++;
			throw "exception";
		}

		for (i = 0; i < max; i++) {
			d = d.then(null, throwException);
		}

		first.reject();

		return d.then(function() {
			assert.ok(false, "Expected an exception");
		}, function() {
			assert.ok(max === recurses, "Stack blown at " + recurses + " recurses.");
		});
	};

	tests["test cancel a"] = function() {
		var a = new Deferred();
		var result = a.promise.then(function() {
			return assert.ok(false, "Expected an exception");
		}, function() {
			// expected
		});
		a.promise.cancel();
		return result;
	};

	tests["test cancel result"] = function() {
		var a = new Deferred();
		var test = a.promise.then(function() {
			return assert.ok(false, "Expected an exception");
		}, function() {
			a.resolve();
		});
		test.cancel();
		return a.promise;
	};
	
	tests["test cancel parent"] = function() {
		var parent = new Deferred();
		
		var test = parent.then(function() {
			return assert.ok(false, "Expected an exception");
		}, function() {
			// expected
		});
		
		var testCancel = test.cancel;
		test.cancel = function() {
			parent.cancel();
			testCancel();
		};
		test.cancel();
		return parent.then(function() {
			return assert.ok(false, "Expected an exception");
		}, function() {
			// expected
		});
	};
	
	tests["test cancel parent"] = function() {
		var assumed = new Deferred();
		var a = new Deferred();
		var test = a.then(function() {
			return assumed;
		});
		a.resolve().then(function() {
			test.cancel();
		});
		return assumed.then(function() {
			return assert.ok(false, "Expected an exception");
		}, function() {
			// expected
		});
	};




	return tests;
});