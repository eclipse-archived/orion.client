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

define(['require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/widgets/settings/LabeledTextfield', 'orion/widgets/settings/LabeledCheckbox', 'orion/widgets/settings/LabeledToggle', 'profile/UsersService', 'orion/widgets/settings/Section' ], function(require, dojo, dijit, mUtil, mCommands) {

	dojo.declare("orion.widgets.settings.UserSettings", [dijit._Widget, dijit._Templated], {
	
		// templateString: '<input type="text" name="myname" data-dojo-attach-point="textfield" data-dojo-attach-event="onchange:change"/>',
		
		templateString: '<div>' + 
							'<div data-dojo-attach-point="table" class="displayTable">' + 
								'<h1 id="General">User Profile</h1>' + 
								'<div data-dojo-attach-point="sections">' +
								'</sections>' +
							'</div>' +
						'</div>',
		
		postCreate: function(){
			
			this.inherited( arguments );
			
			/* - account ----------------------------------------------------- */
			
			this.accountFields = [];
			
			this.accountFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:'Username', editmode:'readonly'} ) );
			this.accountFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:'Full Name'} ) );
			this.accountFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:'Email Address'} ) );
			
			var accountSection = new orion.widgets.settings.Section( {sectionName:'Account', container: this.sections, sections: this.accountFields } );
			
			accountSection.startup();
			
			/* - password ---------------------------------------------------- */
			
			this.passwordFields = [];
			
			this.passwordFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:'Current Password', inputType:'password'} ) );
			this.passwordFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:'New Password', inputType:'password'} ) );
			this.passwordFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:'Verify Password', inputType:'password'} ) );
			
			var passwordSection = new orion.widgets.settings.Section( {sectionName:'Password', container: this.sections, sections: this.passwordFields } );
			
			/* - linked ------------------------------------------------------ */
			
			this.linkedFields = [];
			
			var toggleLabels = [ 'Google', 'Yahoo', 'AOL', 'OpenId' ];
			
			var openIds = [ 'https://www.google.com/accounts/o8/id', 'http://me.yahoo.com', 'http://openid.aol.com/', 'http://myopenid.com' ];
			
			var toggleData = {toggleOnState:"Linked", toggleOffState:"Unlinked", toggleOnSwitch:'Link', toggleOffSwitch:'Unlink'};
			
			for( var toggle = 0; toggle< 4; toggle++ ){
				toggleData.fieldlabel = toggleLabels[toggle];
				
				var toggleWidget = new orion.widgets.settings.LabeledToggle( toggleData );
				
				toggleWidget.onAction = dojo.hitch( this, 'confirmOpenId', openIds[toggle] );
				
				this.linkedFields.push( toggleWidget );
				
			}
			
			var linkedSection = new orion.widgets.settings.Section( {sectionName:'Linked Accounts', container: this.sections, sections: this.linkedFields } );

			/* - git --------------------------------------------------------- */
			
			this.gitFields = [];
			
			this.gitFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:'Git Email Address'} ) );
			this.gitFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:'Git Username'} ) );
			
			var gitSection = new orion.widgets.settings.Section( {sectionName:'Git Credentials', container: this.sections, sections: this.gitFields } );
			
			var updateCommand = new mCommands.Command({
				name: "Update",
				tooltip: "Update Profile Settings",
				id: "orion.updateprofile",
				callback: dojo.hitch(this, function(data){
					this.update(data.items);
				})
			
			});
			
			this.commandService.addCommand(updateCommand);

			this.commandService.registerCommandContribution('profileCommands', "orion.updateprofile", 2);
			
			this.commandService.renderCommands('profileCommands', this.toolbarID, this, this, "button");
			
			this.startUp();
		},
		
		confirmOpenId: function(openid){
			if (openid !== "" && openid !== null) {
				this.win = window.open( "../mixlogin/manageopenids/openid?openid=" + encodeURIComponent(openid),"openid_popup", "width=790,height=580" );
			}
		},
		
		update: function(data){
			console.log( 'update' );
			
			var authenticationIds = [];
			
			var authServices = this.registry.getServiceReferences("orion.core.auth");
			
			var messageService = this.registry.getService("orion.page.message");
			
			var userService = this.userService;
			
			var settingsWidget = this;
			
			var userdata = {};
			
			userdata.GitMail = settingsWidget.gitFields[0].getValue();
			userdata.GitName = settingsWidget.gitFields[1].getValue();
			
			userdata.login = settingsWidget.accountFields[0].getValue();
			userdata.Name = settingsWidget.accountFields[1].getValue();
			userdata.email = settingsWidget.accountFields[2].getValue();
			
			userdata.password = settingsWidget.passwordFields[1].getValue();
			userdata.passwordRetype = settingsWidget.passwordFields[1].getValue();

			if( userdata.password === userdata.passwordRetype ){
			
			for(var i=0; i<authServices.length; i++){
				var servicePtr = authServices[i];
				var authService = this.registry.getService(servicePtr);		

				authService.getKey().then(function(key){
					authenticationIds.push(key);
					authService.getUser().then(function(jsonData){
					
						var data = jsonData;
						
						var b = userService.updateUserInfo(jsonData.Location, userdata).then( function(args){
							messageService.setProgressResult('changed');
						});
					});
				});
			}		
			}else{
				messageService.setProgressResult( 'New password, and retyped password do not match' );
			}
		},
		
		startUp:function(){
			
			this.userService = this.registry.getService("orion.core.user");
			
			var authenticationIds = [];
			
			var authServices = this.registry.getServiceReferences("orion.core.auth");
			
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
							
							settingsWidget.gitFields[0].setValue( accountData.GitMail );
							settingsWidget.gitFields[1].setValue( accountData.GitName );							
						});
					});
				});
			}
		}
	});
});

