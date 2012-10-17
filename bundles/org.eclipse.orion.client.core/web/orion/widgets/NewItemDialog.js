/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets*/
/*jslint browser:true*/


define(['i18n!orion/widgets/nls/messages', 'dojo', 'dijit', 'dijit/Dialog', 'dijit/form/CheckBox', 'dijit/form/CheckBox', 'dijit/form/Form', 'dijit/form/ValidationTextBox', 'dojo/data/ItemFileReadStore',  'orion/widgets/_OrionDialogMixin', 'text!orion/widgets/templates/NewItemDialog.html'], function(messages, dojo, dijit) {

/**
 * @param options {{ 
 *     title: string,
 *     label: string,
 *     func: function,
 *     [advanced]: boolean  // Whether to show advanced controls. Default is false
 * }}
 */
dojo.declare("orion.widgets.NewItemDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], { //$NON-NLS-0$
	widgetsInTemplate: true,
	templateString: dojo.cache('orion', 'widgets/templates/NewItemDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
	
	constructor : function() {
		//this.inherited(arguments);
		this.options = arguments[0] || {};
		this.options.advanced = this.options.advanced || false;
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.itemNameLabelText = this.options.label || messages['Name:'];
	},
	postCreate: function() {
		this.inherited(arguments);

		if (this.options.advanced) {
			this.itemAdvancedInfo.style.display = "table-row"; //$NON-NLS-0$
			this.itemAdvancedInfo1.style.display = "table-row"; //$NON-NLS-0$
			dojo.connect(this.itemURL, "onkeyup", null, dojo.hitch(this, this.onURLChange)); //$NON-NLS-0$
		} else {
			this.itemAdvancedInfo.style.display = "none"; //$NON-NLS-0$
			this.itemAdvancedInfo1.style.display = "none"; //$NON-NLS-0$
		}
	},

	// Stuff from newItemDialog.js is below
	execute: function() {
		var url, create;
		this.newItemButton.focus();
		if (this.options.advanced) {
			url = this.itemURL.value.replace(/^\s+|\s+$/g, '');
			if (this.createCheckbox.get('disabled')) { //$NON-NLS-0$
				create = false;
			} else {
				create = this.createCheckbox.get('checked'); //$NON-NLS-0$
			}
		}
		this.options.func(this.itemName.value, (url && url !== "") ? url : undefined, create);
	},
	onURLChange : function(evt) {
		var url = this.itemURL.value;
		if (url.match(new RegExp("^file://"))) { //$NON-NLS-0$
			this.createCheckbox.set('disabled', false); //$NON-NLS-0$
			return;
		}
		var remoteRegExp = new RegExp('^[a-zA-Z][a-zA-Z]+\:\/\/.+'); //$NON-NLS-0$
		if (url.match(remoteRegExp)) {
			this.createCheckbox.set('disabled', true); //$NON-NLS-0$
			return;
		} else {
			this.createCheckbox.set('disabled', false); //$NON-NLS-0$
			return;
		}
	}
});

});