/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 /*eslint-env amd, browser*/
define([
'orion/objects',
'orion/Deferred',
'i18n!javascript/nls/messages'
], function(Objects, Deferred, Messages) {

	var cachedContext;
	var deferred;

	/**
	 * @description Creates a new open declaration command
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} ASTManager The backing AST manager
	 * @param {TernWorker} ternWorker The running Tern worker
	 * @param {javascript.CUProvider} cuProvider
	 * @returns {javascript.commands.OpenDeclarationCommand} A new command
	 * @since 10.0
	 */
	function OpenImplementationCommand(ASTManager, ternWorker, cuProvider) {
		this.astManager = ASTManager;
		this.ternworker = ternWorker;
		this.cuprovider = cuProvider;
		this.timeout = null;
	}

	Objects.mixin(OpenImplementationCommand.prototype, {
		/* override */
		execute: function(editorContext, options) {
			var that = this;
			return editorContext.getText().then(function(text) {
		     	return that._findImpl(editorContext, options, text);
			});
		},

		_findImpl: function(editorContext, options, text) {
			cachedContext = editorContext;
			deferred = new Deferred();
			if(this.timeout) {
				clearTimeout(this.timeout);
			}
			this.timeout = setTimeout(function() {
				cachedContext.setStatus({Severity: 'Error', Message: "Could not compute implementation, the operation timed out"}); //$NON-NLS-1$
				if(deferred) {
					deferred.resolve("No implementation was found");
				}
				this.timeout = null;
			}, 5000);
			var files = [{type: 'full', name: options.input, text: text}]; //$NON-NLS-1$
			this.ternworker.postMessage(
				{request:'implementation', args:{params:{offset: options.offset}, files: files, meta:{location: options.input}}}, //$NON-NLS-1$
				function(response) {
					if(response.implementation && (typeof(response.implementation.start) === 'number' && typeof(response.implementation.end) === 'number')) {
						var options = Object.create(null);
						options.start = response.implementation.start;
						options.end = response.implementation.end;
						deferred.resolve(cachedContext.openEditor(response.implementation.file, options));
					} else {
						deferred.resolve(cachedContext.setStatus("No implementation was found"));
					}
				});
			return deferred;
		}
	});

	return {
		OpenImplementationCommand : OpenImplementationCommand
	};
});