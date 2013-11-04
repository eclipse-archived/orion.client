/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define*/
define([
	'js-tests/editor/mockEditor',
	'orion/assert',
	'orion/edit/ast',
	'orion/Deferred',
	'orion/EventTarget',
	'orion/inputManager',
	'orion/objects',
	'orion/serviceregistry'
], function(MockEditor, assert, ASTManager, Deferred, EventTarget, mInputManager, objects, mServiceRegistry) {

	/**
	 * @name setup
	 * @description Sets the test up prior to running
	 * @function
	 * @public
	 */
	function setup() {
		var serviceRegistry = new mServiceRegistry.ServiceRegistry();
		var inputManager = new mInputManager.InputManager({
			serviceRegistry: serviceRegistry,
			editor: new MockEditor()
		});
		var astManager = new ASTManager(serviceRegistry, inputManager);
		inputManager.getEditor().installTextView();
		inputManager.getEditor().getModel().addEventListener("Changed", astManager.updated.bind(astManager)); //$NON-NLS-0$
		return {
			serviceRegistry: serviceRegistry,
			inputManager: inputManager,
			astManager: astManager
		};
	}

	var tests = {};
	/**
	 * @name test_getAST
	 * @descripion tests asking the manager for an AST of a test content type <code>text/foo</code>
	 * @function
	 * @public
	 * @returns {orion.Deferred}
	 */
	tests.test_getAST = function() {
		var result = setup(),
		    serviceRegistry = result.serviceRegistry,
		    inputManager = result.inputManager,
		    astManager = result.astManager;

		serviceRegistry.registerService("orion.core.astprovider", {
				computeAST: function(context) {
					return { ast: "this is the AST" };
				}
			}, { contentType: ["text/foo"] });

		inputManager.setContentType({ id: "text/foo" });
		return astManager.getAST().then(function(ast) {
			assert.equal(ast.ast, "this is the AST");
		});
	};
	/**
	 * @name test_getAST_options
	 * @descripion tests asking the manager for options used to create an AST for a test content type <code>text/foo</code>
	 * @function
	 * @public
	 * @returns {orion.Deferred}
	 */
	tests.test_getAST_options = function() {
		var result = setup(),
		    serviceRegistry = result.serviceRegistry,
		    inputManager = result.inputManager,
		    astManager = result.astManager;

		var promise = new Deferred();
		serviceRegistry.registerService("orion.core.astprovider", {
				computeAST: function(options) {
					assert.equal(options.foo, "bar");
					assert.equal(options.text, "the text");
					promise.resolve();
				}
			}, { contentType: ["text/foo"] });

		inputManager.setContentType({ id: "text/foo" });
		inputManager.getEditor().setText("the text");
		astManager.getAST({ foo: "bar" });
		return promise;
	};
	/**
	 * @name test_AST_cache_is_used
	 * @descripion tests that the AST re-asked for is the cached copy
	 * @function
	 * @public
	 * @returns {orion.Deferred}
	 */
	tests.test_AST_cache_is_used = function() {
		var result = setup(),
		    serviceRegistry = result.serviceRegistry,
		    inputManager = result.inputManager,
		    astManager = result.astManager;

		var i = 0;
		serviceRegistry.registerService("orion.core.astprovider", {
				computeAST: function(options) {
					return "AST " + (i++);
				}
			}, { contentType: ["text/foo"] });

		inputManager.setContentType({ id: "text/foo" });

		return astManager.getAST().then(function(ast) {
			assert.equal(ast, "AST 0");
		}).then(function() {
			return astManager.getAST().then(function(ast) {
				assert.equal(ast, "AST 0");
			});
		});
	};
	/**
	 * @name test_AST_cache_is_invalidated
	 * @description tests that the cache of ASTs is properly cleaned on changed events and input loads
	 * @function
	 * @public
	 * @returns {orion.Deferred}
	 */
	tests.test_AST_cache_is_invalidated = function() {
		var result = setup(),
		    serviceRegistry = result.serviceRegistry,
		    inputManager = result.inputManager,
		    astManager = result.astManager;

		var i = 0;
		serviceRegistry.registerService("orion.core.astprovider", {
				computeAST: function(options) {
					return "AST " + (i++);
				}
			}, { contentType: ["text/foo"] });

		inputManager.setContentType({ id: "text/foo" });

		return astManager.getAST().then(function(ast) {
			assert.equal(ast, "AST 0");
			// Ensure we do not receive the cached "AST 0" after a model change
			inputManager.getEditor().setText("zot");
			return astManager.getAST().then(function(ast) {
				assert.strictEqual(ast, "AST 1");
			});
		});
	};

	return tests;
});
