/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*jslint browser:true*/
/*global define orion window dojo dijit*/

define(['i18n!git/nls/gitmessages', 'require', 'dojo', 'dijit', "orion/util", 'dijit/Dialog', 'dijit/form/TextBox', 
		'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/GetPullRequestUrlDialog.html'], function(messages, require, dojo, dijit, mUtil) {

/**
 * Usage: <code>new orion.git.widgets.GetPullRequestUrlDialog(options).show();</code>
 * 
 * @name orion.git.widgets.GetPullRequestUrlDialog
 */
var GetPullRequestUrlDialog = dojo.declare("orion.git.widgets.GetPullRequestUrlDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], //$NON-NLS-0$
		/** @lends orion.git.widgets.GetPullRequestUrlDialog.prototype */ {
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'git/widgets/templates/GetPullRequestUrlDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
	
	SEARCH_DELAY: 500,
	timeoutId: null,
	time: null,
	options: null,
	
	/** @private */
	constructor : function() {
		this.inherited(arguments);
		this.timeoutId = null;
		this.time = 0;
		this.options = arguments[0];
		
		this.url = this.options.url;
	},
	
	/** @private */
	postMixInProperties : function() {
		this.options.title = this.options.title || messages["Pull Request"];
		this.selectFile = messages["Pull Request url for this commit"];

		this.inherited(arguments);
	},
	
	/** @private */
	postCreate: function() {
		this.inherited(arguments);
		this.PullReqUrl.set("value", this.options.url);
	},
	
	
	/**
	 * Displays the dialog.
	 */
	show: function() {
		this.inherited(arguments);
		this.PullReqUrl.focus();
	},
	
	/** @private */
	onHide: function() {
		clearTimeout(this.timeoutId);
		this.inherited(arguments);
	}
	
});
return GetPullRequestUrlDialog;
});
