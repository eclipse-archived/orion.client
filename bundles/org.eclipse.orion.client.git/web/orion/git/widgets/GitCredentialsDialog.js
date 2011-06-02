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
define(['dojo', 'dijit', 'dijit/Dialog', 'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/GitCredentialsDialog.html'], function(dojo, dijit) {


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
dojo.declare("orion.git.widgets.GitCredentialsDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], {
	widgetsInTemplate: true,
	templateString: dojo.cache(new dojo._Url("/orion/git/widgets/templates/GitCredentialsDialog.html")),
	
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
		if(!this.options.username && !this.options.password && !this.options.privatekey && !this.options.passphrase){
			this.options.username=true;
			this.options.password=true;
			this.options.privatekey=true;
			this.options.passphrase=true;
		}
		if(this.options.serviceRegistry){
			var self = this;
			this.options.serviceRegistry.getService("orion.net.ssh").then(function(sshService){
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
	},
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
});