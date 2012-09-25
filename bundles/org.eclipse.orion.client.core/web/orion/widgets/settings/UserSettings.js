/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets orion  window console define localStorage*/
/*jslint browser:true*/

/* This SettingsContainer widget is a dojo border container with a left and right side. The left is for choosing a 
   category, the right shows the resulting HTML for that category. */

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/section', 'orion/git/GitCredentialsStorage', 'orion/widgets/settings/LabeledTextfield', 'orion/widgets/settings/LabeledCheckbox', 'orion/widgets/settings/LabeledCommand', 'orion/widgets/settings/LabeledToggle', 'profile/UsersService', 'orion/widgets/settings/Section' ], function(messages, require, dojo, dijit, mUtil, mCommands, mSection, GitCredentialsStorage) {

	dojo.declare("orion.widgets.settings.UserSettings", [dijit._Widget, dijit._Templated], { //$NON-NLS-0$
	
		// templateString: '<input type="text" name="myname" data-dojo-attach-point="textfield" data-dojo-attach-event="onchange:change"/>',
		
		dispatch: true,
		
		templateString: '<div>' +  //$NON-NLS-0$
							'<div data-dojo-attach-point="table">' +  //$NON-NLS-0$
								'<div class="sectionWrapper toolComposite">' +
									'<div class="sectionAnchor sectionTitle layoutLeft">'+messages['User Profile']+'</div>' + 
									'<div id="userCommands" class="layoutRight sectionActions"></div>' +
								'</div>' + //$NON-NLS-2$ //$NON-NLS-0$
								'<div data-dojo-attach-point="sections">' + //$NON-NLS-0$
								
								'</sections>' + //$NON-NLS-0$
								'<div></div>' +
								
							'</div>' + //$NON-NLS-0$
							
							'<div data-dojo-attach-point="gitTable">' +  //$NON-NLS-0$
								'<div class="sectionWrapper toolComposite">' +
									'<div class="sectionAnchor sectionTitle layoutLeft">'+messages['Git Credentials Storage']+'</div>' + 
									'<div id="gitCommands" class="layoutRight sectionActions"></div>' +
								'</div>' + //$NON-NLS-2$ //$NON-NLS-0$
								'<div data-dojo-attach-point="gitSections">' + //$NON-NLS-0$
								
								'</sections>' + //$NON-NLS-0$
								'<div></div>' +
								
							'</div>' + //$NON-NLS-0$
							
							'<div data-dojo-attach-point="linkedSection"></div>' +
						'</div>', //$NON-NLS-0$
						
		setHash: function(iframe, hash){
			if(iframe.src.indexOf("#")>0){ //$NON-NLS-0$
				iframe.src = iframe.src.substr(0, iframe.src.indexOf("#")) + "#" + hash; //$NON-NLS-1$ //$NON-NLS-0$
			}else{
				iframe.src = iframe.src + "#" + hash; //$NON-NLS-0$
			}
		},
		
		refreshGitCredentials : function(){
			var gitCredentialsStorage = new GitCredentialsStorage();
			if(gitCredentialsStorage.isBrowserEnabled()){
				this.gitCredentialsFields[0].setChecked(gitCredentialsStorage.isUserEnabled());
			}
		},
		
		postCreate: function(){
			
			this.inherited( arguments );
			
			/* - account ----------------------------------------------------- */
			
			this.accountFields = [];
			
			this.accountFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Username'], editmode:'readonly'} ) ); //$NON-NLS-1$
			this.accountFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Full Name']} ) );
			this.accountFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Email Address']} ) );
			
			var accountSection = new orion.widgets.settings.Section( {sectionName:messages['Account'], container: this.sections, sections: this.accountFields } );
			
			accountSection.startup();
			
			/* - password ---------------------------------------------------- */
			
			this.passwordFields = [];
			
			this.passwordFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Current Password'], inputType:'password'} ) ); //$NON-NLS-1$
			this.passwordFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['New Password'], inputType:'password'} ) ); //$NON-NLS-1$
			this.passwordFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Verify Password'], inputType:'password'} ) ); //$NON-NLS-1$
			
			var passwordSection = new orion.widgets.settings.Section( {sectionName:messages['Password'], container: this.sections, sections: this.passwordFields } );
			
			/* - linked ------------------------------------------------------ */
			
//			this.linkedFields = [];
//			
//			var toggleLabels = [ messages['Google'], messages['Yahoo'], messages['AOL'], messages['OpenId'] ];
//			
//			var openIds = [ 'https://www.google.com/accounts/o8/id', 'http://me.yahoo.com', 'http://openid.aol.com/', 'http://myopenid.com' ];//$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
//			
//			var toggleData = {toggleOnState:messages["Linked"], toggleOffState:messages["Unlinked"], toggleOnSwitch:messages['Link'], toggleOffSwitch:messages['Unlink']};
//			
//			for( var toggle = 0; toggle< 4; toggle++ ){
//				toggleData.fieldlabel = toggleLabels[toggle];
//				
//				var toggleWidget = new orion.widgets.settings.LabeledToggle( toggleData );
//				
//				toggleWidget.onAction = dojo.hitch( this, 'confirmOpenId', openIds[toggle] ); //$NON-NLS-0$
//				
//				this.linkedFields.push( toggleWidget );
//				
//			}
//			
//			var linkedSection = new orion.widgets.settings.Section( {sectionName:messages['Linked Accounts'], container: this.sections, sections: this.linkedFields } );

			/* - git --------------------------------------------------------- */
			
			this.gitFields = [];
			
			this.gitFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Git Email Address']} ) );
			this.gitFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Git Username']} ) );
			
			var gitSection = new orion.widgets.settings.Section( {sectionName:messages["Git Config"], container: this.sections, sections: this.gitFields } );
			
			var updateCommand = new mCommands.Command({
				name: messages["Update"],
				tooltip: messages["Update Profile Settings"],
				id: "orion.updateprofile", //$NON-NLS-0$
				callback: dojo.hitch(this, function(data){
					this.update(data.items);
				})
			
			});
			
			this.commandService.addCommand(updateCommand);
			this.commandService.registerCommandContribution('profileCommands', "orion.updateprofile", 3); //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.renderCommands('profileCommands', dojo.byId( 'userCommands' ), this, this, "button"); //$NON-NLS-1$ //$NON-NLS-0$		
			
			//--------- git credentials -------------------------------
			this.gitCredentialsFields = [];
			
			this.gitCredentialsFields.push( new orion.widgets.settings.LabeledCheckbox( {fieldlabel:messages["Enable Storage"]} ) );
			var gitCredentialsSection;
			var that = this;
			
			// erase private key command
			var erasePrivateKeyCommand = new mCommands.Command({
				name: messages["Delete"],
				id: "eclipse.orion.git.erasePrivateKey",
				callback : function(data){
					var repository = data.items.gitUrl;
					var keyIndex = data.items.keyIndex;
					
					var messageService = that.registry.getService("orion.page.message");
					
					var gitCredentialsStorage = new GitCredentialsStorage();
		       		if(gitCredentialsStorage.isBrowserEnabled()){
		       			gitCredentialsStorage.erasePrompt(repository);
		       			messageService.setProgressResult("Deleted private key for " + repository);
		       			that.gitCredentialsFields[keyIndex+1].destroy();
		       		}
				},
				visibleWhen : function(item){
					return true;
				}
			});
			this.commandService.addCommand(erasePrivateKeyCommand);
			this.commandService.registerCommandContribution("repositoryItemCommands", "eclipse.orion.git.erasePrivateKey", 1);
			
			var gitCredentialsStorage = new GitCredentialsStorage();
			if(gitCredentialsStorage.isBrowserEnabled()){
				var repositories = gitCredentialsStorage.getRepositories();
				
				for(var i=0; i<repositories.length; ++i){
					if(!gitCredentialsStorage.getPrompt(repositories[i])){
						var labeledCommand = new orion.widgets.settings.LabeledCommand( {keyIndex: i, fieldlabel: repositories[i], commandService: this.commandService, scopeId: "repositoryItemCommands"} );
						this.gitCredentialsFields.push(labeledCommand);
					}
				}
			}
			
			gitCredentialsSection = new orion.widgets.settings.Section( {sectionName:"", container: this.gitSections, sections: this.gitCredentialsFields} );
			
			var updateGitCredentialsCommand = new mCommands.Command({
				name: messages["Update"],
				tooltip: messages["Update Git Credentials"],
				id: "orion.updateGitCredentials", //$NON-NLS-0$
				callback: dojo.hitch(this, function(data){
					this.updateGitCredentials(data.items);
				})
			
			});
			
			this.commandService.addCommand(updateGitCredentialsCommand);
			this.commandService.registerCommandContribution('gitProfileCommands', "orion.updateGitCredentials", 2); //$NON-NLS-1$ //$NON-NLS-0$
			
			this.commandService.renderCommands('gitProfileCommands', dojo.byId( 'gitCommands' ), this, this, "button"); //$NON-NLS-1$ //$NON-NLS-0$		
			
			this.linkedAccountSection = new mSection.Section(this.linkedSection, {
							id: "linkedAccountSection", //$NON-NLS-0$
							title: "Linked Accounts", //$NON-NLS-0$
							content: '<div id="iFrameContent"></div>', //$NON-NLS-0$
							canHide: true,
							useAuxStyle: true,
							hidden: true,
							slideout: true
			});
			
			//var desc = { src: "../mixlogin/manageopenids", style: "border: 0px; width: 500px" };
			var desc = { src: "../mixloginstatic/manageOpenids.html", style: "border: 0px; width: 500px" };
			
			this.iframe = dojo.create("iframe", desc, dojo.byId( 'iFrameContent' ) ); //$NON-NLS-0$
			
			this.startUp();
		},
		
		confirmOpenId: function(openid){
			if (openid !== "" && openid !== null) {
				this.win = window.open( "../mixlogin/manageopenids/openid?openid=" + encodeURIComponent(openid),"openid_popup", "width=790,height=580" ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
		},
		
	update: function(data){
			
			var authenticationIds = [];
			
			var authServices = this.registry.getServiceReferences("orion.core.auth"); //$NON-NLS-0$
			
			var messageService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
			
			var userService = this.userService;
			
			var settingsWidget = this;
			
			var userdata = {};
			
			userdata.GitMail = settingsWidget.gitFields[0].getValue();
			userdata.GitName = settingsWidget.gitFields[1].getValue();
			
			userdata.login = settingsWidget.accountFields[0].getValue();
			userdata.Name = settingsWidget.accountFields[1].getValue();
			userdata.email = settingsWidget.accountFields[2].getValue();
			
			var pword = settingsWidget.passwordFields[1].getValue();
			var pwordRetype = settingsWidget.passwordFields[2].getValue();

			if( pword.length > 0 ){
			
				if( pword !== pwordRetype ){
					messageService.setProgressResult( 'New password, and retyped password do not match' );
					
					this.dispatch = false;
					
				}else{
				
					if( settingsWidget.passwordFields[0].getValue().length > 0 ){
						userdata.oldPassword = settingsWidget.passwordFields[0].getValue();
						userdata.password = pword;
						userdata.passwordRetype = pwordRetype;
					
						this.dispatch = true;
					
					}else{
						messageService.setProgressResult( 'Need to type your current password' );
					
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
						
							var data = jsonData;
							
							var b = userService.updateUserInfo(jsonData.Location, userdata).then( function(args){
								messageService.setProgressResult( messages['User profile data successfully updated.'] );
								
								if( userdata.Name ){
									var userMenu = dijit.byId( 'logins' ); //$NON-NLS-0$
									userMenu.set( 'label', userdata.Name  ); //$NON-NLS-0$
								}	
							});
						});
					});
				}	
			}
		},
		
		updateGitCredentials : function(data){
			var messageService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
			
			// git authentication update
			var gitCredentialsStorage = new GitCredentialsStorage();
			if(gitCredentialsStorage.isBrowserEnabled()){
				if( this.gitCredentialsFields[0].isChecked() ){
					if(window.confirm(messages["Please be aware that your credentials will be stored persistently in the browser."] + '\n' + messages["Do you wish to enable the Key Storage?"])){
						gitCredentialsStorage.userEnable();
					} else { return; }
				} else { gitCredentialsStorage.userDisable(); }
				
				messageService.setProgressResult( messages['Git Credentials successfully updated.'] );
			}
		},
		
		startUp:function(){
			
			this.userService = this.registry.getService("orion.core.user"); //$NON-NLS-0$
			
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
					
						var data = jsonData;
						
						var b = userService.getUserInfo(jsonData.Location).then( function( accountData ){

							settingsWidget.accountFields[0].setValue( accountData.login );
							settingsWidget.accountFields[1].setValue( accountData.Name );
							settingsWidget.accountFields[2].setValue( accountData.email );
							
							if( accountData.GitMail ){
								settingsWidget.gitFields[0].setValue( accountData.GitMail );
							}
							
							if( accountData.GitName ){
								settingsWidget.gitFields[1].setValue( accountData.GitName );	
							}
						});
						
						settingsWidget.setHash( settingsWidget.iframe, jsonData.Location );	
					});
				});
			}
			
			// git authentication startup
			this.refreshGitCredentials();
		}
	});
});

