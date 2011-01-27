/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo window */
dojo.require("dijit.form.Button");

dojo.addOnLoad(function() {
	dojo.xhrGet({
		url : "/users/current",
		timeout : 5000,
		sync: true,
		handleAs : "json",
		load : function (data) {
			var b = dojo.byId("username");
			if (b) {
				b.innerHTML = data.login;
				dojo.addClass(b, "button");
			}
			serviceRegistry.getService("IUsers").then(function(service) {
				service.setUser(data.login);
			});
			
			var b2 = dojo.byId("userProfile");
			if (b2) {
				b2.href = "/tasks/user.html?uN=" + data.login + "#userProfile";
			}
		},
		error : function (error) {
			var b = dojo.byId("username");
			if (b)
				b.innerHTML = "";
		}
	});
	
	// Create sign out programmatically:	
	var signout = document.createElement('span');
	signout.appendChild(document.createTextNode("Sign out"));
	signout.onclick = function() {
			signOutUser();
	};
	signout.id = "signOutUser";
	dojo.addClass(signout, "commandLink");
});

function ensureSignedIn() {
	return dojo.xhrGet({
		url : "/users/current",
		timeout : 5000,
		sync: true,
		handleAs : "json",
		load : function (data) {
			if ((data == null) || (data.login == null))
				window.location="tasks/login.html";
		},
		error : function (error) {
			window.location="tasks/login.html";
		}
	});
}

function signOutUser() {
	var login = dojo.byId("username").innerHTML;

	if (login == null || login.length == 0)
		return;

	dojo.xhrPost({
		url: "/users/" + login,
		timeout: 5000,
		content: {
			"end" : "true"
		},
		handleAs: "json",
		load: function (data) {
			window.location="tasks/login.html";
		},
		error: function (error) {
			window.location="tasks/login.html";
		}
	});
}
