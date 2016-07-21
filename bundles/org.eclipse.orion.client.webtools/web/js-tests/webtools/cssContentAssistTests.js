/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, mocha*/
define([
	'chai/chai',
	'webtools/cssContentAssist',
	'orion/serviceregistry',
	'webtools/cssResultManager',
	'orion/Deferred',
	'mocha/mocha' //global export, stays last
], function(chai, CssContentAssist, mServiceRegistry, cssResultManager, Deferred) {
	/* eslint-disable no-console, missing-nls */
	var assert = chai.assert;

	var serviceRegistry = new mServiceRegistry.ServiceRegistry();
	var cssResultMgr = new cssResultManager(serviceRegistry);
	var assist = new CssContentAssist.CssContentAssistProvider(cssResultMgr);

	/**
	 * Set up the test and return an object for the test context
	 * @param {Object} options The map of options
	 */
	function setup(options) {
		var buffer = typeof options.buffer === "string" ? options.buffer : '';
		var file = typeof options.file === "string" ? options.file : 'css_content_assist_test_source.css';
		var editorContext = {
			getText: function() {
				return new Deferred().resolve(buffer);
			},

			getFileMetadata: function() {
				var o = Object.create(null);
				o.contentType = Object.create(null);
				o.contentType.id = 'text/css';
				o.location = file;
				return new Deferred().resolve(o);
			}
		};
		cssResultMgr.onModelChanging({
			file: {
				location: file
			}
		});
		return {
			editorContext: editorContext
		};
	}

	/**
	 * Compares the two arrays of proposals
	 * @param {Array.<Object>} computed The computed proposal array
	 * @param {Array.<Object>} expected The expected array of proposals  
	 */
	function assertProposals(computed, expected) {
		assert(Array.isArray(computed), 'There must have been a computed array of proposals');
		assert(Array.isArray(expected), 'There must be an expected array of proposals');
		assert.equal(computed.length, expected.length, 'The number of computed proposals does not match the expected count. Actual: ' + stringify(computed));
		for (var i = 0; i < computed.length; i++) {
			var c = computed[i];
			var e = expected[i];
			if (e.proposal){
				assert.equal(c.proposal, e.proposal, 'The proposals do not match. Actual: ' + stringify(computed));
			}
			if (e.description){
				assert.equal(c.description, e.description, 'The proposal descriptions do not match. Actual: ' + stringify(computed));
			}
			if (e.name){
				assert.equal(c.name, e.name, 'The proposal names do not match. Actual: ' + stringify(computed));
			}
		}
	}
	
	function stringify(proposals){
		var result = "\n";
		for (var i = 0; i < proposals.length; i++) {
			result += '{ ';
			if (proposals[i].name){
				result += "name: '" + proposals[i].name + "', ";
			} else if (proposals[i].description){
				result += "description: '" + proposals[i].description + "', ";
			}
			if (proposals[i].proposal){
				result += "proposal: '" + proposals[i].proposal + "'";
			}
			result += "},\n";
		}
		return result;
	}
	
	function getPrefix(assist, editorContext, context) {
		return assist.computePrefix(editorContext, context.offset);
	}

	describe('CSS Content Assist Tests', function() {
		it('Completion of padding', function() {
			var config = setup({
				buffer:
					'#identity {\n' + 
					'padding\n' +
					'}'
			});
			var contxt =  {
				delimiter: '\n',
				indentation: '',
				offset: 19,
				tab: '	'
			};
			return getPrefix(assist, config.editorContext, contxt).then(function(prefix) {
				contxt.prefix = prefix;
				return assist.computeContentAssist(config.editorContext, contxt).then(function(proposals) {
					var expected = [
					{ description: 'Templates', },
					{ description: 'padding - padding pixel style', proposal: ': valuepx;'},
					{ description: 'padding - padding top right bottom left style', proposal: ': toppx leftpx bottompx rightpx;'},
					{ description: 'padding - padding top right,left bottom style', proposal: ': toppx right_leftpx bottompx;'},
					{ description: 'padding - padding top,bottom right,left style', proposal: ': top_bottompx right_leftpx'},
					{ description: 'padding-bottom - padding-bottom pixel style', proposal: '-bottom: valuepx;'},
					{ description: 'padding-left - padding-left pixel style', proposal: '-left: valuepx;'},
					{ description: 'padding-right - padding-right pixel style', proposal: '-right: valuepx;'},
					{ description: 'padding-top - padding-top pixel style', proposal: '-top: valuepx;'},
					{ description: 'Keywords', },
					{ description: 'padding', },
					{ description: 'padding-bottom', proposal: '-bottom'},
					{ description: 'padding-left', proposal: '-left'},
					{ description: 'padding-right', proposal: '-right'},
					{ description: 'padding-top', proposal: '-top'},
					];
					assertProposals(proposals, expected);
				});
			})
		});
		it('Completion of padding-', function() {
			var config = setup({
				buffer:
					'#identity {\n' + 
					'padding-\n' +
					'}'
			});
			var contxt =  {
				delimiter: '\n',
				indentation: '',
				offset: 20,
				tab: '	'
			};
			return getPrefix(assist, config.editorContext, contxt).then(function(prefix) {
				contxt.prefix = prefix;
				return assist.computeContentAssist(config.editorContext, contxt).then(function(proposals) {
					var expected = [
						{ description: 'Templates', },
						{ description: 'padding-bottom - padding-bottom pixel style', proposal: 'bottom: valuepx;'},
						{ description: 'padding-left - padding-left pixel style', proposal: 'left: valuepx;'},
						{ description: 'padding-right - padding-right pixel style', proposal: 'right: valuepx;'},
						{ description: 'padding-top - padding-top pixel style', proposal: 'top: valuepx;'},
						{ description: 'Keywords', },
						{ description: 'padding-bottom', proposal: 'bottom'},
						{ description: 'padding-left', proposal: 'left'},
						{ description: 'padding-right', proposal: 'right'},
						{ description: 'padding-top', proposal: 'top'},
					];
					assertProposals(proposals, expected);
				});
			})
		});
	});
});