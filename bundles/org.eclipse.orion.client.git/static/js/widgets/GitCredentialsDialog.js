/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit*/
/*jslint browser:true*/
dojo.provide("widgets.GitCredentialsDialog");

dojo.require("dijit.Dialog");

/**
 * @param options {{ 
 *     title: string,						//title of window ("Git Credentials" used if not provided)
 *     func: function,						//callback function
 *     serviceRegistry: serviceRegistry,	//to obtain ssh service that provides known hosts
 *     username: boolean,					//ask for username (enabled by default if nothing is enabled)
 *     password: boolean,					//ask for password (enabled by default if nothing is enabled)
 *     privatekey: boolean,					//ask for private key
 *     passphrase: boolean					//ask for passphrase
 * }}
 */
dojo.declare("widgets.GitCredentialsDialog", [dijit.Dialog], {
	widgetsInTemplate: true,
	templateString: dojo.cache("widgets", "templates/GitCredentialsDialog.html"),
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = this.options.title || "Git Credentials";
		this.gitUrlLabelText = "Repository URL:";
		this.gitSshUsernameLabelText = "Ssh username:";
		this.gitSshPasswordLabelText = "Ssh password:";
		this.gitPrivateKeyLabelText = "Private key:";
		this.gitPassphraseLabelText = "Passphrase:";
		this.buttonCancel = "Cancel";
		if(!this.options.username && !this.options.password && !this.options.privatekey && !this.options.passphrase){
			this.options.username=true;
			this.options.password=true;
		}
		if(this.options.serviceRegistry){
			var self = this;
			this.options.serviceRegistry.getService("ISshService").then(function(sshService){
				self._sshService = sshService;
			});
		}
	},
	postCreate: function() {
		this.inherited(arguments);
		
		if(!this.options.username){
			dojo.style(this.gitSshUsernameRow, "display", "none");
		}
		if(!this.options.password){
			dojo.style(this.gitSshPasswordRow, "display", "none");
		}
		if(!this.options.privatekey){
			dojo.style(this.gitPrivateKeyRow, "display", "none");
		}
		if(!this.options.passphrase){
			dojo.style(this.gitPassphraseRow, "display", "none");
		}
		if(this.options.url){
			dojo.style(this.gitCredentialsLabel, "display", "block");
			this.url.innerHTML = this.options.url;
		}
		
		dojo.connect(this, "onKeyPress", dojo.hitch(this, function(evt) {
			if (evt.keyCode === dojo.keys.ENTER) {
				this.domNode.focus(); // FF throws DOM error if textfield is focused after dialog closes
				this._onSubmit();
			}
		}));
		this.refocus = false; // Dojo 10654
	},
	onHide: function() {
		// This assumes we don't reuse the dialog
		this.inherited(arguments);
		setTimeout(dojo.hitch(this, function() {
			this.destroyRecursive(); // TODO make sure this removes DOM elements
		}), this.duration);
	},
	// Stuff from newItemDialog.js is below
	execute: function() {
		
		if(this._sshService){
			var self = this;
			this._sshService.getKnownHosts().then(function(knownHosts){
				self.options.func({ gitSshUsername: self.gitSshUsername.value, gitSshPassword: self.gitSshPassword.value,
					gitPrivateKey: self.gitPrivateKey.value, gitPassphrase: self.gitPassphrase.value,
					knownHosts: knownHosts});
			});
			
		}else{
			this.options.func({ gitSshUsername: this.gitSshUsername.value, gitSshPassword: this.gitSshPassword.value,
				gitPrivateKey: this.gitPrivateKey.value, gitPassphrase: this.gitPassphrase.value,
				knownHosts: this.gitSshKnownHosts.value});
		}
	}
});