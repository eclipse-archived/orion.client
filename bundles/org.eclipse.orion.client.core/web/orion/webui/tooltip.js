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
	 * Attaches tooltip behavior to a given node.  The tooltip will be assigned class "tooltip" which can be
	 * used to control appearance.  Uses the "CSS Triangle Trick" 
	 * http://css-tricks.com/snippets/css/css-triangle/
	 * for the tooltip shape and CSS transitions for fade in and fade out.
	 * @param {Object} options The options object, which must minimally specify the tooltip dom node
	 * @param options.node The node showing the tooltip.  Required.
	 * @param options.text The text in the tooltip.  Required.
	 * @param options.position A String specifying the position of the tooltip relative to its node.  Can be one
	 * of "left", "right", "above", or "below".  Optional.  Defaults to "right".
	 * @param options.showDelay Specifies the number of millisecond delay before the tooltip begins to appear.
	 * Optional.  Defaults to 1000.
	 * @param options.hideDelay Specifies the number of millisecond delay before the tooltip begins to disappear.
	 * Optional.  Defaults to 200.
	 * @param options.tailSize Specifies the number of pixels to allocate for the tail.  Optional.  Defaults to 8.
	 * @name orion.webui.tooltip.Tooltip
	 *
	 */
	function Tooltip(options) {
		this._init(options);
	}
	Tooltip.prototype = /** @lends orion.webui.tooltip.Tooltip.prototype */ {
			
		_init: function(options) {
			this._node = lib.node(options.node);
			if (!this._node) { throw "no dom node for tooltip found"; } //$NON-NLS-0$
			this._position = options.position || "right"; //$NON-NLS-0$
			this._text = options.text;
			this._showDelay = options.showDelay || 1000;
			this._hideDelay = options.hideDelay || 200;
			this._tailSize = options.tailSize || 8;
			
			var self = this;
			
			// set up events
			this._node.addEventListener("mouseover", function(event) { //$NON-NLS-0$
				if (event.target === self._node) {
					self.show();
					lib.stop(event);
				}
			}, false);

			this._node.addEventListener("mouseout", function(event) { //$NON-NLS-0$
				if (event.target === self._node) {
					self.hide();
					lib.stop(event);
				}
			}, false);
			
		},
		
		_tipNode: function() {
			if (!this._tip) {
				this._tip = document.createElement("div"); //$NON-NLS-0$
				this._tip.classList.add("tooltip"); //$NON-NLS-0$
				this._tip.classList.add(this._position);
				var textNode = document.createTextNode(this._text);
				this._tip.appendChild(textNode);
				document.body.appendChild(this._tip);
			}
			return this._tip;
		},
		
		_positionTip: function() {
			this._tipNode();  // lazy initialize
			var rect = lib.bounds(this._node);
			var tipRect = lib.bounds(this._tip);
			var top, left;
			
			switch (this._position) {
				case "above": //$NON-NLS-0$
					top = rect.top - tipRect.height - this._tailSize - 1;
					left = rect.left;
					break;
				case "below": //$NON-NLS-0$
					top = rect.top + rect.height + this._tailSize + 1;
					left = rect.left;
					break;
				case "left": //$NON-NLS-0$
					top = rect.top + ((rect.height - tipRect.height) / 2);
					left = rect.left - tipRect.width - this._tailSize - 1;
					break;
				default:  // right
					top = rect.top + ((rect.height - tipRect.height) / 2);
					left = rect.left + rect.width + this._tailSize + 1;
					break;
			}
			var totalRect = lib.bounds(document.documentElement);
			if (top + tipRect.height > totalRect.height) {
				top = totalRect.height - tipRect.height - 1;
			}
			if (left + tipRect.width > totalRect.width) {
				left = totalRect.width - tipRect.width - 1;
			}
			this._tip.style.top = top + "px"; //$NON-NLS-0$
			this._tip.style.left = left + "px"; //$NON-NLS-0$ 
		},
		
		/**
		 * Toggle the show/hide state of the tooltip.
		 */			
		toggle: function(event) {
			if (this._triggerNode.classList.contains("tooltipShowing")) { //$NON-NLS-0$
				this.show();
			} else {
				this.hide();
			}
		},
		
		/**
		 * Show the tooltip.
		 */			
		show: function() {
			var self = this;
			if (this._timeout) {
				window.clearTimeout(this._timeout);
				this._timeout = null;
			}
			this._timeout = window.setTimeout(function() {
				self._positionTip();
				self._tipNode().classList.add("tooltipShowing"); //$NON-NLS-0$
			}, this._showDelay);
		},
		
		/**
		 * Hide the tooltip.
		 */			
		hide: function(restoreFocus) {
			var self = this;
			if (this._timeout) {
				window.clearTimeout(this._timeout);
				this._timeout = null;
			}
			this._timeout = window.setTimeout(function() {
				self._tipNode().classList.remove("tooltipShowing"); //$NON-NLS-0$
			}, this._hideDelay);
		}
	};
	Tooltip.prototype.constructor = Tooltip;
	//return the module exports
	return {Tooltip: Tooltip};
});