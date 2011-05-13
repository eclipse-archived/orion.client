/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window dijit document widgets eclipse:true serviceRegistry dojo login logout */
/*browser:true*/

/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};


// BEGIN TOP BANNER FRAGMENT
var topHTMLFragment =
// a table?!!?  Yes, you can't mix CSS float right and absolutes to pin the bottom.
'<table style="border-spacing: 0px; border-collapse: collapse; width: 100%; height: 61px">' +
	'<tr class="topRowBanner">' +
		'<td width=93px rowspan=2><a id="home" href="/index.html"><img class="toolbarLabel" src="/images/headerlogo.gif" alt="Orion Logo" align="top"></a></td>' +
		'<td class="leftGlobalToolbar">' +
			'<span class="bannerSeparator"></span>' +
			'<span id="pageTitle" class="statuspane"></span>' +
			'<span class="bannerSeparator">  </span>' +  // empty space between title and status
			'<span class="statuspane" id="statusPane"></span>' +
		'</td>' + 
		'<td class="rightGlobalToolbar">' +
			'<span id="primaryNav" class="globalActions"></span>' +
			'<span id="globalActions" class="globalActions"></span>' +
			'<input type="search" id="search" class="searchbox">' +
			'<span class="bannerSeparator">|</span>' +
			'<span id="userInfo" class="statuspane"></span>' +
		'</td>' + 
		'</tr>' +
	'<tr class="bottomRowBanner">' +
		'<td colspan=2 id="pageToolbar" class="pageToolbar">' +
			'<div style="float: left;">' +
				'<span id="pageActionHolder" class="pageActionSeparator"></span>' +
				'<span id="pageActions" class="pageActions"></span>' +
			'</div>' +
			'<div style="float: right;">' +
				'<span id="notifications" class="pageActions"></span>' +
			'</div>' +
		'</td>' +
	'</tr>' +
'</table>';
// END TOP BANNER FRAGMENT

// BEGIN BOTTOM BANNER FRAGMENT
// styling of the surrounding div (text-align, etc) is in ide.css "footer"
var bottomHTMLFragment = '<img src="http://dev.eclipse.org/small_icons/emblems/emblem-important.png"/> ' + 
	'This is a Beta build of Orion.  You can use it, play with it and explore the ' +
	'capabilities but BEWARE your data may be lost. &nbsp;| '+ 
	'<a href="http://wiki.eclipse.org/Orion/FAQ">FAQ</a> | ' + 
	'<a href="https://bugs.eclipse.org/bugs/enter_bug.cgi?product=e4&component=Orion&version=0.2">Report a Bug</a> | ' +
	'<a href="http://www.eclipse.org/legal/privacy.php">Privacy Policy</a> | ' + 
	'<a href="http://www.eclipse.org/legal/termsofuse.php">Terms of Use</a> | '+ 
	'<a href="http://www.eclipse.org/legal/copyright.php">Copyright Agent</a>'; 
// END BOTTOM BANNER FRAGEMENT

/**
 * Utility methods
 * @namespace eclipse.fileCommandUtils generates commands
 */
 
eclipse.globalCommandUtils = eclipse.globalCommandUtils || {};

eclipse.globalCommandUtils.userDataToSet = null;

eclipse.globalCommandUtils.generateUserInfo = function(userName, userStatusText) {
	// add the logout button to the toolbar if available
	var userInfo = dojo.byId("userInfo");
	if (userInfo) {
		dojo.addClass(userInfo, "globalActions");
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
			
			// profile item
			var menuitem2 = new dijit.MenuItem({
				label: "Profile",
				onClick: 
					dojo.hitch(this, 
							function(){window.location = "/user-profile.html#/users/" + userName;})	
			});
			newMenu.addChild(menuitem2);
			
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
			signout.onclick = function(){login();};
			signout.id = "signOutUser";
			userInfo.appendChild(signout);
			dojo.addClass(signout, "commandLink");
		}
		
		eclipse.globalCommandUtils.userDataToSet = null;
	}else{
		eclipse.globalCommandUtils.userDataToSet = {userName : userName, userStatusText : userStatusText};
	}
};

eclipse.globalCommandUtils.generateDomCommandsInBanner = function(commandService, handler , pageActionDomId) {
	var toolbar = dojo.byId("pageActions");
	if(pageActionDomId) {
		toolbar = dojo.byId(pageActionDomId);
	}
	if (toolbar) {	
		dojo.empty(toolbar);
		commandService.renderCommands(toolbar, "dom", handler, handler, "image", null, null, true);  // use true when we want to force toolbar items to text
	}
};

eclipse.globalCommandUtils.generateBanner = function(parentId, serviceRegistry, commandService, prefsService, searcher, handler, editor) {
	// this needs to come from somewhere but I'm not going to do a separate get for it
	var searchLocation = "/filesearch?q=";
	var text;
	var parent = dojo.byId(parentId);
	if (!parent) {
		throw "could not find banner parent, id was " + parentId;
	}
	
	// place the HTML fragment from above.
	dojo.place(topHTMLFragment, parent, "only");
	
	// generate primary nav links. 
	var primaryNav = dojo.byId("primaryNav");
	if (primaryNav) {
		// Note that the shape of the "primaryNavigation" extension is not in any shape or form that could be considered final.
		// We've included it to enable experimentation. Please provide feedback on IRC or bugzilla.
		
		// The shape of a contributed navigation link is (for now):
		// info - information about the navigation link (object).
		//     required attribute: name - the name of the navigation link
		//     required attribute: id - the id of the navigation link
		//     required attribute: href - the URL for the navigation link
		//     optional attribute: image - a URL to an icon representing the link (currently not used, may use in future)
		var navLinks= serviceRegistry.getServiceReferences("primaryNavigation");
		for (var i=0; i<navLinks.length; i++) {
			serviceRegistry.getService(navLinks[i]).then(function(service) {
				var info = {};
				var propertyNames = navLinks[i].getPropertyNames();
				for (var j = 0; j < propertyNames.length; j++) {
					info[propertyNames[j]] = navLinks[i].getProperty(propertyNames[j]);
				}
				if (info.href && info.name) {
					var link = dojo.create("a", {href: info.href}, primaryNav, "last");
					dojo.addClass(link, "commandLink");
					text = document.createTextNode(info.name);
					dojo.place(text, link, "only");
				}
			});
		}
	}
	
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
					window.location = "searchResults.html#"+query;
				}
			} else {
				window.alert("Can't search: SearchLocation not available");
			}
		}
	});
	
	// Put page title in title area.  This gets replaced by breadcrumbs, etc. in some pages.
	var title = dojo.byId("pageTitle");
	if (title) {
		text = document.createTextNode(document.title);
		dojo.place(text, title, "last");
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
		
	dojo.connect(window.document, "onkeydown", function (evt){
		evt = evt || window.event;
		// HACK!  Fix when doing https://bugs.eclipse.org/bugs/show_bug.cgi?id=334200
		var type = evt.target.nodeName.toLowerCase();
		if (type === 'input' || type === 'textarea') {
			return;
		}
		if (evt.keyCode  === 84){ // "t" handler for open resource
			openResourceDialog(searchLocation, searcher, editor);
		}
	});
		
	if (editor) {
		editor.getEditorWidget().setKeyBinding(new eclipse.KeyBinding("r", true, true, false), openResourceCommand.id);
		editor.getEditorWidget().setAction(openResourceCommand.id, function() {
				openResourceDialog(searchLocation, searcher, editor);
				return true;
			});
	}
	commandService.addCommand(openResourceCommand, "global");
	// don't show this on the main toolbar anymore
	// commandService.registerCommandContribution("eclipse.openResource", 1, "globalActions");
	
	// generate global commands
	var toolbar = dojo.byId("globalActions");
	if (toolbar) {	
		dojo.empty(toolbar);
		// need to have some item, for global scoped commands it won't matter
		var item = handler || {};
		commandService.renderCommands(toolbar, "global", item, handler, "image");
	}
	
	if (eclipse.globalCommandUtils.userDataToSet) {
		//if last time we couldn't set the user name try again after creating the banner
		eclipse.globalCommandUtils.generateUserInfo(eclipse.globalCommandUtils.userDataToSet.userName,
				eclipse.globalCommandUtils.userDataToSet.userStatusText);
	}
	
	// generate the footer. The footer div id should not be assumed here, but that will be
	// fixed post M6.  
	if (bottomHTMLFragment) {
		var footer = dojo.byId("footer");
		if (footer) {
			dojo.place(bottomHTMLFragment, footer, "only");
		}
	}

};
