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
/*eslint-env browser, amd, mocha*/
define([
	'chai/chai',
	'orion/Deferred',
	'webtools/htmlValidator',
	'webtools/htmlAstManager',
	'mocha/mocha' // no exports
], function(chai, Deferred, HtmlValidator, AstMgr) {
	/* eslint-disable missing-nls */
	var assert = chai.assert;

    var validator = null;
    var astMgr = null;

	describe("HTML Validator Tests", function() {

		function setup(options) {
		    var buffer = options.buffer;
		    var contentType = options.contentType ? options.contentType : 'text/html';
		    astMgr = new AstMgr.HtmlAstManager();
		    validator = new HtmlValidator(astMgr);
//		    validator._restoreRules();
//			var rule = options.rule;
//			validator._enableOnly(rule.id, rule.severity);
			var editorContext = {
				/*override*/
				getText: function() {
					return new Deferred().resolve(buffer);
				},

				getFileMetadata: function() {
    			    var o = Object.create(null);
    			    o.contentType = Object.create(null);
    			    o.contentType.id = contentType;
    			    o.location = 'html_validator_test_script.html';
    			    return new Deferred().resolve(o);
    			}
			};
			return {
			    validator: validator,
				editorContext: editorContext,
				contentType: contentType
			};
		}

		/**
    	 * @name assertProblems
    	 * @description Compares the computed problem set against the expected ones
    	 * @param {Array.<orion.Problem>} computed The computed set of problems
    	 * @param {Array.<Object>} expected The expected set of problems
    	 */
    	function assertProblems(computed, expected) {
    	    var problems = computed.problems;
    	    assert.equal(problems.length, expected.length, "The wrong number of problems was computed");
    	    for(var i = 0; i < problems.length; i++) {
    	        var pb = problems[i];
    	        var expb = expected[i];
    	        assert.equal(pb.start, expb.start, "Wrong problem start");
    	        assert.equal(pb.end, expb.end, "Wrong problem end");
    	        assert.equal(pb.description, expb.description, "Wrong problem message");
    	        assert.equal(pb.severity, expb.severity, "Wrong problem severity");
    	        if(pb.descriptionArgs) {
    	            assert(expb.descriptionArgs, "Missing expected description arguments");
    	            assert.equal(pb.descriptionArgs.nls, expb.descriptionArgs.nls, "Missing NLS description argument key");
    	        }
    	    }
	    }

		// TODO ATTR-BAN rule is disabled by default currently
		describe.skip('attr-ban', function(){
			it("attr-ban bgcolor", function() {
			    var val = setup({buffer: '<html><body bgcolor="red"></body></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 12,
					     end: 25,
					     severity: 'warning',
					     description: "The 'bgcolor' attribute is banned."
					    }
					]);
				});
			});
			it("attr-ban bgcolor no value", function() {
			    var val = setup({buffer: '<html><body bgcolor></body></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 12,
					     end: 19,
					     severity: 'warning',
					     description: "The 'bgcolor' attribute is banned."
					    }
					]);
				});
			});
			it("attr-ban valid attribute", function() {
			    var val = setup({buffer: '<html><body color="red"></body></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					]);
				});
			});
		});
		describe('img-req-alt', function(){
			it("img-req-alt no attr", function() {
			    var val = setup({buffer: '<html><img></img></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 6,
					     end: 11,
					     severity: 'warning',
					     description: "The 'alt' property must be set for image tags (for accessibility)."
					    }
					]);
				});
			});
			it("img-req-alt other attr", function() {
			    var val = setup({buffer: '<html><img height="100%"></img></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 6,
					     end: 25,
					     severity: 'warning',
					     description: "The 'alt' property must be set for image tags (for accessibility)."
					    }
					]);
				});
			});
			it("img-req-alt no attr casing", function() {
			    var val = setup({buffer: '<HTML><IMG></IMG></HTML>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 6,
					     end: 11,
					     severity: 'warning',
					     description: "The 'alt' property must be set for image tags (for accessibility)."
					    }
					]);
				});
			});
			it("img-req-alt no attr mixed casing", function() {
			    var val = setup({buffer: '<HtMl><Img></imG></HTML>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 6,
					     end: 11,
					     severity: 'warning',
					     description: "The 'alt' property must be set for image tags (for accessibility)."
					    }
					]);
				});
			});
			it("img-req-alt correct", function() {
			    var val = setup({buffer: '<html><img alt="Text"></img></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					]);
				});
			});
			it("img-req-alt correct casing", function() {
			    var val = setup({buffer: '<html><IMG ALT="Text"></img></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					]);
				});
			});
			it("img-req-alt correct odd casing", function() {
			    var val = setup({buffer: '<html><ImG AlT="Text"></ImG></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					]);
				});
			});
		});
		describe('tag-close', function(){
			it("tag-close missing innermost tag", function() {
			    var val = setup({buffer: '<html><a></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 6,
					     end: 9,
					     severity: 'warning',
					     description: "No matching closing tag for 'a'."
					    }
					]);
				});
			});
			it("tag-close missing root tag no children", function() {
			    var val = setup({buffer: '<html> \n\n ', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 0,
					     end: 6,
					     severity: 'warning',
					     description: "No matching closing tag for 'html'."
					    }
					]);
				});
			});
			it("tag-close missing root tag children", function() {
			    var val = setup({buffer: '<html><a></a>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 0,
					     end: 6,
					     severity: 'warning',
					     description: "No matching closing tag for 'html'."
					    }
					]);
				});
			});
			it("tag-close missing nested tag", function() {
			    var val = setup({buffer: '<html><a><b></b></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 6,
					     end: 9,
					     severity: 'warning',
					     description: "No matching closing tag for 'a'."
					    }
					]);
				});
			});
			it("tag-close nothing missing", function() {
			    var val = setup({buffer: '<html><a></a><b></b></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					]);
				});
			});
			it("tag-close siblings missing 1", function() {
			    var val = setup({buffer: '<html><a><b></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 6,
					     end: 9,
					     severity: 'warning',
					     description: "No matching closing tag for 'a'."
					    },
					    {start: 9,
					     end: 12,
					     severity: 'warning',
					     description: "No matching closing tag for 'b'."
					    }
					]);
				});
			});
			it("tag-close siblings missing 2", function() {
			    var val = setup({buffer: '<html><a></a><b></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 13,
					     end: 16,
					     severity: 'warning',
					     description: "No matching closing tag for 'b'."
					    }
					]);
				});
			});
			it("tag-close siblings missing 3", function() {
			    var val = setup({buffer: '<html><a><b></b></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 6,
					     end: 9,
					     severity: 'warning',
					     description: "No matching closing tag for 'a'."
					    }
					]);
				});
			});
			it("tag-close void elements 1", function() {
			    var val = setup({buffer: '<html><meta></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					]);
				});
			});
			it("tag-close void elements 2", function() {
			    var val = setup({buffer: '<html><meta><a></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 12,
					     end: 15,
					     severity: 'warning',
					     description: "No matching closing tag for 'a'."
					    }
					]);
				});
			});
			it("tag-close void elements 3", function() {
			    var val = setup({buffer: '<html><meta/></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					]);
				});
			});
			it("tag-close void elements 4", function() {
			    var val = setup({buffer: '<html><meta/><a></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 13,
					     end: 16,
					     severity: 'warning',
					     description: "No matching closing tag for 'a'."
					    }
					]);
				});
			});
			it("tag-close mismatched tags 1", function() {
			    var val = setup({buffer: '<html><a></b></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 6,
					     end: 9,
					     severity: 'warning',
					     description: "No matching closing tag for 'a'."
					    }
					]);
				});
			});
			it("tag-close mismatched tags 2", function() {
			    var val = setup({buffer: '<html><a></b><b></a></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 13,
					     end: 16,
					     severity: 'warning',
					     description: "No matching closing tag for 'b'."
					    }
					]);
				});
			});
			it("tag-close mismatched tags 3", function() {
			    var val = setup({buffer: '<html><a></b><b></c></html>', rule: {id:null, severity:1}});
				return validator.computeProblems(val.editorContext).then(function(result) {
					assertProblems(result, [
					    {start: 6,
					     end: 9,
					     severity: 'warning',
					     description: "No matching closing tag for 'a'."
					    },
					     {start: 13,
					     end: 16,
					     severity: 'warning',
					     description: "No matching closing tag for 'b'."
					    }
					]);
				});
			});
		});
	});
});