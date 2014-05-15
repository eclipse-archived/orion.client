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
	'orion/editor/editor',
	'orion/editor/textStyler',
	'orion/editor/util',
	'orion/objects',
	'orion/webui/littlelib',
	'orion/URITemplate',
	'orion/webui/splitter', 
	'orion/URL-shim'
], function(marked, mEditor, mTextStyler, mTextUtil, objects, lib, URITemplate, mSplitter) {

	var uriTemplate = new URITemplate("#{,resource,params*}"); //$NON-NLS-0$
	var extensionRegex = /\.([0-9a-z]+)(?:[\?#]|$)/i;
	var imgCount = 0;

	var ID_PREVIEW = "_previewDiv"; //$NON-NLS-0$

	var MarkdownStylingAdapter = function(model, resource, fileClient) {
		this.model = model;

		/* relativize marked's outputLink */
		var outputLink = marked.InlineLexer.prototype.outputLink;
		var resourceURL = new URL(resource, window.location.href);
		marked.InlineLexer.prototype.outputLink = filterOutputLink(outputLink, resourceURL, fileClient, resource.indexOf(":") === -1); //$NON-NLS-0$

		this._markedOptions = marked.parse.defaults;
		this._markedOptions.sanitize = true;
		this._markedOptions.tables = true;

		this._inlinePatterns = [];
		var patternIndex = 0;
		var keys = Object.keys(marked.InlineLexer.rules.gfm);
		keys.forEach(function(current) {
			if (current.indexOf("_") !== 0) { //$NON-NLS-0$
				var regex = marked.InlineLexer.rules.gfm[current];
				if (regex.source) {
					var source = regex.source.substring(1).replace(/\|\^/g, "|"); /* adjust uses of '^' */ //$NON-NLS-0$
					source = source.replace(/[ ]\{2,\}/g, "(\\t| {2,})"); /* adjust assumption of tabs having been replaced by spaces */ //$NON-NLS-0$
					this._inlinePatterns.push({regex: new RegExp(source, "g"), name: current, index: patternIndex++}); //$NON-NLS-0$
				}
			}
		}.bind(this));

		this._blockquoteStartRegex = /[ ]*>/g;
		this._blockquoteRegex = /(?:[ \\t]*>[^\r\n]+(?:\r?\n[ \\t]*\S[^\r\n]*)*(?:\r?\n)*)+/g; /* based on marked.Lexer.rules.normal.blockquote */
		this._listRegex = /([ \t]*)(?:[*+-]|\d+\.)[ \t][\s\S]+?(?:([ \t]*[-*_]){3,}[ \t]*(?:(\r?\n)+|$)|(\s*\r?\n){2,}(?![ \t])(?!\1(?:[*+-]|\d+\.)[ \t])(\r?\n)*|\s*$)/g; /* based on marked.Lexer.rules.normal.list */
	};
	
	MarkdownStylingAdapter.prototype = {
		blockSpansBeyondEnd: function(/*block*/) {
			return false;
		},
		computeBlocks: function(model, text, block, offset/*, startIndex, endIndex, maxBlockCount*/) {
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

				if (tokens[i].type === "heading") { //$NON-NLS-0$
					var isSetext = text[index] !== "#"; //$NON-NLS-0$
					var lineEnd = this._getLineEnd(text, index);
					end = isSetext ? this._getLineEnd(text, index, 1) : lineEnd;
					bounds = {
						start: index,
						contentStart: index + (isSetext ? 0 : tokens[i].depth + 1),
						contentEnd: lineEnd,
						end: end
					};
					name = "markup.heading.markdown"; //$NON-NLS-0$
					index = end;
				} else if (tokens[i].type === "paragraph") { //$NON-NLS-0$
					var newlineCount = 0;

					/*
					 * marked's sanitizing of html produces paragraph tokens with trailing newline
					 * characters, which is inconsistent with normal paragraph tokens. If this paragraph
					 * is detected to be sanitized html (check for a 'pre' property) then do not consider
					 * trailing newline characters when computing the end bound.
					 */
					if (tokens[i].pre !== undefined) {
						var lastIndex = 0;
						while (true) {
							this._htmlNewlineRegex.lastIndex = lastIndex;
							var match = this._htmlNewlineRegex.exec(tokens[i].text);
							if (match) {
								newlineCount++;
								lastIndex = match.index + 1;
							} else {
								break;
							}
						}
					} else {
						match = tokens[i].text.match(this._newlineRegex);
						if (match) {
							newlineCount = match.length;
						}
					}

					end = this._getLineEnd(text, index, newlineCount, true);
					bounds = {
						start: index,
						contentStart: index,
						contentEnd: end,
						end: end
					};
					name = "markup.other.paragraph.markdown"; //$NON-NLS-0$
					index = end;
				} else if (tokens[i].type === "blockquote_start" || tokens[i].type === "list_start") { //$NON-NLS-1$ //$NON-NLS-0$
					/*
					 * The source ranges for blockquotes and lists cannot be reliably computed solely
					 * from their generated tokens because it is possible for inputs with varying line
					 * counts to produce identical token sets.  To handle this, use marked's regex's
					 * to compute the bounds for these elements.  The tokens that are internal to
					 * these elements are skipped over because the styler does not style blocks within
					 * blocks differently (eg.- blockquotes within lists).
					 */

					var startRegex, endRegex, endToken;
					if (tokens[i].type === "blockquote_start") { //$NON-NLS-0$
						startRegex = this._blockquoteStartRegex;
						endRegex = this._blockquoteRegex;
						endToken = "blockquote_end"; //$NON-NLS-0$
						name = "markup.quote.markdown"; //$NON-NLS-0$
					} else {
						startRegex = marked.Lexer.rules.normal.bullet;
						endRegex = this._listRegex;
						endToken = "list_end"; //$NON-NLS-0$
						name = tokens[i].ordered ? "markup.list.numbered.markdown" : "markup.list.unnumbered.markdown"; //$NON-NLS-1$ //$NON-NLS-0$
					}

					/*
					 * Skip through tokens that are internal to the element.  Note that these tokens can stack
					 * (eg.- a list within a list) so must be sure to find the _matching_ end token.
					 */
					var j = i;
					var stack = 0;
					while (true) {
						if (tokens[j++].type === tokens[i].type) {
							stack++; /* a start token */
						} else if (tokens[j].type === endToken) {
							if (!--stack) {
								break;
							}
						}
					}

					/* compute the block's contentStart bound */
					startRegex.lastIndex = index;
					match = startRegex.exec(text);
					var contentStart = index + match[0].length;

					/* compute the block's end bound */
					endRegex.lastIndex = index;
					match = endRegex.exec(text);
					end = index + match[0].length;

					/* trim trailing blank lines from the end bound */
					this._emptyLineRegex.lastIndex = 0;
					match = this._emptyLineRegex.exec(match[0]);
					if (match) {
						end -= match[0].length;
					}
					
					bounds = {
						start: index,
						contentStart: contentStart,
						contentEnd: end,
						end: end
					};
					i = j;
					index = end;
				} else if (tokens[i].type === "code") { //$NON-NLS-0$
					var start;
					/*
					 * gfm fenced code blocks can be differentiated from markdown code blocks by the
					 * presence of a "lang" property.
					 */
					if (tokens[i].hasOwnProperty("lang")) { //$NON-NLS-0$
						// TODO create a block and syntax style it if a supported lang is provided
						start = index;
						newlines = tokens[i].text.match(this._newlineRegex);
						end = this._getLineEnd(text, index, 2 + (newlines ? newlines.length : 0));
						name = "markup.raw.code.fenced.gfm"; //$NON-NLS-0$
					} else {
						start = this._getLineStart(text, index); /* backtrack to start of line */
						newlines = tokens[i].text.match(this._newlineRegex);
						end = this._getLineEnd(text, index, newlines ? newlines.length : 0);
						name = "markup.raw.code.markdown"; //$NON-NLS-0$
					}

					bounds = {
						start: start,
						contentStart: index,
						contentEnd: end,
						end: end
					};
					index = end;
				} else if (tokens[i].type === "hr") { //$NON-NLS-0$
					end = this._getLineEnd(text, index);
					bounds = {
						start: index,
						contentStart: index,
						contentEnd: end,
						end: end
					};
					name = "markup.other.separator.markdown"; //$NON-NLS-0$ 
					index = end;
				} else if (tokens[i].type === "table") { //$NON-NLS-0$
					end = this._getLineEnd(text, index, tokens[i].cells.length + 1);
					bounds = {
						start: index,
						contentStart: index,
						contentEnd: end,
						end: end
					};
					name = "markup.other.table.gfm"; //$NON-NLS-0$
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
		initialPopulatePreview: function() {
			/* hack, see the explaination in MarkdownEditor.initSourceEditor() */
			var rootBlock = this._styler.getRootBlock();
			this._onBlocksChanged({old: [], new: rootBlock.getBlocks()});
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
				if (current.pattern.name.indexOf("link") !== -1) { //$NON-NLS-0$
					name = "markup.underline.link.markdown"; //$NON-NLS-0$
				} else if (current.pattern.name === "strong") { //$NON-NLS-0$
					name = "markup.bold.markdown"; //$NON-NLS-0$
				} else if (current.pattern.name === "em") { //$NON-NLS-0$
					name = "markup.italic.markdown"; //$NON-NLS-0$
				} else if (current.pattern.name === "code") { //$NON-NLS-0$
					name = "markup.raw.code.markdown"; //$NON-NLS-0$
				} else if (current.pattern.name === "br") { //$NON-NLS-0$
					name = "markup.other.br.markdown"; //$NON-NLS-0$
					// TODO adjust start
				} else if (current.pattern.name === "del") { //$NON-NLS-0$
					name = "markup.other.strikethrough.gfm"; //$NON-NLS-0$
				}
				if (name) {
					_styles.push({start: offset + start, end: offset + index, style: name, mergeable: true});
				}
				this._updateMatch(current, text, matches, index);
			}
		},
		setStyler: function(styler) {
			if (this._styler) {
				this._styler.removeEventListener("BlocksChanged", this._onBlocksChanged); //$NON-NLS-0$
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
		_getLineEnd: function(text, index, lineSkip, include) {
			lineSkip = lineSkip || 0;
			while (true) {
				this._eolRegex.lastIndex = index;
				var result = this._eolRegex.exec(text);
				if (!result) {
					return text.length;
				}
				if (!lineSkip--) {
					return result.index + (include ? result[0].length : 0);
				}
				index = result.index + 2;
			}
		},
		_onBlocksChanged: function(e) {
			/*
			 * If a change was made within a block then a new Block was likely not created
			 * in response (instead its bounds were simply adjusted).  As a result the marked
			 * token will now be stale.  Detect this case and update the token here.
			 */
			if (e.old.length === 1 && e.new.length === 1 && e.old.elementId === e.new.elementId) {
				/*
				 * A change in the root block only occurs when whitespace beyond the last block is
				 * added/deleted, because the marked lexer groups all other whitespace occurrences
				 * into adjacent blocks.  If this is a change in the root block then just return,
				 * there's nothing to do here.
				 */
				if (!e.new[0].parent) {
					return;
				}

				var newTokens = marked.lexer(this.model.getText(e.old[0].start, e.old[0].end), this._markedOptions);
				newTokens.links = e.old[0].tokens.links;
				e.new[0].tokens = newTokens;
			}

			var elements = [];
			e.old.forEach(function(current) {
				elements.push(document.getElementById(current.elementId));
			});

			if (e.old.length < e.new.length) {
				/* replacing a set of blocks with a larger set of blocks */
				var parentElement, nextElement;
				if (elements.length) {
					parentElement = elements[0].parentNode;
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
					parentElement = document.getElementById(ID_PREVIEW);
				}
				while (elements.length < e.new.length) {
					var newElement = document.createElement("div"); //$NON-NLS-0$
					elements.push(newElement);
					if (nextElement) {
						parentElement.insertBefore(newElement, nextElement);
					} else {
						parentElement.appendChild(newElement);
					}
				}
			} else if (e.new.length < elements.length) {
				/* replacing a set of blocks with a smaller set of blocks */
				parentElement = elements[0].parentNode;
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
			}.bind(this));
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
		_emptyLineRegex: /(\r?\n)*$/g,
		_eolRegex: /$/gm,
		_htmlNewlineRegex: /\n\s*\S[\s\S]*$/g,
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
						/*
						 * TODO: should not need to remove the URL hash to create a link that opens in the markdown editor
						 * 
						 * eg.- http://...,editor=orion.editor.markdown#hash works fine, but uriTemplate generates 
						 * http://...#hash,editor=orion.editor.markdown for this, which does not work.  Since the
						 * markdown editor does not currently acknowledge hashes, removing it here does not hurt anything.
						 * However if the editor began opening to hashes then this would be removing a valuable piece
						 * of the URL.  Need to determine if uriTemplate is creating an invalid URL, or if the editor
						 * opener that looks at the URL is handling this case incorrectly.
						 */
						linkURL.hash = "";
						link.href = uriTemplate.expand({
							resource: linkURL.href,
							params: "editor=orion.editor.markdown" //$NON-NLS-0$
						});
					} else {
						if (fileClient.readBlob) {
							var id = "_md_img_" + imgCount++; //$NON-NLS-0$
							fileClient.readBlob(linkURL.href).then(function(bytes) {
								var extensionMatch = linkURL.href.match(extensionRegex);
								var mimeType = extensionMatch ? "image/" +extensionMatch[1] : "image/png"; //$NON-NLS-1$ //$NON-NLS-0$
								var objectURL = URL.createObjectURL(new Blob([bytes], {type: mimeType}));
								document.getElementById(id).src = objectURL;
								URL.revokeObjectURL(objectURL);
							});
							return "<img id='" + id + "' src=''>";	//$NON-NLS-1$ //$NON-NLS-0$			
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

	var BaseEditor = mEditor.BaseEditor;
	function MarkdownEditor(options) {
		this.id = "orion.editor.markdown"; //$NON-NLS-0$
		this._fileService = options.fileService;
		this._metadata = options.metadata;
		this._parent = options.parent;
		this._model = options.model;
		this._editorView = options.editorView;

		this._scrollListener = function(e) {
			var textView = this._editorView.editor.getTextView();

			var block;
			if (!e.newValue.y) {
				/* the editor is at the top so ensure that preview is at the top as well */
				var rootBlock = this._styler.getRootBlock();
				var blocks = rootBlock.getBlocks();
				if (blocks.length) {
					block = blocks[0];
				}
			} else {
				var charIndex = textView.getOffsetAtLocation(0, Math.floor(e.newValue.y + (this._previewDiv.clientHeight / 2)));
				block = this._styler.getBlockAtIndex(charIndex);
			}

			if (block) {
				var element = document.getElementById(block.elementId);
				if (element) {
					var newTop = Math.max(0, Math.ceil(element.offsetTop - (this._previewDiv.clientHeight - element.offsetHeight) / 2));
					this._previewDiv.scrollTop = newTop;
				}
			}
		}.bind(this);

		this._resizeListener = function(/*e*/) {
			this._editorView.editor.resize();
		}.bind(this);

		BaseEditor.apply(this, arguments);
	}

	MarkdownEditor.prototype = Object.create(BaseEditor.prototype);
	objects.mixin(MarkdownEditor.prototype, /** @lends orion.edit.MarkdownEditor.prototype */ {
		initSourceEditor: function() {
			var editor = this._editorView.editor;
			var textView = editor.getTextView();
			var annotationModel = editor.getAnnotationModel();
			var stylerAdapter = new MarkdownStylingAdapter(this._model, this._metadata.Location, this._fileService);
			this._styler = new mTextStyler.TextStyler(textView, annotationModel, stylerAdapter);

			this._editorView.editor.getTextView().addEventListener("Scroll", this._scrollListener); //$NON-NLS-0$
			this._splitter.addEventListener("resize", this._resizeListener); //$NON-NLS-0$

			/*
			 * If the model already has content then it is being shared with a previous
			 * editor that was open on the same resource.  In this case this editor's
			 * styler adapter must be expicitly requested to initially populate its
			 * preview pane because there will not be a #setInput() invocation or model
			 * change event to trigger it.
			 */
			if (this._model.getCharCount()) {
				stylerAdapter.initialPopulatePreview();
			}
		},
		install: function() {
			this._parent.style.overflow = "hidden"; //$NON-NLS-0$

			var rootDiv = document.createElement("div"); //$NON-NLS-0$
			rootDiv.style.position = "absolute"; //$NON-NLS-0$
			rootDiv.style.width = "100%"; //$NON-NLS-0$
			rootDiv.style.height = "100%"; //$NON-NLS-0$
			this._parent.appendChild(rootDiv);

			var editorDiv = document.createElement("div"); //$NON-NLS-0$
			editorDiv.style.position = "absolute"; //$NON-NLS-0$
			editorDiv.className = "sidePanelLayout hasSplit"; //$NON-NLS-0$
			editorDiv.style.width = "100%"; //$NON-NLS-0$
			editorDiv.style.height = "100%"; //$NON-NLS-0$
			rootDiv.appendChild(editorDiv);	
			this._editorView.setParent(editorDiv);

			var splitterDiv = document.createElement("div"); //$NON-NLS-0$
			splitterDiv.className = "split splitLayout"; //$NON-NLS-0$
			splitterDiv.style.left = "50%";
			splitterDiv.id = "orion.markdown.editor.splitter";
			rootDiv.appendChild(splitterDiv);			

			this._previewDiv = document.createElement("div"); //$NON-NLS-0$
			this._previewDiv.className = "mainPanelLayout hasSplit"; //$NON-NLS-0$
			this._previewDiv.id = ID_PREVIEW; //$NON-NLS-0$
			this._previewDiv.style.position = "absolute"; //$NON-NLS-0$
			this._previewDiv.style.height = "100%"; //$NON-NLS-0$
			this._previewDiv.style.overflowX = "hidden"; //$NON-NLS-0$
			this._previewDiv.style.overflowY = "auto"; //$NON-NLS-0$
			this._previewDiv.classList.add("orionMarkdown"); //$NON-NLS-0$
			rootDiv.appendChild(this._previewDiv);

			this._splitter = new mSplitter.Splitter({
				node: splitterDiv,
				sidePanel: editorDiv,
				mainPanel: this._previewDiv
			}); 

			BaseEditor.prototype.install.call(this);
		},
		uninstall: function() {
			this._styler.destroy();
			var textView = this._editorView.editor.getTextView();
			textView.removeEventListener("Scroll", this._scrollListener); //$NON-NLS-0$
			this._splitter.removeEventListener("resize", this._resizeListener); //$NON-NLS-0$
			lib.empty(this._parent);
			BaseEditor.prototype.uninstall.call(this);
		}
	});

	function MarkdownEditorView(options) {
		this._options = options;
	}
	MarkdownEditorView.prototype = {
		create: function() {
			this.editor = new MarkdownEditor(this._options);
			this.editor.install();
			this._options.editorView.create();
			this.editor.initSourceEditor();
		},
		destroy: function() {
			this.editor.destroy();
			this.editor = null;
			this._options.editorView.destroy();
			this._options.editorView = null;
		}
	};

	return {
		MarkdownEditorView: MarkdownEditorView
	};
});
