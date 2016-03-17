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
'javascript/contentAssist/ternAssist',
'javascript/cuProvider',
'esprima/esprima',
'chai/chai',
'orion/Deferred',
'mocha/mocha' //must stay at the end, not a module
], function(ASTManager, TernAssist, CUProvider, Esprima, chai, Deferred) {
	var assert = chai.assert;

	return function(worker) {
		var ternAssist;
		var envs = Object.create(null);
		var astManager = new ASTManager.ASTManager(Esprima);
		var jsFile = 'tern_content_assist_index_test_script.js';
		var htmlFile = 'tern_content_assist_index_test_script.html';
		var timeoutReturn = ['Content assist timed out'];
	
		/**
		 * @description Sets up the test
		 * @param {Object} options The options the set up with
		 * @returns {Object} The object with the initialized values
		 */
		function setup(options) {
			var state = Object.create(null);
			var buffer = state.buffer = typeof options.buffer === 'undefined' ? '' : options.buffer;
			var prefix = state.prefix = typeof options.prefix === 'undefined' ? '' : options.prefix;
			var offset = state.offset = typeof options.offset === 'undefined' ? 0 : options.offset;
			var line = state.line = typeof options.line === 'undefined' ? '' : options.line;
			var keywords = typeof options.keywords === 'undefined' ? false : options.keywords;
			var templates = typeof options.templates === 'undefined' ? false : options.templates;
			
			var contentType = options.contenttype ? options.contenttype : 'application/javascript';
			var	file = state.file = jsFile;				
			if (contentType === 'text/html'){
				// Tern plug-ins don't have the content type, only the name of the file
				file = state.file = htmlFile;
			}
			assert(options.callback, 'You must provide a test callback for worker-based tests');
			state.callback = options.callback;
			worker.setTestState(state);
			
			// Delete any test files created by previous tests
			worker.postMessage({request: 'delFile', args:{file: jsFile}});
			worker.postMessage({request: 'delFile', args:{file: htmlFile}});
			
			envs = typeof options.env === 'object' ? options.env : Object.create(null);
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
				}
			};
			astManager.onModelChanging({file: {location: file}});
			var params = {offset: offset, prefix : prefix, keywords: keywords, template: templates, line: line, timeout: options.timeout ? options.timeout : 20000, timeoutReturn: timeoutReturn};
			return {
				editorContext: editorContext,
				params: params
			};
		}
	
		/**
		 * @description Pretty-prints the given array of proposal objects
		 * @param {Array} expectedProposals The array of proposals
		 * @returns {String} The pretty-printed proposals
		 */
		function stringifyExpected(expectedProposals) {
			var text = "";
			for (var i = 0; i < expectedProposals.length; i++)  {
				text += expectedProposals[i][0] + " : " + expectedProposals[i][1] + "\n";
			}
			return text;
		}
	
		/**
		 * @description Pretty-prints the given array of proposal objects
		 * @param {Array} expectedProposals The array of proposals
		 * @returns {String} The pretty-printed proposals
		 */
		function stringifyActual(actualProposals) {
			var text = "";
			for (var i = 0; i < actualProposals.length; i++) {
				if (actualProposals[i].name) {
					text += actualProposals[i].proposal + " : " + actualProposals[i].name + actualProposals[i].description + "\n"; //$NON-NLS-1$ //$NON-NLS-0$
				} else {
					text += actualProposals[i].proposal + " : " + actualProposals[i].description + "\n"; //$NON-NLS-1$ //$NON-NLS-0$
				}
			}
			return text;
		}
	
		/**
		 * @description Checks the proposals returned from the given proposal promise against
		 * the array of given proposals
		 * @param {Object} options The options to test with
		 * @param {Array} expectedProposals The array of expected proposal objects
		 */
		function testProposals(options, expectedProposals) {
			var _p = setup(options);
			assert(_p, 'setup() should have completed normally');
			ternAssist.computeContentAssist(_p.editorContext, _p.params).then(function (actualProposals) {
				try {
					assert(actualProposals, "Error occurred, returned proposals was undefined");
					if (actualProposals === timeoutReturn){
						assert(false, "The content assist operation timed out");
					}
					assert.equal(actualProposals.length, expectedProposals.length,
						"Wrong number of proposals.  Expected:\n" + stringifyExpected(expectedProposals) +"\nActual:\n" + stringifyActual(actualProposals));
					for (var i = 0; i < actualProposals.length; i++) {
					    var ap = actualProposals[i];
					    var ep = expectedProposals[i];
						var text = ep[0];
						var description = ep[1];
						assert.equal(ap.proposal, text, "Invalid proposal text"); //$NON-NLS-0$
						if (description) {
							if (ap.name) {
								assert.equal(ap.name + ap.description, description, "Invalid proposal description"); //$NON-NLS-0$
							} else {
								assert.equal(ap.description, description, "Invalid proposal description"); //$NON-NLS-0$
							}
						}
						if(ep.length >= 3 && !ap.unselectable /*headers have no hover*/) {
						    //check for doc hover
						    assert(ap.hover, 'There should be a hover entry for the proposal');
						    assert(ap.hover.content.indexOf(ep[2]) === 0, "The doc should have started with the given value.\nActual: " + ap.hover.content + '\nExpected: ' + ep[2]);
						}
						if (ep.length >= 4 && typeof ep[3] === 'object'){
							assert(ap.groups, "Expected template proposal with selection group");
							assert(ap.groups[0].positions, "Expected template proposal with selection group");
							var offset = ap.groups[0].positions[0].offset;
							var len = ap.groups[0].positions[0].length;
							assert.equal(offset, ep[3].offset, "Template proposal had different offset for selection group");
							assert.equal(offset, ep[3].offset, "Template proposal had different offset for selection group");
							assert.equal(len, ep[3].length, "Template proposal had different length for selection group");						
						}
					}
					worker.getTestState().callback();
				}
				catch(err) {
					worker.getTestState().callback(err);
				}
			}, function (error) {
				worker.getTestState().callback(error);
			});
		}
	
		describe('Tern Content Assist for Index Plugin Tests', function() {
			this.timeout(10000);
			before('Message the server for warm up', function() {
				CUProvider.setUseCache(false);
				ternAssist = new TernAssist.TernContentAssist(astManager, worker, function() {
					return new Deferred().resolve(envs);
				}, CUProvider);
				worker.start(); // Reset the tern server state to remove any prior files
			});
		
			describe('Express', function() {
				it('Express templates - no eslint-env', function(done) {
					var options = {
						buffer: "ex",
						prefix: "ex",
						offset: 2,
						callback: done
					};
					testProposals(options, [
					]);
				});
				it('Express templates - eslint-env set', function(done) {
					var options = {
						buffer: "/* eslint-env express */\nex",
						prefix: "ex",
						offset: 27,
						callback: done
					};
					testProposals(options, [
						['', 'express'],
						["var express = require('express');\nvar app = express();\n\napp.listen(timeout);\n",'express app - create a new Express app'],
						['app.engine(fnOrObject);\n', 'express app engine - create a new Express app engine statement'],
						['app.use(function(error, request, result, next) {\n	result.send(code, message);\n});\n', 'express app error use - create a new Express app error handling use statement'],
						['var value = app.get(id, function(request, result){\n	\n});\n', 'express app get - create a new Express app.get call'],
						['app.param(id, value);\n', 'express app param - create a new Express app param statement'],
						['app.set(id, value);\n', 'express app set - create a new Express app set call'],
						['app.use(fnOrObject);\n', 'express app use - create a new Express app use statement'],
						['app.configure(function() {\n	app.set(id, value);\n});', 'express configure - create an Express app configure statement'],
						['var app = require(\'express\');', 'express require - Node.js require statement for Express'],
						['app.configure(name, function() {\n	app.set(id, value);\n});', 'express specific configure - create a specific Express app configure statement']
					]);
				});
				it('Express templates - eslint-env set, check offsets', function(done) {
					var options = {
						buffer: "/* eslint-env express */\nexpres\nvar a = 3;",
						prefix: "expres",
						offset: 31,
						callback: done
					};
					testProposals(options, [
						['', 'express'],
						["var express = require('express');\nvar app = express();\n\napp.listen(timeout);\n",'express app - create a new Express app'],
						['app.engine(fnOrObject);\n', 'express app engine - create a new Express app engine statement', 'Template source code', {offset: 36, length: 10}],
						['app.use(function(error, request, result, next) {\n	result.send(code, message);\n});\n', 'express app error use - create a new Express app error handling use statement'],
						['var value = app.get(id, function(request, result){\n	\n});\n', 'express app get - create a new Express app.get call'],
						['app.param(id, value);\n', 'express app param - create a new Express app param statement'],
						['app.set(id, value);\n', 'express app set - create a new Express app set call'],
						['app.use(fnOrObject);\n', 'express app use - create a new Express app use statement'],
						['app.configure(function() {\n	app.set(id, value);\n});', 'express configure - create an Express app configure statement'],
						['var app = require(\'express\');', 'express require - Node.js require statement for Express', 'Template source code', {offset: 29, length: 3}],
						['app.configure(name, function() {\n	app.set(id, value);\n});', 'express specific configure - create a specific Express app configure statement']
					]);
				});
				it('Express completions - app.u', function(done) {
					var options = {
						buffer: "/* eslint-env node, express */\nvar express = require('express'); var app = express(); app.u",
						prefix: "",
						offset: 91,
						callback: done
					};
					testProposals(options, [
						['', 'express'],
						['use(fn)', 'use(fn)', 'Proxy `Router#use()`']
					]);
				});
				it('Express completions - app.static', function(done) {
					var options = {
						buffer: "/* eslint-env node, express */\nvar express = require('express'); express.stati",
						prefix: "stati",
						offset: 78,
						callback: done
					};
					testProposals(options, [
						['', 'express'],
						['static(name)', 'static(name)', 'Built-in middleware function.']
					]);
				});
			});	
		});
	};
});
