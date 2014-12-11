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
	'webtools/cssQuickFixes',
	'webtools/cssValidator',
	'chai/chai',
	'orion/Deferred',
	'mocha/mocha', //must stay at the end, not a module
], function(CssQuickFixes, CssValidator, chai, Deferred) {
	var assert = chai.assert;

	describe('CSS Quick Fix Tests', function() {
		
		var validator;
		
		afterEach(function(){
			// Reset the rule severities to defaults
			if (validator){
				validator._restoreRules();
			}
		});
		
		
		/**
		 * @description Sets up the test
		 * @param {Object} options {buffer, contentType}
		 * @returns {Object} The object with the initialized values
		 */
		function setup(options) {
		    var buffer = options.buffer;
		    var contentType = options.contentType ? options.contentType : 'text/css';
			validator = new CssValidator();
			var rule = options.rule;
			validator._enableOnly(rule.id, rule.severity);
			var fixComputer = new CssQuickFixes.CssQuickFixes();
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
    	    // TODO csslint doesn't return end values, see Bug 454946
//    	    assert.equal(start, expected.start, 'The fix location {' + start + ',' + end + '} does not match the expected position {'+ expected.start + ',' + expected.end + '}');
//    	    assert.equal(end, expected.end, 'The fix location {' + start + ',' + end + '} does not match the expected position {'+ expected.start + ',' + expected.end + '}');
	    }
	
	    /**
    	 * @description Creates a test rule object for the test set up
    	 * @param {String} id The id of the rule used to update the preferences in webtools/cssValidator#updated
    	 * @param {Number} severity The severity of the problem or null (which defaults to '2')
    	 * @returns {Object} Returns a new rule object for testing with
    	 */
    	function createTestRule(id, severity) {
	        var rule = Object.create(null);
	        rule.id = id;
	        rule.severity = severity ? severity : 2;
	        return rule;
	    }
	
		it("Test zero-units 1", function() {
		    var rule = createTestRule('zero-units');
		    var expected = {value: "0;",
		                    start: 16, 
		                    end: 19};
		    return getFixes({buffer: 'rule {\n border : 0px;\n}', 
		                      rule: rule,
		                      expected: expected});
		});
		
	});
		
});
