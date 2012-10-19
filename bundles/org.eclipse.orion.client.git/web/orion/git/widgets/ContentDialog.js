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
/*global define window dojo dijit dojox orion*/
/*jslint browser:true */

define(['i18n!git/nls/gitmessages', 'dojo', 'dijit', 'dojox', 'dijit/Dialog', 'dojo/data/ItemFileReadStore', 'dojox/form/Uploader', 'dojox/form/uploader/FileList', 
        'dojox/form/uploader/plugins/IFrame', 'dijit/form/Button','dijit/ProgressBar', 'orion/widgets/_OrionDialogMixin', 
        'text!orion/git/widgets/templates/ContentDialog.html'], 
        function(messages, dojo, dijit, dojox) {

/**
 */
dojo.declare("orion.git.widgets.ContentDialog", [ dijit.Dialog, orion.widgets._OrionDialogMixin ], { //$NON-NLS-0$
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'git/widgets/templates/ContentDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$

	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = messages["Content"];
	},
	
	postCreate : function() {
		var that = this;
		this.inherited(arguments);
		var sectionsDiv = dojo.byId("div1"); //$NON-NLS-0$
		var sections =  dojo.query(".sectionAnchor"); //$NON-NLS-0$

		for (var i=0;i<sections.length;i++){
			var currentSection = sections[i];
			dojo.create("li", {id : currentSection.id + "Span" }, sectionsDiv); //$NON-NLS-1$ //$NON-NLS-0$
			var ahref = dojo.create("a", { href: window.location.href, title: dojo.string.substitute(messages["Go to ${0} section"], [currentSection.id])}, currentSection.id + "Span"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
			ahref.textContent = currentSection.id + "\n";
			dojo.connect(ahref, 'onclick', dojo.hitch(currentSection, function() { //$NON-NLS-0$
				this.scrollIntoView(true);
				that.hide();
				return false;
			}));
		}
	}
});

});
