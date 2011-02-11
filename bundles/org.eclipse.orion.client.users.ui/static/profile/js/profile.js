/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

dojo.addOnLoad(function() {

	var serviceRegistry = new eclipse.ServiceRegistry();
	var inputService = new eclipse.InputService(serviceRegistry);
	var usersService = new eclipse.UsersService(serviceRegistry);
	var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);

	/* set the login information in toolbar */
	dojo.xhrGet({
		url : "/auth2",
		handleAs : 'javascript',
		sync : true,
		headers : {
			"EclipseWeb-Version" : "1"
		}
	});
	var profile = new eclipse.Profile({
		registry : serviceRegistry,
		pluginRegistry: pluginRegistry,
		saveProfileButton : dijit.byId('saveProfileButton'),
		deleteProfileButton : dijit.byId('deleteProfileButton'),
		resetProfileButton : dijit.byId('resetProfileButton'),
		profilePane: dojo.byId('profilePane'),
		profileExtentionPane: dojo.byId('profileExtentionsPane')
	});
});

/**
 * @namespace The global container for eclipse APIs.
 */
var eclipse = eclipse || {};

eclipse.Profile = (function() {

	function Profile(options) {
		this._init(options);
	}

	Profile.prototype = {
		_init : function(options) {

			this.saveProfileButton = options.saveProfileButton;
			this.deleteProfileButton = options.deleteProfileButton;
			this.resetProfileButton = options.resetProfileButton;
			this.registry = options.registry;
			this.pluginRegistry = options.pluginRegistry;
			this.profilePane = options.profilePane;
			this.profileExtentionPane = options.profileExtentionPane;
			this.isProfileRendered = false;
			
			// TODO if no hash provided current user profile should be loaded

			var userProfile = this;
			this.fieldMapping = new Object();
			
			
			if(this.pluginRegistry.getPlugin("/profile/userprofilePlugin.html")===null){
				this.pluginRegistry.installPlugin("/profile/userprofilePlugin.html");
			}
			
			this.mainProfileService = this.registry.getService("mainProfilePlugin");

			
			this.registry.getService("IInputProvider").then(function(input) {
				input.addEventListener("inputChanged", function(uri) {
					dojo.hitch(userProfile, userProfile.setUserToDisplay(uri));
				});
				input.getInput(function(uri) {
					dojo.hitch(userProfile, userProfile.setUserToDisplay(uri));
				});
			});
			

			dojo.connect(this.resetProfileButton, "onClick", dojo.hitch(this,
					this.redisplayLastUser));
			dojo.connect(this.saveProfileButton, "onClick", dojo.hitch(this,
					this.saveProfile));
			dojo.connect(this.deleteProfileButton, "onClick", dojo.hitch(this,
					this.deleteProfile));
		},
		setUserToDisplay : function(userURI) {
			this.currentUserURI = userURI;
			var profile = this;
			this.registry.getService("IUsersService").then(
					function(service) {
						service.getUserInfo(userURI, dojo.hitch(profile,
								function(jsonData, secondArg) {
									this.renderProfile(jsonData);
								}));
					});
		},
		renderProfile : function(jsonData) {
			if (jsonData.login) {
				
				var profile = this;
				
				if(this.isProfileRendered){
					dojo.hitch(profile, profile.populateData(jsonData));
					return;
				}
				
				
				if(this.mainProfileService!==null){
						this.mainProfileService.then(function(service) {
							service.getDivContent().then(function(content) {
								var affectedFields = dojo.hitch(profile, function () {return profile.draw(content, profile.profilePane);});
								dojo.hitch(profile, profile.populateData(jsonData, affectedFields()));
							});
						});

				}
				
				var profileExtentions = this.registry.getServiceReferences("profilePlugin");
				for (var i=0; i<profileExtentions.length; i++) {
					this.registry.getService(profileExtentions[i]).then(function(service) {
						service.getDivContent().then(function(content) {
							var affectedFields = dojo.hitch(profile, function() {return profile.draw(content, profile.profileExtentionPane);});
							dojo.hitch(profile, profile.populateData(jsonData, affectedFields()));
						});
					});
				}
				this.isProfileRendered = true;
				
			}
		},
		redisplayLastUser : function(){
			var profile = this;
			this.registry.getService("IUsersService").then(
					function(service) {
						service.getUserInfo(profile.currentUserURI, dojo.hitch(profile,
								function(jsonData, secondArg) {
									this.populateData(jsonData);
								}));
					});
		},
		populateData: function(jsonData, fieldMapping){
			if(!fieldMapping){
				fieldMapping = this.fieldMapping;
			}
			for(var key in fieldMapping){
				if(dojo.byId(key).innerHTML){
					dojo.byId(key).innerHTML = jsonData[fieldMapping[key]] ? jsonData[fieldMapping[key]] : "&nbsp;";
					dojo.byId(key).value = jsonData[fieldMapping[key]] ? jsonData[fieldMapping[key]] : "";
				}else{
					dojo.byId(key).value= jsonData[fieldMapping[key]] ? jsonData[fieldMapping[key]] : "";
				}
			}
		},
		draw: function(content, placeholder){
			var affectedFields = new Object();
			var profile = this;
			for(var i=0; i<content.sections.length; i++){
				
				var sectionPane = new dijit.layout.ContentPane({id: content.sections[i].id,
			    		dojoType: "dijit.layout.ContentPane",
			    		region: "top",
			    		style: "height: 20px;",
			    		content: "<h2>"+content.sections[i].name+"</h2>"
				});
				sectionPane.placeAt(placeholder);
				dojo.addClass(sectionPane.id, "toolbar");
				
				
				var sectionContents = dojo.create("div", null, placeholder);
				
				for(var j=0; j<content.sections[i].data.length; j++){
					var data = content.sections[i].data[j];
					var dataDiv = dojo.create("div", null, sectionContents);
					dojo.create("label", {className: "userprofile", innerHTML: data.label, "for": data.id}, dataDiv);
					if(data.readonly){
						dojo.create("p", {className: "userprofile", id: data.id, innerHTML: "&nbsp;"}, dataDiv);
					}else{
						var input = dojo.create("input", {className: "userprofile", id: data.id, value: "", type: data.type ? data.type : "text"}, dataDiv);
						dojo.connect(input, "onkeypress", dojo.hitch(profile, function(event){ if (event.keyCode === 13) { this.saveProfile(); } else {return true;}}));
					}
					this.fieldMapping[data.id] = data.value;
					affectedFields[data.id] = data.value;
				}
			}
			return affectedFields;
		},
		saveProfile : function() {
			var data = new Object();
			for(var key in this.fieldMapping){
				data[this.fieldMapping[key]] = dojo.byId(key).value;
			}

			var profile = this;
			this.registry.getService("IUsersService").then(
					function(service) {
						service.updateUserInfo(profile.currentUserURI,
								data, dojo.hitch(
										profile, function(jsonData, secondArg) {
											this.redisplayLastUser();
											alert("Profile saved!");

										}));
					});
		},
		deleteProfile : function() {
			var login = dojo.byId("login") ? dojo.byId("login").value
					: this.currentUserURI;
			if (confirm("Do you really want to delete user "
					+ login + "?")) {
			var profile = this;
			this.registry.getService("IUsersService").then(
					function(service) {
						service.deleteUser(profile.currentUserURI, dojo.hitch(
								profile, function(jsonData, secondArg) {
									// TODO where to go?
									window.location
											.replace("navigate-table.html");
								}));
					});
			}

		}
	};
	return Profile;
}());
dojo.addOnUnload(function() {
	registry.stop();
});