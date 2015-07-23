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
    var tagTemplates = assist.getTags("", "");
    var globalTagAttributes = assist.getAttributesForNode({name: "zzz", type: "tag"}, {offset: 0, prefix: ""});
    
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
    
    function assertTagProposals(computed){
    	// Add 1 for the title proposal
    	assert(computed.length === tagTemplates.length, "Incorrect number of proposals for tag templates. Proposal count: " + computed.length + " Expected count: " + tagTemplates.length);
    	assert(computed[0].name === "a", "First proposal wasn't the tag 'a'");
    }
    
    function assertGlobalTagAttributes(computed){
    	assert(computed.length === globalTagAttributes.length, "Incorrect number of proposals for tag attributes. Proposal count: " + computed.length + " Expected count: " + globalTagAttributes.length);
    	assert(computed[0].name === "accesskey", "First proposal wasn't the tag attribute 'accesskey'.");
    }
    
    describe('HTML Content Assist Tests', function() {
    	it('Check there are tag templates and attribute map', function() {
	    	assert(tagTemplates.length > 120, "Not enough tag templates. Template count: " + tagTemplates.length);
	    	assert(tagTemplates.length < 140, "Too many tag templates. Template count: " + tagTemplates.length);
	    	assert(globalTagAttributes.length > 60, "Not enough global tag attributes. Global attribute count: " + globalTagAttributes.length);
	    	assert(globalTagAttributes.length < 75, "Too many global tag attributes. Global attribute count: " + globalTagAttributes.length);
    	});
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
    			assertTagProposals(proposals);
    		});
    	});
    	it('No complete tags 2', function() {
    		var _o = setup({buffer: '   \t\n'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
    			assertTagProposals(proposals);
    		});
    	});
    	it('No complete tags 3', function() {
    		var _o = setup({buffer: '   <'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 0}).then(function(proposals) {
    			assertTagProposals(proposals);
    		});
    	});
    	it('No complete tags 4', function() {
    		var _o = setup({buffer: '<'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 0}).then(function(proposals) {
    			assertTagProposals(proposals);
    		});
    	});    	
    	it('No complete tags 5', function() {
    		var _o = setup({buffer: 'foo\n'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 4}).then(function(proposals) {
    			assertTagProposals(proposals);
    		});
    	});
    	it('meta template', function() {
    		var _o = setup({buffer: '<met'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 4, prefix: 'met'}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: 'meta></meta>', prefix: 'met'},
    				{proposal: 'meter></meter>', prefix: 'met'}
    			]);
    		});
    	});
    	it('param template', function() {
    		var _o = setup({buffer: '<par'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 4, prefix: 'par'}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: 'param></param>', prefix: 'par'}
    			]);
    		});
    	});
    	it('script template', function() {
    		var _o = setup({buffer: '<sc'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 3, prefix: 'sc'}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: 'script></script>', prefix: 'sc'}
    			]);
    		});
    	});
    	it('style template', function() {
    		var _o = setup({buffer: '<sty'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 4, prefix: 'sty'}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: 'style></style>', prefix: 'sty'}
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
    			assertTagProposals(proposals);
    		});
    	});
    	it('Close tag </ whitespace after 2', function() {
    		var _o = setup({buffer: '<a></\t'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 6}).then(function(proposals) {
    			assertTagProposals(proposals);
    		});
    	});
    	it('Close tag </ whitespace after 3', function() {
    		var _o = setup({buffer: '<a></\n'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 6}).then(function(proposals) {
    			assertTagProposals(proposals);
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
    			assertTagProposals(proposals);
    		});
    	});
    	it('Close tag / whitespace after 2', function() {
    		var _o = setup({buffer: '<a>/\t'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
    			assertTagProposals(proposals);
    		});
    	});
    	it('Close tag / whitespace after 3', function() {
    		var _o = setup({buffer: '<a>/\n'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
    			assertTagProposals(proposals);
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
    	it('Tag templates 1', function() {
    		var _o = setup({buffer: '<ar'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 3, prefix: 'ar'}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: 'area></area>', prefix: 'ar'},
    				{proposal: 'article></article>', prefix: 'ar'}
    			]);
    		});
    	});
    	it('Tag templates 2', function() {
    		var _o = setup({buffer: '<html>\n<body><ar</body>\n</html>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 16, prefix: 'ar'}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: 'area></area>', prefix: 'ar'},
    				{proposal: 'article></article>', prefix: 'ar'}
    			]);
    		});
    	});
    	it('Tag templates 3', function() {
    		var _o = setup({buffer: '<html>\n<body><ar\n</body>\n</html>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 17}).then(function(proposals) {
    			assertTagProposals(proposals);
    		});
    	});
    	it('Tag attribute proposals 1', function() {
    		var _o = setup({buffer: '<zzz >'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
    			assertGlobalTagAttributes(proposals);
    		});
    	});
    	it('Tag attribute proposals 2', function() {
    		var _o = setup({buffer: '<body>\n<zzz >\n</body>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 12}).then(function(proposals) {
    			assertGlobalTagAttributes(proposals);
    		});
    	});
    	// TODO The parser gets us the body node rather than zzz so we get proposals specific to the body tag
//    	it('Tag attribute proposals 3', function() {
//    		var _o = setup({buffer: '<body>\n<zzz aria="test" >\n</body>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 24}).then(function(proposals) {
//    			assertGlobalTagAttributes(proposals);
//    		});
//    	});
		// TODO The parser doesn't recognize that we are inside of a valid tag so tag proposals rather than attributes are returned
//		it('Tag attribute proposals 4', function() {
//    		var _o = setup({buffer: '<body>\n<zzz  aria="test">\n</body>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 12}).then(function(proposals) {
//    			assertGlobalTagAttributes(proposals);
//    		});
//    	});
    	it('Tag attribute proposals prefix 1', function() {
    		var _o = setup({buffer: '<zzz acc>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 8, prefix: 'acc'}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: 'accesskey=""', prefix: 'acc'},
    			]);
    		});
    	});
    	it('Tag attribute proposals prefix 2', function() {
    		var _o = setup({buffer: '<body><zzz acc></body>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 14, prefix: 'acc'}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: 'accesskey=""', prefix: 'acc'},
    			]);
    		});
    	});
    	it('Tag attribute proposals prefix 3', function() {
    		var _o = setup({buffer: '<body><zzz aria="test" acc></body>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 26, prefix: 'acc'}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: 'accesskey=""', prefix: 'acc'},
    			]);
    		});
    	});
    	// TODO The parser does not return the correct ranges on the zzz start tag so we don't recognized that we are looking for attributes
//    	it('Tag attribute proposals prefix 4', function() {
//    		var _o = setup({buffer: '<body><zzz acc aria="test"></body>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 14, prefix: 'acc'}).then(function(proposals) {
//    			assertProposals(proposals, [
//    				{proposal: 'accesskey=""', prefix: 'acc'},
//    			]);
//    		});
//    	});
    	// TODO The parser does not create a start tag element so we don't recognize that we are looking for attributes
//    	it('Tag attribute proposals incomplete tag 1', function() {
//    		var _o = setup({buffer: '<zzz '});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
//    			assertGlobalTagAttributes(proposals);
//    		});
//    	});
//    	it('Tag attribute proposals incomplete tag 2', function() {
//    		var _o = setup({buffer: '<body><zzz </body>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 11}).then(function(proposals) {
//    			assertGlobalTagAttributes(proposals);
//    		});
//    	});
    	it('Attribute value proposals 1', function() {
    		var _o = setup({buffer: '<a href=""></a>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 9}).then(function(proposals) {
    			assertProposals(proposals, []);
    		});
    	});
    	it('Attribute value proposals 2', function() {
    		var _o = setup({buffer: '<body>\n<a href=""></a>\n</body>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 16}).then(function(proposals) {
    			assertProposals(proposals, []);
    		});
    	});
    	it('Attribute value proposals incomplete tag 1', function() {
    		var _o = setup({buffer: '<a href=""'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 9}).then(function(proposals) {
    			assertProposals(proposals, []);
    		});
    	});
    	it('Attribute value proposals incomplete tag 2', function() {
    		var _o = setup({buffer: '<body>\n<a href=""\n</body>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 16}).then(function(proposals) {
    			assertProposals(proposals, []);
    		});
    	});
    	it('Offsets within tags proposals 1', function() {
    		var _o = setup({buffer: '<zzz href="" ></zzz>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 13}).then(function(proposals) {
    			assertGlobalTagAttributes(proposals);
    		});
    	});
    	it('Offsets within tags proposals 2', function() {
    		var _o = setup({buffer: '<zzz href="" ></zzz>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 12}).then(function(proposals) {
    			// TODO Can you have two attributes touching when the value is quoted correctly?
    			assertGlobalTagAttributes(proposals);
    		});
    	});
    	it('Offsets within tags proposals 3', function() {
    		var _o = setup({buffer: '<zzz href="" ></zzz>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 10}).then(function(proposals) {
    			assertProposals(proposals, []);
    		});
    	});
    	it('Offsets within tags proposals 4', function() {
    		var _o = setup({buffer: '<zzz href="" ></zzz>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 9, prefix: "href"}).then(function(proposals) {
    			assertProposals(proposals, []);
    		});
    	});
    	it('Offsets within tags proposals 5', function() {
    		var _o = setup({buffer: '<zzz href="" ></zzz>'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
    			assertGlobalTagAttributes(proposals);
    		});
    	});
    	it('Comment open proposals 1', function() {
    		var _o = setup({buffer: '<!'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 2}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '<!-- ', prefix: '<!'},
    			]);
    		});
    	});
    	it('Comment open proposals 2', function() {
    		var _o = setup({buffer: '<!-'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 3}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '<!-- ', prefix: '<!-'},
    			]);
    		});
    	});
    	it('Comment open proposals 3', function() {
    		var _o = setup({buffer: '<!--'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 4}).then(function(proposals) {
    			assertProposals(proposals, []);
    		});
    	});
    	it('Comment open proposals 4', function() {
    		var _o = setup({buffer: '<'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 1}).then(function(proposals) {
    			assertTagProposals(proposals);
    		});
    	});
    	it('Comment open proposals after tag 1', function() {
    		var _o = setup({buffer: '<a><!'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '<!-- ', prefix: '<!'},
    			]);
    		});
    	});
    	it('Comment open proposals after tag 2', function() {
    		var _o = setup({buffer: '<a><!-'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 6}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '<!-- ', prefix: '<!-'},
    			]);
    		});
    	});
    	it('Comment open proposals after tag 3', function() {
    		var _o = setup({buffer: '<a><!--'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 7}).then(function(proposals) {
    			assertProposals(proposals, []);
    		});
    	});
    	it('Comment open proposals after tag 4', function() {
    		var _o = setup({buffer: '<a><'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 4}).then(function(proposals) {
    			assertTagProposals(proposals);
    		});
    	});
    	// TODO Can't test inside tags as the parser doesn't create a separate tag start
//    	it('Comment open proposals inside tag 1', function() {
//    		var _o = setup({buffer: '<a<!'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 4}).then(function(proposals) {
//    			assertProposals(proposals, [
//    				{proposal: '<!-- ', prefix: '<!'},
//    			]);
//    		});
//    	});
//    	it('Comment open proposals inside tag 2', function() {
//    		var _o = setup({buffer: '<a<!-'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
//    			assertProposals(proposals, [
//    				{proposal: '<!-- ', prefix: '<!-'},
//    			]);
//    		});
//    	});
//    	it('Comment open proposals inside tag 3', function() {
//    		var _o = setup({buffer: '<a<!--'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 6}).then(function(proposals) {
//    			assertProposals(proposals, []);
//    		});
//    	});
//    	it('Comment open proposals inside tag 4', function() {
//    		var _o = setup({buffer: '<a<'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 3}).then(function(proposals) {
//    			assertTagProposals(proposals);
//    		});    	
//    	});
		// TODO Can't test inside nested tags as the parser includes the start of the close tag in the name
//    	it('Comment open proposals nested tag 1', function() {
//    		var _o = setup({buffer: '<a><!</a>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
//    			assertProposals(proposals, [
//    				{proposal: '<!-- ', prefix: '<!'},
//    			]);
//    		});
//    	});
//    	it('Comment open proposals nested tag 2', function() {
//    		var _o = setup({buffer: '<a><!-</a>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 6}).then(function(proposals) {
//    			assertProposals(proposals, [
//    				{proposal: '<!-- ', prefix: '<!-'},
//    			]);
//    		});
//    	});
//    	it('Comment open proposals nested tag 3', function() {
//    		var _o = setup({buffer: '<a><!--</a>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 7}).then(function(proposals) {
//    			assertProposals(proposals, []);
//    		});
//    	});
//    	it('Comment open proposals nested tag 4', function() {
//    		var _o = setup({buffer: '<a><</a>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 4}).then(function(proposals) {
//    			assertTagProposals(proposals);
//    		});
//    	});
		it('Comment close proposals 1', function() {
    		var _o = setup({buffer: '<!-- '});
    		return assist.computeContentAssist(_o.editorContext, {offset: 5}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '-->', prefix: ''},
    			]);
    		});
    	});
    	it('Comment close proposals 2', function() {
    		var _o = setup({buffer: '<!-- -'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 6}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '-->', prefix: '-'},
    			]);
    		});
    	});
    	it('Comment close proposals 3', function() {
    		var _o = setup({buffer: '<!-- --'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 7}).then(function(proposals) {
    			assertProposals(proposals, [
    				{proposal: '-->', prefix: '--'},
    			]);
    		});
    	});
    	it('Comment close proposals 4', function() {
    		var _o = setup({buffer: '<!-- -->'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 8}).then(function(proposals) {
    			assertTagProposals(proposals);
    		});
    	});
    	it('Comment close proposals 5', function() {
    		var _o = setup({buffer: '<!--'});
    		return assist.computeContentAssist(_o.editorContext, {offset: 4}).then(function(proposals) {
    			assertProposals(proposals, []);
    		});
    	});
    	// TODO Can't test inside nested tags as the parser includes the start of the close tag in the name
//    	it('Comment close proposals in tag 1', function() {
//    		var _o = setup({buffer: '<a><!-- </a>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 8}).then(function(proposals) {
//    			assertProposals(proposals, [
//    				{proposal: '-->', prefix: ''},
//    			]);
//    		});
//    	});
//    	it('Comment close proposals in tag 2', function() {
//    		var _o = setup({buffer: '<a><!-- -</a>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 9}).then(function(proposals) {
//    			assertProposals(proposals, [
//    				{proposal: '-->', prefix: '-'},
//    			]);
//    		});
//    	});
//    	it('Comment close proposals in tag 3', function() {
//    		var _o = setup({buffer: '<a><!-- --</a>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 10}).then(function(proposals) {
//    			assertProposals(proposals, [
//    				{proposal: '-->', prefix: '--'},
//    			]);
//    		});
//    	});
//    	it('Comment close proposals in tag 4', function() {
//    		var _o = setup({buffer: '<a><!-- --></a>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 11}).then(function(proposals) {
//    			assertTagProposals(proposals);
//    		});
//    	});
//    	it('Comment close proposals in tag 5', function() {
//    		var _o = setup({buffer: '<a><!--</a>'});
//    		return assist.computeContentAssist(_o.editorContext, {offset: 7}).then(function(proposals) {
//    			assertProposals(proposals, []);
//    		});
//    	});
    	// TODO HTML5 does not require lower case tags/attributes, our templates require lower case
    });
});