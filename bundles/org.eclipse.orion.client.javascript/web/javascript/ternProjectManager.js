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
'orion/URITemplate',
'javascript/ternProjectValidator',
'i18n!javascript/nls/problems'
], function(Objects, Deferred, URITemplate, Validator, Messages) {

	/**
	 * @description Creates a new open declaration command
	 * @constructor
	 * @public
	 * @param {TernWorker} ternWorker The running Tern worker
	 * @param {ScriptResolver} scriptResolver The backing script resolver
	 * @param {ServiceRegistry} serviceRegistry The service registry 
	 * @since 8.0
	 */
	function TernProjectManager(ternWorker, scriptResolver, serviceRegistry) {
		this.ternWorker = ternWorker;
		this.scriptResolver = scriptResolver;
		this.currentProjectLocation = null;
		this.currentFile = null;
		this.registry = serviceRegistry;
	}

	Objects.mixin(TernProjectManager.prototype, {
		/**
		 * @description Report a problem with the file to the page status
		 * @function
		 * @private
		 */
		_report: function _report(heading, message) {
			if(!this.inEditor) {
				var head = heading;
				if(!head) {
					head = Messages['problemInFile'];
				}
				var msg = Object.create(null);
				msg.HTML = true;
				msg.Severity = "Error"; //$NON-NLS-1$
				msg.Message = "<b>"+head+"</b>" + //$NON-NLS-1$ //$NON-NLS-2$
							  "<p>"+message+"</p>"; //$NON-NLS-1$ //$NON-NLS-2$
				if(this.currentFile) {
					var href = new URITemplate("#{,resource,params*}").expand( //$NON-NLS-1$
		    		                      {
		    		                      resource: this.currentFile,
		    		                      params: {}
		    		                      });
					msg.Message += "<p><a href=\""+href+"\" alt=\""+Messages['openFile']+"\">"+Messages['openFile']+"</a></p>"; //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$
				}
				this.registry.getService("orion.page.message").setProgressResult(msg); //$NON-NLS-1$
			}
		},
		/**
		 * @description Get the file client;
		 * @function
		 * @returns {orion.FileClient} returns a file client
		 */
		getFileClient: function() {
			return this.scriptResolver.getFileClient();
		},
		
		/**
		 * Returns the top level file folder representing the project that contains the given file.
		 * The file must have a parents property (either parents or Parents).
		 * @param file {Object} file to lookup the project for
		 * @returns returns the top level project file or <code>null</code>
		 */
		getProjectFile: function(file) {
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
		getTernProjectFileLocation: function(projectFile) {
			this.currentFile = null;
			if (!projectFile){
				return null;
			}
			var deferred;
			if(projectFile.Children){
				 deferred = new Deferred().resolve(projectFile.Children);
			} else if(projectFile.ChildrenLocation) {
				deferred = this.getFileClient().fetchChildren(projectFile.ChildrenLocation);
			}
			return deferred.then(function(children){
				for(var i=0; i<children.length; i++){
					if(children[i].Name === ".tern-project"){
						this.currentFile = children[i].Location;
						return this.currentFile;
					}
				}
				return null;
			}.bind(this));
		},
		
		/**
		 * Returns a deferred to find the location of the .tern-project file for the given project. If a .tern-project file
		 * does not exist, an empty file will be created at the returned location. The deferred returns <code>null</code>
		 * if there is a problem creating the file.
		 * @param projectFile {Object} the project container
		 * @returns returns {Deferred} Deferred to get the location of the .tern-project file or <code>null</code> if there was a probem creating one
		 */
		ensureTernProjectFileLocation: function(projectFile) {
			return this.getTernProjectFileLocation(projectFile).then(function(ternFileLocation){
				if (!ternFileLocation) {
					return this.getFileClient().createFile(projectFile.Location, '.tern-project').then(function(){ //$NON-NLS-1$
						return ternFileLocation;
					});
				} 
				return ternFileLocation;
			}.bind(this));
		},
		
		/**
		 * Returns a deferred that reads the file at the given location and returns the parsed JSON contents
		 * @param {String} fileLocation The location of the file to parse
		 * @returns {Deferred} Deferred to get a parsed JSON object or an empty object if there is an error
		 */
		parseTernJSON: function(fileLocation) {
			if(!fileLocation) {
				return new Deferred().resolve({});
			}
			return this.getFileClient().read(fileLocation).then(function(content) {
				try {
					var json = content ? JSON.parse(content) : {};
					json.projectLoc = fileLocation.slice(0, fileLocation.lastIndexOf('/')+1);
					this._simpleValidate(json);
					return json;
				} catch(e) {
					this._report(Messages['errorParsing'], e);
					return {};
				}
			}.bind(this));
		},
		
		/**
		 * @description description
		 * @function
		 * @private
		 * @param {Object} json
		 * @returns returns
		 */
		_simpleValidate: function _simpleValidate(json) {
			if(!this.inEditor) {
				var problems = Validator.validate(json);
				if(problems.length > 1) {
					var pbString = '<ul>'; //$NON-NLS-1$
					problems.forEach(function(pb) {
						pbString += "<li>"+pb+"</li>"; //$NON-NLS-1$ //$NON-NLS-2$
					});
					pbString += "</ul>"; //$NON-NLS-1$
					this._report(Messages['multiAttrProblems'], pbString);
				} else if(problems.length === 1) {
					this._report(Messages['attrProblem'], problems[0]);
				}
			}
		},
		
		/**
		 * Returns a deferred to write the stringified JSON options into the .tern-project file at the given
		 * location.  The file must already exist (use ensureTernProjectFileLocation).  Returns <code>null</code>
		 * if there is a problem stringifying the JSON.
		 * @param fileLocation {String} location of the .tern-project file to write to
		 * @param jsonOptions {Object} options to write into the file
		 * @returns returns {Deferred} Deferred to write the options into the file or <code>null</code> on error
		 */
		writeTernFile: function(fileLocation, jsonOptions) {
			this.currentFile = fileLocation;
			try {
				var jsonString = JSON.stringify(jsonOptions, null, 4);
				return this.fileClient.write(fileLocation, jsonString);
			} catch(e) {
				this._report(Messages['failedWrite'], e);
			}
		},
				
		/**
		 * Loads the given jsonOptions into Tern, either by restarting the Tern server with new initialization options
		 * or by adding additional type information to the running Tern server.  The messages sent to Tern are processed
		 * asynchronously and will not be complete when this function returns.
		 * @param jsonOptions {Object} options to load into Tern
		 */
		loadTernProjectOptions: function(jsonOptions) {
			this.ternWorker.postMessage({request: "start_server", args: {options: jsonOptions}}); //$NON-NLS-1$
			if (Array.isArray(jsonOptions.loadEagerly)) {
				for (var i = 0; i < jsonOptions.loadEagerly.length; i++) {
					var filename = jsonOptions.loadEagerly[i];
					var ext = 'js'; //$NON-NLS-1$
					if (filename.match(/\.html$/)){
						ext = 'html'; //$NON-NLS-1$
					} else if (filename.match(/\.htm$/)){
						ext = 'htm'; //$NON-NLS-1$
					}
					this.scriptResolver.getWorkspaceFile(filename, {ext: ext}).then(function(files) {
						if (Array.isArray(files) && files.length > 0){
//							if (files.length > 1) {
//								this._report("Mutiple matches were found eagerly loading file: "+filename, 
//								files[0].location+" was chosen and loaded.");							
//							}
							this.ternWorker.postMessage(
								{request:'addFile', args:{file: files[0].location}} //$NON-NLS-1$
							);
						}
					}.bind(this));
				}
			}
		},
		
		/**
		 * Callback from the orion.edit.model service
		 * @param {Object} event An <tt>orion.edit.model</tt> event.
		 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
		 */
		onInputChanged: function onInputChanged(evnt) {
			this.inEditor = ".tern-project" === evnt.file.name;
			if(this.inEditor) {
				this.currentProjectLocation = null;
			} else {
				var file = evnt.file;
				var projectFile = this.getProjectFile(file);
				if (projectFile && (!this.currentProjectLocation || projectFile.Location !== this.currentProjectLocation)){
					this.currentProjectLocation = projectFile.Location;
					this.scriptResolver.setSearchLocation(projectFile.Location);
					return this.getTernProjectFileLocation(projectFile).then(function(ternFileLocation){
						return this.parseTernJSON(ternFileLocation).then(function(jsonOptions){
							this.loadTernProjectOptions(jsonOptions);
						}.bind(this));
					}.bind(this));
				}
			}
		}
	});

	return {
		TernProjectManager : TernProjectManager
	};
});