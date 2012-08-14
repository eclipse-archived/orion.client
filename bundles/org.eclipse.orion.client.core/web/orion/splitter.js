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

define(['require', 'dojo'], function(require, dojo) {

	function stop(event) {
		if (window.document.all) { 
			event.keyCode = 0;
		} else { 
			event.preventDefault();
			event.stopPropagation();
		}
	}

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
			this._animationDelay = 520;  // longer than CSS transitions in layout.css
			this._prefix = "/orion/splitter/" + document.body.id;  //$NON-NLS-0$
			function nodeFromOption(value) {
				var node = value;
				if (typeof(value) === "string") { //$NON-NLS-0$
					node = dojo.byId(value);
				}	
				return node;
			}
			this._node = nodeFromOption(options.node);
			if (!this._node) { throw "no dom node for spliiter found"; } //$NON-NLS-0$
			this._sideNode = nodeFromOption(options.sidePanel);
			if (!this._sideNode) { throw "no dom node for side panel found"; } //$NON-NLS-0$
			this._mainNode = nodeFromOption(options.mainPanel);
			if (!this._mainNode) { throw "no dom node for main panel found"; } //$NON-NLS-0$
		
			dojo.place("<div id='splitThumb' class='splitThumb splitThumbLayout'></div>", this._node, "only"); //$NON-NLS-0$ //$NON-NLS-1$
			this._initializeFromStoredSettings();
			this._thumb = dojo.query("#splitThumb", this._node)[0]; //$NON-NLS-0$
			
			if (this._closed) {
				this._closed = false;  // _thumbDown will toggle it, so turn it off and then call _thumbDown.
				this._thumbDown();
			} else {
				this._adjustToSplitPosition();
			}
			dojo.style(this._node, {visibility: "visible"}); //$NON-NLS-0$ 
			dojo.style(this._mainNode, {display: "block"}); //$NON-NLS-0$ 
			dojo.style(this._sideNode, {display: "block"}); //$NON-NLS-0$ 
			dojo.connect(this._node, "onmousedown", this, this._mouseDown); //$NON-NLS-0$
			dojo.connect(window, "onmouseup", this, this._mouseUp); //$NON-NLS-0$
			dojo.connect(window, "onresize", this, this._resize);  //$NON-NLS-0$
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
		 * @param {Function} listener The function called when a resize occurs
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
			var pos = dojo.position(this._node);
			this._splitWidth = pos.w;
			if (updateStorage || !this._splitLeft){
				this._splitLeft = pos.x;
				localStorage.setItem(this._prefix+"/xPosition", this._splitLeft);  //$NON-NLS-1$ //$NON-NLS-0$
			}
			dojo.style(this._sideNode, {width: this._splitLeft + "px", right: this._splitLeft - 1 +"px", display: "block"}); //$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$ 
			dojo.style(this._node, {left: this._splitLeft + "px"}); //$NON-NLS-0$ 
			this._resize();
		},
		
		_resize: function(delay) {
			delay = delay || 0;
			var pos = dojo.position(this._node.parentNode);
			this._totalWidth = pos.w;
			pos = dojo.position(this._node);
			dojo.style(this._mainNode, {width: (this._totalWidth - pos.x - pos.w) +"px"}); //$NON-NLS-0$ 
			window.setTimeout(dojo.hitch(this, function() { this._notifyResizeListeners(); }), delay);
		},
		
		_notifyResizeListeners: function() {
			for (var i = 0; i <this._resizeListeners.length; i++) {
				this._resizeListeners[i]();
			}
		}, 
		
		_thumbDown: function() {
			if (this._closed) {
				this._closed = false;
				this._addAnimation();
				dojo.style(this._sideNode, {width: this._splitLeft+"px"}); //$NON-NLS-0$ 
				dojo.style(this._node, {left: this._splitLeft+"px"}); //$NON-NLS-0$
				this._resize(this._animationDelay);
				this._removeAnimation();
			} else {
				this._closed = true;
				this._addAnimation();
				dojo.style(this._sideNode, {width: 0}); 
				dojo.style(this._node, {left: "1px"}); //$NON-NLS-0$ 
				this._resize(this._animationDelay);
				this._removeAnimation();
			}
			localStorage.setItem(this._prefix+"/toggleState", this._closed ? "closed" : null);  //$NON-NLS-1$  //$NON-NLS-0$

		},
		
		_removeAnimation: function() {
			// in a timeout to ensure the animations are complete.
			window.setTimeout(dojo.hitch(this, function() {
				dojo.removeClass(this._sideNode, "sidePanelLayoutAnimation"); //$NON-NLS-0$ 
				dojo.removeClass(this._mainNode, "mainPanelLayoutAnimation"); //$NON-NLS-0$ 
				dojo.removeClass(this._node, "splitLayoutAnimation"); //$NON-NLS-0$ 
				dojo.removeClass(this._thumb, "splitLayoutAnimation"); //$NON-NLS-0$ 
			}), this._animationDelay);
		},
		
		_addAnimation: function() {
			dojo.addClass(this._sideNode, "sidePanelLayoutAnimation"); //$NON-NLS-0$ 
			dojo.addClass(this._mainNode, "mainPanelLayoutAnimation"); //$NON-NLS-0$ 
			dojo.addClass(this._node, "splitLayoutAnimation"); //$NON-NLS-0$ 
			dojo.addClass(this._thumb, "splitLayoutAnimation"); //$NON-NLS-0$ 
		},
		
		_mouseDown: function(event) {
			if (event.target === this._thumb) {
				return this._thumbDown(event);
			}
			if (this._tracking) {
				return;
			}
			dojo.addClass(this._node, "splitTracking"); //$NON-NLS-0$
			dojo.addClass(this._mainNode, "panelTracking"); //$NON-NLS-0$
			dojo.addClass(this._sideNode, "panelTracking"); //$NON-NLS-0$
			this._tracking = dojo.connect(window, "onmousemove", this, this._mouseMove); //$NON-NLS-0$
		},
		
		_mouseMove: function(event) {
			if (this._tracking) {
				this._splitLeft = event.clientX;
				dojo.style(this._node, {left: event.clientX + "px"}); //$NON-NLS-0$ 
				this._adjustToSplitPosition(true);
				stop(event);
			}
		},
		
		_mouseUp: function(event) {
			if (this._tracking) {
				dojo.disconnect(this._tracking);
				this._tracking = null;
				dojo.removeClass(this._node, "splitTracking"); //$NON-NLS-0$
				dojo.removeClass(this._mainNode, "panelTracking"); //$NON-NLS-0$
				dojo.removeClass(this._sideNode, "panelTracking"); //$NON-NLS-0$
			}
		}
	};
	Splitter.prototype.constructor = Splitter;
	//return the module exports
	return {Splitter: Splitter};
});