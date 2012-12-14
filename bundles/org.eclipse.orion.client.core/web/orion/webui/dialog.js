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

define(['i18n!orion/widgets/nls/messages', 'require', 'orion/webui/littlelib'], 
		function(messages, require, lib) {
	/**
	 * Usage: Not instantiated by clients.  The prototype is used elsewhere.
	 * 
	 * @name orion.webui.Dialog
	 */
	function Dialog() {
	}

	Dialog.prototype = /** @lends orion.webui.Dialog.prototype */ {
		CONTAINERTEMPLATE:		
		'<div class="dialog">' + //$NON-NLS-0$
			'<div class="dialogTitle layoutBlock"><span id="title" class="dialogTitleText layoutLeft"></span><span tabindex="0" role="button" aria-label="Close" class="dialogDismiss layoutRight core-sprite-close imageSprite" id="closeDialog"></span></div>' + //$NON-NLS-0$
			'<div class="layoutBlock"><hr/></div>' + //$NON-NLS-0$
			'<div id="dialogContent" class="dialogContent layoutBlock"></div>' + //$NON-NLS-1$ //$NON-NLS-0$
			'<div id="buttons" class="dialogButtons"></div>' + //$NON-NLS-1$ //$NON-NLS-0$
		'</div>', //$NON-NLS-0$

		
		_initialize: function(parent) {
			parent = parent || document.body;
			var range = document.createRange();
			range.selectNode(parent);
			var frameFragment = range.createContextualFragment(this.CONTAINERTEMPLATE);
			parent.appendChild(frameFragment);
			this.$frame = lib.$(".dialog", parent); //$NON-NLS-0$
			if (this._title) {
				lib.$("#title", this.$frame).appendChild(document.createTextNode(this._title)); //$NON-NLS-0$
			}
			this.$close = lib.$("#closeDialog", this.$frame);//$NON-NLS-0$
			var self = this;
			this.$close.addEventListener("click", function(event) { //$NON-NLS-0$
				self.hide();
			}, false);
			// onClick events do not register for spans when using the keyboard without a screen reader
			this.$close.addEventListener("keydown", function (e) { //$NON-NLS-0$
				if(e.keyCode === lib.KEY.ENTER || e.charCode === lib.KEY.SPACE) {
					self.hide();
				}
			}, false);
			this.$frame.addEventListener("keydown", function (e) { //$NON-NLS-0$
				if(e.keyCode === lib.KEY.ESCAPE) {
					self.hide();
				}
			}, false);
			
			this.$parent = lib.$(".dialogContent", parent); //$NON-NLS-0$
			range = document.createRange();
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
		
		_hideDialog: function() {
			this.$frame.classList.remove("dialogShowing"); //$NON-NLS-0$
			var self = this;
			window.setTimeout(function() { self.destroy(); }, 0);
		}, 
		
		_showDialog: function(near) {
			var rect = lib.bounds(this.$frame);
			var totalRect = lib.bounds(document.documentElement);
			var left, top;
			if (near) {
				var refRect = lib.bounds(near);
				top = refRect.top + refRect.height + 4;  // a little below
				left = refRect.left + 4; // a little offset from the left
				if (top + rect.height > totalRect.height) {
					top = Math.max(0, totalRect.height - rect.height - 4);  
				}
				if (left + rect.width > totalRect.width) {
					left = Math.max(0, totalRect.width - rect.width - 4);  
				}
			} else {
				// centered
				left = Math.max(0, (totalRect.width - rect.width) / 2);
				top = Math.max(0, (totalRect.height - rect.height) / 2);
			}
			this.$frame.style.top = top + "px"; //$NON-NLS-0$
			this.$frame.style.left = left + "px"; //$NON-NLS-0$ 
			this.$frame.classList.add("dialogShowing"); //$NON-NLS-0$
		},
		
		destroy: function() {
			document.body.removeChild(this.$frame);
			this.$frame = undefined;
			this.$parent = undefined;
		}
	};
	
	Dialog.prototype.constructor = Dialog;

	//return the module exports
	return {Dialog: Dialog};
});
