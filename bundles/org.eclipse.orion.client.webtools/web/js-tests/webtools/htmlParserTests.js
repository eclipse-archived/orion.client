/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, browser, mocha*/
/*globals Tautologistics */
define([
'webtools/htmlAstManager',
'chai/chai',
'mocha/mocha' //global export, stays last
], function(HtmlAstManager, chai) {
    /* eslint-disable no-console, missing-nls */
    var assert = chai.assert;
    var astManager = new HtmlAstManager.HtmlAstManager();
	
	function assertResults(results, expected) {
		assert(results, 'the parser did not return an AST');
		var str = JSON.stringify(results);
		assert(str, 'Failed to stringify the results');
		assert.equal(expected, str, 'The produced AST does not match the expected results.\nOutput:\n' + str + '\nExpected:\n' + expected + '\n');
	}
	
	function parse(text) {
		return astManager.parse(text);
	}


	// TODO None of the parser tests are accurate with htmlparser2 because the shape of the ast changed
	describe.skip("HTML parser tests", function() {

		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=463519
		 */
		it("parse !doctype 1", function() {
			var results = parse('<!doctype html><html></html>');
		    assertResults(results.children, 
		    	'[{"range":[0,14],"name":"!doctype","type":"instr","value":"!doctype html"}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=463519
		 */
		it("parse !doctype public... 2", function() {
			var results = parse('<!doctype PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"><html></html>');
		    assertResults(results.children, 
		    	'[{"type":"doctype","range":[9,84],"data":" PUBLIC \\"-//W3C//DTD HTML 4.01//EN\\" \\"http://www.w3.org/TR/html4/strict.dtd\\"","location":{"line":1,"col":1}}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=463519
		 */
		it("parse !doCtypE public... 3", function() {
			var results = parse('<!doCtypE PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"><html></html>');
		    assertResults(results.children, 
		    	'[{"type":"doctype","range":[9,84],"data":" PUBLIC \\"-//W3C//DTD HTML 4.01//EN\\" \\"http://www.w3.org/TR/html4/strict.dtd\\"","location":{"line":1,"col":1}}]');
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=463519
		 */
		it("parse !Doctype 4", function() {
			var results = parse('<!Doctype html><html></html>');
		    assertResults(results.children, 
		    	'[{"type":"doctype","range":[9,14],"data":" html","location":{"line":1,"col":1}}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=463519
		 */
		it("parse !DOCTYPE 5", function() {
			var results = parse('<!DOCTYPE html></html>');
		    assertResults(results.children, 
		    	'[{"type":"doctype","range":[9,14],"data":" html","location":{"line":1,"col":1}}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471382
		 * @since 10.0
		 */
		it("parse attributes 1", function() {
			var results = parse('<img src="test" alt="foo" bogus=bogus/>');
		    assertResults(results.children, 
		    	'[{"type":"tag","range":[1,38],"name":"img","location":{"line":1,"col":1},"attributes":{"src":{"value":"test","range":[5,15],"type":"attr"},"alt":{"value":"foo","range":[16,25],"type":"attr"},"bogus":{"value":"bogus","range":[26,37],"type":"attr"}}}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471382
		 * @since 10.0
		 */
		it("parse attributes 2", function() {
			var results = parse('<img src="test" alt="foo" bogus=bogus> </img>');
		    assertResults(results.children, 
		    	'[{"type":"tag","range":[1,45],"name":"img","location":{"line":1,"col":1},"attributes":{"src":{"value":"test","range":[5,15],"type":"attr"},"alt":{"value":"foo","range":[16,25],"type":"attr"},"bogus":{"value":"bogus","range":[26,37],"type":"attr"}}}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=471382
		 * @since 10.0
		 */
		it("parse attributes 3 - whitespace", function() {
			var results = parse('<img src   =    "test"    alt="foo"   \t\t\tbogus=bogus      />');
		    assertResults(results.children, 
		    	'[{"type":"tag","range":[1,59],"name":"img","location":{"line":1,"col":1},"attributes":{"src":{"value":"test","range":[5,22],"type":"attr"},"alt":{"value":"foo","range":[26,35],"type":"attr"},"bogus":{"value":"bogus","range":[41,52],"type":"attr"}}}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=483294
		 * @since 11.0
		 */
		it("Parse attribute value - text value", function() {
			var results = parse('<img src="test"/>');
		    assertResults(results.children, 
		    	'[{"type":"tag","range":[1,16],"name":"img","location":{"line":1,"col":1},"attributes":{"src":{"value":"test","range":[5,15],"type":"attr"}}}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=483294
		 * @since 11.0
		 */
		it("Parse attribute value - empty string", function() {
			var results = parse('<img src=""/>');
		    assertResults(results.children, 
		    	'[{"type":"tag","range":[1,12],"name":"img","location":{"line":1,"col":1},"attributes":{"src":{"value":"","range":[5,11],"type":"attr"}}}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=483294
		 * @since 11.0
		 */
		it("Parse attribute value - no quotes", function() {
			var results = parse('<img src=test/>');
		    assertResults(results.children, 
		    	'[{"type":"tag","range":[1,14],"name":"img","location":{"line":1,"col":1},"attributes":{"src":{"value":"test","range":[5,13],"type":"attr"}}}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=483294
		 * @since 11.0
		 * TODO Note that the lack of quotes means the tag close gets treated as the value, not optimal
		 */
		it("Parse attribute value - only equals", function() {
			var results = parse('<img src= />');
		    assertResults(results.children, 
		    	'[{"type":"tag","range":[1,5],"name":"img","location":{"line":1,"col":1},"attributes":{"src":{"value":"/>","range":[5,12],"type":"attr"}}}]'
		    );
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=483294
		 * @since 11.0
		 */
		it("Parse attribute value - no value", function() {
			var results = parse('<img src/>');
		    assertResults(results.children, 
		    	'[{"type":"tag","range":[1,9],"name":"img","location":{"line":1,"col":1},"attributes":{"src":{"value":null,"range":[5,8],"type":"attr"}}}]'
		    );
		});
		it("Parse incomplete tag open followed by tag close", function() {
			var results = parse('<html><ar</html>');
		    assertResults(results.children, 
		    	'[{"type":"tag","range":[1,9],"name":"img","location":{"line":1,"col":1},"attributes":{"src":{"value":null,"range":[5,8],"type":"attr"}}}]'
		    );
		});
		it("Parse incomplete tag open blank space", function() {
			var results = parse('<html><ar </html>');
		    assertResults(results.children, 
		    	'[{"type":"tag","range":[1,9],"name":"img","location":{"line":1,"col":1},"attributes":{"src":{"value":null,"range":[5,8],"type":"attr"}}}]'
		    );
		});
		it("Parse incomplete tag open followed by new inline tag", function() {
			var results = parse('<html><ar<a/></html>');
		    assertResults(results.children, 
		    	'[{"type":"tag","range":[1,9],"name":"img","location":{"line":1,"col":1},"attributes":{"src":{"value":null,"range":[5,8],"type":"attr"}}}]'
		    );
		});		
		it("Parse incomplete tag open followed by new tag", function() {
			var results = parse('<html><ar<a></a></html>');
		    assertResults(results.children, 
		    	'[{"type":"tag","range":[1,9],"name":"img","location":{"line":1,"col":1},"attributes":{"src":{"value":null,"range":[5,8],"type":"attr"}}}]'
		    );
		});

	});
	
	describe("HTML Recoverable Parsing Tests", function() {
		//TODO
	});
});