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
/*global window define document */

define(['require', 'dojo'], function(require, dojo) {

	/**
	 * Constructs a new Splitter with the given options.
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
			this._animationDelay = 520;  // longer than CSS transitions in layout.css
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
			// initial position - do we have a pref?  Closed?  Otherwise attach the pieces and make visible.
			this._closed = false;
			var pos = dojo.position(this._node);
			this._splitWidth = pos.w;
			this._splitLeft = pos.x;
			dojo.style(this._sideNode, {width: "auto", right: this._splitLeft - 1 +"px", display: "block"}); //$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$ 
			dojo.style(this._node, {left: this._splitLeft + "px"}); //$NON-NLS-0$ 
			this.resize();
			dojo.style(this._mainNode, {display: "block"}); //$NON-NLS-0$ 
			this._thumb = dojo.query("#splitThumb", this._node)[0]; //$NON-NLS-0$
			dojo.connect(this._node, "onmousedown", this, this.mouseDown); //$NON-NLS-0$
			dojo.connect(this._node, "onmouseup", this, this.mouseUp); //$NON-NLS-0$
			dojo.connect(window, "onresize", this, this.resize);  //$NON-NLS-0$
		},
		
		resize: function(event) {
			var pos = dojo.position(this._node.parentNode);
			this._totalWidth = pos.w;
			pos = dojo.position(this._node);
			dojo.style(this._mainNode, {width: (this._totalWidth - pos.x - pos.w) +"px"}); //$NON-NLS-0$ 
		},
		
		thumbDown: function(event) {
			if (this._closed) {
				this._closed = false;
				this._addAnimation();
				dojo.style(this._sideNode, {width: this._splitLeft+"px"}); //$NON-NLS-0$ 
				dojo.style(this._node, {left: this._splitLeft+"px"}); //$NON-NLS-0$
				this.resize();
				this._removeAnimation();
			} else {
				this._closed = true;
				this._addAnimation();
				dojo.style(this._sideNode, {width: 0}); 
				dojo.style(this._node, {left: "1px"}); //$NON-NLS-0$ 
				this.resize();
				this._removeAnimation();
			}
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
		
		mouseDown: function(event) {
			if (this._tracking) {
				return;
			}
			if (event.target === this._thumb) {
				return this.thumbDown(event);
			}
			dojo.addClass(this._node, "splitTracking"); //$NON-NLS-0$
			this._tracking = dojo.connect(this._node, "onmousemove", this, this.mouseMove); //$NON-NLS-0$
		},
		
		mouseOver: function(event) {
		},
		
		mouseUp: function(event) {
			if (this._tracking) {
				dojo.disconnect(this._tracking);
			}
		}
	};
	Splitter.prototype.constructor = Splitter;
	//return the module exports
	return {Splitter: Splitter};
});