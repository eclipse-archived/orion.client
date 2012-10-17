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

/*global dojo dijit widgets*/

define(['i18n!git/nls/gitmessages', 'dojo', 'dijit', 'dijit/Dialog', 'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/AddRemoteDialog.html'], function(messages, dojo, dijit) {

/**
 * @param options {{ 
 *     func: function
 * }}
 */
dojo.declare("orion.git.widgets.AddRemoteDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], { //$NON-NLS-0$
	widgetsInTemplate: true,
	templateString: dojo.cache('orion', 'git/widgets/templates/AddRemoteDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = messages["Add Remote"];
		this.gitRemoteLabelText = messages["Remote Name:"];
		this.gitRemoteURILabelText = messages["Remote URI:"];
	},
	execute: function() {
		if(this.options.func)
			this.options.func(this.gitRemote.value, this.gitRemoteURI.value);
		delete this.options.func; //prevent performing this action twice (IE)
	}
});

});