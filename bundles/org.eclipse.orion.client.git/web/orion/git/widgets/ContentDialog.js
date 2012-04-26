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

define(['dojo', 'dijit', 'dojox', 'dijit/Dialog', 'dojo/data/ItemFileReadStore', 'dojox/form/Uploader', 'dojox/form/uploader/FileList', 'dojox/form/uploader/plugins/IFrame', 'dijit/form/Button','dijit/ProgressBar', 'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/ApplyPatchDialog.html'], function(dojo, dijit, dojox) {

/**
 */
dojo.declare("orion.git.widgets.ContentDialog", [ dijit.Dialog, orion.widgets._OrionDialogMixin ], {
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'git/widgets/templates/ContentDialog.html'),

	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = "Content";
	},
	
	postCreate : function() {
		var that = this;
		this.inherited(arguments);
		var sectionsDiv = dojo.byId("div1");
		var sections =  dojo.query(".sectionAnchor");
		var currentSection;
		for (var i=0;i<sections.length;i++){
			currentSection = sections[i];
			dojo.create("li", {id : currentSection.id + "Span" }, sectionsDiv);
			var ahref = dojo.create("a", { href: window.location.href, title: "Go to " + currentSection.id + " section", innerHTML: currentSection.id + "\n"}, currentSection.id + "Span");
			var onClickHandler = dojo.connect(ahref, 'onclick', function() {
				currentSection.scrollIntoView(false);
				that.hide();
				return false;
				
			});
		}
		}

});
});