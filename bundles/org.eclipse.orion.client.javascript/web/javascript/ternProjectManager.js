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
	function TernProjectManager(ternWorker, scriptResolver, fileClient) {
		this.ternworker = ternWorker;
		this.scriptResolver = scriptResolver;
		this.fileClient = fileClient;
		this.currentProjectLocation = null;
		this.timeout = null;
	}

	Objects.mixin(TernProjectManager.prototype, {
				
		_getProjectTernConfiguration: function(fileClient, children){
			for(var i=0; i<children.length; i++){
				if(children[i].Name === ".tern-project"){
					return fileClient.read(children[i].Location).then(function(content) {
						try {
							return content ? JSON.parse(content) : {};
						} catch(e) {
							console.log("Error in the parsed JSON")
							return {};
						}
					});
				}
			}
			console.log("No .tern-project file found at project root");
			return {};
		},
		
		_loadTernConfig: function(ternWorker, scriptResolver, jsonOptions){
			if (jsonOptions){
				
				// TODO Remove console
				console.log('Parsed from .tern-project:');
				console.log(jsonOptions);
				
				if (jsonOptions.plugins || Array.isArray(jsonOptions.libs) || jsonOptions.dependencyBudget || jsonOptions.ecmaVersion){
					ternWorker.startServer(jsonOptions);
				}

				if (Array.isArray(jsonOptions.loadEagerly)){
					for (var i=0; i<jsonOptions.loadEagerly.length; i++) {
						var filename = jsonOptions.loadEagerly[i];
						var ext = 'js';
						if (filename.match(/\.html$/)){
							ext = 'html';
						} else if (filename.match(/\.htm$/)){
							ext = 'htm';
						}
						
						// TODO Can't provide error messages once the deferred is resolved.
						scriptResolver.getWorkspaceFile(filename, {ext: ext}).then(function(files){
							if (Array.isArray(files) && files.length > 0){
								// TODO If more than one file satisfies script resolver, do we load the first, the last or them all?  Warn the user?
								if (files.length > 1){
									console.log('Found multiple potential files for: ' + filename);
								}
								ternWorker.postMessage(
									{request:'addFile', args:{file: files[0].location}} //$NON-NLS-1$
								);
							} else {
								console.log("Could not find any matching files for: " + filename);
							}
						});
					}
				}
			}
		},
		
		/**
		 * Callback from the orion.edit.model service
		 * @param {Object} event An <tt>orion.edit.model</tt> event.
		 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
		 */
		onInputChanged: function onInputChanged(event) {
//			console.log("Tern Project Manager: On Input Changed");
			
			var that = this;
			// Get the project
			var file = event.file;
			if(file && file.parents && file.parents.length>0){
				var topFolder = file.parents[file.parents.length-1];
				if (topFolder && (!that.currentProjectLocation || topFolder.Location !== that.currentProjectLocation)){
					
//					console.log("Tern Project Manager: Project changed, check for .tern-project");
					that.currentProjectLocation = topFolder.Location;
					that.scriptResolver.setSearchLocation(topFolder.Location);
					
					// See if the new project has a .tern-project file
					if(topFolder.Children){
						that._getProjectTernConfiguration(that.fileClient, topFolder.Children).then(function(jsonOptions){
							if (jsonOptions){
								that._loadTernConfig(that.ternworker, that.scriptResolver, jsonOptions);
							}
						});
					} else if(topFolder.ChildrenLocation) {
						that.fileClient.fetchChildren(topFolder.ChildrenLocation).then(function(children){
							that._getProjectTernConfiguration(that.fileClient, children).then(function(jsonOptions){
							if (jsonOptions){
								that._loadTernConfig(that.ternworker, that.scriptResolver, jsonOptions);
							}
							});
						});
					}
				} else {
//					console.log("Same project");
					// TODO Check if the .tern-project is dirty
				}
				
			} else {
//				console.log("Problem with the input changed event:");
//				console.log(event);
			}
			
			// If the user opened the .tern-project file assume that it was edited
			if (file.name === '.tern-project'){
				that.currentProjectLocation = null;
			}
			
		}		
	});

	return {
		TernProjectManager : TernProjectManager
	};
});