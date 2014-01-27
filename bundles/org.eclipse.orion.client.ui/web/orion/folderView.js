/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
/*global define document window*/
define([
	'i18n!orion/edit/nls/messages',
	'orion/globalCommands',
	'orion/explorers/explorer-table',
	'orion/explorers/navigatorRenderer',
	'orion/selection',
	'orion/fileCommands',
	'orion/extensionCommands',
	'orion/keyBinding',
	'orion/markdownView', 
	'orion/projects/projectEditor',
	'orion/PageUtil',
	'orion/URITemplate',
	'orion/webui/littlelib',
	'orion/objects',
	'orion/Deferred',
	'orion/projects/projectView',
	'orion/section'
], function(messages, mGlobalCommands, mExplorerTable, mNavigatorRenderer, Selection, FileCommands, ExtensionCommands, mKeyBinding, mMarkdownView, mProjectEditor, PageUtil, URITemplate, lib, objects, Deferred, mProjectView, mSection) {
	
	var FileExplorer = mExplorerTable.FileExplorer;
	var KeyBinding = mKeyBinding.KeyBinding;
	var NavigatorRenderer = mNavigatorRenderer.NavigatorRenderer;
	
	var uriTemplate = new URITemplate("#{,resource,params*}"); //$NON-NLS-0$
	function FolderNavRenderer() {
		NavigatorRenderer.apply(this, arguments);
	}
	FolderNavRenderer.prototype = Object.create(NavigatorRenderer.prototype);
	objects.mixin(FolderNavRenderer.prototype, {
		showFolderImage: true,
		/**
		 * override NavigatorRenderer's prototype
		 */
		createFolderNode: function(folder) {
			var folderNode = mNavigatorRenderer.NavigatorRenderer.prototype.createFolderNode.call(this, folder);
			if (this.showFolderLinks && folderNode.tagName === "A") { //$NON-NLS-0$
				folderNode.href = uriTemplate.expand({resource: folder.Location}); //$NON-NLS-0$
			}
			folderNode.classList.add("folderNavFolder"); //$NON-NLS-0$
			folderNode.classList.add("navlink"); //$NON-NLS-0$
			folderNode.classList.add("targetSelector"); //$NON-NLS-0$
			folderNode.classList.remove("navlinkonpage"); //$NON-NLS-0$
			if (this.explorer.readonly && this.explorer.clickHandler) { //$NON-NLS-0$
				folderNode.href = "javascript:void(0)";
				folderNode.addEventListener("click", function(){this.explorer.clickHandler(folder.Location);}.bind(this)
				, false);
			}
			return folderNode;
		},
		/**
		 * override NavigatorRenderer's prototype
		 */
		updateFileNode: function(file, fileNode, isImage) {
			mNavigatorRenderer.NavigatorRenderer.prototype.updateFileNode.call(this, file, fileNode, isImage);
			if (this.explorer.readonly && fileNode.tagName === "A") { //$NON-NLS-0$
				if(this.explorer.clickHandler){
					fileNode.href = "javascript:void(0)";
					fileNode.addEventListener("click", function(){this.explorer.clickHandler(file.Location);}.bind(this)
					, false);
				} else {
					fileNode.href = uriTemplate.expand({resource: file.Location});
				}
			}
		},
		/**
		 * override NavigatorRenderer's prototype
		 */
		getCellHeaderElement: function(col_no) {
			if(this.explorer.breadCrumbMaker) {
				return null;
			}
			var td;
			if (col_no === 0) {
				td = document.createElement("th"); //$NON-NLS-0$
				td.colSpan = 1;
				var root = this.explorer.treeRoot;
				td.appendChild(document.createTextNode(root.Parents ? root.Name : this.explorer.fileClient.fileServiceName(root.Location)));
				return td;
			}
			return null;
		},
		/**
		 * override NavigatorRenderer's prototype
		 */
		emptyCallback: function(bodyElement) {
			if (this.explorer.readonly) {
				return;
			}
			mNavigatorRenderer.NavigatorRenderer.prototype.emptyCallback.call(this, bodyElement);
		},
		/**
		 * override NavigatorRenderer's prototype
		 */
		getExpandImage: function() {
			return null;
		}
	});
	
	function FolderNavExplorer(options) {
		options.setFocus = false;   // do not steal focus on load
		options.cachePrefix = null; // do not persist table state
		options.dragAndDrop = FileCommands.uploadFile;
		options.modelEventDispatcher = FileCommands.getModelEventDispatcher();
		options.rendererFactory = function(explorer) {
			return new FolderNavRenderer({
				checkbox: false,
				cachePrefix: "FolderNavigator" //$NON-NLS-0$
			}, explorer, options.commandRegistry, options.contentTypeRegistry);
		};
		FileExplorer.apply(this, arguments);
		this.commandsId = ".folderNav"; //$NON-NLS-0$
		this.serviceRegistry = options.serviceRegistry;
		this.fileClient = options.fileClient;
		this.commandRegistry = options.commandRegistry;
		this.contentTypeRegistry = options.contentTypeRegistry;
		this.readonly = options.readonly;
		this.breadCrumbMaker = options.breadCrumbMaker;
		this.clickHandler = options.clickHandler;
		this.treeRoot = {};
		this.parent = lib.node(options.parentId);	
		this.toolbarId = this.parent.id + "Tool"; //$NON-NLS-0$
		this.fileActionsScope = "fileActions"; //$NON-NLS-0$
		this.editActionsScope = "editActions"; //$NON-NLS-0$
		this.viewActionsScope = "viewActions"; //$NON-NLS-0$
//		this.actionsSections = [this.fileActionsScope, this.editActionsScope, this.viewActionsScope];
	}
	FolderNavExplorer.prototype = Object.create(FileExplorer.prototype);
	objects.mixin(FolderNavExplorer.prototype, /** @lends orion.FolderNavExplorer.prototype */ {
		loadRoot: function(root) {
			if (root) {
				this.load(root, "Loading " + root.Name).then(this.loaded.bind(this));
			} else {
				this.loadResourceList(PageUtil.matchResourceParameters().resource + "?depth=1", false).then(this.loaded.bind(this)); //$NON-NLS-0$
			}
		},
		// Returns a deferred that completes once file command extensions have been processed
		registerCommands: function() {
//			var commandRegistry = this.commandRegistry, fileClient = this.fileClient, serviceRegistry = this.serviceRegistry;
//			var fileActionsScope = this.fileActionsScope;
//			var editActionsScope = this.editActionsScope;
//			var viewActionsScope = this.viewActionsScope;
//			
//			commandRegistry.registerSelectionService(fileActionsScope, this.selection);
//			commandRegistry.registerSelectionService(editActionsScope, this.selection);
//			commandRegistry.registerSelectionService(viewActionsScope, this.selection);
//
//			var parent = lib.node(this.parentId);
//			var renameBinding = new KeyBinding(113); // F2
//			var delBinding = new KeyBinding(46); // Delete
//			var cutBinding = new KeyBinding('x', true); /* Ctrl+X */ //$NON-NLS-0$
//			var copySelections = new KeyBinding('c', true); /* Ctrl+C */ //$NON-NLS-0$
//			var pasteSelections = new KeyBinding('v', true); /* Ctrl+V */ //$NON-NLS-0$
//			pasteSelections.domScope = copySelections.domScope = delBinding.domScope = renameBinding.domScope = parent.id; //$NON-NLS-0$
//			pasteSelections.scopeName = copySelections.scopeName = delBinding.scopeName = renameBinding.scopeName = messages.FolderNavigator; //$NON-NLS-0$
//
//			// New actions
//			commandRegistry.registerCommandContribution(fileActionsScope, "eclipse.newFile" + this.commandsId, 1, "orion.menuBarFileGroup/orion.newContentGroup/orion.new.default"); //$NON-NLS-1$ //$NON-NLS-0$
//			commandRegistry.registerCommandContribution(fileActionsScope, "eclipse.newFolder" + this.commandsId, 2, "orion.menuBarFileGroup/orion.newContentGroup/orion.new.default", false, null/*, new mCommandRegistry.URLBinding("newFolder", "name")*/); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//			commandRegistry.registerCommandContribution(fileActionsScope, "orion.new.project" + this.commandsId, 3, "orion.menuBarFileGroup/orion.newContentGroup/orion.new.default"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//			commandRegistry.registerCommandContribution(fileActionsScope, "orion.new.linkProject" + this.commandsId, 4, "orion.menuBarFileGroup/orion.newContentGroup/orion.new.default"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//
//			// Import actions
//			commandRegistry.registerCommandContribution(fileActionsScope, "orion.import" + this.commandsId, 1, "orion.menuBarFileGroup/orion.importGroup"); //$NON-NLS-1$ //$NON-NLS-0$
//			commandRegistry.registerCommandContribution(fileActionsScope, "orion.importZipURL" + this.commandsId, 2, "orion.menuBarFileGroup/orion.importGroup"); //$NON-NLS-1$ //$NON-NLS-0$
//			commandRegistry.registerCommandContribution(fileActionsScope, "orion.importSFTP" + this.commandsId, 3, "orion.menuBarFileGroup/orion.importGroup"); //$NON-NLS-1$ //$NON-NLS-0$
//
//			// Export actions
//			commandRegistry.registerCommandContribution(fileActionsScope, "eclipse.downloadFile" + this.commandsId, 1, "orion.menuBarFileGroup/orion.exportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
//			commandRegistry.registerCommandContribution(fileActionsScope, "eclipse.exportSFTPCommand" + this.commandsId, 2, "orion.menuBarFileGroup/orion.exportGroup"); //$NON-NLS-1$ //$NON-NLS-0$
//
//			// Edit actions
//			commandRegistry.registerCommandContribution(editActionsScope, "eclipse.renameResource" + this.commandsId, 1, "orion.menuBarEditGroup/orion.renameGroup", false, renameBinding); //$NON-NLS-1$ //$NON-NLS-0$
//			commandRegistry.registerCommandContribution(editActionsScope, "eclipse.cut" + this.commandsId, 2, "orion.menuBarEditGroup/orion.clipboardGroup", false, cutBinding); //$NON-NLS-1$ //$NON-NLS-0$
//			commandRegistry.registerCommandContribution(editActionsScope, "eclipse.copySelections" + this.commandsId, 3, "orion.menuBarEditGroup/orion.clipboardGroup", false, copySelections); //$NON-NLS-1$ //$NON-NLS-0$
//			commandRegistry.registerCommandContribution(editActionsScope, "eclipse.pasteSelections" + this.commandsId, 4, "orion.menuBarEditGroup/orion.clipboardGroup", false, pasteSelections); //$NON-NLS-1$ //$NON-NLS-0$
//			commandRegistry.registerCommandContribution(editActionsScope, "eclipse.deleteFile" + this.commandsId, 5, "orion.menuBarEditGroup/orion.deleteGroup", false, delBinding); //$NON-NLS-1$ //$NON-NLS-0$
//			commandRegistry.registerCommandContribution(editActionsScope, "eclipse.compareWith" + this.commandsId, 6, "orion.menuBarEditGroup/orion.compareGroup");  //$NON-NLS-1$ //$NON-NLS-0$
//			commandRegistry.registerCommandContribution(editActionsScope, "eclipse.compareWithEachOther" + this.commandsId, 7, "orion.menuBarEditGroup/orion.compareGroup");  //$NON-NLS-1$ //$NON-NLS-0$
//
//			if(serviceRegistry) {
//				FileCommands.createFileCommands(serviceRegistry, commandRegistry, this, fileClient);
//			}
//			if (serviceRegistry) {
//				return ExtensionCommands.createAndPlaceFileCommandsExtension(serviceRegistry, commandRegistry, viewActionsScope, 3, "orion.menuBarViewGroup", true); //$NON-NLS-0$
//			}
			return new Deferred().resolve();
		},
		updateCommands: function(selections) {
			if(this.serviceRegistry) {
				FileCommands.updateNavTools(this.serviceRegistry, this.commandRegistry, this, this.fileActionsScope, [this.fileActionsScope, this.editActionsScope, this.viewActionsScope], this.treeRoot, true);
			}
		}
	});
	
	/** 
	 * Constructs a new FolderView object.
	 * 
	 * @class 
	 * @name orion.FolderView
	 */
	function FolderView(options) {
		this._parent = options.parent;
		this._metadata = options.metadata;
		this.fileClient = options.fileService;
		this.progress = options.progressService;
		this.serviceRegistry = options.serviceRegistry;
		this.commandRegistry = options.commandRegistry;
		this.contentTypeRegistry = options.contentTypeRegistry;
		this.preferences = options.preferences;
		this.readonly = typeof options.readonly === 'undefined' ? false : options.readonly;
		this.showProjectView = typeof options.showProjectView === 'undefined' ? true : options.showProjectView;
		this.showFolderNav = true;
		this.readmeHeaderClass = options.readmeHeaderClass;
		this.editorView = options.editorView;
		this._maxEditorHeight = options.maxEditorHeight;
		this.imageView = options.imageView;
		this.breadCrumbMaker = options.breadCrumbMaker;
		this.clickHandler = options.clickHandler;
		this._init();
	}
	FolderView.prototype = /** @lends orion.FolderView.prototype */ {
		_init: function(){
			if(this.serviceRegistry && this.serviceRegistry.getServiceReferences("orion.projects").length===0){
				this.showProjectView = false;
			}
			this.markdownView = new mMarkdownView.MarkdownView({
				fileClient : this.fileClient,
				canHide: !this.readonly,
				progress : this.progress
			});
			if(this.showProjectView){
				this.projectEditor = new mProjectEditor.ProjectEditor({
					fileClient : this.fileClient,
					progress : this.progress,
					serviceRegistry: this.serviceRegistry,
					commandRegistry: this.commandRegistry,
					preferences: this.preferences
				});
				this.projectView = new mProjectView.ProjectView({
					fileClient : this.fileClient,
					progress : this.progress,
					serviceRegistry: this.serviceRegistry,
					commandRegistry: this.commandRegistry
				});
			}
			var mainSplitter = mGlobalCommands.getMainSplitter();
			if(mainSplitter) {
				mGlobalCommands.getMainSplitter().splitter.addEventListener("toggle", this._splitterToggleListener = function(e) { //$NON-NLS-0$
					[this.markdownView, this.projectEditor, this.projectView, this.folderNavExplorer].forEach(function(view) {
						if (view && view.setCommandsVisible) {
							view.setCommandsVisible(e.closed);
						}
					});
				}.bind(this));
			}
		},
		_isCommandsVisible: function() {
			var mainSplitter = mGlobalCommands.getMainSplitter();
			if(mainSplitter) {
				return mainSplitter.splitter.isClosed();
			}
			return !this.readonly;
		},
		displayWorkspaceView: function(){
			var _self = this;
			if(!this._node){
				this._node = document.createElement("div"); //$NON-NLS-0$
			}
			this._parent.appendChild(this._node);
			
			if(this.showProjectView){
				var div = document.createElement("div"); //$NON-NLS-0$
				_self._node.appendChild(div);
				this.projectView.display(this._metadata, div);
				this.projectView.setCommandsVisible(this._isCommandsVisible());
			}
		},
		displayFolderView: function(root){
			var children = root.Children;
			var projectJson;
			var readmeMd;
			if(children) {
				for (var i=0; i<children.length; i++) {
					var child = children[i];
					if (!child.Directory && child.Name === "project.json") { //$NON-NLS-0$
						projectJson = child;
					}
					if (!child.Directory && child.Name && child.Name.toLowerCase() === "readme.md") { //$NON-NLS-0$
						readmeMd = child;
					}
	
				}
			}
			var div;
			if(!this._node){
				this._node = document.createElement("div"); //$NON-NLS-0$
			}
			this._parent.appendChild(this._node);
			
			function renderSections(sectionsOrder){
				sectionsOrder.forEach(function(sectionName){
					if(sectionName === "project"){
						if(projectJson && this.showProjectView){
							div = document.createElement("div"); //$NON-NLS-0$
							this.projectEditor.displayContents(div, this._metadata);
							this._node.appendChild(div);
						}
					} else if(sectionName === "folderNav") {
						if (this.showFolderNav) {
							var navNode = document.createElement("div"); //$NON-NLS-0$
							navNode.id = "folderNavNode"; //$NON-NLS-0$
							var foldersSection = new mSection.Section(this._node, {id: "folderNavSection", title: "Files", canHide: !this.readonly});
							if(this.editorView) {//To embed an orion editor in the section
								foldersSection.setContent(this.editorView.getParent());
								this.editorView.create();
								var textView = this.editorView. editor.getTextView();
								textView.getModel().addEventListener("Changed", this._editorViewModelChangedListener = function(e){ //$NON-NLS-0$
									var textViewheight = textView.getLineHeight() * textView.getModel().getLineCount() + 20;
									if(this._maxEditorHeight && this._maxEditorHeight > 0 && textViewheight >this._maxEditorHeight) {
										textViewheight = this._maxEditorHeight;
									}
									this.editorView.getParent().style.height = textViewheight + "px"; //$NON-NLS-0$
								}.bind(this));
								this.editor = this.editorView.editor;
							} else if(this.imageView) {
								foldersSection.setContent(this.imageView.image);
							} else {
								this.folderNavExplorer = new FolderNavExplorer({
									parentId: navNode,
									view: this,
									readonly: this.readonly,
									breadCrumbMaker: this.breadCrumbMaker,
									clickHandler: this.clickHandler,
									serviceRegistry: this.serviceRegistry,
									fileClient: this.fileClient,
									commandRegistry: this.commandRegistry,
									contentTypeRegistry: this.contentTypeRegistry
								});
								foldersSection.embedExplorer(this.folderNavExplorer);
								this.folderNavExplorer.setCommandsVisible(this._isCommandsVisible());
								this.folderNavExplorer.loadRoot(this._metadata);
							}
							if(this.breadCrumbMaker) {
								var tileNode = foldersSection.getTitleElement();
								if(tileNode) {
									lib.empty(tileNode);
									var bcNode = document.createElement("div"); //$NON-NLS-0$
									tileNode.appendChild(bcNode);
									this.breadCrumbMaker(bcNode, foldersSection.getHeaderElement().offsetWidth - 24);
								}
							}
						}
					} else if(sectionName === "readme"){
						if (readmeMd) {
							div = document.createElement("div"); //$NON-NLS-0$
							this.markdownView.displayInFrame(div, readmeMd, this.readmeHeaderClass);
							this._node.appendChild(div);
						}
					}
				}.bind(this));
			}
			
			var sectionsOrder = ["project", "folderNav", "readme"];
			if(this.editorView) {
				renderSections.apply(this, [sectionsOrder]);
			} else {
				if(this.preferences) {
					this.preferences.getPreferences("/sectionsOrder").then(function(sectionsOrderPrefs){
						sectionsOrder = sectionsOrderPrefs.get("folderView") || sectionsOrder;
						renderSections.apply(this, [sectionsOrder]);
					}.bind(this), function(error){
						renderSections.apply(this, [sectionsOrder]);
						window.console.error(error);
					}.bind(this));
				} else {
					renderSections.apply(this, [sectionsOrder]);
				}
			}
		},
		create: function() {
			if(this._metadata.Projects){ //this is a workspace root
				this.displayWorkspaceView();
			}
			if(this.editorView || this.imageView) {
				this.displayFolderView(this._metadata);
			} else if(this._metadata.Children){
				this.displayFolderView(this._metadata);
			} else if(this._metadata.ChildrenLocation){
				this.progress.progress(this.fileClient.fetchChildren(this._metadata.ChildrenLocation), "Fetching children of " + this._metadata.Name).then(function(children) {
					this._metadata.Children = children;
					this.displayFolderView(this._metadata);
				}.bind(this));
			}
		},
		destroy: function() {
			if(this.editorView) {
				this.editorView. editor.getTextView().getModel().removeEventListener("Changed", this._editorViewModelChangedListener); //$NON-NLS-0$
				this.editorView.destroy();
				this.editor = null;
			}
			var mainSplitter = mGlobalCommands.getMainSplitter();
			if(mainSplitter) {
				mainSplitter.splitter.removeEventListener("toggle", this._splitterToggleListener); //$NON-NLS-0$
			}
			if (this.folderNavExplorer) {
				this.folderNavExplorer.destroy();
			}
			this.folderNavExplorer = null;
			if (this._node && this._node.parentNode) {
				this._node.parentNode.removeChild(this._node);
			}
			if(this.projectView) {
				this.projectView.destroy();
			}
			if(this.projectEditor){
				this.projectEditor.destroy();
			}
			this._node = null;
		}
	};
	return {FolderView: FolderView};
});
