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
	'orion/edit/dispatcher',
	'mocha/mocha' // last because Mocha is not a module
], function(ASTManager, chai, Deferred, mDispatcher) {
	var assert = chai.assert;
	var Dispatcher = mDispatcher.Dispatcher;

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
		 * Fake EditorContext
		 */
		function MockEditorContext() {
			this._metadata = null;
		}
		MockEditorContext.prototype = Object.create(Object.prototype, {
			// Public API:
			getText: {
				value: function() {
					// doesn't matter since mockEsprima ignores the text param
					return new Deferred().resolve(this.text);
				}
			},
			getFileMetadata: {
				value: function() {
					var result = null;
					if (this._metadata)
						result = Dispatcher.toServiceFileObject(this._metadata, null);
					return new Deferred().resolve(result);
				},
			},
			// Internal helpers:
			text: {
				set: function(text) {
					this.text = text;
				}
			},
			metadata: {
				set: function(metadata) {
					this._metadata = metadata;
				}
			},
		});

		/**
		 * @name setup
		 * @description Sets the test up prior to running
		 * @function
		 * @public
		 */
		function setup() {
			var mockEditorContext = new MockEditorContext();
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
				editorContext.getFileMetadata = undefined; // No #getFileMetadata() in editorContext
				return astManager.getAST(editorContext).then(function(ast) {
					assert.equal(ast, "AST callcount 0");
					return astManager.getAST(editorContext).then(function(ast) {
						assert.equal(ast, "AST callcount 1");
					});
				});
			});
			it("should hit cache when metadata is known and location matches", function() {
				var result = setup(),
				    astManager = result.astManager,
				    editorContext = result.editorContext,
				    mockEsprima = result.mockEsprima;

				var i = 0;
				mockEsprima.parse = function() {
					return "AST callcount " + (i++);
				};
				editorContext.metadata = { Location: "/a/foo", Name: "foo.js" };
				return astManager.getAST(editorContext).then(function(ast) {
					assert.equal(ast, "AST callcount 0");
					return astManager.getAST(editorContext).then(function(ast) {
						assert.equal(ast, "AST callcount 0");
					});
				});
			});
			it("should NOT hit cache when metadata is known and location does not match", function() {
				var result = setup(),
				    astManager = result.astManager,
				    editorContext = result.editorContext,
				    mockEsprima = result.mockEsprima;

				var i = 0;
				mockEsprima.parse = function() {
					return "AST callcount " + (i++);
				};
				editorContext.metadata = { Location: "/a/foo", Name: "foo" };
				return astManager.getAST(editorContext).then(function(ast) {
					assert.equal(ast, "AST callcount 0");
					editorContext.metadata = { Location: "/a/bar", Name: "bar" }; // change metadata
					return astManager.getAST(editorContext).then(function(ast) {
						assert.equal(ast, "AST callcount 1");
					});
				});
			});
			it("should invalidate cache on #updated() when metadata.location matches cache's", function() {
				var result = setup(),
				    astManager = result.astManager,
				    editorContext = result.editorContext,
				    mockEsprima = result.mockEsprima;

				var i = 0;
				var metadata = { Location: "/a/foo", Name: "foo" };
				mockEsprima.parse = function() {
					return "AST callcount " + (i++);
				};
				editorContext.metadata = metadata;
				return astManager.getAST(editorContext).then(function(ast) {
					assert.equal(ast, "AST callcount 0");
					// This call to #updated should invalidate the cache, because the file location in the
					// param matches the editorContext's current file location.
					astManager.updated({ file: Dispatcher.toServiceFileObject(metadata) });
					return astManager.getAST(editorContext).then(function(ast) {
						assert.equal(ast, "AST callcount 1"); // has increased to 1
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
