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

define(["i18n!orion/shell/nls/messages", "orion/widgets/Shell", "orion/i18nUtil"],
	function(messages, mShell, i18nUtil) {

	var orion = {};
	orion.shellPage = {};

	orion.shellPage.ParamTypeFile = (function() {
		function ParamTypeFile(name, shellPageFileService, directories, files) {
			this.name = name;
			this.shellPageFileService = shellPageFileService;
			this.directories = directories;
			this.files = files;
		}

		ParamTypeFile.prototype = {
			/**
			 * This function is invoked by the shell to query for the completion
			 * status and predictions for an argument with this parameter type.
			 */
			parse: function(arg) {
				var string = arg || "";
				if (string.indexOf("'") === 0) {
					string = string.substring(1);
				}
				if (string.lastIndexOf("'") === string.length - 1) {
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
				return value.typedPath || this.shellPageFileService.computePathString(value);
			},

			/** @private */

			_createCompletion: function(string, predictions) {
				var exactMatch;
				if (predictions) {
					for (var i = 0; i < predictions.length; i++) {
						var current = predictions[i];
						if (current.name === string) {
							if ((current.value.Directory && this.directories) || (!current.value.Directory && this.files)) {
								exactMatch = current;
								break;
							}
						}
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
			_find: function(array, func) {
				for (var i = 0; i < array.length; i++) {
					if (func(array[i])) {
						return array[i];
					}
				}
				return null;
			},
			_getPredictions: function(text) {
				var directoryNode = this.shellPageFileService.getDirectory(null, text);
				if (!directoryNode) {
					/* either invalid path or not yet retrieved */
					return null;
				}

				var childNodes = directoryNode.Children || [];

				var index = text.lastIndexOf(this.shellPageFileService.SEPARATOR) + 1;
				var directoriesSegment = text.substring(0, index);
				var finalSegment = text.substring(index);

				var directoryPredictions = [];
				var filePredictions = [];
				var name;
				if (finalSegment.length === 0 || finalSegment === "." || finalSegment === "..") { //$NON-NLS-1$ //$NON-NLS-0$
					var parentNode = this.shellPageFileService.getParent(directoryNode);
					if (parentNode) {
						name = directoriesSegment + ".."; //$NON-NLS-0$
						parentNode.typedPath = name;
						directoryPredictions.push({name: name, value: parentNode, incomplete: true});
					}
				}
				
				if (finalSegment.trim().length === 0 && directoriesSegment.length > 0) {
					name = directoriesSegment;
					directoryNode.typedPath = name;
					directoryPredictions.push({name: name, value: directoryNode, incomplete: false});
				}
				for (var i = 0; i < childNodes.length; i++) {
					var candidate = childNodes[i];
					if (candidate.Directory || this.files) {
						if (candidate.Name.indexOf(finalSegment) === 0) {
							var complete = !candidate.Directory || (candidate.Children && candidate.Children.length === 0);
							name = directoriesSegment + candidate.Name;
							candidate.typedPath = name;
							if (candidate.Directory) {
								directoryPredictions.push({name: name, value: candidate, incomplete: !complete});
							} else {
								filePredictions.push({name: name, value: candidate, incomplete: !complete});
							}
						}
					}
				}
				return directoryPredictions.concat(filePredictions);
			}
		};
		return ParamTypeFile;
	}());

	return orion.shellPage;
});
