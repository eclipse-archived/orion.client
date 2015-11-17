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
		this.ternWorker = ternWorker;
		this.scriptResolver = scriptResolver;
		this.fileClient = fileClient;
		this.currentProjectLocation = null;
		this.timeout = null;
	}

	Objects.mixin(TernProjectManager.prototype, {
		
		/**
		 * Returns the top level file folder representing the project that contains the given file.
		 * The file must have a parents property (either parents or Parents).
		 * @param file {Object} file to lookup the project for
		 * @returns returns the top level project file or <code>null</code>
		 */
		getProjectFile: function(file){
			// file will have different properties depending on whether it came from an editor event or a command
			if(file){
				var parents = file.parents ? file.parents : file.Parents;
				if (parents && parents.length>0){
					return parents[parents.length-1];
				}
			}
			return null;
		},
		
		/**
		 * Returns a deferred to find the location of the .tern-project file for the given project if one exists
		 * @param projectFile {Object} the project container
		 * @returns returns {Deferred} Deferred to get the string file location or <code>null</code> if there is no .tern-project file
		 */
		getTernProjectFileLocation: function(projectFile){
			if (!projectFile){
				return null;
			}
			var deferred;
			if(projectFile.Children){
				 deferred = new Deferred().resolve(projectFile.Children);
			} else if(projectFile.ChildrenLocation) {
				deferred = this.fileClient.fetchChildren(projectFile.ChildrenLocation);
			}
			return deferred.then(function(children){
				for(var i=0; i<children.length; i++){
					if(children[i].Name === ".tern-project"){
						return children[i].Location;
					}
				}
				return null;
			});
		},
		
		/**
		 * Returns a deferred to find the location of the .tern-project file for the given project. If a .tern-project file
		 * does not exist, an empty file will be created at the returned location. The deferred returns <code>null</code>
		 * if there is a problem creating the file.
		 * @param projectFile {Object} the project container
		 * @returns returns {Deferred} Deferred to get the location of the .tern-project file or <code>null</code> if there was a probem creating one
		 */
		enureTernProjectFileLocation: function(projectFile){
			return this.getTernProjectFileLocation(projectFile).then(function(ternFileLocation){
				if (!ternFileLocation){
					return this.fileClient.createFile(projectFile.Location, '.tern-project').then(function(){ //$NON-NLS-1$
						return ternFileLocation;
					});
				} else {
					return ternFileLocation;
				}
			}.bind(this));
		},
		
		/**
		 * Returns a deferred that reads the file at the given location and returns the parsed JSON contents
		 * @param fileLocation {String} The location of the file to parse
		 * @returns {Deferred} Deferred to get a parsed JSON object or an empty object if there is an error
		 */
		parseTernJSON: function(fileLocation){
			return this.fileClient.read(fileLocation).then(function(content) {
				try {
					return content ? JSON.parse(content) : {};
				} catch(e) {
					console.log("Error parsing JSON in .tern-project file")
					return {};
				}
			});
		},
		
		/**
		 * Returns a deferred to write the stringified JSON options into the .tern-project file at the given
		 * location.  The file must already exist (use ensureTernProjectFileLocation).  Returns <code>null</code>
		 * if there is a problem stringifying the JSON.
		 * @param fileLocation {String} location of the .tern-project file to write to
		 * @param jsonOptions {Object} options to write into the file
		 * @returns returns {Deferred} Deferred to write the options into the file or <code>null</code> on error
		 */
		writeTernFile: function(fileLocation, jsonOptions){
			try {
				// TODO Should we only allow writing of known options?
				// TODO Should we add proper whitespace?
				var jsonString = JSON.stringify(jsonOptions);
				return this.fileClient.write(fileLocation, jsonString);
			} catch(e) {
				console.log("Error writing JSON to .tern-project file: " + e);
			}
		},
				
		/**
		 * Loads the given jsonOptions into Tern, either by restarting the Tern server with new initialization options
		 * or by adding additional type information to the running Tern server.  The messages sent to Tern are processed
		 * asynchronously and will not be complete when this function returns.
		 * @param jsonOptions {Object} options to load into Tern
		 */
		loadTernProjectOptions: function(jsonOptions){
			if (jsonOptions){
				
				// TODO Remove console
//				console.log('Loading the following options from .tern-project:');
//				console.log(jsonOptions);
				
				if (jsonOptions.plugins || Array.isArray(jsonOptions.libs) || jsonOptions.dependencyBudget || jsonOptions.ecmaVersion){
					this.ternWorker.startServer(jsonOptions);
				}

				if (Array.isArray(jsonOptions.loadEagerly)){
					for (var i=0; i<jsonOptions.loadEagerly.length; i++) {
						var filename = jsonOptions.loadEagerly[i];
						var ext = 'js'; //$NON-NLS-1$
						if (filename.match(/\.html$/)){
							ext = 'html'; //$NON-NLS-1$
						} else if (filename.match(/\.htm$/)){
							ext = 'htm'; //$NON-NLS-1$
						}
						
						// TODO Can't provide error messages once the deferred is resolved.
						this.scriptResolver.getWorkspaceFile(filename, {ext: ext}).then(function(files){
							if (Array.isArray(files) && files.length > 0){
								// TODO If more than one file satisfies script resolver, do we load the first, the last or them all?  Warn the user?
								if (files.length > 1){
									console.log('Tern-Project File: Found multiple potential files for: ' + filename);
								}
								this.ternWorker.postMessage(
									{request:'addFile', args:{file: files[0].location}} //$NON-NLS-1$
								);
							} else {
								console.log("Tern-Project File: Could not find any matching files for: " + filename);
							}
						}.bind(this));
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

			// TODO We also want to listen to .tern-project file creation/modification/deletion
			// TODO On startup we start Tern, then restart it with loaded options

			// Get the project
			var file = event.file;
			var projectFile = this.getProjectFile(file);
			
			if (projectFile && (!this.currentProjectLocation || projectFile.Location !== this.currentProjectLocation)){
					
//				console.log("Tern Project Manager: Project changed, check for .tern-project");
				this.currentProjectLocation = projectFile.Location;
				this.scriptResolver.setSearchLocation(projectFile.Location);
				
				return this.getTernProjectFileLocation(projectFile).then(function(ternFileLocation){
					if (ternFileLocation){
						return this.parseTernJSON(ternFileLocation).then(function(jsonOptions){
							if (jsonOptions){
								this.loadTernProjectOptions(jsonOptions);
							}
						}.bind(this));
					} else {
//						console.log("No .tern-project file found at project root");
					}
					return null;
				}.bind(this));
			}

			// If the user opened the .tern-project file assume that it was edited
			if (file.name === '.tern-project'){
				this.currentProjectLocation = null;
			}		
		}		
	});

	return {
		TernProjectManager : TernProjectManager
	};
});