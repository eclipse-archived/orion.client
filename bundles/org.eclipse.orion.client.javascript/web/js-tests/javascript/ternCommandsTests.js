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
			
			setStatus: function(status) {
				this.status = status;
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
		command.execute(_p.editorContext, _p.params).then(function (){
			try {
				var status = _p.editorContext.status;
				if (!expected){
					assert(status, "Expected no result but error status not returned");
					assert(typeof status === "string", "Expected no result but wrong status format returned");
					testworker._state.callback();
					return;
				}
				assert(!status, "Error status returned: " + (status && status.message ? status.message : status));
				assert(_p.editorContext.options, "OpenEditor was not called on the editor context");
				var actual = _p.editorContext.options;
				assert.equal(actual.start, expected.start, 'The offset starts are not the same. Actual ' + actual.start + '-' + actual.end + ' Expected ' + expected.start + '-' + expected.end);
				assert.equal(actual.end, expected.end, 'The offset ends are not the same. Actual ' + actual.start + '-' + actual.end + ' Expected ' + expected.start + '-' + expected.end);
				testworker._state.callback();
			} catch (err){
				testworker._state.callback(err);
			}
		}, function (error){
			testworker._state.callback(error);
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
			testOpenImpl(options, {start: 4, end: 5});
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
		it('Open Declaration - Chained var 1', function(done) {
			var options = {
				buffer: "var a = 1; var b = a; b = 1;",
				offset: 22,
				callback: done
			};
			testOpenDecl(options, {start: 15, end: 16});
		});
		it.skip('Open Implementation - Chained var 1', function(done) {
			var options = {
				buffer: "var a = 1; var b = a; b = 1;",
				offset: 22,
				callback: done
			};
			// TODO This shouldtake us to the assignment of the var
			testOpenImpl(options, {start: 5, end: 6});
		});
		it('Open Declaration - Chained var 2', function(done) {
			var options = {
				buffer: "var a = 1; var b = a; var c = b; c = 1;",
				offset: 33,
				callback: done
			};
			testOpenDecl(options, {start: 26, end: 27});
		});
		it.skip('Open Implementation - Chained var 2', function(done) {
			var options = {
				buffer: "var a = 1; var b = a; var c = b; c = 1;",
				offset: 33,
				callback: done
			};
			// TODO This shouldtake us to the assignment of the var
			testOpenImpl(options, {start: 5, end: 6});
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
		it.skip('Open Implementation - Chained function declaration 1', function(done) {
			var options = {
				buffer: "function a(){ console.log('test'); }; var b = a; b();",
				offset: 50,
				callback: done
			};
			// TODO This should take us to the implementation of the function
			testOpenImpl(options, {start: 5, end: 6});
		});
		it('Open Declaration - Chained function declaration 2', function(done) {
			var options = {
				buffer: "function a(){ console.log('test'); }; var b = a; var c = b; c();",
				offset: 60,
				callback: done
			};
			testOpenDecl(options, {start: 53, end: 54});
		});
		it.skip('Open Implementation - Chained function declaration 2', function(done) {
			var options = {
				buffer: "function a(){ console.log('test'); }; var b = a; var c = b; c();",
				offset: 60,
				callback: done
			};
			// TODO This should take us to the implementation of the function
			testOpenImpl(options, {start: 0, end: 0});
		});
		it('Open Declaration - Simple function expression', function(done) {
			var options = {
				buffer: "var a = {b: function(){ console.log('test'); } }; a.b();",
				offset: 52,
				callback: done
			};
			testOpenDecl(options, {start: 9, end: 10});
		});
		it('Open Implementation - Simple function expression', function(done) {
			var options = {
				buffer: "var a = {b: function(){ console.log('test'); } }; a.b();",
				offset: 52,
				callback: done
			};
			testOpenImpl(options, {start: 12, end: 46});
		});
		it('Open Declaration - Chained function expression', function(done) {
			var options = {
				buffer: "var a = {b: function(){ console.log('test'); } }; var c = b.a; c();",
				offset: 63,
				callback: done
			};
			testOpenDecl(options, {start: 54, end: 55});
		});
		it.skip('Open Implementation - Chained function expression', function(done) {
			var options = {
				buffer: "var a = {b: function(){ console.log('test'); } }; var c = b.a; c();",
				offset: 63,
				callback: done
			};
			// TODO This should take us to the implementation of the function
			testOpenImpl(options, {start: 12, end: 46});
		});
	});
});
