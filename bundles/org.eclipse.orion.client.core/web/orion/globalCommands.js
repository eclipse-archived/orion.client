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

define(['i18n!orion/nls/messages', 'require', 'dojo', 'dijit', 'orion/commonHTMLFragments', 'orion/commands', 'orion/parameterCollectors', 
	'orion/extensionCommands', 'orion/util', 'orion/textview/keyBinding', 'orion/favorites', 'orion/contentTypes', 'orion/URITemplate', 'orion/PageUtil',
	'dijit/Menu', 'dijit/MenuItem', 'dijit/form/DropDownButton', 'orion/widgets/OpenResourceDialog', 'orion/widgets/LoginDialog', 'orion/widgets/UserMenu', 'orion/widgets/UserMenuDropDown'], 
        function(messages, require, dojo, dijit, commonHTML, mCommands, mParameterCollectors, mExtensionCommands, mUtil, mKeyBinding, mFavorites, mContentTypes, URITemplate, PageUtil){

	/**
	 * This class contains static utility methods. It is not intended to be instantiated.
	 * @class This class contains static utility methods for creating and managing 
	 * global commands.
	 * @name orion.globalCommands
	 */


	function qualifyURL(url){
	    var a = document.createElement('a'); //$NON-NLS-0$
	    a.href = url; // set string url
	    return a.href;
	}

	var notifyAuthenticationSite = qualifyURL(require.toUrl('auth/NotifyAuthentication.html')); //$NON-NLS-0$
	var authRendered = {};
	var loginDialog = new orion.widgets.LoginDialog();
	var userMenu = new orion.widgets.UserMenu({loginDialog: loginDialog});
	
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
		var progressService = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
		if(progressService) {
			dojo.hitch(progressService, progressService.init)("progressPane"); //$NON-NLS-0$
		}
	}
	
	function setUserName(registry, dropdown){
			
			var authService = registry.getService("orion.core.auth"); //$NON-NLS-0$
			if (authService !== null) {
				authService.getUser().then(function(jsonData){
					if( jsonData.Name ){
						dropdown.set( 'label', jsonData.Name ); //$NON-NLS-0$
					}else if( jsonData.login ){
						dropdown.set( 'label', jsonData.login ); //$NON-NLS-0$
					}						
				});
			}
		}

	/**
	 * Adds the user-related commands to the toolbar
	 * @name orion.globalCommands#generateUserInfo
	 * @function
	 */
	function generateUserInfo(serviceRegistry) {
		
		var authServices = serviceRegistry.getServiceReferences("orion.core.auth"); //$NON-NLS-0$
		authenticationIds = [];
		var userMenuPlaceholder = dojo.byId("userMenu"); //$NON-NLS-0$
		if(!userMenuPlaceholder){
			return;
		}
		
		if(!dijit.byId('logins')){ //$NON-NLS-0$
			var menuButton = new orion.widgets.UserMenuDropDown({
				id: "logins", //$NON-NLS-0$
				dropDown: userMenu,
				label: messages["Options"], 
				showLabel: true
			});
			dojo.place(menuButton.domNode, userMenuPlaceholder, "only"); //$NON-NLS-0$
			if(menuButton.valueNode) {
		        dojo.destroy(menuButton.valueNode);
			}
			if(menuButton.titleNode && dojo.attr(menuButton.titleNode, "title")) { //$NON-NLS-0$
				dojo.removeAttr(menuButton.titleNode, "title"); //$NON-NLS-0$
			}
			new mCommands.CommandTooltip({
				connectId: [menuButton.focusNode],
				label: messages['Options'],
				position: ["above", "left", "right", "below"] // otherwise defaults to right and obscures adjacent commands //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			});
			
			setUserName( serviceRegistry, menuButton );
		}
		
		for(var i=0; i<authServices.length; i++){
			var servicePtr = authServices[i];
			var authService = serviceRegistry.getService(servicePtr);		
			dojo.hitch(this, function(authService, servicePtr){
					getLabel(authService, servicePtr).then(function(label){			
					authService.getKey().then(function(key){
						authenticationIds.push(key);
						authService.getUser().then(function(jsonData){
							loginDialog.addUserItem(key, authService, label, jsonData);
							userMenu.addUserItem(key, authService, label, jsonData);
						}, 
						function(errorData, jsonData){
							loginDialog.addUserItem(key, authService, label);
							userMenu.addUserItem(key, authService, label, jsonData);
						});
						window.addEventListener("storage", function(e){ //$NON-NLS-0$
							if(authRendered[key] === localStorage.getItem(key)){
								return;
							}
							
							authRendered[key] = localStorage.getItem(key);
							
							authService.getUser().then(function(jsonData){
								loginDialog.addUserItem(key, authService, label, jsonData);
								userMenu.addUserItem(key, authService, label, jsonData);
							}, 
							function(errorData){
								loginDialog.addUserItem(key, authService, label);
								userMenu.addUserItem(key, authService, label);
							});				
						}, false);
					});							
				});
			})(authService, servicePtr);
		}
		
	}
	
	function setPendingAuthentication(services){
		loginDialog.setPendingAuthentication(services);
		var i;
		for(i in services){
			if(services.hasOwnProperty(i)){
				//open prompt if there is at least one pending authentication
				var userMenu = dojo.byId('userMenu'); //$NON-NLS-0$
				if(!userMenu.innerHTML){
					window.setTimeout(function(){ //wait a few milliseconds for the content to generate 
						try{
							dijit.popup.open({
								popup: loginDialog,
								around: userMenu //$NON-NLS-0$
							});
						}catch(e){}
					}, 500);
				}else{
					try{
						dijit.popup.open({
							popup: loginDialog,
							around: userMenu //$NON-NLS-0$
						});	
					}catch(e){}
				}
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
		commandService.closeParameterCollector();
		var toolbar = dojo.byId("pageActions"); //$NON-NLS-0$
		if (toolbar) {	
			dojo.empty(toolbar);
			// The render call may be synch (when called by page glue code that created the service)
			// or asynch (when called after getting a service reference).
			var retn = commandService.renderCommands(toolbar.id, toolbar, item || handler, handler, "button"); //$NON-NLS-0$
			if (retn && retn.then) {
				retn.then(function() {commandService.processURL(window.location.href);});
			} else {
				commandService.processURL(window.location.href);
			} 
		}
		// now page navigation actions
		if (!clientManagesPageNav) {
			toolbar = dojo.byId("pageNavigationActions"); //$NON-NLS-0$
			if (toolbar) {	
				dojo.empty(toolbar);
				commandService.renderCommands(toolbar.id, toolbar, navItem || item || handler, navHandler || handler, "button");  // use true when we want to force toolbar items to text //$NON-NLS-0$
			}
		}
	}
	
	var linksMenu;
	var pageItem;
	var exclusions = [];
	var favoriteTarget = null;
	
	function _makeEmptyLinksMenu() {
		var related = dojo.byId("relatedLinks"); //$NON-NLS-0$
		if(!related){
			// document not loaded
			return;
		}
		if (linksMenu) {
			// see http://bugs.dojotoolkit.org/ticket/10296
			linksMenu.focusedChild = null;
			dojo.forEach(linksMenu.getChildren(), function(child) {
				linksMenu.removeChild(child);
				child.destroy();
			});
			linksMenu.destroy();
		} 
		linksMenu = new dijit.Menu({
			style: "display: none;padding:3px;border-radius:3px;", //$NON-NLS-0$
			id: "relatedLinksMenu" //$NON-NLS-0$
		});
		return linksMenu;
	}
	
	function _addRelatedLinkCommand(command, invocation) {
		if (!linksMenu) {
			linksMenu = new dijit.Menu({
				style: "display: none;", //$NON-NLS-0$
				id: "relatedLinksMenu" //$NON-NLS-0$
			});
		}
		command._addMenuItem(linksMenu, invocation);

		var menuButton = dijit.byId("related"); //$NON-NLS-0$
		var domNode = dojo.byId("relatedLinks"); //$NON-NLS-0$
		if (domNode && !menuButton) {
			menuButton = new orion.widgets.UserMenuDropDown({
				id: "related", //$NON-NLS-0$
				label: messages["Related"],
				dropDown: linksMenu
			});
			dojo.addClass(menuButton.domNode, "bannerMenu"); //$NON-NLS-0$
			dojo.place(menuButton.domNode, domNode, "only"); //$NON-NLS-0$
			mUtil.forceLayout(domNode);
		}	
	}
	
	/**
	 * Adds the related links to the banner
	 * @name orion.globalCommands#generateRelatedLinks
	 * @function
	 */
	function generateRelatedLinks(serviceRegistry, item, exclusions, commandService, alternateItem) {
		var contentTypesCache;
		function getContentTypes() {
			if (contentTypesCache) {
				return contentTypesCache;
			}
			var contentTypeService = serviceRegistry.getService("orion.core.contenttypes"); //$NON-NLS-0$
			//TODO Shouldn't really be making service selection decisions at this level. See bug 337740
			if (!contentTypeService) {
				contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
				contentTypeService = serviceRegistry.getService("orion.core.contenttypes"); //$NON-NLS-0$
			}
			return contentTypeService.getContentTypes().then(function(ct) {
				contentTypesCache = ct;
				return contentTypesCache;
			});
		}

		var contributedLinks = serviceRegistry.getServiceReferences("orion.page.link.related"); //$NON-NLS-0$
		if (contributedLinks.length <= 0) {
			return;
		}
		var related = dojo.byId("relatedLinks"); //$NON-NLS-0$
		if(!related){
			// document not loaded
			return;
		}
		
		dojo.when(getContentTypes(), dojo.hitch(this, function() {
			var menu = _makeEmptyLinksMenu();
			var foundLink = false;
			// assemble the related links
			for (var i=0; i<contributedLinks.length; i++) {
				var info = {};
				var j;
				var propertyNames = contributedLinks[i].getPropertyNames();
				for (j = 0; j < propertyNames.length; j++) {
					info[propertyNames[j]] = contributedLinks[i].getProperty(propertyNames[j]);
				}
				if (info.id) {
					var command = null;
					// exclude anything in the list of exclusions
					var position = dojo.indexOf(exclusions, info.id);
					if (position < 0) {
						// First see if we have a uriTemplate and name, which is enough to build a command internally.
						if (info.name && info.uriTemplate) {
							command = new mCommands.Command(mExtensionCommands._createCommandOptions(info, contributedLinks[i], serviceRegistry, contentTypesCache, true));
						}
						// If we couldn't compose one, see if one is already registered.
						if (!command) {
							command = commandService.findCommand(info.id);
						}
						// If it's not registered look for it in orion.navigate.command and create it
						if (!command) {
							var commandsReferences = serviceRegistry.getServiceReferences("orion.navigate.command"); //$NON-NLS-0$
							for (j=0; j<commandsReferences.length; j++) {
								var id = commandsReferences[j].getProperty("id"); //$NON-NLS-0$
								if (id === info.id) {
									var navInfo = {};
									propertyNames = commandsReferences[j].getPropertyNames();
									for (var k = 0; k < propertyNames.length; k++) {
										navInfo[propertyNames[k]] = commandsReferences[j].getProperty(propertyNames[k]);
									}
									var commandOptions = mExtensionCommands._createCommandOptions(navInfo, commandsReferences[j], serviceRegistry, contentTypesCache, true);
									command = new mCommands.Command(commandOptions);
									break;
								}
							}
						} 
						if (command) {
							if (!command.visibleWhen || command.visibleWhen(item)) {
								foundLink = true;
								var invocation = new mCommands.CommandInvocation(commandService, item, item, null, command);
								command._addMenuItem(menu, invocation);
							} else {
								if (typeof alternateItem === "function") { //$NON-NLS-0$
									// asynch call to consider an alternate target item for just this command
									window.setTimeout(dojo.hitch(command, function() {
										dojo.when(alternateItem(), dojo.hitch(this, function (newItem) {
											if (newItem && (item === pageItem)) { // there is an alternate, and it still applies to the current page target
												if (this.visibleWhen(newItem)) {
													_addRelatedLinkCommand(this, new mCommands.CommandInvocation(commandService, newItem, newItem, null, this));
												}
											}
										}));
									}), 0);
								}
							}
						} 
					}
				} 
			}
			var menuButton = dijit.byId("related"); //$NON-NLS-0$
			if (menuButton) {
				menuButton.destroy();
			}
			if (foundLink) {
				menuButton = new orion.widgets.UserMenuDropDown({
					id: "related", //$NON-NLS-0$
					label: "Related", //$NON-NLS-0$
					dropDown: menu
				});
				dojo.addClass(menuButton.domNode, "bannerMenu"); //$NON-NLS-0$
				dojo.place(menuButton.domNode, related, "only"); //$NON-NLS-0$
			}	
			mUtil.forceLayout(related);
		}));
	}
	
	function renderGlobalCommands(commandService, handler, pageItem) {
		var globalTools = dojo.byId("globalActions"); //$NON-NLS-0$
		if (globalTools) {	
			dojo.empty(globalTools);
			// need to have some item associated with the command
			var item = dojo.isArray(pageItem) ? pageItem[0] : pageItem;
			item = item || handler || {};
			commandService.renderCommands(globalTools.id, globalTools, item, handler, "tool"); //$NON-NLS-0$
		}
	}
	
	/**
	 * Support for establishing a page item associated with global commands and related links
	 */

	function setPageCommandExclusions(excluded) {
		exclusions = excluded;
	}
	
	function makeFavorite(serviceRegistry) {
		var favoriteService = serviceRegistry.getService("orion.core.favorite"); //$NON-NLS-0$
		//TODO Shouldn't really be making service selection decisions at this level. See bug 337740
		if (!favoriteService) {
			favoriteService = new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
			favoriteService = serviceRegistry.getService("orion.core.favorite"); //$NON-NLS-0$
		}
		if (favoriteTarget && favoriteTarget.Location) {
			favoriteService.hasFavorite(favoriteTarget.ChildrenLocation || favoriteTarget.Location).then(function(result) {
				if (!result) {
					favoriteService.makeFavorites([favoriteTarget]);
					serviceRegistry.getService("orion.page.message").setMessage(favoriteTarget.Name + messages[" has been added to the favorites list."], 2000); //$NON-NLS-0$
				} else {
					serviceRegistry.getService("orion.page.message").setMessage(favoriteTarget.Name + messages[" is already a favorite."], 2000); //$NON-NLS-0$
				}
			});
		} 
	}
	
	// Hook up favorites button
	function checkFavoritesButton(serviceRegistry, commandService) {
		var faveButton = dojo.byId("pageFavorite"); //$NON-NLS-0$
		if (faveButton) {
			if (favoriteTarget && favoriteTarget.Location) {
				dojo.addClass(faveButton, "bannerButton"); //$NON-NLS-0$
				dojo.connect(faveButton, "onclick", this, function() { //$NON-NLS-0$
					makeFavorite(serviceRegistry);
				});
				// onClick events do not register for spans when using the keyboard
				dojo.connect(faveButton, "onkeypress", this, function(e) { //$NON-NLS-0$
					if (e.keyCode === dojo.keys.ENTER) {						
						makeFavorite(serviceRegistry);
					}
				});
				new mCommands.CommandTooltip({
					connectId: [faveButton],
					label: messages["Add to the favorites list"],
					position: ["below", "left", "right", "above"], // below since this is at top of page. //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					commandService: commandService
				});
				dojo.style(faveButton, "visibility", "visible"); //$NON-NLS-1$ //$NON-NLS-0$
			} else {
				dojo.style(faveButton, "visibility", "hidden"); //$NON-NLS-1$ //$NON-NLS-0$
			}
		}
	}
	
	function setPageTarget(item, serviceRegistry, commandService, /*optional*/ alternateItem, /* optional */ pageFavoriteTarget) {
		pageItem = item;
		generateRelatedLinks(serviceRegistry, item, exclusions, commandService, alternateItem);
		favoriteTarget = pageFavoriteTarget;
		checkFavoritesButton(serviceRegistry, commandService);
		// in the future we should do breadcrumb management and search scoping here
	}
	
	
	/**
	 * Generates the banner at the top of a page.
	 * @name orion.globalCommands#generateBanner
	 * @function
	 */
	function generateBanner(parentId, serviceRegistry, commandService, prefsService, searcher, handler, /* optional */ editor, /* optional */ escapeProvider) {
		// this needs to come from somewhere but I'm not going to do a separate get for it
		
		var text;
		
		var target = "_self"; //$NON-NLS-0$
		
		var parent = dojo.byId(parentId);
		if (!parent) {
			throw messages["could not find banner parent, id was "] + parentId;
		}
				
		// place the HTML fragment from above.
		dojo.place(commonHTML.topHTMLFragment, parent, "only"); //$NON-NLS-0$
		
		var toolbar = dojo.byId("pageToolbar"); //$NON-NLS-0$
		if (toolbar) {
			dojo.place(commonHTML.toolbarHTMLFragment, toolbar, "only"); //$NON-NLS-0$
			dojo.addClass(toolbar, "toolComposite"); //$NON-NLS-0$
		} else {
			toolbar = dojo.create ("div", {id: "pageToolbar", "class": "toolbar toolComposite layoutBlock"}, "titleArea", "after"); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.place(commonHTML.toolbarHTMLFragment, toolbar, "only"); //$NON-NLS-0$
		}
		
		// Set up a custom parameter collector that slides out of adjacent tool areas.
		commandService.setParameterCollector(new mParameterCollectors.CommandParameterCollector());

		
		// place an empty div for keyAssist
		dojo.place('<div id="keyAssist" style="display: none" class="keyAssistFloat" role="list" aria-atomic="true" aria-live="assertive"></div>', document.body, "last"); //$NON-NLS-1$ //$NON-NLS-0$

		
		// generate primary nav links. 
		var primaryNav = dojo.byId("primaryNav"); //$NON-NLS-0$
		if (primaryNav) {
			// Note that the shape of the "orion.page.link" extension is not in any shape or form that could be considered final.
			// We've included it to enable experimentation. Please provide feedback on IRC or bugzilla.
			
			// The shape of a contributed navigation link is (for now):
			// info - information about the navigation link (object).
			//     required attribute: name - the name of the navigation link
			//     required attribute: id - the id of the navigation link
			//     required attribute: uriTemplate - the URL for the navigation link
			//     optional attribute: image - a URL to an icon representing the link (currently not used, may use in future)
			var navLinks= serviceRegistry.getServiceReferences("orion.page.link"); //$NON-NLS-0$
			var params = PageUtil.matchResourceParameters(window.location.href);
			// TODO: should not be necessary, see bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=373450
			var hostName = window.location.protocol + "//" + window.location.host; //$NON-NLS-0$
			var locationObject = {OrionHome: hostName, Location: params.resource};
			for (var i=0; i<navLinks.length; i++) {
				var info = {};
				var propertyNames = navLinks[i].getPropertyNames();
				for (var j = 0; j < propertyNames.length; j++) {
					info[propertyNames[j]] = navLinks[i].getProperty(propertyNames[j]);
				}
				if (info.uriTemplate && info.name) {
					var uriTemplate = new URITemplate(info.uriTemplate);
					var expandedHref = window.decodeURIComponent(uriTemplate.expand(locationObject));
					var link = dojo.create("a", {href: expandedHref, target: target, 'class':'targetSelector'}, primaryNav, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					text = document.createTextNode(info.name);
					dojo.place(text, link, "only"); //$NON-NLS-0$
				}
			}
		}
		
		// hook up search box behavior
		var searchField = dojo.byId("search"); //$NON-NLS-0$
		if (!searchField) {
			throw "failed to generate HTML for banner"; //$NON-NLS-0$
		}
		dojo.connect(searchField, "onkeypress", function(e){ //$NON-NLS-0$
			if (e.charOrCode === dojo.keys.ENTER) {
				if (searcher) {
					if (searchField.value.length > 0) {
						var query = searcher.createSearchQuery(searchField.value);
						window.location = require.toUrl("search/search.html") + "#"+query; //$NON-NLS-1$ //$NON-NLS-0$
					}
				} else {
					window.alert(messages["Can't search: no search service is available"]);
				}
			}
		});
		
		// Put page title in title area.  
		var title = dojo.byId("pageTitle"); //$NON-NLS-0$
		if (title) {
			text = document.createTextNode(document.title);
			dojo.place(text, title, "last"); //$NON-NLS-0$
		}

		
		// Assemble global commands
		var favoriteCommand = new mCommands.Command({
			name: messages["Make Favorite"],
			tooltip: messages['Add to the favorites list'],
			imageClass: "core-sprite-makeFavorite", //$NON-NLS-0$
			id: "orion.makeFavorite", //$NON-NLS-0$
			visibleWhen: function(item) {
				var items = dojo.isArray(item) ? item : [item];
				if (items.length === 0) {
					return false;
				}
				for (var i=0; i < items.length; i++) {
					if (!items[i].Location) {
						return false;
					}
				}
				return true;},
			callback: function(data) {
				var items = dojo.isArray(data.items) ? data.items : [data.items];
				var favService = serviceRegistry.getService("orion.core.favorite"); //$NON-NLS-0$
				var doAdd = function(item) {
					return function(result) {
						if (!result) {
							favService.makeFavorites(item);
						} else {
							serviceRegistry.getService("orion.page.message").setMessage(item.Name + messages[' is already a favorite.'], 2000); //$NON-NLS-0$
						}
					};
				};
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					favService.hasFavorite(item.ChildrenLocation || item.Location).then(doAdd(item));
				}
			}});
		commandService.addCommand(favoriteCommand);
	
		var openResourceDialog = function(searcher, serviceRegistry, /* optional */ editor) {
			var favoriteService = serviceRegistry.getService("orion.core.favorite"); //$NON-NLS-0$
			//TODO Shouldn't really be making service selection decisions at this level. See bug 337740
			if (!favoriteService) {
				favoriteService = new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
				//service must be accessed via the registry so we get async behaviour
				favoriteService = serviceRegistry.getService("orion.core.favorite"); //$NON-NLS-0$
			}
			var dialog = new orion.widgets.OpenResourceDialog({searcher: searcher, searchRenderer:searcher.defaultRenderer, favoriteService:favoriteService});
			if (editor) {
				dojo.connect(dialog, "onHide", function() { //$NON-NLS-0$
					editor.getTextView().focus(); // Focus editor after dialog close, Dojo's doesn't work
				});
			}
			window.setTimeout(function() {dialog.show();}, 0);
		};
			
		var openResourceCommand = new mCommands.Command({
			name: messages["Find File Named..."],
			tooltip: messages["Choose a file by name and open an editor on it"],
			id: "eclipse.openResource", //$NON-NLS-0$
			callback: function(data) {
				openResourceDialog(searcher, serviceRegistry, editor);
			}});
			
		// set binding in editor and a general one for other pages
		if (editor) {
			editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding("f", true, true, false), messages['Find File Named...']); //$NON-NLS-0$
			editor.getTextView().setAction(messages['Find File Named...'], function() {
					openResourceDialog(searcher, serviceRegistry, editor);
					return true;
				});
		}
		
		commandService.addCommand(openResourceCommand);
		commandService.registerCommandContribution("globalActions", "eclipse.openResource", 100,  null, true, new mCommands.CommandKeyBinding('f', true, true)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		// Toggle trim command
		var toggleBanner = new mCommands.Command({
			name: messages["Toggle banner and footer"],
			tooltip: messages["Hide or show the page banner and footer"],
			id: "orion.toggleTrim", //$NON-NLS-0$
			callback: function() {
				var layoutWidget = dijit.byId(parent.parentNode.id);
				if (layoutWidget) {
					var header = parent;
					var footer = dojo.byId("footer"); //$NON-NLS-0$
					if (header.style.display === "none") { //$NON-NLS-0$
						header.style.display = "block"; //$NON-NLS-0$
						footer.style.display = "block"; //$NON-NLS-0$
					} else {
						header.style.display = "none"; //$NON-NLS-0$
						footer.style.display = "none"; //$NON-NLS-0$
					}
					layoutWidget.layout();
				}
				return true;
			}});
		commandService.addCommand(toggleBanner);
		commandService.registerCommandContribution("globalActions", "orion.toggleTrim", 100, null, true, new mCommands.CommandKeyBinding("m", true, true)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		if (editor) {
			editor.getTextView().setKeyBinding(new mCommands.CommandKeyBinding('m', true, true), "Toggle Trim"); //$NON-NLS-1$ //$NON-NLS-0$
			editor.getTextView().setAction("Toggle Trim", toggleBanner.callback); //$NON-NLS-0$
		}
				
		var keyAssistNode = dojo.byId("keyAssist"); //$NON-NLS-0$
		dojo.connect(document, "onkeypress", dojo.hitch(this, function (e){  //$NON-NLS-0$
			if (e.charOrCode === dojo.keys.ESCAPE) {
				keyAssistNode.style.display = "none"; //$NON-NLS-0$
			}
		}));
		dojo.connect(document, "onclick", dojo.hitch(this, function(e) { //$NON-NLS-0$
			var clickNode =  e.target || e.originalTarget || e.srcElement; 
			if (clickNode && clickNode.id !== "keyAssist") { //$NON-NLS-0$
				keyAssistNode.style.display = "none"; //$NON-NLS-0$
			}
		}));
		if (editor) {
			editor.getTextView().addEventListener("MouseDown", function() { //$NON-NLS-0$
				keyAssistNode.style.display = "none"; //$NON-NLS-0$
			});
		}
		
		if (escapeProvider) {
			var keyAssistEscHandler = {
				isActive: function() {
					return keyAssistNode.style.display === "block"; //$NON-NLS-0$
				},
				
				cancel: function() {
					if (this.isActive()) {
						keyAssistNode.style.display = "none"; //$NON-NLS-0$
						return true;
					}
					return false;   // not handled
				}
			};
			escapeProvider.addHandler(keyAssistEscHandler);
		}
		
		var keyAssistCommand = new mCommands.Command({
			name: messages["Show Keys"],
			tooltip: messages["Show a list of all the keybindings on this page"],
			id: "eclipse.keyAssist", //$NON-NLS-0$
			callback: function() {
				if (keyAssistNode.style.display === "none") { //$NON-NLS-0$
					dojo.empty(keyAssistNode);
					if (editor) {
						dojo.place("<h2>"+messages["Editor"]+"</h2>", keyAssistNode, "last"); //$NON-NLS-1$ //$NON-NLS-0$ //$NON-NLS-3$ //$NON-NLS-2$
						var editorActions = editor.getTextView().getActions(false);
						for(var i=0; i<editorActions.length; i++) {
							var actionName = editorActions[i];
							var bindings = editor.getTextView().getKeyBindings(actionName);
							for (var j=0; j<bindings.length; j++) {
								dojo.place("<span role=\"listitem\">"+mUtil.getUserKeyString(bindings[j])+" = " + actionName + "<br></span>", keyAssistNode, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							}
						}
					}
					dojo.place("<h2>"+messages["Global"]+"</h2>", keyAssistNode, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
					commandService.showKeyBindings(keyAssistNode);
					keyAssistNode.style.display = "block"; //$NON-NLS-0$
				} else {
					keyAssistNode.style.display = "none"; //$NON-NLS-0$
				}
				return true;
			}});
		commandService.addCommand(keyAssistCommand);
		commandService.registerCommandContribution("globalActions", "eclipse.keyAssist", 100, null, true, new mCommands.CommandKeyBinding(191, false, true)); //$NON-NLS-1$ //$NON-NLS-0$
		if (editor) {
			var isMac = window.navigator.platform.indexOf("Mac") !== -1; //$NON-NLS-0$
			editor.getTextView().setKeyBinding(new mCommands.CommandKeyBinding(191, false, true, !isMac, isMac), messages['Show Keys']);
			editor.getTextView().setAction(messages['Show Keys'], keyAssistCommand.callback);
		}
		
		userMenu.setKeyAssist(keyAssistCommand.callback);
		checkFavoritesButton(serviceRegistry, commandService);

		renderGlobalCommands(commandService, handler, pageItem);
		
		generateUserInfo(serviceRegistry);
		
		// generate the footer. 
		// TODO The footer div id should not be assumed here
		if (commonHTML.bottomHTMLFragment) {
			var footer = dojo.byId("footer"); //$NON-NLS-0$
			if (footer) {
				dojo.place(commonHTML.bottomHTMLFragment, footer, "only"); //$NON-NLS-0$
			}
		}
		// now that footer containing progress pane is added
		startProgressService(serviceRegistry);

		// force layout
		mUtil.forceLayout(parent.parentNode);
		//every time the user manually changes the hash, we need to load the workspace with that name
		dojo.subscribe("/dojo/hashchange", commandService, function() { //$NON-NLS-0$
			commandService.processURL(window.location.href);
		});
		
		function setTarget(target){
			target = target;
			
			dojo.query(".targetSelector").forEach(function(node, index, arr){ //$NON-NLS-0$
				node.target = target;
  			});	
		}
		
		function readTargetPreference(){
		
			prefsService.getPreferences('/settings', 2).then( function(prefs){	 //$NON-NLS-0$
			
				var data = prefs.get("General"); //$NON-NLS-0$
					
				if( data !== undefined ){
					
					var storage = JSON.parse( data );
					
					if(storage){
						var target = prefsService.getSetting( storage, "Navigation", "Links" ); //$NON-NLS-1$ //$NON-NLS-0$
						
						if( target === "Open in new tab" ){ //$NON-NLS-0$
							target = "_blank"; //$NON-NLS-0$
						}else{
							target = "_self"; //$NON-NLS-0$
						}
						
						setTarget( target );
					}
				}
			});
		}
		
		readTargetPreference();
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
