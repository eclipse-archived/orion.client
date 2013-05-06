/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window document define login logout localStorage orion */
/*jslint browser:true sub:true*/

define(['i18n!orion/nls/messages', 'require', 'orion/commonHTMLFragments', 'orion/keyBinding', 'orion/commandRegistry', 'orion/commands', 'orion/parameterCollectors', 
	'orion/extensionCommands', 'orion/uiUtils', 'orion/keyBinding', 'orion/breadcrumbs', 'orion/webui/littlelib', 'orion/webui/splitter', 
	'orion/webui/dropdown', 'orion/webui/tooltip', 'orion/favorites', 'orion/contentTypes', 'orion/URITemplate', 'orion/PageUtil', 'orion/widgets/themes/ThemePreferences', 'orion/widgets/themes/container/ThemeData', 
	'orion/searchUtils', 'orion/inputCompletion/inputCompletion', 'orion/globalSearch/advSearchOptContainer', 'orion/Deferred',
	'orion/widgets/UserMenu', 'orion/PageLinks', 'orion/webui/dialogs/OpenResourceDialog', 'text!orion/banner/banner.html', 'text!orion/banner/footer.html', 'text!orion/banner/toolbar.html', 'orion/widgets/input/DropDownMenu', 'orion/widgets/input/GroupedContent'], 
        function(messages, require, commonHTML, KeyBinding, mCommandRegistry, mCommands, mParameterCollectors, mExtensionCommands, mUIUtils, mKeyBinding, mBreadcrumbs, lib, mSplitter, 
        mDropdown, mTooltip, mFavorites, mContentTypes, URITemplate, PageUtil, mThemePreferences, mThemeData, mSearchUtils, mInputCompletion, 
        mAdvSearchOptContainer, Deferred, mUserMenu, PageLinks, openResource, BannerTemplate, FooterTemplate, ToolbarTemplate, DropDownMenu, GroupedContent){

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
	
	function getLabel(authService, serviceReference){
		if(authService.getLabel){
			return authService.getLabel();
		} else {
			var d = new Deferred();
			d.resolve(serviceReference.properties.name);
			return d;
		}
	}
	
	var authenticationIds = [];
	
	function startProgressService(serviceRegistry){
		var progressPane = lib.node("progressPane"); //$NON-NLS-0$
		progressPane.setAttribute("aria-label", messages['Operations - Press spacebar to show current operations']); //$NON-NLS-1$ //$NON-NLS-0$
		var progressService = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
		if(progressService) {
			progressService.init.bind(progressService)("progressPane"); //$NON-NLS-0$
		}
	}
	
	function setUserIcon(){
		var userTrigger = document.getElementById( 'userTrigger' );
		var userTriggerClassName = userTrigger.className;
		userTriggerClassName = userTriggerClassName + ' core-sprite-silhouette-inverse';
		userTrigger.className = userTriggerClassName;
	}
	
	function setUserName(registry, node){
			var authService = registry.getService("orion.core.auth"); //$NON-NLS-0$
			if (authService !== null) {
				authService.getUser().then(function(jsonData){
					if (!jsonData) {
						return;
					}
					var text;
					if( jsonData.Name ){
						text = document.createTextNode(jsonData.Name); 
					}else if( jsonData.login ){
						text = document.createTextNode(jsonData.login);
					} 
					if (text) {
						if (node.childNodes.length > 0) {
							if (node.childNodes[0].nodeType === 3) {
								// replace original text
								node.replaceChild(text, node.childNodes[0]);
							} else {
								node.insertBefore(text, node.childNodes[0]);
							}
						} else {
							node.appendChild(text);
						}
					}
				});
			}
		}

	/**
	 * Adds the user-related commands to the toolbar
	 * @name orion.globalCommands#generateUserInfo
	 * @function
	 */
	function generateUserInfo(serviceRegistry, keyAssistFunction) {
		
		var authServices = serviceRegistry.getServiceReferences("orion.core.auth"); //$NON-NLS-0$
		authenticationIds = [];
		var userMenuPlaceholder = lib.node("userMenu"); //$NON-NLS-0$
		if(!userMenuPlaceholder){
			return;
		}
		var dropdownNode = lib.node("userDropdown"); //$NON-NLS-0$
		var userDropdown = new mDropdown.Dropdown({
			dropdown: dropdownNode
		});
		var menuGenerator = new mUserMenu.UserMenu({dropdownNode: dropdownNode, dropdown: userDropdown, serviceRegistry: serviceRegistry});
		var dropdownTrigger = lib.node("userTrigger"); //$NON-NLS-0$
		
		new mTooltip.Tooltip({
			node: dropdownTrigger,
			text: messages['Options'],
			position: ["below", "left"] //$NON-NLS-1$ //$NON-NLS-0$
		});
			
		/*	To add user name call:
		
		    setUserName(serviceRegistry, dropdownTrigger);
		    
		 */

		setUserIcon();

		menuGenerator.setKeyAssist(keyAssistFunction);

		for(var i=0; i<authServices.length; i++){
			var servicePtr = authServices[i];
			var authService = serviceRegistry.getService(servicePtr);	
			getLabel(authService, servicePtr).then(function(label){			
				authService.getKey().then(function(key){
					authenticationIds.push(key);
					authService.getUser().then(function(jsonData){
						menuGenerator.addUserItem(key, authService, label, jsonData);
					}, 
					function(errorData, jsonData){
						menuGenerator.addUserItem(key, authService, label, jsonData);
					});
					window.addEventListener("storage", function(e){ //$NON-NLS-0$
						if(authRendered[key] === localStorage.getItem(key)){
							return;
						}
						
						authRendered[key] = localStorage.getItem(key);
						
						authService.getUser().then(function(jsonData){
							menuGenerator.addUserItem(key, authService, label, jsonData);
						}, 
						function(errorData){
							menuGenerator.addUserItem(key, authService, label);
						});				
					}, false);
				});							
			});
		}
		
	}
	
	function _addAdvancedSearchButton(container) {
		var dropDownImage = document.createElement("span"); //$NON-NLS-0$
		dropDownImage.id = "advancedSearchDropDown"; //$NON-NLS-0$
		lib.node("searchOptions").appendChild(dropDownImage); //$NON-NLS-0$
		dropDownImage.tabIndex = 0;
		dropDownImage.classList.add("advancedSearchDecorationSprite");//$NON-NLS-0$
		dropDownImage.classList.add("core-sprite-openarrow"); //$NON-NLS-0$
		dropDownImage.title = messages["Advanced search"];
		dropDownImage.onclick = function(evt) {
			container.toggle();
		};
		dropDownImage.addEventListener("keydown", function(e) { //$NON-NLS-0$
			var keyCode= e.charCode || e.keyCode;
			if (keyCode === 13 ) {// ENTER
				container.toggle();
			} 
		});
		dropDownImage.classList.add("bannerMenuSearchOptions"); //$NON-NLS-0$
	}
	
	// Related links menu management.  The related menu is reused as content changes.  If the menu becomes
	// empty, we hide the dropdown.
	var linksDropdown;
	var pageItem;
	var exclusions = [];
	var title;
	
	function _emptyLinksMenu() {
		var related = lib.node("relatedLinks"); //$NON-NLS-0$
		if(!related){
			// document not loaded
			return;
		}
		if (linksDropdown) {
			linksDropdown.close();
			linksDropdown.empty();
		}
	}
	
	function _checkForEmptyLinksMenu() {
		var triggerNode = lib.node("relatedTrigger"); //$NON-NLS-0$
		if (linksDropdown && triggerNode) {
			if (linksDropdown.getItems().length === 0) {
				triggerNode.style.visibility = "hidden"; //$NON-NLS-0$
			} else {
				triggerNode.style.visibility = "visible"; //$NON-NLS-0$ 
			}
		}
	}
	
	function _addRelatedLinkCommand(command, invocation) {
		var dropdownNode = lib.node("relatedDropdown"); //$NON-NLS-0$
		
		/* Evolving to a compound list of navigation and related links
		   Some of this code was dedicated to the older dropdown. Will
		   clean this up as a next step. 
		
		if (!linksDropdown) {
			linksDropdown = new mDropdown.Dropdown({
				dropdown: dropdownNode
			});
		} */
		
		mCommands.createCommandMenuItem(dropdownNode, command, invocation);
		
		var relatedlinks = lib.node('relatedlinks');
		var link = mCommands.createCommandMenuItem(dropdownNode, command, invocation);
		link.className = '';
		var li = document.createElement( 'li' );
		li.appendChild(link);
		relatedlinks.appendChild(li);
	}	
	/**
	 * Adds the related links to the banner
	 * @name orion.globalCommands#generateRelatedLinks
	 * @function
	 */
	function generateRelatedLinks(serviceRegistry, item, exclusions, commandRegistry, alternateItem) {
	
		var relatedlinks = lib.node('relatedlinks');
		lib.empty( relatedlinks );
	
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
		var related = lib.node("relatedLinks"); //$NON-NLS-0$
		if(!related){
			// document not loaded
			return;
		}
		
		Deferred.when(getContentTypes(), function() {
			var alternateItemDeferred;
			_emptyLinksMenu();
			var deferreds = [];
			
			// assemble the related links
			for (var i=0; i<contributedLinks.length; i++) {
				var info = {};
				var j;
				var propertyNames = contributedLinks[i].getPropertyKeys();
				for (j = 0; j < propertyNames.length; j++) {
					info[propertyNames[j]] = contributedLinks[i].getProperty(propertyNames[j]);
				}
				if (info.id) {
					function enhanceCommand(command){
						if (command) {
							if (!command.visibleWhen || command.visibleWhen(item)) {
								var invocation = new mCommands.CommandInvocation(item, item, null, command, commandRegistry);
								_addRelatedLinkCommand(command, invocation);
							} else if (typeof alternateItem === "function") { //$NON-NLS-0$
								if (!alternateItemDeferred) {
									alternateItemDeferred = alternateItem();
								}
								
								Deferred.when(alternateItemDeferred, function (newItem) {
									if (newItem && (item === pageItem)) { // there is an alternate, and it still applies to the current page target
										if (!command.visibleWhen || command.visibleWhen(newItem)) {
											_addRelatedLinkCommand(command, new mCommands.CommandInvocation(newItem, newItem, null, command, commandRegistry));
										}
									}
								});
							}
						} 
					}
					
					var command = null;
					var deferred = null;
					// exclude anything in the list of exclusions
					var position = exclusions.indexOf(info.id);
					if (position < 0) {
						// First see if we have a uriTemplate and name, which is enough to build a command internally.
						if (((info.nls && info.nameKey) || info.name) && info.uriTemplate) {
							deferred = mExtensionCommands._createCommandOptions(info, contributedLinks[i], serviceRegistry, contentTypesCache, true);
							deferreds.push(deferred);
							deferred.then(function(commandOptions){
								var command = new mCommands.Command(commandOptions);
								enhanceCommand(command);
							});
							continue;
						}
						// If we couldn't compose one, see if one is already registered.
						if (!command) {
							command = commandRegistry.findCommand(info.id);
							if(command){
								enhanceCommand(command);
								continue;
							}
						}
						// If it's not registered look for it in orion.navigate.command and create it
						if (!command) {
							var commandsReferences = serviceRegistry.getServiceReferences("orion.navigate.command"); //$NON-NLS-0$
							for (j=0; j<commandsReferences.length; j++) {
								var id = commandsReferences[j].getProperty("id"); //$NON-NLS-0$
								if (id === info.id) {
									var navInfo = {};
									propertyNames = commandsReferences[j].getPropertyKeys();
									for (var k = 0; k < propertyNames.length; k++) {
										navInfo[propertyNames[k]] = commandsReferences[j].getProperty(propertyNames[k]);
									}
									deferred = mExtensionCommands._createCommandOptions(navInfo, commandsReferences[j], serviceRegistry, contentTypesCache, true);
									deferreds.push(deferred);
									deferred.then(function(commandOptions){
										command = new mCommands.Command(commandOptions);
										enhanceCommand(command);
									});
									break;
								}
							}
						} 

					}
				} 
			}
			Deferred.all(deferreds, function(error) { return error; }).then(function(){
				_checkForEmptyLinksMenu();
			});
		});
	}
	
	function renderGlobalCommands(commandRegistry) {
		var globalTools = lib.node("globalActions"); //$NON-NLS-0$
		if (globalTools) {	
			commandRegistry.destroy(globalTools);
			commandRegistry.renderCommands(globalTools.id, globalTools, {}, {}, "tool"); //$NON-NLS-0$
		}
	}
	
	/**
	 * Support for establishing a page item associated with global commands and related links
	 */

	function setPageCommandExclusions(excluded) {
		exclusions = excluded;
	}
		
	/**
	 * Set a dirty indicator for the page.  An in-page indicator will always be set.  
	 * If the document has a title (set via setPageTarget), then the title will also be updated
	 * with a dirty indicator.
	 */
	function setDirtyIndicator(isDirty) {
		if (title) {
			if (title.charAt(0) === '*' && !isDirty) { //$NON-NLS-0$
				title = title.substring(1);
			}
			if (isDirty && title.charAt(0) !== '*') { //$NON-NLS-0$
				title = '*' + title; //$NON-NLS-0$
			}
			window.document.title = title;
		}

		var dirty = lib.node("dirty"); //$NON-NLS-0$f
		if (dirty) {
			if (isDirty) {
				dirty.textContent = "*"; //$NON-NLS-0$
			} else {
				dirty.textContent = ""; //$NON-NLS-0$
			}
		}
	}
	/**
	 * Set the target of the page so that common infrastructure (breadcrumbs, related menu, etc.) can be
	 * added for the page.
	 * @param {Object} options The target options object.
	 * @param {String} options.task the name of the user task that the page represents.
	 * @param {Object} options.target the metadata describing the page resource target.  Optional.
	 * @param {String} options.name the name of the resource that is showing on the page.  Optional.  If a target
	 * parameter is supplied, the target metadata name will be used if a name is not specified in the options.
	 * @param {String} options.title the title to be used for the page.  Optional.  If not specified, a title
	 * will be constructed using the task and/or name.
	 * @param {String} options.breadcrumbRootName the name used for the breadcrumb root.  Optional.  If not
	 * specified, the breadcrumbTarget, fileService, task, and name will be consulted to form a root name.
	 * @param {Object} options.breadcrumbTarget the metadata used for the breadcrumb target. Optional.  If not
	 * specified, options.target is used as the breadcrumb target.
	 * @param {Function} options.makeAlternate a function that can supply alternate metadata for the related
	 * pages menu if the target does not validate against a contribution.  Optional.
	 * @param {Function} options.makeBreadcrumbLink a function that will supply a breadcrumb link based on a location
	 * shown in a breadcrumb.  Optional.  If not specified, and if a target is specified, the breadcrumb link will
	 * refer to the Navigator.
	 * @param {Object} options.serviceRegistry the registry to use for obtaining any unspecified services.  Optional.  
	 * If not specified, then any banner elements requiring Orion services will not be provided.
	 * @param {Object} options.commandService the commandService used for accessing related page commands.  Optional.
	 * If not specified, a related page menu will not be shown.
	 * @param {Object} options.searchService the searchService used for scoping the searchbox.  Optional.  If not 
	 * specified, the searchbox will not be scoped.
	 * @param {Object} options.fileService the fileService used for retrieving additional metadata and managing
	 * the breadcrumb for multiple file services.  If not specified, there may be reduced support for multiple file 
	 * implementations.
	 *
	 */
	function setPageTarget(options) {
		var name;
		var fileSystemRootName;
		var breadcrumbRootName = options.breadcrumbRootName;
		if (options.target) {  // we have metadata
			if (options.searchService) {
				options.searchService.setLocationByMetaData(options.target); //$NON-NLS-0$
			}
			if (options.fileService && !options.breadcrumbTarget) {
				fileSystemRootName = breadcrumbRootName ? breadcrumbRootName + " " : "";  //$NON-NLS-0$
				fileSystemRootName = fileSystemRootName +  options.fileService.fileServiceName(options.target.Location);
				breadcrumbRootName = null;
			} 
			name = options.name || options.target.Name;
			pageItem = options.target;
			generateRelatedLinks(options.serviceRegistry, options.target, exclusions, options.commandService, options.makeAlternate);
		} else {
			if (!options.breadcrumbTarget) {
				breadcrumbRootName = breadcrumbRootName || options.task || options.name;
			}
			name = options.name;
		}
		title = options.title;
		if (!title) {
			if (name) {
				title = name + " - "+ options.task; //$NON-NLS-0$
			} else {
				title = options.task;
			}
		} 
		window.document.title = title;
		lib.empty(lib.node("location")); //$NON-NLS-0$
		new mBreadcrumbs.BreadCrumbs({
			container: "location",  //$NON-NLS-0$
			resource: options.breadcrumbTarget || options.target,
			rootSegmentName: breadcrumbRootName,
			workspaceRootSegmentName: fileSystemRootName,
			makeHref: options.makeBreadcrumbLink
		});
	}
	
	function getToolbarElements(toolNode) {
		var elements = {};
		var toolbarNode = null;
		if (typeof toolNode === "string") { //$NON-NLS-0$
			toolNode = lib.node(toolNode);
		}
		// no reference node has been given, so use the main toolbar.
		if (!toolNode) {
			toolNode = lib.node("pageActions"); //$NON-NLS-0$
		}
		var node = toolNode;
		// the trickiest part is finding where to start looking (section or main toolbar).
		// We need to walk up until we find a "toolComposite"

		while (node && node.classList) {
			if (node.classList.contains("toolComposite")) { //$NON-NLS-0$
				toolbarNode = node;
				break;
			}
			node = node.parentNode;
		}
		if (toolNode.classList.contains("commandMarker")) { //$NON-NLS-0$
			elements.commandNode = toolNode;
		}
		if (toolbarNode) {
			elements.slideContainer = lib.$(".slideParameters", toolbarNode); //$NON-NLS-0$
			elements.parameterArea = lib.$(".parameters", toolbarNode); //$NON-NLS-0$
			elements.dismissArea = lib.$(".parametersDismiss", toolbarNode); //$NON-NLS-0$
			elements.notifications = lib.$("#notificationArea", toolbarNode); //$NON-NLS-0$
			if (toolbarNode.parentNode) {
				elements.toolbarTarget = lib.$(".toolbarTarget", toolbarNode.parentNode); //$NON-NLS-0$
				if (elements.toolbarTarget) {
					var bounds = lib.bounds(toolbarNode);
					// assumes that there is never anything besides notifications and slideout between toolbar and its target
					// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=391596
					elements.toolbarTargetY = bounds.height+1;   
				}
			}
		}
		return elements;
	}
	
	function layoutToolbarElements(elements) {
		if (elements.toolbarTarget && elements.toolbarTargetY) {
			var heightExtras = 0;
			var bounds;
			if (elements.notifications && elements.notifications.classList.contains("slideContainerActive")) { //$NON-NLS-0$
				bounds = lib.bounds(elements.notifications);
				heightExtras += bounds.height;
			}
			if (elements.slideContainer && elements.slideContainer.classList.contains("slideContainerActive")) { //$NON-NLS-0$
				bounds = lib.bounds(elements.slideContainer);
				heightExtras += bounds.height;
			}
			if (heightExtras > 0) {
				heightExtras += 8;  // padding
			}
			elements.toolbarTarget.style.top = elements.toolbarTargetY + heightExtras + "px"; //$NON-NLS-0$
			elements.toolbarTarget.style.bottom = 0;
		}
	}
	
	/* This function adds a settings dialog to a page. It adds it so that	
		a settings gear will appear at the right hand side */
	
	function addSettings( settings ){
		var settingsNode = document.getElementById("settingsTab"); //$NON-NLS-0$
		var settingsButton = document.getElementById("settingsAction"); //$NON-NLS-0$
		var CLICKED = false;
		var panel;
		
		settingsNode.style.visibility = '';
		settingsButton.style.visibility = '';
		settingsButton.onclick = function(){
		
			if( !CLICKED ){
			
				CLICKED = true;
		
				var TAB_HEIGHT = 24;
				var PANEL_HEIGHT = 200;
				var PANEL_WIDTH = 150;
				var BORDER_RADIUS = '3px'; //$NON-NLS-0$
				var COLOR = '#555'; //$NON-NLS-0$
			
				settingsNode.style.backgroundColor = COLOR;
				settingsNode.style.zIndex = '99'; //$NON-NLS-0$
				settingsNode.style.borderTopRightRadius = BORDER_RADIUS;
				settingsNode.style.borderTopLeftRadius = BORDER_RADIUS;
				
				settingsButton.className = "core-sprite-settings-white"; //$NON-NLS-0$
				
				settingsNode.id = 'settingsNode'; //$NON-NLS-0$
				settingsButton.id = 'settingsButton'; //$NON-NLS-0$
				
				var rightPane = document.getElementById( 'innerPanels' );	 //$NON-NLS-0$
				var rpBox = rightPane.getBoundingClientRect();
				var box = settingsNode.getBoundingClientRect();
				
				if (!panel) {
					panel = document.createElement( 'div' ); //$NON-NLS-0$
					panel.className = 'settingsPanel'; //$NON-NLS-0$
					panel.style.width = PANEL_WIDTH + 'px'; //$NON-NLS-0$
					panel.style.height = PANEL_HEIGHT + 'px'; //$NON-NLS-0$
					panel.style.backgroundColor = COLOR;
					panel.style.zIndex = '99'; //$NON-NLS-0$
					panel.style.top = box.top - rpBox.top + TAB_HEIGHT -4 + 'px'; //$NON-NLS-0$
					panel.id = 'settingsPanel';		 //$NON-NLS-0$
					panel.style.borderTopLeftRadius = BORDER_RADIUS;
					panel.style.borderBottomRightRadius = BORDER_RADIUS;
					panel.style.borderBottomLeftRadius = BORDER_RADIUS;
					
					rightPane.appendChild( panel );
					lib.addAutoDismiss([settingsButton, settingsNode, panel], function() {
						settingsButton.className = "core-sprite-settings"; //$NON-NLS-0$
						settingsNode.style.backgroundColor = 'white'; //$NON-NLS-0$
						panel.style.visibility = 'hidden'; //$NON-NLS-0$
						CLICKED = false;
					});	
				} else {
					panel.style.visibility = 'visible'; //$NON-NLS-0$
				}
				lib.empty(panel);	
				settings.appendTo( panel );
			}
		};
	}
	
	var mainSplitter = null;
	
	function getMainSplitter(){
		return mainSplitter;
	}
	/**
	 * Generates the banner at the top of a page.
	 * @name orion.globalCommands#generateBanner
	 * @function
	 */
	function generateBanner(parentId, serviceRegistry, commandRegistry, prefsService, searcher, handler, /* optional */ editor, /* optional */ escapeProvider) {
		new mThemePreferences.ThemePreferences(prefsService, new mThemeData.ThemeData()).apply();
		
		var parent = lib.node(parentId);
		
		if (!parent) {
			throw messages["could not find banner parent, id was "] + parentId;
		}
		// place the HTML fragment for the header.
		var range = document.createRange();
		range.selectNode(parent);
		var headerFragment = range.createContextualFragment(BannerTemplate);
		// do the i18n string substitutions
		lib.processTextNodes(headerFragment, messages);
		
		if (parent.firstChild) {
			parent.insertBefore(headerFragment, parent.firstChild);
		} else {
			parent.appendChild(headerFragment);
		}
		// TODO not entirely happy with this.  Dynamic behavior that couldn't be in the html template, maybe it could be dynamically
		// bound in a better way like we do with NLS strings
		var home = lib.node("home"); //$NON-NLS-0$
		home.href = require.toUrl("navigate/table.html"); //$NON-NLS-0$
		home.setAttribute("aria-label", messages['Orion Home']);  //$NON-NLS-1$ //$NON-NLS-0$
		var progressPane = lib.node("progressPane"); //$NON-NLS-0$
		progressPane.src = require.toUrl("images/none.png"); //$NON-NLS-0$

		var toolbar = lib.node("pageToolbar"); //$NON-NLS-0$
		if (toolbar) {
			toolbar.classList.add("toolbarLayout"); //$NON-NLS-0$
			toolbar.innerHTML = ToolbarTemplate + commonHTML.slideoutHTMLFragment("mainToolbar"); //$NON-NLS-0$
		}
		var closeNotification = lib.node("closeNotifications"); //$NON-NLS-0$
		if (closeNotification) {
			closeNotification.setAttribute("aria-label", messages['Close notification']);  //$NON-NLS-1$ //$NON-NLS-0$
		}
		
		var footer = lib.node("footer"); //$NON-NLS-0$
		if (footer) {
			footer.innerHTML = FooterTemplate;
			// do the i18n string substitutions
			lib.processTextNodes(footer, messages);
		}
		
		// Set up a custom parameter collector that slides out of adjacent tool areas.
		commandRegistry.setParameterCollector(new mParameterCollectors.CommandParameterCollector(getToolbarElements, layoutToolbarElements));
		
		// place an empty div for keyAssist
		var keyAssistDiv = document.createElement("div");//$NON-NLS-0$
		keyAssistDiv.id = "keyAssist";//$NON-NLS-0$
		keyAssistDiv.style.display = "none";//$NON-NLS-0$
		keyAssistDiv.classList.add("keyAssistFloat");//$NON-NLS-0$
		keyAssistDiv.role="list";//$NON-NLS-0$
		keyAssistDiv.setAttribute("aria-atomic", "true");//$NON-NLS-1$ //$NON-NLS-0$
		keyAssistDiv.setAttribute("aria-live", "assertive");//$NON-NLS-1$ //$NON-NLS-0$
		document.body.appendChild(keyAssistDiv);
		
		document.addEventListener("keydown", function (e){  //$NON-NLS-0$
			if (e.charOrCode === lib.KEY.ESCAPE) {
				keyAssistDiv.style.display = "none"; //$NON-NLS-0$
			}
		}, false);
		lib.addAutoDismiss([keyAssistDiv], function() {
			keyAssistDiv.style.display = "none"; //$NON-NLS-0$
		});
		
		var nav = document.getElementById( 'centralNavigation' );
		
		new mTooltip.Tooltip({
			node: nav,
			text: 'Navigation Menu',
			position: ["right"] //$NON-NLS-1$ //$NON-NLS-0$
		});
		
		var navDropDown = new DropDownMenu( 'centralNavigation', { label:'Develop', icon:'core-sprite-hamburger-inverse' } );
		var groupedContent = new GroupedContent();
		navDropDown.addContent( groupedContent.getContentPane() );
		
		// generate primary nav links. 
		var primaryNav = lib.node("navigationlinks"); //$NON-NLS-0$
		if (primaryNav) {
			PageLinks.createPageLinks(serviceRegistry, "orion.page.link").then(function(links) { //$NON-NLS-0$
				links.forEach(function(link) {		
					var li = document.createElement( 'li' );	
					li.appendChild(link);
					primaryNav.appendChild(li);
				});
			});
		}
		
		// hook up split behavior - the splitter widget and the associated global command/key bindings.
		var splitNode = lib.$(".split"); //$NON-NLS-0$
		if (splitNode) {
			var side = lib.$(".sidePanelLayout"); //$NON-NLS-0$
			var main = lib.$(".mainPanelLayout"); //$NON-NLS-0$
			if (side && main) {
				mainSplitter = {side: side, main: main};
				mainSplitter.splitter = new mSplitter.Splitter({node: splitNode, sidePanel: side, mainPanel: main, toggle: true});
				var toggleSidePanelCommand = new mCommands.Command({
					name: messages["Toggle side panel"],
					tooltip: messages["Open or close the side panel"],
					id: "orion.toggleSidePane", //$NON-NLS-0$
					callback: function() {
						mainSplitter.splitter.toggleSidePanel();}
				});
				commandRegistry.addCommand(toggleSidePanelCommand);
				commandRegistry.registerCommandContribution("pageActions", "orion.toggleSidePane", 1, null, true, new KeyBinding.KeyBinding('o', true)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

				// editor behavior if needed
				var textView;
				if (editor && (textView = editor.getTextView())) {
					mainSplitter.splitter.addResizeListener(function(node) {
						if (editor && node === main) {
							textView.resize();
						}
					});
					textView.setKeyBinding(new mKeyBinding.KeyBinding("o", true), "toggleSidebar"); //$NON-NLS-1$ //$NON-NLS-0$
					textView.setAction("toggleSidebar", function(){ //$NON-NLS-0$
						mainSplitter.splitter.toggleSidePanel();
						return true;
					}, {name: messages["Toggle Sidebar"]});
				}
			}
		}

		// Assemble global commands, those that could be available from any page due to header content or common key bindings.
		// make favorite
		var favoriteCommand = new mCommands.Command({
			name: messages["Make Favorite"],
			tooltip: messages['Add to the favorites list'],
			imageClass: "core-sprite-makeFavorite", //$NON-NLS-0$
			id: "orion.makeFavorite", //$NON-NLS-0$
			visibleWhen: function(item) {
				var items = Array.isArray(item) ? item : [item];
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
				var items = Array.isArray(data.items) ? data.items : [data.items];
				var favService = serviceRegistry.getService("orion.core.favorite"); //$NON-NLS-0$
				var progress = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
				var doAdd = function(item) {
					return function(result) {
						if (!result) {
							progress.progress(favService.makeFavorites(item), "Making favorite " + item.Name);
						} else {
							serviceRegistry.getService("orion.page.message").setMessage(item.Name + messages[' is already a favorite.'], 2000); //$NON-NLS-0$
						}
					};
				};
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					progress.progress(favService.hasFavorite(item.ChildrenLocation || item.Location), "Checking favorite " + item.Name).then(doAdd(item));
				}
			}});
		commandRegistry.addCommand(favoriteCommand);
	
		// open resource
		var openResourceDialog = function(searcher, serviceRegistry, /* optional */ editor) {
			var favoriteService = serviceRegistry.getService("orion.core.favorite"); //$NON-NLS-0$
			var progress = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
			//TODO Shouldn't really be making service selection decisions at this level. See bug 337740
			if (!favoriteService) {
				favoriteService = new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
				//service must be accessed via the registry so we get async behaviour
				favoriteService = serviceRegistry.getService("orion.core.favorite"); //$NON-NLS-0$
			}
			var dialog = new openResource.OpenResourceDialog({
				searcher: searcher, 
				progress: progress,
				searchRenderer:searcher.defaultRenderer, 
				favoriteService:favoriteService,
				onHide:  function() { 
					if (editor && editor.getTextView()) {
						editor.getTextView().focus(); 
					}
				}
			});
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
		if (editor && editor.getTextView()) {
			editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding("f", true, true, false), openResourceCommand.id);   //$NON-NLS-0$
			editor.getTextView().setAction(openResourceCommand.id, function() {
					openResourceDialog(searcher, serviceRegistry, editor);
					return true;
				}, openResourceCommand);
		}
		
		commandRegistry.addCommand(openResourceCommand);
		commandRegistry.registerCommandContribution("globalActions", "eclipse.openResource", 100,  null, true, new KeyBinding.KeyBinding('f', true, true)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		var globalSearchCommand = new mCommands.Command({
			name: messages["Global search"],
			tooltip: messages["Global search"],
			id: "eclipse.globalSearch", //$NON-NLS-0$
			callback: function(data) {
				var searchField = lib.node("search"); //$NON-NLS-0$
				if(searchField){
					searchField.focus();
				}
			}});
			
		// set binding in editor and a general one for other pages
		if (editor && editor.getTextView()) {
			editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding("h", true, false, true), globalSearchCommand.id);   //$NON-NLS-0$
			editor.getTextView().setAction(globalSearchCommand.id, function() {
					var selection = editor.getSelection();
					var searchString = null;
					if (selection.end > selection.start) {//If there is selection from editor, we want to use it as the default keyword
						var model = editor.getModel();
						searchString = model.getText(selection.start, selection.end);
					}
					var searchField = lib.node("search"); //$NON-NLS-0$
					if(searchField){
						if(searchString){
							searchField.value = searchString;
						}
						searchField.focus();
					}
					return true;
				}, globalSearchCommand);
		}
		
		commandRegistry.addCommand(globalSearchCommand);
		commandRegistry.registerCommandContribution("globalActions", "eclipse.globalSearch", 101,  null, true, new KeyBinding.KeyBinding('h', true, false, true)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		// Toggle trim command
		var toggleBanner = new mCommands.Command({
			name: messages["Toggle banner and footer"],
			tooltip: messages["Hide or show the page banner and footer"],
			id: "orion.toggleTrim", //$NON-NLS-0$
			callback: function() {
				var header = lib.node("banner"); //$NON-NLS-0$
				var footer = lib.node("footer"); //$NON-NLS-0$
				var content = lib.$(".content-fixedHeight"); //$NON-NLS-0$
				if (header.style.display === "none") { //$NON-NLS-0$
					header.style.display = "block"; //$NON-NLS-0$
					footer.style.display = "block"; //$NON-NLS-0$
					content.classList.remove("content-fixedHeight-maximized"); //$NON-NLS-0$
				} else {
					header.style.display = "none"; //$NON-NLS-0$
					footer.style.display = "none"; //$NON-NLS-0$
					content.classList.add("content-fixedHeight-maximized"); //$NON-NLS-0$
				}	
				if (editor && editor.getTextView()) {
					editor.getTextView().resize();
				}
				return true;
			}});
		commandRegistry.addCommand(toggleBanner);
		commandRegistry.registerCommandContribution("globalActions", "orion.toggleTrim", 100, null, true, new KeyBinding.KeyBinding("m", true, true)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		if (editor && editor.getTextView()) {
			editor.getTextView().setKeyBinding(new KeyBinding.KeyBinding('m', true, true), toggleBanner.id); //$NON-NLS-0$
			editor.getTextView().setAction(toggleBanner.id, toggleBanner.callback, toggleBanner);
		}
						
		if (escapeProvider) {
			var keyAssistEscHandler = {
				isActive: function() {
					return keyAssistDiv.style.display === "block"; //$NON-NLS-0$
				},
				
				cancel: function() {
					if (this.isActive()) {
						keyAssistDiv.style.display = "none"; //$NON-NLS-0$
						return true;
					}
					return false;   // not handled
				}
			};
			escapeProvider.addHandler(keyAssistEscHandler);
		}
		//	Open configuration page, Ctrl+Shift+F1
		var configDetailsCommand = new mCommands.Command({
			name: messages["System Configuration Details"],
			tooltip: messages["System Config Tooltip"],
			id: "orion.configDetailsPage", //$NON-NLS-0$
			hrefCallback: function() {
				return require.toUrl("help/about.html"); //$NON-NLS-0$
			}});
					
		commandRegistry.addCommand(configDetailsCommand);
		commandRegistry.registerCommandContribution("globalActions", "orion.configDetailsPage", 100,  null, true, new KeyBinding.KeyBinding(112, true, true)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		//	Background Operations Page, Ctrl+Shift+O
		var operationsCommand = new mCommands.Command({
			name: messages["Background Operations"],
			tooltip: messages["Background Operations Tooltip"],
			id: "orion.backgroundOperations", //$NON-NLS-0$
			hrefCallback: function() {
				return require.toUrl("operations/list.html"); //$NON-NLS-0$
			}});
					
		commandRegistry.addCommand(operationsCommand);
		commandRegistry.registerCommandContribution("globalActions", "orion.backgroundOperations", 100,  null, true, new KeyBinding.KeyBinding('o', true, true)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		
		// Key assist
		var keyAssistCommand = new mCommands.Command({
			name: messages["Show Keys"],
			tooltip: messages["Show a list of all the keybindings on this page"],
			id: "eclipse.keyAssist", //$NON-NLS-0$
			callback: function() {
				if (keyAssistDiv.style.display === "none") { //$NON-NLS-0$
					var heading;
					lib.empty(keyAssistDiv);
					if (editor && editor.getTextView()) {
						heading = document.createElement("h2"); //$NON-NLS-0$
						heading.appendChild(document.createTextNode(messages["Editor"]));
						keyAssistDiv.appendChild(heading);
						var editorActions = editor.getTextView().getActions(false);
						for(var i=0; i<editorActions.length; i++) {
							var actionID = editorActions[i], actionName = actionID;
							var textView = editor.getTextView();
							var actionDescription = textView.getActionDescription(actionID);
							if (actionDescription && actionDescription.name) { actionName = actionDescription.name; }
							var bindings = textView.getKeyBindings(actionID);
							for (var j=0; j<bindings.length; j++) {
								var bindingString = mUIUtils.getUserKeyString(bindings[j]);
								var span = document.createElement("span"); //$NON-NLS-0$
								span.role = "listitem"; //$NON-NLS-0$
								span.appendChild(document.createTextNode(bindingString + " = " + actionName));  //$NON-NLS-0$
								span.appendChild(document.createElement("br")); //$NON-NLS-0$
								keyAssistDiv.appendChild(span);
							}
						}
					}
					heading = document.createElement("h2"); //$NON-NLS-0$
					heading.appendChild(document.createTextNode(messages["Global"]));
					keyAssistDiv.appendChild(heading);
					commandRegistry.showKeyBindings(keyAssistDiv);
					keyAssistDiv.style.display = "block"; //$NON-NLS-0$
				} else {
					keyAssistDiv.style.display = "none"; //$NON-NLS-0$
				}
				return true;
			}});
		commandRegistry.addCommand(keyAssistCommand);
		commandRegistry.registerCommandContribution("globalActions", "eclipse.keyAssist", 100, null, true, new KeyBinding.KeyBinding(191, false, true)); //$NON-NLS-1$ //$NON-NLS-0$
		if (editor && editor.getTextView()) {
			var isMac = window.navigator.platform.indexOf("Mac") !== -1; //$NON-NLS-0$
			editor.getTextView().setKeyBinding(new KeyBinding.KeyBinding(191, false, true, !isMac, isMac), keyAssistCommand.id);
			editor.getTextView().setAction(keyAssistCommand.id, keyAssistCommand.callback, keyAssistCommand);
		}
		
		renderGlobalCommands(commandRegistry);
		
		generateUserInfo(serviceRegistry, keyAssistCommand.callback);
		
		// now that footer containing progress pane is added
		startProgressService(serviceRegistry);

		// check for commands in the hash
		window.addEventListener("hashchange", function() { //$NON-NLS-0$
			commandRegistry.processURL(window.location.href);
		}, false);
		
		function setTarget(target){
			target = target;
			
			var nodes = lib.$$array(".targetSelector"); //$NON-NLS-0$
			for (var i=0; i<nodes.length; i++) {
				nodes[i].target = target;
			}
		}
		
		function readTargetPreference(serviceRegistry){
			serviceRegistry.registerService("orion.cm.managedservice", //$NON-NLS-0$
				{	updated: function(properties) {
						var target;
						if (properties && properties["links.newtab"] !== "undefined") { //$NON-NLS-1$ //$NON-NLS-0$
							target = properties["links.newtab"] ? "_blank" : "_self"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						} else {
							target = "_self"; //$NON-NLS-0$
						}
						setTarget(target);
					}
				}, {pid: "nav.config"}); //$NON-NLS-0$
		}
		window.setTimeout(function() {readTargetPreference(serviceRegistry);}, 0);
	}
	
	//return the module exports
	return {
		addSettings: addSettings,
		generateBanner: generateBanner,
		getToolbarElements: getToolbarElements,
		getMainSplitter: getMainSplitter,
		layoutToolbarElements: layoutToolbarElements,
		setPageTarget: setPageTarget,
		setDirtyIndicator: setDirtyIndicator,
		setPageCommandExclusions: setPageCommandExclusions,
		notifyAuthenticationSite: notifyAuthenticationSite
	};
});