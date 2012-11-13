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
	 * have the same parent.  Trigger has "dropdownTrigger" class, node has "dropdownMenu" class,
	 * and common parent has "dropdown" class.
	 * @param {Object} options The options object, which must minimally specify the dropdown dom node
	 * @param options.dropdown The node for the dropdown presentation.  Required.
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
			this._triggerNode.addEventListener("click", this.toggle.bind(this), false); //$NON-NLS-0$
			this._dropdownNode.addEventListener("keydown", this._dropdownKeyDown.bind(this), false); //$NON-NLS-0$
		},
		
		/**
		 * Toggle the open/closed state of the dropdown.
		 */			
		toggle: function() {
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
		close: function() {
			this._triggerNode.classList.remove("dropdownTriggerOpen"); //$NON-NLS-0$
			this._dropdownNode.classList.remove("dropdownMenuOpen"); //$NON-NLS-0$
			this._triggerNode.focus();
		},
		
		/**
		 *
		 */
		getItems: function() {
			return lib.$$array(".dropdownMenu li:not(.dropdownSeparator) a", this._dropdownNode); //$NON-NLS-0$
		},
		
		/**
		 *
		 */
		empty: function() {
			var items = lib.$$array(".dropdownMenu li", this._dropdownNode); //$NON-NLS-0$
			for (var i=0; i<items.length; i++) {
				this._dropdownNode.removeChild(items[i]);
			}
		},
		
		/**
		 *
		 */
		_getFocusItem: function() {
			return lib.$(".dropdownMenu li:not(.dropdownSeparator) a:focus", this._dropdownNode.parentNode); //$NON-NLS-0$
		},
		 
		/**
		 * A key is down in the dropdown node
		 */
		 _dropdownKeyDown: function(event) {
			if (event.keyCode === lib.KEY.UP || event.keyCode === lib.KEY.DOWN) {
				var items = this.getItems();
				var focusItem = this._getFocusItem();
				if (items.length && items.length > 0 && focusItem) {
					var index = items.indexOf(focusItem);
					if (event.keyCode === lib.KEY.UP && index > 0) {
						index--;
					} else if (event.keyCode === lib.KEY.DOWN && index < items.length - 1) {
						index++;
					}
					items[index].focus();
				}
				lib.stop(event);
			} else if (event.keyCode === lib.KEY.ESCAPE) {
				this.close();
			}
		 }
	};
	Dropdown.prototype.constructor = Dropdown;
	//return the module exports
	return {Dropdown: Dropdown};
});