/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit dojox widgets*/
/*jslint browser:true */



define(['dojo', 'dijit', 'dojox', 'dijit/Dialog', 'dojo/data/ItemFileReadStore', 'dojo/io/iframe', 'dojox/form/FileUploader', 'dijit/form/Button', 'dijit/ProgressBar', 'orion/widgets/_OrionDialogMixin', 'text!orion/widgets/templates/ImportDialog.html'], function(dojo, dijit, dojox) {

/**
 */
dojo.declare("orion.widgets.ImportDialog", [ dijit.Dialog, orion.widgets._OrionDialogMixin ], {
	widgetsInTemplate : true,
	templateString : dojo.cache(new dojo._Url("/orion/widgets/templates/ImportDialog.html")),

	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = "Import from zip";
	},
	postCreate : function() {
		this.inherited(arguments);
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
	execute : function() {

	}
});

});