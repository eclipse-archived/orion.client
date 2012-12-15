/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*jslint browser:true*/
/*global define orion window */

define(['i18n!orion/widgets/nls/messages', 'require', 'orion/webui/littlelib', 'orion/webui/tooltip'], 
		function(messages, require, lib, tooltip) {
	/**
	 * Usage: Not instantiated by clients.  The prototype is used elsewhere.
	 * 
	 * @name orion.webui.PopupDialog
	 */
	function PopupDialog() {
	}

	PopupDialog.prototype = /** @lends orion.webui.PopupDialog.prototype */ {
		
		_initialize: function(triggerNode) {
			this._tooltip = new tooltip.Tooltip({
				node: triggerNode,
				trigger: "click" //$NON-NLS-0$
			});
			this.$parent = this._tooltip.contentContainer();
			var range = document.createRange();
			range.selectNode(this.$parent);
			var contentFragment = range.createContextualFragment(this.TEMPLATE);
			this.$parent.appendChild(contentFragment);
			this._bindElements(this.$parent);
			this._bindToDom(this.$parent);
		},
		
		_bindElements: function(node) {
			for (var i=0; i<node.childNodes.length; i++) {
				var child = node.childNodes[i];
				if (child.id) {
					this['$'+child.id] = child; //$NON-NLS-0$
				}
				this._bindElements(child);
			}
		},
		
		hide: function() {
			this._tooltip.hide();
		}, 
		
		show: function() {
			this._tooltip.show();
		}
	};
	
	PopupDialog.prototype.constructor = PopupDialog;

	//return the module exports
	return {PopupDialog: PopupDialog};
});
