/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window dijit document widgets eclipse:true serviceRegistry dojo login logout */
/*browser:true*/

// begin HTML fragment for top area
var top =
'<div id="bannerLeftArea" style="float: left;">' +
	'<a id="home" href="/navigate-table.html"><img class="toolbarLabel" src="/images/orion.png" alt="Orion Logo" align="top"></a>' +
'</div>' +
'<div class="leftInnerToolbar">' +
	'<b class="currentLocation" id="pageTitle"></b>' +
	'<b class="statuspane" id="statusPane"></b>' +
'</div>' +
'<div id="eclipseWebToolbar" class="innerToolbar">' +
	'<span id="pageActions"></span>' +
	'<span id="globalActions"></span>' +
	'<input type="search" id="search" class="searchbox">' +
	'<span id="userInfo" class="statuspane"></span>' +
'</div>';
// end HTML fragment

/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * Utility methods
 * @namespace eclipse.fileCommandUtils generates commands
 */
 
eclipse.globalCommandUtils = eclipse.globalCommandUtils || {};

eclipse.globalCommandUtils.generateUserInfo = function(userName, userStatusText) {
	// add the logout button to the toolbar if available
	var userInfo = dojo.byId("userInfo");
	if (userInfo) {
		var userMenu = dijit.byId("userMenu");
		if (userMenu) {
			userMenu.destroy();
		}
		dojo.empty(userInfo);
		if (userName) {
			// user menu
			var newMenu= new dijit.Menu({
				style: "display: none;",
				id: "userMenu"
			});
			// signout item
			var menuitem = new dijit.MenuItem({
				label: "Sign out",
				onClick: logout
			});
			newMenu.addChild(menuitem);
			var menuButton = new dijit.form.DropDownButton({
				label: userName,
				dropDown: newMenu,
				title: userStatusText
		        });
		        dojo.addClass(menuButton.domNode, "commandImage");
			dojo.place(menuButton.domNode, userInfo, "last");
		} else {
			var signout = document.createElement('span');
			signout.appendChild(document.createTextNode("Sign in"));
			signout.onclick = login;
			signout.id = "signOutUser";
			userInfo.appendChild(signout);
			dojo.addClass(signout, "commandLink");
		}
	}
};

eclipse.globalCommandUtils.generateDomCommandsInBanner = function(commandService, handler) {
	var toolbar = dojo.byId("pageActions");
	if (toolbar) {	
		dojo.empty(toolbar);
		commandService.renderCommands(toolbar, "dom", handler, handler, "image");
		// we need a separator if the global commands are there
		var globalCommands = dojo.byId("globalActions");
		if (globalCommands && globalCommands.childNodes.length > 0) {
			var sep = commandService.generateSeparatorImage();
			dojo.place(sep, toolbar, "last");
		}
	}
};

eclipse.globalCommandUtils.generateBanner = function(parentId, commandService, prefsService, searcher, searchLocation, handler, editor) {
	var parent = dojo.byId(parentId);
	if (!parent) {
		throw "could not find banner parent, id was " + parentId;
	}
	
	// place the HTML fragment from above.
	dojo.place(top, parent, "only");
	
	// hook up search box behavior
	var searchField = dojo.byId("search");
	if (!searchField) {
		throw "failed to generate HTML for banner";
	}
	dojo.connect(searchField, "onkeypress", function(e){
		if (e.charOrCode === dojo.keys.ENTER) {
			if (searchLocation) {
				if (searchField.value.length > 0) {
					var query = searchLocation + searchField.value;
					// FIXME will be a search results page
					window.location = "navigate-table.html#"+query;
				}
			} else {
				window.alert("Can't search: SearchLocation not available");
			}
		}
	});
	
	// Initialize link to home page
	var homeNode = dojo.byId("home");
	if (homeNode) {
		prefsService.get("window/orientation", function (home) {
			home = home || "navigate-table.html";
			prefsService.put("window/orientation", home);
			homeNode.href=home;
		});
	}

	var openResourceDialog = function(searchLocation, searcher, /* optional */ editor) {
		var dialog = new widgets.OpenResourceDialog({
			SearchLocation: searchLocation,
			searcher: searcher
		});
		if (editor) {
			dojo.connect(dialog, "onHide", function() {
				editor.getEditorWidget().focus(); // Focus editor after dialog close, Dojo's doesn't work
			});
		}
		window.setTimeout(function() {dialog.show();}, 0);
	};
		
	var openResourceCommand = new eclipse.Command({
		name: "Open Resource",
		image: "images/find.gif",
		id: "eclipse.openResource",
		callback: function(item) {
			openResourceDialog(searchLocation, searcher, editor);
		}});
		
		
	if (editor) {
		editor.getEditorWidget().setKeyBinding(new eclipse.KeyBinding("r", true, true, false), openResourceCommand.id);
		editor.getEditorWidget().setAction(openResourceCommand.id, function() {
				openResourceDialog(searchLocation, searcher, editor);
				return true;
			});
	}
	commandService.addCommand(openResourceCommand, "global");
	commandService.registerCommandContribution("eclipse.openResource", 1, "globalActions");
	
	// generate global commands
	var toolbar = dojo.byId("globalActions");
	if (toolbar) {	
		dojo.empty(toolbar);
		commandService.renderCommands(toolbar, "global", handler, handler, "image");
	}	

};