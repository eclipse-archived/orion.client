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

define(['require', 'dojo', 'dijit', 'orion/commonHTMLFragments', 'orion/commands', 'orion/parameterCollectors', 
	'orion/extensionCommands', 'orion/util', 'orion/textview/keyBinding', 'orion/searchRenderer', 'orion/favorites',
	'dijit/Menu', 'dijit/MenuItem', 'dijit/form/DropDownButton', 'orion/widgets/OpenResourceDialog', 'orion/widgets/LoginDialog'], 
        function(require, dojo, dijit, commonHTML, mCommands, mParameterCollectors, mExtensionCommands, mUtil, mKeyBinding, mSearchRenderer, mFavorites){

	/**
	 * This class contains static utility methods. It is not intended to be instantiated.
	 * @class This class contains static utility methods for creating and managing 
	 * global commands.
	 * @name orion.globalCommands
	 */


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
	
	var authenticationIds = [];
	
	function getAuthenticationIds(){
		return authenticationIds;
	}
	
	function startProgressService(serviceRegistry){
		var progressService = serviceRegistry.getService("orion.page.progress");
		if(progressService) {
			dojo.hitch(progressService, progressService.init)("progressPane");
		}
	}

	/**
	 * Adds the user-related commands to the toolbar
	 * @name orion.globalCommands#generateUserInfo
	 * @function
	 */
	function generateUserInfo(serviceRegistry) {
		
		var authServices = serviceRegistry.getServiceReferences("orion.core.auth");
		authenticationIds = [];
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
					authenticationIds.push(key);
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
		
		if (dijit.popup.hide) {
			dijit.popup.hide(loginDialog); //close doesn't work on FF
		}
		dijit.popup.close(loginDialog);
	}
	
	function authenticatedService(SignInKey){
		loginDialog.authenticatedService(SignInKey);
	}

	/**
	 * Adds the DOM-related commands to the banner
	 * @name orion.globalCommands#generateDomCommandsInBanner
	 * @function
	 */
	function generateDomCommandsInBanner(commandService, handler, item, navHandler, navItem, ignoreForNow, clientManagesPageNav) {
		// close any open slideouts because we are retargeting
		commandService.closeParameterCollector("button");
		var toolbar = dojo.byId("pageActions");
		if (toolbar) {	
			dojo.empty(toolbar);
			// The render call may be synch (when called by page glue code that created the service)
			// or asynch (when called after getting a service reference).
			var retn = commandService.renderCommands(toolbar, "dom", item || handler, handler, "button");
			if (retn && retn.then) {
				retn.then(function() {commandService.processURL(window.location.href);});
			} else {
				commandService.processURL(window.location.href);
			} 
		}
		// now page navigation actions
		if (!clientManagesPageNav) {
			toolbar = dojo.byId("pageNavigationActions");
			if (toolbar) {	
				dojo.empty(toolbar);
				commandService.renderCommands(toolbar, "dom", navItem || item || handler, navHandler || handler, "button");  // use true when we want to force toolbar items to text
			}
		}
	}
	
	/**
	 * Adds the related links to the banner
	 * @name orion.globalCommands#generateRelatedLinks
	 * @function
	 */
	function generateRelatedLinks(serviceRegistry, itemOrArray, itemLabels, exclusions, commandService) {
		var items;
		items = itemOrArray;
		if (!dojo.isArray(itemOrArray)) {
			items = [itemOrArray];
			if (!itemLabels) {
				itemLabels = [""];
			}
		}
		var contributedLinks = serviceRegistry.getServiceReferences("orion.page.link.related");
		if (contributedLinks.length <= 0) {
			return;
		}
		var related = dojo.byId("relatedLinks");
		if(!related){
			// document not loaded
			return;
		}
		var foundLink = false;
		var linksMenu = dijit.byId("relatedLinksMenu");
		if (linksMenu) {
			// see http://bugs.dojotoolkit.org/ticket/10296
			linksMenu.focusedChild = null;
			dojo.forEach(linksMenu.getChildren(), function(child) {
				linksMenu.removeChild(child);
				child.destroy();
			});
		} else {
			linksMenu = new dijit.Menu({
				style: "display: none;",
				id: "relatedLinksMenu"
			});
		}
		
		// assemble the related links
		for (var i=0; i<contributedLinks.length; i++) {
			var info = {};
			var propertyNames = contributedLinks[i].getPropertyNames();
			for (var j = 0; j < propertyNames.length; j++) {
				info[propertyNames[j]] = contributedLinks[i].getProperty(propertyNames[j]);
			}
			if (info.id && info.name) {
				var command;
				// exclude anything in the list of exclusions
				var position = dojo.indexOf(exclusions, info.id);
				if (position < 0) {
					for (var itemIndex=0; itemIndex < items.length; itemIndex++) {
						var item = items[itemIndex];
						// look for it in the command service.  Total reach.
						command = commandService.findCommand(info.id);
						if (!command) {
							// if it's not there look for it in orion.navigate.command and create it
							var commandsReferences = serviceRegistry.getServiceReferences("orion.navigate.command");
							for (var j=0; j<commandsReferences.length; j++) {
								var id = commandsReferences[j].getProperty("id");
								if (id === info.id) {
									var navInfo = {};
									propertyNames = commandsReferences[j].getPropertyNames();
									for (var k = 0; k < propertyNames.length; k++) {
										navInfo[propertyNames[k]] = commandsReferences[j].getProperty(propertyNames[k]);
									}
									if (itemLabels[itemIndex]) {
										navInfo.name += itemLabels[itemIndex];
									}
									var commandOptions = mExtensionCommands._createCommandOptions(navInfo, commandsReferences[j], serviceRegistry, true);
									command = new mCommands.Command(commandOptions);
								}
							}
						}
						if (command) {
							if (!command.visibleWhen || command.visibleWhen(item)) {
								foundLink = true;
								var invocation = new mCommands.CommandInvocation(commandService, item, item, null, command);
								command._addMenuItem(linksMenu, invocation);
							}
						}
					}
				}
			}
		}
		
		var menuButton = dijit.byId("related");
		if (menuButton) {
			if (!foundLink) {
				menuButton.destroy();
			}
		} else {
			if (foundLink) {
				menuButton = new dijit.form.DropDownButton({
					id: "related",
					label: "Related Pages",
					dropDown: linksMenu
				});
				dojo.place(menuButton.domNode, related, "only");
			}
		}	
		mUtil.forceLayout(related);
	}
	
	function renderGlobalCommands(commandService, handler, pageItem) {
		var globalTools = dojo.byId("globalActions");
		if (globalTools) {	
			dojo.empty(globalTools);
			// need to have some item associated with the command
			var item = dojo.isArray(pageItem) ? pageItem[0] : pageItem;
			item = item || handler || {};
			commandService.renderCommands(globalTools, "global", item, handler, "tool");
		}
	}
	
	/**
	 * Support for establishing a page item associated with global commands and related links
	 */
	var pageItem;
	var exclusions = [];
	function setPageCommandExclusions(excluded) {
		exclusions = excluded;
	}
	function setPageTarget(itemOrArray, serviceRegistry, commandService, itemLabels) {
		pageItem = itemOrArray;
		generateRelatedLinks(serviceRegistry, itemOrArray, itemLabels, exclusions, commandService);
		renderGlobalCommands(commandService, null, itemOrArray);
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
				
		// place the HTML fragment from above.
		dojo.place(commonHTML.topHTMLFragment, parent, "only");
		
		var toolbar = dojo.byId("pageToolbar");
		if (toolbar) {
			dojo.place(commonHTML.toolbarHTMLFragment, toolbar, "only");
		} else {
			toolbar = dojo.create ("div", {id: "pageToolbar", "class": "toolbar layoutBlock"}, "titleArea", "after");
			dojo.place(commonHTML.toolbarHTMLFragment, toolbar, "only");
		}
		
		// Set up a custom parameter collector that slides out of the toolbar.
		commandService.setParameterCollector("button", new mParameterCollectors.CommandParameterCollector(toolbar));
		commandService.setParameterCollector("tool", new mParameterCollectors.CommandParameterCollector(toolbar));

		
		// place an empty div for keyAssist
		dojo.place('<div id="keyAssist" style="display: none" class="keyAssistFloat" role="list" aria-atomic="true" aria-live="assertive"></div>', document.body, "last");

		
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
		
		// Put page title in title area.  
		var title = dojo.byId("pageTitle");
		if (title) {
			text = document.createTextNode(document.title);
			dojo.place(text, title, "last");
		}
		
		// Assemble global commands
		var favoriteCommand = new mCommands.Command({
			name: "Make Favorite",
			tooltip: "Add to the favorites list",
			imageClass: "core-sprite-makeFavorite",
			id: "orion.makeFavorite",
			visibleWhen: function(item) {
				var items = dojo.isArray(item) ? item : [item];
				for (var i=0; i < items.length; i++) {
					if (!items[i].Location) {
						return false;
					}
				}
				return true;},
			callback: function(data) {
				var items = dojo.isArray(data.items) ? data.items : [data.items];
				var favService = serviceRegistry.getService("orion.core.favorite");
				var doAdd = function(item) {
					return function(result) {
						if (!result) {
							favService.makeFavorites(item);
						} else {
							serviceRegistry.getService("orion.page.message").setMessage(item.Name + " is already a favorite.", 2000);
						}
					};
				};
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					favService.hasFavorite(item.ChildrenLocation || item.Location).then(doAdd(item));
				}
			}});
		commandService.addCommand(favoriteCommand, "global");
		commandService.registerCommandContribution("orion.makeFavorite", 1, "globalActions", null, false, new mCommands.CommandKeyBinding("f", true, true));

	
		var openResourceDialog = function(searcher, serviceRegistry, /* optional */ editor) {
			var favoriteService = serviceRegistry.getService("orion.core.favorite");
			//TODO Shouldn't really be making service selection decisions at this level. See bug 337740
			if (!favoriteService) {
				favoriteService = new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
			}
			var dialog = new orion.widgets.OpenResourceDialog({searcher: searcher, searchRenderer:mSearchRenderer, favoriteService:favoriteService});
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
			callback: function(data) {
				openResourceDialog(searcher, serviceRegistry, editor);
			}});
			
		// We need a mod key binding in the editor, for now use the old one (ctrl-shift-r)
		if (editor) {
			editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding("r", true, true, false), "Find File Named...");
			editor.getTextView().setAction("Find File Named...", function() {
					openResourceDialog(searcher, serviceRegistry, editor);
					return true;
				});
		}
		
		// Toggle trim command
		var toggleBanner = new mCommands.Command({
			name: "Toggle banner and footer",
			tooltip: "Hide or show the page banner and footer",
			id: "orion.toggleTrim",
			callback: function() {
				var layoutWidget = dijit.byId(parent.parentNode.id);
				if (layoutWidget) {
					var header = parent;
					var footer = dojo.byId("footer");
					if (header.style.display === "none") {
						header.style.display = "block";
						footer.style.display = "block";
					} else {
						header.style.display = "none";
						footer.style.display = "none";
					}
					layoutWidget.layout();
				}
				return true;
			}});
		commandService.addCommand(toggleBanner, "global");
		commandService.registerCommandContribution("orion.toggleTrim", 100, "globalActions", null, true, new mCommands.CommandKeyBinding("m", true, true));
		
		if (editor) {
			editor.getTextView().setKeyBinding(new mCommands.CommandKeyBinding('m', true, true), "Toggle Trim");
			editor.getTextView().setAction("Toggle Trim", toggleBanner.callback);
		}
		
		// We are using 't' for the non-editor binding because of git-hub's use of t for similar function
		commandService.addCommand(openResourceCommand, "global");
		commandService.registerCommandContribution("eclipse.openResource", 100, "globalActions", null, true, new mCommands.CommandKeyBinding('t'));
		
		var keyAssistNode = dojo.byId("keyAssist");
		dojo.connect(document, "onkeypress", dojo.hitch(this, function (e){ 
			if (e.charOrCode === dojo.keys.ESCAPE) {
				keyAssistNode.style.display = "none";
			}
		}));
		dojo.connect(document, "onclick", dojo.hitch(this, function(e) {
			var clickNode =  e.target || e.originalTarget || e.srcElement; 
			if (clickNode && clickNode.id !== "keyAssist") {
				keyAssistNode.style.display = "none";
			}
		}));
		if (editor) {
			editor.getTextView().addEventListener("MouseDown", function() {
				keyAssistNode.style.display = "none";
			});
		}
		
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
				if (keyAssistNode.style.display === "none") {
					dojo.empty(keyAssistNode);
					if (editor) {
						dojo.place("<h2>Editor</h2>", keyAssistNode, "last");
						var editorActions = editor.getTextView().getActions(false);
						for(var i=0; i<editorActions.length; i++) {
							var actionName = editorActions[i];
							var bindings = editor.getTextView().getKeyBindings(actionName);
							for (var j=0; j<bindings.length; j++) {
								dojo.place("<span role=\"listitem\">"+mUtil.getUserKeyString(bindings[j])+" = " + actionName + "<br></span>", keyAssistNode, "last");
							}
						}
					}
					dojo.place("<h2>Global</h2>", keyAssistNode, "last");
					commandService.showKeyBindings(keyAssistNode);
					keyAssistNode.style.display = "block";
				} else {
					keyAssistNode.style.display = "none";
				}
				return true;
			}});
		commandService.addCommand(keyAssistCommand, "global");
		commandService.registerCommandContribution("eclipse.keyAssist", 100, "globalActions", null, true, new mCommands.CommandKeyBinding(191, false, true));
		if (editor) {
			editor.getTextView().setKeyBinding(new mCommands.CommandKeyBinding('L', true, true), "Show Keys");
			editor.getTextView().setAction("Show Keys", keyAssistCommand.callback);
		}
		
		renderGlobalCommands(commandService, handler, pageItem);
		
		// provide free "open with" object level unless already done
		var index = dojo.indexOf(exclusions, "eclipse.openWith");
		if (index < 0) {
			var contentTypeService = serviceRegistry.getService("orion.file.contenttypes");
			if (contentTypeService) {
				contentTypeService.getContentTypesMap().then(function(map) {
					var openWithCommands = mExtensionCommands._createOpenWithCommands(serviceRegistry, map);
					for (var i=0; i<openWithCommands.length; i++) {
						var commandInfo = openWithCommands[i].properties;
						var service = openWithCommands[i].service;
						var commandOptions = mExtensionCommands._createCommandOptions(commandInfo, service, serviceRegistry, true);
						var command = new mCommands.Command(commandOptions);
						command.isEditor = commandInfo.isEditor;
						var openWithGroupCreated = false;
						commandService.addCommand(command, "object");
						if (!openWithGroupCreated) {
							openWithGroupCreated = true;
							commandService.addCommandGroup("eclipse.openWith", 1000, "Open With");
						}
						commandService.registerCommandContribution(command.id, i, null, "eclipse.openWith");
					}
				});
			}
		}
		
		generateUserInfo(serviceRegistry);
		
		// generate the footer. 
		// TODO The footer div id should not be assumed here
		if (commonHTML.bottomHTMLFragment) {
			var footer = dojo.byId("footer");
			if (footer) {
				dojo.place(commonHTML.bottomHTMLFragment, footer, "only");
			}
		}
		// now that footer containing progress pane is added
		startProgressService(serviceRegistry);

		// force layout
		mUtil.forceLayout(parent.parentNode);
		//every time the user manually changes the hash, we need to load the workspace with that name
		dojo.subscribe("/dojo/hashchange", commandService, function() {
			commandService.processURL(window.location.href);
		});
	}
	
	//return the module exports
	return {
		generateUserInfo: generateUserInfo,
		generateRelatedLinks: generateRelatedLinks,
		generateDomCommandsInBanner: generateDomCommandsInBanner,
		generateBanner: generateBanner,
		notifyAuthenticationSite: notifyAuthenticationSite,
		setPendingAuthentication: setPendingAuthentication,
		getAuthenticationIds: getAuthenticationIds,
		setPageTarget: setPageTarget,
		setPageCommandExclusions: setPageCommandExclusions,
		authenticatedService: authenticatedService
	};
});
