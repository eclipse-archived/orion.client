/*******************************************************************************
 * @license
 * Copyright (c) 2012 VMWare and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     Kris De Volder (VMWare) - initial API and implementation
 *******************************************************************************/

/*global define*/

define(['dojo', 'consolePage/current-directory', 'orion/widgets/Console'],
	function(dojo, mCurrentDirectory, mConsole) {

	var orion = {};
	orion.consolePage = {};

	orion.consolePage.ParamTypeFile = (function() {
		function ParamTypeFile(name, directories, files) {
			this._init(name, directories, files);
		}

		ParamTypeFile.prototype = {
			_init: function(name, directories, files) {
				this.name = name;
				this.directories = directories;
				this.files = files;
				this.cache = {};
				var self = this;
				dojo.subscribe("/dojo/hashchange", function(newHash) {
					self.cache = {};
				});
			},
			/**
			 * This function is invoked by the console to query for the completion
			 * status and predictions for an argument with this parameter type.
			 */
			parse: function(arg) {
				var string = arg || "";
				var predictions = this.getPredictions(string);
				if (predictions !== null) {
					return this.createCompletion(string, predictions);
				} else {
					/* 
					 * The predictions are not available yet, so return a completion without predictions.
					 * A 'then' method is added to allow access to the actual completion via a callback.
					 */
					var deferredCompletion = {
						value: string,
						status: mConsole.CompletionStatus.PARTIAL
					};
					deferredCompletion.then = function(callback) {
						this.withCompletions(string, function(predictions) {
							callback(this.createCompletion(string, predictions));
						});
					};
					return deferredCompletion;
				}
			},

			stringify: function(value) {
				if (typeof(value) === "string") {
					return value;
				}
				return value.Name;
			},
			
			/* internal */

			computePredictions: function(text, validDirs) {
				var predictions = [];
				if (this.directories) {
					var add = text.length < 3;
					if (add) {
						for (var i = 0; i < text.length; i++) {
							if (text.charAt(i) !== '.') {
								add = false;
								break;
							}
						}
					}
					if (add) {
						// TODO the value for ".." should of course be the node of the
						// parent directory, but is currently just ".." because this
						// value often cannot always be determined
						predictions.push({name: "..", value: ".."});
					}
				}
				for (var i = 0; i < validDirs.length; i++) {
					var candidate = validDirs[i];
					var name = candidate.Name;
					if (this.startsWith(name, text)) {
						predictions.push({name: name, value: candidate});
					}
				}
				return predictions;
			},
			createCompletion: function(string, predictions) {
				var exactMatch = this.find(predictions, function(el) {
					return el.name === string;
				});
				var status, message;
				var value = string;
				if (exactMatch) {
					status = mConsole.CompletionStatus.MATCH;
					value = exactMatch.value;
				} else if (predictions !== null && predictions.length > 0) {
					status = mConsole.CompletionStatus.PARTIAL;
				} else {
					status = mConsole.CompletionStatus.ERROR;
					message = "'" + string + "'" + " is not valid";
				}
				return {value: value, status: status, message: message, predictions: predictions};
			},
			find: function(array, func) {
				for (var i = 0; i < array.length; i++) {
					if (func(array[i])) {
						return array[i];
					}
				}
				return null;
			},
			/*
			 * Returns predictions for text, or null if they cannot be computed synchronously.
			 */
			getPredictions: function(text) {
				if (this.cache.predictions && this.cache.text === text) {
					return this.cache.predictions;
				}
				if (this.cache.validDirs) {
					/* do a quick computation from the list of dirs */
					this.cache.predictions = this.computePredictions(text, this.cache.validDirs);
					this.cache.text = text;
					return this.cache.predictions;
				}
				/* no predictions currently ready, try to prefetch for future use */
				var self = this;
				this.withValidDirs(function(validDirs) {
					self.cache.validDirs = validDirs;
				});
				return null;
			},
			startsWith: function(string, prefix) {
				if (typeof(string) === "string" && typeof(prefix) === "string") {
					return string.indexOf(prefix) === 0;
				}
				return false;
			},
			/*
			 * Gets the list of completions for text and passes the result to func.
			 * This method will fetch the data asynchronously if required.
			 */
			withCompletions: function(text, func) {
				var completions = this.getPredictions(text);
				if (completions) {
					func(completions);
				} else {
					var self = this;
					this.withValidDirs(function(validDirs) {
						self.cache.validDirs = validDirs;
						func(this.getPredictions(text));
					});
				}
			},
			withValidDirs: function(func) {
				var self = this;
				mCurrentDirectory.withCurrentChildren(function(nodes) {
					var names = [];
					for (var i = 0; i < nodes.length; i++) {
						var node = nodes[i];
						if ((node.Directory && self.directories) || (!node.Directory && self.files)) {
							names.push(node);
						}
					}
					func(names);
				});
			}
		};
		return ParamTypeFile;
	}());
	
	return orion.consolePage;
});
