/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, mocha*/
define([
	'javascript/astManager',
	'chai/chai',
	'orion/Deferred',
	'mocha/mocha' // last because Mocha is not a module
], function(ASTManager, chai, Deferred) {
	
	var assert = chai.assert;

	describe('AST Manager Tests', function() {
		
		/**
		 * Fake esprima that we can use to return an arbitary AST to the caller.
		 */
		function MockEsprima() {
		}
		MockEsprima.prototype._setAST = function(ast) {
			this.ast = ast;
		};
		MockEsprima.prototype.parse = function(text, options) {
			return this.ast;
		};
	
		/**
		 * @name setup
		 * @description Sets the test up prior to running
		 * @function
		 * @public
		 */
		function setup() {
			var mockEditorContext = {
				_setText: function(text) {
					this.text = text;
				},
				getText: function() {
					// doesn't matter since mockEsprima ignores the text param
					return new Deferred().resolve(this.text);
				}
			};
			var mockEsprima = new MockEsprima();
			var astManager = new ASTManager.ASTManager(mockEsprima);
			return {
				astManager: astManager,
				editorContext: mockEditorContext,
				mockEsprima: mockEsprima
			};
		}
	
		it("test get AST", function() {
			var result = setup(),
			    astManager = result.astManager,
			    editorContext = result.editorContext,
			    mockEsprima = result.mockEsprima;
	
			mockEsprima._setAST("this is the AST");
			return astManager.getAST(editorContext).then(function(ast) {
				assert.equal(ast, "this is the AST");
			});
		});
		describe("cache", function() {
			it("should not hit cache when file metadata is not known", function() {
				var result = setup(),
				    astManager = result.astManager,
				    editorContext = result.editorContext,
				    mockEsprima = result.mockEsprima;
		
				var i = 0;
				mockEsprima.parse = function() {
					return "AST callcount " + (i++);
				};
				return astManager.getAST(editorContext).then(function(ast) {
					assert.equal(ast, "AST callcount 0");
					return astManager.getAST(editorContext).then(function(ast) {
						assert.equal(ast, "AST callcount 1");
					});
				});
			});
			it("should hit cache when metadata is known and Location matches", function() {
				var result = setup(),
				    astManager = result.astManager,
				    editorContext = result.editorContext,
				    mockEsprima = result.mockEsprima;
				editorContext.getFileMetadata = function() {
					return new Deferred().resolve({ location: "foo.js" });
				};

				var i = 0;
				mockEsprima.parse = function() {
					return "AST callcount " + (i++);
				};
				return astManager.getAST(editorContext).then(function(ast) {
					assert.equal(ast, "AST callcount 0");
					return astManager.getAST(editorContext).then(function(ast) {
						assert.equal(ast, "AST callcount 0");
					});
				});
			});
			it("should NOT hit cache when metadata is known and Location does not match", function() {
				var result = setup(),
				    astManager = result.astManager,
				    editorContext = result.editorContext,
				    mockEsprima = result.mockEsprima;

				var i = 0;
				mockEsprima.parse = function() {
					return "AST callcount " + (i++);
				};
				editorContext.getFileMetadata = function() {
					return new Deferred().resolve({ location: "foo" });
				};
				return astManager.getAST(editorContext).then(function(ast) {
					assert.equal(ast, "AST callcount 0");
					editorContext.getFileMetadata = function() {
						return new Deferred().resolve({ location: "bar" });
					};
					return astManager.getAST(editorContext).then(function(ast) {
						assert.equal(ast, "AST callcount 1");
					});
				});
			});
			it("should invalidate cache on #updated()", function() {
				var result = setup(),
				    astManager = result.astManager,
				    editorContext = result.editorContext,
				    mockEsprima = result.mockEsprima;

				var i = 0;
				mockEsprima.parse = function() {
					return "AST callcount " + (i++);
				};
				return astManager.getAST(editorContext).then(function(ast) {
					assert.equal(ast, "AST callcount 0");
					astManager.updated({});
					// Ensure we do not receive the cached "AST callcount 0" after a model change
					return astManager.getAST(editorContext).then(function(ast) {
						assert.equal(ast, "AST callcount 1");
					});
				});
			});
		});
		it("test get AST with throwy parser", function() {
			var result = setup(),
			    astManager = result.astManager,
			    editorContext = result.editorContext,
			    mockEsprima = result.mockEsprima;
	
			var error = new Error("Game over man");
			mockEsprima.parse = function() {
				throw error;
			};
			return astManager.getAST(editorContext).then(function(ast) {
				assert.ok(ast);
				assert.equal(ast.type, "Program");
				assert.equal(ast.errors[0].message, error.message);
			});
		});
	});
});
