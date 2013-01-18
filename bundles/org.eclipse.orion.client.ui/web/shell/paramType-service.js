/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *******************************************************************************/

/*global define*/

define(["i18n!orion/shell/nls/messages", "require", "orion/widgets/Shell", "orion/i18nUtil"],
	function(messages, require, mShell, i18nUtil) {

	var orion = {};
	orion.shellPage = {};

	orion.shellPage.ParamTypeService = (function() {
		function ParamTypeService(name, pluginRegistry) {
			this.name = name;
			this.pluginRegistry = pluginRegistry;

			var self = this;
			pluginRegistry.addEventListener(
				"installed", //$NON-NLS-0$
				function() {
					self._initServicesList();
				}
			);
			pluginRegistry.addEventListener(
				"uninstalled", //$NON-NLS-0$
				function() {
					self._initServicesList();
				}
			);

			/* don't let initialization delay page rendering */
			setTimeout(function() {
				self._initServicesList();
			}, 1);
		}

		ParamTypeService.prototype = {
			getName: function() {
				return this.name;
			},
			/**
			 * This function is invoked by the shell to query for the completion
			 * status and predictions for an argument with this parameter type.
			 */
			parse: function(arg) {
				var string = arg || "";
				if (string.indexOf("'") === 0) { //$NON-NLS-0$
					string = string.substring(1);
				}
				if (string.lastIndexOf("'") === string.length - 1) { //$NON-NLS-0$
					string = string.substring(0, string.length - 1);
				}
				var predictions = this._getPredictions(string);
				return this._createCompletion(string, predictions);
			},

			/**
			 * This function is invoked by the shell to query for a completion
			 * value's string representation.
			 */
			stringify: function(value) {
				return value;
			},

			/** @private */

			_createCompletion: function(string, predictions) {
				var exactMatch;
				for (var i = 0; i < predictions.length; i++) {
					var current = predictions[i];
					if (current.name === string) {
						exactMatch = current;
						break;
					}
				}

				var status, message;
				if (exactMatch) {
					status = mShell.CompletionStatus.MATCH;
				} else if (predictions && predictions.length > 0) {
					status = mShell.CompletionStatus.PARTIAL;
				} else {
					status = mShell.CompletionStatus.ERROR;
					message = i18nUtil.formatMessage(messages["'${0}' is not valid"], string);
				}
				return {
					value: exactMatch ? exactMatch.value : null,
					status: status,
					message: message,
					predictions: predictions
				};
			},
			_getPredictions: function(text) {
				var predictions = [];
				if (this.services) {
					this.services.forEach(function(current) {
						if (current.indexOf(text) === 0) {
							predictions.push({name: current, value: current});
						}
					});
				}
				return predictions;
			},
			_initServicesList: function() {
				var temp = {};
				var plugins = this.pluginRegistry.getPlugins();
				plugins.forEach(function(plugin) {
					var services = plugin.getServiceReferences();
					services.forEach(function(service) {
						var names = service.getProperty("service.names"); //$NON-NLS-0$
						names.forEach(function(current) {
							temp[current] = true;
						});
					});
				});
				this.services = [];
				for (var name in temp) {
					this.services.push(name);
				}
				this._sort(this.services);
			},
			_sort: function(children) {
				children.sort(function(a,b) {
					var name1 = a.toLowerCase();
					var name2 = b.toLowerCase();
					if (name1 < name2) {
						return -1;
					}
					if (name1 > name2) {
						return 1;
					}
					return 0;
				});
			}
		};
		return ParamTypeService;
	}());

	return orion.shellPage;
});
