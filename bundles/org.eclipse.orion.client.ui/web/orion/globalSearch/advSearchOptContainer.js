/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define window document console*/
/*jslint sub:true*/

define([
	'i18n!orion/search/nls/messages', 
	'require', 
	'orion/fileClient', 
	'orion/searchUtils', 
	'orion/contentTypes', 
	'orion/i18nUtil', 
	'orion/webui/littlelib', 
	'orion/inputCompletion/inputCompletion', 
	'orion/Deferred', 
	'orion/commands', 
	'orion/section', 
	'orion/objects',
	'orion/EventTarget',
	'orion/widgets/filesystem/filesystemSwitcher',
	'text!orion/globalSearch/searchBuilder.html',
	'orion/explorers/explorer-table',
	'orion/explorers/explorerNavHandler',
	'orion/explorers/navigatorRenderer',
	'orion/PageUtil',
	'orion/selection'
], function(messages, require, mFileClient, mSearchUtils, mContentTypes, i18nUtil, lib, mInputCompletion, Deferred, mCommands, mSection, objects, EventTarget, mFilesystemSwitcher, optionTemplate, mExplorerTable, mExplorerNavHandler, mNavigatorRenderer, mPageUtil, mSelection){

	/**
	 * @name orion.search.AdvSearchOptRenderer
	 * @class AdvSearchOptRenderer.
	 * @description The renderer to render all search parameters.
	 * @param {Dome node} parentDiv.
	 * @param {orion.search.Searcher} A searcher that knows how to start a search.
	 * @param {orion.commands.CommandRegistry} commandService
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 */
	function AdvSearchOptRenderer(parentDiv, searcher, serviceRegistry, commandService) {
		EventTarget.attach(this);
		this._parentDiv = parentDiv;
		this._searcher = searcher;
		this._serviceRegistry = serviceRegistry;
		this._contentTypeService = this._serviceRegistry.getService("orion.core.contentTypeRegistry"); //$NON-NLS-0$
		if(!this._contentTypeService){
			this._contentTypeService = new mContentTypes.ContentTypeRegistry(this._serviceRegistry);
		}
		this.contentTypesCache = this._contentTypeService.getContentTypes();
		this._commandService = commandService;
        this.fileClient = new mFileClient.FileClient(this._serviceRegistry);
        this.fsToolbar = null;
        this.fileSysChangeListener = (function(evt) {
        	var rootURL = evt.newInput;
			var href = mSearchUtils.generateSearchHref({resource : rootURL});
			window.location = href;
			this._rootURL = rootURL;
        }).bind(this);
		this.addEventListener("filesystemChanged", this.fileSysChangeListener); //$NON-NLS-0$
		if (!this.fsToolbar) {
			var fsToolbar = this.fsToolbar = document.createElement("div"); //$NON-NLS-0$
			fsToolbar.classList.add("fsToolbarLayout"); //$NON-NLS-0$
			fsToolbar.classList.add("fsToolbar"); //$NON-NLS-0$
			this._parentDiv.parentNode.insertBefore(fsToolbar, this._parentDiv);
		}
		// Create switcher here
		this.fsSwitcher = new mFilesystemSwitcher.FilesystemSwitcher({
			commandRegistry: this._commandService,
			rootChangeListener: this,
			filesystemChangeDispatcher: this,
			fileClient: this.fileClient,
			node: this.fsToolbar,
			serviceRegistry: this._serviceRegistry
		});
	}
	
	objects.mixin(AdvSearchOptRenderer.prototype, /** @lends orion.search.AdvSearchOptRenderer */ {
		destroy: function() {
			this.removeEventListener("filesystemChanged", this.fileSysChangeListener); //$NON-NLS-0$
			this.fileSysChangeListener = null;
			if (this._searchScopeExplorer) {
				this._searchScopeExplorer.destroy();
				this._searchScopeExplorer = null;
			}
		},
		
		getOptions: function(){
			var resource = ""; //$NON-NLS-0$
			this._searchLocations.forEach(function(searchLocation){
				if (resource) {
					resource = resource.concat(","); //$NON-NLS-0$
				}
				resource = resource.concat(searchLocation);
			}, this);

			return {keyword: this._searchBox.value,
					rows: 40,
					start: 0,
					replace:this._replaceBox.value ? this._replaceBox.value : undefined,
					caseSensitive: this._caseSensitiveCB.checked,
			        regEx: this._regExCB.checked,
			        fileType: this._fileTypes.options[this._fileTypes.selectedIndex].value,
			        resource: resource
			};
		},
		
		loadSearchParams: function(searchParams){
			this._searchParams = searchParams;
			//TODO handle resource parameter containing multiple resources once multiple file/folder search is enabled (see getOptions())
			this._rootURL = this.fileClient.fileServiceRootURL(this._searchParams.resource);
			
			var loadRootOnly = function() {
				this._searchLocations = [this._rootURL];
	        	if (this._searchScopeExplorer) {
	        		this._searchScopeExplorer.loadRoot(this._rootURL);
	        	}
			}.bind(this);
			
			this.dispatchEvent({type: "rootChanged", root: this._rootURL}); //$NON-NLS-0$
	        if ((this._searchParams.resource.length > 0) && (this._rootURL !== this._searchParams.resource)) {
	            this._serviceRegistry.getService("orion.page.progress").progress(this.fileClient.read(this._searchParams.resource, true), "Getting file metadata " + this._searchParams.resource).then( //$NON-NLS-1$ //$NON-NLS-0$
	            function(meta) {
					if (this._searchScopeSection) {
						this._searchLocations = [this._searchParams.resource];
						
						if (this._searchScopeExplorer) {
							this._searchScopeExplorer.loadRoot(this._rootURL).then(function(){
								this._searchScopeExplorer.reveal(meta);
							}.bind(this));	
						}
					}
	            }.bind(this),
	            loadRootOnly);
	        } else {
	        	loadRootOnly();
	        }

			this._loadSearchParams();
		},
	
		_loadSearchParams: function(){
			if(!this._init || !this._searchParams){
				return;
			}
			this._searchBox.value = this._searchParams.keyword ? this._searchParams.keyword : "";
			this._replaceBox.value = this._searchParams.replace ? this._searchParams.replace : "";
			this._caseSensitiveCB.checked = this._searchParams.caseSensitive;
			this._regExCB.checked = this._searchParams.regEx;
			var x;
			for (x = 0; x < this._fileTypes.options.length; x++) {
			    if(this._fileTypes.options[x].value === this._searchParams.fileType){
					this._fileTypes.selectedIndex = x;
					break;
			    }
			}
			
			if (undefined !== this._searchParams.replace) {
				this._showReplaceField();
			} else {
				this._hideReplaceField();
			}
		},
	
		render: function(){
			this._contentTypeService.getContentTypes().then(function(ct) {
				this.contentTypesCache = ct;
				this._render();
			}.bind(this));
		},
	
		_render: function(){
			this._parentDiv.innerHTML = optionTemplate;
			this._initHTMLLabels();
		    this._initControls();
			this._searchBox.focus();
			
		},
		
		_submitSearch: function(){
			var options = this.getOptions();
			options.replace = null;
			mSearchUtils.doSearch(this._searcher, this._serviceRegistry, options.keyword, options);
		},
		
		_replacePreview: function(){
			var options = this.getOptions();
			if(!options.replace){
				options.replace = "";
			}
			if(options.keyword){
				mSearchUtils.doSearch(this._searcher, this._serviceRegistry, options.keyword, options);
			}
		},

	    _initCompletion: function() {
			//Required. Reading recent&saved search from user preference. Once done call the uiCallback
			var defaultProposalProvider = function(uiCallback){
				mSearchUtils.getMixedSearches(this._serviceRegistry, false, false, function(searches){
					var i, fullSet = [], hasSavedSearch = false, hasRecentSearch = false;
					for (i in searches) {
						if(searches[i].label && searches[i].value){
							if(!hasSavedSearch){
								fullSet.push({type: "category", label: messages["Saved searches"]});//$NON-NLS-0$
								hasSavedSearch = true;
							}
							fullSet.push({type: "proposal", value: {name: searches[i].label, value: require.toUrl("search/search.html") + "#" + searches[i].value, type: "link"}});  //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							//fullSet.push({type: "proposal", label: searches[i].label, value: searches[i].name});//$NON-NLS-0$
						} else {
							if(!hasRecentSearch){
								fullSet.push({type: "category", label: messages["Recent searches"]});//$NON-NLS-0$
								hasRecentSearch = true;
							}
							fullSet.push({type: "proposal", label: searches[i].name, value: searches[i].name});//$NON-NLS-0$
						}
					}
					uiCallback(fullSet);
				});
			}.bind(this);
			//Optional. Reading extended search proposals by asking plugins, if any.
			//If there are multiple plugins then merge all the proposals and call uiCallBack.
			//Plugins(with service id "orion.search.proposal") should define the property "filterForMe" to true or false. Which means:
			//If true the inputCompletion class will filter the proposals returned by the plugin.
			//If false the inputCompletion class assumes that the proposals are already filtered by hte given kerword. 
			//The false case happens when a plugin wants to use the keyword to ask for a set of filtered proposal from a web service by the keyword and Orion does not need to filter it again.
			var exendedProposalProvider = function(keyWord, uiCallback){
				var serviceReferences = this._serviceRegistry.getServiceReferences("orion.search.proposal"); //$NON-NLS-0$
				if(!serviceReferences || serviceReferences.length === 0){
					uiCallback(null);
					return;
				}
	            var promises = [];
	            var renderer = this;
				serviceReferences.forEach(function(serviceRef) {
					var filterForMe = serviceRef.getProperty("filterForMe");  //$NON-NLS-0$
					promises.push( this._serviceRegistry.getService(serviceRef).run(keyWord).then(function(returnValue) {
						//The return value has to be an array of {category : string, datalist: [string,string,string...]}
						var proposalList = {filterForMe: filterForMe, proposals: []};
						for (var i = 0; i < returnValue.length; i++) {
							proposalList.proposals.push({type: "category", label: returnValue[i].category});//$NON-NLS-0$
							for (var j = 0; j < returnValue[i].datalist.length; j++) {
								proposalList.proposals.push({type: "proposal", label: returnValue[i].datalist[j], value: returnValue[i].datalist[j]});//$NON-NLS-0$
							}
						}
						return proposalList;
					}));
				}.bind(renderer));
				Deferred.all(promises).then(function(returnValues) {
					//Render UI
					uiCallback(returnValues);
				});
			}.bind(this);
			//Create and hook up the inputCompletion instance with the search box dom node.
			//The defaultProposalProvider provides proposals from the recent and saved searches.
			//The exendedProposalProvider provides proposals from plugins.
			this._completion = new mInputCompletion.InputCompletion(this._searchBox, defaultProposalProvider, {serviceRegistry: this._serviceRegistry, group: "globalSearch", extendedProvider: exendedProposalProvider, //$NON-NLS-0$
				onDelete: function(item, evtTarget) {
					mSearchUtils.removeRecentSearch(this._serviceRegistry, item, evtTarget);
				}.bind(this),
				deleteToolTips: messages['Click or use delete key to delete the search term']
			});
			
			var previousSearchButton = lib.node("previousSearchButton");
			previousSearchButton.addEventListener("click", function(event){
				this._searchBox.focus();
				this._completion._proposeOn();
				lib.stop(event);
			}.bind(this));
	    },
	    
		_initControls: function(){
			this._searchBox = document.getElementById("advSearchInput"); //$NON-NLS-0$
			this._searchButtonWrapper = document.getElementById("advSearchCmd"); //$NON-NLS-0$
			this._replaceBox = document.getElementById("advReplaceInput"); //$NON-NLS-0$
			this._fileTypes = document.getElementById("advSearchTypes"); //$NON-NLS-0$
			this._caseSensitiveCB = document.getElementById("advSearchCaseSensitive"); //$NON-NLS-0$
			this._regExCB = document.getElementById("advSearchRegEx"); //$NON-NLS-0$
			this._toggleReplaceLink = document.getElementById("toggleReplaceLink");
			this._replaceWrapper = document.getElementById("replaceInputFieldWrapper");
			//Load file types content type provider
			var fTypes = [ {label: messages["All types"], value: mSearchUtils.ALL_FILE_TYPE} ];
			for(var i = 0; i < this.contentTypesCache.length; i++){
				if(this.contentTypesCache[i]['extends'] === "text/plain" || this.contentTypesCache[i].id === "text/plain"){ //$NON-NLS-2$  //$NON-NLS-1$ //$NON-NLS-0$
					for(var j = 0; j < this.contentTypesCache[i].extension.length; j++){
						fTypes.push({label: this.contentTypesCache[i].extension[j], value: this.contentTypesCache[i].extension[j]});
					}
				}
			}
			fTypes.forEach(function(fType) {
			    var option = document.createElement('option'); //$NON-NLS-0$
			    var text = document.createTextNode(fType.label);
			    option.appendChild(text);
			    this._fileTypes.appendChild(option);
			    option.value = fType.value;
			}.bind(this));

			this._init = true;
			this._loadSearchParams();
			this._initCompletion();
			//Add listeners
			this._searchBox.addEventListener("keydown", function(e) { //$NON-NLS-0$
				if(e.defaultPrevented){// If the key event was handled by other listeners and preventDefault was set on(e.g. input completion handled ENTER), we do not handle it here
					return;
				}
				var keyCode= e.charCode || e.keyCode;
				if (keyCode === 13 ) {// ENTER
					this._submitSearch();
				} 
			}.bind(this));
			
			this._replaceBox.addEventListener("keydown", function(e) { //$NON-NLS-0$
				var keyCode= e.charCode || e.keyCode;
				if (keyCode === 13 ) {// ENTER
					this._replacePreview();
				} 
			}.bind(this));
			
			this._fileTypes.addEventListener("change", function(e) { //$NON-NLS-0$
				var type = this._fileTypes.options[this._fileTypes.selectedIndex].value;
				if(type === mSearchUtils.ALL_FILE_TYPE){
					this._searchBox.placeholder = messages["Type a search term"];
				} else {
					this._searchBox.placeholder =i18nUtil.formatMessage(messages["All ${0} files"], type);
				}
			}.bind(this));
			
	        var searchCommand = new mCommands.Command({
	            name: messages["Search"],
	            //tooltip: messages["Hide compare view of changes"],
	            id: "orion.globalSearch.search", //$NON-NLS-0$
	            callback: function(data) {
	                this._submitSearch();
	            }.bind(this),
	            visibleWhen: function(item) {
	                return true;
	            }
	        });
	
	        var replaceCommand = new mCommands.Command({
	            name: messages['Replace...'],
	            id: "orion.globalSearch.replace", //$NON-NLS-0$
	            callback: function(data) {
	                this._replacePreview();
	            }.bind(this),
	            visibleWhen: function(item) {
	                return true;
	            }
	        });
			
			/*
			//Init the "More..." option section
			var tableNode = lib.node('moreOptions'); //$NON-NLS-0$
			var moreOptionsSection = new mSection.Section(tableNode, {
				id : "moreOptionsSection", //$NON-NLS-0$
				title : "More...", //$NON-NLS-0$
				content : moreOptionTemplate,
				canHide : true,
				useAuxStyle: true,
				hidden: true,
				onExpandCollapse : function(isExpanded, section) {
				}
			});
			*/
			this._commandService.addCommand(searchCommand);	
			this._commandService.addCommand(replaceCommand);	
	        this._commandService.registerCommandContribution("advSearchCmd", "orion.globalSearch.search", 1);//$NON-NLS-1$ //$NON-NLS-0$
	        var domWrapperList = [];
	        this._commandService.renderCommands("advSearchCmd", "advSearchCmd", this, this, "button", null, domWrapperList); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	        domWrapperList[0].domNode.classList.add("search-button"); //$NON-NLS-0$
	        domWrapperList[0].domNode.classList.remove("commandMargins"); //$NON-NLS-0$
	        this._commandService.registerCommandContribution("advReplacePreviewCmd", "orion.globalSearch.replace", 1);//$NON-NLS-1$ //$NON-NLS-0$
			domWrapperList = [];
	        this._commandService.renderCommands("advReplacePreviewCmd", "advReplacePreviewCmd", this, this, "button", null, domWrapperList); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	        domWrapperList[0].domNode.classList.add("search-button"); //$NON-NLS-0$
	        domWrapperList[0].domNode.classList.remove("commandMargins"); //$NON-NLS-0$
	        
	        if ("none" === this._replaceWrapper.style.display) {
	        	this._toggleReplaceLink.innerHTML = messages["Show Replace"]; //$NON-NLS-0$	
	        }
	        this._toggleReplaceLink.addEventListener("click", this._toggleReplaceFieldVisibility.bind(this)); //$NON-NLS-1$ //$NON-NLS-0$
	        
	        this._initSearchScope();
		},
		
		_initHTMLLabels: function(){
			document.getElementById("advSearchInput").placeholder = messages["Type a search term"]; //$NON-NLS-0$ //$NON-NLS-0$
			document.getElementById("advReplaceInput").placeholder = messages["Replace With"]; //$NON-NLS-0$ //$NON-NLS-0$
			document.getElementById("advSearchTypeLabel").appendChild(document.createTextNode(messages["File type"])); //$NON-NLS-0$ //$NON-NLS-0$
			document.getElementById("advSearchCaseSensitiveLabel").appendChild(document.createTextNode(messages["Case sensitive"])); //$NON-NLS-0$ //$NON-NLS-0$
			document.getElementById("advSearchRegExLabel").appendChild(document.createTextNode(messages["Regular expression"])); //$NON-NLS-0$ //$NON-NLS-0$
			document.getElementById("previousSearchButton").title = messages["Show previous search terms"]; //$NON-NLS-0$ //$NON-NLS-0$
			document.getElementById("advReplacePreviewCmd").title = messages["Show replacement preview"]; //$NON-NLS-0$ //$NON-NLS-0$
		},
		
		_initSearchScope: function() {
			this._searchLocations = [];
			var resource = mPageUtil.matchResourceParameters().resource;
			this._rootURL = this.fileClient.fileServiceRootURL(resource);
			
			if (resource) {
				this._searchLocations.push(resource);
			} else {
				this._searchLocations.push(this._rootURL);
			}
			
			this._searchScopeDiv = lib.$("#searchScope", this._parentDiv); //$NON-NLS-0$
			
			this._searchScopeSection = new mSection.Section(this._searchScopeDiv, {
				id: "searchScopeSection", //$NON-NLS-0$
				title: messages["Scope"] + ": ", //$NON-NLS-0$
				canHide: true,
				hidden: true
			});
			this._setSearchScopeTitle();
		
			var scopeExplorerNode = document.createElement("div"); //$NON-NLS-0$
			scopeExplorerNode.id = "searchScopeExplorerNode"; //$NON-NLS-0$
			
			var selectionModel = new mSelection.Selection(this._serviceRegistry, "searchScopeSelection"); //$NON-NLS-0$
			this._selectionListener = (function(event) { //$NON-NLS-0$
				this._searchLocations = [];
				var selections = event.selections;

				if (selections) {
					selections.forEach(function(selection){
						this._searchLocations.push(selection.Location);
					}, this);
				} else {
					this._searchLocations.push(this._rootURL);
				}
				
				if (this._searchLocations) {
					this._searcher.setLocationbyURL(this._searchLocations.join(","));
				}
				
				this._setSearchScopeTitle();		
			}).bind(this);
			selectionModel.addEventListener("selectionChanged", this._selectionListener); //$NON-NLS-0$
			
			this._searchScopeExplorer = new ScopeExplorer({
				parentId: scopeExplorerNode,
				serviceRegistry: this._serviceRegistry,
				fileClient: this.fileClient,
				commandRegistry: this._commandService,
				contentTypeRegistry: this._contentTypeService,
				selection: selectionModel,
				advSearchOptRenderer: this
			});
			
			this._searchScopeSection.embedExplorer(this._searchScopeExplorer, scopeExplorerNode);	
			this._searchScopeExplorer.setCommandsVisible(true, "singleSelection"); //$NON-NLS-0$ //TODO remove "singleSelection" once multiple selection is supported
			this._searchScopeExplorer.loadRoot(this._rootURL);
		},
		
		_toggleReplaceFieldVisibility: function () {
			if ("none" === this._replaceWrapper.style.display) {
				this._showReplaceField();
			} else {
				this._hideReplaceField();
			}
		},
		
		_showReplaceField: function() {
			this._searchButtonWrapper.style.display = "none"; //$NON-NLS-0$
			this._replaceWrapper.style.display = "inline-block"; //$NON-NLS-0$
			this._toggleReplaceLink.innerHTML = messages["Hide Replace"]; //$NON-NLS-0$
		},
		
		_hideReplaceField: function() {
			this._searchButtonWrapper.style.display = "inline-block"; //$NON-NLS-0$
			this._replaceWrapper.style.display = "none"; //$NON-NLS-0$
			this._toggleReplaceLink.innerHTML = messages["Show Replace"]; //$NON-NLS-0$
		},
		
		_setSearchScopeTitle: function() {
			var titleElement = this._searchScopeSection.getTitleElement();
			lib.empty(titleElement);
			titleElement.appendChild(document.createTextNode(messages["Scope"] + ": ")); //$NON-NLS-0$
			
			this._searchLocations.forEach(function(searchLocation){
				var decodedLocation = decodeURI(searchLocation);
				var scopeString = decodedLocation;
				var rootName = this.fileClient.fileServiceRootURL(scopeString);
				if (rootName === searchLocation) {
					//replace location string with "root"
					scopeString = messages["root"]; //$NON-NLS-0$
				} else {
					//set scopeString to resource name
					var segments = scopeString.split("/");
					if (segments) {
						scopeString = segments.pop();
						if (!scopeString) {
							// scopeString ended with '/', last element in array returned by 
							// split() was empty, pop again to get the name
							scopeString = segments.pop();
						}
					}
				}
												
				var locationElement = document.createElement("span"); //$NON-NLS-0$
				locationElement.classList.add("searchScopeElement"); //$NON-NLS-0$
				locationElement.dataset.locationString = searchLocation;
				locationElement.title = decodedLocation;
				
				if (scopeString !== messages["root"]) {
					var locationText = document.createElement("span"); //$NON-NLS-0$
					locationText.classList.add("searchScopePreButtonText"); //$NON-NLS-0$
					locationText.appendChild(document.createTextNode(scopeString));
					locationElement.appendChild(locationText);
					this._insertDeleteButton(locationElement);
				} else {
					locationElement.appendChild(document.createTextNode(scopeString));
				}
				
				titleElement.appendChild(locationElement);	
			}, this);
		},
		
		_insertDeleteButton: function(locationElement) {
			var deleteButton = document.createElement("button"); //$NON-NLS-0$
			deleteButton.classList.add("imageSprite"); //$NON-NLS-0$
			deleteButton.classList.add("core-sprite-delete"); //$NON-NLS-0$
			deleteButton.classList.add("scopeDeleteButton"); //$NON-NLS-0$
			locationElement.appendChild(deleteButton);
			
			var deleteButtonHandler = (function(){
				var locationString = locationElement.dataset.locationString;
				var index = this._searchLocations.indexOf(locationString);
				this._searchLocations.splice(index, 1); //remove element from _searchLocations array
				if (0 === this._searchLocations.length) {
					this._searchLocations.push(this.fileClient.fileServiceRootURL());
				}
				
				//find model in explorer
				var explorer = this._searchScopeExplorer;
				var navHandler = explorer.getNavHandler();
				if ("singleSelection" === navHandler.getSelectionPolicy()) {
					explorer.selection.setSelections(null);
					navHandler.refreshSelection(true, true);
				} else {
					var selections = explorer.selection.getSelections();
					var model = null;
					selections.some(function(selection){
						if (selection.Location === locationString){
							model = selection;
							return true; //found it, stop iterating
						}
						return false;
					});
					
					if (model) {
						//deselect model
						navHandler.setSelection(model, true, false);	
					}
				}
				this._setSearchScopeTitle();
			}).bind(this);
			
			deleteButton.addEventListener("click", deleteButtonHandler);
		}
	});
	
	/**
	 * AdvSearchOptContainer is the container for all search options.
	 * @param {String|DOMElement} parent the parent element for the container, it can be either a DOM element or an ID for a DOM element.
	 */
	function AdvSearchOptContainer(parent, searcher, serviceRegistry, commandService) {
		this._parent = lib.node(parent);
		this._optRenderer = new AdvSearchOptRenderer(this._parent, searcher, serviceRegistry, commandService);
		this._optRenderer.render();	
	}
	
	AdvSearchOptContainer.prototype.getRenderer = function(){
		return this._optRenderer;
	};
	
	AdvSearchOptContainer.prototype.constructor = AdvSearchOptContainer;
	
	
	var FileExplorer = mExplorerTable.FileExplorer;
	var NavigatorRenderer = mNavigatorRenderer.NavigatorRenderer;
	var ExplorerNavHandler = mExplorerNavHandler.ExplorerNavHandler;
	
	function ScopeExplorer(options) {
		options.setFocus = false;   // do not steal focus on load
		options.cachePrefix = null; // do not persist table state
		options.excludeFiles = true; // do not show files
		
		options.rendererFactory = function(explorer) {
			var renderer = new NavigatorRenderer({
				checkbox: false,
				showFolderImage: true,
				treeTableClass: "sectionTreeTable" //$NON-NLS-0$
			}, explorer, options.commandRegistry, options.contentTypeRegistry);
			renderer.oneColumn = true; //don't show modification date and size
			renderer.showFolderLinks = false; //show folder names but don't render links for them
			return renderer;
		};
		
		options.navHandlerFactory = {createNavHandler: function(explorer, explorerNavDict, options) {
			options.setFocus = false;
			options.gridClickSelectionPolicy = "active"; //clicking on children causes row to be selected
			return new ScopeNavHandler(explorer, explorerNavDict, options);
		}};
		
		FileExplorer.apply(this, arguments);
		this.treeRoot = {};
	}
	ScopeExplorer.prototype = Object.create(FileExplorer.prototype);
	objects.mixin(ScopeExplorer.prototype, /** @lends orion.ScopeExplorer.prototype */ {
		loadRoot: function(root) {
			var path = root || this.fileClient.fileServiceRootURL();
			return this.loadResourceList(path);
		}
	});
	ScopeExplorer.prototype.constructor = ScopeExplorer;
	
	function ScopeNavHandler(explorer, explorerNavDict, options) {
		ExplorerNavHandler.apply(this, arguments);
	}
	ScopeNavHandler.prototype = Object.create(ExplorerNavHandler.prototype);
	objects.mixin(ScopeNavHandler.prototype, /** @lends orion.ScopeNavHandler.prototype */ {
		//overrides ExplorerNavHandler.onClick
		onClick: function(model, mouseEvt) {
			ExplorerNavHandler.prototype.onClick.call(this, model, mouseEvt);
			
			var twistieSpan = lib.node(this.explorer.renderer.expandCollapseImageId(this.model.getId(model)));
			if(mouseEvt.target !== twistieSpan){ //don't do anything if twistie was clicked
				//toggle the model's expand/collapse state
				if (this.isExpandable(model)){
					if (!this.isExpanded(model)){
						this.explorer.myTree.expand(model);
					} else {
						this.explorer.myTree.collapse(model);
					}
				}
			}
		}
	});
	ScopeNavHandler.prototype.constructor = ScopeNavHandler;
	
	
	//return module exports
	return {
		AdvSearchOptContainer: AdvSearchOptContainer,
		AdvSearchOptRenderer: AdvSearchOptRenderer
	};
});
