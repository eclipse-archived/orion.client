/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/* global dojo dijit */
/* jslint browser:true */
dojo.provide("widgets.ImportDialog");

dojo.require("dijit.Dialog");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojo.io.iframe");
dojo.require("dojox.form.FileUploader");
dojo.require("dijit.form.Button");
dojo.require("dijit.ProgressBar");

/**
 */
dojo.declare("widgets.ImportDialog", [ dijit.Dialog ], {
	widgetsInTemplate : true,
	templateString : dojo.cache("widgets", "templates/ImportDialog.html"),

	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = this.options.title || "No title";
		this.itemNameLabelText = this.options.label || "Name:";
		this.buttonCancel = "Cancel";
	},
	postCreate : function() {
		this.inherited(arguments);
		dojo.connect(this, "onKeyPress", dojo.hitch(this, function(evt) {
			if (evt.keyCode === dojo.keys.ENTER) {
				this.domNode.focus(); // FF throws DOM error if textfield is
										// focused after dialog closes
				this._onSubmit();
			}
		}));

		this.refocus = false; // Dojo 10654

		var h = new dojox.form.FileUploader({
			isDebug : false,
			hoverClass : "uploadHover",
			activeClass : "uploadPress",
			disabledClass : "uploadDisabled",
			fileMask : ["Zip", "*.zip"],
			force : "html",
			showProgress : true,
			progressWidgetId : "importDialogProgressBar",
			selectMultipleFiles : false,
			fileListId : "importDialogFilesList"
		}, "importDialogSelectButton");

		dojo.connect(dijit.byId("hSubmit"), "onClick", dojo.hitch(this, function() {
			h.uploadUrl = dojo.moduleUrl("dojox.form", this.options.importLocation);
			h.submit(dojo.byId("importDialogForm"));
		}));
		dojo.connect(h, "onComplete", function(dataArray) {
		});
	},
	onHide : function() {
		// This assumes we don't reuse the dialog
		this.inherited(arguments);
		setTimeout(dojo.hitch(this, function() {
			this.destroyRecursive(); // TODO make sure this removes DOM
										// elements
		}), this.duration);
	},
	// Stuff from ImportDialog.js is below
	execute : function() {

	}
});