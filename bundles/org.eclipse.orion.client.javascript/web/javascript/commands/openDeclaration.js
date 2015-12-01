/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
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

	/**
	 * @description Creates a new open declaration command
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} ASTManager The backing AST manager
	 * @param {TernWorker} ternWorker The running Tern worker
	 * @param {javascript.CUProvider} cuProvider
	 * @returns {javascript.commands.OpenDeclarationCommand} A new command
	 * @since 8.0
	 */
	function OpenDeclarationCommand(ASTManager, ternWorker, cuProvider, openMode) {
		this.astManager = ASTManager;
		this.ternworker = ternWorker;
		this.cuprovider = cuProvider;
		this.openMode = openMode;
		this.timeout = null;
	}

	Objects.mixin(OpenDeclarationCommand.prototype, {
		/* override */
		execute: function(editorContext, options) {
			var that = this;
			var deferred = new Deferred();
			editorContext.getText().then(function(text) {
				return that._findDecl(editorContext, options, text, deferred);
			}, deferred.reject);
			return deferred;
		},

		_findDecl: function(editorContext, options, text, deferred) {
			if(this.timeout) {
				clearTimeout(this.timeout);
			}
			this.timeout = setTimeout(function() {
				deferred.reject({Severity: 'Error', Message: Messages['noDeclTimedOut']}); //$NON-NLS-1$
				this.timeout = null;
			}, 5000);
			var files = [{type: 'full', name: options.input, text: text}]; //$NON-NLS-1$
			this.ternworker.postMessage(
				{request:'definition', args:{params:{offset: options.offset}, guess: true, files: files, meta:{location: options.input}}}, //$NON-NLS-1$
				function(response) {
					if(response.request === 'definition') {
						if(response.declaration && (typeof(response.declaration.start) === 'number' && typeof(response.declaration.end) === 'number')) {
							if(response.declaration.guess) {
								//TODO handle it being a guess, for now fall through
							}
							var opts = Object.create(null);
							opts.start = response.declaration.start;
							opts.end = response.declaration.end;
							if(this.openMode != null && typeof(this.openMode) !== 'undefined') {
								opts.mode = this.openMode;
							}
							deferred.resolve(editorContext.openEditor(response.declaration.file, opts));
						} else {
							deferred.reject({Severity: 'Warning', Message: Messages['noDeclFound']}); //$NON-NLS-1$
						}
					}
				}.bind(this)); //$NON-NLS-1$
		}
	});

	return {
		OpenDeclarationCommand : OpenDeclarationCommand
	};
});