/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var testcase = function(test, assert) {
	
var tests = {};
tests["test basic synch"] = function() {
};

tests["test basic asynch"] = function() {
	var d = new dojo.Deferred();
	setTimeout(function(){d.callback();}, 100);
	return d;
};

tests["test expected asynch failure"] = function() {
	var d = new dojo.Deferred();
	setTimeout(function(){
		try {
			assert.ok(false, "expected failure");
		} catch (e) {
			d.errback(e);			
		}
	},100);
	return d;
};
return tests;
}(orion.Test, orion.Assert);
