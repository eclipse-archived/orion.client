/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit dojox widgets*/
/*jslint browser:true */

define(['i18n!git/nls/gitmessages', 'dojo', 'dijit', 'dojox', 'dijit/Dialog', 'dojo/data/ItemFileReadStore', 'dojox/form/Uploader', 'dojox/form/uploader/FileList', 'dojox/form/uploader/plugins/IFrame', 'dijit/form/Button', 'dijit/ProgressBar', 'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/ApplyPatchDialog.html'], function(messages, dojo, dijit, dojox) {

/**
 */
dojo.declare("orion.git.widgets.ApplyPatchDialog", [ dijit.Dialog, orion.widgets._OrionDialogMixin ], { //$NON-NLS-0$
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'git/widgets/templates/ApplyPatchDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$

	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = messages["Apply Patch"];
	},
	postCreate : function() {
		this.inherited(arguments);		
		dojo.byId("applyPatchDialog.myForm").action = this.options.diffLocation; //$NON-NLS-0$
		dojo.byId("applyPatchDialog.uploader").url = this.options.diffLocation; //$NON-NLS-0$

		var self = this;

		function toogle(disableFile) {
			dijit.byId("files").set("disabled", disableFile); //$NON-NLS-1$ //$NON-NLS-0$
			dijit.byId("applyPatchDialog.uploader").set("disabled", disableFile); //$NON-NLS-1$ //$NON-NLS-0$
			dijit.byId("applyPatchDialog.url").set("disabled", !disableFile); //$NON-NLS-1$ //$NON-NLS-0$
		}
		toogle(true);

		dojo.connect(dijit.byId("applyPatchDialog.urlRadio"), "onclick", dojo.hitch(this, function(dataArray) { //$NON-NLS-1$ //$NON-NLS-0$
			if (dataArray.target.id === "applyPatchDialog.urlRadio") //$NON-NLS-0$
				toogle(true);
		}));

		dojo.connect(dijit.byId("applyPatchDialog.fileRadio"), "onclick", dojo.hitch(this, function(dataArray) { //$NON-NLS-1$ //$NON-NLS-0$
			if (dataArray.target.id === "applyPatchDialog.fileRadio") //$NON-NLS-0$
				toogle(false);
		}));

		dojo.connect(dijit.byId("applyPatchDialog.uploader"), "onError", dojo.hitch(this, function(dataArray) { //$NON-NLS-1$ //$NON-NLS-0$
			setTimeout(dojo.hitch(this, function(){
				this.hide();
			}), 2000);		
		}));
	
		dojo.connect(dijit.byId("applyPatchDialog.uploader"), "onComplete", dojo.hitch(this, function(dataArray) { //$NON-NLS-1$ //$NON-NLS-0$
			setTimeout(dojo.hitch(this, function(){
				this.hide();
			}), 2000);		
		}));
		
		// Stop the dialog from submitting if trying to activate the upload button with a keyboard.
		// See https://bugs.eclipse.org/bugs/show_bug.cgi?id=370969
		
		dojo.connect(dijit.byId("applyPatchDialog.uploader"), "onKeyPress", function(evt) { //$NON-NLS-1$ //$NON-NLS-0$
			if(evt.keyCode === dojo.keys.ENTER) {
				evt.stopPropagation();
			}
		});
	}
});
});