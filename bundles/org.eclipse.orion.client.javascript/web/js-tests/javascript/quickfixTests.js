/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, mocha*/
define([
	'javascript/quickFixes',
	'javascript/validator',
	'chai/chai',
	'orion/Deferred',
	'esprima',
	'javascript/astManager',
	'mocha/mocha', //must stay at the end, not a module
], function(QuickFixes, Validator, chai, Deferred, Esprima, ASTManager) {
	var assert = chai.assert;

	describe('Quick Fix Tests', function() {
		
		/**
		 * @description Sets up the test
		 * @param {Object} options {buffer, contentType}
		 * @returns {Object} The object with the initialized values
		 */
		function setup(options) {
		    var buffer = options.buffer;
		    var contentType = options.contentType ? options.contentType : 'application/javascript';
			var astManager = new ASTManager.ASTManager(Esprima);
			var validator = new Validator(astManager);
			var rule = options.rule;
			validator._enableOnly(rule.id, rule.severity, rule.opts);
			var fixComputer = new QuickFixes.JavaScriptQuickfixes(astManager);
			var editorContext = {
				/*override*/
				getText: function() {
					return new Deferred().resolve(buffer);
				},
				
				setText: function(text, start, end) {
				    assertFixes(text, start, end, options.expected);
				},
				
				getFileMetadata: function() {
    			    var o = Object.create(null);
    			    o.contentType = Object.create(null);
    			    o.contentType.id = contentType;
    			    o.location = 'quickfix_test_script.js';
    			    return new Deferred().resolve(o);
    			}
				
			};
			return {
			    validator: validator,
				fixComputer: fixComputer,
				editorContext: editorContext,
				contentType: contentType
			};
		}
	
	    /**
    	 * @description Runs the validator on the given options and computes fixes for those problems
    	 * @param {Object} options {buffer, contentType, rule}
    	 * @returns {orion.Promise} The validation promise
    	 */
    	function getFixes(options) {
            var obj = setup(options);
            return obj.validator.computeProblems(obj.editorContext, {contentType: obj.contentType, rule: options.rule}).then(function(problems) {
                var pbs = problems.problems;
                var annot = pbs[0];
                if(options.pid) {
                    for(var i = 0; i < pbs.length; i++) {
                        if(pbs[i].id === options.pid) {
                            annot = pbs[i];
                            break;
                        }
                    }
                    assert(i !== pbs.length, "Did not find any problems for the expcted id: "+ options.pid);
                } else {
                    assert(pbs, "There should always be problems");
                    assert.equal(pbs.length, 1, 'There should only be one problem per test');
                }
                annot.title = annot.description;
                if(options.fixid) {
                    annot.fixid = options.fixid;
                }
                return obj.fixComputer.execute(obj.editorContext, {annotation: annot});
            });
	    }
	
	    /**
    	 * @description Compares the computed fixes set against the expected ones
    	 * @param {Array.<orion.Fix>} computed The computed set of fixes
    	 * @param {Array.<Object>} expected The expected set of fixes
    	 */
    	function assertFixes(computed, start, end, expected) {
	        assert(computed !== null && typeof computed !== 'undefined', 'There should be fixes');
    	    assert(computed.indexOf(expected.value) > -1, 'The fix: '+computed+' does not match the expected fix of: '+expected.value);
    	    assert.equal(start, expected.start, 'The fix starts do not match');
    	    assert.equal(end, expected.end, 'The fix ends do not match');
	    }
	
	    /**
    	 * @description Creates a test rule object for the test set up
    	 * @param {String} id The id of the rule used to update the preferences in javascript/validator#updated
    	 * @param {Number} severity The severity of the problem or null (which defaults to '2')
    	 * @param {String} opts The optional args for a rule. For example no-missing-doc has 'decl' and 'expr' as optional args
    	 * @returns {Object} Returns a new rule object for testing with
    	 */
    	function createTestRule(id, severity, opts) {
	        var rule = Object.create(null);
	        rule.id = id;
	        rule.severity = severity ? severity : 2;
	        rule.opts = opts;
	        return rule;
	    }
	//NO-COMMA-DANGLE
	    it("Test no-comma-dangle-1", function() {
		    var rule = createTestRule('no-comma-dangle');
		    var expected = {value: "",
		                    start: 15, 
		                    end: 16};
		    return getFixes({buffer: 'f({one:1, two:2,});', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-comma-dangle-2", function() {
		    var rule = createTestRule('no-comma-dangle');
		    var expected = {value: "",
		                    start: 21, 
		                    end: 22};
		    return getFixes({buffer: 'var f = {one:1, two:2,};', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-comma-dangle-3", function() {
		    var rule = createTestRule('no-comma-dangle');
		    var expected = {value: "",
		                    start: 22, 
		                    end: 23};
		    return getFixes({buffer: 'var f = [{one:1, two:2,}];', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-comma-dangle-html-1", function() {
		    var rule = createTestRule('no-comma-dangle');
		    var expected = {value: "",
		                    start: 35, 
		                    end: 36};
		    return getFixes({buffer: '<html><head><script>f({one:1, two:2,});</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-comma-dangle-html-2", function() {
		    var rule = createTestRule('no-comma-dangle');
		    var expected = {value: "",
		                    start: 41, 
		                    end: 42};
		    return getFixes({buffer: '<html><head><script>var f = {one:1, two:2,};</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-comma-dangle-html-3", function() {
		    var rule = createTestRule('no-comma-dangle');
		    var expected = {value: "",
		                    start: 42, 
		                    end: 43};
		    return getFixes({buffer: '<html><head><script>var f = [{one:1, two:2,}];</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-comma-dangle-html-4", function() {
		    var rule = createTestRule('no-comma-dangle');
		    var expected = {value: "",
		                    start: 59, 
		                    end: 60};
		    return getFixes({buffer: '<html><head><script></script><script>var f = [{one:1, two:2,}];</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
	//NO-EMPTY-BLOCK
		it("Test no-empty-block-1", function() {
		    var rule = createTestRule('no-empty-block');
		    var expected = {value: "//TODO empty block",
		                    start: 14, 
		                    end: 14};
		    return getFixes({buffer: 'function f() {}', 
		                      rule: rule,
		                      expected: expected});
		});
		
		it("Test no-empty-block-2", function() {
		    var rule = createTestRule('no-empty-block');
		    var expected = {value: "//TODO empty block",
		                    start: 39, 
		                    end: 39};
		    return getFixes({buffer: 'var f = {f: function() { function q() {}}}', 
		                      rule: rule,
		                      expected: expected});
		});
		
		it("Test no-empty-block-3", function() {
		    var rule = createTestRule('no-empty-block');
		    var expected = {value: "//TODO empty block",
		                    start: 25, 
		                    end: 25};
		    return getFixes({buffer: 'var f = { f: function() {}};', 
		                      rule: rule,
		                      expected: expected});
		});
		
		it("Test no-empty-block-4", function() {
		    var rule = createTestRule('no-empty-block');
		    var expected = {value: "//TODO empty block",
		                    start: 10, 
		                    end: 10};
		    return getFixes({buffer: 'while(f) {}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-empty-block-5", function() {
		    var rule = createTestRule('no-empty-block');
		    var expected = {value: "//TODO empty block",
		                    start: 7, 
		                    end: 7};
		    return getFixes({buffer: 'if(f) {}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-empty-block-6", function() {
		    var rule = createTestRule('no-empty-block');
		    var expected = {value: "//TODO empty block",
		                    start: 17, 
		                    end: 17};
		    return getFixes({buffer: 'if(f) {while(f) {}}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-empty-block-html-1", function() {
		    var rule = createTestRule('no-empty-block');
		    var expected = {value: "//TODO empty block",
		                    start: 34, 
		                    end: 34};
		    return getFixes({buffer: '<html><head><script>function f() {}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		
		it("Test no-empty-block-html-2", function() {
		    var rule = createTestRule('no-empty-block');
		    var expected = {value: "//TODO empty block",
		                    start: 59, 
		                    end: 59};
		    return getFixes({buffer: '<html><head><script>var f = {f: function() { function q() {}}}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		
		it("Test no-empty-block-html-3", function() {
		    var rule = createTestRule('no-empty-block');
		    var expected = {value: "//TODO empty block",
		                    start: 45, 
		                    end: 45};
		    return getFixes({buffer: '<html><head><script>var f = { f: function() {}};</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		
		it("Test no-empty-block-html-4", function() {
		    var rule = createTestRule('no-empty-block');
		    var expected = {value: "//TODO empty block",
		                    start: 30, 
		                    end: 30};
		    return getFixes({buffer: '<html><head><script>while(f) {}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-empty-block-html-5", function() {
		    var rule = createTestRule('no-empty-block');
		    var expected = {value: "//TODO empty block",
		                    start: 27, 
		                    end: 27};
		    return getFixes({buffer: '<html><head><script>if(f) {}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-empty-block-html-6", function() {
		    var rule = createTestRule('no-empty-block');
		    var expected = {value: "//TODO empty block",
		                    start: 37, 
		                    end: 37};
		    return getFixes({buffer: '<html><head><script>if(f) {while(f) {}}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-empty-block-html-7", function() {
		    var rule = createTestRule('no-empty-block');
		    var expected = {value: "//TODO empty block",
		                    start: 54, 
		                    end: 54};
		    return getFixes({buffer: '<html><head><script></script><script>if(f) {while(f) {}}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
	//NO-EXTRA-SEMI
		it("Test no-extra-semi-1", function() {
		    var rule = createTestRule('no-extra-semi');
		     var expected = {value: "",
		                    start: 15, 
		                    end: 16};
		    return getFixes({buffer: 'function f() {};', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-extra-semi-2", function() {
		    var rule = createTestRule('no-extra-semi');
		    var expected = {value: "",
		                    start: 13, 
		                    end: 14};
		    return getFixes({buffer: 'var foo = 10;;', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-extra-semi-3", function() {
		    var rule = createTestRule('no-extra-semi');
		    var expected = {value: "",
		                    start: 13, 
		                    end: 14};
		    return getFixes({buffer: 'var foo = {};;', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-extra-semi-4", function() {
		    var rule = createTestRule('no-extra-semi');
		    var expected = {value: "",
		                    start: 0, 
		                    end: 1};
		    return getFixes({buffer: ';', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-extra-semi-html-1", function() {
		    var rule = createTestRule('no-extra-semi');
		     var expected = {value: "",
		                    start: 35, 
		                    end: 36};
		    return getFixes({buffer: '<html><head><script>function f() {};</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-extra-semi-html-2", function() {
		    var rule = createTestRule('no-extra-semi');
		    var expected = {value: "",
		                    start: 33, 
		                    end: 34};
		    return getFixes({buffer: '<html><head><script>var foo = 10;;</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-extra-semi-html-3", function() {
		    var rule = createTestRule('no-extra-semi');
		    var expected = {value: "",
		                    start: 33, 
		                    end: 34};
		    return getFixes({buffer: '<html><head><script>var foo = {};;</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-extra-semi-html-4", function() {
		    var rule = createTestRule('no-extra-semi');
		    var expected = {value: "",
		                    start: 20, 
		                    end: 21};
		    return getFixes({buffer: '<html><head><script>;</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-extra-semi-html-5", function() {
		    var rule = createTestRule('no-extra-semi');
		    var expected = {value: "",
		                    start: 37, 
		                    end: 38};
		    return getFixes({buffer: '<html><head><script></script><script>;</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
	//NO-FALLTHROUGH
		it("Test no-fallthrough-1", function() {
		    var rule = createTestRule('no-fallthrough');
		    var expected = {value: "//$FALLTHROUGH$",
		                    start: 30, 
		                    end: 30};
		    return getFixes({buffer: 'switch(num) {case 1:{code();} case 2:{}}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-fallthrough-2", function() {
		    var rule = createTestRule('no-fallthrough');
		    var expected = {value: "//$FALLTHROUGH$",
		                    start: 46, 
		                    end: 46};
		    return getFixes({buffer: 'switch(num) {case 1:{break;} case 2:{code();} default: {}}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-fallthrough-html-1", function() {
		    var rule = createTestRule('no-fallthrough');
		    var expected = {value: "//$FALLTHROUGH$",
		                    start: 50, 
		                    end: 50};
		    return getFixes({buffer: '<html><head><script>switch(num) {case 1:{code();} case 2:{}}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-fallthrough-html-2", function() {
		    var rule = createTestRule('no-fallthrough');
		    var expected = {value: "//$FALLTHROUGH$",
		                    start: 66, 
		                    end: 66};
		    return getFixes({buffer: '<html><head><script>switch(num) {case 1:{break;} case 2:{code();} default: {}}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-fallthrough-html-3", function() {
		    var rule = createTestRule('no-fallthrough');
		    var expected = {value: "//$FALLTHROUGH$",
		                    start: 83, 
		                    end: 83};
		    return getFixes({buffer: '<html><head><script></script><script>switch(num) {case 1:{break;} case 2:{code();} default: {}}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-fallthrough-break-1", function() {
		    var rule = createTestRule('no-fallthrough');
		    var expected = {value: "break;",
		                    start: 30, 
		                    end: 30};
		    return getFixes({buffer: 'switch(num) {case 1:{code();} case 2:{}}', 
		                      rule: rule,
		                      expected: expected,
		                      fixid: 'no-fallthrough-break'});
		});
		it("Test no-fallthrough-break-2", function() {
		    var rule = createTestRule('no-fallthrough');
		    var expected = {value: "break;",
		                    start: 46, 
		                    end: 46};
		    return getFixes({buffer: 'switch(num) {case 1:{break;} case 2:{code();} default: {}}', 
		                      rule: rule,
		                      expected: expected,
		                      fixid: 'no-fallthrough-break'});
		});
		it("Test no-fallthrough-break-html-1", function() {
		    var rule = createTestRule('no-fallthrough');
		    var expected = {value: "break;",
		                    start: 50, 
		                    end: 50};
		    return getFixes({buffer: '<html><head><script>switch(num) {case 1:{code();} case 2:{}}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      fixid: 'no-fallthrough-break',
		                      contentType: 'text/html'});
		});
		it("Test no-fallthrough-break-html-2", function() {
		    var rule = createTestRule('no-fallthrough');
		    var expected = {value: "break;",
		                    start: 66, 
		                    end: 66};
		    return getFixes({buffer: '<html><head><script>switch(num) {case 1:{break;} case 2:{code();} default: {}}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      fixid: 'no-fallthrough-break',
		                      contentType: 'text/html'});
		});
		it("Test no-fallthrough-break-html-3", function() {
		    var rule = createTestRule('no-fallthrough');
		    var expected = {value: "break;",
		                    start: 83, 
		                    end: 83};
		    return getFixes({buffer: '<html><head><script></script><script>switch(num) {case 1:{break;} case 2:{code();} default: {}}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      fixid: 'no-fallthrough-break',
		                      contentType: 'text/html'});
		});
    //NO-THROW-LITERAL
        it("Test no-throw-literal-number", function() {
            var rule = createTestRule('no-throw-literal');
            return getFixes({
                buffer: 'throw 1',
                rule: rule,
                expected: { value: "new Error(1)", start: 6,  end: 7 }
            });
        });
        it("Test no-throw-literal-string", function() {
            var rule = createTestRule('no-throw-literal');
            return getFixes({
                buffer: 'throw "fizz buzz"',
                rule: rule,
                expected: { value: "new Error(\"fizz buzz\")", start: 6,  end: 17 }
            });
        });
        it("Test no-throw-literal-ArrayExpression", function() {
            var rule = createTestRule('no-throw-literal');
            return getFixes({
                buffer: 'throw [1,  2]',
                rule: rule,
                expected: { value: "new Error([1,  2])", start: 6,  end: 13 }
            });
       });

	//NO-UNDEF
	     /**
	      * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=458567
	      */
	     it("Test no-undef-defined-existing-doc", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "/*globals aa:true */",
		                    start: 0, 
		                    end: 0};
		    return getFixes({buffer: '/** @returns {Object} */ function f() {aa = 10;}', 
		                      rule: rule,
		                      expected: expected});
		});
		/**
	      * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=458567
	      */
	     it("Test no-undef-defined-existing-doc", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "/*globals aa:true */",
		                    start: 25, 
		                    end: 25};
		    return getFixes({buffer: '/** just some comment */ function f() {aa = 10;}', 
		                      rule: rule,
		                      expected: expected});
		});
		/**
	      * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=458567
	      */
	     it("Test no-undef-defined-existing-doc", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "/*globals Foo */",
		                    start: 0, 
		                    end: 0};
		    return getFixes({buffer: '/** @returns {Object} */ Foo["bar"] = function() {};', 
		                      rule: rule,
		                      expected: expected});
		});
		/**
	      * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=458567
	      */
	     it("Test no-undef-defined-existing-doc", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "/*globals Foo */",
		                    start: 25, 
		                    end: 25};
		    return getFixes({buffer: '/** just some comment */ Foo["bar"] = function() {};', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-undef-defined-1", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "/*eslint-env node */",
		                    start: 0, 
		                    end: 0};
		    return getFixes({buffer: 'console.log(10);', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-undef-defined-2", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "/*globals foo */",
		                    start: 0, 
		                    end: 0};
		    return getFixes({buffer: 'foo(10);', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-undef-defined-3", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "globals foo bar",
		                    start: 2, 
		                    end: 14};
		    return getFixes({buffer: '/*globals foo */ foo(10); bar();', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-undef-defined-4", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "globals bar foo:true",
		                    start: 2, 
		                    end: 13};
		    return getFixes({buffer: '/*globals bar*/ foo++; bar();', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-undef-defined-5", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "globals bar foo:true",
		                    start: 2, 
		                    end: 13};
		    return getFixes({buffer: '/*globals bar*/ foo = bar; bar();', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-undef-defined-eslint-env-4", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "eslint-env node, browser",
		                    start: 2, 
		                    end: 18};
		    return getFixes({buffer: '/*eslint-env node */ console.log(10); window.open();', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-undef-defined-html-1", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "/*globals foo */",
		                    start: 20, 
		                    end: 20};
		    return getFixes({buffer: '<html><head><script>foo(10);</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-undef-defined-html-2", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "globals foo bar",
		                    start: 22, 
		                    end: 34};
		    return getFixes({buffer: '<html><head><script>/*globals foo */ foo(10); bar();</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-undef-defined-html-3", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "globals bar foo:true",
		                    start: 22, 
		                    end: 33};
		    return getFixes({buffer: '<html><head><script>/*globals bar*/ foo++; bar();</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-undef-defined-html-4", function() {
		    var rule = createTestRule('no-undef');
		    var expected = {value: "globals bar foo:true",
		                    start: 22, 
		                    end: 33};
		    return getFixes({buffer: '<html><head><script>/*globals bar*/ foo = bar; bar();</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
	//NO-UNUSED-PARAMS
		it("Test no-unused-params-1", function() {
		    var rule = createTestRule('no-unused-params');
		    var expected = {value: "",
		                    start: 11,
		                    end: 12};
		    return getFixes({buffer: 'function f(p) {}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-unused-params-2", function() {
		    var rule = createTestRule('no-unused-params');
		    var expected = {value: "",
		                    start: 14,
		                    end: 18};
		    return getFixes({buffer: 'function f(p, p2, p3) {p(); p3();}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-unused-params-3", function() {
		    var rule = createTestRule('no-unused-params');
		    var expected = {value: "",
		                    start:16,
		                    end:20};
		    return getFixes({buffer: 'function f(p, p2, p3) {p(); p2();}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-unused-params-4", function() {
		    var rule = createTestRule('no-unused-params');
		    var expected = {value: "/* @callback */",
		                    start: 11, 
		                    end: 11};
		    return getFixes({buffer: 'define([], function(p, p2, p3) {p(); p2();});', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-unused-params-5", function() {
		    var rule = createTestRule('no-unused-params');
		    var expected = {value: "/**\n * @callback\n */",
		                    start: 10, 
		                    end: 10};
		    return getFixes({buffer: 'var f = { one: function(p, p2, p3) {p(); p2();}};', 
		                      rule: rule,
		                      expected: expected});
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461462
		 */
		it("Test no-unused-params-existing-doc-1", function() {
		    var rule = createTestRule('no-unused-params');
		    var expected = {value: "* @callback\n",
		                    start: 25, 
		                    end: 25};
		    return getFixes({buffer: 'var f = { /**\n *@see\n *\n */\none: function(p, p2, p3) {p(); p2();}};', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-unused-params-html-1", function() {
		    var rule = createTestRule('no-unused-params');
		    var expected = {value: "",
		                    start: 31,
		                    end: 32};
		    return getFixes({buffer: '<html><head><script>function f(p) {}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-unused-params-html-2", function() {
		    var rule = createTestRule('no-unused-params');
		    var expected = {value: "",
		                    start: 34,
		                    end: 38};
		    return getFixes({buffer: '<html><head><script>function f(p, p2, p3) {p(); p3();}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-unused-params-html-3", function() {
		    var rule = createTestRule('no-unused-params');
		    var expected = {value: "",
		                    start:36,
		                    end:40};
		    return getFixes({buffer: '<html><head><script>function f(p, p2, p3) {p(); p2();}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-unused-params-html-4", function() {
		    var rule = createTestRule('no-unused-params');
		    var expected = {value: "/* @callback */",
		                    start: 31, 
		                    end: 31};
		    return getFixes({buffer: '<html><head><script>define([], function(p, p2, p3) {p(); p2();});</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-unused-params-html-5", function() {
		    var rule = createTestRule('no-unused-params');
		    var expected = {value: "/**\n                     * @callback\n                     */\n                    ",
		                    start: 30, 
		                    end: 30};
		    return getFixes({buffer: '<html><head><script>var f = { one: function(p, p2, p3) {p(); p2();}};</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461462
		 */
		it("Test no-unused-params-html-existing-doc-1", function() {
		    var rule = createTestRule('no-unused-params');
		    var expected = {value: "* @callback",
		                    start: 45, 
		                    end: 45};
		    return getFixes({buffer: '<html><head><script>var f = { /**\n *@see\n *\n */\none: function(p, p2, p3) {p(); p2();}};</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});

	//EQEQEQ
		it("Test eqeqeq-1", function() {
		    var rule = createTestRule('eqeqeq');
		    var expected = {value: "===",
		                    start: 5, 
		                    end: 7};
		    return getFixes({buffer: 'if(1 == 3) {}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test eqeqeq-2", function() {
		    var rule = createTestRule('eqeqeq');
		    var expected = {value: "===",
		                    start: 12, 
		                    end: 14};
		    return getFixes({buffer: 'if(typeof f == "undefined") {}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test eqeqeq-3", function() {
		    var rule = createTestRule('eqeqeq');
		    var expected = {value: "!==",
		                    start: 5, 
		                    end: 7};
		    return getFixes({buffer: 'if(1 != 3) {}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test eqeqeq-4", function() {
		    var rule = createTestRule('eqeqeq');
		    var expected = {value: "!==",
		                    start: 12, 
		                    end: 14};
		    return getFixes({buffer: 'if(typeof f != "undefined") {}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test eqeqeq-html-1", function() {
		    var rule = createTestRule('eqeqeq');
		    var expected = {value: "===",
		                    start: 25, 
		                    end: 27};
		    return getFixes({buffer: '<html><head><script>if(1 == 3) {}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test eqeqeq-html-2", function() {
		    var rule = createTestRule('eqeqeq');
		    var expected = {value: "===",
		                    start: 32, 
		                    end: 34};
		    return getFixes({buffer: '<html><head><script>if(typeof f == "undefined") {}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test eqeqeq-html-3", function() {
		    var rule = createTestRule('eqeqeq');
		    var expected = {value: "!==",
		                    start: 25, 
		                    end: 27};
		    return getFixes({buffer: '<html><head><script>if(1 != 3) {}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test eqeqeq-html-4", function() {
		    var rule = createTestRule('eqeqeq');
		    var expected = {value: "!==",
		                    start: 32, 
		                    end: 34};
		    return getFixes({buffer: '<html><head><script>if(typeof f != "undefined") {}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test eqeqeq-html-5", function() {
		    var rule = createTestRule('eqeqeq');
		    var expected = {value: "!==",
		                    start: 49, 
		                    end: 51};
		    return getFixes({buffer: '<html><head><script></script><script>if(typeof f != "undefined") {}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
	//NO-UNREACHABLE
		it("Test no-unreachable-1", function() {
		    var rule = createTestRule('no-unreachable');
		    var expected = {value: "",
		                    start: 12, 
		                    end: 14};
		    return getFixes({buffer: 'if(1 == 3) {return; var foo = 9;}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-unreachable-2", function() {
		    var rule = createTestRule('no-unreachable');
		    var expected = {value: "",
		                    start: 32, 
		                    end: 39};
		    return getFixes({buffer: 'switch(num) { case 1: {throw e; f = 10;}}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-unreachable-html-1", function() {
		    var rule = createTestRule('no-unreachable');
		    var expected = {value: "",
		                    start: 43, 
		                    end: 51};
		    return getFixes({buffer: '<html><head><script>function f(p) {return; foo = 9;}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-unreachable-html-2", function() {
		    var rule = createTestRule('no-unreachable');
		    var expected = {value: "",
		                    start: 52, 
		                    end: 59};
		    return getFixes({buffer: '<html><head><script>switch(num) { case 1: {throw e; f = 10;}}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
	//NO-SPARSE-ARRAYS
		it("Test no-sparse-arrays-1", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 8, 
		                    end: 16};
		    return getFixes({buffer: 'var a = [1, , 2]', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-sparse-arrays-2", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 8, 
		                    end: 20};
		    return getFixes({buffer: 'var a = [1, , 2, , ]', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-sparse-arrays-3", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 8, 
		                    end: 24};
		    return getFixes({buffer: 'var a = [, , 1, , 2, , ]', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-sparse-arrays-4", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 8, 
		                    end: 27};
		    return getFixes({buffer: 'var a = [, , \n1, \n, 2, \n, ]', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-sparse-arrays-5", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2, 3]",
		                    start: 8, 
		                    end: 28};
		    return getFixes({buffer: 'var a = [, , \n1, \n, 2, \n, 3]', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-sparse-arrays-6", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2, 3]",
		                    start: 8, 
		                    end: 41};
		    return getFixes({buffer: 'var a = [, ,,,, \n1, \n, , ,, ,\n,, 2, \n, 3]', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-sparse-arrays-7", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 8, 
		                    end: 20};
		    return getFixes({buffer: 'var a = [1, , 2, , ];', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-sparse-arrays-8", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 8, 
		                    end: 27};
		    return getFixes({buffer: 'var a = [, , \n1, \n, 2, \n, ];', 
		                      rule: rule,
		                      expected: expected});
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461449
		 */
		it("Test no-sparse-arrays-no-spacing-1", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 8, 
		                    end: 22};
		    return getFixes({buffer: 'var a = [,,\n1,\n,2,\n,,]', 
		                      rule: rule,
		                      expected: expected});
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461449
		 */
		it("Test no-sparse-arrays-no-spacing-2", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 7, 
		                    end: 21};
		    return getFixes({buffer: 'define([,,\n1,\n,2,\n,,],function() {});', 
		                      rule: rule,
		                      expected: expected});
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461449
		 */
		it("Test no-sparse-arrays-no-spacing-3", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 8, 
		                    end: 22};
		    return getFixes({buffer: 'var a = [,,\n1,\n,2,\n,,];', 
		                      rule: rule,
		                      expected: expected});
		});
		/**
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461449
		 */
		it("Test no-sparse-arrays-no-spacing-4", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 8, 
		                    end: 22};
		    return getFixes({buffer: 'var a = [,,\n1,\n,2,\n,,]\nvar foo = "bar";', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test no-sparse-arrays-html-1", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 28, 
		                    end: 36};
		    return getFixes({buffer: '<html><head><script>var a = [1, , 2]</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-sparse-arrays-html-2", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 28, 
		                    end: 40};
		    return getFixes({buffer: '<html><head><script>var a = [1, , 2, , ]</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-sparse-arrays-html-3", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 28, 
		                    end: 44};
		    return getFixes({buffer: '<html><head><script>var a = [, , 1, , 2, , ]</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-sparse-arrays-html-4", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 28, 
		                    end: 46};
		    return getFixes({buffer: '<html><head><script>var a = [, , 1, \n, 2, \n, ]</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-sparse-arrays-html-5", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2, 3]",
		                    start: 28, 
		                    end: 48};
		    return getFixes({buffer: '<html><head><script>var a = [, , \n1, \n, 2, \n, 3]</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-sparse-arrays-html-6", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2, 3]",
		                    start: 28, 
		                    end: 61};
		    return getFixes({buffer: '<html><head><script>var a = [, ,,,, \n1, \n, , ,, ,\n,, 2, \n, 3]</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-sparse-arrays-html-7", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 28, 
		                    end: 40};
		    return getFixes({buffer: '<html><head><script>var a = [1, , 2, , ];</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test no-sparse-arrays-html-8", function() {
		    var rule = createTestRule('no-sparse-arrays');
		    var expected = {value: "[1, 2]",
		                    start: 28, 
		                    end: 47};
		    return getFixes({buffer: '<html><head><script>var a = [, , \n1, \n, 2, \n, ];</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
	//SEMI
	    it("Test semi-1", function() {
		    var rule = createTestRule('semi');
		    var expected = {value: ";",
		                    start: 14, 
		                    end: 14};
		    return getFixes({buffer: 'var a = [1, 2]', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test semi-2", function() {
		    var rule = createTestRule('semi');
		    var expected = {value: ";",
		                    start: 5, 
		                    end: 5};
		    return getFixes({buffer: 'foo()', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test semi-3", function() {
		    var rule = createTestRule('semi');
		    var expected = {value: ";",
		                    start: 10, 
		                    end: 10};
		    return getFixes({buffer: 'var a = {}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test semi-html-1", function() {
		    var rule = createTestRule('semi');
		    var expected = {value: ";",
		                    start: 34, 
		                    end: 34};
		    return getFixes({buffer: '<html><head><script>var a = [1, 2]</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test semi-html-2", function() {
		    var rule = createTestRule('semi');
		    var expected = {value: ";",
		                    start: 25, 
		                    end: 25};
		    return getFixes({buffer: '<html><head><script>foo()</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
		it("Test semi-html-3", function() {
		    var rule = createTestRule('semi');
		    var expected = {value: ";",
		                    start: 30, 
		                    end: 30};
		    return getFixes({buffer: '<html><head><script>var a = {}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      contentType: 'text/html'});
		});
	//NO-UNUSED-VARS-UNUSED
	    it("Test no-unused-vars-unused-1", function() {
		    var rule = createTestRule('no-unused-vars');
		    var expected = {value: "",
		                    start: 0, 
		                    end: 6};
		    return getFixes({buffer: 'var a;', 
		                      rule: rule,
		                      expected: expected,
		                      pid: 'no-unused-vars-unused'});
		});
		it("Test no-unused-vars-unused-2", function() {
		    var rule = createTestRule('no-unused-vars');
		    var expected = {value: "",
		                    start: 10, 
		                    end: 13};
		    return getFixes({buffer: 'var a = 10, b;', 
		                      rule: rule,
		                      expected: expected,
		                      pid: 'no-unused-vars-unused'});
		});
		it("Test no-unused-vars-unused-3", function() {
		    var rule = createTestRule('no-unused-vars');
		    var expected = {value: "",
		                    start: 12, 
		                    end: 15};
		    return getFixes({buffer: 'var a = 10, b, c = 1;', 
		                      rule: rule,
		                      expected: expected,
		                      pid: 'no-unused-vars-unused'});
		});
		it("Test no-unused-vars-unused-funcdecl-1", function() {
		    var rule = createTestRule('no-unused-vars');
		    var expected = {value: "",
		                    start: 0, 
		                    end: 15};
		    return getFixes({buffer: 'function f() {}', 
		                      rule: rule,
		                      expected: expected,
		                      pid: 'no-unused-vars-unused-funcdecl'});
		});
		it("Test no-unused-vars-unused-funcdecl-2", function() {
		    var rule = createTestRule('no-unused-vars');
		    var expected = {value: "",
		                    start: 26, 
		                    end: 41};
		    return getFixes({buffer: 'var a = {one: function() {function f() {}}}', 
		                      rule: rule,
		                      expected: expected,
		                      pid: 'no-unused-vars-unused-funcdecl'});
		});
		it("Test no-unused-vars-unused-html-1", function() {
		    var rule = createTestRule('no-unused-vars');
		    var expected = {value: "",
		                    start: 20, 
		                    end: 26};
		    return getFixes({buffer: '<html><head><script>var a;</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      pid: 'no-unused-vars-unused',
		                      contentType: 'text/html'});
		});
		it("Test no-unused-vars-unused-html-2", function() {
		    var rule = createTestRule('no-unused-vars');
		    var expected = {value: "",
		                    start: 30, 
		                    end: 33};
		    return getFixes({buffer: '<html><head><script>var a = 10, b;</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      pid: 'no-unused-vars-unused',
		                      contentType: 'text/html'});
		});
		it("Test no-unused-vars-unused-html-3", function() {
		    var rule = createTestRule('no-unused-vars');
		    var expected = {value: "",
		                    start: 32, 
		                    end: 35};
		    return getFixes({buffer: '<html><head><script>var a = 10, b, c = 1;</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      pid: 'no-unused-vars-unused',
		                      contentType: 'text/html'});
		});
		it("Test no-unused-vars-unused-funcdecl-html-1", function() {
		    var rule = createTestRule('no-unused-vars');
		    var expected = {value: "",
		                    start: 20, 
		                    end: 35};
		    return getFixes({buffer: '<html><head><script>function f() {}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      pid: 'no-unused-vars-unused-funcdecl',
		                      contentType: 'text/html'});
		});
		it("Test no-unused-vars-unused-funcdecl-html-2", function() {
		    var rule = createTestRule('no-unused-vars');
		    var expected = {value: "",
		                    start: 46, 
		                    end: 61};
		    return getFixes({buffer: '<html><head><script>var a = {one: function() {function f() {}}}</script></head></html>', 
		                      rule: rule,
		                      expected: expected,
		                      pid: 'no-unused-vars-unused-funcdecl',
		                      contentType: 'text/html'});
		});
	});
});
