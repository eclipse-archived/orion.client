/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *******************************************************************************/

/*global define document window localStorage*/

define(["i18n!orion/shell/nls/messages", "require", "orion/widgets/Shell", "orion/i18nUtil", "orion/Deferred"],
	function(messages, require, mShell, i18nUtil, Deferred) {

	var NAME_ALL = "all"; //$NON-NLS-0$

	var orion = {};
	orion.shellPage = {};

	var AllPlugin = (function() {
		function AllPlugin(plugins, urlsToExclude) {
			this.plugins = plugins;
			this.urlsToExclude = urlsToExclude;
		}
		AllPlugin.prototype = {
			name: NAME_ALL,
			getPluginLocations: function() {
				var result = [];
				var self = this;
				this.plugins.forEach(function(current) {
					var location = current.getLocation();
					if (!self.urlsToExclude || !self.urlsToExclude[location]) {
						result.push(location);
					}
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
				var targetList = this.urlsToExclude ? [] : this.plugins;
				if (this.urlsToExclude) {
					var self = this;
					this.plugins.forEach(function(current) {
						if (!self.urlsToExclude[current.getLocation()]) {
							targetList.push(current);
						}
					});
				}

				var result = new Deferred();
				var targetCount = targetList.length;
				var succeedCount = 0;
				targetList.forEach(function(current) {
					current[funcName](arg).then(
						function() {
							if (++succeedCount === targetCount) {
								result.resolve();
							}
						},
						function(error) {
							result.reject(error);
						}
					);
				});
				return result;
			}
		};
		return AllPlugin;
	}());

	orion.shellPage.ParamTypePlugin = (function() {
		function ParamTypePlugin(pluginRegistry) {
			this.pluginRegistry = pluginRegistry;

			var self = this;
			pluginRegistry.addEventListener("installed", function() { //$NON-NLS-0$
				self._initPluginsList();
			});
			pluginRegistry.addEventListener("uninstalled", function() { //$NON-NLS-0$
				self._initPluginsList();
			});
			pluginRegistry.addEventListener("stopping", function() { //$NON-NLS-0$
				self._sort(self.plugins);
			});
			pluginRegistry.addEventListener("lazy activation", function() { //$NON-NLS-0$
				self._sort(self.plugins);
			});

			/* don't let initialization delay rendering of the page */
			window.setTimeout(function() {
				self._computeDefaultPlugins();
				self._initPluginsList();
			}, 1);
		}

		ParamTypePlugin.prototype = {
			getName: function() {
				return "plugin"; //$NON-NLS-0$
			},
			getPlugins: function() {
				return this.plugins.slice(0);
			},
			/**
			 * This function is invoked by the shell to query for the completion
			 * status and predictions for an argument with this parameter type.
			 */
			parse: function(arg, typeSpec) {
				var string = arg.text || "";
				var predictions = this._getPredictions(string, typeSpec.multiple, typeSpec.excludeDefaultPlugins);
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

			_defaultPluginUrls: {},
			_computeDefaultPlugins: function() {
				/* temporary, see Bug 368481 - Re-examine localStorage caching and lifecycle */
				var normalizeUrl = function(location) {
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
					Object.keys(pluginsPreference).forEach(function(pluginUrl) {
						self._defaultPluginUrls[normalizeUrl(require.toUrl(pluginUrl))] = true;
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
					value: exactMatch ? exactMatch.value : undefined,
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
			_getPredictions: function(text, multiple, excludeDefaultPlugins) {
				var predictions = [];
				if (this.plugins) {
					var self = this;
					this.plugins.forEach(function(current) {
						if (!excludeDefaultPlugins || !self._defaultPluginUrls[current.getLocation()]) {
							if (current.name.indexOf(text) === 0) {
								predictions.push({name: current.name, value: current});
							}
						}
					});
					if (multiple && NAME_ALL.indexOf(text) === 0) {
						predictions.push({
							name: NAME_ALL,
							value: new AllPlugin(this.plugins, excludeDefaultPlugins ? this._defaultPluginUrls : null)
						});
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
					var headers = current.getHeaders();
					current.name = headers.name || self._formatLocationAsPluginName(location);
					self.plugins.push(current);
				});
				this._sort(this.plugins);
			},
			_sort: function(children) {
				children.sort(function(a,b) {
					var isEnabled1 = a.getState();
					isEnabled1 = isEnabled1 === "active" || isEnabled1 === "starting"; //$NON-NLS-1$ //$NON-NLS-0$
					var isEnabled2 = b.getState();
					isEnabled2 = isEnabled2 === "active" || isEnabled2 === "starting"; //$NON-NLS-1$ //$NON-NLS-0$
					if (isEnabled1 !== isEnabled2) {
						return isEnabled1 ? -1 : 1;
					}
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
