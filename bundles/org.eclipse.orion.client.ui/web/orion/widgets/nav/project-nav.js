/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define*/
/*jslint browser:true devel:true sub:true*/
define(['require', 'i18n!orion/edit/nls/messages', 'orion/objects', 'orion/webui/littlelib', 'orion/explorers/explorer-table',
	'orion/explorers/navigatorRenderer', 'orion/explorers/explorerNavHandler', 'orion/i18nUtil', 'orion/keyBinding', 'orion/fileCommands', 'orion/projectCommands',
	'orion/extensionCommands', 'orion/selection', 'orion/EventTarget', 'orion/URITemplate', 'orion/PageUtil', 'orion/section'
	],
	function(require, messages, objects, lib, mExplorer, mNavigatorRenderer, mExplorerNavHandler, i18nUtil, mKeyBinding, FileCommands, ProjectCommands,
		ExtensionCommands, Selection, EventTarget, URITemplate, PageUtil, mSection) {
	var FileExplorer = mExplorer.FileExplorer;
	var KeyBinding = mKeyBinding.KeyBinding;
	var NavigatorRenderer = mNavigatorRenderer.NavigatorRenderer;

	/**
	 * @class orion.sidebar.ProjectNavExplorer
	 * @extends orion.explorers.FileExplorer
	 */
	function FilesNavExplorer(params) {
		params.setFocus = false;   // do not steal focus on load
		params.cachePrefix = null; // do not persist table state
		FileExplorer.apply(this, arguments);
		this.commandRegistry = params.commandRegistry;
		this.editorInputManager = params.editorInputManager;
		this.progressService = params.progressService;
		var sidebarNavInputManager = this.sidebarNavInputManager = params.sidebarNavInputManager;
		this.toolbarNode = params.toolbarNode;

		this.newActionsScope = params.newActionsScope; //$NON-NLS-0$
		this.selectionActionsScope = params.selectionActionsScope; //$NON-NLS-0$

		this.followEditor = true;
		var initialRoot = { };
		this.treeRoot = initialRoot; // Needed by FileExplorer.prototype.loadResourceList
		var _self = this;

		// Listen to model changes from fileCommands
		var dispatcher = this.modelEventDispatcher;
		var onChange = this.onFileModelChange.bind(this);
		["move", "delete"].forEach(function(type) { //$NON-NLS-1$ //$NON-NLS-0$
			dispatcher.addEventListener(type, onChange);
		});
		this.selection = new Selection.Selection(this.registry, "projectNavFileSelection"); //$NON-NLS-0$
		this.selection.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
			_self.updateCommands(event.selections);
		});
		this.commandsRegistered = this.registerCommands();
	}
	FilesNavExplorer.prototype = Object.create(FileExplorer.prototype);
	objects.mixin(FilesNavExplorer.prototype, /** @lends orion.sidebar.FilesNavExplorer.prototype */ {
		onFileModelChange: function(event) {
			var oldValue = event.oldValue, newValue = event.newValue;
			// Detect if we moved/renamed/deleted the current file being edited, or an ancestor thereof.
			var editorFile = this.editorInputManager.getFileMetadata();
			if (!editorFile) {
				return;
			}
			var affectedAncestor;
			[editorFile].concat(editorFile.Parents || []).some(function(ancestor) {
				if (oldValue.Location === ancestor.Location) {
					affectedAncestor = oldValue;
					return true;
				}
				return false;
			});
			if (affectedAncestor) {
				var newInput;
				if (affectedAncestor.Location === editorFile.Location) {
					// Current file was the target, see if we know its new name
					newInput = (newValue && newValue.Location) || null;
				} else {
					newInput = null;
				}
			}
		},
		destroy: function() {
		},
		/**
		 * Loads the parent directory of the given file as the root, then reveals the file.
		 * @param {Object} fileMetadata The file whose parent directory we want to load.
		 */
		loadParentOf: function(fileMetadata) {
			if (fileMetadata) {
				var parent = fileMetadata.Parents && fileMetadata.Parents[0];
				if (parent) {
					if (this.treeRoot && this.treeRoot.ChildrenLocation === parent.ChildrenLocation) {
						// Do we still need to handle this case?
						this.reveal(fileMetadata);
						return;
					}
				} else {
					parent = this.fileClient.fileServiceRootURL(fileMetadata.Location); //$NON-NLS-0$
				}
				return this.loadRoot(parent).then(this.reveal.bind(this, fileMetadata));
			}
		},
		/**
		 * Loads the given children location as the root.
		 * @param {String|Object} The childrenLocation or an object with a ChildrenLocation field.
		 */
		loadRoot: function(childrenLocation, force) {
			childrenLocation = (childrenLocation && childrenLocation.ChildrenLocation) || childrenLocation || ""; //$NON-NLS-0$
			var _self = this;
			return this.commandsRegistered.then(function() {
				return _self.loadResourceList.call(_self, childrenLocation, force);
			});
		},
		reveal: function(fileMetadata) {
			if (!fileMetadata) {
				return;
			}
			var navHandler = this.getNavHandler();
			if (navHandler) {
				if(fileMetadata.Location === this.treeRoot.Location && fileMetadata.Children && fileMetadata.Children.length){
					navHandler.cursorOn(fileMetadata.Children[0], true, false, false);
					navHandler.setSelection(fileMetadata.Children[0]);
				} else {
					navHandler.cursorOn(fileMetadata, true, false, false);
					navHandler.setSelection(fileMetadata);
				}
			}
		},
		// Returns a deferred that completes once file command extensions have been processed
		registerCommands: function() {
			// Selection based command contributions in sidebar project-nav
			var commandRegistry = this.commandRegistry, fileClient = this.fileClient, serviceRegistry = this.registry;
			var newActionsScope = this.newActionsScope;
			var selectionActionsScope = this.selectionActionsScope;

			commandRegistry.addCommandGroup(newActionsScope, "orion.miniExplorerNavNewGroup", 1000, messages["New"], null, null, "core-sprite-addcontent"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.addCommandGroup(selectionActionsScope, "orion.miniNavSelectionGroup", 100, messages["Actions"], null, null, "core-sprite-gear"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerSelectionService(selectionActionsScope, this.selection);

			// commands that don't appear but have keybindings
			commandRegistry.registerCommandContribution(newActionsScope, "eclipse.copySelections", 1, null, true, new KeyBinding('c', true) /* Ctrl+C */); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(newActionsScope, "eclipse.pasteSelections", 1, null, true, new KeyBinding('v', true) /* Ctrl+V */);//$NON-NLS-1$ //$NON-NLS-0$

			// New file and new folder (in a group)
			commandRegistry.registerCommandContribution(newActionsScope, "eclipse.newFile", 1, "orion.miniExplorerNavNewGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(newActionsScope, "eclipse.newFolder", 2, "orion.miniExplorerNavNewGroup", false, null/*, new mCommandRegistry.URLBinding("newFolder", "name")*/); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			// New project creation in the toolbar (in a group)
			commandRegistry.registerCommandContribution(newActionsScope, "orion.new.project", 1, "orion.miniExplorerNavNewGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(newActionsScope, "orion.new.linkProject", 2, "orion.miniExplorerNavNewGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

			var renameBinding = new KeyBinding(113); // F2
			renameBinding.domScope = "sidebar"; //$NON-NLS-0$
			renameBinding.scopeName = messages["Navigator"]; //$NON-NLS-0$
			var delBinding = new KeyBinding(46); // Delete
			delBinding.domScope = "sidebar"; //$NON-NLS-0$
			delBinding.scopeName = messages["Navigator"];
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.renameResource", 2, "orion.miniNavSelectionGroup", false, renameBinding); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.copyFile", 3, "orion.miniNavSelectionGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.moveFile", 4, "orion.miniNavSelectionGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.deleteFile", 5, "orion.miniNavSelectionGroup", false, delBinding); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.compareWithEachOther", 6, "orion.miniNavSelectionGroup");  //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.compareWith", 7, "orion.miniNavSelectionGroup");  //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "orion.importZipURL", 1, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "orion.import", 2, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.downloadFile", 3, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "orion.importSFTP", 4, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(selectionActionsScope, "eclipse.exportSFTPCommand", 5, "orion.miniNavSelectionGroup/orion.importExportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			FileCommands.createFileCommands(serviceRegistry, commandRegistry, this, fileClient);
			return ExtensionCommands.createAndPlaceFileCommandsExtension(serviceRegistry, commandRegistry, selectionActionsScope, 0, "orion.miniNavSelectionGroup", true);
		},
		updateCommands: function(selections) {
			var selectionTools = this.selectionActionsScope;
			var treeRoot = this.treeRoot, commandRegistry = this.commandRegistry;
			FileCommands.updateNavTools(this.registry, commandRegistry, this, this.newActionsScope, selectionTools, treeRoot, true);
		}
	});

	function FilesNavRenderer() {
		NavigatorRenderer.apply(this, arguments);
	}
	FilesNavRenderer.prototype = Object.create(NavigatorRenderer.prototype);
	objects.mixin(FilesNavRenderer.prototype, {
		showFolderLinks: true,
		oneColumn: true,
		createFolderNode: function(folder) {
			var folderNode = NavigatorRenderer.prototype.createFolderNode.call(this, folder);
			if (folderNode.tagName === "A") { //$NON-NLS-0$
				folderNode.classList.add("projectNavFolder"); //$NON-NLS-0$
				var editorFile = this.explorer.editorInput && this.explorer.editorInput.Location;
				this.setFolderHref(folderNode, editorFile || "", folder.ChildrenLocation);
			}
			return folderNode;
		},
		setFolderHref: function(linkElement, resource, navigate) {
			linkElement.href = new URITemplate("#{,resource,params*}").expand({ //$NON-NLS-0$
				resource: resource,
				params: {
					navigate: navigate
				}
			});
		},
		// Called when the editor file has changed
		updateFolderLinks: function(rootNode) {
			var editorFile = this.explorer.editorInput && this.explorer.editorInput.Location;
			var _self = this;
			Array.prototype.slice.call(lib.$$("a.projectNavFolder", rootNode)).forEach(function(folderLink) { //$NON-NLS-0$
				var folderLocation = PageUtil.matchResourceParameters(folderLink.href).navigate;
				_self.setFolderHref(folderLink, editorFile || "", folderLocation); //$NON-NLS-0$
			});
		}
	});
	
		
	function ProjectNavRenderer(options){
		this.parentNode = options.parentNode;
		this.serviceRegistry = options.serviceRegistry;
	}
	
	ProjectNavRenderer.prototype = {
		render: function(projectData){
		
		var titleWrapper = new mSection.Section(this.parentNode, { id : "projectSection", //$NON-NLS-0$
					title : "Project",
					content : '<div id="projectInfoNode"></div>', //$NON-NLS-0$
					canHide : true,
					preferenceService : this.serviceRegistry.getService("orion.core.preference") //$NON-NLS-0$
					});
		var projectInfoNode = lib.node("projectInfoNode");
		var span = document.createElement("span"); 
		span.appendChild(document.createTextNode("Name: " + projectData.Name));
		projectInfoNode.appendChild(span);
		
		
		titleWrapper = new mSection.Section(this.parentNode, { id : "filesSection", //$NON-NLS-0$
					title : "Files",
					content : '<div id="filesNode"></div>', //$NON-NLS-0$
					canHide : true,
					preferenceService : this.serviceRegistry.getService("orion.core.preference") //$NON-NLS-0$
					});
		},
		constructor: ProjectNavRenderer
	};
	
	function ProjectNavExplorer(params){
		this.commandRegistry = params.commandRegistry;
		this.contentTypeRegistry = params.contentTypeRegistry;
		this.fileClient = params.fileClient;
		this.parentId = params.parentId;
		this.parentNode = params.parentNode;
		this.toolbarNode = params.toolbarNode;
		this.serviceRegistry = params.serviceRegistry;
		this.renderer = new ProjectNavRenderer({
												parentNode:this.parentNode,
												serviceRegistry: this.serviceRegistry
											});
		params.parentId = "filesNode";
		params.newActionsScope = "filesSectionActionArea";
		params.selectionActionsScope = "filesSectionSelectionArea";
		this.fileExplorer = new FilesNavExplorer(params);
		this.explorer = null;
		this.addActionsScope = this.toolbarNode.id + "Add"; //$NON-NLS-0$
		this.createToolbar();
		this.registerCommands();
	}
	
	ProjectNavExplorer.prototype = {
		display: function(fileMetadata, redisplay){
		this.fileMetadata = fileMetadata;
		var that = this;
		
			if(fileMetadata.ProjectInfo){
				if(!redisplay && this.projectLocation && this.projectLocation === fileMetadata.ProjectInfo.Location){
					return;
				}
				lib.empty(this.parentNode);
				this.projectLocation = fileMetadata.ProjectInfo.Location;
				this.fileClient.readProject(fileMetadata.ProjectInfo.Location).then(
					function(projectData){
						projectData.type = "Project";
						that.renderer.render(projectData);
						that.fileExplorer.loadRoot(projectData.ContentLocation, redisplay).then(that.fileExplorer.reveal.bind(that.fileExplorer, fileMetadata));
						that.updateCommands(projectData);
					},
					function(error){
						console.error(error);//TODO
					}
				);
			} else {
				lib.empty(this.parentNode);
				this.projectLocation = null;
				var parentProject;
				if (fileMetadata.Parents && fileMetadata.Parents.length===0){
					parentProject = fileMetadata;
				} else if(fileMetadata.Parents){
					parentProject = fileMetadata.Parents[fileMetadata.Parents.length-1];
				}
				if(parentProject){
					var noProject = document.createElement("div"); //$NON-NLS-0$
					noProject.classList.add("noFile"); //$NON-NLS-0$
					noProject.textContent = messages["NoProject"];
					var plusIcon = document.createElement("span"); //$NON-NLS-0$
					plusIcon.classList.add("core-sprite-initproject"); //$NON-NLS-0$
					plusIcon.classList.add("icon-inline"); //$NON-NLS-0$
					plusIcon.classList.add("imageSprite"); //$NON-NLS-0$
					var projectName = document.createElement("b");
					projectName.appendChild(document.createTextNode(parentProject.Name));
					lib.processDOMNodes(noProject, [projectName, plusIcon]);
					this.parentNode.appendChild(noProject);
					parentProject.type = "Folder";
					that.updateCommands(parentProject);
					
				}
			}
		},
		createToolbar : function(){
			var elem = document.createElement("ul"); //$NON-NLS-0$
			elem.id = this.addActionsScope;
			elem.classList.add("commandList"); //$NON-NLS-0$
			elem.classList.add("layoutLeft"); //$NON-NLS-0$
			elem.classList.add("pageActions"); //$NON-NLS-0$
			this.toolbarNode.appendChild(elem);
		},
		changedItem: function(fileMetadata){
			if(fileMetadata){
				this.display(fileMetadata);
				return;
			}
			this.display(this.fileMetadata, true);
		},
		registerCommands : function(){
			var commandRegistry = this.commandRegistry, fileClient = this.fileClient, serviceRegistry = this.serviceRegistry;
			commandRegistry.addCommandGroup(this.addActionsScope, "orion.projectNavNewGroup", 1000, messages["Add"], null, null, "core-sprite-addcontent"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.addCommandGroup(this.addActionsScope, "orion.projectNavInitGroup", 1001, "Init Project", null, null, "core-sprite-initproject"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(this.addActionsScope, "orion.project.addFolder", 1, "orion.projectNavNewGroup"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(this.addActionsScope, "orion.project.initProject", 1, "orion.projectNavInitGroup");
			
			ProjectCommands.createProjectCommands(serviceRegistry, commandRegistry, this, fileClient);
		},
		updateCommands: function(treeRoot) {
			ProjectCommands.updateNavTools(this.serviceRegistry, this.commandRegistry, this, this.addActionsScope, this.selectionActionsScope, treeRoot, true);
		},
		destroy : function(){
		},
		constructor: ProjectNavExplorer
	};

	

	/**
	 * @name orion.sidebar.ProjectNavViewMode
	 * @class
	 */
	function ProjectNavViewMode(params) {
		this.commandRegistry = params.commandRegistry;
		this.contentTypeRegistry = params.contentTypeRegistry;
		this.fileClient = params.fileClient;
		this.editorInputManager = params.editorInputManager;
		this.parentNode = params.parentNode;
		this.sidebarNavInputManager = params.sidebarNavInputManager;
		this.toolbarNode = params.toolbarNode;
		this.serviceRegistry = params.serviceRegistry;
		this.explorer = null;
		var _self = this;
		if(this.sidebarNavInputManager){
			this.navInputListener = function(event) {
				_self.navigatorInput = event.input;
			};
			this.sidebarNavInputManager.addEventListener("InputChanged", this.navInputListener); //$NON-NLS-0$
		}
	}
	objects.mixin(ProjectNavViewMode.prototype, {
		label: messages["Project"],
		create: function() {
			var _self = this;
			this.explorer = new ProjectNavExplorer({
				commandRegistry: this.commandRegistry,
				dragAndDrop: FileCommands.uploadFile,
				fileClient: this.fileClient,
				editorInputManager: this.editorInputManager,
				sidebarNavInputManager: this.sidebarNavInputManager,
				parentId: this.parentNode.id,
				parentNode: this.parentNode,
				rendererFactory: function(explorer) {
					var renderer = new FilesNavRenderer({
						checkbox: false,
						cachePrefix: "ProjectNav"}, explorer, _self.commandRegistry, _self.contentTypeRegistry); //$NON-NLS-0$
					return renderer;
				},
				serviceRegistry: this.serviceRegistry,
				toolbarNode: this.toolbarNode
			});
			// If there is a target in the navigator, open this target
			if(this.navigatorInput){
				this.fileClient.read(this.navigatorInput, true).then(function(fileMetadata){
					_self.explorer.display(fileMetadata);
				}, function(error){
					console.error(error); //TODO
				});
			} else {
				this.explorer.display(this.editorInputManager.getFileMetadata());
			}
		},
		destroy: function() {
			if (this.explorer) {
				this.explorer.destroy();
			}
			this.explorer = null;
		}
	});

	return ProjectNavViewMode;
});
