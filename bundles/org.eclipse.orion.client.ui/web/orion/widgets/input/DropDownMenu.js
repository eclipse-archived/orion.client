/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global window console define localStorage*/
/*jslint browser:true*/

define(['orion/objects', 'orion/webui/littlelib'], function(objects, lib) {

	/**
	 * Creates a dropdown menu for a node and its associated trigger node (button)
	 * @param {Object} parent The dom object or string id of the node that will contain the dropdown menu
	 * @param {Object} triggerNode The dom object or string id of the dom node that will trigger the dropdown menu appearance
	 * @param {String} [selectionClass] CSS class to be appended when the trigger node is selected. Optional.
	 */
	function DropDownMenu( parent, triggerNode, selectionClass, noClick ){
		var node = lib.node(parent);
		if (node) {
			this._parent = node;
		} else {
			throw new Error("Parent node of dropdown menu not found"); //$NON-NLS-0$
		}
		
		// Assign dynamic ids to the dropdown menu node to support multiple drop down menus in the same page
		this.navDropDownId = this._parent.id + '_navdropdown'; //$NON-NLS-0$
		this.selectionClass = selectionClass;
		
		// Create dropdown container and append to parent dom
		var dropDownContainer = document.createElement("div"); //$NON-NLS-0$
		dropDownContainer.classList.add("dropDownContainer"); //$NON-NLS-0$
		dropDownContainer.id = this.navDropDownId; 
		dropDownContainer.style.display = 'none'; //$NON-NLS-0$
		this._parent.appendChild(dropDownContainer);
		this._dropdownMenu = dropDownContainer;
		
		// Display trigger node and bind on click event
		triggerNode = lib.node(triggerNode);
		if (triggerNode) {
			this._triggerNode = triggerNode;
		} else {
			throw "Trigger node of dropdown menu not found"; //$NON-NLS-0$
		}
		if (this._triggerNode.style.visibility === 'hidden') { //$NON-NLS-0$
			this._triggerNode.style.visibility = 'visible'; //$NON-NLS-0$
		}
		if (!noClick) {
			this._triggerNode.onclick = this.click.bind(this);
		}
	}
	
	objects.mixin(DropDownMenu.prototype, {
		click: function() {
			if( this._dropdownMenu.style.display === 'none' ){ //$NON-NLS-0$
				this.updateContent ( this.getContentNode() , function () {
					this._dropdownMenu.style.display = '';
					this._positionDropdown();
					if (this.selectionClass) {
						this._triggerNode.classList.add(this.selectionClass);
					}
					this.handle = lib.addAutoDismiss( [ this._triggerNode, this._dropdownMenu], this.clearPanel.bind(this) );
				}.bind(this));
			}else{
				this.clearPanel();
			}
		},
		
		clearPanel: function(){
			this._dropdownMenu.style.display = 'none'; //$NON-NLS-0$
			if (this.selectionClass) {
				this._triggerNode.classList.remove(this.selectionClass);
			}
		},
		
		// Add content to the dropdown container
		addContent: function( content ){
			this._dropdownMenu.innerHTML = content;
		},
		
		getContentNode: function(){
			return this._dropdownMenu;
		},
		
		updateContent: function( contentNode, callback ){
			// to be overridden to update the contents before showing
			// the callback needs to be called once the content is up to date
			callback();
		},

		_positionDropdown: function() {
			this._dropdownMenu.style.left = "";
			var bounds = lib.bounds(this._dropdownMenu);
			var totalBounds = lib.bounds(this._boundingNode(this._parent));
			if (bounds.left + bounds.width > (totalBounds.left + totalBounds.width)) {
				this._dropdownMenu.style.right = 0;
			}
		},
		
		_boundingNode: function(node) {
			if (node.style.right !== "" || node.style.position === "absolute" || !node.parentNode || !node.parentNode.style) { //$NON-NLS-1$ //$NON-NLS-0$
				return node;
			}
			return this._boundingNode(node.parentNode);
		},
		
		isDestroyed: function() {
			return !this._dropdownMenu.parentNode;
		},

		destroy: function() {
			if (this._parent) {
				lib.empty(this._parent);
				this._parent = this.select = null;
			}
		}
	});
	
	return DropDownMenu;
});
