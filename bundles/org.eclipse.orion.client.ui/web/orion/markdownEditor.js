/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define document window URL console Blob*/
define([
	'marked/marked',
	'orion/editor/textView',
	'orion/editor/editor',
	'orion/editor/editorFeatures',
	'orion/editor/projectionTextModel',
	'orion/editor/textStyler',
	'orion/objects',
	'orion/webui/littlelib',
	'orion/URITemplate',
	'orion/section', 
	'orion/webui/splitter', 
	'orion/URL-shim'
], function(marked, mTextView, mEditor, mEditorFeatures, mProjectionModel, mTextStyler, objects, lib, URITemplate, mSection, mSplitter) {

	var uriTemplate = new URITemplate("#{,resource,params*}"); //$NON-NLS-0$
	var extensionRegex = /\.([0-9a-z]+)(?:[\?#]|$)/i;
	var imgCount = 0;

	var MarkdownStylingAdapter = function() {
		this._markedOptions = marked.parse.defaults;
		this._markedOptions.sanitize = true;

		this._inlinePatterns = [];
		var patternIndex = 0;
		var keys = Object.keys(marked.InlineLexer.rules.normal);
		keys.forEach(function(current) {
			if (current.indexOf("_") !== 0) {
				var regex = marked.InlineLexer.rules.normal[current];
				if (regex.source) {
					var source = regex.source.substring(1).replace(/\|\^/g, "|"); /* adjust uses of '^' */
					source = source.replace(/[ ]\{2,\}/g, "(\\t| {2,})"); /* adjust assumption of tabs having been replaced by spaces */
					this._inlinePatterns.push({regex: new RegExp(source, "g"), name: current, index: patternIndex++});
				}
			}
		}.bind(this));
	};
	
	MarkdownStylingAdapter.prototype = {
		blockSpansBeyondEnd: function(block) {
			return false;
		},
		computeBlocks: function(model, text, block, offset, startIndex, endIndex, maxBlockCount) {
			var index = 0;
			var result = [];
			if (block.typeId) {
				/* nested blocks do not get different styling, so nothing to do here */
				return result;
			}

			var bounds, name, end, newlines;			
			var tokens = marked.lexer(text, this.markedOptions);
			for (var i = 0; i < tokens.length; i++) {
				var startTokenIndex = i;
				name = null;
				this._whitespaceRegex.lastIndex = index;
				var whitespaceResult = this._whitespaceRegex.exec(text);
				if (whitespaceResult && whitespaceResult.index === index) {
					index += whitespaceResult[0].length;
				}

				if (tokens[i].type === "heading") {
					var isSetext = tokens[i].detail.style === "Setext";
					var lineEnd = this._getLineEnd(text, index);
					end = isSetext ? this._getLineEnd(text, index, 1) : lineEnd;
					bounds = {
						start: index,
						contentStart: index + (isSetext ? 0 : tokens[i].depth + 1),
						contentEnd: lineEnd,
						end: end
					};
					name = "markup.heading.markdown";
					index = end;
				} else if (tokens[i].type === "paragraph") {
					newlines = tokens[i].text.match(this._newlineRegex);
					end = this._getLineEnd(text, index, newlines ? newlines.length : 0);
					bounds = {
						start: index,
						contentStart: index,
						contentEnd: end,
						end: end
					};
					name = "markup.other.paragraph.markdown";
					index = end;
				} else if (tokens[i].type === "list_start") {
					// TODO use an approach similar to blockquotes to compute the end
					var endLineIndex = 0;
					var j = i;
					while (tokens[++j].type !== "list_end") {
						if (tokens[j].type === "text") {
							this._newlineRegex.lastIndex = 0;
							newlines = tokens[j].text.match(this._newlineRegex);
							endLineIndex += 1 + (newlines ? newlines.length : 0);
						}
					}
					var listStartRegex = tokens[i].ordered ? this._orderedListRegex : this._unorderedListRegex;
					listStartRegex.lastIndex = index;
					var listStartResult = listStartRegex.exec(text);
					end = this._getLineEnd(text, index, endLineIndex);
					bounds = {
						start: index,
						contentStart: index + listStartResult[0].length,
						contentEnd: end,
						end: end
					};
					name = tokens[i].ordered ? "markup.list.numbered.markdown" : "markup.list.unnumbered.markdown";
					i = j;
					index = end;
				} else if (tokens[i].type === "blockquote_start") {
					endLineIndex = 0;
					j = i;
					while (tokens[++j].type !== "blockquote_end") {
						endLineIndex++;
					}

					// TODO: for now just use marked's regex to re-compute the block's bounds
					
					var regexString = marked.Lexer.rules.normal.blockquote.source;
					var regex = new RegExp(regexString.substring(1), "g");
					regex.lastIndex = index;
					var match = regex.exec(text);
					end = match.index + match[0].length;
					
					bounds = {
						start: match.index,
						contentStart: match.index,
						contentEnd: end,
						end: end
					};
					name = "markup.quote.markdown";
					i = j;
					index = end;
				} else if (tokens[i].type === "code") {
					var start = this._getLineStart(text, index); /* backtrack to start of line */
					newlines = tokens[i].text.match(this._newlineRegex);
					end = this._getLineEnd(text, index, newlines ? newlines.length : 0);
					bounds = {
						start: start,
						contentStart: index,
						contentEnd: end,
						end: end
					};
					name = "markup.raw.code.markdown";
					index = end;
				} else if (tokens[i].type === "hr") {
					end = this._getLineEnd(text, index);
					bounds = {
						start: index,
						contentStart: index,
						contentEnd: end,
						end: end
					};
					name = "markup.other.separator.markdown";
					index = end;
				}
				
				if (name) {
					bounds.start += offset;
					bounds.contentStart += offset;
					bounds.contentEnd += offset;
					bounds.end += offset;
					var newBlock = this.createBlock(bounds, this._styler, model, block, name);
					newBlock.tokens = tokens.slice(startTokenIndex, i + 1);
					newBlock.tokens.links = tokens.links;
					newBlock.elementId = "orionMDBlock" + this._elementCounter++;
					result.push(newBlock);
				}
			}

			return result;
		},
		computeStyle: function(/*block, model, offset*/) {
			return null;
		},
		createBlock: function(bounds, styler, model, parent, data) {
			return new mTextStyler.Block(bounds, data, data, styler, model, parent, null);
		},
		getBlockContentStyleName: function(block) {
			return block.name;
		},
		getBlockEndStyle: function(/*block, text, endIndex, _styles*/) {
			return null;
		},
		getBlockStartStyle: function(/*block, text, index, _styles*/) {
			return null;
		},
		getBracketMatch: function(/*block, text*/) {
			return null;
		},
		parse: function(text, offset, block, _styles /*, ignoreCaptures*/) {
			if (!block.typeId) {
				return;
			}

			var matches = [];
			this._inlinePatterns.forEach(function(current) {
				current.regex.lastIndex = 0;
				var result = current.regex.exec(text);
				if (result) {
					matches.push({result: result, pattern: current});
				}
			}.bind(this));
			matches.sort(function(a,b) {
				if (a.result.index < b.result.index) {
					return -1;
				}
				if (a.result.index > b.result.index) {
					return 1;
				}
				return a.pattern.index < b.pattern.index ? -1 : 1;
			});

			var index = 0;
			while (matches.length > 0) {
				var current = matches[0];
				matches.splice(0,1);
				if (current.result.index < index) {
					/* processing of another match has moved index beyond this match */
					this._updateMatch(current, text, matches, index);
					continue;
				}
				var start = current.result.index;
				index = start + current.result[0].length;
				var name = null;
				if (current.pattern.name.indexOf("link") !== -1) {
					name = "markup.underline.link.markdown";
				} else if (current.pattern.name === "strong") {
					name = "markup.bold.markdown";
				} else if (current.pattern.name === "em") {
					name = "markup.italic.markdown";
				} else if (current.pattern.name === "code") {
					name = "markup.raw.code.markdown";
				} else if (current.pattern.name === "br") {
					name = "markup.other.br.markdown";
					// TODO adjust start
				}
				if (name) {
					_styles.push({start: offset + start, end: offset + index, style: name, mergeable: true});
				}
				this._updateMatch(current, text, matches, index);
			}
		},
		setStyler: function(styler) {
			if (this._styler) {
				this._styler.removeEventListener("BlocksChanged", this._onBlocksChanged);
			}
			this._styler = styler;
			styler.addEventListener("BlocksChanged", this._onBlocksChanged.bind(this)); //$NON-NLS-0$
		},
		setView: function(view) {
			this._view = view;
		},
		verifyBlock: function(baseModel, text, block, changeCount) {
			var blocks = this.computeBlocks(baseModel, text, block.parent, block.start);
			return blocks.length === 1 && blocks[0].start === block.start && blocks[0].end === block.end + changeCount && blocks[0].typeId === block.typeId;
		},

		/** @private */
		_getLineStart: function(text, index) {
			while (0 <= --index) {
				var char = text.charAt(index);
				if (char === this._NEWLINE || char === this._CR) {
					return index + 1;
				}
			}
			return 0;
		},
		_getLineEnd: function(text, index, lineSkip) {
			lineSkip = lineSkip || 0;
			while (true) {
				this._eolRegex.lastIndex = index;
				var result = this._eolRegex.exec(text);
				if (!result) {
					return text.length;
				}
				if (!lineSkip--) {
					return result.index;
				}
				index = result.index + 1;
			}
		},
		_onBlocksChanged: function(e) {
			/*
			 * If a change was made within a block then a new Block was likely not created
			 * in response (instead its bounds were simply adjusted).  As a result the marked
			 * token will now be stale.  Detect this case and update the token here.
			 */
			if (e.old.length === 1 && e.new.length === 1 && e.old.elementId === e.new.elementId) {
				var newTokens = marked.lexer(this.model.getText(e.old[0].start, e.old[0].end), this._markedOptions);
				newTokens.links = e.old[0].tokens.links;
				e.old[0].tokens = newTokens;
			}

			var elements = [];
			e.old.forEach(function(current) {
				elements.push(document.getElementById(current.elementId));
			});

			if (e.old.length < e.new.length) {
				/* replacing a set of blocks with a larger set of blocks */
				var parentElement, nextElement;
				if (e.old.length) {
					parentElement = document.getElementById(e.old[0].elementId).parentNode;
					var children = parentElement.childNodes;
					var id = elements[elements.length - 1].id;
					for (var i = e.old.length; i < children.length; i++) {
						if (children[i].id === id) {
							if (i + 1 < children.length) {
								/* not the last child in the list */
								nextElement = children[i + 1];
							}
							break;
						}
					}
				} else {
					parentElement = document.getElementById("editorRoot");
				}
				while (elements.length < e.new.length) {
					var newElement = document.createElement("div");
					elements.push(newElement);
					if (nextElement) {
						parentElement.insertBefore(newElement, nextElement);
					} else {
						parentElement.appendChild(newElement);
					}
				}
			} else if (e.new.length < elements.length) {
				/* replacing a set of blocks with a smaller set of blocks */
				parentElement = elements[e.new.length - 1].parentNode;
				for (i = e.new.length; i < elements.length; i++) {
					parentElement.removeChild(elements[i]);
				}
			}

			var index = 0;
			e.new.forEach(function(current) {
				elements[index].id = current.elementId;
				/* must pass a copy of the tokens to marked because it removes them from the array during processing */
				var parseTokens = current.tokens.slice();
				parseTokens.links = current.tokens.links;
				elements[index++].innerHTML = marked.Parser.parse(parseTokens, this._markedOptions);
			});
		},
		_updateMatch: function(match, text, matches, minimumIndex) {
			match.pattern.regex.lastIndex = minimumIndex;
			var result = match.pattern.regex.exec(text);
			if (result) {
				match.result = result;
				for (var i = 0; i < matches.length; i++) {
					if (result.index < matches[i].result.index || (result.index === matches[i].result.index && match.pattern.index < matches[i].pattern.index)) {
						matches.splice(i, 0, match);
						return;
					}
				}
				matches.push(match);
			}
		},
		_CR: "\r", //$NON-NLS-0$
		_NEWLINE: "\n", //$NON-NLS-0$
		_blockquoteRegex: />/g,
		_elementCounter: 0,
		_eolRegex: /$/gm,
		_newlineRegex: /\n/g,
		_orderedListRegex: /\d+\.[ \t]/g,
		_unorderedListRegex: /[*+-][ \t]/g,
		_whitespaceRegex: /\s*/g
	};
	
	function filterOutputLink(outputLink, resourceURL, fileClient, isRelative) {
		return function(cap, link) {
			if (link.href.indexOf(":") === -1) { //$NON-NLS-0$
				
				try {
					var linkURL;
					if (resourceURL.protocol === "filesystem:") { //$NON-NLS-0$
						linkURL = {
							href: "filesystem:" + (new URL(link.href, resourceURL.pathname)).href //$NON-NLS-0$
						};
					} else {
						linkURL = new URL(link.href, resourceURL);
						if (isRelative) {
							linkURL.protocol = "";
							linkURL.host = "";
						}
					}
					if (cap[0][0] !== '!') { //$NON-NLS-0$
						link.href = uriTemplate.expand({
							resource: linkURL.href
						});
					} else {
						if (fileClient.readBlob) {
							var id = "_md_img_" + imgCount++;
							fileClient.readBlob(linkURL.href).then(function(bytes) {
								var extensionMatch = linkURL.href.match(extensionRegex);
								var mimeType = extensionMatch ? "image/" +extensionMatch[1] : "image/png";
								var objectURL = URL.createObjectURL(new Blob([bytes], {type: mimeType}));
								document.getElementById(id).src = objectURL;
								URL.revokeObjectURL(objectURL);
							});
							return "<img id='" + id + "' src=''>";							
						}
						link.href = linkURL.href;
					}
				} catch(e) {
					console.log(e); // best effort
				}				
			}
			return outputLink.call(this, cap, link);
		};
	}

	function createMarked(markdown, resource, fileClient) {
		// relativizing marked's outputLink
		var outputLink = marked.InlineLexer.prototype.outputLink;
		var resourceURL = new URL(resource, window.location.href);
		marked.InlineLexer.prototype.outputLink = filterOutputLink(outputLink, resourceURL, fileClient, resource.indexOf(":") === -1); //$NON-NLS-0$
		var result = marked(markdown, this._markedOptions);
		marked.InlineLexer.prototype.outputLink = outputLink;
		return result;
	}


	function MarkdownView(options) {
		this.fileClient = options.fileClient;
		this.progress = options.progress;
		this.canHide = options.canHide;
		this._node = null;
	}
	MarkdownView.prototype = {
		display: function(node, markdown, resource, fileClient) {
			node.classList.add("orionMarkdown"); //$NON-NLS-0$
			node.innerHTML = createMarked(markdown, resource, fileClient);
		},
		displayContents: function(node, file) {
			var location = file.Location || file;
			lib.empty(node);
			var div = document.createElement("div"); //$NON-NLS-0$
			(this.progress ? this.progress.progress(this.fileClient.read(location), "Reading file " + (file.Name || location)) : this.fileClient.read(location)).then(function(markdown) {
				this.display.bind(this)(div, markdown, location, this.fileClient);
			}.bind(this));
			node.appendChild(div);
		},
		displayInFrame: function(node, file, headerClass, titleClass, defaultTitle) {
			var markdownSection = new mSection.Section(node, {id: "markdownSection", title: file.Name || defaultTitle || "readme", headerClass: headerClass, canHide: this.canHide}); //$NON-NLS-0$
			if(titleClass) {
				var titleNode = markdownSection.getTitleElement();
				if(titleNode) {
					titleNode.classList.add(titleClass);
				}
			}
			this.displayContents.call(this, markdownSection.getContentElement(), file);
		}
	};

	var BaseEditor = mEditor.BaseEditor;
	function MarkdownEditor(options) {
		this.id = "orion.editor.markdown"; //$NON-NLS-0$
		this.fileClient = options.fileClient;
		this.metadata = options.metadata;
		BaseEditor.apply(this, arguments);
	}
		
	MarkdownEditor.prototype = Object.create(BaseEditor.prototype);
	objects.mixin(MarkdownEditor.prototype, /** @lends orion.edit.MarkdownEditor.prototype */ {
		createMarked: function(contents) {
			return createMarked(contents, this.metadata.Location, this.fileClient);
		},
		install: function() {
			var root = this._rootDiv = document.createElement("div"); //$NON-NLS-0$
			root.style.width = "100%"; //$NON-NLS-0$
			root.style.height = "100%"; //$NON-NLS-0$
			root.id = "editorRoot";
			var div = this._contentDiv = document.createElement("div"); //$NON-NLS-0$
			this._contentDiv.id = "_contentDiv";
			div.classList.add("orionMarkdown"); //$NON-NLS-0$
			root.appendChild(div);
			var parent = lib.node(this._domNode);
			parent.appendChild(root);
			this._contentDiv.innerHTML = this.createMarked(this.getModel().getText());
			BaseEditor.prototype.install.call(this);
		},
		setInput: function(title, message, contents, contentsSaved) {
			BaseEditor.prototype.setInput.call(this, title, message, contents, contentsSaved);
			if (!message && !contentsSaved) {
			//GWG	this._contentDiv.innerHTML = this.createMarked(contents);
			}
		},
		uninstall: function() {
			lib.empty(this._domNode);
			BaseEditor.prototype.uninstall.call(this);
		}
	});

	function MarkdownEditorView(options) {
		this._parent = options.parent;
		this.fileClient = options.fileService;
		this.metadata = options.metadata;
		this.serviceRegistry = options.serviceRegistry;
		this.contentTypeRegistry = options.contentTypeRegistry;
		this.commandRegistry = options.commandRegistry;
		this.progress = options.progressService;
		this.model = options.model;
		this.undoStack = options.undoStack;
	}
	MarkdownEditorView.prototype = {
		create: function() {
			this._rootDiv = document.createElement("div"); //$NON-NLS-0$
//			this._rootDiv.style.position = "absolute"; //$NON-NLS-0$
//			this._rootDiv.style.width = "50%"; //$NON-NLS-0$
//			this._rootDiv.style.height = "100%"; //$NON-NLS-0$
			this._rootDiv.id = "editor";
			this._rootDiv.className = "sidePanelLayout hasSplit";
			this._rootDiv.innerHTML = "<b>HI!</b>";
			this._parent.appendChild(this._rootDiv);
			
			this.createSourceEditor(this._rootDiv, this.model);
			
//			mEdit({
//				contentType: "text/x-ruby"
//			});
//			
			
			this._splitterDiv = document.createElement("div"); //$NON-NLS-0$
//			this._splitterDiv.style.position = "absolute"; //$NON-NLS-0$
//			this._rootDiv.style.width = "100%"; //$NON-NLS-0$
//			this._rootDiv.style.height = "100%"; //$NON-NLS-0$
			this._splitterDiv.className = "split splitLayout";
			this._splitterDiv.id = "_splitterDiv";
			this._parent.appendChild(this._splitterDiv);			

			this._previewDiv = document.createElement("div"); //$NON-NLS-0$
//			this._previewDiv.style.backgroundColor = "red";
			this._previewDiv.style.position = "absolute"; //$NON-NLS-0$
			this._previewDiv.style.overflow = "auto"; //$NON-NLS-0$
//			this._previewDiv.style.width = "50%"; //$NON-NLS-0$
			this._previewDiv.style.height = "100%"; //$NON-NLS-0$
//			this._previewDiv.innerHTML = "<b>HI!</b>";
			this._previewDiv.id = "_previewDiv";
			this._previewDiv.className = "mainPaneLayout hasSplit";
			this._parent.appendChild(this._previewDiv);

			this.editor = new MarkdownEditor({
				domNode: this._previewDiv,
				fileClient: this.fileClient,
				metadata: this.metadata,
				model: this.model,
				undoStack: this.undoStack
			});
			this.editor.install();
			
			new mSplitter.Splitter({
				node: this._splitterDiv,
				sidePanel: this._rootDiv,
				mainPanel: this._previewDiv
			});
		},
		destroy: function() {
			if (this.editor) {
				this.editor.destroy();
			}
			this.editor = null;
		},
		createSourceEditor: function(parent, model) {
			var textViewFactory = function() {
				return new mTextView.TextView({
					parent: parent,
					model: new mProjectionModel.ProjectionTextModel(model),
					tabSize: 4, // TODO is this defined anywhere?
//					readonly: options.readonly,
//					fullSelection: options.fullSelection,
//					tabMode: options.tabMode,
//					expandTab: options.expandTab,
//					singleMode: options.singleMode,
//					themeClass: options.themeClass,
//					theme: options.theme,
//					wrapMode: options.wrapMode,
//					wrappable: options.wrappable
				});
			};
			
			var editor = new mEditor.Editor({
				textViewFactory: textViewFactory,
				undoStackFactory: new mEditorFeatures.UndoFactory(),
				annotationFactory: new mEditorFeatures.AnnotationFactory(),
				lineNumberRulerFactory: new mEditorFeatures.LineNumberRulerFactory(),
				foldingRulerFactory: new mEditorFeatures.FoldingRulerFactory(),
				textDNDFactory: new mEditorFeatures.TextDNDFactory(),
//				contentAssistFactory: contentAssistFactory,
				keyBindingFactory: new mEditorFeatures.KeyBindingsFactory(), 
//				statusReporter: options.statusReporter,
				domNode: parent
			});
//			editor.addEventListener("TextViewInstalled", function() { //$NON-NLS-0$
//				var ruler = editor.getLineNumberRuler();
//				if (ruler && options.firstLineIndex !== undefined) {
//					ruler.setFirstLine(options.firstLineIndex);
//				}
//				var sourceCodeActions = editor.getSourceCodeActions();
//				if (sourceCodeActions) {
//					sourceCodeActions.setAutoPairParentheses(options.autoPairParentheses);
//					sourceCodeActions.setAutoPairBraces(options.autoPairBraces);
//					sourceCodeActions.setAutoPairSquareBrackets(options.autoPairSquareBrackets);
//					sourceCodeActions.setAutoPairAngleBrackets(options.autoPairAngleBrackets);
//					sourceCodeActions.setAutoPairQuotations(options.autoPairQuotations);
//					sourceCodeActions.setAutoCompleteComments(options.autoCompleteComments);
//					sourceCodeActions.setSmartIndentation(options.smartIndentation);
//				}
//			});
			
			var contents = this.model.getText(); //"HEYHEYHEY!";//options.contents;
//			if (contents === undefined) {
//				contents = getTextFromElement(parent); 
//			}
			if (!contents) { contents=""; }
			
			editor.installTextView();
//			editor.setLineNumberRulerVisible(options.showLinesRuler === undefined || options.showLinesRuler);
//			editor.setAnnotationRulerVisible(options.showAnnotationRuler === undefined || options.showFoldingRuler);
//			editor.setOverviewRulerVisible(options.showOverviewRuler === undefined || options.showOverviewRuler);
//			editor.setFoldingRulerVisible(options.showFoldingRuler === undefined || options.showFoldingRuler);
			editor.setInput("options.title", null, contents, false, /*options.noFocus*/ false);
			
//			syntaxHighlighter.highlight(options.contentType || options.lang, editor);
			var textView = editor.getTextView();
			var annotationModel = editor.getAnnotationModel();
			var stylerAdapter = new MarkdownStylingAdapter();
			stylerAdapter.model = model;
			this.styler = new mTextStyler.TextStyler(textView, annotationModel, stylerAdapter);

//			if (contentAssist) {
//				var cssContentAssistProvider = new mCSSContentAssist.CssContentAssistProvider();
//				var htmlContentAssistProvider = new mHtmlContentAssist.HTMLContentAssistProvider();
//				contentAssist.addEventListener("Activating", function() { //$NON-NLS-0$
//					if (/css$/.test(options.lang)) {
//						contentAssist.setProviders([cssContentAssistProvider]);
//					} else if (/html$/.test(options.lang)) {
//						contentAssist.setProviders([htmlContentAssistProvider]);
//					}
//				});
//			}
			/*
			 * The minimum height of the editor is 50px. Do not compute size if the editor is not
			 * attached to the DOM or it is display=none.
			 */
//			var window = doc.defaultView || doc.parentWindow;
//			if (!options.noComputeSize && getDisplay(window, doc, parent) !== "none" && getHeight(parent) <= 50) { //$NON-NLS-0$
//				var height = editor.getTextView().computeSize().height;
//				parent.style.height = height + "px"; //$NON-NLS-0$
//			}
			return editor;

		}
	};

	return {
		MarkdownEditorView: MarkdownEditorView,
		MarkdownView: MarkdownView
	};
});
