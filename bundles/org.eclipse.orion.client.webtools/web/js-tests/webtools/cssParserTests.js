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
/* eslint-disable no-console, missing-nls*/
define([
'chai/chai',
'csslint/csslint',
'webtools/cssValidator',
'mocha/mocha' //global export, stays last
], function(chai, CSSLint, cssValidator) {
    
    var assert = chai.assert;

    /**
	 * @description Write out the 'tokens' and 'errors' arrays for a given AST.
	 * Add this code to the AST managers' getAST() function to produce the test data from a target workspace
	 * @param {Object} ast The AST
	 */
	function writeTestData(ast) {
		var i = 0;
		console.log('--- TEST OUTPUT ---');
		var expected = [];
		var s = 'tokens: ';
		expected = [];
		for(i = 0; i < ast.tokens.length; i++) {
			var n = {};
			var token = ast.tokens[i];
			n.type = token.type;
			n.range = token.range;
			n.value = token.value;
			expected.push(n);
		}
		s += JSON.stringify(expected);
		s += ',\n\t\t\t\tmessages: ';
		expected = [];
		for(i = 0; i < ast.messages.length; i++) {
			var message = ast.messages[i];
			expected.push({
				message: message.message,
				line: message.line,
				col: message.col,
				type: message.type
			});
		}
		s += JSON.stringify(expected);
		console.log(s);
	}
	
	function assertResults(results, expected) {
	    var e = expected.tokens;
	    var r = results.tokens;
	    assert(e, 'There must be tokens to test');
	    assert(r, 'The parser must have returned tokens');
	    assert.equal(e.length, r.length, 'The same number of tokens was not returned as expected');
	    for(var i = 0; i < e.length; i++) {
	        var et = e[i];
	        var rt = r[i];
	        assert.equal(rt.type, et.type, 'The token types do not match');
	        assert.equal(rt.value, et.value, 'the token values do not match');
	        assert.equal(rt.range[0], et.range[0], 'The start range of the tokens do not match');
	        assert.equal(rt.range[1], et.range[1], 'The end range of the tokens do not match');
	    }
	    e = expected.messages;
	    r = results.messages;
	    assert(e, 'There must be messages to test or an empty array');
	    assert(r, 'The parser must have returned messages or an empty array');
	    assert.equal(e.length, r.length, 'The same number of messages was not returned as expected');
	    for(i = 0; i < e.length; i++) {
	        et = e[i];
	        rt = r[i];
	        //assert.equal(rt.start, et.start, "Wrong problem start");
	        //assert.equal(rt.end, et.end, "Wrong problem end");
	        assert.equal(rt.line, et.line, "Wrong problem line number");
	        assert.equal(rt.col, et.col, "Wrong problem column number");
	        assert.equal(rt.message, et.message, "Wrong problem message");
	        assert.equal(rt.type, et.type, "Wrong problem type");
	        //if(rt.descriptionArgs) {
	        //    assert(et.descriptionArgs, "Missing expected description arguments");
	        //    assert.equal(rt.descriptionArgs.nls, et.descriptionArgs.nls, "Missing NLS description argument key");
	        //}
	    }
	}
	
	describe("CSS Tokenizer Tests", function() {
	    var validator = new cssValidator(null);
	    var rules = validator._defaultRuleSet();

		it("@import single literal", function() {
			var results = CSSLint.verify("@import 'foo.css';", rules);
		    assertResults(results, {
		         tokens: [{"type":"IMPORT_SYM","range":[0,7],"value":"@import"},{"type":"STRING","range":[8,17],"value":"'foo.css'"},{"type":"SEMICOLON","range":[17,18],"value":";"},{"type":"EOF","range":[18,18],"value":null}],
                 messages: [{"message":"@import prevents parallel downloads, use <link> instead.","line":1,"col":1,"type":"warning"}]
		    });
		});
		
		it("@import single literal missing semi", function() {
			var results = CSSLint.verify("@import 'foo.css'", rules);
		    assertResults(results, {
		         tokens: [{"type":"IMPORT_SYM","range":[0,7],"value":"@import"},{"type":"STRING","range":[8,17],"value":"'foo.css'"},{"type":"EOF","range":[17,17],"value":null}],
			     messages: [{"message":"Fatal error, cannot continue: Expected SEMICOLON at line 1, col 18.","line":1,"col":18, "type":"error"}]
		    });
		});
		
		it("@import literals successive", function() {
			var results = CSSLint.verify("@import 'a.css';\n@import 'b.css';", rules);
		    assertResults(results, {
		        tokens: [{"type":"IMPORT_SYM","range":[0,7],"value":"@import"},{"type":"STRING","range":[8,15],"value":"'a.css'"},{"type":"SEMICOLON","range":[15,16],"value":";"},{"type":"IMPORT_SYM","range":[17,24],"value":"@import"},{"type":"STRING","range":[25,32],"value":"'b.css'"},{"type":"SEMICOLON","range":[32,33],"value":";"},{"type":"EOF","range":[33,33],"value":null}],
				messages: [{"message":"@import prevents parallel downloads, use <link> instead.","line":1,"col":1,"type":"warning"},{"message":"@import prevents parallel downloads, use <link> instead.","line":2,"col":1,"type":"warning"}]
		    });
		});
		
		it("@import literals successive windows line endings", function() {
			var results = CSSLint.verify("@import 'a.css';\r\n@import 'b.css';", rules);
		    assertResults(results, {
		        tokens: [{"type":"IMPORT_SYM","range":[0,7],"value":"@import"},{"type":"STRING","range":[8,15],"value":"'a.css'"},{"type":"SEMICOLON","range":[15,16],"value":";"},{"type":"IMPORT_SYM","range":[18,25],"value":"@import"},{"type":"STRING","range":[26,33],"value":"'b.css'"},{"type":"SEMICOLON","range":[33,34],"value":";"},{"type":"EOF","range":[34,34],"value":null}],
				messages: [{"message":"@import prevents parallel downloads, use <link> instead.","line":1,"col":1,"type":"warning"},{"message":"@import prevents parallel downloads, use <link> instead.","line":2,"col":1,"type":"warning"}]
		    });
		});
		
		it("@import literals successive with line breaks", function() {
			var results = CSSLint.verify("@import 'a.css';\n\n@import 'b.css';", rules);
		    assertResults(results, {
		         tokens: [{"type":"IMPORT_SYM","range":[0,7],"value":"@import"},{"type":"STRING","range":[8,15],"value":"'a.css'"},{"type":"SEMICOLON","range":[15,16],"value":";"},{"type":"IMPORT_SYM","range":[18,25],"value":"@import"},{"type":"STRING","range":[26,33],"value":"'b.css'"},{"type":"SEMICOLON","range":[33,34],"value":";"},{"type":"EOF","range":[34,34],"value":null}],
				messages: [{"message":"@import prevents parallel downloads, use <link> instead.","line":1,"col":1,"type":"warning"},{"message":"@import prevents parallel downloads, use <link> instead.","line":3,"col":1,"type":"warning"}]
		    });
		});
		
		it("@import literals successive with mixed line breaks", function() {
			var results = CSSLint.verify("@import 'a.css';\r\n\n@import 'b.css';", rules);
		    assertResults(results, {
		         tokens: [{"type":"IMPORT_SYM","range":[0,7],"value":"@import"},{"type":"STRING","range":[8,15],"value":"'a.css'"},{"type":"SEMICOLON","range":[15,16],"value":";"},{"type":"IMPORT_SYM","range":[19,26],"value":"@import"},{"type":"STRING","range":[27,34],"value":"'b.css'"},{"type":"SEMICOLON","range":[34,35],"value":";"},{"type":"EOF","range":[35,35],"value":null}],
				messages: [{"message":"@import prevents parallel downloads, use <link> instead.","line":1,"col":1,"type":"warning"},{"message":"@import prevents parallel downloads, use <link> instead.","line":3,"col":1,"type":"warning"}]
		    });
		});
	});
	
	describe("CSS AST Tests", function() {
	    var validator = new cssValidator(null);
	    var rules = validator._defaultRuleSet();
	    
	    it("@import url string 1", function() {
	        var ast = '{"type":"StyleSheet","range":[0,18],"body":[{"type":"Import","range":[0,18],"uri":{"type":"Uri","range":[8,17]}}]}';
	        var results = CSSLint.verify("@import 'foo.css';", rules);
	        assert(results, 'The snippet should have parsed');
	        assert(results.ast, 'The AST should have been creatred');
	        assert.equal(JSON.stringify(results.ast), ast, 'The ASTs do not match');
	    });
	    
	    it("@import url string 2- media query", function() {
	        var ast = '{"type":"StyleSheet","range":[0,24],"body":[{"type":"Import","range":[0,24],"uri":{"type":"Uri","range":[8,17]},"mediaqueries":{"type":"MediaQueryList","range":[18,24],"queries":[{"type":"MediaQuery","range":[18,24],"expressions":[],"mediafeature":{"type":"MediaFeature","range":[18,23],"value":"print"}}]}}]}';
	        var results = CSSLint.verify("@import 'foo.css' print;", rules);
	        assert(results, 'The snippet should have parsed');
	        assert(results.ast, 'The AST should have been creatred');
	        assert.equal(JSON.stringify(results.ast), ast, 'The ASTs do not match');
	    });
	    
	    it("@import url string 3 - media query expression", function() {
	        var ast = '{"type":"StyleSheet","range":[0,42],"body":[{"type":"Import","range":[0,42],"uri":{"type":"Uri","range":[8,17]},"mediaqueries":{"type":"MediaQueryList","range":[18,42],"queries":[{"type":"MediaQuery","range":[18,42],"expressions":[{"type":"MediaExpression","range":[28,42],"mediafeature":{"type":"MediaFeature","range":[29,33],"value":"font"},"feature":{"type":"MediaFeature","range":[29,33]},"expression":{"type":"Expression","range":[35,41],"value":"Ariel"}}],"mediafeature":{"type":"MediaFeature","range":[18,23],"value":"print"}}]}}]}';
	        var results = CSSLint.verify("@import 'foo.css' print and (font: Ariel);", rules);
	        assert(results, 'The snippet should have parsed');
	        assert(results.ast, 'The AST should have been creatred');
	        assert.equal(JSON.stringify(results.ast), ast, 'The ASTs do not match');
	    });
	    
	    it("@import url string 4 - chained media queries", function() {
	        var ast = '{"type":"StyleSheet","range":[0,51],"body":[{"type":"Import","range":[0,51],"uri":{"type":"Uri","range":[8,17]},"mediaqueries":{"type":"MediaQueryList","range":[18,51],"queries":[{"type":"MediaQuery","range":[18,42],"expressions":[{"type":"MediaExpression","range":[28,42],"mediafeature":{"type":"MediaFeature","range":[29,33],"value":"font"},"feature":{"type":"MediaFeature","range":[29,33]},"expression":{"type":"Expression","range":[35,41],"value":"Ariel"}}],"mediafeature":{"type":"MediaFeature","range":[18,23],"value":"print"}},{"type":"MediaQuery","range":[43,51],"expressions":[],"mediafeature":{"type":"MediaFeature","range":[43,50],"value":"display"}}]}}]}';
	        var results = CSSLint.verify("@import 'foo.css' print and (font: Ariel), display;", rules);
	        assert(results, 'The snippet should have parsed');
	        assert(results.ast, 'The AST should have been creatred');
	        assert.equal(JSON.stringify(results.ast), ast, 'The ASTs do not match');
	    });
	    
	    it("@import url function", function() {
	        var ast = '{"type":"StyleSheet","range":[0,23],"body":[{"type":"Import","range":[0,23],"uri":{"type":"Uri","range":[8,22]}}]}';
	        var results = CSSLint.verify("@import url('foo.css');", rules);
	        assert(results, 'The snippet should have parsed');
	        assert(results.ast, 'The AST should have been creatred');
	        assert.equal(JSON.stringify(results.ast), ast, 'The ASTs do not match');
	    });
	    
	    it("@import url func 2- media query", function() {
	        var ast = '{"type":"StyleSheet","range":[0,29],"body":[{"type":"Import","range":[0,29],"uri":{"type":"Uri","range":[8,22]},"mediaqueries":{"type":"MediaQueryList","range":[23,29],"queries":[{"type":"MediaQuery","range":[23,29],"expressions":[],"mediafeature":{"type":"MediaFeature","range":[23,28],"value":"print"}}]}}]}';
	        var results = CSSLint.verify("@import url('foo.css') print;", rules);
	        assert(results, 'The snippet should have parsed');
	        assert(results.ast, 'The AST should have been creatred');
	        assert.equal(JSON.stringify(results.ast), ast, 'The ASTs do not match');
	    });
	    
	    it("@import url func 3 - media query expression", function() {
	        var ast = '{"type":"StyleSheet","range":[0,47],"body":[{"type":"Import","range":[0,47],"uri":{"type":"Uri","range":[8,22]},"mediaqueries":{"type":"MediaQueryList","range":[23,47],"queries":[{"type":"MediaQuery","range":[23,47],"expressions":[{"type":"MediaExpression","range":[33,47],"mediafeature":{"type":"MediaFeature","range":[34,38],"value":"font"},"feature":{"type":"MediaFeature","range":[34,38]},"expression":{"type":"Expression","range":[40,46],"value":"Ariel"}}],"mediafeature":{"type":"MediaFeature","range":[23,28],"value":"print"}}]}}]}';
	        var results = CSSLint.verify("@import url('foo.css') print and (font: Ariel);", rules);
	        assert(results, 'The snippet should have parsed');
	        assert(results.ast, 'The AST should have been creatred');
	        assert.equal(JSON.stringify(results.ast), ast, 'The ASTs do not match');
	    });
	    
	    it("@import url func 4 - chained media queries", function() {
	        var ast = '{"type":"StyleSheet","range":[0,56],"body":[{"type":"Import","range":[0,56],"uri":{"type":"Uri","range":[8,22]},"mediaqueries":{"type":"MediaQueryList","range":[23,56],"queries":[{"type":"MediaQuery","range":[23,47],"expressions":[{"type":"MediaExpression","range":[33,47],"mediafeature":{"type":"MediaFeature","range":[34,38],"value":"font"},"feature":{"type":"MediaFeature","range":[34,38]},"expression":{"type":"Expression","range":[40,46],"value":"Ariel"}}],"mediafeature":{"type":"MediaFeature","range":[23,28],"value":"print"}},{"type":"MediaQuery","range":[48,56],"expressions":[],"mediafeature":{"type":"MediaFeature","range":[48,55],"value":"display"}}]}}]}';
	        var results = CSSLint.verify("@import url('foo.css') print and (font: Ariel), display;", rules);
	        assert(results, 'The snippet should have parsed');
	        assert(results.ast, 'The AST should have been creatred');
	        assert.equal(JSON.stringify(results.ast), ast, 'The ASTs do not match');
	    });
	});
	
	describe("CSS Recoverable AST Tests", function() {
	    var validator = new cssValidator(null);
	    var rules = validator._defaultRuleSet();
	    
	    it("@import url string bad media expression 1", function() {
	        var ast = '{"type":"StyleSheet","range":[0,-1],"body":[{"type":"Import","range":[0,-1],"uri":{"type":"Uri","range":[8,17]},"mediaqueries":{"type":"MediaQueryList","range":[18,25],"queries":[{"type":"MediaQuery","range":[18,25],"expressions":[],"mediafeature":{"type":"MediaFeature","range":[18,23],"value":"print"}}]}}]}';
	        var results = CSSLint.verify("@import 'foo.css' print (font: Ariel);", rules);
	        assert(results, 'The snippet should have parsed');
	        assert(results.ast, 'The AST should have been creatred');
	        assert.equal(JSON.stringify(results.ast), ast, 'The ASTs do not match');
	    });
	});
});