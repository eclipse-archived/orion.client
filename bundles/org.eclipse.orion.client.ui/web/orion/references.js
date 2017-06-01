/*******************************************************************************
 * @license
 * Copyright (c) 2016, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd, es6 */

define ([
	'orion/lsp/utils',
	'javascript/finder',
	'orion/editor/textModel',
	'orion/Deferred'
], function(Utils, Finder, TextModel, Deferred) {
	
	function References(serviceRegistry, inputManager, editor, languageServerRegistry) {
		this.serviceRegistry = serviceRegistry;
		this.inputManager = inputManager;
		this.editor = editor;
		this.languageServerRegistry = languageServerRegistry;
		this.fileClient = null;
		this.map = Object.create(null);
		
	}

	References.prototype = {
		getFileClient: function () {
			if(!this.fileClient) {
				this.fileClient = this.serviceRegistry.getService("orion.core.file.client"); //$NON-NLS-1$
			}
			return this.fileClient;
		},
		convertToRefResults: function (locations, editorLocation, text) {
			// edit has a uri for the file location and a range
			// we need to answer a ref result that contains:
			/*
			 *   refResult: array
			    [0]
			       children <array>
			         []
				         lineNumber <line number within the file>
				         matches:
				           category: ""
				           confidence: 100
				           end:  <position within the file>
				           length: end - start
				           start: <position within the file>
				           startIndex: position within the name
				         name <string>
				    contents: array of lines for the file
				    location: workspace relative path
				    metadata: file metadata object
				    name: <file name>
				    path: project relative path
				    totalMatches: number of matches in that file
			 */
			// need to collect the number of matches per file
			var results = new Map();
			for (var i = 0, max = locations.length;i < max; i++) {
				var loc = locations[i];
				var uri = loc.uri;
				var match = Object.create(null);
				match.startIndex = loc.range.start.character;
				match.confidence = 100;
				match.category = "";
				match.range = loc.range;
				var result = results.get(uri);
				var lineNumber = loc.range.start.line + 1;
				var children;
				if (!result) {
					result = Object.create(null);
					result.location = uri;
					result.path = uri;
					result.totalMatches = 0;
					var index = uri.lastIndexOf('/');
					result.name = uri.substring(index + 1); // extract file name from path
					children = new Map();
					result.children = children;
					results.set(uri, result);
				} else {
					children = result.children;
				}
				// already found a file with a match in it
				result.totalMatches = result.totalMatches + 1;
				
				// handle the current match
				var child = children.get(lineNumber);
				if (!child) {
					child = Object.create(null);
					child.lineNumber = lineNumber;
					child.matches = [];
					children.set(lineNumber, child);
				}
				child.matches.push(match);
			}
			// iterate over the matches's keys
			var returnedValue = [];
			results.forEach(function(value) {
				// get just the children's values
				var temp = [];
				value.children.forEach(function(element) {
					temp.push(element);
				});
				value.children = temp;
				returnedValue.push(value);
			});
			return returnedValue.map(function(element) {
				// convert each match
				return this.convertEachMatch(element, editorLocation, text);
			}.bind(this));
		},
		split_linebreaks: function (text) {
			return text.split(/\r\n|\r|\n|\u2028|\u2029/g);
		},
		getFile: function (childName) {
			if(this.map[childName]) {
				return new Deferred().resolve(this.map[childName]);
			}
			return this.getFileClient().read(childName, false, false, {readIfExists: true}).then(
				function(child) {
					this.map[childName] = {name: childName, contents: child};
					return this.map[childName];
				}.bind(this),
				function() {
					return null;
				});
		},
		convertEachMatch: function (element, editorLocation, text) {
			if (editorLocation === element.location) {
				var deferred = new Deferred();
				var allLines = this.split_linebreaks(text);
				element.contents = allLines;
				var textModel = new TextModel.TextModel(text, "auto");
				element.children.map(function(child) {
					child.name = allLines[child.lineNumber - 1]; // line number is 0-based
					return Deferred.all(this.convertMatchRange(textModel, child.matches)).then(function(selections) {
						deferred.resolve(element);
					});
				}.bind(this));
				return deferred;
			}
			return this.getFile(element.path).then(function(file) {
				var newDeferred = new Deferred();
				if (file) {
					var contents = file.contents;
					var allLines = this.split_linebreaks(contents);
					element.contents = allLines;
					var textModel = new TextModel.TextModel(contents, "auto");
					element.children.map(function(child) {
						child.name = allLines[child.lineNumber - 1]; // line number is 0-based
						return Deferred.all(this.convertMatchRange(textModel, child.matches)).then(function(selections) {
							newDeferred.resolve(element);
						});
					}.bind(this));
				} else {
					newDeferred.resolve();
				}
				return newDeferred;
			}.bind(this));
		},
		convertMatchRange: function (textModel, matches) {
			return matches.map(function(match) {
				var deferred = new Deferred();
				var selection = this.convertRangeFromTextModel(textModel, match.range);
				var start = selection.start;
				var end = selection.end;
				match.start = start;
				match.end = end;
				match.length = end - start;
				delete match.range;
				return deferred.resolve(match);
			}.bind(this));
		},
		convertRangeFromTextModel: function(textModel, range) {
			var startLineOffset = textModel.getLineStart(range.start.line);
			var endLineOffset = textModel.getLineStart(range.end.line);
			return {
				start: range.start.character+startLineOffset,
				end: range.end.character+endLineOffset,
			};
		},
		getLspReferences : function() {
			// check lsp extensions
			var inputManagerContentType = this.inputManager.getContentType();
			return this.languageServerRegistry.getServerByContentType(inputManagerContentType);
		},
		isVisible: function() {
			var languageServer = this.getLspReferences();
			if (languageServer) {
				return languageServer.isReferencesEnabled();
			}
			return false;
		},
		
		execute: function() {
			var selection = this.editor.getSelection();
			// check lsp formatters
			var getLspReferences = this.getLspReferences();
			if (getLspReferences) {
				var start = Utils.getPosition(this.editor, selection.start);
				var loc = this.inputManager.getFileMetadata().Location;
				return getLspReferences.references(loc, start, {includeDeclaration: true}).then(function(locations) {
					var result = {
						searchParams: {
							keyword: "",
							fileNamePatterns: ["*.java"],  //$NON-NLS-1$
							caseSensitive: true,
							incremental:false,
							shape: 'file' //$NON-NLS-1$
						},
						categories: {
							uncategorized: {
								category: "uncategorized",
								name: "Uncategorized",
								sort: 13
							}
						},
						refResult: []
					};
					if (Array.isArray(locations) && locations.length !== 0) {
						var text = this.editor.getText();
						var word = Finder.findWord(text, selection.start);
						if(word) {
							result.searchParams.keyword = word;
							return Deferred.all(this.convertToRefResults(locations, loc, text)).then(function(refResults) {
								result.refResult = refResults;
								return new Deferred().resolve(result);
							});
						}
						return new Deferred().resolve(result);
					}
					return new Deferred().resolve(result);
				}.bind(this));
			}
		}
	};
	return {References: References};
});