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

/*global dojo dijit widgets FileReader define orion*/
/*jslint browser:true*/
define(['i18n!git/nls/gitmessages', 'dojo', 'dijit', 'dijit/Tooltip', 'orion/git/gitPreferenceStorage', 'dijit/Dialog', 'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/GitCredentialsDialog.html'], function(messages, dojo, dijit, Tooltip, GitPreferenceStorage) {


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
		this.gitPrivateKeyFileLabelText = messages["Private key file (optional):"];
		this.gitSaveCredentialsLabelText = messages["Don't prompt me again:"];
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
			dojo.style(this.gitPrivateKeyFileRow, "display", "none");
			dojo.style(this.gitPrivateKeyFileRow_1, "display", "none");
		}
		if(!this.options.passphrase){
			dojo.style(this.gitPassphraseRow, "display", "none"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.style(this.gitPassphraseRow_1, "display", "none"); //$NON-NLS-1$ //$NON-NLS-0$
		}
		if(this.options.errordata && this.options.errordata.Url){
			dojo.style(this.gitCredentialsLabel, "display", "block"); //$NON-NLS-1$ //$NON-NLS-0$
			this.url.textContent = this.options.errordata.Url;
		}
		if(this.options.errordata && this.options.errordata.User && this.options.errordata.User!==""){
			 this.gitSshUsername.value = this.options.errordata.User;
			 dojo.style(this.gitSshUsernameRow, "display", "none"); //$NON-NLS-1$ //$NON-NLS-0$
			 setTimeout(function () { self.gitSshPassword.focus(); }, 400);
		}
		
		var that = this;
		
		// display prompt checkbox only when it makes sense
		var gitPreferenceStorage = new GitPreferenceStorage(self.options.serviceRegistry);
		gitPreferenceStorage.isEnabled().then(
			function(isEnabled){
				if(!isEnabled){
					dojo.style(that.gitSaveCredentials, "display", "none");
					dojo.style(that.gitSaveCredentialsLabel, "display", "none");
					dojo.style(that.gitSaveCredentialsInfo, "display", "none");
				}
			}
		);
		
		dojo.connect(this.gitSshPassword, "onfocus", null, dojo.hitch(this, function(){
			this.isSshPassword.checked = true;
		}) );
		
		dojo.connect(this.gitPrivateKey, "onfocus", null, dojo.hitch(this, function(){
			this.isPrivateKey.checked = true;
		}) );
		
		dojo.connect(this.gitPrivateKeyFile, "onfocus", null, dojo.hitch(this, function(){
			this.isPrivateKey.checked = true;	
		}) );
		
		dojo.connect(this.gitPassphrase, "onfocus", null, dojo.hitch(this, function(){
			this.isPrivateKey.checked = true;	
		}) );
			
		dojo.connect(dijit.byId(this.gitPrivateKeyFile), "onchange", function(evt){
			var file = evt.target.files[0];
			self.privateKeyFile = file;
		});
		
		new Tooltip({
			connectId: ["gitSaveCredentialsInfo"],
			label: messages["Your private key will be saved in the browser for further use"]
		});
	},
	execute: function() {
		var self = this;
		var loadedPrivateKey = this.gitPrivateKey.value;
		var repository = this.url.textContent;
		
		var process = function(pKey){
			if(self._sshService){
				self._sshService.getKnownHosts().then(function(knownHosts){
					if(self.options.func) {
						self.options.func({ gitSshUsername: self.gitSshUsername.value, gitSshPassword: self.isSshPassword.checked ? self.gitSshPassword.value : "",
							gitPrivateKey: self.isPrivateKey.checked ? pKey : "", gitPassphrase: self.isPrivateKey.checked ? self.gitPassphrase.value: "", //$NON-NLS-0$
							knownHosts: knownHosts});
						}
					delete self.options.func; //prevent performing this action twice (IE)
				});
				
			}else{
				if(self.options.func) {
					self.options.func({ gitSshUsername: self.gitSshUsername.value, gitSshPassword: self.gitSshPassword.value,
						gitPrivateKey: pKey, gitPassphrase: self.gitPassphrase.value,
						knownHosts: self.gitSshKnownHosts.value});
					}
				delete self.options.func; //prevent performing this action twice (IE)
			}
		};
		
		if(this.privateKeyFile){
			//load private key from file
			var reader = new FileReader();
			reader.onload = (function(f){
				return function(e){
					loadedPrivateKey = e.target.result;
										
					var gitPreferenceStorage = new GitPreferenceStorage(self.options.serviceRegistry);
					if(self.gitSaveCredentials.checked){
						
						gitPreferenceStorage.put(repository, {
							gitPrivateKey : loadedPrivateKey,
							gitPassphrase : self.gitPassphrase.value
						}).then(
							function(){
								process(loadedPrivateKey);
							}
						);
						
					} else {
						process(loadedPrivateKey);
					}
				};
			}(this.privateKeyFile));
			
			reader.readAsText(this.privateKeyFile);
		} else if(loadedPrivateKey.length > 0){
				//save key				
				var gitPreferenceStorage = new GitPreferenceStorage(self.options.serviceRegistry);
				if(self.gitSaveCredentials.checked){
					
					gitPreferenceStorage.put(repository, {
						gitPrivateKey : loadedPrivateKey,
						gitPassphrase : self.gitPassphrase.value
					}).then(
						function(){
							process(loadedPrivateKey);
						}
					);
					
				} else {
					process(loadedPrivateKey);
				}
		} else {
			//save ssh username and password
			var gitPreferenceStorage = new GitPreferenceStorage(self.options.serviceRegistry);
			if(self.gitSaveCredentials.checked){
					
				gitPreferenceStorage.put(repository, {
					gitSshUsername : self.gitSshUsername.value,
					gitSshPassword : self.gitSshPassword.value
				}).then(
					function(){
						process(loadedPrivateKey);
					}
				);
					
			} else {
				process(loadedPrivateKey);
			}
		}
	}
});
});