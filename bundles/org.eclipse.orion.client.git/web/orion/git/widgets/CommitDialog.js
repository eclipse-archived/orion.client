/******************************************************************************* 
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo dijit widgets*/

define(['i18n!git/nls/gitmessages', 'dojo', 'dijit', 'dijit/Dialog', 'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/CommitDialog.html'], function(messages, dojo, dijit) {

/**
 * @param options {{ 
 *     func: function
 * }}
 */
dojo.declare("orion.git.widgets.CommitDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], { //$NON-NLS-0$
	widgetsInTemplate: true,
	templateString: dojo.cache('orion', 'git/widgets/templates/CommitDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = messages["Commit Changes"];
		this.commitMessageLabelText = messages["Message:"];
		this.amendLabelText = messages["Amend:"];
		this.committerNameLabelText = messages["Committer Name:"];
		this.committerEmailLabelText = messages["Committer Email:"];
		this.authorNameLabelText = messages["Author Name:"];
		this.authorEmailLabelText = messages["Author Email:"];
	},
	
	postCreate : function(){
		var that = this;
		this.inherited(arguments);
		
		if (this.options.body.Message) {
			this.commitMessage.value = this.options.body.Message;
		}
		dojo.connect(this.commitMessage, "onkeyup", dojo.hitch(this, this.validate)); //$NON-NLS-0$
		
		if (this.options.body.Amend) {
			this.amend.checked = true;
		}
		
		if (this.options.body.CommitterName) {
			this.committerName.value = this.options.body.CommitterName;
		}
		dojo.connect(this.committerName, "onkeyup", dojo.hitch(this, this.validate)); //$NON-NLS-0$
		
		if (this.options.body.CommitterEmail) {
			this.committerEmail.value = this.options.body.CommitterEmail;
		}
		dojo.connect(this.committerEmail, "onkeyup", dojo.hitch(this, this.validate)); //$NON-NLS-0$
		
		if (this.options.body.AuthorName) {
			this.authorName.value = this.options.body.AuthorName;
		}
		dojo.connect(this.authorName, "onkeyup", dojo.hitch(this, this.validate)); //$NON-NLS-0$
		
		if (this.options.body.AuthorEmail) {
			this.authorEmail.value = this.options.body.AuthorEmail;
		}
		dojo.connect(this.authorEmail, "onkeyup", dojo.hitch(this, this.validate)); //$NON-NLS-0$
		
		this.validate();
	},
	
	validate: function() {
		if (!this.commitMessage.value) {
			dojo.style(this.commitInfoBar, "display", "block"); //$NON-NLS-1$ //$NON-NLS-0$
			this.commitChangesButton.disabled = true;
			this.commitInfo.innerHTML = messages["The commit message is required."];
		} else if (!this.committerName.value) {
			dojo.style(this.commitInfoBar, "display", "block"); //$NON-NLS-1$ //$NON-NLS-0$
			this.commitChangesButton.disabled = true;
			this.commitInfo.innerHTML = messages['The committer name is required.'];
		} else if (!this.committerEmail.value) {
			dojo.style(this.commitInfoBar, "display", "block"); //$NON-NLS-1$ //$NON-NLS-0$
			this.commitChangesButton.disabled = true;
			this.commitInfo.innerHTML = messages['The committer mail is required.'];
		} else if (!this.authorName.value) {
			dojo.style(this.commitInfoBar, "display", "block"); //$NON-NLS-1$ //$NON-NLS-0$
			this.commitChangesButton.disabled = true;
			this.commitInfo.innerHTML = messages['The author name is required.'];
		} else if (!this.authorEmail.value) {
			dojo.style(this.commitInfoBar, "display", "block"); //$NON-NLS-1$ //$NON-NLS-0$
			this.commitChangesButton.disabled = true;
			this.commitInfo.innerHTML = messages['The author mail is required.'];
		} else {
			dojo.style(this.commitInfoBar, "display", "none"); //$NON-NLS-1$ //$NON-NLS-0$
			this.commitChangesButton.disabled = false;
		}
	},
	
	execute: function() {
		if(this.options.func){
			var body = {};
			
			body.Message = this.commitMessage.value;
			body.Amend = this.amend.checked ? true : false;
			body.CommitterName = this.committerName.value;
			body.CommitterEmail = this.committerEmail.value;
			body.AuthorName = this.authorName.value;
			body.AuthorEmail = this.authorEmail.value;
			
			this.options.func(body);
		}
		delete this.options.func; //prevent performing this action twice (IE)
	}
});

});