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
/*eslint-env amd, mocha, browser*/
/* eslint-disable missing-nls */
define([
'javascript/astManager',
'javascript/commands/openDeclaration',
'javascript/commands/openImplementation',
'javascript/contentAssist/ternAssist',
'javascript/cuProvider',
'esprima/esprima',
'chai/chai',
'orion/Deferred',
'js-tests/javascript/testingWorker',
'mocha/mocha' //must stay at the end, not a module
], function(ASTManager, OpenDeclaration, OpenImplementation, TernAssist, CUProvider, Esprima, chai, Deferred, TestWorker) {
	var assert = chai.assert;

	var testworker;
	var ternAssist;
	var openImplCommand;
	var openDeclCommand;
	var astManager = new ASTManager.ASTManager(Esprima);
	var jsFile = 'tern_content_assist_test_script.js';
	var htmlFile = 'tern_content_assist_test_script.html';
	var timeoutReturn = ['Content assist timed out'];

	/**
	 * @description Sets up the test
	 * @param {Object} options The options the set up with
	 * @returns {Object} The object with the initialized values
	 */
	function setup(options) {
		var state = Object.create(null);
		var buffer = state.buffer = typeof(options.buffer) === 'undefined' ? '' : options.buffer;
		var offset = state.offset = typeof(options.offset) === 'undefined' ? 0 : options.offset;
		var line = state.line = typeof(options.line) === 'undefined' ? '' : options.line;
		
		var contentType = options.contenttype ? options.contenttype : 'application/javascript';
		var	file = state.file = jsFile;				
		if (contentType === 'text/html'){
			// Tern plug-ins don't have the content type, only the name of the file
			file = state.file = htmlFile;
		}
		assert(options.callback, 'You must provide a test callback for worker-based tests');
		state.callback = options.callback;
		testworker.setTestState(state);
		
		// Delete any test files created by previous tests
		testworker.postMessage({request: 'delFile', args:{file: jsFile}});
		testworker.postMessage({request: 'delFile', args:{file: htmlFile}});
		
		var editorContext = {
			
			/*override*/
			getText: function() {
				return new Deferred().resolve(buffer);
			},

			getFileMetadata: function() {
			    var o = Object.create(null);
			    o.contentType = Object.create(null);
			    o.contentType.id = contentType;
			    o.location = file;
			    return new Deferred().resolve(o);
			},
			
			openEditor: function(file, options){
				this.file = file;
				this.options = options;
			}
		};
		astManager.onModelChanging({file: {location: file}});
		var params = {offset: offset, input: file, line: line, timeout: options.timeout ? options.timeout : 20000, timeoutReturn: timeoutReturn};
		return {
			editorContext: editorContext,
			params: params
		};
	}
	
	function testOpenDecl(options, expected) {
		testOpenCommand(openDeclCommand, options, expected);
	}
	
	function testOpenImpl(options, expected){
		testOpenCommand(openImplCommand, options, expected);
	}
	
	function testOpenCommand(command, options, expected){
		var _p = setup(options);
		assert(_p, 'setup() should have completed normally');
		command.execute(_p.editorContext, _p.params).then(function (result) {
			try {
				if (!expected) {
					// We expect an error status as the result
					if (!result){
						// If no error was returned, check to see if we have results
						if (_p.editorContext.options){
							var actual = _p.editorContext.options;
							assert(false, 'Expected error status indicating no result, instead found result: ' + actual.start + '-' + actual.end)
						}
						assert(result, 'Expected error status indicating no result, instead result returned was ' + result);
					}
					testworker._state.callback();
					return;
				}
				assert(_p.editorContext.options, "OpenEditor was not called on the editor context");
				var actual = _p.editorContext.options;
				assert.equal(actual.start, expected.start, 'The offset starts are not the same. Actual ' + actual.start + '-' + actual.end + ' Expected ' + expected.start + '-' + expected.end);
				assert.equal(actual.end, expected.end, 'The offset ends are not the same. Actual ' + actual.start + '-' + actual.end + ' Expected ' + expected.start + '-' + expected.end);
				testworker._state.callback();
			} catch (err){
				testworker._state.callback(err);
			}
		}, function (error) {
			if (!expected) {
				if (error.Severity === "Warning") {
					testworker._state.callback();
					return;
				}
			}
			if(error instanceof Error || toString.call(error) === '[object Error]') {
				testworker._state.callback(error);
			} else {
				testworker._state.callback(new Error('Unknown error'));
			}
		});
	}
	
	describe('Tern based commands tests', function() {
		before('Message the server for warm up', function(callback) {
			testworker = TestWorker.instance();
			CUProvider.setUseCache(false);
			
			openImplCommand = new OpenImplementation.OpenImplementationCommand(astManager, testworker, CUProvider);
			openDeclCommand = new OpenDeclaration.OpenDeclarationCommand(astManager, testworker, CUProvider);
			
			// Warm up the Tern server with a content assist call
			ternAssist = new TernAssist.TernContentAssist(astManager, testworker, function() {
				return new Deferred().resolve([]);
			}, CUProvider);
			this.timeout(100000);
			var options = {
				buffer: "xx",
				prefix: "xx",
				offset: 1,
				callback: callback
			};
			var _p = setup(options);
			testworker._state.warmup = true;
			ternAssist.computeContentAssist(_p.editorContext, _p.params).then(/* @callback */ function (actualProposals) {
				//do nothing, warm up
			});
		});
		after("Shut down the test worker", function() {
			testworker.terminate();
		});
		this.timeout(10000);
		
		it('Open Declaration - No result', function(done) {
			var options = {
				buffer: "var a = 1; a = 2;",
				offset: 9,
				callback: done
			};
			testOpenDecl(options, null);
		});
		it('Open Implementation - No result', function(done) {
			var options = {
				buffer: "var a = 1; a = 2;",
				offset: 9,
				callback: done
			};
			testOpenImpl(options, null);
		});
		it('Open Declaration - Simple var 1', function(done) {
			var options = {
				buffer: "var a = 1; a = 2;",
				offset: 12,
				callback: done
			};
			testOpenDecl(options, {start: 4, end: 5});
		});
		it('Open Implementation - Simple var 1', function(done) {
			var options = {
				buffer: "var a = 1; a = 2;",
				offset: 12,
				callback: done
			};
			testOpenImpl(options, {start: 11, end: 12});
		});
		it('Open Declaration - Simple var 2', function(done) {
			var options = {
				buffer: "var a = 1; a = 2;",
				offset: 5,
				callback: done
			};
			testOpenDecl(options, {start: 4, end: 5});
		});
		it('Open Implementation - Simple var 2', function(done) {
			var options = {
				buffer: "var a = 1; a = 2;",
				offset: 5,
				callback: done
			};
			testOpenImpl(options, {start: 4, end: 5});
		});
		it('Open Declaration - Simple var 3', function(done) {
			var options = {
				buffer: "var a = 1; a = function(){}; a;",
				offset: 30,
				callback: done
			};
			testOpenDecl(options, {start: 4, end: 5});
		});
		it('Open Implementation - Simple var 3', function(done) {
			var options = {
				buffer: "var a = 1; a = function(){}; a;",
				offset: 30,
				callback: done
			};
			testOpenImpl(options, {start: 4, end: 5});
		});
		it('Open Declaration - Simple var 4', function(done) {
			var options = {
				buffer: "var a = function(){}; a = 1; a;",
				offset: 30,
				callback: done
			};
			testOpenDecl(options, {start: 4, end: 5});
		});
		it('Open Implementation - Simple var 4', function(done) {
			var options = {
				buffer: "var a = function(){}; a = 1; a;",
				offset: 30,
				callback: done
			};
			testOpenImpl(options, {start: 4, end: 5});
		});
		it('Open Declaration - Chained var 1 - Expression statement', function(done) {
			var options = {
				buffer: "var a = 1; var b = a; b;",
				offset: 22,
				callback: done
			};
			testOpenDecl(options, {start: 15, end: 16});
		});
		it('Open Implementation - Chained var 1 - Expression statement', function(done) {
			var options = {
				buffer: "var a = 1; var b = a; b;",
				offset: 22,
				callback: done
			};
			testOpenImpl(options, {start: 4, end: 5});
		});
		it('Open Declaration - Chained var 2 - Assignment expression', function(done) {
			var options = {
				buffer: "var a = 1; var b = a; b = 1;",
				offset: 22,
				callback: done
			};
			testOpenDecl(options, {start: 15, end: 16});
		});
		it('Open Implementation - Chained var 2 - Assignment expression', function(done) {
			var options = {
				buffer: "var a = 1; var b = a; b = 1;",
				offset: 22,
				callback: done
			};
			testOpenImpl(options, {start: 22, end: 23});
		});
		it('Open Declaration - Chained var 3 - Update expression', function(done) {
			var options = {
				buffer: "var a = 1; var b = a; b++;",
				offset: 22,
				callback: done
			};
			testOpenDecl(options, {start: 15, end: 16});
		});
		it('Open Implementation - Chained var 3 - Update expression', function(done) {
			var options = {
				buffer: "var a = 1; var b = a; b++;",
				offset: 22,
				callback: done
			};
			testOpenImpl(options, {start: 4, end: 5});
		});
		it('Open Declaration - Chained var 4', function(done) {
			var options = {
				buffer: "var a = 1; var b = a; var c = b; c;",
				offset: 33,
				callback: done
			};
			testOpenDecl(options, {start: 26, end: 27});
		});
		it('Open Implementation - Chained var 4', function(done) {
			var options = {
				buffer: "var a = 1; var b = a; var c = b; c;",
				offset: 33,
				callback: done
			};
			testOpenImpl(options, {start: 4, end: 5});
		});
		it('Open Declaration - Simple function declaration', function(done) {
			var options = {
				buffer: "function a(){ console.log('test'); }; a();",
				offset: 39,
				callback: done
			};
			testOpenDecl(options, {start: 9, end: 10});
		});
		it('Open Implementation - Simple function declaration', function(done) {
			var options = {
				buffer: "function a(){ console.log('test'); }; a();",
				offset: 39,
				callback: done
			};
			testOpenImpl(options, {start: 9, end: 10});
		});
		it('Open Declaration - Chained function declaration 1', function(done) {
			var options = {
				buffer: "function a(){ console.log('test'); }; var b = a; b();",
				offset: 50,
				callback: done
			};
			testOpenDecl(options, {start: 42, end: 43});
		});
		it('Open Implementation - Chained function declaration 1', function(done) {
			var options = {
				buffer: "function a(){ console.log('test'); }; var b = a; b();",
				offset: 50,
				callback: done
			};
			testOpenImpl(options, {start: 9, end: 10});
		});
		it('Open Declaration - Chained function declaration 2', function(done) {
			var options = {
				buffer: "function a(){ console.log('test'); }; var b = a; var c = b; c();",
				offset: 60,
				callback: done
			};
			testOpenDecl(options, {start: 53, end: 54});
		});
		it('Open Implementation - Chained function declaration 2', function(done) {
			var options = {
				buffer: "function a(){ console.log('test'); }; var b = a; var c = b; c();",
				offset: 60,
				callback: done
			};
			testOpenImpl(options, {start: 9, end: 10});
		});
		it('Open Declaration - Simple member expression', function(done) {
			var options = {
				buffer: "var a = {b: function(){ console.log('test'); } }; a.b;",
				offset: 52,
				callback: done
			};
			testOpenDecl(options, {start: 9, end: 10});
		});
		it('Open Implementation - Simple member expression', function(done) {
			var options = {
				buffer: "var a = {b: function(){ console.log('test'); } }; a.b;",
				offset: 52,
				callback: done
			};
			testOpenImpl(options, {start: 9, end: 10});
		});
		it('Open Declaration - Chained member expression 1', function(done) {
			var options = {
				buffer: "function f(){} var a={}; a.b = f; a.b();",
				offset: 36,
				callback: done
			};
			testOpenDecl(options, {start: 27, end: 28});
		});
		it('Open Implementation - Chained member expression 1', function(done) {
			var options = {
				buffer: "function f(){} var a={}; a.b = f; a.b();",
				offset: 36,
				callback: done
			};
			testOpenImpl(options, {start: 9, end: 10});
		});
		it('Open Declaration - Chained member expression 2', function(done) {
			var options = {
				buffer: "function f(){} var a={}; a.b = {}; a.b.c = f; a.b.c();",
				offset: 50,
				callback: done
			};
			testOpenDecl(options, {start: 39, end: 40});
		});
		it('Open Implementation - Chained member expression 2', function(done) {
			var options = {
				buffer: "function f(){} var a={}; a.b = {}; a.b.c = f; a.b.c();",
				offset: 50,
				callback: done
			};
			testOpenImpl(options, {start: 9, end: 10});
		});
		it('Open Declaration - Chained member expression with member selected', function(done) {
			var options = {
				buffer: "function f(){} var a={}; a.b = f; a.b();",
				offset: 34,
				callback: done
			};
			testOpenDecl(options, {start: 19, end: 20});
		});
		it('Open Implementation - Chained member expression with member selected', function(done) {
			var options = {
				buffer: "function f(){} var a={}; a.b = f; a.b();",
				offset: 34,
				callback: done
			};
			testOpenImpl(options, {start: 21, end: 23});
		});
		it('Open Declaration - Multiple implementation member expression 1', function(done) {
			var options = {
				buffer: "function f(){} var a={b: function(){}}; a.b = f; a.b();",
				offset: 52,
				callback: done
			};
			testOpenDecl(options, {start: 22, end: 23});
		});
		it('Open Implementation - Multiple implementation member expression 1', function(done) {
			var options = {
				buffer: "function f(){} var a={b: function(){}}; a.b = f; a.b();",
				offset: 52,
				callback: done
			};
			testOpenImpl(options, {start: 22, end: 23});
		});
		it('Open Declaration - Multiple implementation member expression 2', function(done) {
			// Tern will always return the object expression over the assignment
			var options = {
				buffer: "function f(){} var a = {}; a.b = 1; a.b = function(){}; a.b();",
				offset: 59,
				callback: done
			};
			testOpenDecl(options, {start: 29, end: 30});
		});
		it('Open Implementation - Multiple implementation member expression 2', function(done) {
			// Tern will always return the object expression over the assignment
			var options = {
				buffer: "function f(){} var a = {}; a.b = 1; a.b = function(){}; a.b();",
				offset: 59,
				callback: done
			};
			testOpenImpl(options, {start: 29, end: 30});
		});
		it('Open Declaration - Chained call expression', function(done) {
			var options = {
				buffer: "var a = {b: function(){ console.log('test'); } }; var c = a.b; c();",
				offset: 63,
				callback: done
			};
			testOpenDecl(options, {start: 54, end: 55});
		});
		it('Open Implementation - Chained call expression', function(done) {
			var options = {
				buffer: "var a = {b: function(){ console.log('test'); } }; var c = a.b; c();",
				offset: 63,
				callback: done
			};
			// TODO This should take us to the implementation of the function
			testOpenImpl(options, {start: 9, end: 10});
		});
		it('Open Declaration - Simple object property', function(done) {
			var options = {
				buffer: "var o = {one: 1}; o.one++;",
				offset: 22,
				callback: done
			};
			testOpenDecl(options, {start: 9, end: 12});
		});
		it('Open Implementation - Simple object property', function(done) {
			var options = {
				buffer: "var o = {one: 1}; o.one++;",
				offset: 22,
				callback: done
			};
			testOpenImpl(options, {start: 9, end: 12});
		});
		it('Open Declaration - Object property with function value', function(done) {
			var options = {
				buffer: "function f(){} var o = {one: f}; o.one();",
				offset: 37,
				callback: done
			};
			testOpenDecl(options, {start: 24, end: 27});
		});
		it('Open Implementation - Object property with function value', function(done) {
			var options = {
				buffer: "function f(){} var o = {one: f}; o.one();",
				offset: 37,
				callback: done
			};
			testOpenImpl(options, {start: 9, end: 10});
		});
		it('Open Declaration - Chained object property', function(done) {
			var options = {
				buffer: "function f(){} function g() {return {ff: f}} g().ff();",
				offset: 51,
				callback: done
			};
			testOpenDecl(options, {start: 37, end: 39});
		});
		it('Open Implementation - Chained object property', function(done) {
			var options = {
				buffer: "function f(){} function g() {return {ff: f}} g().ff();",
				offset: 51,
				callback: done
			};
			testOpenImpl(options, {start: 9, end: 10});
		});
		// Possible Tern bug, for binary expressions, findDef returns an Object with no start/end information
		it('Open Declaration - Binary expression', function(done) {
			var options = {
				buffer: "function f(){} var a = f !== null; a;",
				offset: 35,
				callback: done
			};
			testOpenDecl(options, {start: 19, end: 20});
		});
		it('Open Implementation - Binary expression', function(done) {
			var options = {
				buffer: "function f(){} var a = f !== null; a;",
				offset: 35,
				callback: done
			};
			testOpenImpl(options, {start: 19, end: 20});
		});
		it('Open Declaration - Unary expression', function(done) {
			var options = {
				buffer: "function f(){} var a = !f; a;",
				offset: 27,
				callback: done
			};
			testOpenDecl(options, {start: 19, end: 20});
		});
		it('Open Implementation - Unary expression', function(done) {
			var options = {
				buffer: "function f(){} var a = !f; a;",
				offset: 27,
				callback: done
			};
			testOpenImpl(options, {start: 19, end: 20});
		});
		// TODO Do we want Tern to guess in this case?
		it.skip('Open Declaration - Tern didGuess() === true', function(done) {
			var options = {
				buffer: "var a = {x: function() {}}; var b = {x: function() {}}; function test(z){ return z.x() }",
				offset: 84,
				callback: done
			};
			testOpenDecl(options, null);
		});
		it.skip('Open Implementation - Tern didGuess() === true', function(done) {
			var options = {
				buffer: "var a = {x: function() {}}; var b = {x: function() {}}; function test(z){ return z.x() }",
				offset: 84,
				callback: done
			};
			testOpenImpl(options, null);
		});
	});
});
