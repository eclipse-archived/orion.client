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

define(['dojo', 'dijit', 'dijit/Dialog', 'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/CommitDialog.html'], function(dojo, dijit) {

/**
 * @param options {{ 
 *     func: function
 * }}
 */
dojo.declare("orion.git.widgets.CommitDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], {
	widgetsInTemplate: true,
	templateString: dojo.cache('orion', 'git/widgets/templates/CommitDialog.html'),
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = "Commit Changes";
		this.commitMessageLabelText = "Message:";
		this.amendLabelText = "Amend:";
		this.committerNameLabelText = "Committer Name:";
		this.committerEmailLabelText = "Committer Email:";
		this.authorNameLabelText = "Author Name:";
		this.authorEmailLabelText = "Author Email:";
	},
	
	postCreate : function(){
		var that = this;
		this.inherited(arguments);
		
		if (this.options.body.Message) {
			this.commitMessage.value = this.options.body.Message;
		}
		dojo.connect(this.commitMessage, "onkeyup", dojo.hitch(this, this.validate));
		
		if (this.options.body.Amend) {
			this.amend.checked = true;
		}
		
		if (this.options.body.CommitterName) {
			this.committerName.value = this.options.body.CommitterName;
		}
		dojo.connect(this.committerName, "onkeyup", dojo.hitch(this, this.validate));
		
		if (this.options.body.CommitterEmail) {
			this.committerEmail.value = this.options.body.CommitterEmail;
		}
		dojo.connect(this.committerEmail, "onkeyup", dojo.hitch(this, this.validate));
		
		if (this.options.body.AuthorName) {
			this.authorName.value = this.options.body.AuthorName;
		}
		dojo.connect(this.authorName, "onkeyup", dojo.hitch(this, this.validate));
		
		if (this.options.body.AuthorEmail) {
			this.authorEmail.value = this.options.body.AuthorEmail;
		}
		dojo.connect(this.authorEmail, "onkeyup", dojo.hitch(this, this.validate));
		
		this.validate();
	},
	
	validate: function() {
		if (!this.commitMessage.value) {
			dojo.style(this.commitInfoBar, "display", "block");
			this.commitChangesButton.disabled = true;
			this.commitInfo.innerHTML = "The commit message is required.";
		} else if (!this.committerName.value) {
			dojo.style(this.commitInfoBar, "display", "block");
			this.commitChangesButton.disabled = true;
			this.commitInfo.innerHTML = "The committer name is required.";
		} else if (!this.committerEmail.value) {
			dojo.style(this.commitInfoBar, "display", "block");
			this.commitChangesButton.disabled = true;
			this.commitInfo.innerHTML = "The committer mail is required.";
		} else if (!this.authorName.value) {
			dojo.style(this.commitInfoBar, "display", "block");
			this.commitChangesButton.disabled = true;
			this.commitInfo.innerHTML = "The author name is required.";
		} else if (!this.authorEmail.value) {
			dojo.style(this.commitInfoBar, "display", "block");
			this.commitChangesButton.disabled = true;
			this.commitInfo.innerHTML = "The author mail is required.";
		} else {
			dojo.style(this.commitInfoBar, "display", "none");
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