/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define([
	'orion/objects',
	'orion/webui/littlelib',
	'text!orion/webui/RichDropdown.html',
	'orion/webui/dropdown'
], function(
	objects, lib, RichDropdownTemplate, mDropdown
) {
	/**
	 * Creates a generic RichDropdown which can be appended to any dom node.
	 * 
	 * This RichDropdown is designed to have interchangeable content. Content
	 * providers should extend the @ref orion.webui.RichDropdownViewMode class.
	 * 
	 * @param {DOMNode} options.parentNode The DOM node which this rich dropdown will be appended to
	 * @param {Function} options.populateFunction The function which will populate the dropdown when it is opened (see @ref orion.webui.dropdown)	 
	 * @param {String} options.buttonName Optional. A string to display on the dropdown trigger button.
	 * @param {DOMNode} options.buttonDecorator Optional. A DOM node will be inserted into the dropdown trigger button as a decorator.
	 * @param {Boolean} options.noDropdownArrow Optional. A boolean indicating that the dropdown arrow should be omitted from the dropdown trigger button.
	 */
	function RichDropdown(options) {
		this._parentNode = options.parentNode;
		this._buttonName = options.buttonName;
		this._buttonDecorator = options.buttonDecorator;
		this._populateFunction = options.populateFunction;
		this._noDropdownArrow = options.noDropdownArrow;
		this._initialize();
	}

	objects.mixin(RichDropdown.prototype, /** @lends orion.webui.RichDropdown.prototype */ {
		_initialize: function() {
			var wrapperNode = lib.createNodes(RichDropdownTemplate);
			
			this._dropdownTriggerButton = lib.$("button.dropdownTrigger", wrapperNode);
			this._dropdownTriggerButtonLabel = lib.$(".dropdownTriggerButtonLabel", this._dropdownTriggerButton);
			
			this._dropdownNode = lib.$("ul.dropdownMenu", wrapperNode);
			
			if (this._buttonName) {
				this.setDropdownTriggerButtonName(this._buttonName, this._buttonDecorator);
			}
			
			var dropdownArrow = lib.$(".dropdownArrowDown", this._dropdownTriggerButton);
			if (this._noDropdownArrow) {
				this._dropdownTriggerButton.removeChild(dropdownArrow);
			} else {
				this._dropdownButtonArrow = dropdownArrow;
			}
						
			this._parentNode.appendChild(this._dropdownTriggerButton);
			this._parentNode.appendChild(this._dropdownNode);
			
			this._dropdownTriggerButton.dropdown = new mDropdown.Dropdown({dropdown: this._dropdownNode, populate: this._populateFunction});
		},
		
		/**
		 * @return {DOMNode} The DOM node of this dropdown's trigger button
		 */
		getDropdownTriggerButton: function() {
			return this._dropdownTriggerButton;
		},
		
		/**
		 * Sets the text label displayed in this dropdown's trigger button
		 * @param {String} name The string to display on the dropdown trigger button.
		 * @param {DOMNode} decorator Optional. A dom node which will be placed in front of the button name.
		 */
		setDropdownTriggerButtonName: function(name, decorator) {
			lib.empty(this._dropdownTriggerButtonLabel);
			
			if (decorator) {
				this._dropdownTriggerButtonLabel.appendChild(decorator);
			}
			
			var nameNode = document.createTextNode(name);
			this._dropdownTriggerButtonLabel.appendChild(nameNode);
			
			this._dropdownTriggerButton.title = name;
		},
		
		/**
		 * @return {orion.webui.dropdown.Dropdown} This rich dropdown's generic dropdown javascript object
		 */
		getDropdown: function() {
			return this._dropdownTriggerButton.dropdown;
		}
	});
	

	return {
		RichDropdown: RichDropdown
	};
});
