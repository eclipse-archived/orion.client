/*******************************************************************************
 * @license Copyright (c) 2010, 2013 IBM Corporation and others. All rights
 *          reserved. This program and the accompanying materials are made
 *          available under the terms of the Eclipse Public License v1.0
 *          (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse
 *          Distribution License v1.0
 *          (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
/*eslint-env browser, amd*/

define([ 'i18n!git/nls/gitmessages', 'orion/git/gitPreferenceStorage', 'orion/webui/dialog', 'orion/git/util', 'orion/urlModifier'],
 function(messages, GitPreferenceStorage, dialog, mGitUtil, urlModifier) {

	/**
	 * Usage: <code>new GitCredentialsDialog(options).show();</code>
	 * 
	 * @param options {{
	 *            title: string, //title of window ("Git Credentials" used if
	 *            not provided) func: function, //callback function
	 *            serviceRegistry: serviceRegistry, //to obtain ssh service that
	 *            provides known hosts errordata: json //detailed information
	 *            about failure returned by the server username: boolean, //ask
	 *            for username (enabled by default if nothing is enabled)
	 *            password: boolean, //ask for password (enabled by default if
	 *            nothing is enabled) privatekey: boolean, //ask for private key
	 *            passphrase: boolean //ask for passphrase }}
	 */
	function GitCredentialsDialog(options) {
		this._init(options);
	}

	GitCredentialsDialog.prototype = new dialog.Dialog();

	GitCredentialsDialog.prototype.TEMPLATE = '<table><tbody><tr><td align="right" id="gitCredentialsLabel">${Repository URL:}</td><td><strong id="url"></strong></td></tr>'

			+ '<tr id="gitHubAuthRow"><td></td><td><span class="githubCloneAuth"><input type="button" class="dismissButton" id="authButton"></span></td></tr>'

			+ '<tr id="gitSshUsernameRow">' + '<td align="right"><label style="line-height: 1;" id="gitSshUsernameLabel" for="gitSshUsername">${Username:}</label></td>'
			+ '<td><input id="gitSshUsername" type="text" value="" style="margin: 0;">' + '</td></tr>'

			+ '<tr id="gitSshPasswordRow">' + '<td align="right"><input style="margin: 0;" id="isSshPassword" type="radio" name="isSshPassword" checked value="password"/>'
			+ '<label style="line-height: 1; margin-left: 5px; vertical-align: text-top;" id="gitSshPasswordLabel" for="gitSshPassword">${Password:}</label></td>'
			+ '<td><input type="password" id="gitSshPassword" value="" style="margin: 0;">' + '</td></tr>'

			+ '<tr id="gitPrivateKeyRow">'
			+ '<td align="right" valign="top"><input style="margin: 0;" id="isPrivateKey" type="radio" name="isSshPassword" value="privateKey"/>'
			+ '<label style="line-height: 1; margin-left: 5px; vertical-align: text-top;" id="gitPrivateKeyLabel" for="gitPrivateKey">${Private key:}</label></td>'
			+ '<td><textarea id="gitPrivateKey" value=""></textarea>' + '</td></tr>'

			+ '<tr id="gitPrivateKeyFileRow">'
			+ '<td align="right"><label id="gitPrivateKeyFileLabel" for="gitPrivateKeyFile">${Private key file (optional):}</label></td>'
			+ '<td><input style="margin: 0; padding: 0;" id="gitPrivateKeyFile" multiple="false" type="file" size="53" label="Browse..."></td>' + '</tr>'

			+ '<tr id="gitPassphraseRow">'
			+ '<td align="right"><label id="gitPassphraseLabel" for="gitPassphrase">${Passphrase (optional):}</label></td>'
			+ '<td><input type="password" id="gitPassphrase" value="" style="margin: 0;"></td>' + '</tr>'

			+ '<tr id="gitSaveCredentialsRow">' + '<td align="right"><img id="gitSaveCredentialsInfo" src="../images/info.gif"">'
			+ '<input id="gitSaveCredentials" type="checkbox" name="gitSaveCredentials"></td>'
			+ '<td><label id="gitSaveCredentialsLabel" for="gitSaveCredentials">${Don\'t prompt me again}</label></td>' + '</tr></tbody></table>';

	GitCredentialsDialog.prototype._init = function(options) {
		var that = this;

		this.title = options.title || messages["Git Credentials"];
		this.modal = true;
		this.messages = messages;
		this.options = options;
		this._afterHiding = options.closeCallback;

		if (!this.options.username && !this.options.password && !this.options.privatekey && !this.options.passphrase) {
			this.options.username = true;
			this.options.password = true;
			this.options.privatekey = true;
			this.options.passphrase = true;
		}

		if (options.serviceRegistry) {
			this._sshService = options.serviceRegistry.getService("orion.net.ssh"); //$NON-NLS-0$
			this._progressService = options.serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
		}

		this.buttons = [];

		this.buttons.push({ callback : function() {
			that.destroy();
			that._execute();
		},
		text : 'OK',
		isDefault: true
		});

		// Start the dialog initialization.
		this._initialize();
	};

	GitCredentialsDialog.prototype._bindToDom = function(parent) {
		var that = this;

		if (!this.options.username) {
			this.$gitSshUsernameRow.style.display = "none"; //$NON-NLS-0$
		}

		if (!this.options.password) {
			this.$gitSshPasswordRow.style.display = "none"; //$NON-NLS-0$
		}

		if (!this.options.privatekey) {
			this.$gitPrivateKeyRow.style.display = "none"; //$NON-NLS-0$		
			this.$gitPrivateKeyFileRow.style.display = "none"; //$NON-NLS-0$
		}

		if (!this.options.passphrase) {
			this.$gitPassphraseRow.style.display = "none"; //$NON-NLS-0$
		}

		if (this.options.errordata && this.options.errordata.Url) {
			this.$gitCredentialsLabel.style.display = "block"; //$NON-NLS-0$
			this.$url.textContent = this.options.errordata.Url;
		}

		if (this.options.errordata && this.options.errordata.GitHubAuth) {
			this.$authButton.value = messages.AuthorizeWithGitHub;
			(function(authUrl) {
				this.$authButton.addEventListener("click", function(e) { //$NON-NLS-0$
					window.location.href = urlModifier(authUrl);
				});
			}.bind(this))(this.options.errordata.GitHubAuth + "?ref=" + encodeURIComponent(window.location.href) + ",cloneGitRepository=" + encodeURIComponent(this.options.errordata.Url)); //$NON-NLS-1$ //$NON-NLS-0$
		} else {
			this.$gitHubAuthRow.style.display = "none"; //$NON-NLS-0$			
		}

		if (this.options.errordata && this.options.errordata.User && this.options.errordata.User !== "") {
			this.$gitSshUsername.value = this.options.errordata.User;
			this.$gitSshUsernameRow.style.display = "none"; //$NON-NLS-0$
			setTimeout(function() {
				that.$gitSshPassword.focus();
			}, 400);
		}

		// display prompt checkbox only when it makes sense
		var gitPreferenceStorage = new GitPreferenceStorage(this.options.serviceRegistry);
		gitPreferenceStorage.isEnabled().then(function(isEnabled) {
			if (!isEnabled) {
				that.$gitSaveCredentials.style.display = "none";
				that.$gitSaveCredentialsLabel.style.display = "none";
				that.$gitSaveCredentialsInfo.style.display = "none";
			}
		});

		this.$gitSshPassword.addEventListener("focus", function(evt) {//$NON-NLS-0$
			that.$isSshPassword.checked = true;
		});

		this.$gitPrivateKey.addEventListener("focus", function(evt) {//$NON-NLS-0$
			that.$isPrivateKey.checked = true;
		});

		this.$gitPrivateKeyFile.addEventListener("focus", function(evt) {//$NON-NLS-0$
			that.$isPrivateKey.checked = true;
		});

		this.$gitPassphrase.addEventListener("focus", function(evt) {//$NON-NLS-0$
			that.$isPrivateKey.checked = true;
		});

		this.$gitPrivateKeyFile.addEventListener("change", function(evt) {//$NON-NLS-0$
			var file = evt.target.files[0];
			that.privateKeyFile = file;
		});

		// new Tooltip({ connectId : [ "gitSaveCredentialsInfo" ],
		// label : messages["Your private key will be saved in the browser for
		// further use"]
		// });
	};

	GitCredentialsDialog.prototype._execute = function() {
		var that = this;
		var loadedPrivateKey = this.$gitPrivateKey.value;
		var repository = this.$url.textContent;

		var process = function(pKey) {
			if (that._sshService) {
				var repositoryURL = mGitUtil.parseSshGitUrl(repository);
				that._sshService.getKnownHostCredentials(repositoryURL.host, repositoryURL.port).then(
						function(knownHosts) {
							if (that.options.func) {
								var failedOperation = typeof that.options.failedOperation === "undefined" ? that.options.errordata.failedOperation
										: that.options.failedOperation;
								if (failedOperation !== "undefined") {
									that._progressService.removeOperation(failedOperation);
								}
								that.options.func({ gitSshUsername : that.$gitSshUsername.value,
								gitSshPassword : that.$isSshPassword.checked ? that.$gitSshPassword.value : "",
								gitPrivateKey : that.$isPrivateKey.checked ? pKey : "",
								gitPassphrase : that.$isPrivateKey.checked ? that.$gitPassphrase.value : "", //$NON-NLS-0$
								knownHosts : knownHosts
								});
							}
						});
			} else {
				if (that.options.func) {
					var failedOperation = typeof that.options.failedOperation === "undefined" ? that.options.errordata.failedOperation
							: that.options.failedOperation;
					if (failedOperation !== "undefined") {
						that._progressService.removeOperation(failedOperation);
					}
					that.options.func({
						gitSshUsername : that.$gitSshUsername.value,
						gitSshPassword : that.$gitSshPassword.value,
						gitPrivateKey : pKey,
						gitPassphrase : that.$gitPassphrase.value,
					knownHosts : that.$gitSshKnownHosts.value
					});
				}
			}
		};

		if (this.privateKeyFile) {
			// load private key from file
			var reader = new FileReader();
			reader.onload = (function() {
				return function(e) {
					loadedPrivateKey = e.target.result;

					var gitPreferenceStorage = new GitPreferenceStorage(that.options.serviceRegistry);
					if (that.$gitSaveCredentials.checked) {

						gitPreferenceStorage.put(repository, {
							gitSshUsername : that.$gitSshUsername.value,
							gitPrivateKey : loadedPrivateKey,
							gitPassphrase : that.$gitPassphrase.value
						}).then(function() {
							process(loadedPrivateKey);
						});

					} else {
						process(loadedPrivateKey);
					}
				};
			}());

			reader.readAsText(this.privateKeyFile);
		} else if (loadedPrivateKey.length > 0) {
			// save key
			var gitPreferenceStorage = new GitPreferenceStorage(that.options.serviceRegistry);
			if (that.$gitSaveCredentials.checked) {

				gitPreferenceStorage.put(repository, { gitPrivateKey : loadedPrivateKey,
				gitPassphrase : that.$gitPassphrase.value
				}).then(function() {
					process(loadedPrivateKey);
				});

			} else {
				process(loadedPrivateKey);
			}
		} else {
			// save ssh username and password
			var gitPreferenceStorage = new GitPreferenceStorage(that.options.serviceRegistry);
			if (that.$gitSaveCredentials.checked) {

				gitPreferenceStorage.put(repository, { gitSshUsername : that.$gitSshUsername.value,
				gitSshPassword : that.$gitSshPassword.value
				}).then(function() {
					process(loadedPrivateKey);
				});

			} else {
				process(loadedPrivateKey);
			}
		}
	};

	GitCredentialsDialog.prototype.constructor = GitCredentialsDialog;

	// return the module exports
	return { GitCredentialsDialog : GitCredentialsDialog
	};

});
