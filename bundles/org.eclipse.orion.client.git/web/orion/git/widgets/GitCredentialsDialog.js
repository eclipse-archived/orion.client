/******************************************************************************* 
 * @license
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
define(['i18n!git/nls/gitmessages', 'dojo', 'dijit', 'dijit/Dialog', 'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/GitCredentialsDialog.html'], function(messages, dojo, dijit) {


/**
 * @param options {{ 
 *     title: string,						//title of window ("Git Credentials" used if not provided)
 *     func: function,						//callback function
 *     serviceRegistry: serviceRegistry,	//to obtain ssh service that provides known hosts
 *     errordata: json						//detailed information about failure returned by the server
 *     username: boolean,					//ask for username (enabled by default if nothing is enabled)
 *     password: boolean,					//ask for password (enabled by default if nothing is enabled)
 *     privatekey: boolean,					//ask for private key
 *     passphrase: boolean					//ask for passphrase
 * }}
 */
dojo.declare("orion.git.widgets.GitCredentialsDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], { //$NON-NLS-0$
	widgetsInTemplate: true,
	templateString: dojo.cache('orion', 'git/widgets/templates/GitCredentialsDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = this.options.title || messages["Git Credentials"];
		this.gitUrlLabelText = messages['Repository URL:'];
		this.gitSshUsernameLabelText = messages["Username:"];
		this.gitSshPasswordLabelText = messages["Ssh password:"];
		this.gitPrivateKeyLabelText = messages["Private key:"];
		this.gitPassphraseLabelText = messages["Passphrase (optional):"];
		if(!this.options.username && !this.options.password && !this.options.privatekey && !this.options.passphrase){
			this.options.username=true;
			this.options.password=true;
			this.options.privatekey=true;
			this.options.passphrase=true;
		}
		if(this.options.serviceRegistry){
			this._sshService = this.options.serviceRegistry.getService("orion.net.ssh"); //$NON-NLS-0$
			this._progressService = this.options.serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
		}
	},
	postCreate: function() {
		this.inherited(arguments);
		var self = this;
		
		if(!this.options.username){
			dojo.style(this.gitSshUsernameRow, "display", "none"); //$NON-NLS-1$ //$NON-NLS-0$
		}
		if(!this.options.password){
			dojo.style(this.gitSshPasswordRow, "display", "none"); //$NON-NLS-1$ //$NON-NLS-0$
		}
		if(!this.options.privatekey){
			dojo.style(this.gitPrivateKeyRow, "display", "none"); //$NON-NLS-1$ //$NON-NLS-0$
		}
		if(!this.options.passphrase){
			dojo.style(this.gitPassphraseRow, "display", "none"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.style(this.gitPassphraseRow_1, "display", "none"); //$NON-NLS-1$ //$NON-NLS-0$
		}
		if(this.options.errordata && this.options.errordata.Url){
			dojo.style(this.gitCredentialsLabel, "display", "block"); //$NON-NLS-1$ //$NON-NLS-0$
			this.url.innerHTML = this.options.errordata.Url;
		}
		if(this.options.errordata && this.options.errordata.User && this.options.errordata.User!==""){
			 this.gitSshUsername.value = this.options.errordata.User;
			 dojo.style(this.gitSshUsernameRow, "display", "none"); //$NON-NLS-1$ //$NON-NLS-0$
			 setTimeout(function () { self.gitSshPassword.focus(); }, 400);
		}
		
		dojo.connect(this.gitSshPassword, "onfocus", null, dojo.hitch(this, function(){this.isSshPassword.checked = true;}) ); //$NON-NLS-0$
		dojo.connect(this.gitPrivateKey, "onfocus", null, dojo.hitch(this, function(){this.isPrivateKey.checked = true;}) ); //$NON-NLS-0$
		dojo.connect(this.gitPassphrase, "onfocus", null, dojo.hitch(this, function(){this.isPrivateKey.checked = true;}) ); //$NON-NLS-0$
	},
	execute: function() {
		
		if(this._sshService){
			var self = this;
			this._sshService.getKnownHosts().then(function(knownHosts){
				if(self.options.func)
					self.options.func({ gitSshUsername: self.gitSshUsername.value, gitSshPassword: self.isSshPassword.checked ? self.gitSshPassword.value : "",
						gitPrivateKey: self.isPrivateKey.checked ? self.gitPrivateKey.value : "", gitPassphrase: self.isPrivateKey.checked ? self.gitPassphrase.value: "", //$NON-NLS-0$
						knownHosts: knownHosts});
				delete self.options.func; //prevent performing this action twice (IE)
			});
			
		}else{
			if(this.options.func)
				this.options.func({ gitSshUsername: this.gitSshUsername.value, gitSshPassword: this.gitSshPassword.value,
					gitPrivateKey: this.gitPrivateKey.value, gitPassphrase: this.gitPassphrase.value,
					knownHosts: this.gitSshKnownHosts.value});
			delete this.options.func; //prevent performing this action twice (IE)
		}
	}
});
});