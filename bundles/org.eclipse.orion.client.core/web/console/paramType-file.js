/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     Kris De Volder (VMWare) - initial API and implementation
 *******************************************************************************/

/*global define*/

define(["i18n!orion/console/nls/messages", "dojo", "orion/widgets/Console"],
	function(messages, dojo, mConsole) {

	var orion = {};
	orion.consolePage = {};

	orion.consolePage.ParamTypeFile = (function() {
		function ParamTypeFile(name, currentDirectory, directories, files) {
			this.name = name;
			this.currentDirectory = currentDirectory;
			this.directories = directories;
			this.files = files;
		}

		ParamTypeFile.prototype = {
			/**
			 * This function is invoked by the console to query for the completion
			 * status and predictions for an argument with this parameter type.
			 */
			parse: function(arg) {
				var string = arg || "";
				var predictions = this._getPredictions(string);
				if (predictions !== null) {
					return this._createCompletion(string, predictions);
				}
				return {};
			},

			/**
			 * This function is invoked by the console to query for a completion
			 * value's string representation.
			 */
			stringify: function(value) {
				return value.Name;
			},

			/** @private */

			_createCompletion: function(string, predictions) {
				var exactMatch = this._find(predictions, function(el) {
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
					message = dojo.string.substitute(messages["'${0}' is not valid"], [string]);
				}
				return {value: value, status: status, message: message, predictions: predictions};
			},
			_find: function(array, func) {
				for (var i = 0; i < array.length; i++) {
					if (func(array[i])) {
						return array[i];
					}
				}
				return null;
			},
			_getPredictions: function(text) {
				var childNodes = this.currentDirectory.getCurrentDirectoryChildren();
				if (!childNodes) {
					/* child nodes not known yet */
					return null;
				}

				var predictions = [];
				if (this.directories) {
					var add = text.length < 3;
					if (add) {
						for (var i = 0; i < text.length; i++) {
							if (text.charAt(i) !== ".") { //$NON-NLS-0$
								add = false;
								break;
							}
						}
					}
					if (add) {
						// TODO the value for ".." should of course be the node of the
						// parent directory, but is currently just ".." because this
						// value often cannot be determined
						predictions.push({name: "..", value: {Name: ".."}}); //$NON-NLS-1$ //$NON-NLS-0$
					}
				}
				for (var i = 0; i < childNodes.length; i++) {
					var candidate = childNodes[i];
					if ((candidate.Directory && this.directories) || (!candidate.Directory && this.files)) {
						var name = candidate.Name;
						if (name.indexOf(text) === 0) {
							predictions.push({name: name, value: candidate});
						}
					}
				}
				return predictions;
			}
		};
		return ParamTypeFile;
	}());

	return orion.consolePage;
});
