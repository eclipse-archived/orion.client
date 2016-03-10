/*******************************************************************************
 * @license
 * Copyright (c) 2015, 2016 IBM Corporation and others.
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
'orion/i18nUtil',
'javascript/ternProjectValidator',
'i18n!javascript/nls/problems'
], function(Objects, Deferred, URITemplate, i18nUtil, Validator, Messages) {

	/**
	 * @description Creates a new open declaration command
	 * @constructor
	 * @public
	 * @param {TernWorker} ternWorker The running Tern worker
	 * @param {ScriptResolver} scriptResolver The backing script resolver
	 * @param {ServiceRegistry} serviceRegistry The service registry 
	 * @since 8.0
	 */
	function TernProjectManager(ternWorker, scriptResolver, serviceRegistry, setStarting) {
		this.ternWorker = ternWorker;
		this.scriptResolver = scriptResolver;
		this.projectLocation = null;
		this.currentFile = null;
		this.registry = serviceRegistry;
		this.starting = setStarting;
		this.json = null;
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
		 * Returns a deferred to find the location of the .tern-project file for the given project if one exists
		 * @returns {String} The fully qualified path to the .tern-project file
		 */
		getTernProjectFileLocation: function() {
			return this.currentFile;
		},
		
		/**
		 * @description Returns the current project file path or null
		 * @function
		 * @returns {String} The current project file path, or null
		 */
		getProjectFile: function() {
			return this.projectLocation;
		},
		
		/**
		 * @description Returns the JSON parsed from the current project file or null
		 * @function
		 * @returns {Object} Returns the parsed JSON or null
		 */
		getJSON: function() {
			return this.json;
		},
		
		refresh : function(file) {
			if(file) {
				if (file.endsWith(".tern-project")) {
					this.currentFile = file;
				}
				this.starting();
				return this.parseTernJSON(file).then(function(jsonOptions){
					this.json = jsonOptions;
					return this.loadTernProjectOptions(jsonOptions);
				}.bind(this));
			}
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
			return this.scriptResolver.getFileClient().read(fileLocation).then(function(content) {
				try {
					var json = content ? JSON.parse(content) : {};
					// create a copy of json in order to prevent the addition of the projectLoc property.
					// the returned value is now cached into the getJSON() function.
					var copyJson = Object.create(null);
					for (var prop in json) {
						if (json.hasOwnProperty(prop)) {
							copyJson[prop] = json[prop];
						}
					}
					copyJson.projectLoc = fileLocation.slice(0, fileLocation.lastIndexOf('/')+1);
					this._simpleValidate(copyJson);
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
			this._hasValidationProblem = false;
			if(!this.inEditor) {
				var problems = Validator.validate(json);
				if(problems.length > 1) {
					var pbString = '<ul>'; //$NON-NLS-1$
					problems.forEach(function(pb) {
						pbString += "<li>"+pb+"</li>"; //$NON-NLS-1$ //$NON-NLS-2$
					});
					pbString += "</ul>"; //$NON-NLS-1$
					this._hasValidationProblem = true;
					this._report(Messages['multiAttrProblems'], pbString);
				} else if(problems.length === 1) {
					this._hasValidationProblem = true;
					this._report(Messages['attrProblem'], problems[0]);
				}
			}
		},
		
		/**
		 * Loads the given jsonOptions into Tern, either by restarting the Tern server with new initialization options
		 * or by adding additional type information to the running Tern server.  The messages sent to Tern are processed
		 * asynchronously and will not be complete when this function returns.
		 * @param jsonOptions {Object} options to load into Tern
		 */
		loadTernProjectOptions: function(jsonOptions) {
			if (Array.isArray(jsonOptions.loadEagerly) && jsonOptions.loadEagerly.length > 0) {
				var fileLoadPromises = [];
				this._fileLoadWarnings = [];
				var filesToLoad = [];
				for (var i = 0; i < jsonOptions.loadEagerly.length; i++) {
					var filename = jsonOptions.loadEagerly[i];
					var ext = 'js'; //$NON-NLS-1$
					if (filename.match(/\.html$/)){
						ext = 'html'; //$NON-NLS-1$
					} else if (filename.match(/\.htm$/)){
						ext = 'htm'; //$NON-NLS-1$
					}
					fileLoadPromises.push(this.scriptResolver.getWorkspaceFile(filename, {ext: ext}).then(function(_filename, files) {
						if (Array.isArray(files) && files.length > 0){
							if (files.length > 1) {
								this._fileLoadWarnings.push(i18nUtil.formatMessage(Messages['multipleFileMatchesProblem'], _filename, files[0].location));
							}
							filesToLoad.push(files[0].location);
						} else {
							this._fileLoadWarnings.push(i18nUtil.formatMessage(Messages['noFileMatchProblem'], _filename));
						}
					}.bind(this, filename)));
				}
				if (!this._hasValidationProblem){
					this.registry.getService("orion.page.message").setProgressMessage(Messages['fileMatchProgress']); //$NON-NLS-1$
				}
				var currentOptions = jsonOptions;
				currentOptions.loadEagerly = filesToLoad;
				if(fileLoadPromises.length > 0) {
					return Deferred.all(fileLoadPromises).then(function(){
						if (!this._hasValidationProblem){  // Don't hide validation warnings
							this.registry.getService("orion.page.message").close(); //$NON-NLS-1$
							if (this._fileLoadWarnings.length > 0){
								var message = "";
								for (var j=0; j<this._fileLoadWarnings.length && j<10; j++) {
									message += this._fileLoadWarnings[j] + '<br>'; //$NON-NLS-1$
								}
								if (this._fileLoadWarnings.length > 10){
									message += i18nUtil.formatMessage(Messages['tooManyFileMatchProblems'],this._fileLoadWarnings.length-10) + '<br>'; //$NON-NLS-1$
								}
								this._report(Messages['fileMatchProblems'], message);
							}
						}
						this._fileLoadWarnings = [];
						this.ternWorker.postMessage({request: "start_server", args: {options: currentOptions}}); //$NON-NLS-1$
					}.bind(this));
				}
				this.ternWorker.postMessage({request: "start_server", args: {options: currentOptions}}); //$NON-NLS-1$
			} else {
				this.ternWorker.postMessage({request: "start_server", args: {options: currentOptions}}); //$NON-NLS-1$
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
				this.projectLocation = null;
			} else {
				var file = evnt.file,
					project;
				if(file) {
					var parents = file.parents ? file.parents : file.Parents;
					if (parents && parents.length > 0){
						project = parents[parents.length-1];
					}
				}
				if (project && (!this.projectLocation || project.Location !== this.projectLocation)){
					this.projectLocation = project.Location;
					this.scriptResolver.setSearchLocation(project.Location);
					var c = project.Children;
					for(var i = 0, len = c.length; i < len; i++) {
						if(".tern-project" === c[i].Name) {
							return this.refresh(c[i].Location);
						}
					}
				}
			}
		}
	});

	return {
		TernProjectManager : TernProjectManager
	};
});
