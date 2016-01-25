/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, mocha*/
/* eslint-disable  missing-nls */
define([
	'javascript/quickFixes',
	'javascript/validator',
	'chai/chai',
	'orion/Deferred',
	'esprima/esprima',
	'javascript/astManager',
	'javascript/cuProvider',
	'javascript/commands/renameCommand',
	'javascript/commands/generateDocCommand',
	'mocha/mocha', //must stay at the end, not a module
], function(QuickFixes, Validator, chai, Deferred, Esprima, ASTManager, CUProvider, RenameCommand, GenerateDocCommand) {
	var assert = chai.assert;
	
	return function(worker) {
		describe('Quick Fix Tests',function() {
			this.timeout(10000);
			before('Reset Tern Server', function() {
				worker.start(); // Reset the tern server state to remove any prior files
			});
			
			/**
			 * @description Sets up the test
			 * 
			 * Supported options include:
			 * -    `buffer` - the source to process
			 * -    `contentType` - the content type to load, defaults to application/javascript if not specified
			 * -    `callback` - the 'done' param from the tests, its required for all worker-based tests
			 * -    `rule` - the rule object. {@link #createTestRule(...)}
			 * -    `expected` - the array of expected fixes
			 * -    `fixid` - the id of the rule to use if not the same as the one created by default - allows testing multifixes
			 * @param {Object} options {buffer, contentType}
			 * @returns {Object} The object with the initialized values
			 */
			function setup(options) {
				var buffer = options.buffer;
				var contentType = options.contentType ? options.contentType : 'application/javascript';
				var astManager = new ASTManager.ASTManager(Esprima);
				var validator = new Validator(worker, CUProvider);
				var state = Object.create(null);
				var loc = contentType === 'text/html' ? 'quickfix_test_script.html' : 'quickfix_test_script.js';
				assert(options.callback, "You must provide a callback for a worker-based test");
				state.callback = options.callback;
				worker.setTestState(state);
				var rule = options.rule;
				validator._enableOnly(rule.id, rule.severity, rule.opts);
				var renameCommand = new RenameCommand.RenameCommand(worker, {setSearchLocation: function(){}});
				var generateDocCommand = new GenerateDocCommand.GenerateDocCommand(astManager, CUProvider);
				var fixComputer = new QuickFixes.JavaScriptQuickfixes(astManager, renameCommand, generateDocCommand);
				var editorContext = {
					/*override*/
					getText: function(start, end) {
						if(typeof start === 'undefined' && typeof end === 'undefined') {
							return new Deferred().resolve(buffer);
						}
						return new Deferred().resolve(buffer.slice(start, end));
					},
					
					setText: function(text, start, end) {
						return new Deferred().resolve(assertFixes(text, start, end, options.expected));
					},
					
					getSelections: function(){
						return new Deferred().resolve([]);
					},
					
					getFileMetadata:function() {
						var o = Object.create(null);
						o.contentType = Object.create(null);
						o.contentType.id = contentType;
						o.location = loc;
						return new Deferred().resolve(o);
					},
					exitLinkedMode: function() {
						return new Deferred().resolve();
					},
					enterLinkedMode: function(linkModel) {
						return new Deferred().resolve(assertLinkedModel(linkModel, options.expected));
					},
					setCaretOffset: function(caretOffset) {
						return new Deferred().resolve(caretOffset);
					}
				};
				return {
					validator: validator,
					fixComputer: fixComputer,
					editorContext: editorContext,
					contentType: contentType,
					loc: loc
				};
			}
		
			/**
			 * @callback from Mocha after each test run
			 */
			afterEach(function() {
				CUProvider.onModelChanging({file: {location: 'quickfix_test_script.js'}});
				CUProvider.onModelChanging({file: {location: 'quickfix_test_script.html'}});
			});
		
			/**
			 * @description Checks the state of the linked models
			 * @param {Object} linkedModel The linked model from the platform
			 * @param {Object} expected The expected linked model from the test
			 * @since 11.0
			 */
			function assertLinkedModel(linkedModel, expected) {
				try {
					assert(expected, "There must be an expected linkedModel");
					assert(expected.groups, "There must be a groups node in the expected linked model");
					assert(Array.isArray(expected.groups), "Groups must be an array in the expected linked model");
					assert(linkedModel, "There must be a linkedModel");
					assert(linkedModel.groups, "There must be a groups node in the linked model");
					assert(Array.isArray(linkedModel.groups), "Groups must be an array in the linked model");
					assert.equal(linkedModel.groups.length, expected.groups.length, "The linked mode groups should be the same length");
					expected.groups.forEach(function(group, index) {
						//groups have data and positions: [{offset, length}]
						var g = linkedModel.groups[index];
						assert.equal(typeof g.data, typeof group.data, "The type of the data of the groups is not the same");
						assert(Array.isArray(g.positions), "There should be a positions array");
						assert(Array.isArray(group.positions), "There must be an expected positions array");
						assert.equal(g.positions.length, group.positions.length, "The position arrays should be the same size");
						group.positions.forEach(function(pos, index2) {
							var p = g.positions[index2];
							assert(p, "There should be a position");
							assert.equal(p.offset, pos.offset, "The position offsets do not match");
							assert.equal(p.length, pos.length, "The position lengths do not match");
						});
					});
					worker.getTestState().callback();
				}
				catch(err) {
					worker.getTestState().callback(err);
				}
			}
		
			/**
			 * @description Runs the validator on the given options and computes fixes for those problems
			 * @param {Object} options {buffer, contentType, rule}
			 * @returns {orion.Promise} The validation promise
			 */
			function getFixes(options) {
				var obj = setup(options);
				return obj.validator.computeProblems(obj.editorContext, {contentType: obj.contentType, rule: options.rule}).then(
					function(problems) {
						try {
							var pbs = problems.problems;
							var annot = pbs[0];
							if(options.pid) {
								for(var i = 0; i < pbs.length; i++) {
									if(pbs[i].id === options.pid) {
										annot = pbs[i];
										break;
									}
								}
								assert(i !== pbs.length, "Did not find any problems for the expected id: "+ options.pid);
							} else {
								assert(pbs, "There should always be problems");
								if (Array.isArray(options.expected)){
									assert.equal(pbs.length, options.expected.length, 'Number of problems found (' + pbs.length + ') does not match expected');
								} else {
									assert.equal(pbs.length, 1, 'Expected only one problem per test');
								}
								assert(annot.id, "No problem id is reported");
								assert(annot.id.indexOf(options.rule.id) === 0, "The problem id should start with the enabled rule id");
							}
							annot.title = annot.description;
							if(options.fixid) {
								annot.fixid = options.fixid;
							}
							var annotations;
							if (Array.isArray(options.expected)){
								annotations = pbs;
								for (i=0; i<annotations.length; i++) {
									annotations[i].title = annotations[i].description;
								}
							}
							return obj.fixComputer.execute(obj.editorContext, {annotation: annot, annotations: annotations, input: obj.loc}).then(function(result) {
									if (result === null) {
										worker.getTestState().callback();
									}
								},
								function(err) {
									if(err instanceof Error) {
										worker.getTestState().callback(err);
									} else if(typeof err.Message === 'string') {
										worker.getTestState().callback(err.Message);
									} else {
										worker.getTestState().callback("Test rejected with unknown error");
									}
								});
						}
						catch(err) {
							worker.getTestState().callback(err);
						}
					},
					function (error) {
							worker.getTestState().callback(error);
					});
			}
		
			/**
			 * @description Compares the computed fixes set against the expected ones
			 * @param {Array.<orion.Fix>} computed The computed set of fixes
			 * @param {Array.<Object>} expected The expected set of fixes
			 */
			function assertFixes(computed, start, end, expected) {
				try {
					assert(computed !== null && typeof computed !== 'undefined', 'There should be fixes');
					if (Array.isArray(expected)){
						assert(Array.isArray(computed.text), "Expected multiple quick fix text edits");
						assert(Array.isArray(computed.selection), "Expected multiple quick fix selections");
						assert.equal(computed.text.length, expected.length, "Wrong number of quick fix text edits");
						assert.equal(computed.selection.length, expected.length, "Wrong number of quick fix selections");						
						for (var i=0; i<expected.length; i++) {
							assert(computed.text[i].indexOf(expected[i].value) > -1, 'The fix: '+computed[i]+' does not match the expected fix of: '+expected[i].value);
							assert.equal(computed.selection[i].start, expected[i].start, 'The fix starts do not match');
							assert.equal(computed.selection[i].end, expected[i].end, 'The fix ends do not match');
						}
					} else {
						assert(computed.indexOf(expected.value) > -1, 'The fix: '+computed+' does not match the expected fix of: '+expected.value);
						assert.equal(start, expected.start, 'The fix starts do not match');
						assert.equal(end, expected.end, 'The fix ends do not match');
					}
					worker.getTestState().callback();
				}
				catch(err) {
					worker.getTestState().callback(err);
				}
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
		//MISSING-DOC
		describe("missing-doc", function() {
			it("function declaration no params", function(done) {
				var rule = createTestRule("missing-doc");
				var expected = {
					value: "\**\n"+
							" * @name a\n"+
							" * @description description\n"+
							" * @returns returns\n"+
							" */\n",
					start: 0,
					end: 0
				};
				return getFixes({
					buffer: "function a() {}",
					rule: rule,
					expected: expected,
					callback: done
				});
			}); 
			it("function declaration params", function(done) {
				var rule = createTestRule("missing-doc");
				var expected = {
					value: "/**\n"+
							" * @name a\n"+
							" * @description description\n"+
							" * @param arg1\n"+
							" * @param arg2\n"+
							" * @returns returns\n"+
							" */\n",
					start: 0,
					end: 0
				};
				return getFixes({
					buffer: "function a(arg1, arg2) {}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("function declaration params - underscore", function(done) {
				var rule = createTestRule("missing-doc");
				var expected = {
					value: "/**\n"+
							" * @name _a\n"+
							" * @description description\n"+
							" * @private\n"+
							" * @param arg1\n"+
							" * @returns returns\n"+
							" */\n",
					start: 0,
					end: 0
				};
				return getFixes({
					buffer: "function _a(arg1) {}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("function expression - member expression", function(done) {
				var rule = createTestRule("missing-doc");
				var expected = {
					value: "/**\n"+
							" * @name f.g\n"+
							" * @description description\n"+
							" * @function\n"+
							" * @returns returns\n"+
							" */\n",
					start: 0,
					end: 0
				};
				return getFixes({
					buffer: "f.g = function() {};",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("function expression - member expression params", function(done) {
				var rule = createTestRule("missing-doc");
				var expected = {
					value: "/**\n"+
							" * @name f.g\n"+
							" * @description description\n"+
							" * @function\n"+
							" * @param arg1\n"+
							" * @param arg2\n"+
							" * @returns returns\n"+
							" */\n",
					start: 0,
					end: 0
				};
				return getFixes({
					buffer: "f.g = function(arg1, arg2) {};",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("function expression - member expression params underscore", function(done) {
				var rule = createTestRule("missing-doc");
				var expected = {
					value: "/**\n"+
							" * @name f._g\n"+
							" * @description description\n"+
							" * @function\n"+
							" * @private\n"+
							" * @param arg1\n"+
							" * @param arg2\n"+
							" * @returns returns\n"+
							" */\n",
					start: 0,
					end: 0
				};
				return getFixes({
					buffer: "f._g = function(arg1, arg2) {};",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("function expression - object decl", function(done) {
				var rule = createTestRule("missing-doc");
				var expected = {
					value: "/**\n"+
							" * @name one\n"+
							" * @description description\n"+
							" * @function\n"+
							" * @returns returns\n"+
							" */\n",
					start: 9,
					end: 9
				};
				return getFixes({
					buffer: "var o = {one: function() {}};",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("function expression - object decl params", function(done) {
				var rule = createTestRule("missing-doc");
				var expected = {
					value: "/**\n"+
							" * @name one\n"+
							" * @description description\n"+
							" * @function\n"+
							" * @param arg1\n"+
							" * @param arg2\n"+
							" * @returns returns\n"+
							" */\n",
					start: 9,
					end: 9
				};
				return getFixes({
					buffer: "var o = {one: function(arg1, arg2) {}};",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("function expression - object decl params underscore", function(done) {
				var rule = createTestRule("missing-doc");
				var expected = {
					value: "/**\n"+
							" * @name _one\n"+
							" * @description description\n"+
							" * @function\n"+
							" * @private\n"+
							" * @param arg1\n"+
							" * @param arg2\n"+
							" * @returns returns\n"+
							" */\n",
					start: 9,
					end: 9
				};
				return getFixes({
					buffer: "var o = {_one: function(arg1, arg2) {}};",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
		});
		//CURLY
		describe("curly", function() {
			it("simple if", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { foo(); }",
					start: 11,
					end: 18
				};
				return getFixes({
					buffer: "if(foo > 2) foo();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple if line break", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\nfoo();\n}",
					start: 11,
					end: 18
				};
				return getFixes({
					buffer: "if(foo > 2)\nfoo();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple if line break and spacing", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\n\tfoo();\n}",
					start: 11,
					end: 19
				};
				return getFixes({
					buffer: "if(foo > 2)\n\tfoo();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple if line break and tabs", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\n\t\tfoo();\n\t}",
					start: 12,
					end: 21
				};
				return getFixes({
					buffer: "\tif(foo > 2)\n\t\tfoo();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple if trailing same line statements", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { foo(); }",
					start: 11,
					end: 18
				};
				return getFixes({
					buffer: "if(foo > 2) foo(); bar();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple if trailing same line comments", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: "{ foo(); }",
					start: 11,
					end: 18
				};
				return getFixes({
					buffer: "if(foo > 2) foo(); //comment",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple if trailing statements", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\nfoo(); //comment\n}",
					start: 11,
					end: 28
				};
				return getFixes({
					buffer: "if(foo > 2)\nfoo(); //comment",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple if-else", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { bar(); }",
					start: 20,
					end: 27
				};
				return getFixes({
					buffer: "if(foo) {foo()} else bar();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple if-else trailing statements", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { bar(); }",
					start: 20,
					end: 27
				};
				return getFixes({
					buffer: "if(foo) {foo()} else bar(); foo();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple if-else trailing same line comments", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { bar(); }",
					start: 20,
					end: 27
				};
				return getFixes({
					buffer: "if(foo) {foo()} else bar(); foo(); //comment",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple if-else trailing line statements", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\nbar();\n}",
					start: 20,
					end: 27
				};
				return getFixes({
					buffer: "if(foo) {foo()} else\nbar(); foo(); //comment",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple with", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { bar(); }",
					start: 9,
					end: 16
				};
				return getFixes({
					buffer: "with(foo) bar();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple with trailing statements", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\nbar();\n}",
					start: 9,
					end: 16
				};
				return getFixes({
					buffer: "with(foo)\nbar(); foo();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple with trailing comment", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\nbar(); //comment\n}",
					start: 9,
					end: 26
				};
				return getFixes({
					buffer: "with(foo)\nbar(); //comment",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple with trailing same line statements", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { v = 34*34/34; }",
					start: 9,
					end: 23
				};
				return getFixes({
					buffer: "with(foo) v = 34*34/34; foo();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple with trailing same line comments", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { v = 34*34/34; }",
					start: 9,
					end: 23
				};
				return getFixes({
					buffer: "with(foo) v = 34*34/34; //comment",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple for", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { if(foo) {foo();} }",
					start: 7,
					end: 24
				};
				return getFixes({
					buffer: "for(;;) if(foo) {foo();}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple for trailing statements", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\nif(foo) {foo();}\n}",
					start: 7,
					end: 24
				};
				return getFixes({
					buffer: "for(;;)\nif(foo) {foo();} bar();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple for trailing comments", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\nif(foo) {foo();} //comment\n}",
					start: 7,
					end: 34
				};
				return getFixes({
					buffer: "for(;;)\nif(foo) {foo();} //comment",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple for trailing same line comments", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: "",
					start: 7,
					end: 24
				};
				return getFixes({
					buffer: "for(;;) if(foo) {foo();} //comment",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple for trailing same line statements", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { if(foo) {foo();} }",
					start: 7,
					end: 24
				};
				return getFixes({
					buffer: "for(;;) if(foo) {foo();} bar();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple for-in", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { foo(); }",
					start: 11,
					end: 18
				};
				return getFixes({
					buffer: "for(w in T) foo();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple for-in trailing statements", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\nfoo();\n}",
					start: 11,
					end: 18
				};
				return getFixes({
					buffer: "for(w in T)\nfoo(); bar();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple for-in trailing comments", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\nfoo(); //comment\n}",
					start: 11,
					end: 28
				};
				return getFixes({
					buffer: "for(w in T)\nfoo(); //comment",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple for-in trailing same line comments", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { foo(); }",
					start: 11,
					end: 18
				};
				return getFixes({
					buffer: "for(w in T) foo(); //comment",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple for-in trailing same line statements", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { foo(); }",
					start: 11,
					end: 18
				};
				return getFixes({
					buffer: "for(w in T) foo(); bar();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple while", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { foo(); }",
					start: 11,
					end: 18
				};
				return getFixes({
					buffer: "while(true) foo();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple while trailing statements", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\nfoo();\n}",
					start: 11,
					end: 18
				};
				return getFixes({
					buffer: "while(true)\nfoo(); v = 12*12",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple while trailing comments", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\nfoo(); //comment\n}",
					start: 11,
					end: 28
				};
				return getFixes({
					buffer: "while(true)\nfoo(); //comment",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple while trailing same line statements", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { foo(); }",
					start: 11,
					end: 18
				};
				return getFixes({
					buffer: "while(true) foo(); v = 12*12;",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple while trailing same line comments", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { foo(); }",
					start: 11,
					end: 18
				};
				return getFixes({
					buffer: "while(true) foo(); //comment",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("simple do-while", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " { foo(); }",
					start: 2,
					end: 9
				};
				return getFixes({
					buffer: "do foo(); while(true)",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			//this does not work since we have no recovery support for this kind of broken do-while statement
//			it("simple do-while trailing statements", function(done) {
//				var rule = createTestRule("curly");
//				var expected = {
//					value: "",
//					start: -1,
//					end: -1
//				};
//				return getFixes({
//					buffer: "do foo(); bar(); while(true)",
//					rule: rule,
//					expected: expected,
//					callback: done
//				});
//			});
			it("simple do-while trailing line comments", function(done) {
				var rule = createTestRule("curly");
				var expected = {
					value: " {\nfoo(); // comment\n}",
					start: 2,
					end: 20
				};
				return getFixes({
					buffer: "do\nfoo(); // comment\nwhile(true)",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
		});
		//NO-SHADOW
		describe("no-shadow", function() {
			it("no-shadow 1", function(done) {
				var rule = createTestRule("no-shadow");
				var expected = {
					groups: [
						{data: {}, positions: [{offset: 25, length: 1}]}
					]
				};
				return getFixes({
					buffer: "var a; function f() {var a;}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-shadow 2", function(done) {
				var rule = createTestRule("no-shadow");
				var expected = {
					groups: [
						{data: {}, positions: [{offset: 31, length: 1}, {offset: 34, length: 1}]},
					]
				};
				return getFixes({
					buffer: "var a = 1; function foo() {var a; a = 10}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
		});
		//NO-SHADOW-GLOBAL
		describe("no-shadow-global", function() {
			it("no-shadow-global 1", function(done) {
				var rule = createTestRule("no-shadow-global");
				var expected = {
					groups: [
						{data: {}, positions: [{offset: 27, length: 8}]}
					]
				};
				return getFixes({
					buffer: "/*eslint-env browser*/ var document = 1;",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-shadow-global 2", function(done) {
				var rule = createTestRule("no-shadow-global");
				var expected = {
					groups: [
						{data: {}, positions: [{offset: 27, length: 8}, {offset: 53, length: 8}]}
					]
				};
				return getFixes({
					buffer: "/*eslint-env browser*/ var document = 1; console.log(document);",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
		});
		//NO-EQ-NULL
		describe("no-eq-null", function(){
			it("no-eq-null single 1", function(done) {
				var rule = createTestRule("no-eq-null");
				var expected = {
					value: "!==",
					start: 7,
					end: 9
				};
				return getFixes({
					buffer: "if(foo != null) {}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-eq-null single 2", function(done) {
				var rule = createTestRule("no-eq-null");
				var expected = {
					value: "!==",
					start: 8,
					end: 10
				};
				return getFixes({
					buffer: "if(null != foo) {}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-eq-null single 3", function(done) {
				var rule = createTestRule("no-eq-null");
				var expected = {
					value: "===",
					start: 8,
					end: 10
				};
				return getFixes({
					buffer: "if(null == foo) {}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-eq-null single 4", function(done) {
				var rule = createTestRule("no-eq-null");
				var expected = {
					value: "===",
					start: 7,
					end: 9
				};
				return getFixes({
					buffer: "if(foo == null) {}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-eq-null multi 1", function(done) {
				var rule = createTestRule("no-eq-null");
				var expected = [
						{value: "===", start: 7, end: 9},
						{value: "!==", start: 31, end: 33}
					];
				return getFixes({
					buffer: "if(foo == null) {} else if(bar != null) {}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-eq-null multi 2", function(done) {
				var rule = createTestRule("no-eq-null");
				var expected = [
						{value: "===", start: 8, end: 10},
						{value: "!==", start: 32, end: 34}
					];
				return getFixes({
					buffer: "if(null == foo) {} else if(null != bar) {}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
		});
		//NO-UNDEF-INIT
		describe("no-undef-init", function() {
			it("no-undef-init single 1", function(done) {
				var rule = createTestRule("no-undef-init");
				var expected = {
					value: '',
					start: 7,
					end: 19
				};
				return getFixes({
					buffer: "var foo = undefined;",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-undef-init single 2", function(done) {
				var rule = createTestRule("no-undef-init");
				var expected = {
					value: '',
					start: 17,
					end: 29
				};
				return getFixes({
					buffer: "var foo = 10, bar = undefined;",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-undef-init multi", function(done) {
				var rule = createTestRule("no-undef-init");
				var expected = [
						{value: '', start: 17, end: 29},
						{value: '', start: 44, end: 56}
					];
				return getFixes({
					buffer: "var foo = 10, bar = undefined, boz = [], baz = undefined;",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
		});
		//NO-SELF-ASSIGN
		describe("no-self-assign", function() {
			it("no-self-assign single 1", function(done) {
				var rule = createTestRule("no-self-assign");
				var expected = {value:'', start: 14, end: 23};
				return getFixes({
					buffer: "var foo = 10; foo = foo;",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-self-assign single 2", function(done) {
				var rule = createTestRule("no-self-assign");
				var expected = {value:'', start: 14, end: 26};
				return getFixes({
					buffer: "var foo = 10; foo = foo  ;",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-self-assign single rename 1", function(done) {
				var rule = createTestRule("no-self-assign");
				var expected = {
					groups: [
						{data: {}, positions: [{offset: 20, length: 3}]}
					]
				};
				return getFixes({
					buffer: "var foo = 10; foo = foo;",
					rule: rule,
					fixid: 'no-self-assign-rename',
					expected: expected,
					callback: done
				});
			});
			it("no-self-assign single rename 2", function(done) {
				var rule = createTestRule("no-self-assign");
				var expected = {
					groups: [
						{data: {}, positions: [{offset: 20, length: 3}]}
					]
				};
				return getFixes({
					buffer: "var foo = 10; foo = foo  ;",
					rule: rule,
					fixid: 'no-self-assign-rename',
					expected: expected,
					callback: done
				});
			});
			it("no-self-assign multi 1", function(done) {
				var rule = createTestRule("no-self-assign");
				var expected = [
					{value:'', start: 14, end: 23},
					{value:'', start: 40, end: 49}
				];
				return getFixes({
					buffer: "var foo = 10; foo = foo; var bar = foo; bar = bar;",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-self-assign multi 2", function(done) {
				var rule = createTestRule("no-self-assign");
				var expected = [
					{value:'', start: 14, end: 27},
					{value:'', start: 43, end: 55}
				];
				return getFixes({
					buffer: "var foo = 10; foo = foo   ; var bar = foo; bar = bar  ;",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
		});
		//NEW-PARENS
		describe("new-parens", function() {
			it("new-parens 1", function(done) {
				var rule = createTestRule("new-parens");
				var expected = {value: "()", start: 15, end: 15};
				return getFixes({
					buffer: "var v = new Obj;",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("new-parens 2", function(done) {
				var rule = createTestRule("new-parens");
				var expected = {value: "()", start: 12, end: 12};
				return getFixes({
					buffer: "with(new Obj) {}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("new-parens 3", function(done) {
				var rule = createTestRule("new-parens");
				var expected = {value: "()", start: 15, end: 15};
				return getFixes({
					buffer: "var v = new Obj.one;",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("new-parens 4", function(done) {
				var rule = createTestRule("new-parens");
				var expected = {value: "()", start: 23, end: 23};
				return getFixes({
					buffer: "var v = new Obj(new Obj).one;",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
		});
		//NO-DUPE-KEYS
		describe("no-dupe-keys", function() {
			it("no-dupe-keys - rename 1", function(done) {
				var rule = createTestRule("no-dupe-keys");
				var expected = {
					groups: [
						{data: {}, positions: [{offset: 18, length: 3}]}
					]
				};
				return getFixes({
					buffer: "var v = {one: {}, one:{}};",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-dupe-keys - rename 2", function(done) {
				var rule = createTestRule("no-dupe-keys");
				var expected = {
					groups: [
						{data: {}, positions: [{offset: 20, length: 5}]}
					]
				};
				return getFixes({
					buffer: "var v = {'one': {}, 'one':{}};",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-dupe-keys - rename 3", function(done) {
				var rule = createTestRule("no-dupe-keys");
				var expected = {
					groups: [
						{data: {}, positions: [{offset: 27, length: 5}]}
					]
				};
				return getFixes({
					buffer: "var v = {one: {}, two: {}, 'one':{}};",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
		});
		//NO-DEBUGGER
		describe("no-debugger", function() {
			it("no-debugger no semicolon", function(done) {
				var rule = createTestRule("no-debugger");
				var expected = {
					value: "",
					start: 0,
					end: 8
				};
				return getFixes({
					buffer: "debugger",
					rule: rule, 
					expected: expected,
					callback: done
				});
			});
			it("no-debugger semicolon", function(done) {
				var rule = createTestRule("no-debugger");
				var expected = {
					value: "",
					start: 0,
					end: 9
				};
				return getFixes({
					buffer: "debugger;",
					rule: rule, 
					expected: expected,
					callback: done
				});
			});
			it("no-debugger no semicolon multi", function(done) {
				var rule = createTestRule("no-debugger");
				var expected = [
						{value: "", start: 0, end: 8},
						{value: "", start: 9, end: 17}
				];
				return getFixes({
					buffer: "debugger\ndebugger",
					rule: rule, 
					expected: expected,
					callback: done
				});
			});
			it("no-debugger semicolon multi", function(done) {
				var rule = createTestRule("no-debugger");
				var expected = [
						{value: "", start: 0, end: 9},
						{value: "", start: 10, end: 19}
				];
				return getFixes({
					buffer: "debugger;\ndebugger;",
					rule: rule, 
					expected: expected,
					callback: done
				});
			});
			it("no-debugger semicolon mixed multi", function(done) {
				var rule = createTestRule("no-debugger");
				var expected = [
						{value: "",	start: 0, end: 8}, 
						{value: "", 	start: 9, end: 18},
						{value: "", 	start: 19, end: 27}
				];
				return getFixes({
					buffer: "debugger\ndebugger;\ndebugger",
					rule: rule, 
					expected: expected,
					callback: done
				});
			});
		});
		describe("no-new-wrappers", function() {
			it("no-new-wrapper remove new, Math", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'Math',
					start: 8,
					end: 18
				};
				return getFixes({
					buffer: "var n = new Math();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper remove new, JSON", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'JSON',
					start: 8,
					end: 18
				};
				return getFixes({
					buffer: "var n = new JSON();",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper remove new, String 1", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '',
					start: 8,
					end: 12
				};
				return getFixes({
					buffer: "var n = new String(\"one\");",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper remove new, String spaces 1", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '',
					start: 8,
					end: 15
				};
				return getFixes({
					buffer: "var n = new    String(\"one\");",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper remove new, String spaces 2", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '',
					start: 8,
					end: 15
				};
				return getFixes({
					buffer: "var n =    new String(\"one\");",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper remove new, String spaces 3", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '',
					start: 7,
					end: 10
				};
				return getFixes({
					buffer: "var n =new String(\"one\");",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper remove new, Number 1", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '',
					start: 8,
					end: 12
				};
				return getFixes({
					buffer: "var n = new Number(12);",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper remove new, Number spaces 1", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '',
					start: 8,
					end: 15
				};
				return getFixes({
					buffer: "var n = new    Number(12);",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper remove new, Number spaces 2", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '',
					start: 8,
					end: 15
				};
				return getFixes({
					buffer: "var n =    new Number(12);",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper remove new, Number spaces 3", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '',
					start: 7,
					end: 10
				};
				return getFixes({
					buffer: "var n =new Number(12);",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper remove new, Boolean 1", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '',
					start: 8,
					end: 12
				};
				return getFixes({
					buffer: "var n = new Boolean(true);",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper remove new, Boolean spaces 1", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '',
					start: 8,
					end: 15
				};
				return getFixes({
					buffer: "var n = new    Boolean(false);",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper remove new, Boolean spaces 2", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '',
					start: 8,
					end: 15
				};
				return getFixes({
					buffer: "var n =    new Boolean(true);",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper remove new, Boolean spaces 3", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '',
					start: 7,
					end: 10
				};
				return getFixes({
					buffer: "var n =new Boolean(false);",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, String 1", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '"one"',
					start: 8,
					end: 25
				};
				return getFixes({
					buffer: 'var n = new String("one");',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, String 2", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '""',
					start: 8,
					end: 22
				};
				return getFixes({
					buffer: 'var n = new String("");',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Math", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'Math',
					start: 8,
					end: 18
				};
				return getFixes({
					buffer: 'var n = new Math();',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Math", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'JSON',
					start: 8,
					end: 18
				};
				return getFixes({
					buffer: 'var n = new JSON();',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Number 1", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '13',
					start: 8,
					end: 22
				};
				return getFixes({
					buffer: 'var n = new Number(13);',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Number 2", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '0',
					start: 8,
					end: 20
				};
				return getFixes({
					buffer: 'var n = new Number();',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, non-number to Number 1", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'NaN',
					start: 8,
					end: 29
				};
				return getFixes({
					buffer: 'var n = new Number(undefined);',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, non-number to Number 2", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'NaN',
					start: 8,
					end: 23
				};
				return getFixes({
					buffer: 'var n = new Number(NaN);',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, non-number to Number 3", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '0',
					start: 8,
					end: 22
				};
				return getFixes({
					buffer: 'var n = new Number("");',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, non-number to Number 4", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '0',
					start: 8,
					end: 23
				};
				return getFixes({
					buffer: 'var n = new Number("0");',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, non-number to Number 5", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '1234',
					start: 8,
					end: 26
				};
				return getFixes({
					buffer: 'var n = new Number("1234");',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, non-number to Number 6", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: '0',
					start: 8,
					end: 24
				};
				return getFixes({
					buffer: 'var n = new Number(null);',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Boolean 1", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'true',
					start: 8,
					end: 25
				};
				return getFixes({
					buffer: 'var n = new Boolean(true);',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Boolean 2", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'false',
					start: 8,
					end: 21
				};
				return getFixes({
					buffer: 'var n = new Boolean();',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Boolean falsey 1", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'false',
					start: 8,
					end: 22
				};
				return getFixes({
					buffer: 'var n = new Boolean(0);',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Boolean falsey 2", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'false',
					start: 8,
					end: 23
				};
				return getFixes({
					buffer: 'var n = new Boolean(-0);',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Boolean falsey 2", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'false',
					start: 8,
					end: 25
				};
				return getFixes({
					buffer: 'var n = new Boolean(null);',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Boolean falsey 3", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'false',
					start: 8,
					end: 23
				};
				return getFixes({
					buffer: 'var n = new Boolean("");',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Boolean falsey 4", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'false',
					start: 8,
					end: 23
				};
				return getFixes({
					buffer: "var n = new Boolean('');",
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Boolean falsey 5", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'false',
					start: 8,
					end: 30
				};
				return getFixes({
					buffer: 'var n = new Boolean(undefined);',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Boolean falsey 6", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'false',
					start: 8,
					end: 24
				};
				return getFixes({
					buffer: 'var n = new Boolean(NaN);',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Boolean truthy 1", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'true',
					start: 8,
					end: 25
				};
				return getFixes({
					buffer: 'var n = new Boolean(true);',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Boolean truthy 2", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'true',
					start: 8,
					end: 23
				};
				return getFixes({
					buffer: 'var n = new Boolean(12);',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Boolean truthy 3", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'true',
					start: 8,
					end: 23
				};
				return getFixes({
					buffer: 'var n = new Boolean({});',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
			it("no-new-wrapper convert to literal, Boolean truthy 4", function(done) {
				var rule = createTestRule("no-new-wrappers");
				var expected = {
					value: 'true',
					start: 8,
					end: 26
				};
				return getFixes({
					buffer: 'var n = new Boolean("one");',
					rule: rule,
					fixid: 'no-new-wrappers-literal',
					expected: expected,
					callback: done
				});
			});
		});
		//NO-COMMA-DANGLE
		describe('no-comma-dangle', function() {
			it("Test no-comma-dangle-1", function(callback) {
				var rule = createTestRule('no-comma-dangle');
				var expected = {value: "",
								start: 15, 
								end: 16};
				return getFixes({buffer: 'f({one:1, two:2,});', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-comma-dangle-2", function(callback) {
				var rule = createTestRule('no-comma-dangle');
				var expected = {value: "",
								start: 21, 
								end: 22};
				return getFixes({buffer: 'var f = {one:1, two:2,};', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-comma-dangle-3", function(callback) {
				var rule = createTestRule('no-comma-dangle');
				var expected = {value: "",
								start: 22, 
								end: 23};
				return getFixes({buffer: 'var f = [{one:1, two:2,}];', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-comma-dangle-html-1", function(callback) {
				var rule = createTestRule('no-comma-dangle');
				var expected = {value: "",
								start: 35, 
								end: 36};
				return getFixes({buffer: '<html><head><script>f({one:1, two:2,});</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-comma-dangle-html-2", function(callback) {
				var rule = createTestRule('no-comma-dangle');
				var expected = {value: "",
								start: 41, 
								end: 42};
				return getFixes({buffer: '<html><head><script>var f = {one:1, two:2,};</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-comma-dangle-html-3", function(callback) {
				var rule = createTestRule('no-comma-dangle');
				var expected = {value: "",
								start: 42, 
								end: 43};
				return getFixes({buffer: '<html><head><script>var f = [{one:1, two:2,}];</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-comma-dangle-html-4", function(callback) {
				var rule = createTestRule('no-comma-dangle');
				var expected = {value: "",
								start: 59, 
								end: 60};
				return getFixes({buffer: '<html><head><script></script><script>var f = [{one:1, two:2,}];</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-comma-dangle fix all 1", function(callback) {
				var rule = createTestRule('no-comma-dangle');
				var expected = [
								{value: "",
								start: 15, 
								end: 16},
								{value: "",
								start: 35, 
								end: 36}
								];
				return getFixes({buffer: 'f({one:1, two:2,}); f({one:1, two:2,});', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-comma-dangle fix all 2", function(callback) {
				var rule = createTestRule('no-comma-dangle');
				var expected = [
								{value: "",
								start: 15, 
								end: 16},
								{value: "",
								start: 41, 
								end: 42}
								];
				return getFixes({buffer: 'f({one:1, two:2,});\nvar f = {one:1, two:2,};', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-comma-dangle fix all 3", function(callback) {
				var rule = createTestRule('no-comma-dangle');
				var expected = [
								{value: "",
								start: 15, 
								end: 16},
								{value: "",
								start: 41, 
								end: 42},
								{value: "",
								start: 67, 
								end: 68}
								];
				return getFixes({buffer: 'f({one:1, two:2,}); var f = {one:1, two:2,}; var f = [{one:1, two:2,}];', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
		});
		//NO-EMPTY-BLOCK
		describe("no-empty-block", function() {
			it("Test no-empty-block-1", function(callback) {
				var rule = createTestRule('no-empty-block');
				var expected = {value: "//TODO empty block",
								start: 14, 
								end: 14};
				return getFixes({buffer: 'function f() {}', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			
			it("Test no-empty-block-2",function(callback) {
				var rule = createTestRule('no-empty-block');
				var expected = {value: "//TODO empty block",
								start: 39, 
								end: 39};
				return getFixes({buffer: 'var f = {f: function() { function q() {}}}', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			
			it("Test no-empty-block-3",function(callback) {
				var rule = createTestRule('no-empty-block');
				var expected = {value: "//TODO empty block",
								start: 25, 
								end: 25};
				return getFixes({buffer: 'var f = { f: function() {}};', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			
			it("Test no-empty-block-4",function(callback) {
				var rule = createTestRule('no-empty-block');
				var expected = {value: "//TODO empty block",
								start: 10, 
								end: 10};
				return getFixes({buffer: 'while(f) {}', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-empty-block-5",function(callback) {
				var rule = createTestRule('no-empty-block');
				var expected = {value: "//TODO empty block",
								start: 7, 
								end: 7};
				return getFixes({buffer: 'if(f) {}', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-empty-block-6",function(callback) {
				var rule = createTestRule('no-empty-block');
				var expected = {value: "//TODO empty block",
								start: 17, 
								end: 17};
				return getFixes({buffer: 'if(f) {while(f) {}}', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-empty-block-html-1",function(callback) {
				var rule = createTestRule('no-empty-block');
				var expected = {value: "//TODO empty block",
								start: 34, 
								end: 34};
				return getFixes({buffer: '<html><head><script>function f() {}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			
			it("Test no-empty-block-html-2",function(callback) {
				var rule = createTestRule('no-empty-block');
				var expected = {value: "//TODO empty block",
								start: 59, 
								end: 59};
				return getFixes({buffer: '<html><head><script>var f = {f: function() { function q() {}}}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			
			it("Test no-empty-block-html-3",function(callback) {
				var rule = createTestRule('no-empty-block');
				var expected = {value: "//TODO empty block",
								start: 45, 
								end: 45};
				return getFixes({buffer: '<html><head><script>var f = { f: function() {}};</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			
			it("Test no-empty-block-html-4",function(callback) {
				var rule = createTestRule('no-empty-block');
				var expected = {value: "//TODO empty block",
								start: 30, 
								end: 30};
				return getFixes({buffer: '<html><head><script>while(f) {}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-empty-block-html-5",function(callback) {
				var rule = createTestRule('no-empty-block');
				var expected = {value: "//TODO empty block",
								start: 27, 
								end: 27};
				return getFixes({buffer: '<html><head><script>if(f) {}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-empty-block-html-6",function(callback) {
				var rule = createTestRule('no-empty-block');
				var expected = {value: "//TODO empty block",
								start: 37, 
								end: 37};
				return getFixes({buffer: '<html><head><script>if(f) {while(f) {}}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-empty-block-html-7",function(callback) {
				var rule = createTestRule('no-empty-block');
				var expected = {value: "//TODO empty block",
								start: 54, 
								end: 54};
				return getFixes({buffer: '<html><head><script></script><script>if(f) {while(f) {}}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
		});
		//NO-EXTRA-SEMI
		describe('no-extra-semi', function(){
			it("Test no-extra-semi-1",function(callback) {
				var rule = createTestRule('no-extra-semi');
				 var expected = {value: "",
								start: 15, 
								end: 16};
				return getFixes({buffer: 'function f() {};', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-extra-semi-2",function(callback) {
				var rule = createTestRule('no-extra-semi');
				var expected = {value: "",
								start: 13, 
								end: 14};
				return getFixes({buffer: 'var foo = 10;;', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-extra-semi-3",function(callback) {
				var rule = createTestRule('no-extra-semi');
				var expected = {value: "",
								start: 13, 
								end: 14};
				return getFixes({buffer: 'var foo = {};;', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-extra-semi-4",function(callback) {
				var rule = createTestRule('no-extra-semi');
				var expected = {value: "",
								start: 0, 
								end: 1};
				return getFixes({buffer: ';', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-extra-semi-html-1",function(callback) {
				var rule = createTestRule('no-extra-semi');
				 var expected = {value: "",
								start: 35, 
								end: 36};
				return getFixes({buffer: '<html><head><script>function f() {};</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-extra-semi-html-2",function(callback) {
				var rule = createTestRule('no-extra-semi');
				var expected = {value: "",
								start: 33, 
								end: 34};
				return getFixes({buffer: '<html><head><script>var foo = 10;;</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-extra-semi-html-3",function(callback) {
				var rule = createTestRule('no-extra-semi');
				var expected = {value: "",
								start: 33, 
								end: 34};
				return getFixes({buffer: '<html><head><script>var foo = {};;</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-extra-semi-html-4",function(callback) {
				var rule = createTestRule('no-extra-semi');
				var expected = {value: "",
								start: 20, 
								end: 21};
				return getFixes({buffer: '<html><head><script>;</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-extra-semi-html-5",function(callback) {
				var rule = createTestRule('no-extra-semi');
				var expected = {value: "",
								start: 37, 
								end: 38};
				return getFixes({buffer: '<html><head><script></script><script>;</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-extra-semi fix all 1",function(callback) {
				var rule = createTestRule('no-extra-semi');
				 var expected = [
				 				{value: "",
								start: 15, 
								end: 16},
								{value: "",
								start: 32, 
								end: 33}
								];
				return getFixes({buffer: 'function f() {}; function g() {};', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-extra-semi fix all 2",function(callback) {
				var rule = createTestRule('no-extra-semi');
				 var expected = [
				 				{value: "",
								start: 11, 
								end: 12},
								{value: "",
								start: 12, 
								end: 13},
								{value: "",
								start: 13, 
								end: 14}
								];
				return getFixes({buffer: 'var a = 10;;;;', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-extra-semi fix all 3",function(callback) {
				var rule = createTestRule('no-extra-semi');
				 var expected = [
				 				{value: "",
								start: 14, 
								end: 15},
								{value: "",
								start: 15, 
								end: 16},
								{value: "",
								start: 16, 
								end: 17}
								];
				return getFixes({buffer: 'function f(){};;;', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-extra-semi fix all 4",function(callback) {
				var rule = createTestRule('no-extra-semi');
				 var expected = [
				 				{value: "",
								start: 0, 
								end: 1},
								{value: "",
								start: 17, 
								end: 18},
								{value: "",
								start: 29, 
								end: 30},
								{value: "",
								start: 42, 
								end: 43}
								];
				return getFixes({buffer: '; function f() {}; var a = 0;; var b = {};;', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			
			
			it("Test no-extra-semi-2",function(callback) {
				var rule = createTestRule('no-extra-semi');
				var expected = {value: "",
								start: 13, 
								end: 14};
				return getFixes({buffer: 'var foo = 10;;', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-extra-semi-3",function(callback) {
				var rule = createTestRule('no-extra-semi');
				var expected = {value: "",
								start: 13, 
								end: 14};
				return getFixes({buffer: 'var foo = {};;', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-extra-semi-4",function(callback) {
				var rule = createTestRule('no-extra-semi');
				var expected = {value: "",
								start: 0, 
								end: 1};
				return getFixes({buffer: ';', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			
			
			
		});
		//NO-FALLTHROUGH
		describe("no-fallthrough", function() {
			it("Test no-fallthrough-1",function(callback) {
				var rule = createTestRule('no-fallthrough');
				var expected = {value: "//$FALLTHROUGH$",
								start: 30, 
								end: 30};
				return getFixes({buffer: 'switch(num) {case 1:{code();} case 2:{}}', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-fallthrough-2",function(callback) {
				var rule = createTestRule('no-fallthrough');
				var expected = {value: "//$FALLTHROUGH$",
								start: 46, 
								end: 46};
				return getFixes({buffer: 'switch(num) {case 1:{break;} case 2:{code();} default: {}}', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-fallthrough-html-1",function(callback) {
				var rule = createTestRule('no-fallthrough');
				var expected = {value: "//$FALLTHROUGH$",
								start: 50, 
								end: 50};
				return getFixes({buffer: '<html><head><script>switch(num) {case 1:{code();} case 2:{}}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-fallthrough-html-2",function(callback) {
				var rule = createTestRule('no-fallthrough');
				var expected = {value: "//$FALLTHROUGH$",
								start: 66, 
								end: 66};
				return getFixes({buffer: '<html><head><script>switch(num) {case 1:{break;} case 2:{code();} default: {}}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-fallthrough-html-3",function(callback) {
				var rule = createTestRule('no-fallthrough');
				var expected = {value: "//$FALLTHROUGH$",
								start: 83, 
								end: 83};
				return getFixes({buffer: '<html><head><script></script><script>switch(num) {case 1:{break;} case 2:{code();} default: {}}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-fallthrough-break-1",function(callback) {
				var rule = createTestRule('no-fallthrough');
				var expected = {value: "break;",
								start: 30, 
								end: 30};
				return getFixes({buffer: 'switch(num) {case 1:{code();} case 2:{}}', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  fixid: 'no-fallthrough-break'});
			});
			it("Test no-fallthrough-break-2",function(callback) {
				var rule = createTestRule('no-fallthrough');
				var expected = {value: "break;",
								start: 46, 
								end: 46};
				return getFixes({buffer: 'switch(num) {case 1:{break;} case 2:{code();} default: {}}', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  fixid: 'no-fallthrough-break'});
			});
			it("Test no-fallthrough-break-html-1",function(callback) {
				var rule = createTestRule('no-fallthrough');
				var expected = {value: "break;",
								start: 50, 
								end: 50};
				return getFixes({buffer: '<html><head><script>switch(num) {case 1:{code();} case 2:{}}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  fixid: 'no-fallthrough-break',
								  contentType: 'text/html'});
			});
			it("Test no-fallthrough-break-html-2",function(callback) {
				var rule = createTestRule('no-fallthrough');
				var expected = {value: "break;",
								start: 66, 
								end: 66};
				return getFixes({buffer: '<html><head><script>switch(num) {case 1:{break;} case 2:{code();} default: {}}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  fixid: 'no-fallthrough-break',
								  contentType: 'text/html'});
			});
			it("Test no-fallthrough-break-html-3",function(callback) {
				var rule = createTestRule('no-fallthrough');
				var expected = {value: "break;",
								start: 83, 
								end: 83};
				return getFixes({buffer: '<html><head><script></script><script>switch(num) {case 1:{break;} case 2:{code();} default: {}}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  fixid: 'no-fallthrough-break',
								  contentType: 'text/html'});
			});
		});
		//NO-NEW-ARRAY
		describe("no-new-array", function() {
			it("test no-new-array single non-number literal param",function(callback) {
				var rule = createTestRule('no-new-array');
				return getFixes({
					buffer: "var ar = new Array('a');",
					rule: rule,
					expected: { value: "['a']", start: 9,  end: 23 },
					callback: callback
				});
			});
			it("test no-new-array multi number literal params",function(callback) {
				var rule = createTestRule('no-new-array');
				return getFixes({
					buffer: "var ar = new Array(1, 2, 3);",
					rule: rule,
					expected: { value: "[1, 2, 3]", start: 9,  end: 27 },
					callback: callback
				});
			});
			it("test no-new-array mixed multi params",function(callback) {
				var rule = createTestRule('no-new-array');
				return getFixes({
					buffer: "var ar = new Array(1, 'd', {});",
					rule: rule,
					expected: { value: "[1, 'd', {}]", start: 9,  end: 30 },
					callback: callback
				});
			});
			it("test no-new-array call expr single non-number literal param",function(callback) {
				var rule = createTestRule('no-new-array');
				return getFixes({
					buffer: "var ar = Array('a');",
					rule: rule,
					expected: { value: "['a']", start: 9,  end: 19 },
					callback: callback
				});
			});
			it("test no-new-array call expr multi number literal params",function(callback) {
				var rule = createTestRule('no-new-array');
				return getFixes({
					buffer: "var ar = Array(1, 2, 3);",
					rule: rule,
					expected: { value: "[1, 2, 3]", start: 9,  end: 23 },
					callback: callback
				});
			});
			it("test no-new-array call expr mixed multi params",function(callback) {
				var rule = createTestRule('no-new-array');
				return getFixes({
					buffer: "var ar = Array(1, 'd', {});",
					rule: rule,
					expected: { value: "[1, 'd', {}]", start: 9,  end: 26 },
					callback: callback
				});
			});
		});
		//NO-THROW-LITERAL
		describe("no-throw-literal", function() {
			it("Test no-throw-literal-number",function(callback) {
				var rule = createTestRule('no-throw-literal');
				return getFixes({
					buffer: 'throw 1',
					rule: rule,
					expected: { value: "new Error(1)", start: 6,  end: 7 },
					callback: callback
				});
			});
			it("Test no-throw-literal-string",function(callback) {
				var rule = createTestRule('no-throw-literal');
				return getFixes({
					buffer: 'throw "fizz buzz"',
					rule: rule,
					expected: { value: "new Error(\"fizz buzz\")", start: 6,  end: 17 },
					callback: callback
				});
			});
			it("Test no-throw-literal-ArrayExpression",function(callback) {
				var rule = createTestRule('no-throw-literal');
				return getFixes({
					buffer: 'throw [1,  2]',
					rule: rule,
					expected: { value: "new Error([1,  2])", start: 6,  end: 13 },
					callback: callback
				});
		   });
		});
		//NO-RESERVED-KEYS
		describe("no-reserved-keys", function() {
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=469966
			 */
			it("Test no-reserved-keys-fix-1",function(callback) {
				var rule = createTestRule('no-reserved-keys');
				var expected = {value: '"public"',
								start: 11,
								end: 17
								};
				return getFixes({buffer: 'var foo = {public: 1};',
									rule: rule,
									expected: expected,
									callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=469966
			 */
			it("Test no-reserved-keys-fix-2",function(callback) {
				var rule = createTestRule('no-reserved-keys');
				var expected = {value: '"enum"',
								start: 24,
								end: 28
								};
				return getFixes({buffer: 'var foo = {"public": 1, enum:2};',
									rule: rule,
									expected: expected,
									callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=469966
			 */
			it("Test no-reserved-keys-fix-3",function(callback) {
				var rule = createTestRule('no-reserved-keys');
				var expected = {value: '"break"',
								start: 34,
								end: 39
								};
				return getFixes({buffer: 'var foo = {"public": 1, "enum":2, break: function(){}};',
									rule: rule,
									expected: expected,
									callback: callback});
			});
			it("Test no-reserved-keys multi 1", function(done) {
				var rule = createTestRule("no-reserved-keys");
				var expected = [
					{value: '"void"', start: 9, end: 13},
					{value: '"in"', start: 18, end: 20}
				];
				return getFixes({
					buffer: "var v = {void: {},in: {}};",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
		});
		//NO-UNDEF
		describe("no-undef", function() {
			 /**
			  * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=458567
			  */
			 it("Test no-undef-defined-existing-doc",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "/*globals aa:true */",
								start: 0, 
								end: 0};
				return getFixes({buffer: '/** @returns {Object} */ function f() {aa = 10;}', 
									rule: rule,
									expected: expected,
									callback: callback});
			});
			/**
			  * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=458567
			  */
			 it("Test no-undef-defined-existing-doc",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "/*globals aa:true */",
								start: 25, 
								end: 25};
				return getFixes({buffer: '/** just some comment */ function f() {aa = 10;}', 
									rule: rule,
									expected: expected,
									callback: callback});
			});
			/**
			  * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=458567
			  */
			 it("Test no-undef-defined-existing-doc",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "/*globals Foo */",
								start: 0, 
								end: 0};
				return getFixes({buffer: '/** @returns {Object} */ Foo["bar"] =function() {};', 
									rule: rule,
									expected: expected,
									callback: callback});
			});
			/**
			  * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=458567
			  */
			 it("Test no-undef-defined-existing-doc",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "/*globals Foo */",
								start: 25, 
								end: 25};
				return getFixes({buffer: '/** just some comment */ Foo["bar"] =function() {};', 
								rule: rule,
								expected: expected,
								callback: callback});
			});
			it("Test no-undef-defined-1",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "/*eslint-env node */",
								start: 0, 
								end: 0};
				return getFixes(
								{buffer: 'console.log(10);', 
								rule: rule,
								expected: expected,
								callback: callback});
			});
			it("Test no-undef-defined-2",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "/*globals foo */",
								start: 0, 
								end: 0};
				return getFixes(
								{buffer: 'foo(10);', 
								rule: rule,
								expected: expected,
								callback: callback});
			});
			it("Test no-undef-defined-3",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "globals foo bar",
								start: 2, 
								end: 14};
				return getFixes(
								{buffer: '/*globals foo */ foo(10); bar();', 
								rule: rule,
								expected: expected,
								callback: callback});
			});
			it("Test no-undef-defined-4",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "globals bar foo:true",
								start: 2, 
								end: 13};
				return getFixes({buffer: '/*globals bar*/ foo++; bar();', 
									rule: rule,
									expected: expected,
									callback: callback});
			});
			it("Test no-undef-defined-5",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "globals bar foo:true",
								start: 2, 
								end: 13};
				return getFixes({buffer: '/*globals bar*/ foo = bar; bar();', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-undef-defined-eslint-env-4",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "eslint-env node, browser",
								start: 2, 
								end: 18};
				return getFixes({buffer: '/*eslint-env node */ console.log(10); window.open();', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-undef-defined-indent-1",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "/*globals foo */\n\t\t",
								start: 2, 
								end: 2};
				return getFixes({buffer: '\t\tfoo(10);', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-undef-defined-indent-2",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "/*globals foo */\n    ",
								start: 4, 
								end: 4};
				return getFixes({buffer: '    foo(10);', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-undef-defined-indent-3",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "/*globals foo */\n\t  \t",
								start: 4, 
								end: 4};
				return getFixes({buffer: '\t  \tfoo(10);', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-undef-defined-indent-4",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "/*eslint-env node */\n\t\t",
								start: 2, 
								end: 2};
				return getFixes({buffer: '\t\tconsole.log(10);', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-undef-defined-indent-5",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "/*eslint-env node */\n    ",
								start: 4, 
								end: 4};
				return getFixes({buffer: '    console.log(10);', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-undef-defined-indent-6",function(callback) {
				var rule = createTestRule('no-undef');
				var expected = {value: "/*eslint-env node */\n\t  \t",
								start: 4, 
								end: 4};
				return getFixes({buffer: '\t  \tconsole.log(10);', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
		});	
		//NO-UNUSED-PARAMS
		describe("no-unused-params", function() {
			it("Test no-unused-params-1",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "",
								start: 11,
								end: 12};
				return getFixes({buffer: 'function f(p) {}', 
									rule: rule,
									expected: expected,
									callback: callback});
			});
			it("Test no-unused-params-2",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "",
								start: 14,
								end: 18};
				return getFixes({buffer: 'function f(p, p2, p3) {p(); p3();}', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-unused-params-3",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "",
								start:16,
								end:20};
				return getFixes({buffer: 'function f(p, p2, p3) {p(); p2();}', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-unused-params-4",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "/* @callback */",
								start: 11, 
								end: 11};
				return getFixes({buffer: 'define([], function(p, p2, p3) {p(); p2();});', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-unused-params-5",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "/**\n * @callback\n */",
								start: 10, 
								end: 10};
				return getFixes({buffer: 'var f = { one: function(p, p2, p3) {p(); p2();}};', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461462
			 */
			it("Test no-unused-params-existing-doc-1",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "* @callback\n",
								start: 25, 
								end: 25};
				return getFixes({buffer: 'var f = { /**\n *@see\n *\n */\none: function(p, p2, p3) {p(); p2();}};', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=473790
			 * @since 10.0
			 */
			it("Test no-unused-params-assignment-1",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "* @callback\n",
								start: 4, 
								end: 4};
				return getFixes({buffer: '/** */a.b.c = function(p1) {};', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=473790
			 * @since 10.0
			 */
			it("Test no-unused-params-assignment-2",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "* @callback\n",
								start: 4, 
								end: 4};
				return getFixes({buffer: '/** */f = function(p1) {};', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=473790
			 * @since 10.0
			 */
			it("Test no-unused-params-assignment-3",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "* @callback\n",
								start: 4, 
								end: 4};
				return getFixes({buffer: '/** */var f = function(p1) {};', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=473790
			 * @since 10.0
			 */
			it("Test no-unused-params-assignment-4",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "* @callback\n",
								start: 16, 
								end: 16};
				return getFixes({buffer: 'var f = 10, /** */g = function(p1) {};', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=473790
			 * @since 10.0
			 */
			it("Test no-unused-params-assignment-5",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "/**\n * @callback\n */\n",
								start: 0, 
								end: 0};
				return getFixes({buffer: 'a.b.c = function(p1) {};', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=473790
			 * @since 10.0
			 */
			it("Test no-unused-params-assignment-6",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "/**\n * @callback\n */\n",
								start: 0, 
								end: 0};
				return getFixes({buffer: 'f = function(p1) {};', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=473790
			 * @since 10.0
			 */
			it("Test no-unused-params-assignment-7",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "/**\n * @callback\n */\n",
								start: 0, 
								end: 0};
				return getFixes({buffer: 'var f = function(p1) {};', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=473790
			 * @since 10.0
			 */
			it("Test no-unused-params-assignment-8",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "/**\n * @callback\n */\n",
								start: 12, 
								end: 12};
				return getFixes({buffer: 'var f = 10, g = function(p1) {};', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=467757
			 */
			it("Test no-unused-params-leading-line-comment-1",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "/**\n  * @callback\n  */\n ",
								start: 16, 
								end: 16};
				return getFixes({buffer: 'var f = {//foo\n one: function(p, p2, p3) {p(); p2();}};', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-unused-params-html-1",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "",
								start: 31,
								end: 32};
				return getFixes({buffer: '<html><head><script>function f(p) {}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-unused-params-html-2",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "",
								start: 34,
								end: 38};
				return getFixes({buffer: '<html><head><script>function f(p, p2, p3) {p(); p3();}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-unused-params-html-3",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "",
								start:36,
								end:40};
				return getFixes({buffer: '<html><head><script>function f(p, p2, p3) {p(); p2();}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-unused-params-html-4",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "/* @callback */",
								start: 31, 
								end: 31};
				return getFixes({buffer: '<html><head><script>define([], function(p, p2, p3) {p(); p2();});</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-unused-params-html-5",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "/**\n                     * @callback\n                     */\n                    ",
								start: 30, 
								end: 30};
				return getFixes({buffer: '<html><head><script>var f = { one: function(p, p2, p3) {p(); p2();}};</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461462
			 */
			it("Test no-unused-params-html-existing-doc-1",function(callback) {
				var rule = createTestRule('no-unused-params');
				var expected = {value: "* @callback",
								start: 45, 
								end: 45};
				return getFixes({buffer: '<html><head><script>var f = { /**\n *@see\n *\n */\none: function(p, p2, p3) {p(); p2();}};</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
		});
		//EQEQEQ
		describe('eqeqeq', function(){
			it("Test eqeqeq-1",function(callback) {
				var rule = createTestRule('eqeqeq');
				var expected = {value: "===",
								start: 5, 
								end: 7};
				return getFixes({buffer: 'if(1 == 3) {}', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test eqeqeq-2",function(callback) {
				var rule = createTestRule('eqeqeq');
				var expected = {value: "===",
								start: 12, 
								end: 14};
				return getFixes({buffer: 'if(typeof f == "undefined") {}', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test eqeqeq-3",function(callback) {
				var rule = createTestRule('eqeqeq');
				var expected = {value: "!==",
								start: 5, 
								end: 7};
				return getFixes({buffer: 'if(1 != 3) {}', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test eqeqeq-4",function(callback) {
				var rule = createTestRule('eqeqeq');
				var expected = {value: "!==",
								start: 12, 
								end: 14};
				return getFixes({buffer: 'if(typeof f != "undefined") {}', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test eqeqeq-html-1",function(callback) {
				var rule = createTestRule('eqeqeq');
				var expected = {value: "===",
								start: 25, 
								end: 27};
				return getFixes({buffer: '<html><head><script>if(1 == 3) {}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test eqeqeq-html-2",function(callback) {
				var rule = createTestRule('eqeqeq');
				var expected = {value: "===",
								start: 32, 
								end: 34};
				return getFixes({buffer: '<html><head><script>if(typeof f == "undefined") {}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test eqeqeq-html-3",function(callback) {
				var rule = createTestRule('eqeqeq');
				var expected = {value: "!==",
								start: 25, 
								end: 27};
				return getFixes({buffer: '<html><head><script>if(1 != 3) {}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test eqeqeq-html-4",function(callback) {
				var rule = createTestRule('eqeqeq');
				var expected = {value: "!==",
								start: 32, 
								end: 34};
				return getFixes({buffer: '<html><head><script>if(typeof f != "undefined") {}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test eqeqeq-html-5",function(callback) {
				var rule = createTestRule('eqeqeq');
				var expected = {value: "!==",
								start: 49, 
								end: 51};
				return getFixes({buffer: '<html><head><script></script><script>if(typeof f != "undefined") {}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  contentType: 'text/html'});
			});
			it("Test eqeqeq fix all 1",function(callback) {
				var rule = createTestRule('eqeqeq');
				var expected = [{value: "===",
								start: 5, 
								end: 7},
								{value: "===",
								start: 20,
								end: 22}
								];
				return getFixes({buffer: 'if(1 == 3) {} if (1 == 4) {}', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test eqeqeq fix all 2",function(callback) {
				var rule = createTestRule('eqeqeq');
				var expected = [{value: "!==",
								start: 5, 
								end: 7},
								{value: "!==",
								start: 20,
								end: 22}
								];
				return getFixes({buffer: 'if(1 != 3) {} if (1 != 4) {}', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test eqeqeq fix all 3",function(callback) {
				var rule = createTestRule('eqeqeq');
				var expected = [{value: "===",
								start: 5, 
								end: 7},
								{value: "!==",
								start: 20,
								end: 22}
								];
				return getFixes({buffer: 'if(1 == 3) {} if (1 != 4) {}', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
		});
		describe("no-unreachable", function() {
		//NO-UNREACHABLE
			it("Test no-unreachable-1",function(callback) {
				var rule = createTestRule('no-unreachable');
				var expected = {value: "",
								start: 30, 
								end: 36};
				return getFixes({buffer: 'function foo(){var f;return 1;f = 9;}', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-unreachable-2",function(callback) {
				var rule = createTestRule('no-unreachable');
				var expected = {value: "",
								start: 32, 
								end: 39};
				return getFixes({buffer: 'switch(num) { case 1: {throw e; f = 10;}}', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-unreachable-html-1",function(callback) {
				var rule = createTestRule('no-unreachable');
				var expected = {value: "",
								start: 43, 
								end: 51};
				return getFixes({buffer: '<html><head><script>function f(p) {return; foo = 9;}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-unreachable-html-2",function(callback) {
				var rule = createTestRule('no-unreachable');
				var expected = {value: "",
								start: 52, 
								end: 59};
				return getFixes({buffer: '<html><head><script>switch(num) { case 1: {throw e; f = 10;}}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
		});
		//NO-SPARSE-ARRAYS
		describe("no-sparse-arrays", function() {
			it("Test no-sparse-arrays-1",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 8, 
								end: 16};
				return getFixes({buffer: 'var a = [1, , 2]', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-sparse-arrays-2",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 8, 
								end: 20};
				return getFixes({buffer: 'var a = [1, , 2, , ]', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-sparse-arrays-3",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 8, 
								end: 24};
				return getFixes({buffer: 'var a = [, , 1, , 2, , ]', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-sparse-arrays-4",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 8, 
								end: 27};
				return getFixes({buffer: 'var a = [, , \n1, \n, 2, \n, ]', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-sparse-arrays-5",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2, 3]",
								start: 8, 
								end: 28};
				return getFixes({buffer: 'var a = [, , \n1, \n, 2, \n, 3]', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-sparse-arrays-6",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2, 3]",
								start: 8, 
								end: 41};
				return getFixes({buffer: 'var a = [, ,,,, \n1, \n, , ,, ,\n,, 2, \n, 3]', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-sparse-arrays-7",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 8, 
								end: 20};
				return getFixes({buffer: 'var a = [1, , 2, , ];', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			it("Test no-sparse-arrays-8",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 8, 
								end: 27};
				return getFixes({buffer: 'var a = [, , \n1, \n, 2, \n, ];', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461449
			 */
			it("Test no-sparse-arrays-no-spacing-1",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 8, 
								end: 22};
				return getFixes({buffer: 'var a = [,,\n1,\n,2,\n,,]', 
								  rule: rule,
								  expected: expected,
								  callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461449
			 */
			it("Test no-sparse-arrays-no-spacing-2",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 0, 
								end: 14};
				return getFixes({buffer: '[,,\n1,\n,2,\n,,]', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'no-sparse-arrays'});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461449
			 */
			it("Test no-sparse-arrays-no-spacing-3",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 8, 
								end: 22};
				return getFixes({buffer: 'var a = [,,\n1,\n,2,\n,,];', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			/**
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=461449
			 */
			it("Test no-sparse-arrays-no-spacing-4",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 8, 
								end: 22};
				return getFixes({buffer: 'var a = [,,\n1,\n,2,\n,,]\nvar foo = "bar";', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test no-sparse-arrays-html-1",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 28, 
								end: 36};
				return getFixes({buffer: '<html><head><script>var a = [1, , 2]</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-sparse-arrays-html-2",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 28, 
								end: 40};
				return getFixes({buffer: '<html><head><script>var a = [1, , 2, , ]</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-sparse-arrays-html-3",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 28, 
								end: 44};
				return getFixes({buffer: '<html><head><script>var a = [, , 1, , 2, , ]</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-sparse-arrays-html-4",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 28, 
								end: 46};
				return getFixes({buffer: '<html><head><script>var a = [, , 1, \n, 2, \n, ]</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-sparse-arrays-html-5",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2, 3]",
								start: 28, 
								end: 48};
				return getFixes({buffer: '<html><head><script>var a = [, , \n1, \n, 2, \n, 3]</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-sparse-arrays-html-6",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2, 3]",
								start: 28, 
								end: 61};
				return getFixes({buffer: '<html><head><script>var a = [, ,,,, \n1, \n, , ,, ,\n,, 2, \n, 3]</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-sparse-arrays-html-7",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 28, 
								end: 40};
				return getFixes({buffer: '<html><head><script>var a = [1, , 2, , ];</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test no-sparse-arrays-html-8",function(callback) {
				var rule = createTestRule('no-sparse-arrays');
				var expected = {value: "[1, 2]",
								start: 28, 
								end: 47};
				return getFixes({buffer: '<html><head><script>var a = [, , \n1, \n, 2, \n, ];</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
		});
		//SEMI
		describe("semi", function(){
			it("Test semi-1",function(callback) {
				var rule = createTestRule('semi');
				var expected = {value: ";",
								start: 14, 
								end: 14};
				return getFixes({buffer: 'var a = [1, 2]', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test semi-2",function(callback) {
				var rule = createTestRule('semi');
				var expected = {value: ";",
								start: 5, 
								end: 5};
				return getFixes({buffer: 'foo()', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test semi-3",function(callback) {
				var rule = createTestRule('semi');
				var expected = {value: ";",
								start: 10, 
								end: 10};
				return getFixes({buffer: 'var a = {}', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test semi-html-1",function(callback) {
				var rule = createTestRule('semi');
				var expected = {value: ";",
								start: 34, 
								end: 34};
				return getFixes({buffer: '<html><head><script>var a = [1, 2]</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test semi-html-2",function(callback) {
				var rule = createTestRule('semi');
				var expected = {value: ";",
								start: 25, 
								end: 25};
				return getFixes({buffer: '<html><head><script>foo()</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test semi-html-3",function(callback) {
				var rule = createTestRule('semi');
				var expected = {value: ";",
								start: 30, 
								end: 30};
				return getFixes({buffer: '<html><head><script>var a = {}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  contentType: 'text/html'});
			});
			it("Test semi fix all 1",function(callback) {
				var rule = createTestRule('semi');
				var expected = [
								{value: ";",
								start: 14, 
								end: 14},
								{value: ";",
								start: 29, 
								end: 29}
								];
				return getFixes({buffer: 'var a = [1, 2]\nvar b = [1, 2]', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test semi fix all 2",function(callback) {
				var rule = createTestRule('semi');
				var expected = [
								{value: ";",
								start: 5, 
								end: 5},
								{value: ";",
								start: 11, 
								end: 11}
								];
				return getFixes({buffer: 'foo()\nfoo()', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test semi fix all 3",function(callback) {
				var rule = createTestRule('semi');
				var expected = [
								{value: ";",
								start: 10, 
								end: 10},
								{value: ";",
								start: 21, 
								end: 21}
								];
				return getFixes({buffer: 'var a = {}\nvar a = {}', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
			it("Test semi fix all 3",function(callback) {
				var rule = createTestRule('semi');
				var expected = [
								{value: ";",
								start: 14, 
								end: 14},
								{value: ";",
								start: 20, 
								end: 20},
								{value: ";",
								start: 31, 
								end: 31}
								];
				return getFixes({buffer: 'var a = [1, 2]\nfoo()\nvar a = {}', 
								  rule: rule,
								  expected: expected,
								callback: callback});
			});
		});
		//NO-UNUSED-VARS-UNUSED
		describe("no-unused-vars-unused", function() {
			it("Test no-unused-vars-unused-1",function(callback) {
				var rule = createTestRule('no-unused-vars');
				var expected = {value: "",
								start: 0, 
								end: 6};
				return getFixes({buffer: 'var a;', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'no-unused-vars-unused'});
			});
			it("Test no-unused-vars-unused-2",function(callback) {
				var rule = createTestRule('no-unused-vars');
				var expected = {value: "",
								start: 10, 
								end: 13};
				return getFixes({buffer: 'var a = 10, b;', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'no-unused-vars-unused'});
			});
			it("Test no-unused-vars-unused-3",function(callback) {
				var rule = createTestRule('no-unused-vars');
				var expected = {value: "",
								start: 12, 
								end: 15};
				return getFixes({buffer: 'var a = 10, b, c = 1;', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'no-unused-vars-unused'});
			});
			it("Test no-unused-vars-unused-funcdecl-1",function(callback) {
				var rule = createTestRule('no-unused-vars');
				var expected = {value: "",
								start: 0, 
								end: 15};
				return getFixes({buffer: 'function f() {}', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'no-unused-vars-unused-funcdecl'});
			});
			it("Test no-unused-vars-unused-funcdecl-2",function(callback) {
				var rule = createTestRule('no-unused-vars');
				var expected = {value: "",
								start: 26, 
								end: 41};
				return getFixes({buffer: 'var a = {one: function() {function f() {}}}', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'no-unused-vars-unused-funcdecl'});
			});
			it("Test no-unused-vars-unused-html-1",function(callback) {
				var rule = createTestRule('no-unused-vars');
				var expected = {value: "",
								start: 20, 
								end: 26};
				return getFixes({buffer: '<html><head><script>var a;</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  pid: 'no-unused-vars-unused',
								  contentType: 'text/html'});
			});
			it("Test no-unused-vars-unused-html-2",function(callback) {
				var rule = createTestRule('no-unused-vars');
				var expected = {value: "",
								start: 30, 
								end: 33};
				return getFixes({buffer: '<html><head><script>var a = 10, b;</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  pid: 'no-unused-vars-unused',
								  contentType: 'text/html'});
			});
			it("Test no-unused-vars-unused-html-3",function(callback) {
				var rule = createTestRule('no-unused-vars');
				var expected = {value: "",
								start: 32, 
								end: 35};
				return getFixes({buffer: '<html><head><script>var a = 10, b, c = 1;</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  pid: 'no-unused-vars-unused',
								  contentType: 'text/html'});
			});
			it("Test no-unused-vars-unused-funcdecl-html-1",function(callback) {
				var rule = createTestRule('no-unused-vars');
				var expected = {value: "",
								start: 20, 
								end: 35};
				return getFixes({buffer: '<html><head><script>function f() {}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  pid: 'no-unused-vars-unused-funcdecl',
								  contentType: 'text/html'});
			});
			it("Test no-unused-vars-unused-funcdecl-html-2",function(callback) {
				var rule = createTestRule('no-unused-vars');
				var expected = {value: "",
								start: 46, 
								end: 61};
				return getFixes({buffer: '<html><head><script>var a = {one: function() {function f() {}}}</script></head></html>', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  pid: 'no-unused-vars-unused-funcdecl',
								  contentType: 'text/html'});
			});
		});
		//NO-MISSING-NLS
		describe("no-missing-nls", function() {
			it("Test missing-nls-1", function(callback) {
				var rule = createTestRule('missing-nls');
				var expected = {value: " //$NON-NLS-1$",
								start: 12, 
								end: 12};
				return getFixes({buffer: 'var a = "a";', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'missing-nls'});
			});
			it("Test missing-nls-2",function(callback) {
				var rule = createTestRule('missing-nls');
				var expected = {value: " //$NON-NLS-2$",
								start: 39, 
								end: 39};
				return getFixes({buffer: 'var a = "a"; var b = "b"; //$NON-NLS-1$', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  pid: 'missing-nls'});
			});
			it("Test missing-nls-3",function(callback) {
				var rule = createTestRule('missing-nls');
				var expected = {value: " //$NON-NLS-1$",
								start: 39, 
								end: 39};
				return getFixes({buffer: 'var a = "a"; var b = "b"; //$NON-NLS-2$', 
								  rule: rule,
								  expected: expected,
								callback: callback,
								  pid: 'missing-nls'});
			});
			it("Test missing-nls multi 1",function(callback) {
				var rule = createTestRule('missing-nls');
				var expected = [
					{value: " //$NON-NLS-1$", start: 33, end: 33},
					{value: " //$NON-NLS-2$", start: 33, end: 33}
				];
				return getFixes({
					buffer: 'var two = "two", three = "three";',
					rule: rule,
					expected: expected,
					callback: callback
				});
			});
			it("Test missing-nls multi 2",function(callback) {
				var rule = createTestRule('missing-nls');
				var expected = [
					{value: " //$NON-NLS-1$", start: 45, end: 45},
					{value: " //$NON-NLS-2$", start: 45, end: 45},
					{value: " //$NON-NLS-3$", start: 45, end: 45}
				];
				return getFixes({
					buffer: 'var four = "four", five ="five", six = "six";',
					rule: rule,
					expected: expected,
					callback: callback
				});
			});
		});
		//UNNECESSARY-NLS
		describe('unnecessary-nls', function(){
			it("Test unnecessary-nls-1", function(callback) {
				var rule = createTestRule('unnecessary-nls');
				var expected = {value: "",
								start: 10, 
								end: 24};
				return getFixes({buffer: 'var a = 1; //$NON-NLS-0$', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'unnecessary-nls'});
			});
			it("Test unnecessary-nls-2", function(callback) {
				var rule = createTestRule('unnecessary-nls');
				var expected = {value: "",
								start: 10, 
								end: 24};
				return getFixes({buffer: 'var a = 1; //$NON-NLS-1$', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'unnecessary-nls'});
			});
			it("Test unnecessary-nls-3", function(callback) {
				var rule = createTestRule('unnecessary-nls');
				var expected = {value: "",
								start: 10, 
								end: 24};
				return getFixes({buffer: 'var a = 1; //$NON-NLS-2$', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'unnecessary-nls'});
			});
			it("Test unnecessary-nls-4", function(callback) {
				var rule = createTestRule('unnecessary-nls');
				var expected = {value: "",
								start: 13, 
								end: 24};
				return getFixes({buffer: 'var a = 1; //$NON-NLS-1$ foo', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'unnecessary-nls'});
			});
			it("Test unnecessary-nls-5", function(callback) {
				var rule = createTestRule('unnecessary-nls');
				var expected = {value: "",
								start: 26, 
								end: 40};
				return getFixes({buffer: 'var a = "a"; //$NON-NLS-1$ //$NON-NLS-2$', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'unnecessary-nls'});
			});
			it("Test unnecessary-nls-6", function(callback) {
				var rule = createTestRule('unnecessary-nls');
				var expected = {value: "",
								start: 12, 
								end: 26};
				return getFixes({buffer: 'var a = "a"; //$NON-NLS-2$ //$NON-NLS-1$', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'unnecessary-nls'});
			});
			it("Test unnecessary-nls fix all 1", function(callback) {
				var rule = createTestRule('unnecessary-nls');
				var expected = [
								{value: "",
								start: 10, 
								end: 24},
								{value: "",
								start: 35, 
								end: 49},
								];

				return getFixes({buffer: 'var a = 1; //$NON-NLS-0$\nvar b = 1; //$NON-NLS-0$', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'unnecessary-nls'});
			});
			it("Test unnecessary-nls fix all 2", function(callback) {
				var rule = createTestRule('unnecessary-nls');
				var expected = [
								{value: "",
								start: 10, 
								end: 24},
								{value: "",
								start: 24, 
								end: 38},
								];

				return getFixes({buffer: 'var a = 1; //$NON-NLS-0$ //$NON-NLS-1$', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'unnecessary-nls'});
			});
			it("Test unnecessary-nls fix all 3", function(callback) {
				var rule = createTestRule('unnecessary-nls');
				var expected = [
								{value: "",
								start: 12, 
								end: 26},
								{value: "",
								start: 40, 
								end: 54},
								];

				return getFixes({buffer: 'var a = "a"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-9$', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'unnecessary-nls'});
			});
			it("Test unnecessary-nls fix all 4 - careful whitespace removal", function(callback) {
				var rule = createTestRule('unnecessary-nls');
				var expected = [
								{value: "",
								start: 11, 
								end: 25},
								{value: "",
								start: 25, 
								end: 40},
								];

				return getFixes({buffer: 'var v = 10; //$NON-NLS-1$  //$NON-NLS-2$\nvar v2;', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'unnecessary-nls'});
			});
			it("Test unnecessary-nls fix all 5 - careful whitespace removal", function(callback) {
				var rule = createTestRule('unnecessary-nls');
				var expected = [
								{value: "",
								start: 11, 
								end: 25},
								{value: "",
								start: 25, 
								end: 40},
								];

				return getFixes({buffer: 'var v = 10; //$NON-NLS-1$  //$NON-NLS-2$     \nvar v2;', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'unnecessary-nls'});
			});
		});
		//USE-ISNAN
		describe("use-isnan", function() {
			it("Test use-isnan multi fix 1", function(done) {
				var rule = createTestRule("use-isnan");
				var expected = [
					{value: "isNaN(foo)", start: 3,	end: 14},
					{value: "isNaN(bar)", start: 21,	end: 32}
				];
				return getFixes({
					buffer: "if(foo === NaN){} if(NaN === bar){}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("Test use-isnan multi fix 2", function(done) {
				var rule = createTestRule("use-isnan");
				var expected = [
					{value: "isNaN(foo)", start: 3,	end: 14},
					{value: "isNaN(bar)", start: 18,	end: 29}
				];
				return getFixes({
					buffer: "if(foo === NaN || NaN === bar){}",
					rule: rule,
					expected: expected,
					callback: done
				});
			});
			it("Test use-isnan-1",function(callback) {
				var rule = createTestRule('use-isnan');
				var expected = {value: "isNaN(foo)",
								start: 3, 
								end: 14};
				return getFixes({buffer: 'if(foo === NaN){}', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'use-isnan'});
			});
			it("Test use-isnan-2",function(callback) {
				var rule = createTestRule('use-isnan');
				var expected = {value: "isNaN(foo)",
								start: 3, 
								end: 14};
				return getFixes({buffer: 'if(NaN === foo){}', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'use-isnan'});
			});
			it("Test use-isnan-3",function(callback) {
				var rule = createTestRule('use-isnan');
				var expected = {value: "isNaN(foo+23)",
								start: 3, 
								end: 19};
				return getFixes({buffer: 'if((foo+23) === NaN){}', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'use-isnan'});
			});
			it("Test use-isnan-4",function(callback) {
				var rule = createTestRule('use-isnan');
				var expected = {value: "isNaN(foo+23)",
								start: 3, 
								end: 19};
				return getFixes({buffer: 'if(NaN === (foo+23)){}', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'use-isnan'});
			});
			it("Test use-isnan-5",function(callback) {
				var rule = createTestRule('use-isnan');
				var expected = {value: "isNaN(45 === (foo+23))",
								start: 3, 
								end: 28};
				return getFixes({buffer: 'if(NaN === (45 === (foo+23)){}', 
								  rule: rule,
								  expected: expected,
								  callback: callback,
								  pid: 'use-isnan'});
			});
		});
		});
	};
});
