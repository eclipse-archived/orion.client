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
	'orion/webui/littlelib', //$NON-NLS-0$
	'orion/util' //$NON-NLS-0$
], function(messages, mTextView, mProjectionTextModel, Deferred, textUtil, lib, util) {

function Tooltip (view) {
		this._view = view;
		var parent = view.getOptions("parent"); //$NON-NLS-0$
		this._create(parent ? parent.ownerDocument : document);
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
			textUtil.addEventListener(document, "mousedown", this._mouseDownHandler = function(event) { //$NON-NLS-0$
				if (!self.isVisible()) { return; }
				if (textUtil.contains(tooltipDiv, event.target || event.srcElement)) { return; }
				if (!self._locked){
					self.hide();
				}
			}, true);
			textUtil.addEventListener(document, "mousemove", this._mouseMoveHandler = function(event) { //$NON-NLS-0$
				if (!self.isVisible() || self._locked || self._hasFocus()) { return; }
				if (self._isInRect(self._hoverRect, event.clientX, event.clientY)){ return; }
				self.hide();
			}, true);
			textUtil.addEventListener(tooltipDiv, "mouseover", /* @callback */ function(event) { //$NON-NLS-0$
				self._inTooltip = true;
			}, false);
			textUtil.addEventListener(tooltipDiv, "mouseout", /* @callback */ function(event) { //$NON-NLS-0$
				self._inTooltip = false;
			}, false);
			textUtil.addEventListener(tooltipDiv, "keydown", function(event) { //$NON-NLS-0$
				if (event.keyCode === 27) {
					if (!self._locked){
						self.hide();
					}
				}
			}, false);
			this._view.addEventListener("Destroy", function() { //$NON-NLS-0$
				self.destroy();
			});
		},
		/*
		 * Should this even be API ?
		 */
		destroy: function() {
			if (!this._tooltipDiv) { return; }
			this.hide();
			var parent = this._tooltipDiv.parentNode;
			if (parent) { parent.removeChild(this._tooltipDiv); }
			var doc = this._tooltipDiv.ownerDocument;
			textUtil.removeEventListener(doc, "mousedown", this._mouseDownHandler, true); //$NON-NLS-0$
			textUtil.removeEventListener(doc, "mousemove", this._mouseMoveHandler, true); //$NON-NLS-0$
			this._tooltipDiv = null;
		},
		/**
		 * @name hide
		 * @description Hides the current hover popup (if it's showing)
		 * @function
		 * @public
		*/
		hide: function() {
			if (!this.isVisible()){
				return;
			}
				
			if (this.hover) {
				this.hover.clearQuickFixes();
			}

			if (this._hasFocus()) {
				this._view.focus();
			}
			if (this._contentsView) {
				this._contentsView.destroy();
				this._contentsView = null;
			}
			if (this._tooltipContents) {
				this._tooltipDiv.removeChild(this._tooltipContents);
				this._tooltipContents = null;
			}
			this._tooltipDiv.style.visibility = "hidden"; //$NON-NLS-0$
			this._tooltipDiv.style.left = "auto"; //$NON-NLS-0$
			this._tooltipDiv.style.right = "auto";		 //$NON-NLS-0$	
			this._tooltipDiv.style.top = "auto";	 //$NON-NLS-0$		
			this._tooltipDiv.style.bottom = "auto";		 //$NON-NLS-0$	
			this._tooltipDiv.style.width = "auto";		 //$NON-NLS-0$	
			this._tooltipDiv.style.height = "auto";		 //$NON-NLS-0$	
			
			// cancel any outstanding defers
			if (this._hoverInfo) {
				this._hoverInfo.forEach(function(info) {
					if (!info.resolved) {
						info.cancel();
					}
				});
			}

			// Values that can be overridden by returned info			
			this._x = undefined;
			this._y = undefined;
			this._width = undefined;
			this._height = undefined;
			this._offsetX = undefined;
			this._offsetY = undefined;
			this._offsetStart = undefined;
			this._offsetEnd = undefined;
			this._position = undefined;
			this._hoverArea = undefined;
			this._locked = undefined;
//			this._giveFocus = undefined;

			// values that are calculated
			this._hoverInfo = undefined;
			this._hoverRect = undefined;
			this._tipRect = undefined;
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

		_processInfo: function(target, update) {
			// Remember where the cursor is
			this._lastTarget = target;
			
			var newTooltipContents;
			if (update && this._tooltipContents) {
				// Clear out any current content
				this._tooltipContents.innerHTML = "";
				newTooltipContents = this._tooltipContents;
			} else {
				// Create a div for any new content
 				newTooltipContents = util.createElement(this._tooltipDiv.ownerDocument, "div"); //$NON-NLS-0$
 			}
			
			// Get any immediate data
			var info = target.getTooltipInfo();
			
			// Now get any info from plugins
			if (info) {			
				this._info = info;
				
				// Any immediate info to render ?
				if (info.contents) {
					if (this._renderImmediateInfo(newTooltipContents, info.contents, info.context)) {
						this._showContents(newTooltipContents, update);
					}
				}
				
				if (this.hover && info.offset !== undefined){
					var hoverContext = Object.create(null); 
					if (info.context) {
						hoverContext = info.context;
					}
					hoverContext.offset = info.offset;
					this._hoverInfo = this.hover.computeHoverInfo(hoverContext);
				
					if (this._hoverInfo) {
						var self = this;
						this._hoverInfo.forEach(function(info) {
							Deferred.when(info, function (data) {
								info.resolved = true;  // resolved
								if (data) {
									if (self._renderPluginContent(newTooltipContents, data)) {
										if (self.isVisible()) {
											self._tooltipDiv.resize();
										} else {
											self._info = data;
											self._showContents(newTooltipContents, update);
										}
									}
								}
							}, function(error) {
								if (typeof console !== "undefined") { //$NON-NLS-0$
									console.log("Error computing hover tooltip"); //$NON-NLS-0$
									console.log(error && error.stack);
								}
							});
						});
						return true;
					}
				}
			}
		},
		/**
		 * @name onHover
		 * @description Show the tooltip using the given target information. Only called for hover events.
		 * @function
		 * @param target
		 * @param giveFocus
		 */
		onHover: function(target) {
			if (!target) {
				return;
			}
			
			// Don't process if we're in the hoverArea or tip rects
			if (this._isInRect(this._hoverArea, target.clientX, target.clientY)
					|| this._isInRect(this._tipRect, target.clientX, target.clientY)
					|| this._locked) {
				return;
			}
			
			this._processInfo(target);
		},		
		/**
		 * @name show
		 * @description Show the tooltip using the given target information
		 * @function
		 * @param target The target through which the info is obtained
		 * @param locked If true locks the tooltip (never hides unless 'hide' is called)
		 * @param giveFocus If true forces the focus onto the tooltip (used for F2 processing)
		 */
		show: function(target, locked, giveFocus) {
			this._locked = locked;
			this._giveFocus = giveFocus;
			this._processInfo(target);
		},
		/**
		 * @name update
		 * @description Updates the information in an already visible tooltip
		 * @function
		 * @param target The target through which the info is obtained
		 * @param locked If true locks the tooltip (never hides unless 'hide' is called)
		 * @param giveFocus If true forces the focus onto the tooltip (used for F2 processing)
		 */
		update: function(target) {
			if (!target){
				return;
			}
			this._processInfo(target, true);
		},
		
		/*
		 ******************************************************************************************************************* 
		 * Positioning: This section deals with setting the location and size of the tooltip
		 ******************************************************************************************************************* 
		 */
		_captureLocationInfo: function(info) {
			this._x = info.x;
			this._y = info.y;
			this._width = info.width;
			this._height = info.height;
			this._offsetX = info.offsetX;
			this._offsetY = info.offsetY;
			this._position = info.position;
			this._offsetStart = info.offsetStart;			
			this._offsetEnd = info.offsetEnd;			

			// the hoverArea may have been set by rendering an annotation...
			if (!this._hoverArea)
				this._hoverArea = info.hoverArea;
			
			if (info.context){
				// Adjust the tooltip for folding comments to exactly cover the unfolded text location
				if (info.context.rulerStyle && info.context.rulerStyle.indexOf("folding") >= 0){ //$NON-NLS-0$
					this._offsetX = 0;
					this._offsetY = -5;
				}
			}
			
		},
		_computeTooltipPosition: function _computeTooltipPosition(){
			var tooltipDiv = this._tooltipDiv;
			var documentElement = tooltipDiv.ownerDocument.documentElement;
			
			if (this._width) {
				tooltipDiv.style.width = this._width + "px"; //$NON-NLS-0$
			}
			if (this._height) {
				tooltipDiv.style.height = this._height + "px"; //$NON-NLS-0$
				tooltipDiv.style.overflowY = "auto"; //$NON-NLS-0$
			}
			if (!this._y) {
				this._y = 0;
			}
			var top = parseInt(this._getNodeStyle(tooltipDiv, "padding-top", "0"), 10); //$NON-NLS-1$ //$NON-NLS-0$
			top += parseInt(this._getNodeStyle(tooltipDiv, "border-top-width", "0"), 10); //$NON-NLS-1$ //$NON-NLS-0$
			top = this._y - top;
			tooltipDiv.style.top = top + "px"; //$NON-NLS-0$
			tooltipDiv.style.maxHeight = (documentElement.clientHeight - top - 10) + "px"; //$NON-NLS-0$
			tooltipDiv.style.opacity = "1"; //$NON-NLS-0$
		},		
		_showContents: function _showContents(newContentsDiv, update) {
			// TODO Hide is performing two operations, make the tooltip invisible and clearing out any stored data
			if (this.isVisible() && !update) {
				this.hide();
			}

			this._captureLocationInfo(this._info);
			this._info = undefined;

			// TODO Potential for an empty tooltip or duplicated content, what if both static and deferred content are added?
			this._tooltipContents = newContentsDiv;
			this._tooltipDiv.appendChild(newContentsDiv);
			
			this._computeTooltipPosition();
			
			// Create a hover area if necessary
			if (!this._hoverArea) {
				if (this._offsetStart && this._offsetEnd) {
					this._setContentRange(this._offsetStart, this._offsetEnd);
				} else {
					// Use the whole line
					var curOffset = this._view.getOffsetAtLocation(this._lastTarget.x, this._lastTarget.y);
					if (curOffset >= 0) {
						var start = this._view.getNextOffset(curOffset, 
											{ unit: "word", count: -1}); //$NON-NLS-0$
						var end = this._view.getNextOffset(curOffset, 
											{ unit: "word", count: 0}); //$NON-NLS-0$
						this._setContentRange(start, end);
					} else {
						this._hoverArea = {
							left: this._lastTarget.clientX-8, top: this._lastTarget.clientY -8,
							width: 16, height: 16
						};
					}
				}
			}
			
			// Align the tooltip with the hover area
			var tipDiv = this._tooltipDiv;
			var divBounds = lib.bounds(tipDiv);
			if (!this._position) { this._position = "below"; } //$NON-NLS-0$
			if (!this._offsetX) { this._offsetX = 0; }
			if (!this._offsetY) { this._offsetY = 0; }

			var tipRect = {
				width: divBounds.width,
				height: divBounds.height
			};	
			switch (this._position) {
				case "left": //$NON-NLS-0$
					tipRect.left = this._hoverArea.left - (divBounds.width + this._offsetX);
					tipRect.top = this._hoverArea.top + this._offsetY;
				break;
				case "right": //$NON-NLS-0$
					tipRect.left = (this._hoverArea.left + this._hoverArea.width) + this._offsetX;
					tipRect.top = this._hoverArea.top + this._offsetY;
				break;
				case "above": //$NON-NLS-0$
					tipRect.left = this._hoverArea.left + this._offsetX;
					tipRect.top = this._hoverArea.top - (divBounds.height + this._offsetY);
				break;
				case "below": //$NON-NLS-0$
					tipRect.left = this._hoverArea.left + this._offsetX;
					tipRect.top = (this._hoverArea.top + this._hoverArea.height) + this._offsetY;
				break;
			}

			tipDiv.style.left = tipRect.left + "px"; //$NON-NLS-0$
			tipDiv.style.top = tipRect.top + "px"; //$NON-NLS-0$

			this._setHoverRect(this._hoverArea, tipRect);
			
			this._tooltipDiv.style.visibility = "visible"; //$NON-NLS-0$
			
			if (this._giveFocus) {
				this._setInitialFocus(this._tooltipDiv);
				this._giveFocus = undefined;
			}
		},		
		_setHoverRect: function(hoverArea, tipRect) {
			var left = Math.min(hoverArea.left, tipRect.left);
			var top = Math.min(hoverArea.top, tipRect.top);
			var positionRight = hoverArea.left + hoverArea.width;
			var tipRight = tipRect.left + tipRect.width;
			var right = Math.max(positionRight, tipRight);
			var positionBottom = hoverArea.top + hoverArea.height;
			var tipBottom = tipRect.top + tipRect.height;
			var bottom = Math.max(positionBottom, tipBottom);
			
			this._tipRect = tipRect;
			this._hoverRect = {
				left: left,
				top : top,
				width: right - left,
				height: bottom - top
			};
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
		
		/*
		 ******************************************************************************************************************* 
		 * Utility: This section contains various utility methods
		 ******************************************************************************************************************* 
		 */
		_getWindow: function() {
			var document = this._tooltipDiv.ownerDocument;
			return document.defaultView || document.parentWindow;
		},
		_hasFocus: function() {
			var tooltipDiv = this._tooltipDiv;
			if (!tooltipDiv) { return false; }
			return textUtil.contains(tooltipDiv, tooltipDiv.ownerDocument.activeElement);
		},
		setInitialFocus: function(tooltipDiv) {
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
		_getNodeStyle: function(node, prop, defaultValue) {
			return textUtil.getNodeStyle(node, prop, defaultValue);
		},
		_isNode: function (obj) {
			return typeof Node === "object" ? obj instanceof Node : //$NON-NLS-0$
				obj && typeof obj === "object" && typeof obj.nodeType === "number" && typeof obj.nodeName === "string"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
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
				// 'getLineEnd' isn't API in textView but is in textModel...
				end = tv.getModel().getLineEnd(curLine);
			}
			
			var height = tv.getLineHeight(curLine);
			var startPos = tv.getLocationAtOffset(start);
			var endPos = tv.getLocationAtOffset(end);
			
			var viewRect = { x: startPos.x, y: startPos.y, 
								width: endPos.x - startPos.x, height: height};
								
			viewRect = this._view.convert(viewRect, "document", "page"); //$NON-NLS-0$ //$NON-NLS-1$
			this._hoverArea = {left: viewRect.x, top: viewRect.y, 
								width: viewRect.width, height: viewRect.height};
		},
		_isInRect: function(rect, x, y) {
			if (!rect){
				return false;
			}
			var xOK = x >= rect.left && x <= (rect.left + rect.width);
			var yOK = y >= rect.top && y <= (rect.top + rect.height);
			return xOK && yOK;
		},
		/*
		 ******************************************************************************************************************* 
		 * Rendering: This section deals with rendering supplied data into HTML for inclusion into the Info Popup.
		 ******************************************************************************************************************* 
		 */
		_renderPluginContent: function(contentsDiv, data) {
			var document = this._tooltipDiv.ownerDocument;
			// data object should be an object containing the type and content.  If no type or unknown type, default to string.
			if (typeof data !== 'string' && typeof data.content === 'undefined') { //$NON-NLS-0$ //$NON-NLS-1$
			    return false;
			}
			
			var sectionDiv = util.createElement(document, "div"); //$NON-NLS-0$;
			// render the title, if any
			if (data.title) {
				var titleDiv = util.createElement(document, "div"); //$NON-NLS-0$;
				titleDiv.innerHTML = this.hover.renderMarkDown ? this.hover.renderMarkDown(data.title) : data.title;
				sectionDiv.appendChild(titleDiv);
			}
			var contentDiv = util.createElement(document, "div"); //$NON-NLS-0$
			
			if (typeof data === 'string'){ //$NON-NLS-0$
				contentDiv.appendChild(document.createTextNode(data));
			} else {
				switch(data.type) { //$NON-NLS-0$
					case 'delegatedUI': { //$NON-NLS-0$
						// The delegated UI is not included in the 8.0 release, see Bug 449240.
					}
					case 'html': { //$NON-NLS-0$
						if (data.content){
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
						contentDiv.appendChild(document.createTextNode(data.content));
					}
				}
			}
			sectionDiv.appendChild(contentDiv);
			contentsDiv.appendChild(sectionDiv);
			return true;
		},
		/*
		 * Empty or empty array = call hover service for dynamic content
		 * Array = annotations
		 * String = HTML text
		 * Node = HTML node
		 * ProjectionTextModel = code projection
		 */
		_renderImmediateInfo: function _renderImmediateInfo(contentsDiv, contents, context) {						
			// If it's an annotation then process the annotation(s) to get the actual data
			if (contents instanceof Array) {
				contents = this._getAnnotationContents(contents, context);			
				if (!contents) {
					return false;
				}
			}
			
			if (typeof contents === "string") { //$NON-NLS-0$
				contentsDiv.innerHTML = contents;
				return true;
			} else if (this._isNode(contents)) {
				contentsDiv.appendChild(contents);
				return true;
			} else if (contents instanceof mProjectionTextModel.ProjectionTextModel) {
				this._tooltipContents = contentsDiv;
				this._tooltipDiv.appendChild(contentsDiv);
				var view = this._view;
				var options = view.getOptions();
				options.wrapMode = false;
				options.parent = contentsDiv;
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
				contentsDiv.style.width = size.width + "px"; //$NON-NLS-0$
				contentsDiv.style.height = size.height + "px"; //$NON-NLS-0$
				contentsView.resize();
				return true;
			}
			return false;
		},
		
		/**
		 * @name _getAnnotationContents
		 * @description Takes a list of annotation and renders them in the tooltip
		 * @function
		 * @private
		 * @param annotations the list of annotations to render
		 * @param context optional object containing where the annotations are displayed (ruler, editor, etc.)
		 * @returns returns document node containing rendered tooltip content
		 */
		_getAnnotationContents: function(annotations, context) {
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
			function getAnnotationHTML(annotation, inEditor) {
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
				if (inEditor) {
					self.hover.renderQuickFixes(annotation, result);
					
					// Set the hover area to the annotation if it's not already set
					self._setContentRange(annotation.start, annotation.end);
				}
				return result;
			}
			
			// Don't show quickfixes for ruler annotations (left or right side)
			var inEditor = self.hover ? true : false;
			if (inEditor && context && context.source && context.source.indexOf('ruler') >= 0){ //$NON-NLS-0$
				inEditor = false;
			}			
			
			if (annotations.length === 1) {
				annotation = annotations[0];
				if (annotation.title !== undefined) {
					html = getAnnotationHTML(annotation, inEditor);
					if (html.firstChild) {
						var className = html.firstChild.className;
						if (className) { className += " "; } //$NON-NLS-0$
						className += "single"; //$NON-NLS-0$
						html.firstChild.className = className;
					}
					return html;
				} else {
					// TODO Test that the source here is still correct
					// Don't create a projection model if we are in the editor it will just duplicate the content the user is looking at
					if (context && context.source && context.source === 'editor'){ //$NON-NLS-0$
						return null;
					}
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
					html = getAnnotationHTML(annotation, inEditor);
					if (html) {
						tooltipHTML.appendChild(html);
					}
				}
				return tooltipHTML;
			}
		},
		
	};
	return {Tooltip: Tooltip};
});
