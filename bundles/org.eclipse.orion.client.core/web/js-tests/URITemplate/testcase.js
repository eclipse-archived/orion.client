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
/*global define */


define(["orion/assert", "orion/URITemplate"], function(assert, URITemplate) {
	var tests = {};
	
	var variables = {
		dom: "example.com",
		dub: "me/too",
		hello: "Hello World!",
		half: "50%",
		"var": "value",
		who: "fred",
		base: "http://example.com/home/",
		path: "/foo/bar",
		list: ["red", "green", "blue" ],
		keys: {"semi":";","dot":".","comma":","},
		v: "6",
		x: "1024",
		y: "768",
		empty: "",
		empty_keys: {},
		undef: null
	};
	
	tests.testLiteralTemplate = function() {
		assert.equal(new URITemplate("test").expand(variables),"test");
		assert.equal(new URITemplate("Hello World!").expand(variables), "Hello%20World!");
	};
	
	tests.testSimpleStringExpansion = function() {
		assert.equal(new URITemplate("{var}").expand(variables), "value");
		assert.equal(new URITemplate("{hello}").expand(variables), "Hello%20World%21");
		assert.equal(new URITemplate("{half}").expand(variables), "50%25");
		assert.equal(new URITemplate("O{empty}X").expand(variables), "OX");
		assert.equal(new URITemplate("O{undef}X").expand(variables), "OX");
		assert.equal(new URITemplate("{x,y}").expand(variables), "1024,768");
		assert.equal(new URITemplate("{x,hello,y}").expand(variables), "1024,Hello%20World%21,768");
		assert.equal(new URITemplate("?{x,empty}").expand(variables), "?1024,");
		assert.equal(new URITemplate("?{x,undef}").expand(variables), "?1024");
		assert.equal(new URITemplate("?{undef,y}").expand(variables), "?768");
		assert.equal(new URITemplate("{var:3}").expand(variables), "val");
		assert.equal(new URITemplate("{var:30}").expand(variables), "value");
		assert.equal(new URITemplate("{list}").expand(variables), "red,green,blue");
		assert.equal(new URITemplate("{list*}").expand(variables), "red,green,blue");
		assert.equal(new URITemplate("{keys}").expand(variables), "semi,%3B,dot,.,comma,%2C");
		assert.equal(new URITemplate("{keys*}").expand(variables), "semi=%3B,dot=.,comma=%2C");
	};
	
	
	
	return tests;
});
