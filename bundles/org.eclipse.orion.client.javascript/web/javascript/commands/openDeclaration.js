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
'javascript/finder',
'orion/Deferred',
'i18n!javascript/nls/messages'
], function(Objects, Finder, Deferred, Messages) {

	var cachedContext;
	var deferred;

	/**
	 * @description Creates a new open declaration command
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} ASTManager The backing AST manager
	 * @param {javascript.ScriptResolver} Resolver The backing script resolver
	 * @param {TernWorker} ternWorker The running Tern worker
	 * @param {javascript.CUProvider} cuProvider
	 * @returns {javascript.commands.OpenDeclarationCommand} A new command
	 * @since 8.0
	 */
	function OpenDeclarationCommand(ASTManager, Resolver, ternWorker, cuProvider, openMode) {
		this.astManager = ASTManager;
		this.resolver = Resolver;
		this.ternworker = ternWorker;
		this.cuprovider = cuProvider;
		this.openMode = openMode;
		this.timeout = null;
	}

	Objects.mixin(OpenDeclarationCommand.prototype, {
		/* override */
		execute: function(editorContext, options) {
		    var that = this;
		    if(options.contentType.id === 'application/javascript') {
		        return that.astManager.getAST(editorContext).then(function(ast) {
    				return that._findDecl(editorContext, options, ast);
    			});
		    } else {
		        return editorContext.getText().then(function(text) {
		            var offset = options.offset;
		            var blocks = Finder.findScriptBlocks(text);
		            if(blocks && blocks.length > 0) {
		                var cu = that.cuprovider.getCompilationUnit(blocks, {location:options.input, contentType:options.contentType});
    			        if(cu.validOffset(offset)) {
    			            return that.astManager.getAST(cu.getEditorContext()).then(function(ast) {
    			               return that._findDecl(editorContext, options, ast, text);
    			            });
    			        }
			        }
		        });
		    }
		},

		_findDecl: function(editorContext, options, ast, htmlsource) {
			cachedContext = editorContext;
			deferred = new Deferred();
			if(this.timeout) {
				clearTimeout(this.timeout);
			}
			this.timeout = setTimeout(function() {
				cachedContext.setStatus({Severity: 'Error', Message: Messages['noDeclTimedOut']}); //$NON-NLS-1$
				if(deferred) {
					deferred.resolve(Messages['noDeclFound']);
				}
				this.timeout = null;
			}, 5000);
			var files = [{type: 'full', name: options.input, text: htmlsource ? htmlsource : ast.source}]; //$NON-NLS-1$
			this.ternworker.postMessage(
				{request:'definition', args:{params:{offset: options.offset}, files: files, meta:{location: options.input}}}, //$NON-NLS-1$
				function(response) {
					if(response.request === 'definition') {
						if(response.declaration && (typeof(response.declaration.start) === 'number' && typeof(response.declaration.end) === 'number')) {
							var opts = Object.create(null);
							opts.start = response.declaration.start;
							opts.end = response.declaration.end;
							if(this.openMode != null && typeof(this.openMode) !== 'undefined') {
								opts.mode = this.openMode;
							}
							deferred.resolve(cachedContext.openEditor(response.declaration.file, opts));
						} else {
							deferred.resolve(cachedContext.setStatus(Messages['noDeclFound']));
						}
					}
				}.bind(this)); //$NON-NLS-1$
			return deferred;
		}
	});

	return {
		OpenDeclarationCommand : OpenDeclarationCommand
	};
});