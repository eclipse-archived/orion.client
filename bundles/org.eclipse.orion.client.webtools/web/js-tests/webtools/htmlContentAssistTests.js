/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
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
'webtools/htmlContentAssist',
'webtools/htmlAstManager',
'orion/Deferred',
'mocha/mocha' //global export, stays last
], function(chai, HTMLAssist, ASTManager, Deferred) {
    /* eslint-disable no-console, missing-nls */
    var assert = chai.assert;
    
    var astmanager = new ASTManager.HtmlAstManager();
    var assist = new HTMLAssist.HTMLContentAssistProvider(astmanager);
    
    /**
     * Set up the test and return an object for the test context
     * @param {Object} options The map of options
     */
    function setup(options) {
    	var buffer = typeof(options.buffer) === "string" ? options.buffer : '';
    	var file = typeof(options.file) === "string" ? options.file : 'html_content_assist_test_source.html';
    	var editorContext = {
    		getText: function() {
				return new Deferred().resolve(buffer);
			},
			
			getFileMetadata: function() {
			    var o = Object.create(null);
			    o.contentType = Object.create(null);
			    o.contentType.id = 'text/html';
			    o.location = file;
			    return new Deferred().resolve(o);
			}
    	};
    	astmanager.onModelChanging({file: {location: file}});
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
    	assert.equal(computed.length, expected.length, 'The number of computed proposals does not match the expected count');
    	for(var i = 0; i < computed.length; i++) {
    		var c = computed[i];
    		var e = expected[i];
    		assert.equal(c.proposal, e.proposal, 'The proposals do not match');
    		assert.equal(c.prefix, e.prefix, 'The prefixes do not match');
    	}
    }
    
    describe('HTML Content Assist Tests', function() {
    	it('Empty file', function() {
    		var _o = setup({buffer: ''});
    		return assist.computeContentAssist(_o.editorContext, {offset: 0}).then(function(proposals) {
    			assert(Array.isArray(proposals), "There should have been an array of proposals returned");
    			assert.equal(proposals.length, 1, 'There should be a single proposal returned');
    			var _p = proposals[0];
    			assert.equal(_p.proposal.indexOf("<!DOCTYPE html>"), 0, 'Should have been the HTML file template');
    		});
    	});
    	it('No complete tags 1', function() {
    		var _o = setup({buffer: '   \t\n'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 0}).then(function(proposals) {
    			// Check that we are getting the list of tag completions
    			assert(proposals.length > 10, "Did not get tag proposals. Proposals found: " + proposals.length);
    		});
    	});
    	it('No complete tags 2', function() {
    		var _o = setup({buffer: '   \t\n'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
    			// Check that we are getting the list of tag completions
    			assert(proposals.length > 10, "Did not get tag proposals. Proposals found: " + proposals.length);
    		});
    	});
    	it('No complete tags 3', function() {
    		var _o = setup({buffer: '   <'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 0}).then(function(proposals) {
    			// Check that we are getting the list of tag completions
    			assert(proposals.length > 10, "Did not get tag proposals. Proposals found: " + proposals.length);
    		});
    	});
    	it('No complete tags 4', function() {
    		var _o = setup({buffer: '<'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 0}).then(function(proposals) {
    			// Check that we are getting the list of tag completions
    			assert(proposals.length > 10, "Did not get tag proposals. Proposals found: " + proposals.length);
    		});
    	});    	
    	it('No complete tags 5', function() {
    		var _o = setup({buffer: 'foo\n'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 4}).then(function(proposals) {
    			// Check that we are getting the list of tag completions
    			assert(proposals.length > 10, "Did not get tag proposals. Proposals found: " + proposals.length);
    		});
    	});
    	it('meta template', function() {
    		var _o = setup({buffer: '<met'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 4}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: ''},
    				{proposal: 'er></meter>'},
    				{proposal: 'a/>'}
    			]);
    		});
    	});
    	it('param template', function() {
    		var _o = setup({buffer: '<par'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 4}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: ''},
    				{proposal: 'am/>'}
    			]);
    		});
    	});
    	it('script template', function() {
    		var _o = setup({buffer: '<sc'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 3}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: ''},
    				{proposal: 'ript>\n\t\n</script>'}
    			]);
    		});
    	});
    	it('script template', function() {
    		var _o = setup({buffer: '<sty'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 4}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: ''},
    				{proposal: 'le>\n\t\n</style>'}
    			]);
    		});
    	});
    	it('Close tag </ 1', function() {
    		var _o = setup({buffer: '<a></'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '</a>', prefix: '</'}
    			]);
    		});
    	});
    	it('Close tag </ 2', function() {
    		var _o = setup({buffer: '<a>     </'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 10}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '</a>', prefix: '</'}
    			]);
    		});
    	});
    	it('Close tag </ 3', function() {
    		var _o = setup({buffer: '<a>\tfoo\t</'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 10}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '</a>', prefix: '</'}
    			]);
    		});
    	});
    	it('Close tag </ 4', function() {
    		var _o = setup({buffer: '<a>foo\n\n</'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 10}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '</a>', prefix: '</'}
    			]);
    		});
    	});    	
    	// TODO This test should be made to pass but the parser ignores the <a> tag
//    	it('Close tag </ nested', function() {
//    		var _o = setup({buffer: '<body><a>foo\n\n</</body>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 16}).then(function(proposals) {
//    			assertProposals(proposals, [
//    				{proposal: '</a>', prefix: '</'}
//    			]);
//    		});
//    	});
    	it('Close tag </ whitespace after 1', function() {
    		var _o = setup({buffer: '<a></  '});
    		return assist.computeContentAssist(_o.editorContext, {offset: 7}).then(function(proposals) {
    			// Check that we are getting the list of tag completions, not close tag proposal
    			assert(proposals.length > 10, "Did not get tag proposals. Proposals found: " + proposals.length);
    		});
    	});
    	it('Close tag </ whitespace after 2', function() {
    		var _o = setup({buffer: '<a></\t'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 6}).then(function(proposals) {
    			// Check that we are getting the list of tag completions, not close tag proposal
    			assert(proposals.length > 10, "Did not get tag proposals. Proposals found: " + proposals.length);
    		});
    	});
    	it('Close tag </ whitespace after 3', function() {
    		var _o = setup({buffer: '<a></\n'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 6}).then(function(proposals) {
    			// Check that we are getting the list of tag completions, not close tag proposal
    			assert(proposals.length > 10, "Did not get tag proposals. Proposals found: " + proposals.length);
    		});
    	});
    	it('Close tag / 1', function() {
    		var _o = setup({buffer: '<a>/'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '</a>', prefix: '/'}
    			]);
    		});
    	});
    	it('Close tag / 2', function() {
    		var _o = setup({buffer: '<a>     /'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 9}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '</a>', prefix: '/'}
    			]);
    		});
    	});
    	it('Close tag / 3', function() {
    		var _o = setup({buffer: '<a>\tfoo\t/'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 9}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '</a>', prefix: '/'}
    			]);
    		});
    	});
    	it('Close tag / 4', function() {
    		var _o = setup({buffer: '<a>foo\n\n/'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 9}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '</a>', prefix: '/'}
    			]);
    		});
    	});    	
    	it('Close tag / nested', function() {
    		var _o = setup({buffer: '<body><a>foo\n\n/</body>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 15}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '</a>', prefix: '/'}
    			]);
    		});
    	});
    	it('Close tag / whitespace after 1', function() {
    		var _o = setup({buffer: '<a>/   '});
    		return assist.computeContentAssist(_o.editorContext, {offset: 7}).then(function(proposals) {
    			// Check that we are getting the list of tag completions, not close tag proposal
    			assert(proposals.length > 10, "Did not get tag proposals. Proposals found: " + proposals.length);
    		});
    	});
    	it('Close tag / whitespace after 2', function() {
    		var _o = setup({buffer: '<a>/\t'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
    			// Check that we are getting the list of tag completions, not close tag proposal
    			assert(proposals.length > 10, "Did not get tag proposals. Proposals found: " + proposals.length);
    		});
    	});
    	it('Close tag / whitespace after 3', function() {
    		var _o = setup({buffer: '<a>/\n'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
    			// Check that we are getting the list of tag completions, not close tag proposal
    			assert(proposals.length > 10, "Did not get tag proposals. Proposals found: " + proposals.length);
    		});
    	});
    	it('Close tag </ with newline between', function() {
    		var _o = setup({buffer: '<a><\n/'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 6}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '</a>', prefix: '/'}
    			]);
    		});
    	});
    });
});