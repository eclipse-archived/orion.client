/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

dojo.addOnLoad(function() {

	// FIXME until we sort out where service registration happens, and how
	// dependencies on
	// services are expressed, just copy this code around...
	var registry = new eclipse.Registry();
	registry.start();

	var inputService = new eclipse.InputService(registry);
	registry.registerLocalService("IInputProvider", "EASInputProvider",
			inputService);

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
		registry : registry,
		browsePhotoButton : dijit.byId('browsePhotoButton'),
		saveProfileButton : dijit.byId('saveProfileButton'),
		deleteProfileButton : dijit.byId('deleteProfileButton'),
		resetProfileButton : dijit.byId('resetProfileButton'),
		photoURL : dojo.byId('photoURL'),
		userprofilefile : dojo.byId('userprofilefile'),
		loginInput : dojo.byId('loginInput'),
		nameInput : dojo.byId('nameInput'),
		passwordInput : dojo.byId('passwordInput'),
		passwordRetypeInput : dojo.byId('passwordRetypeInput'),
		userprofilefile : dojo.byId('userprofilefile')
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

			this.browsePhotoButton = options.browsePhotoButton;
			this.saveProfileButton = options.saveProfileButton;
			this.deleteProfileButton = options.deleteProfileButton;
			this.resetProfileButton = options.resetProfileButton;
			this.photoURL = options.photoURL;
			this.userprofilefile = options.userprofilefile;
			this.registry = options.registry;
			this.loginInput = options.loginInput;
			this.nameInput = options.nameInput;
			this.passwordInput = options.passwordInput;
			this.passwordRetypeInput = options.passwordRetypeInput;
			this.userprofilefile = options.userprofilefile;

			// TODO if no hash provided current user profile should be loaded

			this.registry.callService("IInputProvider", "inputChanged", null,
					[ dojo.hitch(this, this.setUserToDisplay) ]);

			dojo.connect(this.userprofilefile, "onmouseover", dojo.hitch(this,
					this.focusPhoto));
			dojo.connect(this.userprofilefile, "onmouseout", dojo.hitch(this,
					this.unfocusPhoto));
			dojo.connect(this.userprofilefile, "onchange", dojo.hitch(this,
					this.setPhotoUrl));
			dojo.connect(this.resetProfileButton, "onClick", dojo.hitch(this,
					this.redisplayLastUser));
			dojo.connect(this.saveProfileButton, "onClick", dojo.hitch(this,
					this.saveProfile));
			dojo.connect(this.deleteProfileButton, "onClick", dojo.hitch(this,
					this.deleteProfile));
		},
		focusPhoto : function() {
			this.browsePhotoButton.set('class', 'dijitButton dijitButtonHover');
		},
		unfocusPhoto : function() {
			this.browsePhotoButton.set('class', 'dijitButton');
		},
		setPhotoUrl : function() {
			this.photoURL.value = this.userprofilefile.value;
		},
		setUserToDisplay : function(userURI) {
			this.currentUserURI = userURI;
			dojo.xhrGet({
				url : userURI,
				headers : {
					"EclipseWeb-Version" : "1"
				},
				handleAs : "json",
				timeout : 15000,
				load : dojo.hitch(this, function(jsonData, secondArg) {
					this.displayProfileData(jsonData);
				}),
				error : function(error, ioArgs) {
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			})
		},
		displayProfileData : function(jsonData) {
			if (jsonData.login) {
				this.loginInput.value = jsonData.login;
				this.nameInput.value = jsonData.name;
				this.passwordInput.value = "";
				this.passwordRetypeInput.value = "";
			}
		},
		redisplayLastUser : function() {
			this.setUserToDisplay(this.currentUserURI);
		},
		saveProfile : function() {
			var password = null;
			if (this.passwordInput.value !== "") {
				if (this.passwordInput.value !== this.passwordRetypeInput.value) {
					alert("Passwords don't match");
					return;
				} else {
					password = this.passwordInput.value;
				}
			}

			var uri = this.currentUserURI + "?name=" + this.nameInput.value;
			if (password!=null) {
				uri = uri + "&password=" + password;
			}

			dojo.xhrPut({
				url : uri,
				headers : {
					"EclipseWeb-Version" : "1"
				},
				handleAs : "json",
				timeout : 15000,
				load : dojo.hitch(this, function(jsonData, secondArg) {
					this.redisplayLastUser();
					alert("Profile saved!");
				}),
				error : function(error, ioArgs) {
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			})
		},
		deleteProfile : function() {
			if (confirm("Do you really want to delete user "
					+ this.loginInput.value + "?")) {
				dojo.xhrDelete({
					url : this.currentUserURI,
					headers : {
						"EclipseWeb-Version" : "1"
					},
					handleAs : "json",
					timeout : 15000,
					load : dojo.hitch(this, function(jsonData, secondArg) {
						// TODO where to go?
						window.location.replace("navigate-table.html");
					}),
					error : function(error, ioArgs) {
						handleGetAuthenticationError(this, ioArgs);
						console.error("HTTP status code: ", ioArgs.xhr.status);
					}
				})
			}
		}
	}
	return Profile;
}());
dojo.addOnUnload(function() {
	registry.stop();
});