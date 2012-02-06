/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define setTimeout*/

define(["orion/assert","dojo", "orion/test"], function(assert, dojo, mTest) {
	
var tests = {};
// dummy change
tests["test basic synch"] = function() {
};

tests["test subtest"] = {
		"test sub1" : function() {
		},
		"test sub2" : function() {
		}
};

tests["test basic asynch"] = function() {
	var d = new dojo.Deferred();
	setTimeout(function(){
		d.resolve();
	}, 100);
	return d;
};

tests["test expected asynch failure"] = function() {
	
	var failureTest = {
		"test Failure": function() {
			var d = new dojo.Deferred();
			setTimeout(function(){
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
	newTest.addEventListener("testDone", function(name, obj) {
		if (obj.result === false) {
			failures++;
		}
	});
	newTest.useLocal = true;
	
	return newTest.run(failureTest).then(function() {
		assert.equal(failures, 1);
	});
};

tests["test basic list"] = function() {
	var listTests = {
		"test 1": function() {
		},
		"test obj": {
			"test2": function() {
			}
		}	
	};
	assert.deepEqual(mTest.list(listTests), ["test 1", "test obj.test2"]);
};

tests["test blow stack with promise"] = function() {
	var first = new dojo.Deferred(),
		d = first, i, recurses = 0, max = 1500;
	function returnPromise() {
		recurses++;
		return first;
	}
	for (i = 0; i < max; i++) {
		d = d.then(returnPromise);
	}
	first.resolve();
	
	return d.then(function() {
		assert.equal(first.fired, 0);
		assert.ok(max === recurses, "Stack blown at " + recurses + " recurses.");
	});
};

tests["test blow stack with value"] = function() {
	var first = new dojo.Deferred(),
		d = first, i, recurses = 0, max = 1500;
	
	function returnValue() {
		recurses++;
		return 1;
	}

	for (i = 0; i < max; i++) {
		d = d.then(returnValue);
	}
	first.resolve();
	
	return d.then(function() {
		assert.equal(first.fired, 0);
		assert.ok(max === recurses, "Stack blown at " + recurses + " recurses.");
	});
};

tests["test blow stack with exception"] = function() {
	var first = new dojo.Deferred(),
		d = first, i, recurses = 0, max = 1500;
	
	dojo.config.deferredOnError = function(){};
	try {
		function throwException() {
			recurses++;
			throw "exception";
		}
	
		for (i = 0; i < max; i++) {
			d = d.then(throwException, throwException);
		}
	
		first.resolve();
	} finally {
		delete dojo.config.deferredOnError;
	}
	
	return d.then(function(){
		assert.ok(false, "Expected an exception");
	}, function() {
		assert.equal(first.fired, 0);
		assert.ok(max === recurses, "Stack blown at " + recurses + " recurses.");
	});
};
return tests;
});
