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
/*jslint browser:true*/
/*global alert confirm orion window widgets eclipse:true serviceRegistry define */
define(['i18n!git/nls/gitmessages', 'dojo', 'dijit', 'dojox', 'dijit/Dialog', 'dojo/data/ItemFileReadStore', 'dojox/form/Uploader', 'dojox/form/uploader/FileList', 
        'dojox/form/uploader/plugins/IFrame', 'dijit/form/Button','dijit/ProgressBar', 'orion/widgets/_OrionDialogMixin', 
        'text!orion/git/widgets/templates/ConfirmPushDialog.html'], function(messages, dojo, dijit,dojox) {


	dojo.declare("orion.git.widgets.ConfirmPushDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], { //$NON-NLS-0$
	widgetsInTemplate: true,
	templateString: dojo.cache('orion', 'git/widgets/templates/ConfirmPushDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = "Git Push";

	},
	postCreate: function() {
		var that = this;
		this.inherited(arguments);
		this.dialog = this.options.dialog;
		var header = dojo.byId("div1");
		var button = dojo.byId("moreButton");
		var dialog2 = this.options.dialog;
		header.appendChild(document.createTextNode("You are going to push to the following remote: " + this.options.location));
		header.appendChild(document.createElement("br"));
		header.appendChild(document.createElement("br"));
		header.appendChild(document.createTextNode(" Click More to push to another remote or OK to push to default"));
		dojo.connect(button,"onclick",function(){
				dialog2.startup();
				dialog2.show();
				that.destroy();
		});
		
	},
	execute: function() {
		this.options.func();
	}
	
});
});