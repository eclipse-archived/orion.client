/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd, node*/
define("orion/editor/tooltip", [ //$NON-NLS-0$
	'i18n!orion/editor/nls/messages', //$NON-NLS-0$
	'orion/editor/textView', //$NON-NLS-0$
	'orion/editor/projectionTextModel', //$NON-NLS-0$
	'orion/Deferred', //$NON-NLS-0$
	'orion/editor/util', //$NON-NLS-0$
	'orion/PageLinks', //$NON-NLS-0$
	'orion/URITemplate', //$NON-NLS-0$
	'orion/webui/littlelib', //$NON-NLS-0$
	'orion/util' //$NON-NLS-0$
], function(messages, mTextView, mProjectionTextModel, Deferred, textUtil, PageLinks, URITemplate, lib, util) {

	/** @private */
	function Tooltip (view) {
		this._view = view;
		this._create(view.getOptions("parent").ownerDocument); //$NON-NLS-0$
	}
	Tooltip.getTooltip = function(view) {
		if (!view._tooltip) {
			 view._tooltip = new Tooltip(view);
		}
		return view._tooltip;
	};
	Tooltip.prototype = /** @lends orion.editor.Tooltip.prototype */ {
		_create: function(document) {
			if (this._tooltipDiv) { return; }
			var tooltipDiv = this._tooltipDiv = util.createElement(document, "div"); //$NON-NLS-0$
			tooltipDiv.tabIndex = 0;
			tooltipDiv.className = "textviewTooltip"; //$NON-NLS-0$
			tooltipDiv.setAttribute("aria-live", "assertive"); //$NON-NLS-1$ //$NON-NLS-0$
			tooltipDiv.setAttribute("aria-atomic", "true"); //$NON-NLS-1$ //$NON-NLS-0$
			this._tooltipDiv.style.visibility = "hidden"; //$NON-NLS-0$
			var tooltipContents = this._tooltipContents = util.createElement(document, "div"); //$NON-NLS-0$
			tooltipDiv.appendChild(tooltipContents);
			document.body.appendChild(tooltipDiv);
			var self = this;
			textUtil.addEventListener(tooltipDiv, "mouseover", function(event) { //$NON-NLS-0$
				this._inTooltip = true;
			}, false);
			textUtil.addEventListener(tooltipDiv, "mouseout", function(event) { //$NON-NLS-0$
				this.inTooltip = false;
			}, false);
			textUtil.addEventListener(tooltipDiv, "keydown", function(event) { //$NON-NLS-0$
				if (event.keyCode === 27) {
					self.hide();
				}
			}, false);
			this._view.addEventListener("Destroy", function() { //$NON-NLS-0$
				self.destroy();
			});
		},
		_getWindow: function() {
			var document = this._tooltipDiv.ownerDocument;
			return document.defaultView || document.parentWindow;
		},
		destroy: function() {
			if (!this._tooltipDiv) { return; }
			this.hide();
			var parent = this._tooltipDiv.parentNode;
			if (parent) { parent.removeChild(this._tooltipDiv); }
			var document = this._tooltipDiv.ownerDocument;
			textUtil.removeEventListener(document, "mousedown", this._mouseDownHandler, true); //$NON-NLS-0$
			this._tooltipDiv = null;
		},
		_hasFocus: function() {
			var tooltipDiv = this._tooltipDiv;
			if (!tooltipDiv) { return false; }
			var document = tooltipDiv.ownerDocument;
			return textUtil.contains(tooltipDiv, document.activeElement);
		},
		_setContentRange: function(start, end) {
			this._contentRangeStart = start;
			this._contentRangeEnd = end;
			var tv = this._view;
			var curLine = tv.getLineAtOffset(start);
			var endLine = tv.getLineAtOffset(end);
			
			// Adjust start / end to be on the current line if necessary
			if (curLine !== endLine) {
				start = tv.getLineStart(curLine);
				end = tv.getLineEnd(curLine);
			}
			
			var height = tv.getLineHeight(curLine);
			var startPos = tv.getLocationAtOffset(start);
			var endPos = tv.getLocationAtOffset(end);
			
			var viewRect = { x: startPos.x, y: startPos.y, 
								width: endPos.x - startPos.x, height: height};
								
			viewRect = this._view.convert(viewRect, "document", "page");
			this._anchorRect = {left: viewRect.x, top: viewRect.y, 
								width: viewRect.width, height: viewRect.height};
		},
		_isInRect: function(rect, x, y) {
			if (!rect) return false;
			var xOK = x >= rect.left && x <= (rect.left + rect.width);
			var yOK = y >= rect.top && y <= (rect.top + rect.height);
			return xOK && yOK;
		},
		/**
		 * @name hide
		 * @description Hides the current hover popup
		 * @function
		 * @public
		 * @param {int} hideDelay Delay the hide by this many millisecs (defaults to the 'hideDelay' field
		 * of this tooltip)
		*/
		hide: function() {
			if (!this.isVisible()) { return; }
			
			if (this._hasFocus()) {
				this._view.focus();
			}
			if (this._contentsView) {
				this._contentsView.destroy();
				this._contentsView = null;
			}
			if (this._tooltipContents) {
				this._tooltipContents.innerHTML = "";
			}
			this._tooltipDiv.style.visibility = "hidden"; //$NON-NLS-0$
			this._tooltipDiv.style.left = "auto";
			this._tooltipDiv.style.right = "auto";			
			this._tooltipDiv.style.top = "auto";			
			this._tooltipDiv.style.bottom = "auto";			
			
			this._target = undefined;
			this._anchor = undefined;
			this._anchorRect = undefined;
			this._hoverRect = undefined;
		},
		/**
		 * @name isVisible
		 * @description Returns a boolean indicating whether the tooltip is currently visible
		 * @function
		 * @public
		 * @returns {boolean} 'true' iff the tooltip is currently visible
		*/
		isVisible: function() {
			return this._tooltipDiv && this._tooltipDiv.style.visibility === "visible"; //$NON-NLS-0$
		},
		OKToHover: function(x, y) {
			if (!this.isVisible())
				return true;
			
			if (this._hasFocus())
				return false;
				
			return !this._isInRect(this._anchorRect, x, y);
		},
		OKToHide: function(x, y) {
			if (!this.isVisible())
				return false;
			
			if (this._hasFocus())
				return false;
				
			return !this._isInRect(this._hoverRect, x, y);
		},
		/**
		 * @name show
		 * @description Show the tooltip using the current target
		 * @function
		 * @public
		 * @param {boolean} autoHide If 'true' then the tooltip will call 'hide' once the 'hideDelay'
		 * timer expires. if 'false' then the tooltip will remain visible until dismissed by the User.
		 *
		 * Note that if 'autoHide' is false then the tooltip will attempt to set the focus onto the
		 * resulting tooltip.
		*/
		show: function(target, giveFocus) {
			if (!target) { return; }
			console.log("CP: " + target.clientX + "," + target.clientY);
			
			// Do we need to process this one ?
			if (this._isInRect(this._hoverRect, target.clientX, target.clientY)) {
				if (target.clientY <= this._anchorRect.top 
					|| target.clientY >= (this._anchorRect.top + this._anchorRect.height)) {
					return;
				}
			}
			
			var info = target.getTooltipInfo();

			if (!info) { return; }
			
			if (this.isVisible()) {
				this.hide();
			}
			
			// Allow the info to define the anchorRect (for rulers)
			if (info.anchorRect) {
				this._anchor = info.anchor;
				this._anchorRect = info.anchorRect;
			}
			
			this._target = target;
			
			var tooltipDiv = this._tooltipDiv, tooltipContents = this._tooltipContents;
			tooltipDiv.style.left = tooltipDiv.style.right = tooltipDiv.style.width = tooltipDiv.style.height = 
				tooltipContents.style.width = tooltipContents.style.height = "auto"; //$NON-NLS-0$
			var tooltipDoc = tooltipDiv.ownerDocument;
			var documentElement = tooltipDoc.documentElement;
			
			var contents = info.contents;
			if (contents instanceof Array) {
				contents = this._getAnnotationContents(contents);			
			}
			
			var hoverInfo;
			if (this.hover && info.offset !== undefined && !contents) {
				var context = {offset: info.offset};
				hoverInfo = this.hover.computeHoverInfo(context);
			}
			
			if (typeof contents === "string") { //$NON-NLS-0$
				tooltipContents.innerHTML = contents;
			} else if (this._isNode(contents)) {
				tooltipContents.appendChild(contents);
			} else if (contents instanceof mProjectionTextModel.ProjectionTextModel) {
				var view = this._view;
				var options = view.getOptions();
				options.wrapMode = false;
				options.parent = tooltipContents;
				var tooltipTheme = "tooltipTheme"; //$NON-NLS-0$
				var theme = options.themeClass;
				if (theme) {
					theme = theme.replace(tooltipTheme, "");
					if (theme) { theme = " " + theme; } //$NON-NLS-0$
					theme = tooltipTheme + theme;
				} else {
					theme = tooltipTheme;
				}
				options.themeClass = theme;
				var contentsView = this._contentsView = new mTextView.TextView(options);
				//TODO need to find a better way of sharing the styler for multiple views
				var listener = {
					onLineStyle: function(e) {
						view.onLineStyle(e);
					}
				};
				contentsView.addEventListener("LineStyle", listener.onLineStyle); //$NON-NLS-0$
				contentsView.setModel(contents);
				var size = contentsView.computeSize();
				tooltipContents.style.width = size.width + "px"; //$NON-NLS-0$
				tooltipContents.style.height = size.height + "px"; //$NON-NLS-0$
				contentsView.resize();
			} else if (!(hoverInfo && hoverInfo.length)) {
				return;
			}
			
			if (info.anchor === "right") { //$NON-NLS-0$
				var right = documentElement.clientWidth - info.x;
				//tooltipDiv.style.right = right + "px"; //$NON-NLS-0$
				tooltipDiv.style.maxWidth = (documentElement.clientWidth - right - 10) + "px"; //$NON-NLS-0$
			} else {
				var left = parseInt(this._getNodeStyle(tooltipDiv, "padding-left", "0"), 10); //$NON-NLS-1$ //$NON-NLS-0$
				left += parseInt(this._getNodeStyle(tooltipDiv, "border-left-width", "0"), 10); //$NON-NLS-1$ //$NON-NLS-0$
				left = info.x - left;
				//tooltipDiv.style.left = left + "px"; //$NON-NLS-0$
				tooltipDiv.style.maxWidth = (documentElement.clientWidth - left - 10) + "px"; //$NON-NLS-0$
			}
			var top = parseInt(this._getNodeStyle(tooltipDiv, "padding-top", "0"), 10); //$NON-NLS-1$ //$NON-NLS-0$
			top += parseInt(this._getNodeStyle(tooltipDiv, "border-top-width", "0"), 10); //$NON-NLS-1$ //$NON-NLS-0$
			top = info.y - top;
			//tooltipDiv.style.top = top + "px"; //$NON-NLS-0$
			tooltipDiv.style.maxHeight = (documentElement.clientHeight - top - 10) + "px"; //$NON-NLS-0$
			tooltipDiv.style.opacity = "1"; //$NON-NLS-0$
			
			var self = this;
			if (hoverInfo) {
				hoverInfo.forEach(function(info) {
					Deferred.when(info, function (data) {
						if (data) {
							if (self._renderContent(tooltipDoc, tooltipContents, data)) {
								self._showTooltip(giveFocus, tooltipDiv);
							}
						}
					}, function(error) {
						if (typeof console !== "undefined") { //$NON-NLS-0$
							console.log("Error computing hover tooltip"); //$NON-NLS-0$
							console.log(error && error.stack);
						}
					});
				});
			}
			
			// Delay the showing of a tootip with no 'static' contents
			if (contents) {
				this._showTooltip(giveFocus, tooltipDiv);
			}
		},
		_showTooltip: function(giveFocus, tooltipDiv) {
			if (this.isVisible())
				return;

			// HACK! Fake a contentBox if necessary
			if (!this._anchorRect) {
				// Use the whole line
				var curOffset = this._view.getOffsetAtLocation(this._target.x, this._target.y);
				if (curOffset >= 0) {
					var start = this._view.getNextOffset(curOffset, 
										{ unit: "word", count: -1});
					var end = this._view.getNextOffset(curOffset, 
										{ unit: "word", count: 0});
					this._setContentRange(start, end);
				} else {
					this._anchorRect = {
						left: this._target.clientX-8, top: this._target.clientY -8,
						width: 16, height: 16
					};
				}
			}
			var tipDiv = this._tooltipDiv;
			
			// Align the tooltip with the anchor rect
			var divBounds = lib.bounds(tipDiv);
			if (this._anchor === 'right') {
				var rightEdge = this._anchorRect.left + this._anchorRect.width;
				tipDiv.style.left = (rightEdge - divBounds.width) + "px";
				tipDiv.style.top = (this._anchorRect.top + this._anchorRect.height + 5) + "px";
				this._hoverRect = {
					left: rightEdge - divBounds.width, top: this._anchorRect.top,
					width: divBounds.width,
					height: this._anchorRect.height + divBounds.height + 5
				};
			} else {
				tipDiv.style.left = this._anchorRect.left + "px";
				tipDiv.style.top = (this._anchorRect.top + this._anchorRect.height + 5) + "px";
				this._hoverRect = {
					left: this._anchorRect.left, top: this._anchorRect.top,
					width: divBounds.width,
					height: this._anchorRect.height + divBounds.height + 5
				};
			}
			console.log("HR: " + this._hoverRect.left + ',' + this._hoverRect.top
			+ ',' + this._hoverRect.width + ',' + this._hoverRect.height);
			this._tooltipDiv.style.visibility = "visible"; //$NON-NLS-0$

			if (giveFocus === true) {
				this._setInitialFocus(tooltipDiv);
			}
		},
		_setInitialFocus: function(tooltipDiv) {
			// Any buttons ?
			var button = lib.$("button", tooltipDiv); //$NON-NLS-0$
			if (button) {
				button.focus();
				return;
			}
			// Any links ?
			var link = lib.$("a", tooltipDiv); //$NON-NLS-0$
			if (link) {
				link.focus();
				var self = this;
				link.addEventListener("click", function() { //$NON-NLS-0$
					self.hide();
				});
				return;
			}
			// Give up and focus on the first tabbable
			var toFocus = lib.firstTabbable(tooltipDiv);
			if (toFocus) {
				toFocus.focus();
			}
		},
		_renderContent: function(tooltipDoc, tooltipContents, data) {
			if (typeof data.content === 'undefined' && typeof data.uriTemplate === 'undefined') { //$NON-NLS-0$ //$NON-NLS-1$
			    return false;
			}
			var sectionDiv = util.createElement(tooltipDoc, "div"); //$NON-NLS-0$;
			// render the title, if any
			if (data.title) {
				var titleDiv = util.createElement(tooltipDoc, "div"); //$NON-NLS-0$;
				titleDiv.innerHTML = this.hover.renderMarkDown ? this.hover.renderMarkDown(data.title) : data.title;
				sectionDiv.appendChild(titleDiv);
			}
			var contentDiv = util.createElement(tooltipDoc, "div"); //$NON-NLS-0$
			switch(data.type) { //$NON-NLS-0$
				case 'delegatedUI': { //$NON-NLS-0$
					// TODO The delegated UI data type is experimental and not part of the API
					if (data.uriTemplate) {
						var options = {};
						options.id = 'Delegated UI Tooltip'; //$NON-NLS-0$
						options.uriTemplate = data.uriTemplate;
//					    options.params = inputManager.getFileMetadata();
						options.width = data.width;
						options.height = data.height;
						
						// TODO Push status messages to page message service (see editorCommands.js)
//						options.status = handleStatus;
						var divResult = this._createDelegatedUI(options);
						sectionDiv.appendChild(divResult);
					}
					break;
				}
				case 'html': { //$NON-NLS-0$
					if (data.content){
						// TODO The html data type is experimental and not part of the API
						var iframe = document.createElement("iframe"); //$NON-NLS-0$
						iframe.id = 'HtmlHover'; //$NON-NLS-0$
						iframe.name = 'HTML Hover'; //$NON-NLS-0$
						iframe.type = "text/html"; //$NON-NLS-0$
						iframe.sandbox = "allow-scripts allow-same-origin allow-forms"; //$NON-NLS-0$
						iframe.style.border = "none"; //$NON-NLS-0$
						iframe.style.width = "auto"; //$NON-NLS-0$
						iframe.style.height = "auto"; //$NON-NLS-0$
						iframe.srcdoc = data.content;
						if (data.width) {
							iframe.style.width = data.width;
						}
						if (data.height) {
							iframe.style.height = data.height;
						}
						sectionDiv.appendChild(iframe);
					}
					break;
				}
				case 'markdown': { //$NON-NLS-0$
					if (this.hover.renderMarkDown) {
						contentDiv.innerHTML = this.hover.renderMarkDown(data.content);
					}
					break;
				}
				default: {
					contentDiv.appendChild(tooltipDoc.createTextNode(data.content));
				}
			}
			sectionDiv.appendChild(contentDiv);
			tooltipContents.appendChild(sectionDiv);
			return true;
		},
		_getAnnotationContents: function(annotations) {
			var annotation;
			var newAnnotations = [];
			for (var j = 0; j < annotations.length; j++) {
				annotation = annotations[j];
				if (annotation.title !== "" && !annotation.groupAnnotation) { 
					newAnnotations.push(annotation); 
				}
			}
			annotations = newAnnotations;
			if (annotations.length === 0) {
				return null;
			}
			var self = this;
			var html;
			var document = this._tooltipDiv.ownerDocument;
			var view = this._view;
			var model = view.getModel();
			var baseModel = model.getBaseModel ? model.getBaseModel() : model;
			function getText(start, end) {
				var textStart = baseModel.getLineStart(baseModel.getLineAtOffset(start));
				var textEnd = baseModel.getLineEnd(baseModel.getLineAtOffset(end), true);
				return baseModel.getText(textStart, textEnd);
			}
			function getAnnotationHTML(annotation) {
				var title = annotation.title;
				var result = util.createElement(document, "div"); //$NON-NLS-0$
				result.className = "tooltipRow"; //$NON-NLS-0$
				if (annotation.html) {
					var htmlHolder = util.createElement(document, "div"); //$NON-NLS-0$
					htmlHolder.className = "tooltipImage"; //$NON-NLS-0$
					htmlHolder.innerHTML = annotation.html;
					if (htmlHolder.lastChild) {
						textUtil.addEventListener(htmlHolder.lastChild, "click", function() { //$NON-NLS-0$
							var start = annotation.start, end = annotation.end;
							if (model.getBaseModel) {
								start = model.mapOffset(start, true);
								end = model.mapOffset(end, true);
							}
							view.setSelection(start, end, 1 / 3, function() { self.hide(); });
						}, false);
					}
					result.appendChild(htmlHolder); //$NON-NLS-0$
				}
				if (!title) {
					title = getText(annotation.start, annotation.end);
				}
				if (typeof title === "function") { //$NON-NLS-0$
					title = annotation.title();
				}
				if (typeof title === "string") { //$NON-NLS-0$
					var span = util.createElement(document, "span"); //$NON-NLS-0$
					span.className = "tooltipTitle"; //$NON-NLS-0$
					span.appendChild(document.createTextNode(title));
					title = span;
				}
				result.appendChild(title);
				
				// Handle quick fixes
				if (self.hover) {
					self.hover.renderQuickFixes(annotation, result);
					var buttons = lib.$$("button", result); //$NON-NLS-0$
					for (var i=0; i<buttons.length; i++) {
						buttons[i].addEventListener("click", function() { //$NON-NLS-0$
							self.hide(0);
						});
					}
				}
				
				// Set the anchor rect to the annotation if it's not already set
				if (!self._anchorRect) {
					self._setContentRange(annotation.start, annotation.end);
				}
				return result;
			}
			if (annotations.length === 1) {
				annotation = annotations[0];
				if (annotation.title !== undefined) {
					html = getAnnotationHTML(annotation);
					if (html.firstChild) {
						var className = html.firstChild.className;
						if (className) { className += " "; } //$NON-NLS-0$
						className += "single"; //$NON-NLS-0$
						html.firstChild.className = className;
					}
					return html;
				} else {
					var newModel = new mProjectionTextModel.ProjectionTextModel(baseModel);
					var lineStart = baseModel.getLineStart(baseModel.getLineAtOffset(annotation.start));
					var charCount = baseModel.getCharCount();
					if (annotation.end !== charCount) {
						newModel.addProjection({start: annotation.end, end: charCount});
					}
					if (lineStart > 0) {
						newModel.addProjection({start: 0, end: lineStart});
					}
					return newModel;
				}
			} else {
				var tooltipHTML = util.createElement(document, "div"); //$NON-NLS-0$
				var em = util.createElement(document, "em"); //$NON-NLS-0$
				em.appendChild(document.createTextNode(messages.multipleAnnotations));
				tooltipHTML.appendChild(em);
				for (var i = 0; i < annotations.length; i++) {
					annotation = annotations[i];
					html = getAnnotationHTML(annotation);
					if (html) {
						tooltipHTML.appendChild(html);
					}
				}
				return tooltipHTML;
			}
		},

		/**
		 * @name _createDelegatedUI
		 * @description Creates a delegated UI section in the tooltip that renders an iframe with content from a URI
		 * @function
		 * @private
		 * @param options
		 * @returns the div containing the iframe
		 */
		_createDelegatedUI: function _createDelegedUI(options) {
			var uriTemplate = new URITemplate(options.uriTemplate);
			var params = options.params || {};
			params.OrionHome = params.OrionHome || PageLinks.getOrionHome();
			var href = uriTemplate.expand(params);
			var delegatedParent = document.createElement("div"); //$NON-NLS-0$
			var iframe = document.createElement("iframe"); //$NON-NLS-0$
			iframe.id = options.id;
			iframe.name = options.id;
			iframe.type = "text/html"; //$NON-NLS-0$
			iframe.sandbox = "allow-scripts allow-same-origin allow-forms"; //$NON-NLS-0$
			iframe.frameborder = options.border !== undefined ? options.border : 0;
			iframe.src = href;
			iframe.style.border = "none"; //$NON-NLS-0$
			iframe.style.width = "auto"; //$NON-NLS-0$
			iframe.style.height = "auto"; //$NON-NLS-0$
//			iframe.className = "delegatedUI"; //$NON-NLS-0$
			if (options.width) {
				delegatedParent.style.width = options.width;
				iframe.style.width = options.width;
			}
			if (options.height) {
				delegatedParent.style.height = options.height;
				iframe.style.height = options.height;
			}
//			iframe.style.visibility = 'hidden'; //$NON-NLS-0$
//			if (options.parent !== null) {
//				(options.parent || window.document.body).appendChild(delegatedParent);
//			}
//			iframe.style.left = options.left || (window.innerWidth - parseInt(iframe.clientWidth, 10))/2 + "px"; //$NON-NLS-0$
//			iframe.style.top = options.top || (window.innerHeight - parseInt(iframe.clientHeight, 10))/2 + "px"; //$NON-NLS-0$
//			iframe.style.visibility = '';

			// Listen for notification from the iframe.  We expect either a "result" or a "cancelled" property.
//			window.addEventListener("message", function _messageHandler(event) { //$NON-NLS-0$
//				if (event.source !== iframe.contentWindow) {
//					return;
//				}
//				if (typeof event.data === "string") { //$NON-NLS-0$
//					var data = JSON.parse(event.data);
//					if (data.pageService === "orion.page.delegatedUI" && data.source === options.id) { //$NON-NLS-0$
//						if (data.cancelled) {
//							// console.log("Delegated UI Cancelled");
//							if (options.cancelled) {
//								options.cancelled();
//							}
//						} else if (data.result) {
//							if (options.done) {
//								options.done(data.result);
//							}
//						} else if (data.Status || data.status) {
//							if (options.status) {
//								options.status(data.Status || data.status);
//							}
//						}
//						window.removeEventListener("message", _messageHandler, false); //$NON-NLS-0$
//						if (delegatedParent.parentNode) {
//							delegatedParent.parentNode.removeChild(delegatedParent);
//						}
//					}
//				}
//			}, false);

			delegatedParent.appendChild(iframe);
			return delegatedParent;
		},
		
		_getNodeStyle: function(node, prop, defaultValue) {
			return textUtil.getNodeStyle(node, prop, defaultValue);
		},
		_isNode: function (obj) {
			return typeof Node === "object" ? obj instanceof Node : //$NON-NLS-0$
				obj && typeof obj === "object" && typeof obj.nodeType === "number" && typeof obj.nodeName === "string"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		}
	};
	return {Tooltip: Tooltip};
});
