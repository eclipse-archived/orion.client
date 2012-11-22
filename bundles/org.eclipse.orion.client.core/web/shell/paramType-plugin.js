/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *******************************************************************************/

/*global define localStorage*/

define(["i18n!orion/shell/nls/messages", "require", "orion/widgets/Shell", "orion/i18nUtil", "orion/Deferred"],
	function(messages, require, mShell, i18nUtil, Deferred) {

	var NAME_ALL = "all"; //$NON-NLS-0$

	var orion = {};
	orion.shellPage = {};

	var AllPlugin = (function() {
		function AllPlugin(plugins) {
			this.plugins = plugins;
		}
		AllPlugin.prototype = {
			name: NAME_ALL,
			getPluginLocations: function() {
				var result = [];
				this.plugins.forEach(function(current) {
					result.push(current.getLocation());
				});
				return result;
			},
			isAllPlugin: function() {
				return true;
			},
			start: function(optOptions) {
				return this._invokeOnAllPlugins("start", optOptions); //$NON-NLS-0$
			},
			stop: function() {
				return this._invokeOnAllPlugins("stop"); //$NON-NLS-0$
			},
			uninstall: function() {
				return this._invokeOnAllPlugins("uninstall"); //$NON-NLS-0$
			},
			update: function() {
				return this._invokeOnAllPlugins("update"); //$NON-NLS-0$
			},

			/** @private */

			_invokeOnAllPlugins: function(funcName, arg) {
				var result = new Deferred();
				var targetCount = this.plugins.length;
				var succeedCount = 0;
				var succeedFn = function() {
					if (++succeedCount === targetCount) {
						result.resolve();
					}
				};
				var errorFn = function(error) {
					result.reject(error);
				};
				this.plugins.forEach(function(current) {
					current[funcName](arg).then(succeedFn, errorFn);
				});
				return result;
			}
		};
		return AllPlugin;
	}());

	orion.shellPage.ParamTypePlugin = (function() {
		function ParamTypePlugin(name, pluginRegistry, excludeDefaultPlugins, isSingleSelect) {
			this.name = name;
			this.pluginRegistry = pluginRegistry;
			this.excludeDefaultPlugins = excludeDefaultPlugins;
			this.isSingleSelect = isSingleSelect;

			var self = this;
			pluginRegistry.addEventListener(
				"installed", //$NON-NLS-0$
				function() {
					self._initPluginsList();
				}
			);
			pluginRegistry.addEventListener(
				"uninstalled", //$NON-NLS-0$
				function() {
					self._initPluginsList();
				}
			);

			/* don't let initialization delay page rendering */
			setTimeout(function() {
				if (self.excludeDefaultPlugins) {
					self._computeDefaultPlugins();
				}
				self._initPluginsList();
			}, 1);
		}

		ParamTypePlugin.prototype = {
			getName: function() {
				return this.name;
			},
			getPlugins: function() {
				return this.plugins.slice(0);
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
				return value.name;
			},

			/** @private */

			_defaultPluginURLs: {},
			_computeDefaultPlugins: function() {
				/* temporary, see Bug 368481 - Re-examine localStorage caching and lifecycle */
				var normalizeURL = function(location) {
					if (location.indexOf("://") === -1) { //$NON-NLS-0$
						var temp = document.createElement("a"); //$NON-NLS-0$
						temp.href = location;
				        return temp.href;
					}
					return location;
				};

				var defaultPluginsStorage = localStorage.getItem("/orion/preferences/default/plugins"); //$NON-NLS-0$
				if (defaultPluginsStorage) {
					var pluginsPreference = JSON.parse(defaultPluginsStorage);
					var self = this;
					Object.keys(pluginsPreference).forEach(function(pluginURL) {
						self._defaultPluginURLs[normalizeURL(require.toUrl(pluginURL))] = true;
					});
				}
			},

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
			_formatLocationAsPluginName: function(location) {
				function wordToUpper(strSentence) {
					function convertToUpper() {
						return arguments[0].toUpperCase();
					}
					return strSentence.toLowerCase().replace(/\b[a-z]/g, convertToUpper);
				}
				var divides = location.split("/"); //$NON-NLS-0$
				var last = divides[divides.length - 1];
				last = last.split(".html")[0]; //$NON-NLS-0$
				last = last.replace(/([a-z])([A-Z])/, "$1 $2"); //$NON-NLS-0$
				last = wordToUpper(last);
				last = last.replace("plugin", ""); //$NON-NLS-0$
				last = last.replace("Plugin", ""); //$NON-NLS-0$
				if (last === '') {
					last = location;
				}
				return last.trim();
			},
			_getPredictions: function(text) {
				var predictions = [];
				if (this.plugins) {
					this.plugins.forEach(function(current) {
						if (current.name.indexOf(text) === 0) {
							predictions.push({name: current.name, value: current});
						}
					});
					if (!this.isSingleSelect && NAME_ALL.indexOf(text) === 0) {
						predictions.push({name: NAME_ALL, value: new AllPlugin(this.plugins)});
					}
				}
				return predictions;
			},
			_initPluginsList: function() {
				this.plugins = [];
				var list = this.pluginRegistry.getPlugins();
				var self = this;
				list.forEach(function(current) {
					var location = current.getLocation();
					if (!self.excludeDefaultPlugins || !self._defaultPluginURLs[location]) {
						var headers = current.getHeaders();
						current.name = headers.name || self._formatLocationAsPluginName(location);
						self.plugins.push(current);
					}
				});
				this._sort(this.plugins);
			},
			_sort: function(children) {
				children.sort(function(a,b) {
					var name1 = a.name && a.name.toLowerCase();
					var name2 = b.name && b.name.toLowerCase();
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
		return ParamTypePlugin;
	}());

	return orion.shellPage;
});
