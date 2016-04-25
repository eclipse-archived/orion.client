/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
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
	"orion/Deferred"
], function(Deferred) {
	
	/**
	 * @description Creates a new JavaScript project
	 * @constructor
	 * @public
	 * @param {ServiceRegistry} serviceRegistry The service registry 
	 * @since 12.0
	 */
	function JavaScriptProject(serviceRegistry) {
		this.projectMeta = null;
		this.map = Object.create(null);
		this.registry = serviceRegistry;
		this.fileClient = null;
	}
	/**
	 * The .tern-project file name
	 */
	JavaScriptProject.prototype.TERN_PROJECT = '.tern-project';
	/**
	 * The .eslintrc file name
	 */
	JavaScriptProject.prototype.ESLINTRC = '.eslintrc';
	/**
	 * The project.json file name
	 */
	JavaScriptProject.prototype.PROJECT_JSON = 'project.json';
	/**
	 * The package.json file name
	 */
	JavaScriptProject.prototype.PACKAGE_JSON = 'package.json';
	/**
	 * The jsconfig.json file name
	 */
	JavaScriptProject.prototype.JSCONFIG_JSON = 'jsconfig.json';
	/**
	 * The node_modules folder name
	 */
	JavaScriptProject.prototype.NODE_MODULES = 'node_modules';
	
	/**
	 * @description Fetch the named child of the current project context
	 * @function
	 * @param {String} childName The short name of the project child to get
	 * @returns {Object} The requested child metadata or null
	 */
	JavaScriptProject.prototype.getFile = function getFile(childName) {
		if(!this.projectMeta) {
			return new Deferred().resolve(null);
		}
		var deferred = new Deferred();
		if(this.map[childName]) {
			return new Deferred().resolve(this.map[childName]);
		}
		if(this.projectMeta) {
			this.getFileClient().read(this.projectMeta.Location+'/'+childName, false, false, {readIfExists: true}).then(function(child) {
				this.map[childName] = child;
				deferred.resolve(child);
			}.bind(this),
			function() {
				deferred.resolve(null);
			});
		}
		return deferred;
	};
	
	/**
	 * @description Update the contents of the given file name, and optionally create the file if it does not exist
	 * @function
	 * @param {String} childName The short name of the project child to get
	 * @param {Boolean} create If the file should be created if it does not exist
	 * @param {Object} values The object of values to mix-in to the current values for a file.
	 */
	JavaScriptProject.prototype.updateFile = function updateFile(childName, create, values) {
		return this.getFile(childName).then(function(child) {
			if(typeof child === 'string') {
				var json = JSON.parse(child);
				if(json && values) {
					Object.keys(values).forEach(function(key) {
						json[key] = values[key];
					});
					return this.getFileClient().write(this.projectMeta.Location+'/'+childName, JSON.stringify(json));
				}
			} else if(!child && create) {
				return this.getFileClient().createFile(this.projectMeta.Location+'/'+childName).then(function(file) {
					return this.getFileClient().write(file.Location, JSON.stringify(values));
				}.bind(this));
			}
		}.bind(this));
	};
	
	/**
	 * @name JavaScriptProject.prototype.getFileClient
	 * @description Returns the file client to use
	 * @function
	 * @returns {orion.FileClient} The file client
	 */
	JavaScriptProject.prototype.getFileClient = function getFileClient() {
		if(!this.fileClient) {
			this.fileClient = this.registry.getService("orion.core.file.client"); //$NON-NLS-1$
		}
		return this.fileClient;
	};
	
	/**
	 * Callback from the orion.edit.model service
	 * @param {Object} evnt An <tt>orion.edit.model</tt> event.
	 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
	 */
	JavaScriptProject.prototype.onInputChanged = function onInputChanged(evnt) {
		var file = evnt.file,
			project;
		if(file) {
			var parents = file.parents ? file.parents : file.Parents;
			if (parents && parents.length > 0) {
				project = parents[parents.length-1];
			}
		}
		if (project) {
			if(!this.projectMeta || project.Location !== this.projectMeta.Location) {
				this.projectMeta = project;
				this.map = Object.create(null);
			}
		}
	};
	/**
	 * Callback from the fileClient event listener
	 * @param {Object} evnt A file client Changed event.
	 */
	JavaScriptProject.prototype.onFileChanged = function onFileChanged(evnt) {
		if(evnt && evnt.type === 'Changed') {
			_updateMap(evnt.modified);
			_updateMap(evnt.deleted);
		}
	};
	/**
	 * Update the backing map
	 * @param {Array.<String>} arr The array to walk 
	 */
	function _updateMap(arr) {
		if(Array.isArray(arr)) {
			arr.forEach(function(file) {
				var idx = file.lastIndexOf('/');
				if(idx > -1) {
					file = file.substr(idx+1);
				}
				delete this.map[file];
			}.bind(this));
		}
	}
	
	return JavaScriptProject;
});