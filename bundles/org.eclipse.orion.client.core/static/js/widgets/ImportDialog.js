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
		this.title = "Import from zip";
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
			uploadUrl : this.options.importLocation,
			force : "html",
			showProgress : true,
			selectMultipleFiles : false,
			progressWidgetId : this.importDialogProgressBar.id,
			fileListId : this.importDialogFilesList.id,
			destroy : function(){ /* workaround for error in FileUploader#destroy */ }
		}, this.importDialogSelectButton.id);

		dojo.connect(this.importButton, "onClick", dojo.hitch(this, function() {
			h.upload();
		}));
		
		dojo.connect(h, "onError", dojo.hitch(this, function(dataArray) {
			this.hide();
		}));
		
		dojo.connect(h, "onComplete", dojo.hitch(this, function(dataArray) {
			this.hide();
			this.options.func();
		}));
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