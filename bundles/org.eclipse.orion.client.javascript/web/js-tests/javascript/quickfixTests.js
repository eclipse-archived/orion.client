/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
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
	'javascript/fixes/quickFixes',
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
				
				setText: function(text) {
				    assertFixes(text, options.expected);
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
                assert(pbs, "There should always be problems");
                assert.equal(pbs.length, 1, 'There should only be one problem per test');
                return obj.fixComputer.execute(obj.editorContext, {annotation: pbs[0]});
            });
	    }
	
	    /**
    	 * @description Compares the computed fixes set against the expected ones
    	 * @param {Array.<orion.Fix>} computed The computed set of fixes
    	 * @param {Array.<Object>} expected The expected set of fixes
    	 */
    	function assertFixes(computed, expected) {
    	    assert(computed !== null && typeof computed !== 'undefined', 'There should be fixes');
    	    assert(computed.indexOf(expected) > -1, 'The fix: '+computed+' does not match the expected fix of: '+expected);
	    }
	
	    /**
    	 * @description Creates a test rule object for the test set up
    	 * @param {String} id The id of the rule used to update the preferences in javascript/validator#updated
    	 * @param {Number} severity The severity of the problem or null (which defaults to '2')
    	 * @param {String} opts The optional args for a rule. For example no-missing-doc has 'decl' and 'expr' as optional args
    	 * @returns returns
    	 */
    	function createTestRule(id, severity, opts) {
	        var rule = Object.create(null);
	        rule.id = id;
	        rule.severity = severity ? severity : 2;
	        rule.opts = opts;
	        return rule;
	    }
	
	//NO-EMPTY-BLOCK
		it("Test no-empty-block-1", function() {
		    var rule = createTestRule('no-empty-block');
		    return getFixes({buffer: 'function f() {}', 
		                      rule: rule,
		                      expected: "//TODO empty block"}).then(function() {
			                      //TODO empty block
		    });
		});
		
		it("Test no-empty-block-2", function() {
		    var rule = createTestRule('no-empty-block');
		    return getFixes({buffer: 'var f = {f: function() { function q() {}}}', 
		                      rule: rule,
		                      expected: "//TODO empty block"}).then(function() {
			                      //TODO empty block
		    });
		});
		
		it("Test no-empty-block-3", function() {
		    var rule = createTestRule('no-empty-block');
		    return getFixes({buffer: 'var f = { f: function() {}};', 
		                      rule: rule,
		                      expected: "//TODO empty block"}).then(function() {
			                      //TODO empty block
		    });
		});
		
		it("Test no-empty-block-4", function() {
		    var rule = createTestRule('no-empty-block');
		    return getFixes({buffer: 'while(f) {}', 
		                      rule: rule,
		                      expected: "//TODO empty block"}).then(function() {
			                      //TODO empty block
		    });
		});
		it("Test no-empty-block-5", function() {
		    var rule = createTestRule('no-empty-block');
		    return getFixes({buffer: 'if(f) {}', 
		                      rule: rule,
		                      expected: "//TODO empty block"}).then(function() {
			                      //TODO empty block
		    });
		});
		it("Test no-empty-block-6", function() {
		    var rule = createTestRule('no-empty-block');
		    return getFixes({buffer: 'if(f) {while(f) {}}', 
		                      rule: rule,
		                      expected: "//TODO empty block"}).then(function() {
			                      //TODO empty block
		    });
		});
		
	//NO-EXTRA-SEMI
		it("Test no-extra-semi-1", function() {
		    var rule = createTestRule('no-extra-semi');
		    return getFixes({buffer: 'function f() {};', 
		                      rule: rule,
		                      expected: ""}).then(function() {
			                      //TODO empty block
		    });
		});
		it("Test no-extra-semi-2", function() {
		    var rule = createTestRule('no-extra-semi');
		    return getFixes({buffer: 'var foo = 10;;', 
		                      rule: rule,
		                      expected: ""}).then(function() {
			                      //TODO empty block
		    });
		});
		it("Test no-extra-semi-3", function() {
		    var rule = createTestRule('no-extra-semi');
		    return getFixes({buffer: 'var foo = {};;', 
		                      rule: rule,
		                      expected: ""}).then(function() {
			                      //TODO empty block
		    });
		});
		it("Test no-extra-semi-4", function() {
		    var rule = createTestRule('no-extra-semi');
		    return getFixes({buffer: ';', 
		                      rule: rule,
		                      expected: ""}).then(function() {
			                      //TODO empty block
		    });
		});
	//NO-FALLTHROUGH
		it("Test no-fallthrough-1", function() {
		    var rule = createTestRule('no-fallthrough');
		    return getFixes({buffer: 'switch(num) {case 1:{code();} case 2:{}}', 
		                      rule: rule,
		                      expected: "//$FALLTHROUGH$"}).then(function() {
			                      //TODO empty block
		    });
		});
		it("Test no-fallthrough-2", function() {
		    var rule = createTestRule('no-fallthrough');
		    return getFixes({buffer: 'switch(num) {case 1:{break;} case 2:{code();} default: {}}', 
		                      rule: rule,
		                      expected: "//$FALLTHROUGH$"}).then(function() {
			                      //TODO empty block
		    });
		});
	//NO-UNDEF
		it("Test no-undef-defined-1", function() {
		    var rule = createTestRule('no-undef');
		    return getFixes({buffer: 'console.log(10);', 
		                      rule: rule,
		                      expected: "/**eslint-env node */"}).then(function() {
			                      //TODO empty block
		    });
		});
		it("Test no-undef-defined-2", function() {
		    var rule = createTestRule('no-undef');
		    return getFixes({buffer: 'foo(10);', 
		                      rule: rule,
		                      expected: "/**globals foo */"}).then(function() {
			                      //TODO empty block
		    });
		});
	});
});
