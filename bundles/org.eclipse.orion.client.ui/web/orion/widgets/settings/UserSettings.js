/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/

define(['i18n!orion/settings/nls/messages', 'orion/commands', 'orion/section', 'orion/webui/littlelib', 'orion/objects', 'orion/widgets/settings/Subsection', 'orion/widgets/input/LabeledTextfield', 'orion/widgets/input/LabeledCheckbox'
		], function(messages, mCommands, mSection, lib, objects, Subsection, LabeledTextfield, LabeledCheckbox) {

	function UserSettings(options, node) {
		objects.mixin(this, options);
		this.node = node;
	}
	objects.mixin(UserSettings.prototype, {
		dispatch: true,

		// TODO these should be real Orion sections, not fake DIVs
		templateString: '' +  //$NON-NLS-0$
					'<div class="sectionWrapper toolComposite">' +  //$NON-NLS-0$
						'<div class="sectionAnchor sectionTitle layoutLeft">${User Profile}</div>' +   //$NON-NLS-0$
						'<div id="userCommands" class="layoutRight sectionActions"></div>' +  //$NON-NLS-0$
					'</div>' + //$NON-NLS-2$ //$NON-NLS-0$
					'<div class="sectionTable sections">' + //$NON-NLS-0$
					
					'</div>', //$NON-NLS-0$

		createElements: function() {
			this.node.innerHTML = this.templateString;
			lib.processTextNodes(this.node, messages);
			
			this.sections = lib.$('.sections', this.node);  //$NON-NLS-0$
			
			this.createSections();
		},

		setHash: function(iframe, hash){
			if(iframe.src.indexOf("#")>0){ //$NON-NLS-0$
				iframe.src = iframe.src.substr(0, iframe.src.indexOf("#")) + "#" + hash; //$NON-NLS-1$ //$NON-NLS-0$
			}else{
				iframe.src = iframe.src + "#" + hash; //$NON-NLS-0$
			}
		},
		
		createSections: function(){
			
			var saveFunction = this.update.bind(this);
			
			/* - account ----------------------------------------------------- */
			this.accountFields = [
				new LabeledTextfield( {fieldlabel:messages['Username'], editmode:'readonly', postChange: saveFunction}),  //$NON-NLS-0$
				new LabeledTextfield( {fieldlabel:messages['Full Name'], postChange: saveFunction}),
				new LabeledTextfield( {fieldlabel:messages['Email Address'], postChange: saveFunction}),
				new LabeledCheckbox( {fieldlabel: messages['Email Confirmed'], editmode:'readonly', postChange: saveFunction})  //$NON-NLS-0$
			];
			var accountSubsection = new Subsection( {sectionName: messages['Account'], parentNode: this.sections, children: this.accountFields} );
			accountSubsection.show();

			/* - password ---------------------------------------------------- */
			this.passwordFields = [
				new LabeledTextfield( {fieldlabel:messages['Current Password'], inputType:'password'} ), //$NON-NLS-1$  //$NON-NLS-0$
				new LabeledTextfield( {fieldlabel:messages['New Password'], inputType:'password'} ), //$NON-NLS-1$  //$NON-NLS-0$
				new LabeledTextfield( {fieldlabel:messages['Verify Password'], inputType:'password', postChange: saveFunction} ) //$NON-NLS-1$  //$NON-NLS-0$
			];
			var passwordSection = new Subsection( {sectionName:messages['Password'], parentNode: this.sections, children: this.passwordFields } );
			passwordSection.show();

			this.username = "";
			var deleteCommand = new mCommands.Command({
				name: messages["Delete"],
				tooltip: messages["DeleteUser"],
				id: "orion.deleteprofile",  //$NON-NLS-0$
				callback: function(){
					this.deleteUser();
				}
			});
			
			this.commandService.addCommand(deleteCommand);
			this.commandService.registerCommandContribution('profileCommands', "orion.deleteprofile", 3); //$NON-NLS-1$ //$NON-NLS-0$

			this.commandService.renderCommands('profileCommands', lib.node( 'userCommands' ), this, this, "button"); //$NON-NLS-1$ //$NON-NLS-0$  //$NON-NLS-2$		
			
			this.linkedAccountSection = new mSection.Section(this.node, {
				id: "linkedAccountSection", //$NON-NLS-0$
				title: messages["Linked Accounts"],
				content: '<div style="margin-left: 10px; margin-top: 17px;" id="iFrameContent"></div>', //$NON-NLS-0$
				canHide: false,
				useAuxStyle: true,
				slideout: true
			});
			
			
			var iframe = this.iframe = document.createElement("iframe"); //$NON-NLS-0$
			iframe.src = "../mixloginstatic/manageOpenids.html";  //$NON-NLS-0$
			iframe.style.border = "0";  //$NON-NLS-0$
			iframe.style.width = "500px";  //$NON-NLS-0$
			lib.node( 'iFrameContent' ).appendChild(iframe); //$NON-NLS-0$
		},
		
		confirmOpenId: function(openid){
			if (openid !== "" && openid !== null) {
				this.win = window.open( "../mixlogin/manageopenids/openid?openid=" + encodeURIComponent(openid),"openid_popup", "width=790,height=580" ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
		},
		
	deleteUser: function(){
		if(confirm(messages["DeleteUserComfirmation"])){			
			var userService = this.userService; //$NON-NLS-0$
			userService.deleteUser("/users/" + this.username).then(function(jsonData) {  //$NON-NLS-0$
				window.location.reload();
			}, function(jsonData) {
				alert(jsonData.Message);
			});
		}
	},
	
	update: function(){
			
			var authenticationIds = [];
			
			var authServices = this.registry.getServiceReferences("orion.core.auth"); //$NON-NLS-0$
			
			var messageService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
			
			var userService = this.userService;
			
			var userdata = {};
			
			userdata.login = this.accountFields[0].getValue();
			userdata.Name = this.accountFields[1].getValue();
			userdata.email = this.accountFields[2].getValue();
			
			var pword = this.passwordFields[1].getValue();
			var pwordRetype = this.passwordFields[2].getValue();

			if( pword.length > 0 || pwordRetype.length > 0){
			
				if( pword !== pwordRetype ){
					messageService.setProgressResult( {Message: messages['UserSettings.PasswordsDoNotMatch'], Severity: 'Error'} ); //$NON-NLS-1$ //$NON-NLS-0$
					
					this.dispatch = false;
					
				}else{
				
					if( this.passwordFields[0].getValue().length > 0 ){
						userdata.oldPassword = this.passwordFields[0].getValue();
						userdata.password = pword;
						userdata.passwordRetype = pwordRetype;
					
						this.dispatch = true;
					
					}else{
						messageService.setProgressResult( {Message: messages['UserSettings.TypeCurrentPassword'], Severity: 'Warning'} ); //$NON-NLS-1$ //$NON-NLS-0$
					
						this.dispatch = false;
					}		
				}
			}
			
			if( this.dispatch === true ){
			
				for(var i=0; i<authServices.length; i++){
					var servicePtr = authServices[i];
					var authService = this.registry.getService(servicePtr);		
	
					authService.getKey().then(function(key){
						authenticationIds.push(key);
						authService.getUser().then(function(jsonData){
							var b = userService.updateUserInfo(jsonData.Location, userdata).then( function(args){
								if(args){
									messageService.setProgressResult(args);
								}else{
									messageService.setProgressResult( messages['User profile data successfully updated.'] );
								}
							}, function(error){
								messageService.setProgressResult(error);
							});
						});
					});
				}	
			} else {
				// There was an issue with the password modification attempt
				// Reset all password fields and focus on first one
				this.passwordFields.forEach(function(passwordField){
					passwordField.setValue(""); //$NON-NLS-0$
				});

				this.passwordFields[0].textfield.focus();
			}
		},
		
		show:function(){
			this.createElements();
			
			this.userService = this.registry.getService("orion.core.user"); //$NON-NLS-0$
			
			var messageService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
			
			var authenticationIds = [];
			
			var authServices = this.registry.getServiceReferences("orion.core.auth"); //$NON-NLS-0$
			
			var userService = this.userService;
			
			var settingsWidget = this;
			
			for(var i=0; i<authServices.length; i++){
				var servicePtr = authServices[i];
				var authService = this.registry.getService(servicePtr);		

				authService.getKey().then(function(key){
					authenticationIds.push(key);
					authService.getUser().then(function(jsonData){

						var b = userService.getUserInfo(jsonData.Location).then( function( accountData ){
							settingsWidget.username = accountData.login;
							settingsWidget.accountFields[0].setValue( accountData.login );
							if (accountData.Name){
								settingsWidget.accountFields[1].setValue( accountData.Name );
							} else {
								settingsWidget.accountFields[1].setValue( '' );
							}
							if (accountData.email){
								settingsWidget.accountFields[2].setValue( accountData.email );
							} else {
								settingsWidget.accountFields[2].setValue( '' );
							}
							settingsWidget.accountFields[3].setChecked( accountData.emailConfirmed );
						}, function(error) {
							messageService.setProgressResult(error);
						});
						
						settingsWidget.setHash( settingsWidget.iframe, jsonData.Location );	
					});
				});
			}
			
		},

		destroy: function() {
			if (this.node) {
				lib.empty(this.node);
				this.node = this.sections = null;
			}
		}
	});
	return UserSettings;
});