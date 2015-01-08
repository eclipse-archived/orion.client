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
		    return getFixes({buffer: 'f({one:1, two:2,})', 
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
	//NO-UNDEF
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
		    var expected = {value: "eslint-env node, browser",
		                    start: 2, 
		                    end: 18};
		    return getFixes({buffer: '/*eslint-env node */ console.log(10); window.open();', 
		                      rule: rule,
		                      expected: expected});
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
	});
});
