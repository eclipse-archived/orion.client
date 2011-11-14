/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window document define login logout localStorage orion */
/*browser:true*/

define(['require', 'dojo', 'dijit', 'orion/commands', 'orion/util', 'orion/textview/keyBinding',
        'dijit/Menu', 'dijit/MenuItem', 'dijit/form/DropDownButton', 'orion/widgets/OpenResourceDialog', 'orion/widgets/LoginDialog'], function(require, dojo, dijit, mCommands, mUtil, mKeyBinding){

	/**
	 * Constructs a new command parameter collector
	 * @param {DOMElement} the parent of the banner
	 * @class CommandParameterCollector can collect parameters in a way that is integrated with the 
	 * common header elements
	 * @name orion.globalCommands.CommandParameterCollector
	 */	
	function CommandParameterCollector (parent) {
		// get the banner node's parent.  If it is managed by dijit, we will need to layout
		this.layoutWidgetId = parent.parentNode.id;
	}
	CommandParameterCollector.prototype =  {
	
		_getLayoutWidget: function() {
			return this.layoutWidget || dijit.byId(this.layoutWidgetId);
		},
		/**
		 * Closes any active parameter collectors
		 *
		 * @param {DOMElement} commandNode the node representing the command
		 */
		close: function (commandNode) {
			if (this.parameterArea) {
				dojo.empty(this.parameterArea);
			}
			if (this.parameterContainer) {
				dojo.removeClass(this.parameterContainer, this.activeClass);
			}
			if (this.dismissArea) {
				 dojo.empty(this.dismissArea);
			}
			if (commandNode) {
				dojo.removeClass(commandNode, "activeCommand");
			}
			if (this._getLayoutWidget()) {
				this._getLayoutWidget().layout();
			}
		},
		
		/**
		 * Open a parameter collector and return the dom node where parameter 
		 * information should be inserted
		 *
		 * @param {DOMElement} commandNode the node containing the triggering command
		 * @param {String} id the id of parent node containing the triggering command
		 * @returns {DOMElement} commandNode the node representing the command
		 */
		open: function(commandNode, id, fillFunction) {
			this.parameterContainer = null;
			this.activeClass = null;
			this.parameterArea = null;
			this.dismissArea = null;
			if (id === "pageActions") {
				this.parameterArea = dojo.byId("pageCommandParameters");
				this.parameterContainer = dojo.byId("pageParameterArea");
				this.activeClass = "leftSlideActive";
				this.dismissArea = dojo.byId("pageCommandDismiss");
			} else if (id === "pageNavigationActions") {
				this.parameterArea = dojo.byId("pageNavigationCommandParameters");
				this.parameterContainer = dojo.byId("pageNavigationParameterArea");
				this.activeClass = "rightSlideActive";
				this.dismissArea = dojo.byId("pageNavigationDismiss");
			}
			if (commandNode) {
				dojo.addClass(commandNode, "activeCommand");
			}
			if (this.parameterArea) {
				var focusNode = fillFunction(this.parameterArea);
				// add the close button
				if (this.dismissArea) {
					var spacer = dojo.create("span", null, this.dismissArea, "last");
					dojo.addClass(spacer, "dismiss");
					var close = dojo.create("span", null, this.dismissArea, "last");
					dojo.addClass(close, "imageSprite");
					dojo.addClass(close, "core-sprite-delete");
					dojo.addClass(close, "dismiss");
					close.title = "Close";
					dojo.connect(close, "onclick", dojo.hitch(this, function(event) {
						this.close(commandNode);
					}));
				}
				// all parameters have been generated.  Activate the area.
				dojo.addClass(this.parameterContainer, this.activeClass);
				if (this._getLayoutWidget()) {
					this._getLayoutWidget().layout();
				}
				if (focusNode) {
					window.setTimeout(function() {
						focusNode.focus();
					}, 0);
				}
			}
		},
		
		/**
		 * Returns whether this key binding is the same as the given parameter.
		 * 
		 * @param {orion.commands.Command} the command being executed
		 * @param {Object} handler the command's handler
		 * @param {DOMElement} parent the command's parent node
		 * @param {DOMElement} commandNode the node representing the command
		 * @param {Array} the callback parameters to be sent to the handler
		 * @returns {Boolean} whether or not required parameters were collected.
		 */
		collectParameters: function(command, handler, parent, commandNode, callbackParameters) {
			if (command.parameters) {
				this.open(commandNode, parent.id, dojo.hitch(this, function(parameterArea) {
					var first = null;
					var keyHandler = dojo.hitch(this, function(event) {
						if (event.keyCode === dojo.keys.ENTER) {
							dojo.query("input", this.parameterArea).forEach(function(field) {
								command.parameters[field.parameterName].value = field.value;
								if (command.callback) {
									command.callback.apply(handler, callbackParameters);
								}
							});
						}
						if (event.keyCode === dojo.keys.ESCAPE || event.keyCode === dojo.keys.ENTER) {
							this.close(commandNode);
						}
					});
					for (var key in command.parameters) {
						if (command.parameters[key].type) {
							var parm = command.parameters[key];
							if (parm.label) {
								dojo.place(document.createTextNode(parm.label), parameterArea, "last");
							} 
							var field = dojo.create("input", {type: parm.type}, parameterArea, "last");
							dojo.addClass(field, "parameterInput");
							field.setAttribute("speech", "speech");
							field.setAttribute("x-webkit-speech", "x-webkit-speech");
							field.parameterName = key;
							if (!first) {
								first = field;
							}
							if (parm.value) {
								field.value = parm.value;
							}
							dojo.connect(field, "onkeypress", keyHandler);
						}
					}
					return first;
				}));
			}
		}
	};
	CommandParameterCollector.prototype.constructor = CommandParameterCollector;
	
	/**
	 * This class contains static utility methods. It is not intended to be instantiated.
	 * @class This class contains static utility methods for creating and managing 
	 * global commands.
	 * @name orion.globalCommands
	 */

	// BEGIN TOP BANNER FRAGMENT
	var topHTMLFragment =
	// a table?!!?  Yes, you can't mix CSS float right and absolutes to pin the bottom.
	'<table style="margin: 0; padding: 0; border-collapse: collapse; width: 100%;">' +
	// Row 1:  Logo + page title + primary nav links
		'<tr class="topRowBanner" id="bannerRow1">' +
			'<td rowspan=3 style="padding-top: 12px; padding-bottom: 12px; padding-left: 8px; width: 148px"><a id="home" href="' + require.toUrl("index.html") + '"><span class="imageSprite core-sprite-orion toolbarLabel" alt="Orion Logo" align="top"></a></td>' +
			'<td class="leftGlobalToolbar" style="padding-top: 16px">' +
				'<span id="pageTitle" class="pageTitle"></span>' +
			'</td>' + 
			'<td class="rightGlobalToolbar" style="padding-top: 16px">' +
				'<span id="primaryNav" class="globalActions"></span>' +
				'<span id="globalActions" class="globalActions"></span>' +
				'<input type="search" id="search" placeholder="Search" title="Type a keyword or wild card to search" class="searchbox">' +
				'<span id="userInfo"></span>' +
				'<span id="help" class="help"><a id="help" href="' + require.toUrl("help/index.jsp") + '">?</a></span>' +
			'</td>' + 
		'</tr>' +
	// Row 2:  Location (optional breadcrumb + current page resource)
		'<tr class="topRowBanner" id="bannerRow2">' +
			'<td colspan=2 style="text-wrap: normal">' +
				'<span id="location" class="currentLocation" style="text-wrap: normal"></span>' +
			'</td>' + 
		'</tr>' +
	// Row 3:  Status on left, global commands, search, user, etc. on right
		'<tr class="topRowBanner" id="bannerRow3">' +
			'<td colspan=2 style="height: 16px; text-align: left">' +
				'<span id="statusPane" style="color: #5a5a5a;"></span>' +
				'<span id="notifications"></span>' +
			'</td>' +
		'</tr>' +
		
	// Row 4: Page Toolbar
		'<tr class="pageToolbar" id="pageToolbar">' +
			'<td colspan=2 class="pageToolbarLeft">' +
				'<span id="pageActions" class="pageActions"></span>' +
			'</td>' +
			'<td class="pageToolbarRight">' +
				'<span id="pageNavigationActions" class="pageActions pageNavigationActions"></span>' +
			'</td>' +
		'</tr>' +
	// Row 5: Command Parameter area
		'<tr>' +
			'<td id="parameterArea" class="slideContainer" class colspan=3>' +
				'<span id="pageParameterArea" class="leftSlide">' +
					'<span id="pageCommandParameters" class="parameters"></span>' +
					'<span id="pageCommandDismiss" class="parameters"></span>' +
				'</span>' +
				'<span id="pageNavigationParameterArea" class="rightSlide">' +
					'<span id="pageNavigationCommandParameters" class="parameters"></span>' +
					'<span id="pageNavigationDismiss" class="parameters"></span>' +
				'</span>' +
			'</td>' +
		'</tr>' +
	'</table>';
	// END TOP BANNER FRAGMENT
	
	// BEGIN BOTTOM BANNER FRAGMENT
	// styling of the surrounding div (text-align, etc) is in ide.css "footer"
	var bottomHTMLFragment = '<span class="imageSprite core-sprite-warning"></span> ' + 
		'This is a Beta build of Orion.  You can use it, play with it and explore the ' +
		'capabilities but BEWARE your data may be lost. &nbsp;| '+ 
		'<a href="http://wiki.eclipse.org/Orion/FAQ">FAQ</a> | ' + 
		'<a href="https://bugs.eclipse.org/bugs/enter_bug.cgi?product=Orion&version=0.3">Report a Bug</a> | ' +
		'<a href="http://www.eclipse.org/legal/privacy.php">Privacy Policy</a> | ' + 
		'<a href="http://www.eclipse.org/legal/termsofuse.php">Terms of Use</a> | '+ 
		'<a href="http://www.eclipse.org/legal/copyright.php">Copyright Agent</a>'; 
	// END BOTTOM BANNER FRAGEMENT

	function qualifyURL(url){
	    var a = document.createElement('a');
	    a.href = url; // set string url
	    return a.href;
	}

	var notifyAuthenticationSite = qualifyURL(require.toUrl('auth/NotifyAuthentication.html'));
	var authRendered = {};
	var loginDialog = new orion.widgets.LoginDialog();
	
	function getLabel(authService, serviceReference){
		if(authService.getLabel){
			return authService.getLabel();
		} else {
			var d = new dojo.Deferred();
			d.callback(serviceReference.properties.name);
			return d;
		}
	}

	/**
	 * Adds the user-related commands to the toolbar
	 * @name orion.globalCommands#generateUserInfo
	 * @function
	 */
	function generateUserInfo(serviceRegistry) {
		
		var authServices = serviceRegistry.getServiceReferences("orion.core.auth");
		var userInfo = dojo.byId("userInfo");
		if(!userInfo){
			return;
		}
		
		if(!dijit.byId('logins')){
			var menuButton = new dijit.form.DropDownButton({
				id: "logins",
				label: "Security",
				dropDown: loginDialog,
				title: "Login statuses"
		        });
		        dojo.addClass(menuButton.domNode, "commandImage");
		        dojo.place(menuButton.domNode, userInfo, "only");
			}
		
		
		for(var i=0; i<authServices.length; i++){
			var servicePtr = authServices[i];
			var authService = serviceRegistry.getService(servicePtr);		
			getLabel(authService, servicePtr).then(function(label){			
				authService.getKey().then(function(key){
					authService.getUser().then(function(jsonData){
						loginDialog.addUserItem(key, authService, label, jsonData);
					}, 
					function(errorData){
						loginDialog.addUserItem(key, authService, label);
					});
					window.addEventListener("storage", function(e){
						if(authRendered[key] === localStorage.getItem(key)){
							return;
						}
						
						authRendered[key] = localStorage.getItem(key);
						
						authService.getUser().then(function(jsonData){
							loginDialog.addUserItem(key, authService, label, jsonData);
						}, 
						function(errorData){
							loginDialog.addUserItem(key, authService, label);
						});				
					}, false);
				});							
			});
		}
	}
	
	function setPendingAuthentication(services){
		loginDialog.setPendingAuthentication(services);
		var i;
		for(i in services){
			if(services.hasOwnProperty(i)){
				//open prompt if there is at least one pending authentication
				dijit.popup.open({
		            popup: loginDialog,
		            around: dojo.byId('logins')
		        });		
				return;
			}
		}
		
		dijit.popup.close(loginDialog);
	}

	/**
	 * Adds the DOM-related commands to the banner
	 * @name orion.globalCommands#generateDomCommandsInBanner
	 * @function
	 */
	function generateDomCommandsInBanner(commandService, handler , pageActionDomId , useImage) {
		var toolbar = dojo.byId("pageActions");
		if(pageActionDomId) {
			toolbar = dojo.byId(pageActionDomId);
		}
		if (toolbar) {	
			dojo.empty(toolbar);
			commandService.renderCommands(toolbar, "dom", handler, handler, "image", null, null, !useImage);  // use true when we want to force toolbar items to text
		}
		// now page navigation actions
		toolbar = dojo.byId("pageNavigationActions");
		if (toolbar) {	
			dojo.empty(toolbar);
			commandService.renderCommands(toolbar, "dom", handler, handler, "image", null, null, !useImage);  // use true when we want to force toolbar items to text
		}
	}
	
	
	/**
	 * Generates the banner at the top of a page.
	 * @name orion.globalCommands#generateBanner
	 * @function
	 */
	function generateBanner(parentId, serviceRegistry, commandService, prefsService, searcher, handler, /* optional */ editor, /* optional */ escapeProvider) {
		// this needs to come from somewhere but I'm not going to do a separate get for it
		
		var text;
		var parent = dojo.byId(parentId);
		if (!parent) {
			throw "could not find banner parent, id was " + parentId;
		}
		
		// Set up a custom parameter collector that slides out of the header.
		commandService.setParameterCollector(new CommandParameterCollector(parent));
		
		// place the HTML fragment from above.
		dojo.place(topHTMLFragment, parent, "only");
		
		// place an empty div for keyAssist
		dojo.place('<div id="keyAssist" class="keyAssistFloat"></div>', document.body, "last");
		
		// generate primary nav links. 
		var primaryNav = dojo.byId("primaryNav");
		if (primaryNav) {
			// Note that the shape of the "orion.page.link" extension is not in any shape or form that could be considered final.
			// We've included it to enable experimentation. Please provide feedback on IRC or bugzilla.
			
			// The shape of a contributed navigation link is (for now):
			// info - information about the navigation link (object).
			//     required attribute: name - the name of the navigation link
			//     required attribute: id - the id of the navigation link
			//     required attribute: href - the URL for the navigation link
			//     optional attribute: image - a URL to an icon representing the link (currently not used, may use in future)
			var navLinks= serviceRegistry.getServiceReferences("orion.page.link");
			for (var i=0; i<navLinks.length; i++) {
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
			}
		}
		
		// hook up search box behavior
		var searchField = dojo.byId("search");
		if (!searchField) {
			throw "failed to generate HTML for banner";
		}
		dojo.connect(searchField, "onkeypress", function(e){
			if (e.charOrCode === dojo.keys.ENTER) {
				if (searcher) {
					if (searchField.value.length > 0) {
						var query = searcher.createSearchQuery(searchField.value);
						window.location = require.toUrl("search/search.html") + "#"+query;
					}
				} else {
					window.alert("Can't search: no search service is available");
				}
			}
		});
		
		// Put page title in title area.  This gets replaced by breadcrumbs, etc. in some pages.
		var title = dojo.byId("pageTitle");
		if (title) {
			text = document.createTextNode(document.title);
			dojo.place(text, title, "last");
		}
	
		var openResourceDialog = function(searcher, /* optional */ editor) {
			var dialog = new orion.widgets.OpenResourceDialog({searcher: searcher});
			if (editor) {
				dojo.connect(dialog, "onHide", function() {
					editor.getTextView().focus(); // Focus editor after dialog close, Dojo's doesn't work
				});
			}
			window.setTimeout(function() {dialog.show();}, 0);
		};
			
		var openResourceCommand = new mCommands.Command({
			name: "Find File Named...",
			tooltip: "Choose a file by name and open an editor on it",
			id: "eclipse.openResource",
			callback: function(item) {
				openResourceDialog(searcher, editor);
			}});
			
		// We need a mod key binding in the editor, for now use the old one (ctrl-shift-r)
		if (editor) {
			editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding("r", true, true, false), "Find File Named...");
			editor.getTextView().setAction("Find File Named...", function() {
					openResourceDialog(searcher, editor);
					return true;
				});
		}
		
		// We are using 't' for the non-editor binding because of git-hub's use of t for similar function
		commandService.addCommand(openResourceCommand, "global");
		commandService.registerCommandContribution("eclipse.openResource", 1, "globalActions", null, new mCommands.CommandKeyBinding('t'), true);
		
		var keyAssistNode = dojo.byId("keyAssist");
		dojo.connect(document, "onkeypress", dojo.hitch(this, function (e){ 
			if (e.charOrCode === dojo.keys.ESCAPE) {
				keyAssistNode.style.display = "none";
			}
		}));
		
		if (escapeProvider) {
			var keyAssistEscHandler = {
				isActive: function() {
					return keyAssistNode.style.display === "block";
				},
				
				cancel: function() {
					if (this.isActive()) {
						keyAssistNode.style.display = "none";
						return true;
					}
					return false;   // not handled
				}
			};
			escapeProvider.addHandler(keyAssistEscHandler);
		}
		
		var keyAssistCommand = new mCommands.Command({
			name: "Show Keys",
			tooltip: "Show a list of all the keybindings on this page",
			id: "eclipse.keyAssist",
			callback: function() {
				dojo.empty(keyAssistNode);
				if (editor) {
					dojo.place("<h2>Editor</h2>", keyAssistNode, "last");
					var editorActions = editor.getTextView().getActions(false);
					for(var i=0; i<editorActions.length; i++) {
						var actionName = editorActions[i];
						var bindings = editor.getTextView().getKeyBindings(actionName);
						for (var j=0; j<bindings.length; j++) {
							dojo.place("<span>"+mUtil.getUserKeyString(bindings[j])+" = " + actionName + "<br></span>", keyAssistNode, "last");
						}
					}
				}
				dojo.place("<h2>Global</h2>", keyAssistNode, "last");
				commandService.showKeyBindings(keyAssistNode);
				keyAssistNode.style.display = "block";
				return true;
			}});
		commandService.addCommand(keyAssistCommand, "global");
		commandService.registerCommandContribution("eclipse.keyAssist", 1, "globalActions", null, new mCommands.CommandKeyBinding(191, false, true), true);
		if (editor) {
			editor.getTextView().setKeyBinding(new mCommands.CommandKeyBinding('L', true, true), "Show Keys");
			editor.getTextView().setAction("Show Keys", keyAssistCommand.callback);
		}

		// generate global commands
		var toolbar = dojo.byId("globalActions");
		if (toolbar) {	
			dojo.empty(toolbar);
			// need to have some item, for global scoped commands it won't matter
			var item = handler || {};
			commandService.renderCommands(toolbar, "global", item, handler, "image");
		}
		
		generateUserInfo(serviceRegistry);
		
		// generate the footer. 
		// TODO The footer div id should not be assumed here
		if (bottomHTMLFragment) {
			var footer = dojo.byId("footer");
			if (footer) {
				dojo.place(bottomHTMLFragment, footer, "only");
			}
		}
		
		dojo.addOnLoad(function() {
			commandService.processURL(window.location.href);
		});
		//every time the user manually changes the hash, we need to load the workspace with that name
		dojo.subscribe("/dojo/hashchange", commandService, function() {
			commandService.processURL(window.location.href);
		});
	}
	
	//return the module exports
	return {
		generateUserInfo: generateUserInfo,
		generateDomCommandsInBanner: generateDomCommandsInBanner,
		generateBanner: generateBanner,
		notifyAuthenticationSite: notifyAuthenticationSite,
		setPendingAuthentication: setPendingAuthentication,
		CommandParameterCollector: CommandParameterCollector
	};
});
