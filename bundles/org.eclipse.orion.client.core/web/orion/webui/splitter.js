/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global window define document localStorage */

define(['require', 'orion/webui/littlelib'], function(require, lib) {

	/**
	 * Constructs a new Splitter with the given options.  A splitter manages the layout
	 * of two panels, a side panel and a main panel.  A toggle button will open or close the side panel.
	 * @param {Object} options The options object which must specify the split dom node
	 * @param options.node The node for the splitter presentation.  Required.
	 * @param options.sidePanel The node for the side (toggling) panel.  Required.
	 * @param options.mainPanel The node for the main panel.  Required.
	 * @name orion.splitter.Splitter
	 */
	function Splitter(options) {
		this._init(options);		
	}
	Splitter.prototype = /** @lends orion.splitter.Splitter.prototype */ {
			
		_init: function(options) {
			this._tracking = null;
			this._resizeListeners = [];
			this._animationDelay = 501;  // longer than CSS transitions in layout.css
			this._prefix = "/orion/splitter/" + document.body.id;  //$NON-NLS-0$
			this._node = lib.node(options.node);
			if (!this._node) { throw "no dom node for splitter found"; } //$NON-NLS-0$
			this._sideNode = lib.node(options.sidePanel);
			if (!this._sideNode) { throw "no dom node for side panel found"; } //$NON-NLS-0$
			this._mainNode = lib.node(options.mainPanel);
			if (!this._mainNode) { throw "no dom node for main panel found"; } //$NON-NLS-0$
			this._thumb = document.createElement("div"); //$NON-NLS-0$
			this._node.appendChild(this._thumb);
			this._thumb.classList.add("splitThumb"); //$NON-NLS-0$
			this._thumb.classList.add("splitThumbLayout"); //$NON-NLS-0$
			this._initializeFromStoredSettings();
			
			if (this._closed) {
				this._closed = false;  // _thumbDown will toggle it, so turn it off and then call _thumbDown.
				this._thumbDown();
			} else {
				this._adjustToSplitPosition();
			}
			this._node.style.visibility = "visible"; //$NON-NLS-0$ 
			this._mainNode.style.display = "block"; //$NON-NLS-0$ 
			this._sideNode.style.display = "block"; //$NON-NLS-0$ 
			this._node.addEventListener("mousedown", this._mouseDown.bind(this), false); //$NON-NLS-0$
			window.addEventListener("mouseup", this._mouseUp.bind(this), false); //$NON-NLS-0$
			window.addEventListener("resize", this._resize.bind(this), false);  //$NON-NLS-0$
		},
		/**
		 * Toggle the open/closed state of the side panel.
		 */			
		toggleSidePanel: function() {
			this._thumbDown();		
		},
		
		/**
		 * Close the side panel.  This function has no effect if the side panel is already closed.
		 */
		 openSidePanel: function() {
			if (!this._closed) {
				this._thumbDown();
			}
		 },
		 /**
		 * Adds an event listener for resizing the main and side panels.
		 * @param {Function} listener The function called when a resize occurs.  The DOM node that has
		 * been resized is passed as an argument.
		 */
		 addResizeListener: function(listener) {
			this._resizeListeners.push(listener);
		 },
		 
		 /* We use local storage vs. prefs because we don't presume the user wants the same window
		    positioning across browsers and devices.
		  */
		 _initializeFromStoredSettings: function() {
			this._closed = localStorage.getItem(this._prefix+"/toggleState") === "closed";  //$NON-NLS-1$ //$NON-NLS-0$
			var pos = localStorage.getItem(this._prefix+"/xPosition"); //$NON-NLS-0$
			if (pos) {
				this._splitLeft = parseInt(pos, 10);
			}
			
		 },
		 
		_adjustToSplitPosition: function(updateStorage) {
			var rect = this._node.getBoundingClientRect();
			this._splitWidth = rect.right - rect.left;
			if (updateStorage || !this._splitLeft){
				this._splitLeft = rect.left;
				localStorage.setItem(this._prefix+"/xPosition", this._splitLeft);  //$NON-NLS-1$ //$NON-NLS-0$
			}
			this._sideNode.style.width = this._splitLeft + "px"; //$NON-NLS-0$
			this._sideNode.style.right = this._splitLeft - 1 +"px"; //$NON-NLS-0$
			this._sideNode.style.display = "block"; //$NON-NLS-0$ 
			this._node.style.left = this._splitLeft + "px"; //$NON-NLS-0$ 
			this._resize();
		},
		
		_resize: function(animationDelay) {
			animationDelay = animationDelay || 0;
			var rect = this._node.parentNode.getBoundingClientRect();
			this._totalWidth = rect.right - rect.left;
			rect = this._node.getBoundingClientRect();
			this._mainNode.style.width = (this._totalWidth - rect.right) +"px"; //$NON-NLS-0$ 
			var self = this;
			window.setTimeout(function() { self._notifyResizeListeners(self._mainNode); }, animationDelay);
			window.setTimeout(function() { self._notifyResizeListeners(self._sideNode); }, animationDelay);
		},
		
		_notifyResizeListeners: function(node) {
			for (var i = 0; i <this._resizeListeners.length; i++) {
				this._resizeListeners[i](node);
			}
		}, 
		
		_thumbDown: function() {
			if (this._closed) {
				this._closed = false;
				this._addAnimation();
				this._sideNode.style.width = this._splitLeft+"px"; //$NON-NLS-0$ 
				this._node.style.left = this._splitLeft+"px"; //$NON-NLS-0$
				this._resize(this._animationDelay);
				this._removeAnimation();
			} else {
				this._closed = true;
				this._addAnimation();
				this._sideNode.style.width = 0;
				this._node.style.left = "1px"; //$NON-NLS-0$ 
				this._resize(this._animationDelay);
				this._removeAnimation();
			}
			localStorage.setItem(this._prefix+"/toggleState", this._closed ? "closed" : null);  //$NON-NLS-1$  //$NON-NLS-0$

		},
		
		_removeAnimation: function() {
			// in a timeout to ensure the animations are complete.
			var self = this;
			window.setTimeout(function() {
				self._sideNode.classList.remove("sidePanelLayoutAnimation"); //$NON-NLS-0$ 
				self._mainNode.classList.remove("mainPanelLayoutAnimation"); //$NON-NLS-0$ 
				self._node.classList.remove("splitLayoutAnimation"); //$NON-NLS-0$ 
				self._thumb.classList.remove("splitLayoutAnimation"); //$NON-NLS-0$ 
			}, this._animationDelay);
		},
		
		_addAnimation: function() {
			this._sideNode.classList.add("sidePanelLayoutAnimation"); //$NON-NLS-0$ 
			this._mainNode.classList.add("mainPanelLayoutAnimation"); //$NON-NLS-0$ 
			this._node.classList.add("splitLayoutAnimation"); //$NON-NLS-0$ 
			this._thumb.classList.add("splitLayoutAnimation"); //$NON-NLS-0$ 
		},
		
		_mouseDown: function(event) {
			if (event.target === this._thumb) {
				return this._thumbDown(event);
			}
			if (this._tracking) {
				return;
			}
			this._node.classList.add("splitTracking"); //$NON-NLS-0$
			this._mainNode.classList.add("panelTracking"); //$NON-NLS-0$
			this._sideNode.classList.add("panelTracking"); //$NON-NLS-0$
			this._tracking = this._mouseMove.bind(this);
			window.addEventListener("mousemove", this._tracking); //$NON-NLS-0$
		},
		
		_mouseMove: function(event) {
			if (this._tracking) {
				this._splitLeft = event.clientX;
				this._node.style.left = event.clientX + "px"; //$NON-NLS-0$ 
				this._adjustToSplitPosition(true);
				lib.stop(event);
			}
		},
		
		_mouseUp: function(event) {
			if (this._tracking) {
				window.removeEventListener("mousemove", this._tracking); //$NON-NLS-0$
				this._tracking = null;
				this._node.classList.remove("splitTracking"); //$NON-NLS-0$
				this._mainNode.classList.remove("panelTracking"); //$NON-NLS-0$
				this._sideNode.classList.remove("panelTracking"); //$NON-NLS-0$
			}
		}
	};
	Splitter.prototype.constructor = Splitter;
	//return the module exports
	return {Splitter: Splitter};
});