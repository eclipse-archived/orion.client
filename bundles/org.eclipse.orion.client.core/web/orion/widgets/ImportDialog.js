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

define(['dojo', 'dijit', 'dojox', 'dijit/Dialog', 'dojo/data/ItemFileReadStore', 'dojox/form/Uploader', 'dojox/form/uploader/FileList', 'dojox/form/uploader/plugins/IFrame', 'dijit/form/Button', 'dijit/ProgressBar', 'orion/widgets/_OrionDialogMixin', 'text!orion/widgets/templates/ImportDialog.html'], function(dojo, dijit, dojox) {

/**
 */
dojo.declare("orion.widgets.ImportDialog", [ dijit.Dialog, orion.widgets._OrionDialogMixin ], {
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'widgets/templates/ImportDialog.html'), //new dojo._Url("/orion/widgets/templates/ImportDialog.html")),

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
		dojo.byId("importDialog.myForm").action = this.options.importLocation;
		dojo.byId("importDialog.uploader").url = this.options.importLocation;

		var self = this;
		
		dojo.connect(dijit.byId("importDialog.uploader"), "onError", dojo.hitch(this, function(dataArray) {
			setTimeout(dojo.hitch(this, function(){
				this.hide();
			}), 2000);		
		}));
	
		dojo.connect(dijit.byId("importDialog.uploader"), "onComplete", dojo.hitch(this, function(dataArray) {
			setTimeout(dojo.hitch(this, function(){
				this.hide();
				this.options.func();
			}), 2000);		
		}));
	}
});
});