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
	"orion/Deferred",
	"plugins/languages/java/ruleConfig"
], function(Deferred, RuleConfig) {
	
	var registry,
		severities = {
			1: 'error',
			2: 'warning',
			3: 'info'
		};
	
	function JavaValidator(javaProject, serviceRegistry) {
		this.project = javaProject;
		registry = serviceRegistry;
		this.config = new RuleConfig();
		this.map = Object.create(null);
	}
	
	/**
	 * @description Callback to create problems from orion.edit.validator
	 * @function
	 * @public
	 * @param {orion.edit.EditorContext} editorContext The editor context
	 * @param {Object} context The in-editor context (selection, offset, etc)
	 * @returns {orion.Promise} A promise to compute some problems
	 * @callback
	 */
	JavaValidator.prototype.computeProblems = function computeProblems(editorContext , context, config) {
		var deferred = new Deferred();
		var start = Date.now();
		editorContext.getFileMetadata().then(function(meta) {
			if(this.map[meta.location]) {
				deferred.resolve(toProblems(this.map[meta.location].info));
				delete this.map[meta.location];
				logTiming(Date.now()-start, meta.contentType.id);
			} else {
				this.map[meta.location] = {deferred: deferred};
			}
		}.bind(this));
		return deferred;
	};

	/**
	 * @name JavaValidator.prototype.updateDiagnostics
	 * @description Callback from the Java plugin when diagnostic notifications are received
	 * @function
	 * @callback 
	 * @param {String} file The full URI of the file
	 * @param {[{?}]} info The array of diagnostic items
	 */
	JavaValidator.prototype.updateDiagnostics = function updateDiagnostics(file, info) {
		if(this.map[file]) {
			var c = this.map[file];
			if(c.deferred) {
				if(this.project) {
					this.project.getJavaOptions().then(function(cfg) {
						c.deferred.resolve(toProblems(info, cfg || this.config));
						delete this.map[file];
					}.bind(this));
				} else {
					c.deferred.resolve(toProblems(info));
					delete this.map[file];
				}
			} else {
				// we are getting back some diagnostics before computeProblems is run
				// clear the cached one and replace it with the new one
				this.map[file] = {info: info};
			}
		} else {
			//got the notification before computeProblems was called, cache it
			this.map[file] = {info: info};
		}
		if (!this.markerService) {
				this.markerService = registry.getService("orion.core.marker");
		}
		if (this.markerService && this.map[file].info) {
			this.markerService._setProblems(toProblems(this.map[file].info));
			// problems have been reported, we can remove them. No need to report them again on save during computeProblems
			delete this.map[file];
		}
	};
	
	/**
	 * @name toProblems
	 * @description Convert the diagnostics data to Orion problems
	 * @param {?} info The diagnostics info
	 * @param {?} config The configuration to set severites with 
	 * @returns {[?]} The array of Orion problem objects
	 */
	function toProblems(info, config) {
		var problems = [],
			c = config || {};
		info.forEach(function(item) {
			var severity = getSeverity(item.code, item.severity, c);
			if(!severity) {
				return;
			}
			problems.push({
				description: item.message,
				id: item.code,
				severity: severity,
				range: item.range
			});
		});
		return problems;
	}
	
	/**
	 * @name getSeverity
	 * @description Returns the severity for the given problem id or null if there is no configuration entry for it
	 * @param {String} id The id of the problem
	 * @param {?} config The collection of configuration entries
	 * @returns {String | null} The name of the severity or null if its 'ignore'
	 */
	function getSeverity(id, severity, config) {
		if(config[id]) {
			if(config[id] === 3) {
				return null;
			}
			return severities[config[id]];
		} else if(severities[severity] === 3) {
			return null;
		}
		return severities[severity];
	}
	
	/**
	 * @description Log the given timing in the metrics service
	 * @param {Number} end The total time to log
	 * @param {String} contentTypeId The id of the content type - this validator handles multiple languages 
	 */
	function logTiming(end, contentTypeId) {
		if(registry) {
			var metrics = registry.getService("orion.core.metrics.client"); //$NON-NLS-1$
			if(metrics) {
				metrics.logTiming('language tools', 'validation', end, contentTypeId); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			}
		}
 	}
	
	return JavaValidator;
});