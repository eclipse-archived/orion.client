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
/*jslint browser:true*/
define(['dojo', 'dijit', 'dijit/Dialog', 'orion/widgets/_OrionDialogMixin'], function(dojo, dijit) {

/**
 * @param options {{ 
 *     func: function
 * }}
 */
dojo.declare("widgets.CloneGitRepositoryDialog", [dijit.Dialog, widgets._OrionDialogMixin], {
	widgetsInTemplate: true,
	templateString: dojo.cache(new dojo._Url("/js/widgets/templates/CloneGitRepositoryDialog.html")),
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = "Clone Git Repository";
		this.gitUrlLabelText = "Repository URL:";
		this.gitPathLabelText = "Existing directory:";
		this.gitNameLabelText = "New project:";
	},
	// Stuff from newItemDialog.js is below
	execute: function() {
		this.options.func(this.gitUrl.value, this.gitPath.value, this.gitName.value);
	}
});
});