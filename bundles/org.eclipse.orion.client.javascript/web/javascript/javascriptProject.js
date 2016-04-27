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
		this.handlers = [];
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
	 * @description Adds a handler for the given file name to the mapping of handlers
	 * @function
	 * @param {Object} functions The object map of functions 
	 */
	JavaScriptProject.prototype.addHandler = function addHandler(functions) {
		this.handlers.push(functions);
	};
	
	/**
	 * @description Returns the current project path
	 * @function
	 * @returns {String} The current project path or null if there is no project context
	 */
	JavaScriptProject.prototype.getProjectPath = function getProjectPath() {
		if(this.projectMeta) {
			return this.projectMeta.Location;
		}
		return null;
	};
	
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
		var filePath = this.projectMeta.Location+childName;
		if(this.map[filePath]) {
			return new Deferred().resolve(this.map[filePath]);
		}
		return this.getFileClient().read(filePath, false, false, {readIfExists: true}).then(function(child) {
			this.map[filePath] = {name: filePath, contents: child, project: this.projectMeta.Location};
			return this.map[filePath];
		}.bind(this),
		function() {
			return null;
		});
	};
	
	/**
	 * @description Update the contents of the given file name, and optionally create the file if it does not exist
	 * @function
	 * @param {String} childName The short name of the project child to get
	 * @param {Boolean} create If the file should be created if it does not exist
	 * @param {Object} values The object of values to mix-in to the current values for a file.
	 */
	JavaScriptProject.prototype.updateFile = function updateFile(childName, create, values) {
		if(this.projectMeta) {
			return this.getFile(childName).then(function(child) {
				if(child) {
					var json = child.contents ? JSON.parse(child.contents) : Object.create(null);
					if(json && values) {
						_merge(values, json);
						return this.getFileClient().write(this.projectMeta.Location+childName, JSON.stringify(json, null, '\t'));
					}
				} else if(!child.contents && create) {
					return this.getFileClient().createFile(this.projectMeta.Location, childName).then(function(file) {
						return this.getFileClient().write(file.Location, JSON.stringify(values, null, '\t'));
					}.bind(this));
				}
			}.bind(this));
		}
	};
	
	function _merge(source, dest) {
		Object.keys(source).forEach(function(key) {
			if(Array.isArray(dest[key]) && Array.isArray(source[key])) {
				dest[key] = [].concat(dest[key], source[key]);
			} else if(typeof dest[key] === 'object' && dest[key] !== null) {
				source[key] = source[key] || Object.create(null);
				_merge(source[key], dest[key]);
			} else {
				dest[key] = source[key];
			}
		});
	}
	
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
				_handle.call(this, "onProjectChanged", this, evnt, project.Location);
				return;
			} 
			_handle.call(this, "onInputChanged", this, evnt, project.Location);				
		} else {
			_handle.call(this, "onProjectChanged", this, evnt, null);
		}
	};
	/**
	 * Callback from the fileClient event listener
	 * @param {Object} evnt A file client Changed event.
	 */
	JavaScriptProject.prototype.onFileChanged = function onFileChanged(evnt) {
		if(evnt && evnt.type === 'Changed') {
			_updateMap.call(this, evnt.modified, "onModified");
			_updateMap.call(this, evnt.deleted, "onDeleted");
			_updateMap.call(this, evnt.created, "onCreated");
		}
	};
	/**
	 * Update the backing map
	 * @param {Array.<String>} arr The array to walk
	 * @param {String} state The state, one of: onModified, onDeleted, onCreated 
	 */
	function _updateMap(arr, state) {
		if(Array.isArray(arr)) {
			arr.forEach(function(file) {
				delete this.map[file];
				var n = _shortName(file);
				_handle.call(this, state, this, file, n);
			}.bind(this));
		}
	}
	/**
	 * @description Returns the shortname of the file
	 * @param {String} fileName The fully qualified path of the file
	 * @returns {String} The last segment of the path (short name)
	 */
	function _shortName(fileName) {
		var i = fileName.lastIndexOf('/');
		if(i > -1) {
			return fileName.substr(i+1);
		}
		return fileName;
	}
	
	/**
	 * @description Delegates to a handler for the given handler name (file type), with the given function name
	 * @param {String} funcName The name of the function to call on the handler iff it exists
	 */
	function _handle(funcName) {
		if(Array.isArray(this.handlers)) {
			var args = Array.prototype.slice.call(arguments);
			this.handlers.forEach(function(handler) {
				var f = handler[funcName];
				if(typeof f === 'function') {
					f.apply(handler, args.slice(1));
				}
			}.bind(this));
		}
	}
	
	return JavaScriptProject;
});