/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, mocha, browser, chai*/
/* eslint-disable missing-nls */
define([
'javascript/ternProjectValidator',
'chai/chai',
'mocha/mocha' //must stay at the end, not a module
], function(Validator, chai) {
	var assert = chai.assert;

	return /* @callback */ function(worker) {
		/**
		 * @description Compares the computed vs. the expected problem arrays
		 * @param {Array.<Object>} problems The computed problems
		 * @param {Array.<Object>} expected The expected problems
		 */
		function assertProblems(problems, expected) {
			assert(problems, "There should be a problems array");
			assert(expected, "There should be an expected problems array");
			assert.equal(problems.length, expected.length, "The actual and expected problem arrays should be the same size");
			problems.forEach(function(pb, i) {
				var p = expected[i];
				assert.equal(pb.id, p.id, "The problem id's should be equal");
				assert.equal(pb.description, p.description, "The problem descriptions should be the same");
				assert.equal(pb.severity, p.severity, "The problem severities should be equal");
				assert.equal(pb.start, p.start, "The problem starts should be equal");
				assert.equal(pb.end, p.end, "The problem ends should be equal");
			});
		}
		function problem(start, end, description) {
			var pb = Object.create(null);
			pb.id = "tern-project-pb";
			pb.severity = 'error';
			pb.start = start;
			pb.end = end;
			pb.description = description;
			return pb;
		}
	
		describe(".tern-project validator tests", function() {
			it("test empty", function() {
				var problems = Validator.validateAST('');
				assertProblems(problems, []);
			});
			it("test empty object", function() {
				var problems = Validator.validateAST('{}');
				assertProblems(problems, []);
			});
			it("test invalid root JSON 1", function() {
				var problems = Validator.validateAST('!');
				assertProblems(problems, []);
			});
			it("test invalid root JSON 2", function() {
				var problems = Validator.validateAST('function f() {}');
				assertProblems(problems, []);
			});
			it("test invalid root JSON 3", function() {
				var problems = Validator.validateAST('undefined');
				assertProblems(problems, []);
			});
			it("test libs", function() {
				var problems = Validator.validateAST('{"libs": ["one"]}');		
				assertProblems(problems, []);
			});
			it("test libs - null", function() {
				var problems = Validator.validateAST('{"libs": null}');		
				assertProblems(problems, [
					problem(9, 13, "'libs' must be an array of strings")
				]);
			});
			it("test libs - undefined", function() {
				var problems = Validator.validateAST('{"libs": undefined}');		
				assertProblems(problems, [
					problem(9, 18, "'libs' must be an array of strings")
				]);
			});
			it("test libs - number", function() {
				var problems = Validator.validateAST('{"libs": 1}');		
				assertProblems(problems, [
					problem(9, 10, "'libs' must be an array of strings")
				]);
			});
			it("test libs - boolean", function() {
				var problems = Validator.validateAST('{"libs": true}');		
				assertProblems(problems, [
					problem(9, 13, "'libs' must be an array of strings")
				]);
			});
			it("test libs - string", function() {
				var problems = Validator.validateAST('{"libs": "hi"}');		
				assertProblems(problems, [
					problem(9, 13, "'libs' must be an array of strings")
				]);
			});
			it("test libs - empty", function() {
				var problems = Validator.validateAST('{"libs": []}');		
				assertProblems(problems, [
					problem(9, 11, "'libs' should not be empty")
				]);			
			});
			it("test libs - all string values", function() {
				var problems = Validator.validateAST('{"libs": ["one", "two", "three"]}');		
				assertProblems(problems, []);
			});
			it("test libs - mixed values", function() {
				var problems = Validator.validateAST('{"libs": ["one", null, 1]}');		
				assertProblems(problems, [
						problem(17, 21, "'libs' entries can only be strings"),
						problem(23, 24, "'libs' entries can only be strings")
					]
				);
			});
			it("test loadEagerly", function() {
				var problems = Validator.validateAST('{"loadEagerly": ["one"]}');		
				assertProblems(problems, []);
			});
			it("test loadEagerly - null", function() {
				var problems = Validator.validateAST('{"loadEagerly": null}');		
				assertProblems(problems, [
					problem(16, 20, "'loadEagerly' must be an array of strings")
				]);
			});
			it("test loadEagerly - undefined", function() {
				var problems = Validator.validateAST('{"loadEagerly": undefined}');		
				assertProblems(problems, [
					problem(16, 25, "'loadEagerly' must be an array of strings")
				]);
			});
			it("test loadEagerly - number", function() {
				var problems = Validator.validateAST('{"loadEagerly": 1}');		
				assertProblems(problems, [
					problem(16, 17, "'loadEagerly' must be an array of strings")
				]);
			});
			it("test loadEagerly - boolean", function() {
				var problems = Validator.validateAST('{"loadEagerly": true}');		
				assertProblems(problems, [
					problem(16, 20, "'loadEagerly' must be an array of strings")
				]);
			});
			it("test loadEagerly - string", function() {
				var problems = Validator.validateAST('{"loadEagerly": "hi"}');		
				assertProblems(problems, [
					problem(16, 20, "'loadEagerly' must be an array of strings")
				]);
			});
			it("test loadEagerly - empty", function() {
				var problems = Validator.validateAST('{"loadEagerly": []}');		
				assertProblems(problems, [
					problem(16, 18, "'loadEagerly' should not be empty")
				]);			
			});
			it("test loadEagerly - all string values", function() {
				var problems = Validator.validateAST('{"loadEagerly": ["one", "two", "three"]}');		
				assertProblems(problems, []);
			});
			it("test loadEagerly - mixed values", function() {
				var problems = Validator.validateAST('{"loadEagerly": ["one", null, 1]}');		
				assertProblems(problems, [
						problem(24, 28, "'loadEagerly' entries can only be strings"),
						problem(30, 31, "'loadEagerly' entries can only be strings")
					]
				);
			});
			it("test dontLoad", function() {
				var problems = Validator.validateAST('{"dontLoad": ["one"]}');		
				assertProblems(problems, []);
			});
			it("test dontLoad - null", function() {
				var problems = Validator.validateAST('{"dontLoad": null}');		
				assertProblems(problems, [
					problem(13, 17, "'dontLoad' must be an array of strings")
				]);
			});
			it("test dontLoad - number", function() {
				var problems = Validator.validateAST('{"dontLoad": 1}');		
				assertProblems(problems, [
					problem(13, 14, "'dontLoad' must be an array of strings")
				]);
			});
			it("test dontLoad - boolean", function() {
				var problems = Validator.validateAST('{"dontLoad": true}');		
				assertProblems(problems, [
					problem(13, 17, "'dontLoad' must be an array of strings")
				]);
			});
			it("test dontLoad - string", function() {
				var problems = Validator.validateAST('{"dontLoad": "hi"}');		
				assertProblems(problems, [
					problem(13, 17, "'dontLoad' must be an array of strings")
				]);
			});
			it("test dontLoad - undefined", function() {
				var problems = Validator.validateAST('{"dontLoad": undefined}');		
				assertProblems(problems, [
					problem(13, 22, "'dontLoad' must be an array of strings")
				]);
			});
			it("test dontLoad - empty", function() {
				var problems = Validator.validateAST('{"dontLoad": []}');		
				assertProblems(problems, [
					problem(13, 15, "'dontLoad' should not be empty")
				]);			
			});
			it("test dontLoad - all string values", function() {
				var problems = Validator.validateAST('{"dontLoad": ["one", "two", "three"]}');		
				assertProblems(problems, []);
			});
			it("test dontLoad - mixed values", function() {
				var problems = Validator.validateAST('{"dontLoad": ["one", null, 1]}');		
				assertProblems(problems, [
						problem(21, 25, "'dontLoad' entries can only be strings"),
						problem(27, 28, "'dontLoad' entries can only be strings")
					]
				);
			});
			it("test ecmaVersion", function() {
				var problems = Validator.validateAST('{"ecmaVersion": 4}');		
				assertProblems(problems, []);
			});
			
			it("test ecmaVersion - undefined", function() {
				var problems = Validator.validateAST('{"ecmaVersion": undefined}');		
				assertProblems(problems, [
					problem(16, 25, "'ecmaVersion' must be a number")
				]);
			});
			it("test ecmaVersion - null", function() {
				var problems = Validator.validateAST('{"ecmaVersion": null}');		
				assertProblems(problems, [
					problem(16, 20, "'ecmaVersion' must be a number")
				]);
			});
			it("test ecmaVersion - boolean", function() {
				var problems = Validator.validateAST('{"ecmaVersion": true}');		
				assertProblems(problems, [
					problem(16, 20, "'ecmaVersion' must be a number")
				]);
			});
			it("test ecmaVersion - []", function() {
				var problems = Validator.validateAST('{"ecmaVersion": []}');		
				assertProblems(problems, [
					problem(16, 18, "'ecmaVersion' must be a number")
				]);
			});
			it("test ecmaVersion - string", function() {
				var problems = Validator.validateAST('{"ecmaVersion": "foo"}');		
				assertProblems(problems, [
					problem(16, 21, "'ecmaVersion' must be a number")
				]);
			});
			it("test dependencyBudget", function() {
				var problems = Validator.validateAST('{"dependencyBudget": 4}');		
				assertProblems(problems, []);
			});
			it("test dependencyBudget - undefined", function() {
				var problems = Validator.validateAST('{"dependencyBudget": undefined}');		
				assertProblems(problems, [
					problem(21, 30, "'dependencyBudget' must be a number")
				]);
			});
			it("test dependencyBudget - null", function() {
				var problems = Validator.validateAST('{"dependencyBudget": null}');		
				assertProblems(problems, [
					problem(21, 25, "'dependencyBudget' must be a number")
				]);
			});
			it("test dependencyBudget - boolean", function() {
				var problems = Validator.validateAST('{"dependencyBudget": true}');		
				assertProblems(problems, [
					problem(21, 25, "'dependencyBudget' must be a number")
				]);
			});
			it("test dependencyBudget - []", function() {
				var problems = Validator.validateAST('{"dependencyBudget": []}');		
				assertProblems(problems, [
					problem(21, 23, "'dependencyBudget' must be a number")
				]);
			});
			it("test dependencyBudget - string", function() {
				var problems = Validator.validateAST('{"dependencyBudget": "foo"}');		
				assertProblems(problems, [
					problem(21, 26, "'dependencyBudget' must be a number")
				]);
			});
			it("test plugins", function() {
				var problems = Validator.validateAST('{"plugins": {"a": {}}}');
				assertProblems(problems, []);
			});
			it("test plugins - empty", function() {
				var problems = Validator.validateAST('{"plugins": {}}');
				assertProblems(problems, []);
			});
			it("test plugins - null", function() {
				var problems = Validator.validateAST('{"plugins": null}');
				assertProblems(problems, [
					problem(12, 16, "'plugins' must be an object")
				]);
			});
			it("test plugins - undefined", function() {
				var problems = Validator.validateAST('{"plugins": undefined}');
				assertProblems(problems, [
					problem(12, 21, "'plugins' must be an object")
				]);
			});
			it("test plugins - boolean", function() {
				var problems = Validator.validateAST('{"plugins": true}');
				assertProblems(problems, [
					problem(12, 16, "'plugins' must be an object")
				]);
			});
			it("test plugins - number", function() {
				var problems = Validator.validateAST('{"plugins": 1337}');
				assertProblems(problems, [
					problem(12, 16, "'plugins' must be an object")
				]);
			});
			it("test plugins - string", function() {
				var problems = Validator.validateAST('{"plugins": "hi"}');
				assertProblems(problems, [
					problem(12, 16, "'plugins' must be an object")
				]);
			});
			it("test plugins - array", function() {
				var problems = Validator.validateAST('{"plugins": []}');
				assertProblems(problems, [
					problem(12, 14, "'plugins' must be an object")
				]);
			});
			it("test plugins value", function() {
				var problems = Validator.validateAST('{"plugins": {"a": {}}}');
				assertProblems(problems, []);
			});
			it("test plugins value - null", function() {
				var problems = Validator.validateAST('{"plugins": {"a": null}}');
				assertProblems(problems, [
					problem(18, 22, "'a' must be an object")
				]);
			});
			it("test plugins value - undefined", function() {
				var problems = Validator.validateAST('{"plugins": {"a": undefined}}');
				assertProblems(problems, [
					problem(18, 27, "'a' must be an object")
				]);
			});
			it("test plugins value - boolean", function() {
				var problems = Validator.validateAST('{"plugins": {"a": true}}');
				assertProblems(problems, [
					problem(18, 22, "'a' must be an object")
				]);
			});
			it("test plugins value - string", function() {
				var problems = Validator.validateAST('{"plugins": {"a": "hi"}}');
				assertProblems(problems, [
					problem(18, 22, "'a' must be an object")
				]);
			});
			it("test plugins value - array", function() {
				var problems = Validator.validateAST('{"plugins": {"a": []}}');
				assertProblems(problems, [
					problem(18, 20, "'a' must be an object")
				]);
			});
			it("test dupe entries - root", function() {
				var problems = Validator.validateAST('{"plugins": {}, "plugins": {}}');
				assertProblems(problems, [
					problem(16, 25, "Duplicate entries are not allowed")
				]);
			});
			it("test dupe entries - plugins", function() {
				var problems = Validator.validateAST('{"plugins": {"a": {}, "b": {}, "a":{}}}');
				assertProblems(problems, [
					problem(31, 34, "Duplicate entries are not allowed")
				]);
			});
		});
	};
});