/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var testcase = function(assert) {
	
var tests = {};
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
	setTimeout(function(){d.callback();}, 100);
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
					d.errback(e);			
				}
			},100);
			return d;
		}
	};
	var newTest = orion.Test.newTest();
	// by adding a dummy listener we avoid the error from useConsole() which is added if there are no listeners
	newTest.addEventListener("testDone", function() {});	
	
	return newTest.run(failureTest).then(function(failures) {
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
	assert.deepEqual(orion.Test.list(listTests), ["test 1", "test obj.test2"]);
};
return tests;
}(orion.Assert);
