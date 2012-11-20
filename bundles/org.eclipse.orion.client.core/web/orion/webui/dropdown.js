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
	 * Attaches dropdown behavior to a given node.  Assumes the triggering node and dropdown node
	 * have the same parent.  Trigger should have "dropdownTrigger" class, and the dropdown node should 
	 * have "dropdownMenu" class.
	 * @param {Object} options The options object, which must minimally specify the dropdown dom node
	 * @param options.dropdown The node for the dropdown presentation.  Required.
	 * @param options.populate A function that should be called to populate the dropdown before it
	 * opens each time.  Optional.
	 * @name orion.webui.dropdown.Dropdown
	 *
	 */
	function Dropdown(options) {
		this._init(options);		
	}
	Dropdown.prototype = /** @lends orion.webui.dropdown.Dropdown.prototype */ {
			
		_init: function(options) {
			this._dropdownNode = lib.node(options.dropdown);
			if (!this._dropdownNode) { throw "no dom node for dropdown found"; } //$NON-NLS-0$
			this._triggerNode = lib.$(".dropdownTrigger", this._dropdownNode.parentNode); //$NON-NLS-0$
			if (!this._triggerNode) { throw "no dom node for dropdown trigger found"; } //$NON-NLS-0$
			this._populate = options.populate;
			var self = this;
			
			// click on trigger opens.
			this._triggerNode.addEventListener("click", function(event) { //$NON-NLS-0$
				self.toggle();
				lib.stop(event);
			}, false);
			
			// if trigger node is not key enabled...
			if (this._triggerNode.tagName.toLowerCase() === "span") { //$NON-NLS-0$
				this._triggerNode.addEventListener("keydown", function(event) { //$NON-NLS-0$
					if (event.keyCode === lib.KEY.ENTER || event.charCode === lib.KEY.SPACE) {
						self.toggle();
						lib.stop(event);
					}
				}, false);
			}
			
			// auto dismissal.  Click anywhere else means close.
			document.addEventListener("click", function(event) { //$NON-NLS-0$
				if (event.target !== self._triggerNode && !lib.contains(self._dropdownNode, event.target)) {
					self.close(); 
				}
				// don't stop event
			}, true); //$NON-NLS-0$
			
			// keys
			this._dropdownNode.addEventListener("keydown", this._dropdownKeyDown.bind(this), false); //$NON-NLS-0$
			
		},
		
		/**
		 * Toggle the open/closed state of the dropdown.
		 */			
		toggle: function(event) {
			if (this._triggerNode.classList.contains("dropdownTriggerOpen")) { //$NON-NLS-0$
				this.close();
			} else {
				this.open();
			}
		},
		
		/**
		 * Open the dropdown.
		 */			
		open: function() {
			if (this._populate) {
				this.empty();
				this._populate(this._dropdownNode);
			}
			var items = this.getItems();
			if (items.length > 0) {
				this._triggerNode.classList.add("dropdownTriggerOpen"); //$NON-NLS-0$
				this._dropdownNode.classList.add("dropdownMenuOpen"); //$NON-NLS-0$
				items[0].focus();
			}
		},
		
		/**
		 * Close the dropdown.
		 */			
		close: function(restoreFocus) {
			this._triggerNode.classList.remove("dropdownTriggerOpen"); //$NON-NLS-0$
			this._dropdownNode.classList.remove("dropdownMenuOpen"); //$NON-NLS-0$
			if (restoreFocus) {
				this._triggerNode.focus();
			}
		},
		
		/**
		 *
		 */
		getItems: function() {
			var items = lib.$$array("li:not(.dropdownSeparator) > .dropdownMenuItem", this._dropdownNode, true); //$NON-NLS-0$
			// We only want the direct li children, not any descendants.  But we can't preface a query with ">"
			// So we do some reachy filtering here.
			var filtered = [];
			for (var i=0; i<items.length; i++) {
				if (items[i].parentNode.parentNode === this._dropdownNode) {
					filtered.push(items[i]);
				}
			}
			return filtered;
		},
		
		/**
		 *
		 */
		empty: function() {
			var items = lib.$$array("li", this._dropdownNode); //$NON-NLS-0$
			// We only want the direct li children, not any descendants. 
			for (var i=0; i<items.length; i++) {
				if (items[i].parentNode === this._dropdownNode) {
					items[i].parentNode.removeChild(items[i]);
				}
			}
		},
		
		 
		/**
		 * A key is down in the dropdown node
		 */
		 _dropdownKeyDown: function(event) {
			if (event.keyCode === lib.KEY.UP || event.keyCode === lib.KEY.DOWN || event.keyCode === lib.KEY.RIGHT || event.keyCode === lib.KEY.ENTER || event.keyCode === lib.KEY.LEFT) {
				var items = this.getItems();	
				var focusItem = document.activeElement;
				if (items.length && items.length > 0 && focusItem) {
					var index = items.indexOf(focusItem);
					if (index >= 0) {
						if (event.keyCode === lib.KEY.UP && index > 0) {
							index--;
							items[index].focus();
						} else if (event.keyCode === lib.KEY.DOWN && index < items.length - 1) {
							index++;
							items[index].focus();
						} else if (event.keyCode === lib.KEY.ENTER || event.keyCode === lib.KEY.RIGHT) {
							if (focusItem.classList.contains("dropdownTrigger") && focusItem.dropdown) { //$NON-NLS-0$
								focusItem.dropdown.open();
								lib.stop(event);
							}
						} else if (event.keyCode === lib.KEY.LEFT && focusItem.parentNode.parentNode.classList.contains("dropdownMenuOpen")) { //$NON-NLS-0$
							this.close(true);
						}
					}
				}
				lib.stop(event);
			} else if (event.keyCode === lib.KEY.ESCAPE) {
				this.close(true);
				lib.stop(event);
			}
		 }
	};
	Dropdown.prototype.constructor = Dropdown;
	//return the module exports
	return {Dropdown: Dropdown};
});