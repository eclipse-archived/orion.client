/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, node, mocha*/
/* eslint-disable missing-nls */
define([
	'chai/chai',
	'esprima',
	'javascript/astManager',
	'orion/Deferred',
	'javascript/outliner',
	'mocha/mocha' //not a module, leave it at the end
], function(chai, Esprima, ASTManager, Deferred, Outliner) {
	
	var assert = chai.assert;	

	describe('Outliner Tests', function() {
	    function setup(text, contentType) {
	        return {
		        outliner: new Outliner.JSOutliner(new ASTManager.ASTManager(Esprima)),
		        editorContext: {
		            getText: function() {
        				return new Deferred().resolve(text);
        			},
        			
        			getFileMetadata: function() {
        			    var o = Object.create(null);
        			    o.contentType = Object.create(null);
        			    o.contentType.id = contentType ? contentType : 'application/javascript';
        			    o.location = 'outliner_test_script.js';
        			    return new Deferred().resolve(o);
        			}
		        }
	        };
	    }
			
		/**
		 * @name assertElement
		 * @description Checks the given element against the expected name, start and end to make sure it is outlined correctly
		 * @function
		 * @public
		 * @param {Object} element The computed outline element to check
		 * @param {String} label The expected outline label
		 * @param {Number} start The expected start offset of the element
		 * @param {Number} end The expected end offset of the element
		 */
		function assertElement(element, label, start, end) {
			assert(element, "The tested element cannot be null");
			assert(element.label, "The outlined element must have a label");
			assert(element.start, "The outlined element must have a start range");
			assert(element.end, "The outlined element must have an end range");
			var fullLabel = element.label;
			if (element.labelPre){
				fullLabel = element.labelPre + fullLabel;
			}
			if (element.labelPost){
				fullLabel += element.labelPost;
			}
			assert.equal(fullLabel, label, "The label is not the same");
			assert.equal(element.start, start, "The start range is not the same");
			assert.equal(element.end, end, "The end range is not the same");
		}
			
		it('testfuncDeclaration1', function() {
			var r = setup("function F1(p1, p2) {};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				assertElement(outline[0], "F1(p1, p2)", 9, 11);
			});
		});
		/**
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457057
		 */
		it('testMemberExpressionLiteral1', function() {
			var r = setup("Foo[\'bar\'] = function() {}");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				assert(outline && outline.length > 0, "There should be one outline element");
				assertElement(outline[0], "Foo.bar()", 1, 10);
			});
		});
		/**
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457057
		 */
		it('testMemberExpressionLiteral2', function() {
			var r = setup("Foo[\'bar\'].baz = function() {}");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				assert(outline && outline.length > 0, "There should be one outline element");
				assertElement(outline[0], "Foo.bar.baz()", 1, 14);
			});
		});
		/**
		 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457057
		 */
		it('testMemberExpressionLiteral3', function() {
			var r = setup("Foo.baz[\'bar\'] = function() {}");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				assert(outline && outline.length > 0, "There should be one outline element");
				assertElement(outline[0], "Foo.baz.bar()", 1, 14);
			});
		});
		
		it('testfuncExpression1', function() {
			var r = setup("var obj = {\n"+
				"\titem: function(p1, p2) {}\n"+
				"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				if(!outline[0].children || outline[0].children.length < 1) {
					assert.fail("There should be one child outline element");
				}
				assertElement(outline[0].children[0], "item(p1, p2)", 13, 17);
			});
		});
		
		it('testObjectExpression1', function() {
			var r = setup("var object = {};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				assertElement(outline[0], "var object = {...}", 4, 10);
			});
		});
		
		it('testObjectExpression2', function() {
			var r = setup("var object = {a: \"\", b: \"\", c: \"\"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				assertElement(outline[0], "var object = {a, b, c}", 4, 10);
			});
		});
		
		it('testObjectExpression3', function() {
			var r = setup("var object = {\"a\": \"\", \"b\": \"\", \"c\": \"\"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				assertElement(outline[0], "var object = {Object, Object, Object}", 4, 10);
			});
		});
		
		it('testObjectExpression3', function() {
			// Max length for properties is 50 characters
			var r = setup("var object = {A123456789B123456789C123456789D123456789E123456789: \"\"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				assertElement(outline[0], "var object = {A123456789B123456789C123456789D123456789E123456789}", 4, 10);
			});
		});
		
		it('testObjectExpression4', function() {
			// Max length for properties is 50 characters
			var r = setup("var object = {A123456789B123456789C123456789D123456789E123456789F: \"\"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				assertElement(outline[0], "var object = {...}", 4, 10);
			});
		});
		
		it('testObjectExpression5', function() {
			// Max length for properties is 50 characters
			var r = setup("var object = {a: \"\", b: \"\", A123456789B123456789C123456789D123456789E123456789F: \"\"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				assertElement(outline[0], "var object = {a, b, ...}", 4, 10);
			});
		});
		
		it('testClosure1', function() {
			var r = setup("foo.bar({});");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				assertElement(outline[0], "closure {...}", 8, 10);
			});
		});
		
		it('testClosure1', function() {
			var r = setup("foo.bar({a: \"\", b: \"\"});");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				assertElement(outline[0], "closure {a, b}", 8, 22);
			});
		});
		
		it('testObjectPropertyLiteral1', function() {
			var r = setup("var obj = {\n"+
				"\t\"item\": function(p1, p2) {}\n"+
				"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				if(!outline[0].children || outline[0].children.length < 1) {
					assert.fail("There should be one child outline element");
				}
				assertElement(outline[0].children[0], "item(p1, p2)", 13, 19);
			});
		});
		
		it('testObjectPropertyLiteral2', function() {
			var r = setup("var obj = {\n"+
				"\t\"item\": null\n"+
				"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				if(!outline[0].children || outline[0].children.length < 1) {
					assert.fail("There should be one child outline element");
				}
				assertElement(outline[0].children[0], "item", 13, 19);
			});
		});
		
		it('testObjectPropertyLiteral3', function() {
			var r = setup("var obj = {\n"+
				"\t\"item\": {}\n"+
				"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				if(!outline[0].children || outline[0].children.length < 1) {
					assert.fail("There should be one child outline element");
				}
				assertElement(outline[0].children[0], "item {...}", 13, 19);
			});
		});
		
		it('testObjectPropertyLiteral4', function() {
			var r = setup("var obj = {\n"+
				"\t\"item\": function(p1, p2) {}\n"+
				"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				if(!outline[0].children || outline[0].children.length < 1) {
					assert.fail("There should be one child outline element");
				}
				assertElement(outline[0].children[0], "item(p1, p2)", 13, 19);
			});
		});
		
		it('testObjectPropertyLiteral5', function() {
			var r = setup("var obj = {\n"+
				"\t\"item\": null\n"+
				"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				if(!outline[0].children || outline[0].children.length < 1) {
					assert.fail("There should be one child outline element");
				}
				assertElement(outline[0].children[0], "item", 13, 19);
			});
		});
		
		it('testObjectPropertyLiteral6', function() {
			var r = setup("var obj = {\n"+
				"\t\"item\": {}\n"+
				"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				if(!outline[0].children || outline[0].children.length < 1) {
					assert.fail("There should be one child outline element");
				}
				assertElement(outline[0].children[0], "item {...}", 13, 19);
			});
		});
		
		/**
		 * Tests a return statement that is an object expression
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424202
		 */
		it('testReturnObject1', function() {
			var r = setup("function f1() {\n"+
				"\t return {};\n"+
				"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				if(!outline[0].children || outline[0].children.length < 1) {
					assert.fail("There should be one child outline element");
				}
				assertElement(outline[0].children[0], "return {...}", 18, 24);
			});
		});
		
		/**
		 * Tests a return statement that is an object expression
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424202
		 */
		it('testReturnObject2', function() {
			var r = setup("function f1() {\n"+
				"\t return function() {};\n"+
				"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				if(!outline[0].children || outline[0].children.length < 1) {
					assert.fail("There should be one child outline element");
				}
				assertElement(outline[0].children[0], "return {...}", 18, 24);
			});
		});
		
		/**
		 * Tests a return statement that is an object expression
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424202
		 */
		it('testReturnObject3', function() {
			var r = setup("function f1() {\n"+
				"\t return {\n"+
				"\t\tf1: function() {return {};}"+
				"\t};"+
				"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				if(!outline[0].children || outline[0].children.length < 1) {
					assert.fail("There should be one level one child outline element");
				}
				if(!outline[0].children[0].children || outline[0].children[0].children.length < 1) {
					assert.fail("There should be one level two child outline element");
				}
				if(!outline[0].children[0].children[0].children || outline[0].children[0].children[0].children.length < 1) {
					assert.fail("There should be one level three child outline element");
				}
				assertElement(outline[0].children[0].children[0].children[0], "return {...}", 45, 51);
			});
		});
		
		/**
		 * Tests a return statement that is an object expression
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424202
		 */
		it('testReturnObject4', function() {
			var r = setup("function f1() {\n"+
				"\t return {\n"+
				"\t\tf1: function() {return function() {};}"+
				"\t};"+
				"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				if(!outline[0].children || outline[0].children.length < 1) {
					assert.fail("There should be one level one child outline element");
				}
				if(!outline[0].children[0].children || outline[0].children[0].children.length < 1) {
					assert.fail("There should be one level two child outline element");
				}
				if(!outline[0].children[0].children[0].children || outline[0].children[0].children[0].children.length < 1) {
					assert.fail("There should be one level three child outline element");
				}
				assertElement(outline[0].children[0].children[0].children[0], "return {...}", 45, 51);
			});
		});
		
		/**
		 * Tests a return statement that is an object expression
		 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424202
		 */
		it('testReturnObject5', function() {
			var r = setup("function f1() {\n"+
				"\t return {a: \"\", b: \"\"};\n"+
				"};");
			return r.outliner.computeOutline(r.editorContext).then(function(outline) {
				if(!outline || outline.length < 1) {
					assert.fail("There should be one outline element");
				}
				if(!outline[0].children || outline[0].children.length < 1) {
					assert.fail("There should be one child outline element");
				}
				assertElement(outline[0].children[0], "return {a, b}", 18, 24);
			});
		});
		
	});	
});