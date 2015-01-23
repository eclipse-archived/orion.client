/*eslint-env amd, browser, mocha*/
define([
'orion/Deferred',
'chai/chai',
'csslint',
'webtools/cssValidator',
'mocha/mocha' //global export, stays last
], function(Deferred, chai, CSSLint, cssValidator) {
    
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
	
	describe("CSS Parser Tests", function() {
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
});