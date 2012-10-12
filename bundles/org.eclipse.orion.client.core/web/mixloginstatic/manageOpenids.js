/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global alert confirm console define document window */

define(["dojo", "dojo/hash", "domReady!"], function(dojo) {
	var lastHash;
	var jsonData;

	var loadAttachedOpenIds, loadUserData;

	function removeOpenId(openid) {
		if (confirm("Are you sure you want to remove " + openid + " from the list of your external accounts?")) {
			var openids = jsonData.properties.openid.split('\n');
			var newopenids = "";
			for (var i = 0; i < openids.length; i++) {
				if (openids[i] !== openid) {
					newopenids += (openids[i] + '\n');
				}
			}
			jsonData.properties.openid = newopenids;
	
			dojo.xhrPut({
				url: jsonData.Location,
				putData: dojo.toJson(jsonData),
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 15000,
				load: function(returnData, secondArg) {
					loadUserData(jsonData.Location);
				},
				error: function(error, ioArgs) {
					console.error(error.message);
				}
			});
	
		}
	}
	
	loadAttachedOpenIds = function(userjsonData) {
		jsonData = userjsonData;
		var divId = "openidList";
		var table = dojo.create("table", null, divId, "only");
		if (jsonData.properties && jsonData.properties.openid) {
	
			var openids = jsonData.properties.openid ? jsonData.properties.openid.split('\n') : [];
	
			if (openids.length > 0) {
				var thead = dojo.create("thead", null, table, "only");
				dojo.addClass(thead, "navTableHeading");
				var tr = dojo.create("tr", null, thead, "last");
				var td = dojo.create("td", {
					innerHTML: "<h2>External Id</h2>"
				}, tr, "last");
				dojo.addClass(td, "navColumn");
				td = dojo.create("td", {
					innerHTML: "<h2>Actions</h2>"
				}, tr, "last");
	
			}
	
			for (var i = 0; i < openids.length; i++) {
	
				var openid = openids[i];
				if (openid === "") {
					continue;
				}
				var tr = dojo.create("tr", null, table, "last");
				dojo.style(tr, "verticalAlign", "baseline");
				dojo.addClass(tr, i % 2 === 0 ? "lightTreeTableRow" : "darkTreeTableRow");
				var td = dojo.create("td", null, tr, "last");
				dojo.addClass(td, "navColumn");
				var span = dojo.create("span", null, td, "only");
				var textNode = document.createTextNode(openid.length > 70 ? (openid.substring(0, 65) + "...") : openid);
				span.title = openid;
				dojo.place(textNode, span);
	
	
				td = dojo.create("td", null, tr, "last");
				dojo.addClass(td, "navColumn");
				var removeLink = dojo.create("a", {
					innerHTML: "Remove",
					title: "Remove " + openid,
					id: "remlink" + i,
					style: "visibility: hidden"
				}, td, "last");
	
				dojo.connect(removeLink, "onclick", removeLink, dojo.hitch(this, function(openid) {
					removeOpenId(openid);
				}, openid));
				dojo.connect(removeLink, "onmouseover", removeLink, dojo.hitch(this, function(removeLink) {
					removeLink.style.cursor = "pointer";
				}, removeLink));
				dojo.connect(removeLink, "onmouseout", removeLink, dojo.hitch(this, function(removeLink) {
					removeLink.style.cursor = "default";
				}, removeLink));
	
				dojo.connect(tr, "onmouseover", tr, dojo.hitch(this, function(removeLink) {
					dojo.style(removeLink, "visibility", "visible");
				}, removeLink));
	
				dojo.connect(tr, "onmouseout", tr, dojo.hitch(this, function(removeLink) {
					dojo.style(removeLink, "visibility", "hidden");
				}, removeLink));
	
			}
		}
	};
	
	loadUserData = function(userLocation){
			dojo.xhrGet({
				url : userLocation,
				headers : {
					"Orion-Version" : "1"
				},
				handleAs : "json",
				timeout : 15000,
				load : function(jsonData, secondArg) {
					loadAttachedOpenIds(jsonData);
				},
				error : function(error, ioArgs) {
					console.error(error.message);
				}
			});
	 };
	
	function onHashChange(hash) {
		if (lastHash === hash) {
			return;
		}
	
		loadUserData(hash);
	
		lastHash = hash;
	}
	
	
	// this function is directly invoked by ManageOpenidsServlet, must be global
	window.handleOpenIDResponse = function(openid) {

		var openids = jsonData.properties.openid ? jsonData.properties.openid.split('\n') : [];
		for (var i = 0; i < openids.length; i++) {
			if (openids[i] === openid) {
				return;
			}
		}
	
		if (!jsonData.properties.openid) {
			jsonData.properties.openid = openid;
		} else {
			jsonData.properties.openid += '\n' + openid;
		}
	
		dojo.xhrPut({
			url: jsonData.Location,
			putData: dojo.toJson(jsonData),
			headers: {
				"Orion-Version": "1"
			},
			handleAs: "json",
			timeout: 15000,
			load: function(returnData, secondArg) {
				loadUserData(jsonData.Location);
			},
			error: function(error, ioArgs) {
				console.error(error.message);
			}
		});
	
	};
	
	function confirmOpenId(openid) {
		if (openid !== "" && openid !== null) {
			window.open("../mixlogin/manageopenids/openid?openid=" + encodeURIComponent(openid), "openid_popup", "width=790,height=580");
		}
	}

	function createProviderLink(name, imageUrl, onclick) {
		var img = document.createElement("img");
		img.className = "loginWindow";
		img.id = img.alt = img.title = name;
		img.src = imageUrl;

		var a = document.createElement("a");
		a.className = "loginWindow";
		a.onclick = onclick;
		a.setAttribute("aria-labelledby", "addExternalAccount " + name);
		a.appendChild(img);
		return a;
	}

	// Page glue code starts here
	dojo.subscribe("/dojo/hashchange", this, function() {
		onHashChange(dojo.hash());
	});

	onHashChange(dojo.hash());

	dojo.xhrGet({
		url: "../mixlogin/manageopenids",
		handleAs: "json"
	}).then(function(providers) {
		var providerElements = providers.map(function(provider) {
			return createProviderLink(provider.Name, provider.Image, confirmOpenId.bind(null, provider.Url));
		});
		providerElements.push(createProviderLink("Mozilla Persona", "../mixloginstatic/images/persona.png",
			alert.bind(null, "To link your account with a Persona, set your Orion email address above to match your Persona email address.")));

		var openIdContainer = document.getElementById("newOpenId");
		providerElements.forEach(function(provider) {
			openIdContainer.appendChild(provider);
			openIdContainer.appendChild(document.createTextNode(" "));
		});
	});
});
