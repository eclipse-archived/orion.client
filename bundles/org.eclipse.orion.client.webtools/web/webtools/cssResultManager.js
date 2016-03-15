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
/*eslint-env amd*/
/*globals Tautologistics */
define([
	'orion/Deferred',
	'orion/objects',
	'javascript/lru',
	'csslint/csslint'
], function(Deferred, Objects, LRU, CSSLint) {

	var registry;
	
	/**
	 * Provides a shared AST.
	 * @class Provides a shared parsed AST.
	 * @param {Object} serviceRegistry The platform service registry 
	 * @since 8.0
	 */
	function CssResultManager(serviceRegistry) {
		this.cache = new LRU(10);
		registry = serviceRegistry;
	}

	/**
	 * @description Delegate to log timings to the metrics service
	 * @param {Number} end The end time
	 * @since 12.0
	 */
	function logTiming(end) {
		if(registry) {
			var metrics = registry.getService("orion.core.metrics.client"); //$NON-NLS-1$
			if(metrics) {
				metrics.logTiming('language tools', 'parse', end, 'text/css'); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			}
		}
	}

	Objects.mixin(CssResultManager.prototype, /** @lends webtools.CssResultManager.prototype */ {
		/**
		 * @param {orion.editor.EditorContext} editorContext
		 * @returns {orion.Promise} A promise resolving to the CSS parse / checking result or null if called
		 * with an incomplete config
		 */
		getResult: function(editorContext, config) {
		    if(typeof config === 'undefined') {
		        config = Object.create(null);
		    }
		    if(typeof config.getRuleSet === 'undefined') {
		    	/** @callback */
		        config.getRuleSet = function() {return null;};
			}
			var _self = this;
			return editorContext.getFileMetadata().then(function(metadata) {
				metadata = metadata || {};
				var loc = _self._getKey(metadata);
				var result = _self.cache.get(loc);
				if (result) {
					return new Deferred().resolve(result);
				}
				return editorContext.getText().then(function(text) {
				    var start = Date.now();
					result = CSSLint.verify(text, config.getRuleSet());
					var end = Date.now() - start;
					logTiming(end);
					_self.cache.put(loc, result);
					if(metadata.location) {
					    //only set this if the original metadata has a real location
					    result.fileLocation = metadata.location;
					}
					return result;
				});
			});
		},
		/**
		 * Returns the key to use when caching
		 * @param {Object} metadata The file infos
		 */
		_getKey: function _getKey(metadata) {
		      if(!metadata.location) {
		          return 'unknown'; //$NON-NLS-1$
		      }
		      return metadata.location;
		},

		/**
		 * Callback from the orion.edit.model service
		 * @param {Object} event An <tt>orion.edit.model</tt> event.
		 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
		 */
		onModelChanging: function(event) {
		    if(this.inputChanged) {
		        //TODO haxxor, eat the first model changing event which immediately follows
		        //input changed
		        this.inputChanged = null;
		    } else {
		        this.cache.remove(this._getKey(event.file));
		    }
		},
		/**
		 * Callback from the orion.edit.model service
		 * @param {Object} event An <tt>orion.edit.model</tt> event.
		 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
		 */
		onInputChanged: function(event) {
		    this.inputChanged = event;
		    //TODO will add to mult-env
		}
	});
	return CssResultManager;
});
