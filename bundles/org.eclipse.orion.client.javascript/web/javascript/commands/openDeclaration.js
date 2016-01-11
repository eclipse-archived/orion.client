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
'i18n!javascript/nls/messages',
'orion/URITemplate',
], function(Objects, Deferred, Messages, URITemplate) {

	/**
	 * @description Creates a new open declaration command
	 * @constructor
	 * @public
	 * @param {TernWorker} ternWorker The running Tern worker
	 * @returns {javascript.commands.OpenDeclarationCommand} A new command
	 * @since 8.0
	 */
	function OpenDeclarationCommand(ternWorker, openMode, registry) {
		this.ternworker = ternWorker;
		this.openMode = openMode;
		this.timeout = null;
		this.registry = registry;
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
						if(response.declaration) {
							if (response.declaration.results) {
								// build up the message based on potential matches
								var display = {};
								display.HTML = true;
								display.Severity = 'Warning'; //$NON-NLS-0$
								var message = "Potential matches:<\br><ol>";
								var declarations = response.declaration.results;
								declarations.forEach(function(decl) {
									if (typeof decl.start  === 'number' && typeof decl.end === 'number') {
										var href = new URITemplate("#{,resource,params*}").expand( //$NON-NLS-1$
										{
											resource: decl.file,
											params: {start:decl.start, end: decl.end}
										});
										message += '<li><a href="' + href + '">' + decl.file + '</a></li>\n';
									}
								});
								message += "</ol>";
								display.Message = message;
								this.registry.getService("orion.page.message").setProgressResult(display);
								deferred.reject({Severity: 'Warning', Message: Messages['noDeclFound']});
							} else if (typeof response.declaration.start  === 'number' && typeof response.declaration.end === 'number') {
								var opts = Object.create(null);
								opts.start = response.declaration.start;
								opts.end = response.declaration.end;
								if(this.openMode !== null && typeof this.openMode !== 'undefined') {
									opts.mode = this.openMode;
								}
								deferred.resolve(editorContext.openEditor(response.declaration.file, opts));
							}
						}
					}
					deferred.reject({Severity: 'Warning', Message: Messages['noDeclFound']}); //$NON-NLS-1$
				}.bind(this));
		}
	});

	return {
		OpenDeclarationCommand : OpenDeclarationCommand
	};
});
