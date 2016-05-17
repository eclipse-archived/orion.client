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
		describe('ES6 Outliner Tests', function() {
			this.timeout(10000);
			
			before('Reset Tern Server', function(done) {
				worker.start(done,  {options:{ecmaVersion:6, sourceType:"module"}});
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

			it('test class definition with constructor', function(callback) {
				var r = setup(callback,
					"class A {\n" +
					"	constructor(a, b) {\n" +
					"		this.a = a;\n" +
					"		this.b = b;\n" +
					"	}\n" +
					"}");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "class A", 6, 7);
						assert(outline[0].children.length, 1);
						assertElement(outline[0].children[0], "constructor(a, b)", 11, 61);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			it('test anonymous class expression', function(callback) {
				var r = setup(callback,
					"var c = class {\n" +
					"}");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "class <anonymous>", 8, 13);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			it('test array function expression', function(callback) {
				var r = setup(callback, "() => {return \"hello!\";};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "arrow function() => {}", 0, 24);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			it('test array function expression 2', function(callback) {
				var r = setup(callback, "(val) => {return val;};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "arrow function(val) => {}", 0, 22);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			it('test array function expression 3', function(callback) {
				var r = setup(callback, "val => {return val;};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "arrow function(val) => {}", 0, 20);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			it('test let ObjectExpression', function(callback) {
				var r = setup(callback, "let object = {\"a\": \"\", \"b\": \"\", \"c\": \"\"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "let object = {Object, Object, Object}", 4, 10);
						callback();
					}
					catch(err) {
						callback(err);
					}
				});
			});
			it('test const ObjectExpression', function(callback) {
				var r = setup(callback, "const object = {\"a\": \"\", \"b\": \"\", \"c\": \"\"};");
				r.outliner.computeOutline(r.editorContext).then(function(outline) {
					try {
						if(!outline || outline.length < 1) {
							assert.fail("There should be one outline element");
						}
						assertElement(outline[0], "const object = {Object, Object, Object}", 6, 12);
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