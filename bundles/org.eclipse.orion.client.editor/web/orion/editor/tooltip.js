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

	/** @private */
	function Tooltip (view) {
		this._view = view;
		this._fadeDelay = 500;
		this._hideDelay = 200;
		this._showDelay = 500;
		this._autoHideDelay = 5000;
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
			var tooltipContents = this._tooltipContents = util.createElement(document, "div"); //$NON-NLS-0$
			tooltipDiv.appendChild(tooltipContents);
			document.body.appendChild(tooltipDiv);
			var self = this;
			textUtil.addEventListener(tooltipDiv, "mouseover", function(event) { //$NON-NLS-0$
				if (!self._hideDelay) { return; }
				var window = self._getWindow();
				if (self._delayedHideTimeout) {
					window.clearTimeout(self._delayedHideTimeout);
					self._delayedHideTimeout = null;
				}
				
				if (self._hideTimeout) {
					window.clearTimeout(self._hideTimeout);
					self._hideTimeout = null;
				}
				self._nextTarget = null;
			}, false);
			textUtil.addEventListener(tooltipDiv, "mouseout", function(event) { //$NON-NLS-0$
				var relatedTarget = event.relatedTarget || event.toElement;
				if (relatedTarget === tooltipDiv || self._hasFocus()) { return; }
				if (relatedTarget) {
					if (textUtil.contains(tooltipDiv, relatedTarget)) { return; }
				}
				self._hide();
			}, false);
			textUtil.addEventListener(tooltipDiv, "keydown", function(event) { //$NON-NLS-0$
				if (event.keyCode === 27) {
					self._hide();
				}
			}, false);
			textUtil.addEventListener(document, "mousedown", this._mouseDownHandler = function(event) { //$NON-NLS-0$
				if (!self.isVisible()) { return; }
				if (textUtil.contains(tooltipDiv, event.target || event.srcElement)) { return; }
				self._hide();
			}, true);
			this._view.addEventListener("Destroy", function() { //$NON-NLS-0$
				self.destroy();
			});
			this._hide();
		},
		_getWindow: function() {
			var document = this._tooltipDiv.ownerDocument;
			return document.defaultView || document.parentWindow;
		},
		destroy: function() {
			if (!this._tooltipDiv) { return; }
			this._hide();
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
		/**
		 * @name hide
		 * @description Hides the current hover popup
		 * @function
		 * @public 
		 * @memberof ???
		 * @param {int} hideDelay Delay the hide by this many millisecs (defaults to the 'hideDelay' field
		 * of this tooltip)
		 */
		hide: function(hideDelay) {
			if (hideDelay === undefined) {
				hideDelay = this._hideDelay;
			}
			var window = this._getWindow();
			if (this._delayedHideTimeout) {
				window.clearTimeout(this._delayedHideTimeout);
				this._delayedHideTimeout = null;
			}
			var self = this;
			if (!hideDelay) {
				self._hide();
				self.setTarget(self._nextTarget, 0);
			} else {
				self._delayedHideTimeout = window.setTimeout(function() {
					self._delayedHideTimeout = null;
					self._hide();
					self.setTarget(self._nextTarget, 0);
				}, hideDelay);
			}
		},
		_hide: function() {
			var tooltipDiv = this._tooltipDiv;
			if (!tooltipDiv) { return; }
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
			tooltipDiv.style.visibility = "hidden"; //$NON-NLS-0$
			var window = this._getWindow();
			if (this._showTimeout) {
				window.clearTimeout(this._showTimeout);
				this._showTimeout = null;
			}
			if (this._delayedHideTimeout) {
				window.clearTimeout(this._delayedHideTimeout);
				this._delayedHideTimeout = null;
			}
			if (this._hideTimeout) {
				window.clearTimeout(this._hideTimeout);
				this._hideTimeout = null;
			}
			if (this._fadeTimeout) {
				window.clearInterval(this._fadeTimeout);
				this._fadeTimeout = null;
			}
		},
		/**
		 * @name isVisible
		 * @description Returns a boolean indicating whether the tooltip is currently visible
		 * @function
		 * @public 
		 * @memberof ???
		 * @returns {boolean} 'true' iff the tooltip is currently visible
		 */
		isVisible: function() {
			return this._tooltipDiv && this._tooltipDiv.style.visibility === "visible"; //$NON-NLS-0$
		},
		/**
		 * @name setTarget
		 * @description Set the 'target' used to gather the information to be displayed the next
		 * time the tooltip is shown.
		 * @function
		 * @public 
		 * @memberof ???
		 * @param {Object} target The target to use on the next 'show'
		 * @param {int} delay Delay the show by this many millisecs (defaults to the 'showDelay' field
		 * of this tooltip
		 * @param {int} hideDelay Delay the hide by this many millisecs (defaults to the 'hideDelay' field
		 * of this tooltip). Note that a value of '-1' indicates that the toottip should remain up until the
		 * user dismisses it (hits ESC / clicks outside it...).
		 * 
		 * NOTE: This is the preferred call to use to programmatically bring up the tooltip
		 * (as opposed to calling 'show' directly). Calling this method with a desired target, a
		 * 'delay' of 0 and a 'hideDelay' of -1 will immediately show the tooltip, ensure that it
		 * remains up.
		 */
		setTarget: function(target, delay, hideDelay) {
			if (target && !target.getTooltipInfo && this._target) {
				target.getTooltipInfo = this._target.getTooltipInfo;
			}
			var visible = this.isVisible();
			if (visible) {
				if (this._hasFocus()) { return; }
				this._nextTarget = target;
				this.hide(hideDelay);
			} else {
				this._target = target;
				if (target) {
					var self = this;
					var window = self._getWindow();
					if (self._showTimeout) {
						window.clearTimeout(self._showTimeout);
						self._showTimeout = null;
					}
					if (delay === 0) {
						self.show(hideDelay !== -1);
					} else {
						self._showTimeout = window.setTimeout(function() {
							self._showTimeout = null;
							self.show(hideDelay !== -1);
						}, delay ? delay : self._showDelay);
					}
				}
			}
		},
		/**
		 * @name show
		 * @description Show the tooltip using the current target
		 * @function
		 * @public 
		 * @memberof ???
		 * @param {boolean} autoHide If 'true' then the tooltip will call 'hide' once the 'hideDelay'
		 * timer expires. if 'false' then the tooltip will remain visible until dismissed by the User.
		 * 
		 * Note that if 'autoHide' is false then the tooltip will attempt to set the focus onto the
		 * resulting tooltip.
		 */
		show: function(autoHide) {
			if (!this._target) { return; }
			var info = this._target.getTooltipInfo();

			if (!info) { return; }
			var tooltipDiv = this._tooltipDiv, tooltipContents = this._tooltipContents;
			tooltipDiv.style.left = tooltipDiv.style.right = tooltipDiv.style.width = tooltipDiv.style.height = 
				tooltipContents.style.width = tooltipContents.style.height = "auto"; //$NON-NLS-0$
			var tooltipDoc = tooltipDiv.ownerDocument;
			var documentElement = tooltipDoc.documentElement;
			
			var hoverInfo;
			if (this.hover && info.offset !== undefined) {
				var context = {offset: info.offset};
				hoverInfo = this.hover.computeHoverInfo(context);
			}
			
			var contents = info.contents;
			if (contents instanceof Array) {
				contents = this._getAnnotationContents(contents);			
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
				tooltipDiv.style.right = right + "px"; //$NON-NLS-0$
				tooltipDiv.style.maxWidth = (documentElement.clientWidth - right - 10) + "px"; //$NON-NLS-0$
			} else {
				var left = parseInt(this._getNodeStyle(tooltipDiv, "padding-left", "0"), 10); //$NON-NLS-1$ //$NON-NLS-0$
				left += parseInt(this._getNodeStyle(tooltipDiv, "border-left-width", "0"), 10); //$NON-NLS-1$ //$NON-NLS-0$
				left = info.x - left;
				tooltipDiv.style.left = left + "px"; //$NON-NLS-0$
				tooltipDiv.style.maxWidth = (documentElement.clientWidth - left - 10) + "px"; //$NON-NLS-0$
			}
			var top = parseInt(this._getNodeStyle(tooltipDiv, "padding-top", "0"), 10); //$NON-NLS-1$ //$NON-NLS-0$
			top += parseInt(this._getNodeStyle(tooltipDiv, "border-top-width", "0"), 10); //$NON-NLS-1$ //$NON-NLS-0$
			top = info.y - top;
			tooltipDiv.style.top = top + "px"; //$NON-NLS-0$
			tooltipDiv.style.maxHeight = (documentElement.clientHeight - top - 10) + "px"; //$NON-NLS-0$
			tooltipDiv.style.opacity = "1"; //$NON-NLS-0$
			
			var self = this;
			if (hoverInfo) {
				hoverInfo.forEach(function(info) {
					Deferred.when(info, function (data) {
						if (data) {
							if (self._renderContent(tooltipDoc, tooltipContents, data)) {
								// Ensure that the tooltip is visible
								tooltipDiv.style.visibility = "visible"; //$NON-NLS-0$
								if (!autoHide) {
									self._setInitialFocus(tooltipDiv);
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
			}
			
			// Delay the showing of a tootip with no 'static' contents
			if (contents) {
				tooltipDiv.style.visibility = "visible"; //$NON-NLS-0$				
				if (!autoHide) {
					this._setInitialFocus(tooltipDiv);
				}
			}
			
			if (autoHide) {
				var window = this._getWindow();
				self._hideTimeout = window.setTimeout(function() {
					self._hideTimeout = null;
					var opacity = parseFloat(self._getNodeStyle(tooltipDiv, "opacity", "1")); //$NON-NLS-1$ //$NON-NLS-0$
					self._fadeTimeout = window.setInterval(function() {
						if (tooltipDiv.style.visibility === "visible" && opacity > 0) { //$NON-NLS-0$
							opacity -= 0.1;
							tooltipDiv.style.opacity = opacity;
							return;
						}
						self._hide();
					}, self._fadeDelay / 10);
				}, self._autoHideDelay);
			}
		},
		_setInitialFocus: function(tooltipDiv) {
			var buttons = lib.$$("button", tooltipDiv);
			if (buttons && buttons.length > 0) {
				buttons[0].focus();
				return;
			}
			
			var toFocus = lib.firstTabbable(tooltipDiv);
			if (toFocus) {
				toFocus.focus();
			}
		},
		_renderContent: function(tooltipDoc, tooltipContents, data) {
			if (typeof data.content === 'undefined') {
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
			switch(data.type) {
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
							view.setSelection(start, end, 1 / 3, function() { self._hide(); });
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
					var tb = self.hover.renderQuickFixes(annotation, result);
					var buttons = lib.$$("button", tb);
					for (var i=0; i<buttons.length; i++) {
						buttons[i].addEventListener("click", function() {
							self.hide(0);
						});
					}
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
