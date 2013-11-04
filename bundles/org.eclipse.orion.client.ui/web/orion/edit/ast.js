/******************************************************************************* 
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation 
 ******************************************************************************/
/*global define*/
define([
	'orion/Deferred',
	'orion/objects',
	'orion/serviceTracker'
], function(Deferred, objects, ServiceTracker) {
	function toArray(o) {
		return Array.isArray(o) ? o : [o];
	}

	/**
	 * @name orion.edit.ASTManager
	 * @class Provides access to AST providers registered with the Service Registry.
	 * @classdesc Provides access to AST providers registered with the Service Registry.
	 * @description This class should not be instantiated directly. Instead, clients should obtain it through the Service Registry.
	 *
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 * @param {orion.editor.InputManager} inputManager
	 */
	function ASTManager(serviceRegistry, inputManager) {
		this.serviceRegistry = serviceRegistry;
		this.inputManager = inputManager;
		this.start();
		this.cache = null;
	}
	objects.mixin(ASTManager.prototype, /** @lends orion.edit.ASTManager.prototype */ {
		/**
		 * @name start
		 * @description starts the manager, throws an error if the manager has already been started
		 * @function
		 * @public
		 * @memberof orion.edit.ASTManager.prototype
		 * @throws Error if the manager has already been started
		 */
		start: function() {
			if (this.registration) {
				throw new Error("The AST manager has already been started");
			}
			this.tracker = new ServiceTracker(this.serviceRegistry, "orion.core.astprovider"); //$NON-NLS-0$
			this.tracker.open();

			this.registration = this.serviceRegistry.registerService("orion.core.astmanager", this, null); //$NON-NLS-0$
			this.contextRegistration = this.serviceRegistry.registerService("orion.edit.context", {
				getAST: this.getAST.bind(this)
			}, null); //$NON-NLS-0$
		},
		/**
		 * @name stop
		 * @description stops the manager, throws an error if the manager is not running
		 * @function
		 * @public
		 * @memberof orion.edit.ASTManager.prototype
		 * @throws Error if the manager has already been stopped
		 */
		stop: function() {
			if(this.registration) {
				this.registration.unregister();
				this.contextRegistration.unregister();
				this.tracker.close();
				this.listener = null;
				this.registration = null;
				this.cache = null;
			}
			else {
				throw new Error("The AST manager has laready been stopped");
			}
		},
		/**
		 * @name updated
		 * @description Notifies the AST manager of a change to the model.
		 * @function
		 * @public
		 * @memberof orion.edit.ASTManager.prototype
		 * @param {Object} event
		 */
		updated: function(event) {
			this.cache = null;
		},
		/**
		 * @name _getASTProvider
		 * @description Returns the AST provider for the given content type or <code>null</code> if it could not be computed
		 * @function
		 * @private
		 * @memberof orion.edit.ASTManager.prototype
		 * @param {String} contentTypeId the content type identifier
		 * @returns {Object|orion.Promise} An AST provider capable of providing an AST for the given contentType.
		 */
		_getASTProvider: function(contentTypeId) {
			var providers = this.tracker.getServiceReferences().filter(function(serviceRef) {
				return toArray(serviceRef.getProperty("contentType")).indexOf(contentTypeId) !== -1;
			});
			var serviceRef = providers[0];
			return serviceRef ? this.serviceRegistry.getService(serviceRef) : null;
		},
		/**
		 * @name _getAST
		 * @description Computes the AST for the given content type identifier and context
		 * @function
		 * @private
		 * @memberof orion.edit.ASTManager.prototype
		 * @param {Object} options The object of options to pass to the AST provider.
		 * @returns {Object|orion.Promise}
		 */
		_getAST: function(options) {
			if (this.cache) {
				return this.cache;
			}
			var contentType = this.inputManager.getContentType();
			if(contentType && contentType.id) {
				var provider = this._getASTProvider(contentType.id);
				if (provider) {
					options = options || {};
					options.text = this.inputManager.getEditor().getText();
					return provider.computeAST(options);
				}
			}
			return null;
		},
		/**
		 * @name getAST
		 * @description Retrieves an AST from a capable AST provider.
		 * @function
		 * @public
		 * @memberof orion.edit.ASTManager.prototype
		 * @param {Object} [options={}] Options to be passed to the AST provider.
		 * @returns {orion.Promise} A promise that resolves to the AST. Resolves to <code>null</code> if no capable provider was found.
		 */
		getAST: function(options) {
			var that = this;
			return Deferred.when(that._getAST(options), function(ast) {
					that.cache = ast;
					return ast;
				});
		}
	});
	return ASTManager;
});
