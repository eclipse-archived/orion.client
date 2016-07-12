/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, mocha */
/* eslint-disable missing-nls */
define([
	'chai/chai',
	'orion/Deferred',
	'javascript/outliner',
	'mocha/mocha' //not a module, leave it at the end
], function(chai, Deferred, Outliner) {
	
	var assert = chai.assert;	

	return function(worker) {
		describe('Outliner Tests', function() {
			this.timeout(10000);
			
			before('Reset Tern Server', function(done) {
				worker.start(done); // Reset the tern server state to remove any prior files
			});
			
		    function setup(callback, text, contentType) {
		    	worker.setTestState({callback: callback});
		        return {
			        outliner: new Outliner.JSOutliner(worker),
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
				if (element.start !== 0) {
					assert(element.start, "The outlined element must have a start range");
				}
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
				
			it('testfuncDeclaration1', function(callback) {
				var r = setup(callback, "function F1(p1, p2) {};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "F1(p1, p2)", 9, 11);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			/**
			 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457057
			 */
			it('testMemberExpressionLiteral1', function(callback) {
				var r = setup(callback, "Foo[\'bar\'] = function() {}");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						assert(outline && outline.length > 0, "There should be one outline element");
						assertElement(outline[0], "Foo.bar()", 0, 10);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			/**
			 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457057
			 */
			it('testMemberExpressionLiteral2', function(callback) {
				var r = setup(callback, "Foo[\'bar\'].baz = function() {}");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						assert(outline && outline.length > 0, "There should be one outline element");
						assertElement(outline[0], "Foo.bar.baz()", 0, 14);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			/**
			 * https://bugs.eclipse.org/bugs/show_bug.cgi?id=457057
			 */
			it('testMemberExpressionLiteral3', function(callback) {
				var r = setup(callback, "Foo.baz[\'bar\'] = function() {}");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						assert(outline && outline.length > 0, "There should be one outline element");
						assertElement(outline[0], "Foo.baz.bar()", 0, 14);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testfuncExpression1', function(callback) {
				var r = setup(callback, "var obj = {\n"+
					"\titem: function(p1, p2) {}\n"+
					"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						if(!outline[0].children || outline[0].children.length < 1) {
							assert.fail("There should be one child outline element");
						}
						assertElement(outline[0].children[0], "item(p1, p2)", 13, 17);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			it('testLabelledFuncExpr1', function(callback) {
				var r = setup(callback, "var obj = function foo(p1, p2) {};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "foo(p1, p2)", 19, 22);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			it('testLabelledFuncExpr2', function(callback) {
				var r = setup(callback, "console.log(function foo(p1, p2) {});");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "foo(p1, p2)", 21, 24);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testObjectExpression1', function(callback) {
				var r = setup(callback, "var object = {};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "var object = {...}", 4, 10);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testObjectExpression2', function(callback) {
				var r = setup(callback, "var object = {a: \"\", b: \"\", c: \"\"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "var object = {a, b, c}", 4, 10);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testObjectExpression3', function(callback) {
				var r = setup(callback, "var object = {\"a\": \"\", \"b\": \"\", \"c\": \"\"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "var object = {Object, Object, Object}", 4, 10);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testObjectExpression3', function(callback) {
				// Max length for properties is 50 characters
				var r = setup(callback, "var object = {A123456789B123456789C123456789D123456789E123456789: \"\"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "var object = {A123456789B123456789C123456789D123456789E123456789}", 4, 10);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testObjectExpression4', function(callback) {
				// Max length for properties is 50 characters
				var r = setup(callback, "var object = {A123456789B123456789C123456789D123456789E123456789F: \"\"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "var object = {...}", 4, 10);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testObjectExpression5', function(callback) {
				// Max length for properties is 50 characters
				var r = setup(callback, "var object = {a: \"\", b: \"\", A123456789B123456789C123456789D123456789E123456789F: \"\"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "var object = {a, b, ...}", 4, 10);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testClosure1', function(callback) {
				var r = setup(callback, "foo.bar({});");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "closure {...}", 8, 10);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testClosure1', function(callback) {
				var r = setup(callback, "foo.bar({a: \"\", b: \"\"});");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "closure {a, b}", 8, 22);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testObjectPropertyLiteral1', function(callback) {
				var r = setup(callback, "var obj = {\n"+
					"\t\"item\": function(p1, p2) {}\n"+
					"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						if(!outline[0].children || outline[0].children.length < 1) {
							assert.fail("There should be one child outline element");
						}
						assertElement(outline[0].children[0], "item(p1, p2)", 13, 19);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testObjectPropertyLiteral2', function(callback) {
				var r = setup(callback, "var obj = {\n"+
					"\t\"item\": null\n"+
					"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						if(!outline[0].children || outline[0].children.length < 1) {
							assert.fail("There should be one child outline element");
						}
						assertElement(outline[0].children[0], "item", 13, 19);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testObjectPropertyLiteral3', function(callback) {
				var r = setup(callback, "var obj = {\n"+
					"\t\"item\": {}\n"+
					"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						if(!outline[0].children || outline[0].children.length < 1) {
							assert.fail("There should be one child outline element");
						}
						assertElement(outline[0].children[0], "item {...}", 13, 19);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testObjectPropertyLiteral4', function(callback) {
				var r = setup(callback, "var obj = {\n"+
					"\t\"item\": function(p1, p2) {}\n"+
					"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						if(!outline[0].children || outline[0].children.length < 1) {
							assert.fail("There should be one child outline element");
						}
						assertElement(outline[0].children[0], "item(p1, p2)", 13, 19);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testObjectPropertyLiteral5', function(callback) {
				var r = setup(callback, "var obj = {\n"+
					"\t\"item\": null\n"+
					"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						if(!outline[0].children || outline[0].children.length < 1) {
							assert.fail("There should be one child outline element");
						}
						assertElement(outline[0].children[0], "item", 13, 19);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			it('testObjectPropertyLiteral6', function(callback) {
				var r = setup(callback, "var obj = {\n"+
					"\t\"item\": {}\n"+
					"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						if(!outline[0].children || outline[0].children.length < 1) {
							assert.fail("There should be one child outline element");
						}
						assertElement(outline[0].children[0], "item {...}", 13, 19);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			/**
			 * Tests a return statement that is an object expression
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424202
			 */
			it('testReturnObject1', function(callback) {
				var r = setup(callback, "function f1() {\n"+
					"\t return {};\n"+
					"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						if(!outline[0].children || outline[0].children.length < 1) {
							assert.fail("There should be one child outline element");
						}
						assertElement(outline[0].children[0], "return {...}", 18, 24);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			/**
			 * Tests a return statement that is an object expression
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424202
			 */
			it('testReturnObject2', function(callback) {
				var r = setup(callback, "function f1() {\n"+
					"\t return function() {};\n"+
					"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						if(!outline[0].children || outline[0].children.length < 1) {
							assert.fail("There should be one child outline element");
						}
						assertElement(outline[0].children[0], "return {...}", 18, 24);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			/**
			 * Tests a return statement that is an object expression
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424202
			 */
			it('testReturnObject3', function(callback) {
				var r = setup(callback, "function f1() {\n"+
					"\t return {\n"+
					"\t\tf1: function() {return {};}"+
					"\t};"+
					"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
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
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			/**
			 * Tests a return statement that is an object expression
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424202
			 */
			it('testReturnObject4', function(callback) {
				var r = setup(callback, "function f1() {\n"+
					"\t return {\n"+
					"\t\tf1: function() {return function() {};}"+
					"\t};"+
					"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
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
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
			/**
			 * Tests a return statement that is an object expression
			 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=424202
			 */
			it('testReturnObject5', function(callback) {
				var r = setup(callback, "function f1() {\n"+
					"\t return {a: \"\", b: \"\"};\n"+
					"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						if(!outline[0].children || outline[0].children.length < 1) {
							assert.fail("There should be one child outline element");
						}
						assertElement(outline[0].children[0], "return {a, b}", 18, 24);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			
		});	
	};
});