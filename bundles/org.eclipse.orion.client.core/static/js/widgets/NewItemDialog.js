/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets*/
/*jslint browser:true*/


define(['dojo', 'dijit', 'dijit/Dialog', 'dijit/form/CheckBox', 'dijit/form/CheckBox', 'dijit/form/Form', 'dijit/form/ValidationTextBox', 'dojo/data/ItemFileReadStore',  'orion/widgets/_OrionDialogMixin'], function(dojo, dijit) {

/**
 * @param options {{ 
 *     title: string,
 *     label: string,
 *     func: function,
 *     [advanced]: boolean  // Whether to show advanced controls. Default is false
 * }}
 */
dojo.declare("widgets.NewItemDialog", [dijit.Dialog, widgets._OrionDialogMixin], {
	widgetsInTemplate: true,
	templateString: dojo.cache(new dojo._Url("/js/widgets/templates/NewItemDialog.html")),
	
	constructor : function() {
		//this.inherited(arguments);
		this.options = arguments[0] || {};
		this.options.advanced = this.options.advanced || false;
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.itemNameLabelText = this.options.label || "Name:";
	},
	postCreate: function() {
		this.inherited(arguments);

		if (this.options.advanced) {
			this.itemAdvancedInfo.style.display = "table-row";
			this.itemAdvancedInfo1.style.display = "table-row";
			dojo.connect(this.itemURL, "onkeyup", null, dojo.hitch(this, this.onURLChange));
		} else {
			this.itemAdvancedInfo.style.display = "none";
			this.itemAdvancedInfo1.style.display = "none";
		}
	},

	// Stuff from newItemDialog.js is below
	execute: function() {
		var url, create;
		this.newItemButton.focus();
		if (this.options.advanced) {
			url = this.itemURL.value.replace(/^\s+|\s+$/g, '');
			if (this.createCheckbox.get('disabled')) {
				create = false;
			} else {
				create = this.createCheckbox.get('checked');
			}
		}
		this.options.func(this.itemName.value, (url && url !== "") ? url : undefined, create);
	},
	onURLChange : function(evt) {
		var url = this.itemURL.value;
		if (url.match(new RegExp("^file://"))) {
			this.createCheckbox.set('disabled', false);
			return;
		}
		var remoteRegExp = new RegExp('^[a-zA-Z][a-zA-Z]+\:\/\/.+');
		if (url.match(remoteRegExp)) {
			this.createCheckbox.set('disabled', true);
			return;
		} else {
			this.createCheckbox.set('disabled', false);
			return;
		}
	}
});

});