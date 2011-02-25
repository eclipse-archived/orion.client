/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit*/
/*jslint browser:true*/
dojo.provide("widgets.SiteConfigEditor");

dojo.require("dijit.Dialog");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.ComboBox");
dojo.require("dojo.data.ItemFileReadStore");

/**
 * @param options {
 *    title {String} Title for the dialog
 * }
 */
dojo.declare("widgets.NewItemDialog", [dijit.Dialog], {
	widgetsInTemplate: true,
	templateString: dojo.cache("widgets", "templates/SiteConfigEditor.html"),
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = this.options.title || "No title";
		this.siteConfigNamelabelText = "";
		this.buttonCancel = "Cancel";
	},
	postCreate: function() {
		this.inherited(arguments);
		dojo.connect(this, "onKeyPress", dojo.hitch(this, function(evt) {
			if (evt.keyCode === dojo.keys.ENTER) {
				this.domNode.focus(); // FF throws DOM error if textfield is focused after dialog closes
				this._onSubmit();
			}
		}));
		
		if (this.options.advanced) {
			this.itemAdvancedInfo.style.display = "table-row";
			this.itemAdvancedInfo1.style.display = "table-row";
			this.protocol.set('value', 'file');
			dojo.connect(this.protocol, "onChange", dojo.hitch(this, this.onModuleChange));
			dojo.connect(this.itemURL, "onkeyup", dojo.hitch(this, this.onURLChange));
		} else {
			this.itemAdvancedInfo.style.display = "none";
			this.itemAdvancedInfo1.style.display = "none";
		}
		
		this.refocus = false; // Dojo 10654
	},
	onHide: function() {
		// This assumes we don't reuse the dialog
		this.inherited(arguments);
		setTimeout(dojo.hitch(this, function() {
			this.destroyRecursive(); // TODO make sure this removes DOM elements
		}), this.duration);
	}
});