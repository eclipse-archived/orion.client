/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/

/*eslint-env browser, amd*/
define(['orion/objects', 'orion/commands', 'orion/outliner', 'orion/webui/littlelib',
		'orion/widgets/nav/mini-nav',
		'orion/widgets/nav/project-nav',
		'orion/globalCommands',
		'i18n!orion/edit/nls/messages',
		'orion/search/InlineSearchPane',
		'orion/keyBinding',
		'orion/problems/problemsView',
		'orion/webui/Slideout'],
		function(objects, mCommands, mOutliner, lib, MiniNavViewMode, ProjectNavViewMode, mGlobalCommands, messages, InlineSearchPane, mKeyBinding, mProblemsView, mSlideout) {

	/**
	 * @name orion.sidebar.Sidebar
	 * @class Sidebar that appears alongside an {@link orion.editor.Editor} in the Orion IDE.
	 * @param {Object} params
	 * @param {orion.commandregistry.CommandRegistry} params.commandRegistry
	 * @param {orion.preferences.PreferencesService} params.preferences
	 * @param {orion.core.ContentTypeRegistry} params.contentTypeRegistry
	 * @param {orion.fileClient.FileClient} params.fileClient
	 * @param {orion.editor.InputManager} params.editorInputManager
	 * @param {orion.outliner.OutlineService} params.outlineService
	 * @param {orion.progress.ProgressService} params.progressService
	 * @param {orion.serviceregistry.ServiceRegistry} params.serviceRegistry
	 * @param {Object} [params.sidebarNavInputManager]
	 * @param {Element|String} params.parent
	 * @param {Element|String} params.toolbar
	 * @param {Element|String} params.switcherScope
	 * @param {Element|String} params.editScope
	 */
	function Sidebar(params) {
		this.params = params;
		this.preferences = params.preferences;
		this.commandRegistry = params.commandRegistry;
		this.contentTypeRegistry = params.contentTypeRegistry;
		this.fileClient = params.fileClient;
		this.editorInputManager = params.editorInputManager;
		this.outlineService = params.outlineService;
		this.parentNode = lib.node(params.parent);
		this.toolbarNode = lib.node(params.toolbar);
		this.serviceRegistry = params.serviceRegistry;
		this.sidebarNavInputManager = params.sidebarNavInputManager;
		this.menuBar = params.menuBar;
		this.viewModes = {};
		this.activeViewMode = null;
		this.switcherScope = params.switcherScope;
		this.editScope = params.editScope;
		this.switcherNode = null;
		this.progressService = params.progressService;
	}
	objects.mixin(Sidebar.prototype, /** @lends orion.sidebar.Sidebar.prototype */ {
		create: function() {
			if (this.created) {
				return;
			}
			this.created = true;
			this._createViewModeMenu();
			this._createNavigationViewMode();
			this._createProjectViewMode();
			this._createSlideout();
			this._createOutliner();
			this._createInlineSearchPane();
			this._createProblemsPane();
		},
		showToolbar: function() {
			this.toolbarNode.style.display = "block"; //$NON-NLS-0$
			this.parentNode.classList.remove("toolbarTarget-toolbarHidden"); //$NON-NLS-0$
		},
		hideToolbar: function() {
			this.toolbarNode.style.display = "none"; //$NON-NLS-0$
			this.parentNode.classList.add("toolbarTarget-toolbarHidden"); //$NON-NLS-0$
		},
		/** @private */
		viewModeMenuCallback: function() {
			var _self = this;
			var active = this.getActiveViewModeId();
			return Object.keys(this.viewModes).map(function(modeId) {
				var mode = _self.getViewMode(modeId);
				return {
					checked: modeId === active,
					name: mode.label || modeId,
					callback: _self.setViewMode.bind(_self, modeId)
				};
			});
		},
		getActiveViewModeId: function() {
			return this.activeViewModeId;
		},
		/**
		 * @param {String} id
		 * @param {orion.sidebar.ViewMode} mode
		 */
		addViewMode: function(id, mode) {
			if (!id) {
				throw new Error("Invalid id: " + id); //$NON-NLS-0$
			}
			if (!mode || typeof mode !== "object") { //$NON-NLS-0$
				throw new Error("Invalid mode: "  + mode); //$NON-NLS-0$
			}
			if (!Object.prototype.hasOwnProperty.call(this.viewModes, id)) {
				this.viewModes[id] = mode;
			}
		},
		/**
		 * @param {String} id
		 */
		removeViewMode: function(id) {
			var mode = this.getViewMode(id);
			if (mode && typeof mode.destroy === "function") { //$NON-NLS-0$
				mode.destroy();
			}
			delete this.viewModes[id];
			if (this.getActiveViewModeId() === id) {
				this.activeViewModeId = null;
			}
		},
		/**
		 * @param {String} id
		 */
		getViewMode: function(id) {
			if (Object.prototype.hasOwnProperty.call(this.viewModes, id)) {
				return this.viewModes[id];
			}
			return null;
		},
		/**
		 * @param {String} id
		 */
		setViewMode: function(id) {
			var mode = this.activeViewMode;
			if (mode && typeof mode.destroy === "function") { //$NON-NLS-0$
				mode.destroy();
			}
			// clean out any toolbar contributions
			if (this.toolbarNode) {
				this.commandRegistry.destroy(this.toolbarNode);
			}
			lib.empty(this.parentNode);
			mode = this.activeViewMode = this.getViewMode(id);
			this.activeViewModeId = mode ? id : null;
			if (mode && typeof mode.create === "function") { //$NON-NLS-0$
				mode.create();
			}
		},
		renderViewModeMenu: function() {
			var switcher = this.switcherNode;
			this.commandRegistry.destroy(switcher);
			this.commandRegistry.renderCommands(switcher.id, switcher, null, this, "button"); //$NON-NLS-0$
		},
		
		getInlineSearchPane: function() {
			return this._inlineSearchPane;
		},

		getNavigationViewMode: function() {
			return this._navigationViewMode;
		},

		getProjectViewMode: function() {
			return this._projectViewMode;
		},

		getOutliner: function() {
			return this.outliner;
		},
		
		_createViewModeMenu: function() {
			this.switcherNode = lib.node(this.switcherScope);
			var changeViewModeCommand = new mCommands.Command({
				name: messages["SidePanel"],
				imageClass: "core-sprite-outline", //$NON-NLS-0$
				selectionClass: "dropdownSelection", //$NON-NLS-0$
				tooltip: messages["SidePanelTooltip"],
				id: "orion.sidebar.viewmode", //$NON-NLS-0$
				visibleWhen: function() {
					var mainSplitter = mGlobalCommands.getMainSplitter();
					if (mainSplitter) {
						return !mainSplitter.splitter.isClosed();
					}
					return true;
				},
				choiceCallback: this.viewModeMenuCallback.bind(this)
			});
			this.commandRegistry.addCommand(changeViewModeCommand);
			this.commandRegistry.registerCommandContribution(this.switcherNode.id, "orion.sidebar.viewmode", 2, "orion.menuBarViewGroup"); //$NON-NLS-1$ //$NON-NLS-0$
		},
		_createNavigationViewMode: function() {
			this._navigationViewMode = new MiniNavViewMode({
				commandRegistry: this.commandRegistry,
				contentTypeRegistry: this.contentTypeRegistry,
				preferences: this.preferences,
				fileClient: this.fileClient,
				editorInputManager: this.editorInputManager,
				parentNode: this.parentNode,
				sidebarNavInputManager: this.sidebarNavInputManager,
				serviceRegistry: this.serviceRegistry,
				toolbarNode: this.toolbarNode,
				sidebar: this,
				progressService: this.progressService
			});
		},
		_createProjectViewMode: function() {
			this.projectViewMode = new ProjectNavViewMode({
				commandRegistry: this.commandRegistry,
				contentTypeRegistry: this.contentTypeRegistry,
				preferences: this.preferences,
				fileClient: this.fileClient,
				editorInputManager: this.editorInputManager,
				parentNode: this.parentNode,
				sidebarNavInputManager: this.sidebarNavInputManager,
				serviceRegistry: this.serviceRegistry,
				toolbarNode: this.toolbarNode,
				sidebar: this,
				progressService: this.progressService
			});
		},
		_createOutliner: function() {
			// Outliner is responsible for adding its view mode(s) to this sidebar
			this.outliner = new mOutliner.Outliner(this._slideout,
			{
				toolbar: this.toolbarNode,
				serviceRegistry: this.serviceRegistry,
				contentTypeRegistry: this.contentTypeRegistry,
				preferences: this.preferences,
				outlineService: this.outlineService,
				commandService: this.commandRegistry,
				inputManager: this.editorInputManager,
				progressService: this.progressService,
				sidebar: this,
				switcherNode: this.switcherNode
			});
		},
		_createSlideout: function() {
			this._slideout = new mSlideout.Slideout(this.toolbarNode.parentNode);
			
			// add Slideout menu group to View menu
			this.commandRegistry.addCommandGroup(this.switcherNode.id, 
				"orion.slideoutMenuGroup", //$NON-NLS-0$
				3, 
				messages["Slideout"], //$NON-NLS-0$
				"orion.menuBarViewGroup", //$NON-NLS-0$
				null, 
				null, 
				null, 
				"dropdownSelection"); //$NON-NLS-0$
		},
		_createProblemsPane: function() {
			this._problemsPane = new mProblemsView.ProblemsView({serviceRegistry: this.serviceRegistry, 
				commandRegistry: this.commandRegistry, 
				contentTypeRegistry: this.contentTypeRegistry, 
				preferences: this.preferences,
				fileClient: this.fileClient}, this._slideout);
			var problemsInFolderCommand = new mCommands.Command({
				name: messages["showProblems"], //$NON-NLS-0$
				id: "orion.problemsInFolder", //$NON-NLS-0$
				visibleWhen: function(item) {
					if (Array.isArray(item)) {
						if(item.length === 1 && item[0].Directory){
							return true;
						}
					}
					return false;
				},
				callback: function (data) {
					var item = data.items[0];
					this._problemsPane.show();
					//var problemsView = new mProblemsView.ProblemsView({serviceRegistry: this.serviceRegistry, commandRegistry: this.commandRegistry, contentTypeRegistry: this.contentTypeRegistry, fileClient: this.fileClient});
					this._problemsPane.validate(item.Location);
				}.bind(this)
			});
			
			this.commandRegistry.addCommand(problemsInFolderCommand);
			this.commandRegistry.registerCommandContribution(this.editScope, "orion.problemsInFolder", 101, "orion.menuBarEditGroup/orion.findGroup");  //$NON-NLS-1$ //$NON-NLS-0$
 		},
		_createInlineSearchPane: function() {
			this._inlineSearchPane = new InlineSearchPane(this._slideout,
			{
				serviceRegistry: this.serviceRegistry,
				commandRegistry: this.commandRegistry,
				fileClient: this.fileClient,
				preferences: this.preferences
			});
			
			this._lastSearchRoot = null;
			// set the scope to the explorer's root
			this.sidebarNavInputManager.addEventListener("rootChanged", function(event){ //$NON-NLS-0$
				this._lastSearchRoot = event.root;
			}.bind(this));
			
			this.toolbarNode.parentNode.addEventListener("scroll", function(){ //$NON-NLS-0$
				if (this._inlineSearchPane.isVisible()) {
					this.toolbarNode.parentNode.scrollTop = 0;
				}
			}.bind(this));
			
			var searchInFolderCommand = new mCommands.Command({
				name: messages["searchInFolder"], //$NON-NLS-0$
				id: "orion.searchInFolder", //$NON-NLS-0$
				visibleWhen: function(item) {
					if (Array.isArray(item)) {
						if(item.length === 1 && item[0].Directory){
							return true;
						}
					}
					return false;
				},
				callback: function (data) {
					var item = data.items[0];
					this._inlineSearchPane.setSearchScope(item);
					this._inlineSearchPane.show();
					this._inlineSearchPane.showSearchOptions();	
				}.bind(this)
			});
			
			var openSearchCommand = new mCommands.Command({
				name: messages["Global Search"], //$NON-NLS-0$
				id: "orion.openInlineSearchPane", //$NON-NLS-0$
				visibleWhen: function() {
					return true;
				},
				callback: function () {
					if (this._inlineSearchPane.isVisible()) {
						this._inlineSearchPane.hide();
					} else {
						var mainSplitter = mGlobalCommands.getMainSplitter();
						if (mainSplitter.splitter.isClosed()) {
							mainSplitter.splitter.toggleSidePanel();
						}
						this._inlineSearchPane.setSearchScope(this._lastSearchRoot); //reset search scope
						this._inlineSearchPane.show();
						this._inlineSearchPane.showSearchOptions();	
					}
				}.bind(this)
			});
			
			this.commandRegistry.addCommand(searchInFolderCommand);
			this.commandRegistry.addCommand(openSearchCommand);
			
			this.commandRegistry.registerCommandContribution(this.editScope, "orion.searchInFolder", 99, "orion.menuBarEditGroup/orion.findGroup");  //$NON-NLS-1$ //$NON-NLS-0$
			this.commandRegistry.registerCommandContribution(this.editScope, "orion.openInlineSearchPane", 100, "orion.menuBarEditGroup/orion.findGroup", false, new mKeyBinding.KeyBinding('h', true, true)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
 		}
	});

	/**
	 * @name orion.sidebar.ViewMode
	 * @class Interface for a view mode that can provide content to a {@link orion.sidebar.Sidebar}.
	 */
	/**
	 * @name orion.sidebar.ViewMode#create
	 * @function
	 */
	/**
	 * @name orion.sidebar.ViewMode#destroy
	 * @function
	 */
	/**
	 * @name orion.sidebar.ViewMode#label
	 * @type String
	 */
	return Sidebar;
});
