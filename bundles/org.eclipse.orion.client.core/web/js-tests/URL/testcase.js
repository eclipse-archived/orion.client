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
/*global define document URL*/


define(["orion/assert", "orion/URL-shim", "domReady!"], function(assert) {
	var tests = {};
	
	tests.testSpecificationURL = function() {
		var spec = "http://dvcs.w3.org/hg/url/raw-file/tip/Overview.html";
		var url = new URL(spec);
		assert.equal(url.href, spec);
		assert.equal(url.origin, "http://dvcs.w3.org");
		assert.equal(url.protocol, "http:");
		assert.equal(url.host, "dvcs.w3.org");
		assert.equal(url.hostname, "dvcs.w3.org");
		assert.equal(url.port, "");
		assert.equal(url.pathname, "/hg/url/raw-file/tip/Overview.html");
		assert.equal(url.search, "");
		assert.equal(url.hash, "");
	};
	
	tests.testExampleURL = function() {
		var spec = "http://www.example.com/a/b/c.html?p=q&r=s&p&p=t#hash";
		var url = new URL(spec);
		assert.equal(url.href, spec);
		assert.equal(url.origin, "http://www.example.com");
		assert.equal(url.protocol, "http:");
		assert.equal(url.host, "www.example.com");
		assert.equal(url.hostname, "www.example.com");
		assert.equal(url.port, "");
		assert.equal(url.pathname, "/a/b/c.html");
		assert.equal(url.search, "?p=q&r=s&p&p=t");
		assert.equal(url.hash, "#hash");
	};
	
	return tests;
});
