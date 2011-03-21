/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
 /*global window dojo dijit widgets eclipse:true handleGetAuthenticationError*/
 /*jslint maxerr:150 browser:true devel:true regexp:false*/
  
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.TitlePane");

var eclipse = eclipse || {};
eclipse.EditorContainer = (function() {
	function EditorContainer(
			serviceRegistry,
			/**function():eclipse.Editor*/ editorFactory,
			commandService, commandGenerator,
			/**function(eclipse.Editor):eclipse.UndoStack*/ undoStackFactory,
			/**function():eclipse.AnnotationRuler*/ annotationRulerFactory,
			/**function():eclipse.LineNumberRuler*/ lineNumberRulerFactory,
			/**function():eclipse.OverviewRuler*/ overviewRulerFactory,
			searcher,
			fileClient,
			domNode, /**DomNode|dijit._Widget*/ codeTitle,
			/**widgets.eWebBorderContainer*/ topContainer, contentassist,
			leftPane, searchFloat, toolbarId) {
		this._serviceRegistry = serviceRegistry;
		this._editorFactory = editorFactory;
		this._commandService = commandService;
		this._commandGenerator = commandGenerator;
		this._undoStackFactory = undoStackFactory;
		this._annotationRulerFactory = annotationRulerFactory;
		this._lineNumberRulerFactory = lineNumberRulerFactory;
		this._overviewRulerFactory = overviewRulerFactory;
		this._searcher = searcher;
		this._fileClient = fileClient;
		this._domNode = domNode;
		this._codeTitle = codeTitle;
		this._topContainer = topContainer;
		this._contentassist = contentassist;
		this._leftPane = leftPane;
		this._searchFloat = searchFloat;
		this._toolbarId = toolbarId;
		
		this._annotationsRuler = null;
		this._overviewRuler = null;
		this._fileMetadata = null;
		this._dirty = false;
		this._fileURI = null;
		
		this._leftPaneWidth = "";
		
		this._contentAssistMode = false;
		this._contentAssistPrefix = "";
		
		this._incrementalFindMode = false;
		this._incrementalFindSuccess = true;
		this._incrementalFindIgnoreSelection = false;
		this._incrementalFindPrefix = "";
		
		this.registerServiceHandlers();
	}
	EditorContainer.prototype = {
		getEditorWidget: function() {
			return this._editor;
		},
		
		getFileURI: function() {
			return this._fileURI;
		},
	
		// This is legitimate editor client-side code...establishing dependencies on registered services
		registerServiceHandlers: function() {
			var editorContainer = this;
			
			// This is legitimate editor client-side code...establishing dependencies on registered services
			this._serviceRegistry.getService("IProblemProvider").then(function(problemProvider) {
				problemProvider.addEventListener("problemsChanged", function(problems) {
					editorContainer.showProblems(problems);
				});
			});
			
			this._serviceRegistry.getService("IInputProvider").then(function(input) {
				input.addEventListener("inputChanged", function(fileURI) {
					editorContainer.setInput(fileURI);
				});
				input.getInput(function(fileURI) {
					editorContainer.setInput(fileURI);
				});
			});
		},
		
		/**
		 * @static
		 * @param editor
		 * @param start
		 * @param end
		 */
		moveSelection: function(editor, start, end) {
			end = end || start;
			editor.setSelection(start, end, false);
			var topPixel = editor.getTopPixel();
			var bottomPixel = editor.getBottomPixel();
			var line = editor.getModel().getLineAtOffset(start);
			var linePixel = editor.getLinePixel(line);
			if (linePixel < topPixel || linePixel > bottomPixel) {
				var height = bottomPixel - topPixel;
				var target = Math.max(0, linePixel- Math.floor((linePixel<topPixel?3:1)*height / 4));
				var a = new dojo.Animation({
					node: editor,
					duration: 300,
					curve: [topPixel, target],
					onAnimate: function(x){
						editor.setTopPixel(Math.floor(x));
					},
					onEnd: function() {
						editor.showSelection();
						editor.focus();
					}
				});
				a.play();
			} else {
				editor.showSelection();
				editor.focus();
			}
		},
		getContents : function() {
			if (this._editor) {
				return this._editor.getText();
			}
		},
		isDirty : function() {
			return this._dirty;
		},
		checkDirty : function() {
			var dirty = !this._undoStack.isClean();
			if (this._dirty === dirty) {
				return;
			}
			var title = this.getTitle();
			if (dirty && !this._dirty) {
				this._serviceRegistry.getService("IInputProvider").then(function(service) {
					service.setDirty(true);
				});
				if (title && title.charAt(0) !== '*') {
					this.setTitle('*'+title);
				}
			} else if (!dirty && this._dirty) {
				this._serviceRegistry.getService("IInputProvider").then(function(service) {
					service.setDirty(false);
				});
				if (title && title.charAt(0) === '*') {
					this.setTitle(title.substring(1));
				}
			}
			this._dirty = dirty;
		},
		getTitle : function() {
			return this._lastTitle;
		},
		getAnnotationsRuler : function() {
			return this._annotationsRuler;
		},
		showProblems : function(problems) {
			var errors, i, k, escapedReason, functions;
			errors = problems || [];
			i = 0;
			if (errors.length>0 && errors[errors.length - 1] === null) {
				errors.pop();
			}
			var ruler = this.getAnnotationsRuler();
			ruler.clearAnnotations();
			var lastLine = -1;
			for (k in errors) {
				if (errors[k]) {
					// escaping voodoo... we need to construct HTML that contains valid JavaScript.
					escapedReason = errors[k].reason.replace(/'/g, "&#39;").replace(/"/g, '&#34;');
					// console.log(escapedReason);
					var annotation = {
						line: errors[k].line - 1,
						column: errors[k].character,
						html: "<img src='images/problem.gif' title='" + escapedReason + "' alt='" + escapedReason + "'></img>",
						overviewStyle: {style: {"backgroundColor": "lightcoral", "border": "1px solid red"}}
					};
					
					// only one error reported per line, unless we want to merge them.  
					// For now, just show the first one, and the next one will show when the first is fixed...
					if (lastLine !== errors[k].line) {
						// console.log("adding annotation at line " + errors[k].line);
						ruler.setAnnotation(errors[k].line - 1, annotation);
						lastLine = errors[k].line;
					}
				}
			}
		},
		setTitle : function(title) {
			var indexOfSlash = title.lastIndexOf("/");
			var shortTitle = title;
			if (indexOfSlash !== -1) {
				shortTitle = shortTitle.substring(indexOfSlash + 1);
				if (title.charAt(0) === '*') {
					shortTitle = '*' + shortTitle;
				}
			}
			this._lastTitle = shortTitle;
			this._serviceRegistry.getService("IInputProvider").then(function(myService) {
				myService.setTitle(shortTitle);
			});
			// for now use the short title.  This could evolve into an
			// eclipse desktop-style breadcrumb that one could use to actually
			// navigate
			if (this._editor) {
				var titlePane = dojo.byId(this._codeTitle);
				if (titlePane) {
					dojo.empty(titlePane);
					new eclipse.BreadCrumbs({container: this._codeTitle, resource: this._fileMetadata});
					if (title.charAt(0) === '*') {
						var dirty = dojo.create('b', null, titlePane, "last");
						dirty.innerHTML = '*';
					}
				}
			}
		},
		// Content assist
		_contentAssistListener: {
			/** @this {eclipse.EditorContainer} */
			onVerify: function(event){
				// What are these for?
//				var c = this;
//				var e = this._editor;
//				var p = this._contentAssistPrefix;
//				var t = this._editor.getText(event.start, event.end);
				this._showContentAssist(false);
			},
			/** @this {eclipse.EditorContainer} */
			onSelectionChanged: function() {
				this._showContentAssist(false);
			}
		},
		_showContentAssist: function(enable) {
			var contentassist = this._contentassist;
			if (!contentassist) {
				return;
			}
			function createDiv(proposal, isSelected) {
				var attributes = {innerHTML: proposal, onclick: function(){alert(proposal);}};
				if (isSelected) {
					attributes.className = "selected";
				}
				dojo.create("div", attributes, contentassist);
			}
			var e = this._editor;
			if (!enable) {
				e.removeEventListener("Verify", this, this._contentAssistListener.onVerify);
				e.removeEventListener("Selection", this, this._contentAssistListener.onSelectionChanged);
				this._contentAssistMode = false;
				contentassist.style.display = "none";
			} else {
				var offset = e.getCaretOffset();
				var index = offset;
				var c;
				while (index > 0 && ((97 <= (c = e.getText(index - 1, index).charCodeAt(0)) && c <= 122) || (65 <= c && c <= 90) || c === 95 || (48 <= c && c <= 57))) { //LETTER OR UNDERSCORE OR NUMBER
					index--;
				}
				if (index === offset) {
					return;
				}
				this._contentAssistPrefix = e.getText(index, offset);
				
				var proposals = [];
				for (var i = this._contentAssistKeywords.length - 1; i>=0; i--) {
					var proposal = this._contentAssistKeywords[i];
					if (proposal.substr(0, this._contentAssistPrefix.length) === this._contentAssistPrefix) {
						proposals.push(proposal);
					}
				}
				if (proposals.length === 0) {
					return;
				}
				
				var caretLocation = e.getLocationAtOffset(offset);
				caretLocation.y += e.getLineHeight();
				contentassist.innerHTML = "";
				for (i = 0; i<proposals.length; i++) {
					createDiv(proposals[i], i===0);
				}
				e.convert(caretLocation, "document", "page");
				contentassist.style.left = caretLocation.x + "px";
				contentassist.style.top = caretLocation.y + "px";
				contentassist.style.display = "block";
				e.addEventListener("Verify", this, this._contentAssistListener.onVerify);
				e.addEventListener("Selection", this, this._contentAssistListener.onSelectionChanged);
				this._contentAssistMode = true;
			}
		},
		// end content assist
		
		// incremental find
		_incrementalFindListener: {
			/** @this {eclipse.EditorContainer} */
			onVerify: function(event){
				var prefix = this._incrementalFindPrefix,
					txt = this._editor.getText(event.start, event.end),
					match = prefix.match(new RegExp("^"+dojo.regexp.escapeString(txt), "i"));
				if (match && match.length > 0) {
					prefix = this._incrementalFindPrefix += event.text;
					this._serviceRegistry.getService("IStatusReporter").then(function(service) {
						service.setMessage("Incremental find: " + prefix);
					});
					var ignoreCase = prefix.toLowerCase() === prefix;
					var result = this.doFind(prefix, this._editor.getSelection().start, ignoreCase);
					if (result) {
						this._incrementalFindSuccess = true;
						this._incrementalFindIgnoreSelection = true;
						this.moveSelection(this._editor, result.index, result.index+result.length);
						this._incrementalFindIgnoreSelection = false;
					} else {
						// should turn message red
						this._serviceRegistry.getService("IStatusReporter").then(function(service) {
							service.setErrorMessage("Incremental find: " + prefix + " (not found)");
						});
						this._incrementalFindSuccess = false;
					}
					event.text = null;
				} else {
				}
			},
			/** @this {eclipse.EditorContainer} */
			onSelection: function() {
				if (!this._incrementalFindIgnoreSelection) {
					this._toggleIncrementalFind();
				}
			}
		},
			
		_toggleIncrementalFind: function() {
			this._incrementalFindMode = !this._incrementalFindMode;
			if (this._incrementalFindMode) {
				var self = this;
				this._serviceRegistry.getService("IStatusReporter").then(function(service) {
					service.setMessage("Incremental find: " + self._incrementalFindPrefix);
				});
				this._editor.addEventListener("Verify", this, this._incrementalFindListener.onVerify);
				this._editor.addEventListener("Selection", this, this._incrementalFindListener.onSelection);
			} else {
				this._incrementalFindPrefix = "";
				this._serviceRegistry.getService("IStatusReporter").then(function(service) {
					service.setMessage("");
				});
				this._editor.removeEventListener("Verify", this, this._incrementalFindListener.onVerify);
				this._editor.removeEventListener("Selection", this, this._incrementalFindListener.onSelection);
				this._editor.setCaretOffset(this._editor.getCaretOffset());
			}
		},
		// end incremental find
		
		calcLeftPaneW: function(){
			var leftPaneW = this._topContainer.getSizeCookie();
			if(leftPaneW < 50){
				var rightPane =  this._editor._editorDiv;
				var originalW = rightPane.style.width;
				var originalWint = parseInt(originalW.replace("px", ""), 10);
				this._leftPaneWidth = originalWint*0.25 + "px";
			} else {
				this._leftPaneWidth =leftPaneW + "px";
			}
			return this._leftPaneWidth;
		},
		toggleLeftPane: function(){
			var rightPane =  this._editor._editorDiv;
			var rightPaneEditor =  this._editor;
			var targetW = "";
			var originalW = this._leftPane.style.width;
			var originalWint = parseInt(originalW.replace("px", ""), 10);
			var isLeftOpen = this._topContainer.isLeftPaneOpen();
			if(isLeftOpen){
				this._leftPaneWidth = originalW;
				targetW = "0px";
			} else {
				this.calcLeftPaneW();
				targetW = this._leftPaneWidth;
			}
			var targetWint = parseInt(targetW.replace("px", ""), 10);
			
			if(!isLeftOpen) {
				this._topContainer.toggleLeftPaneState();
			}
			
			var a = new dojo.Animation({
				node: this._leftPane,
				duration: 300,
				curve: [1, 100],
				onAnimate: dojo.hitch(this, function(x){
					var deltaW = (targetWint - originalWint)*x/100;
					var curWidth = originalWint + deltaW;
					this._leftPane.style.width = curWidth + "px";
					this._leftPane.style.overflow = "hidden";
					rightPane.style.overflow = "hidden";
					this._topContainer.layout();
					//this._topContainer.resize();
				}),
				onEnd: dojo.hitch(this, function(){
					rightPane.style.overflow = "auto";
					rightPaneEditor.redrawLines();
					if(isLeftOpen){
						this._topContainer.toggleLeftPaneState();
					} else {
						this._leftPane.style.overflow = "auto";
						this._topContainer.setSizeCookie(null);
					}
				})
			});
			a.play();
		},
		
		/**
		 * Helper for finding occurrences of str in the editor.
		 * @param str {String}
		 * @param startIndex {number}
		 * @param [ignoreCase] {boolean} Default is false
		 * @param [reverse] {boolean} Default is false
		 * @return {index: number, length: number} giving the match details, or null if no match found.
		 */
		doFind: function(str, startIndex, ignoreCase, reverse) {
			var text = this._editor.getText();
			if (ignoreCase) {
				str = str.toLowerCase();
				text = text.toLowerCase();
			}
			
			var i;
			if (reverse) {
				text = text.split("").reverse().join("");
				str = str.split("").reverse().join("");
				startIndex = text.length - startIndex - 1;
				i = text.indexOf(str, startIndex);
				if (i !== -1) {
					return {index: text.length - str.length - i, length: str.length};
				}
			} else {
				i = text.indexOf(str, startIndex);
				if (i !== -1) {
					return {index: i, length: str.length};
				}
			}
			return null;
		},
		
		/**
		 * Helper for finding regexp matches in the editor. Use doFind() for simple string searches.
		 * @param pattern {String} A valid regexp pattern
		 * @param flags {String} Valid regexp flags: [is]
		 * @param [startIndex] {number} Default is false
		 * @param [reverse] {boolean} Default is false
		 * @return {index: number, length: number} giving the match details, or null if no match found.
		 */
		doFindRegExp: function(pattern, flags, startIndex, reverse) {
			if (!pattern) {
				return null;
			}
			
			flags = flags || "";
			// 'g' makes exec() iterate all matches, 'm' makes ^$ work linewise
			flags += (flags.indexOf("g") === -1 ? "g" : "") + (flags.indexOf("m") === -1 ? "m" : "");
			var regexp = new RegExp(pattern, flags);
			var text = this._editor.getText();
			var result = null,
			    match = null;
			if (reverse) {
				while (true) {
					result = regexp.exec(text);
					if (result && result.index <= startIndex) {
						match = {index: result.index, length: result[0].length};
					} else {
						return match;
					}
				}
			} else {
				result = regexp.exec(text.substring(startIndex));
				return result && {index: result.index + startIndex, length: result[0].length};
			}
		},
		
		/**
		 * @param {String} Input string
		 * @return {pattern:String, flags:String} if str looks like a RegExp, or null otherwise
		 */
		parseRegExp: function(str) {
			var regexp = /^\s*\/(.+)\/([gim]{0,3})\s*$/.exec(str);
			if (regexp) {
				return {pattern: regexp[1], flags: regexp[2]};
			}
			return null;
		},
		
		installEditor : function(fileURI) {
			var registry = this._serviceRegistry;
			this._fileURI = fileURI;
			
			// Create editor and install optional features
			this._editor = this._editorFactory();
			if (this._commandGenerator) {
				this._commandGenerator(registry, this._commandService, this._fileClient, this, this._toolbarId);
			}
			if (this._undoStackFactory) {
				this._undoStack = this._undoStackFactory(registry, this._commandService, this, this._toolbarId);
			}
			
			var editorContainer = this,
				editor = this._editor,
				KeyBinding = eclipse.KeyBinding,
				undoStack = this._undoStack;
			
			// Collapse/Expand left pane 
			editor.setKeyBinding(new KeyBinding("o", true), "toggle");
			editor.setAction("toggle", function(){
				editorContainer.toggleLeftPane();
			});
			
			// Find actions
			// These variables are used among the various find actions:
			var searchString = "",
			    pattern,
			    flags;
			editor.setKeyBinding(new KeyBinding("f", true), "find");
			editor.setAction("find", function() {
				setTimeout(function() {
					var selection = editor.getSelection();
					if (selection.end > selection.start) {
						searchString = editor.getText().substring(selection.start, selection.end);
					} else {
						searchString = "";
					}
					searchString = prompt("Enter search term or /regex/:", searchString);
					if (!searchString) {
						return;
					}
					
					var ignoreCase = searchString.toLowerCase() === searchString,
					    regexp = editorContainer.parseRegExp(searchString),
					    result;
					if (regexp) {
						pattern = regexp.pattern;
						flags = regexp.flags;
						flags = flags + (ignoreCase && flags.indexOf("i") === -1 ? "i" : "");
						result = editorContainer.doFindRegExp(pattern, flags, editor.getCaretOffset());
					} else {
						pattern = null;
						flags = null;
						result = editorContainer.doFind(searchString, editor.getCaretOffset(), ignoreCase);
					}
					
					if (result) {
						editorContainer.moveSelection(editor, result.index, result.index+result.length);
					} else {
						registry.getService("IStatusReporter").then(function(service) {
							service.setErrorMessage("not found");
						});
					}
				}, 0);
			});
			editor.setKeyBinding(new KeyBinding("k", true), "find next");
			editor.setAction("find next", function() {
				var result, ignoreCase;
				if (editorContainer._incrementalFindMode) {
					var str = editorContainer._incrementalFindPrefix;
					ignoreCase = str.toLowerCase() === str;
					result = editorContainer.doFind(str, editor.getCaretOffset(), ignoreCase);
				} else if (pattern) {
					// RegExp search
					result = editorContainer.doFindRegExp(pattern, flags, editor.getCaretOffset());
				} else {
					ignoreCase = searchString.toLowerCase() === searchString;
					result = editorContainer.doFind(searchString, editor.getCaretOffset(), ignoreCase);
				}
				
				if (result) {
					editorContainer._incrementalFindIgnoreSelection = true;
					editorContainer.moveSelection(editor, result.index, result.index+result.length);
					editorContainer._incrementalFindIgnoreSelection = false;
				} else {
					registry.getService("IStatusReporter").then(function(service) {
						service.setErrorMessage("not found");
					});
				}
			});
			editor.setKeyBinding(new KeyBinding("k", true, true), "find previous");
			editor.setAction("find previous", function() {
				var selection = editor.getSelection();
				var selectionSize = (selection.end > selection.start) ? selection.end - selection.start : 0;
				var result, ignoreCase;
				if (editorContainer._incrementalFindMode) {
					var str = editorContainer._incrementalFindPrefix;
					ignoreCase = str.toLowerCase() === str;
					result = editorContainer.doFind(str, editor.getCaretOffset() - selectionSize - 1, ignoreCase, true);
				} else if (pattern) {
					// RegExp search
					result = editorContainer.doFindRegExp(pattern, flags, editor.getCaretOffset() - selectionSize - 1, true);
				} else {
					ignoreCase = searchString.toLowerCase() === searchString;
					result = editorContainer.doFind(searchString, editor.getCaretOffset() - selectionSize - 1, ignoreCase, true);
				}
				
				if (result) {
					editorContainer._incrementalFindIgnoreSelection = true;
					editorContainer.moveSelection(editor, result.index, result.index+result.length);
					editorContainer._incrementalFindIgnoreSelection = false;
				} else {
					registry.getService("IStatusReporter").then(function(service) {
						service.setErrorMessage("not found");
					});
				}
			});
			editor.setKeyBinding(new KeyBinding("j", true), "incremental find");
			editor.setAction("incremental find", function() {
				if (!editorContainer._incrementalFindMode) {
					editor.setCaretOffset(editor.getCaretOffset());
					editorContainer._toggleIncrementalFind();
				} else {
					var p = editorContainer._incrementalFindPrefix;
					if (p.length === 0) {
						return;
					}
					
					var start = editorContainer._editor.getSelection().start + 1;
					if (editorContainer._incrementalFindSuccess === false) {
						start = 0;
					}
					
					var caseInsensitive = p.toLowerCase() === p;
					var result = editorContainer.doFind(p, start, caseInsensitive);
					if (result) {
						editorContainer._incrementalFindSuccess = true;
						editorContainer._incrementalFindIgnoreSelection = true;
						editorContainer.moveSelection(editorContainer._editor, result.index, result.index + result.length);
						editorContainer._incrementalFindIgnoreSelection = false;
						registry.getService("IStatusReporter").then(function(service) {
							service.setMessage("Incremental find: " + p);
						});
					} else {
						// should turn message red
						registry.getService("IStatusReporter").then(function(service) {
							service.setErrorMessage("Incremental find: " + p + " (not found)");
						});
						editorContainer._incrementalFindSuccess = false;
					}
				}
			});
			editor.setKeyBinding(new KeyBinding(27), "ESC");
			editor.setAction("ESC", function() {
				if (editorContainer._incrementalFindMode) {
					editorContainer._toggleIncrementalFind();
					return true;
				} else if (editorContainer._contentAssistMode) {
					editorContainer._showContentAssist(false);
					return true;
				} else {
					return false;
				}
			});
			editor.setAction("deletePrevious", function() {
				if (editorContainer._incrementalFindMode) {
					var p = editorContainer._incrementalFindPrefix;
					p = editorContainer._incrementalFindPrefix = p.substring(0, p.length-1);
					if (p.length===0) {
						editorContainer._incrementalFindSuccess = true;
						editorContainer._incrementalFindIgnoreSelection = true;
						editorContainer._editor.setCaretOffset(editorContainer._editor.getSelection().start);
						editorContainer._incrementalFindIgnoreSelection = false;
						editorContainer._toggleIncrementalFind();
						return true;
					}
					registry.getService("IStatusReporter").then(function(service) {
						service.setMessage("Incremental find: " + p);
					});	
					var index = editorContainer._editor.getText().lastIndexOf(p, editorContainer._editor.getCaretOffset() - p.length - 1);
					if (index !== -1) {
						editorContainer._incrementalFindSuccess = true;
						editorContainer._incrementalFindIgnoreSelection = true;
						editorContainer.moveSelection(editorContainer._editor, index,index+p.length);
						editorContainer._incrementalFindIgnoreSelection = false;
					} else {
						registry.getService("IStatusReporter").then(function(service) {
							service.setErrorMessage("Incremental find: " + p + " (not found)");
						});
					}
					return true;
				} else {
					return false;
				}
			});
			editor.setAction("lineUp", function() {
				var index;
				if (editorContainer._incrementalFindMode) {
					var p = editorContainer._incrementalFindPrefix;
					var start = editorContainer._editor.getCaretOffset() - p.length - 1;
					if (editorContainer._incrementalFindSuccess === false) {
						start = editorContainer._editor.getModel().getCharCount() - 1;
					}
					index = editorContainer._editor.getText().lastIndexOf(p, start);
					if (index !== -1) {
						editorContainer._incrementalFindSuccess = true;
						editorContainer._incrementalFindIgnoreSelection = true;
						editorContainer.moveSelection(editorContainer._editor, index,index+p.length);
						editorContainer._incrementalFindIgnoreSelection = false;
					} else {
						// should turn message red
						registry.getService("IStatusReporter").then(function(service) {
							service.setErrorMessage("Incremental find: " + p + " (not found)");	
						});
						editorContainer._incrementalFindSuccess = false;
					}
					return true;
				} else if (editorContainer._contentAssistMode) {
					var contentassist = this._contentassist;
					if (contentassist) {
						var nodes = dojo.query('> div', contentassist);
						index = 0;
						for (var i=0; i<nodes.length; i++) {
							if (nodes[i].className === "selected") {
								nodes[i].className = "";
								index = i;
								break;
							}
						}
						if (index > 0) {
							nodes[index-1].className = "selected";
						} else {
							nodes[nodes.length - 1].className = "selected";
						}
						return true;
					}
				}
				return false;
			});
			editor.setAction("lineDown", function() {
				var index;
				if (editorContainer._incrementalFindMode) {
					var p = editorContainer._incrementalFindPrefix;
					if (p.length===0) {
						return;
					}
					var start = editorContainer._editor.getSelection().start + 1;
					if (editorContainer._incrementalFindSuccess === false) {
						start = 0;
					}
					index = editorContainer._editor.getText().indexOf(p, start);
					if (index !== -1) {
						editorContainer._incrementalFindSuccess = true;
						editorContainer._incrementalFindIgnoreSelection = true;
						editorContainer.moveSelection(editorContainer._editor, index, index+p.length);
						editorContainer._incrementalFindIgnoreSelection = false;
						registry.getService("IStatusReporter").then(function(service) {
							service.setMessage("Incremental find: " + p);
						});	
					} else {
						// should turn message red
						registry.getService("IStatusReporter").then(function(service) {
							service.setErrorMessage("Incremental find: " + p + " (not found)");
						});	
						editorContainer._incrementalFindSuccess = false;
					}
					return true;
				} else if (editorContainer._contentAssistMode) {
					var contentassist = this._contentassist;
					if (contentassist) {
						var nodes = dojo.query('> div', contentassist);
						index = 0;
						for (var i=0; i<nodes.length; i++) {
							if (nodes[i].className === "selected") {
								nodes[i].className = "";
								index = i;
								break;
							}
						}
						if (index < nodes.length - 1) {
							nodes[index+1].className = "selected";
						} else {
							nodes[0].className = "selected";
						}
						return true;
					}
				}
				return false;
			});

			// Tab actions
			editor.setAction("tab", function() {
				var selection = editor.getSelection();
				var model = editor.getModel();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end>selection.start?selection.end - 1:selection.end);
				if (firstLine !== lastLine) {
					undoStack.startCompoundChange();
					var lineStart = model.getLineStart(firstLine);
					for (var i = firstLine; i <= lastLine; i++) {
						lineStart = model.getLineStart(i);
						editor.setText("\t", lineStart, lineStart);
					}
					editor.setSelection(lineStart===selection.start?lineStart:selection.start + 1, selection.end + (lastLine - firstLine + 1));
					undoStack.endCompoundChange();
					return true;
				}
				return false;
			});
			editor.setKeyBinding(new KeyBinding(9, false, true), "shift tab");
			editor.setAction("shift tab", function() {
				var selection = editor.getSelection();
				var model = editor.getModel();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end>selection.start?selection.end - 1:selection.end);
				var i, lineStart;
				for (i = firstLine; i <= lastLine; i++) {
					lineStart = model.getLineStart(i);
					var lineEnd = model.getLineEnd(i);
					if (lineStart === lineEnd) { return false; }
					if (editor.getText(lineStart, lineStart + 1) !== "\t") { return false; }
				}
				undoStack.startCompoundChange();
				lineStart = model.getLineStart(firstLine);
				var lastLineStart = model.getLineStart(lastLine);
				for (i = firstLine; i <= lastLine; i++) {
					lineStart = model.getLineStart(i);
					editor.setText("", lineStart, lineStart + 1);
				}
				editor.setSelection(lineStart===selection.start?lineStart:selection.start - 1, selection.end - (lastLine - firstLine + 1) + (selection.end===lastLineStart+1?1:0));
				undoStack.endCompoundChange();
				return true;
			});
			
			editor.setKeyBinding(new KeyBinding(38, false, false, true), "move up selection");
			editor.setAction("move up selection", function() {
				var selection = editor.getSelection();
				var model = editor.getModel();
				var firstLine = model.getLineAtOffset(selection.start);
				if (firstLine===0) {
					return true;
				}
				undoStack.startCompoundChange();
				var lastLine = model.getLineAtOffset(selection.end>selection.start?selection.end - 1:selection.end);
				var isMoveFromLastLine = model.getLineCount()-1===lastLine;
				var lineStart = model.getLineStart(firstLine);
				var lineEnd = isMoveFromLastLine?model.getCharCount():model.getLineStart(lastLine+1);
				if (isMoveFromLastLine) {
					// Move delimiter preceding selection to end
					var delimiterStart = model.getLineEnd(firstLine-1);
					var delimiterEnd = model.getLineEnd(firstLine-1, true);
					var delimiter = model.getText(delimiterStart, delimiterEnd);
					lineStart = delimiterStart;
					model.setText(model.getText(delimiterEnd, lineEnd)+delimiter, lineStart, lineEnd);
				}
				var text = model.getText(lineStart, lineEnd);
				model.setText("", lineStart, lineEnd);
				var insertPos = model.getLineStart(firstLine-1);
				model.setText(text, insertPos, insertPos);
				var selectionEnd = insertPos+text.length-(isMoveFromLastLine?model.getLineDelimiter().length:0);
				editor.setSelection(insertPos, selectionEnd);
				undoStack.endCompoundChange();
			});
			
			editor.setKeyBinding(new KeyBinding(40, false, false, true), "move down selection");
			editor.setAction("move down selection", function() {
				var selection = editor.getSelection();
				var model = editor.getModel();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end>selection.start?selection.end - 1:selection.end);
				if (lastLine===model.getLineCount()-1) {
					return true;
				}
				undoStack.startCompoundChange();
				var isMoveIntoLastLine = lastLine===model.getLineCount()-2;
				var lineStart = model.getLineStart(firstLine);
				var lineEnd = model.getLineStart(lastLine+1);
				if (isMoveIntoLastLine) {
					// Move delimiter following selection to front
					var delimiterStart = model.getLineStart(lastLine+1)-model.getLineDelimiter().length;
					var delimiterEnd = model.getLineStart(lastLine+1);
					var delimiter = model.getText(delimiterStart, delimiterEnd);
					model.setText(delimiter + model.getText(lineStart, delimiterStart), lineStart, lineEnd);
				}
				var text = model.getText(lineStart, lineEnd);
				var insertPos = (isMoveIntoLastLine?model.getCharCount():model.getLineStart(lastLine+2))-(lineEnd-lineStart);
				model.setText("", lineStart, lineEnd);
				model.setText(text, insertPos, insertPos);
				var selStart = insertPos+(isMoveIntoLastLine?model.getLineDelimiter().length:0);
				var selEnd = insertPos+text.length;
				editor.setSelection(selStart, selEnd);
				undoStack.endCompoundChange();
			});
			
			editor.setKeyBinding(new KeyBinding(38, true, false, true), "copy up selection");
			editor.setAction("copy up selection", function() {
				undoStack.startCompoundChange();
				var selection = editor.getSelection();
				var model = editor.getModel();
				var delimiter = model.getLineDelimiter();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end>selection.start?selection.end - 1:selection.end);
				var lineStart = model.getLineStart(firstLine);
				var isCopyFromLastLine = model.getLineCount()-1===lastLine;
				var lineEnd = isCopyFromLastLine?model.getCharCount():model.getLineStart(lastLine+1);
				var text = model.getText(lineStart, lineEnd)+(isCopyFromLastLine?delimiter:""); //+ delimiter;
				//var insertPos = model.getLineStart(firstLine - 1);
				var insertPos = lineStart;
				model.setText(text, insertPos, insertPos);
				editor.setSelection(insertPos, insertPos+text.length-(isCopyFromLastLine?delimiter.length:0));
				undoStack.endCompoundChange();
			});
			
			editor.setKeyBinding(new KeyBinding(40, true, false, true), "copy down selection");
			editor.setAction("copy down selection", function() {
				undoStack.startCompoundChange();
				var selection = editor.getSelection();
				var model = editor.getModel();
				var delimiter = model.getLineDelimiter();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end>selection.start?selection.end - 1:selection.end);
				var lineStart = model.getLineStart(firstLine);
				var isCopyFromLastLine = model.getLineCount()-1===lastLine;
				var lineEnd = isCopyFromLastLine?model.getCharCount():model.getLineStart(lastLine+1);
				var text = (isCopyFromLastLine?delimiter:"")+model.getText(lineStart, lineEnd);
				//model.setText("", lineStart, lineEnd);
				//var insertPos = model.getLineStart(firstLine - 1);
				var insertPos = lineEnd;
				model.setText(text, insertPos, insertPos);
				editor.setSelection(insertPos+(isCopyFromLastLine?delimiter.length:0), insertPos+text.length);
				undoStack.endCompoundChange();
			});
			
			editor.setKeyBinding(new KeyBinding('d', true, false, false), "delete selected lines");
			editor.setAction("delete selected lines", function() {
				undoStack.startCompoundChange();
				var selection = editor.getSelection();
				var model = editor.getModel();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end>selection.start?selection.end - 1:selection.end);
				var lineStart = model.getLineStart(firstLine);
				var lineEnd = model.getLineCount()-1===lastLine?model.getCharCount():model.getLineStart(lastLine+1);
				model.setText("", lineStart, lineEnd);
				undoStack.endCompoundChange();
			});
			
			editor.setKeyBinding(new KeyBinding(191, true), "toggle comment");
			editor.setAction("toggle comment", function() {
				undoStack.startCompoundChange();
				var selection = editor.getSelection();
				var model = editor.getModel();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end>selection.start?selection.end - 1:selection.end);
				var uncomment = true;
				var lineText;
				for (var i = firstLine; i <= lastLine && uncomment; i++) {
					lineText = editor.getModel().getLine(i);
					var index = lineText.indexOf("//");
					if (index === -1) {
						uncomment = false;
					} else {
						if (index !== 0) {
							var j;
							for (j=0; j<index; j++) {
								var c = lineText.charCodeAt(j);
								if (!(c === 32 || c === 9)) {
									break;
								}
							}
							uncomment = j === index;
						}
					}
				}
				var k, lineStart, lastLineStart, insertOffset;
				if (uncomment) {
					lineStart = model.getLineStart(firstLine);
					lastLineStart = model.getLineStart(lastLine);
					for (k = firstLine; k <= lastLine; k++) {
						lineText = editor.getModel().getLine(k);
						insertOffset = lineText.indexOf("//") + model.getLineStart(k);
						editor.setText("", insertOffset, insertOffset + 2);
					}
					editor.setSelection(lineStart===selection.start?lineStart:selection.start - 2, selection.end - (2 * (lastLine - firstLine + 1)) + (selection.end===lastLineStart+1?2:0));
				} else {
					lineStart = model.getLineStart(firstLine);
					lastLineStart = model.getLineStart(lastLine);
					for (k = firstLine; k <= lastLine; k++) {
						insertOffset = model.getLineStart(k);
						editor.setText("//", insertOffset, insertOffset);
					}
					editor.setSelection(lineStart===selection.start?lineStart:selection.start + 2, selection.end + (2 * (lastLine - firstLine + 1)));
				}
				undoStack.endCompoundChange();
				return true;
			});
			
			function findEnclosingComment(model, start, end) {
				var open = "/*", close = "*/";
				var firstLine = model.getLineAtOffset(start);
				var lastLine = model.getLineAtOffset(end);
				var i, line, extent, openPos, closePos;
				var commentStart, commentEnd;
				for (i=firstLine; i >= 0; i--) {
					line = model.getLine(i);
					extent = (i === firstLine) ? start - model.getLineStart(firstLine) : line.length;
					openPos = line.lastIndexOf(open, extent);
					closePos = line.lastIndexOf(close, extent);
					if (closePos > openPos) {
						break; // not inside a comment
					} else if (openPos !== -1) {
						commentStart = model.getLineStart(i) + openPos;
						break;
					}
				}
				for (i=lastLine; i < model.getLineCount(); i++) {
					line = model.getLine(i);
					extent = (i === lastLine) ? end - model.getLineStart(lastLine) : 0;
					openPos = line.indexOf(open, extent);
					closePos = line.indexOf(close, extent);
					if (openPos !== -1 && openPos < closePos) {
						break;
					} else if (closePos !== -1) {
						commentEnd = model.getLineStart(i) + closePos;
						break;
					}
				}
				return {commentStart: commentStart, commentEnd: commentEnd};
			}
			
			editor.setKeyBinding(new KeyBinding(191, true, true), "add block comment");
			editor.setAction("add block comment", function() {
				var selection = editor.getSelection();
				var model = editor.getModel();
				var open = "/*", close = "*/", commentTags = new RegExp("/\\*" + "|" + "\\*/", "g");
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end);
				
				var result = findEnclosingComment(model, selection.start, selection.end);
				if (result.commentStart !== undefined && result.commentEnd !== undefined) {
					return true; // Already in a comment
				}
				
				var text = model.getText(selection.start, selection.end);
				if (text.length === 0) { return true; }
				
				var oldLength = text.length;
				text = text.replace(commentTags, "");
				var newLength = text.length;
				
				undoStack.startCompoundChange();
				model.setText(open + text + close, selection.start, selection.end);
				editor.setSelection(selection.start + open.length, selection.end + open.length + (newLength-oldLength));
				undoStack.endCompoundChange();
			});
			
			editor.setKeyBinding(new KeyBinding(220, true, true), "remove block comment");
			editor.setAction("remove block comment", function() {
				var selection = editor.getSelection();
				var model = editor.getModel();
				var open = "/*", close = "*/";
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end);
				
				// Try to shrink selection to a comment block
				var selectedText = model.getText(selection.start, selection.end);
				var newStart, newEnd;
				var i;
				for(i=0; i < selectedText.length; i++) {
					if (selectedText.substring(i, i + open.length) === open) {
						newStart = selection.start + i;
						break;
					}
				}
				for (; i < selectedText.length; i++) {
					if (selectedText.substring(i, i + close.length) === close) {
						newEnd = selection.start + i;
						break;
					}
				}
				
				undoStack.startCompoundChange();
				if (newStart !== undefined && newEnd !== undefined) {
					model.setText(model.getText(newStart + open.length, newEnd), newStart, newEnd + close.length);
					editor.setSelection(newStart, newEnd);
				} else {
					// Otherwise find enclosing comment block
					var result = findEnclosingComment(model, selection.start, selection.end);
					if (result.commentStart === undefined || result.commentEnd === undefined) {
						return true;
					}
					
					var text = model.getText(result.commentStart + open.length, result.commentEnd);
					model.setText(text, result.commentStart, result.commentEnd + close.length);
					editor.setSelection(selection.start - open.length, selection.end - close.length);
				}
				undoStack.endCompoundChange();
			});
			
			//Auto indent
			editor.setAction("enter", function() {
				if (editorContainer._contentAssistMode) {
					var contentassist = this._contentassist;
					var proposal = dojo.query("> .selected", contentassist);
					editor.setText(proposal[0].innerHTML.substring(editorContainer._contentAssistPrefix.length), editor.getCaretOffset(), editor.getCaretOffset());
					editorContainer._showContentAssist(false);
					return true;
				}
				var selection = editor.getSelection();
				if (selection.start === selection.end) {
					var model = editor.getModel();
					var lineIndex = model.getLineAtOffset(selection.start);
					var lineText = model.getLine(lineIndex);
					var index = 0, c;
					while ((c = lineText.charCodeAt(index)) === 32 || c === 9) { index++; }
					if (index > 0) {
						editor.setText(model.getLineDelimiter() + lineText.substring(0, index), selection.start, selection.end);
						return true;
					}
				}
				return false;
			});
			
			// Global search action
			editor.setKeyBinding(new KeyBinding("h", true), "search");
			editor.setAction("search", function() {
				setTimeout(function() {
					var selection = editor.getSelection();
					var searchPattern = "";
					if (selection.end > selection.start) {
						searchPattern = editor.getText().substring(selection.start, selection.end);
					} if (searchPattern.length <= 0) {
						searchPattern = prompt("Enter search term:", searchPattern);
					} if (!searchPattern) {
						return;
					}
					var searchFloat = editorContainer._searchFloat;
					searchFloat.onclick = function() {
						searchFloat.style.display = "none";
					};
					// TEMPORARY until we can better scope the search
					var extensionFilter = "";
					var fileName = editorContainer.getTitle();
					
					dojo.place(document.createTextNode("Searching for occurrences of "), searchFloat, "last");
					var b = dojo.create("b", null, searchFloat, "last");
					dojo.place(document.createTextNode("\"" + searchPattern + "\""), b, "only");
					
					if (fileName) {
						var splits = fileName.split(".");
						if (splits.length > 0) {
							var extension = splits.pop().toLowerCase();
							extensionFilter = "+Name:*." + extension + "+";
							
							dojo.place(document.createTextNode(" in *."), searchFloat, "last");
							dojo.place(document.createTextNode(extension), searchFloat, "last");
						}
					}
					dojo.place(document.createTextNode("..."), searchFloat, "last");
					
					searchFloat.style.display = "block";
					var query = editorContainer.getFileMetadata().SearchLocation + searchPattern + extensionFilter;
					editorContainer._searcher.search(searchFloat, query, fileURI);
				}, 0);
			});
			
			// Go To Line action
			editor.setKeyBinding(new KeyBinding("l", true), "goto-line");
			editor.setAction("goto-line", function() {
					var line = editor.getModel().getLineAtOffset(editor.getCaretOffset());
					line = prompt("Go to line:", line + 1);
					if (line) {
						line = parseInt(line, 10);
						editorContainer.onGotoLine(line-1, 0);
					}
					return true;
			});
						
			var isMac = navigator.platform.indexOf("Mac") !== -1;
			
			// Content assist
			editor.setKeyBinding(isMac ? new KeyBinding(' ', false, false, false, true) : new KeyBinding(' ', true), "content assist");
			editor.setAction("content assist", function() {
				editorContainer._showContentAssist(true);
				return true;
			});
			
			/**@this {eclipse.EditorContainer} */
			function updateCursorStatus() {
				var model = editor.getModel();
				var caretOffset = editor.getCaretOffset();
				var lineIndex = model.getLineAtOffset(caretOffset);
				var lineStart = model.getLineStart(lineIndex);
				var offsetInLine = caretOffset - lineStart;
				if (!editorContainer._incrementalFindMode) {
					this._serviceRegistry.getService("IStatusReporter").then(function(service) {
						service.setMessage("Line " + (lineIndex + 1) + " : Col " + offsetInLine);	
					});
				}
			}
			
			// Listener for dirty state
			editor.addEventListener("ModelChanged", this, this.checkDirty);
					
			//Adding selection changed listener
			editor.addEventListener("Selection", this, updateCursorStatus);
			
			// Create rulers
			this._annotationsRuler = this._annotationRulerFactory();
			this._annotationsRuler.onClick = function(lineIndex, e) {
				if (lineIndex === undefined) { return; }
				if (lineIndex === -1) { return; }
				var annotation = this.getAnnotation(lineIndex);
				if (annotation === undefined) { return; }
				editorContainer.onGotoLine(annotation.line, annotation.column);
			};
			
			this._lineNumberRuler = this._lineNumberRulerFactory();
			
			this._overviewRuler = this._overviewRulerFactory();
			this._overviewRuler.onClick = function(lineIndex, e) {
				if (lineIndex === undefined) { return; }
				editorContainer.moveSelection(this._editor, this._editor.getModel().getLineStart(lineIndex));
			};
			
			editor.addRuler(this._annotationsRuler);
			editor.addRuler(this._lineNumberRuler);
			editor.addRuler(this._overviewRuler);
		},
		
		showSelection : function(start, end, line, offset, length) {
			// We use typeof because we need to distinguish the number 0 from an undefined or null parameter
			if (typeof(start) === "number") {
				if (typeof(end) !== "number") {
					end = start;
				}
				this.moveSelection(this._editor, start, end);
			} else if (typeof(line) === "number") {
				var pos = this._editor.getModel().getLineStart(line-1);
				if (typeof(offset) === "number") {
					pos = pos + offset;
				}
				if (typeof(length) !== "number") {
					length = 0;
				}
				this.moveSelection(this._editor, pos, pos+length);
			}
		},
		setInput : function(location) {
			var input = eclipse.util.getPositionInfo(location);
			var fileURI = input.filePath;
			this._fileURI = fileURI;
			// populate editor
			if (fileURI) {
				if (fileURI === this._lastFilePath) {
					this.showSelection(input.start, input.end, input.line, input.offset, input.length);
				} else {
					if (!this._editor) {
						this.installEditor(fileURI);
					}
					var fullPathName = fileURI;
					this.onInputChange(fullPathName, "Fetching " + fullPathName, null);
					this._fileClient.read(fileURI).then(
						dojo.hitch(this, function(contents) {
							this.onInputChange(fileURI, null, contents);
							this.showSelection(input.start, input.end, input.line, input.offset, input.length);
						}),
						dojo.hitch(this, function(error) {
							this.onInputChange(fullPathName, "An error occurred: " + error.message, null);
							console.error("HTTP status code: ", error.status);
						})
					);
					this._fileClient.read(fileURI, true).then(
						dojo.hitch(this, function(metadata) {
							this.setFileMetadata(metadata);
							this.setTitle(metadata.Location);
						}),
						dojo.hitch(this, function(error) {
							console.error("Error loading file metadata: " + error.message);
							this.setTitle(fileURI);
						})
					);
				}
				this._lastFilePath = fileURI;
			} else {
				this.onInputChange("No File Selected", "", null);
			}
		},
		
		onInputChange : function (title, message, contents, contentsSaved) {
			if (contentsSaved && this._editor) {
				// don't reset undo stack on save, just mark it clean so that we don't lose the undo past the save
				this._undoStack.markClean();
				this.checkDirty();
				return;
			}
			if (this._editor) {
				this.setTitle(title);
				if (message) {
					this._editor.setText(message);
				} else {
					if (this._styler) {
						this._styler.destroy();
						this._styler = null;
					}
					var fileName = title;
					if (fileName) {
						var splits = fileName.split(".");
						if (splits.length > 0) {
							var extension = splits.pop().toLowerCase();
							this._contentAssistKeywords = [];
							switch(extension) {
								case "js":
									this.styler = new eclipse.TextStyler(this._editor, "js");
									break;
								case "java":
									this.styler = new eclipse.TextStyler(this._editor, "java");
									break;
								case "html":
									//TODO
									break;
								case "xml":
									//TODO
									break;
								case "css":
									// sorry for hard-coding it here, this is temporary and only for testing content assist
									this._contentAssistKeywords = ["color", "text-align", "text-indent", "text-decoration", 
										 "font", "font-style", "font-family", "font-weight", "font-size", "font-variant", "line-height",
										 "background", "background-color", "background-image", "background-position", "background-repeat", "background-attachment",
										 "list-style", "list-style-image", "list-style-position", "list-style-type", 
										 "outline", "outline-color", "outline-style", "outline-width",
										 "border", "border-left", "border-top", "border-bottom", "border-right", "border-color", "border-width", "border-style",
										 "border-bottom-color", "border-bottom-style", "border-bottom-width",
										 "border-left-color", "border-left-style", "border-left-width",
										 "border-top-color", "border-top-style", "border-top-width",
										 "border-right-color", "border-right-style", "border-right-width",
										 "padding", "padding-left", "padding-top", "padding-bottom", "padding-right",
										 "margin", "margin-left", "margin-top", "margin-bottom", "margin-right",
										 "width", "height", "left", "top", "right", "bottom",
										 "min-width", "max-width", "min-height", "max-height",
										 "display", "visibility",
										 "clip", "cursor", "overflow", "overflow-x", "overflow-y", "position", "z-index",
										 "vertical-align", "horizontal-align",
										 "float", "clear"
										];
									this.styler = new eclipse.TextStyler(this._editor, "css");
									break;
							}
						}
					}
					if (contents !== null && contents !== undefined) {
						this._editor.setText(contents);
					}
				}
				this._undoStack.reset();
				this.checkDirty();
				this._editor.focus();
			}
		},
		
		setFileMetadata : function(metadata) {
			this._fileMetadata = metadata;
		},
		
		getFileMetadata : function() {
			return this._fileMetadata;
		},
		
		onGotoLine : function (line, column, end) {
			if (this._editor) {
				var lineStart = this._editor.getModel().getLineStart(line);
				if (typeof column === "string") {
					var index = this._editor.getModel().getLine(line).indexOf(column);
					if (index !== -1) {
						end = index + column.length;
						column = index;
					} else {
						column = 0;
					}
				}
				var col = Math.min(this._editor.getModel().getLineEnd(line), column);
				if (end===undefined) {
					end = col;
				}
				var offset = lineStart + col;
				this.moveSelection(this._editor, offset, lineStart + end);
			}
		}
	};
	return EditorContainer;
}());