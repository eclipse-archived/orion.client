/******************************************************************************* 
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo dijit widgets*/

define(['dojo', 'dijit', 'dijit/Dialog', 'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/AddRemoteDialog.html'], function(dojo, dijit) {

/**
 * @param options {{ 
 *     func: function
 * }}
 */
dojo.declare("orion.git.widgets.AddRemoteDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], {
	widgetsInTemplate: true,
	templateString: dojo.cache(new dojo._Url("/orion/git/widgets/templates/AddRemoteDialog.html")),
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = "Add Remote";
		this.gitRemoteLabelText = "Remote Name:";
		this.gitRemoteURILabelText = "Remote URI:";
	},
	execute: function() {
		this.options.func(this.gitRemote.value, this.gitRemoteURI.value);
	}
});

});