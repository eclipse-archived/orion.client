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
	 * @since 8.0
	 */
	function AddContextCommand(ternWorker, scriptResolver, fileClient) {
		this.ternworker = ternWorker;
		this.scriptResolver = scriptResolver;
		this.fileClient = fileClient;
		this.timeout = null;
	}

	Objects.mixin(AddContextCommand.prototype, {
		/* override */
		execute: function(editorContext, options) {
			return this._addContext(editorContext, options);
		},
		
		_getProjectTernConfiguration: function(fileClient, children){
			for(var i=0; i<children.length; i++){
				if(children[i].Name === ".tern-project"){
					return fileClient.read(children[i].Location).then(function(content) {
						try {
							return content ? JSON.parse(content) : {};
						} catch(e) {
							return {};
						}
					});
				}
			}
			return {};
		},
		
		_loadEagerly: function(editorContext, deferred, ternWorker, scriptResolver, jsonOptions){
			if (jsonOptions){
				
				// TODO Remove console
				console.log('Parsed from .tern-project:');
				console.log(jsonOptions);
				
				if (jsonOptions.plugins){
					ternWorker.startServer({plugins: jsonOptions.plugins});
				}				

				if (Array.isArray(jsonOptions.loadEagerly)){
					for (var i=0; i<jsonOptions.loadEagerly.length; i++) {
						var filename = jsonOptions.loadEagerly[i];
						var ext = 'js';
						if (filename.match(/\.html$/)){
							ext = 'html';
						}
						
						// TODO Can't provide error messages once the deferred is resolved.
						scriptResolver.getWorkspaceFile(filename, {ext: ext}).then(function(files){
							if (Array.isArray(files) && files.length > 0){
								// TODO If more than one file satisfies script resolver, do we load the first, the last or them all?  Warn the user?
								if (files.length > 1){
									editorContext.setStatus({Severity: 'Warning', Message: filename + ' represents multiple files.'});
								}
								ternWorker.postMessage(
									{request:'addFile', args:{file: files[0].location}} //$NON-NLS-1$
								);
							} else {
								// TODO Find a way to hold the deferred until we at least have run script resolver on all files
								editorContext.setStatus({Severity: 'Warning', Message: filename + ' could not be found.'});
							}
						});
					}
				}

				deferred.resolve();
				return;
			}
			editorContext.setStatus({Severity: 'Error', Message: 'No valid entries found in the .tern-project file.'});
			deferred.resolve("No additional files found");
		},

		_addContext: function(editorContext, options) {
			cachedContext = editorContext;
			deferred = new Deferred();
			if(this.timeout) {
				clearTimeout(this.timeout);
			}
			this.timeout = setTimeout(function() {
				cachedContext.setStatus({Severity: 'Error', Message: "Add context timed out"}); //$NON-NLS-1$
				if(deferred) {
					deferred.resolve("No .tern-project file found");
				}
				this.timeout = null;
			}, 20000);

			var that = this;
			editorContext.getFileMetadata().then(function(fileMetadata){
				if(fileMetadata.parents && fileMetadata.parents.length>0){
					var topFolder = fileMetadata.parents[fileMetadata.parents.length-1];
					that.scriptResolver.setSearchLocation(topFolder.Location);
					if(topFolder.Children){
						that._getProjectTernConfiguration(that.fileClient, topFolder.Children).then(function(jsonOptions){
							that._loadEagerly(cachedContext, deferred, that.ternworker, that.scriptResolver, jsonOptions);
						});
					} else if(topFolder.ChildrenLocation) {
						that.fileClient.fetchChildren(topFolder.ChildrenLocation).then(function(children){
							that._getProjectTernConfiguration(that.fileClient, children).then(function(jsonOptions){
								that._loadEagerly(cachedContext, deferred, that.ternworker, that.scriptResolver, jsonOptions);
							});
						});
					}
				}
			});
			return deferred;
		}
	});

	return {
		AddContextCommand : AddContextCommand
	};
});