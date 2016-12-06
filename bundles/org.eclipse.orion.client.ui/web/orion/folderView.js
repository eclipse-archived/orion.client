/*******************************************************************************
 * Copyright (c) 2013, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
define([
	'orion/globalCommands',
	'orion/explorers/explorer-table',
	'orion/explorers/navigatorRenderer',
	'orion/fileCommands',
	'orion/markdownView',
	'orion/projects/projectEditor',
	'orion/PageUtil',
	'orion/URITemplate',
	'orion/webui/littlelib',
	'orion/objects',
	'orion/util',
	'orion/Deferred',
	'orion/projects/projectView',
	'orion/generalPreferences',
	'orion/section'
], function(mGlobalCommands, mExplorerTable, mNavigatorRenderer, FileCommands, mMarkdownView, mProjectEditor, PageUtil, 
			URITemplate, lib, objects, util, Deferred, mProjectView, mGeneralPrefs, mSection) {

	var ID_COUNT = 0;

	var FileExplorer = mExplorerTable.FileExplorer;
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
			if (this.showFolderLinks && folderNode.tagName === "A") {
				folderNode.href = uriTemplate.expand({
					resource: folder.Location
				});
			}
			folderNode.classList.add("folderNavFolder"); //$NON-NLS-0$
			folderNode.classList.add("navlink"); //$NON-NLS-0$
			folderNode.classList.add("targetSelector"); //$NON-NLS-0$
			folderNode.classList.remove("navlinkonpage"); //$NON-NLS-0$
			return folderNode;
		},
		/**
		 * override NavigatorRenderer's prototype
		 */
		getCellHeaderElement: function(col_no) {
			var td;
			if (col_no === 0) {
				td = document.createElement("th");
				td.colSpan = 1;
				var root = this.explorer.treeRoot;
				td.appendChild(document.createTextNode(root.Parents || util.isElectron ? root.Name : this.explorer.fileClient.fileServiceName(root.Location)));
				return td;
			}
			return null;
		},
		/**
		 * override NavigatorRenderer's prototype
		 */
		getExpandImage: function() {
			return null;
		}
	});

	function FolderNavExplorer(options) {
		options.setFocus = false; // do not steal focus on load
		options.cachePrefix = null; // do not persist table state
		options.dragAndDrop = FileCommands.uploadFile;
		options.modelEventDispatcher = FileCommands.getModelEventDispatcher();
		options.rendererFactory = function(explorer) {
			return new FolderNavRenderer({
				checkbox: false,
				treeTableClass: "sectionTreeTable", //$NON-NLS-0$
				cachePrefix: "FolderNavigator" //$NON-NLS-0$
			}, explorer, options.commandRegistry, options.contentTypeRegistry);
		};
		FileExplorer.apply(this, arguments);
		this.menuBar = options.menuBar;
		this.serviceRegistry = options.serviceRegistry;
		this.fileClient = options.fileClient;
		this.commandRegistry = options.commandRegistry;
		this.contentTypeRegistry = options.contentTypeRegistry;
		this.editorInputManager = options.editorInputManager;
		this.treeRoot = {};
		this.parent = lib.node(options.parentId);
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
		isCommandsVisible: function() {
			if (!this.selection) {
				return false;
			}
			var mainSplitter = mGlobalCommands.getMainSplitter();
			if (mainSplitter) {
				return mainSplitter.splitter.isClosed();
			}
			return true;
		},
		scope: function(childrenLocation) {
			window.location.href = uriTemplate.expand({
				resource: childrenLocation
			});
		},
		scopeUp: function() {
			var navigate;
			var root = this.treeRoot;
			var prnt = root.Parents && root.Parents[0];
			if (prnt) {
				navigate = prnt.ChildrenLocation;
			} else {
				navigate = this.fileClient.fileServiceRootURL(root.Location);
			}
			this.scope(navigate);
		},
		scopeDown: function(item) {
			this.scope(item.ChildrenLocation);
		},
		// Returns a deferred that completes once file command extensions have been processed
		registerCommands: function() {
			return new Deferred().resolve();
		},
		getTreeRoot: function() {
			return this.treeRoot;
		},
		/**
		 * @callback
		 */
		updateCommands: function(selections) {
			if (this.menuBar) {
				this.menuBar.setActiveExplorer(this);
				this.menuBar.updateCommands();
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
		this.idCount = ID_COUNT++;
		this._parent = options.parent;
		this._metadata = options.metadata;
		this.menuBar = options.menuBar;
		this.fileClient = options.fileService;
		this.progress = options.progressService;
		this.serviceRegistry = options.serviceRegistry;
		this.commandRegistry = options.commandRegistry;
		this.contentTypeRegistry = options.contentTypeRegistry;
		this.editorInputManager = options.inputManager;
		this.preferences = options.preferences;
		this.generalPrefs = new mGeneralPrefs.GeneralPreferences(this.preferences);
		this.showProjectView = options.showProjectView === undefined ? true : options.showProjectView;
		this.showFolderNav = true;
		this._init();
	}
	FolderView.prototype = /** @lends orion.FolderView.prototype */ {
		_init: function() {
			this.markdownView = new mMarkdownView.MarkdownView({
				fileClient: this.fileClient,
				canHide: true,
				progress: this.progress
			});
			if (this.showProjectView) {
				this.projectEditor = new mProjectEditor.ProjectEditor({
					fileClient: this.fileClient,
					progress: this.progress,
					serviceRegistry: this.serviceRegistry,
					commandRegistry: this.commandRegistry,
					preferences: this.preferences
				});
				this.projectView = new mProjectView.ProjectView({
					fileClient: this.fileClient,
					progress: this.progress,
					serviceRegistry: this.serviceRegistry,
					commandRegistry: this.commandRegistry
				});
			}
			var mainSplitter = mGlobalCommands.getMainSplitter();
			if (mainSplitter) {
				mGlobalCommands.getMainSplitter().splitter.addEventListener("toggle", this._splitterToggleListener = function(e) {
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
			if (mainSplitter) {
				return mainSplitter.splitter.isClosed();
			}
			return true;
		},
		displayFolderView: function(root) {
			var children = root.Children;
			var projectJson;
			var readmeMd;
			if (children) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i];
					if (!child.Directory && child.Name === "project.json") {
						projectJson = child;
					}
					if (!child.Directory && child.Name && child.Name.toLowerCase() === "readme.md") {
						readmeMd = child;
					}

				}
			}
			var div;
			if (!this._node) {
				this._node = document.createElement("div");
			}
			this._parent.appendChild(this._node);

			function renderSections(sectionsOrder, sectionNames, filteredResources) {
				sectionsOrder.forEach(function(sectionName) {
					if (sectionName === "project") {
						if (projectJson && this.showProjectView) {
							div = document.createElement("div");
							this.projectEditor.displayContents(div, this._metadata);
							this._node.appendChild(div);
						}
					} else if (sectionName === "folderNav") {
						if (this.showFolderNav) {
							var navNode = document.createElement("div");
							navNode.id = "folderNavNode" + this.idCount; //$NON-NLS-0$
							var title = sectionNames[sectionName] || "Files";
							var foldersSection = new mSection.Section(this._node, {
								id: "folderNavSection" + this.idCount,
								headerClass: ["sectionTreeTableHeader"],
								title: title,
								canHide: true
							});
							this.folderNavExplorer = new FolderNavExplorer({
								parentId: navNode,
								view: this,
								menuBar: this.menuBar,
								serviceRegistry: this.serviceRegistry,
								fileClient: this.fileClient,
								editorInputManager: this.editorInputManager,
								commandRegistry: this.commandRegistry,
								contentTypeRegistry: this.contentTypeRegistry,
								filteredResources: filteredResources
							});
							foldersSection.embedExplorer(this.folderNavExplorer);
							this.folderNavExplorer.setCommandsVisible(this._isCommandsVisible());
							this.folderNavExplorer.loadRoot(this._metadata);
						}
					} else if (sectionName === "readme") {
						if (readmeMd) {
							div = document.createElement("div");
							this.markdownView.displayInFrame(div, readmeMd, ["sectionTreeTableHeader"], null, sectionNames[sectionName]); //$NON-NLS-0$
							this._node.appendChild(div);
						}
					}
				}.bind(this));
			}

			var sectionsOrder = ["project", "folderNav", "readme"]; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var sectionNames = {};
			if (this.preferences) {
				Deferred.all([this.preferences.get("/sectionsOrder"), this.generalPrefs.getPrefs()]).then(function(prefs) {
					sectionNames = prefs[0]["folderViewNames"] || sectionNames;
					sectionsOrder = prefs[0]["folderView"] || sectionsOrder;
					var res = Object.create(null);
					if(prefs[1] && typeof prefs[1].filteredResources === 'string') {
						prefs[1].filteredResources.split(',').forEach(function(item) {
							res[item] = true;
						});
					}
					renderSections.apply(this, [sectionsOrder, sectionNames, res]);
				}.bind(this),
				function(error) {
					renderSections.apply(this, [sectionsOrder, sectionNames]);
					window.console.error(error);
				}.bind(this));
			} else {
				renderSections.apply(this, [sectionsOrder, sectionNames]);
			}
		},
		create: function() {
			if (this._metadata.Children) {
				this.displayFolderView(this._metadata);
			} else if (this._metadata.ChildrenLocation) {
				this.progress.progress(this.fileClient.fetchChildren(this._metadata.ChildrenLocation), "Fetching children of " + this._metadata.Name).then(function(children) {
					this._metadata.Children = children;
					this.displayFolderView(this._metadata);
				}.bind(this));
			}
		},
		destroy: function() {
			var mainSplitter = mGlobalCommands.getMainSplitter();
			if (mainSplitter) {
				mainSplitter.splitter.removeEventListener("toggle", this._splitterToggleListener);
			}
			if (this.folderNavExplorer) {
				this.folderNavExplorer.destroy();
			}
			this.folderNavExplorer = null;
			if (this._node && this._node.parentNode) {
				this._node.parentNode.removeChild(this._node);
			}
			if (this.projectView) {
				this.projectView.destroy();
			}
			if (this.projectEditor) {
				this.projectEditor.destroy();
			}
			this._node = null;
		}
	};
	return {
		FolderView: FolderView
	};
});