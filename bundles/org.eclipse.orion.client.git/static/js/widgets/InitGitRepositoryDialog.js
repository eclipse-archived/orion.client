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
dojo.provide("widgets.InitGitRepositoryDialog");

dojo.require("dijit.Dialog");
dojo.require("widgets._OrionDialogMixin");

/**
 * @param options {{ 
 *     func: function
 * }}
 */
dojo.declare("widgets.InitGitRepositoryDialog", [dijit.Dialog, widgets._OrionDialogMixin], {
	widgetsInTemplate: true,
	templateString: dojo.cache("widgets", "templates/InitGitRepositoryDialog.html"),
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = "Init Git Repository";
		this.gitTargetLabelText = "Target:";
	},
	execute: function() {
		this.options.func(this.gitTarget.value);
	}
});