/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define document*/
define(['dojo', 'orion/Deferred', 'orion/section', 'orion/commands', 'orion/selection', 'orion/sites/siteUtils', 'orion/sites/siteClient', 
		'orion/sites/siteCommands', 'orion/treetable'],
		function(dojo, Deferred, mSection, mCommands, mSelection, mSiteUtils, mSiteClient, mSiteCommands, treetable) {
	var Section = mSection.Section;
	var TableTree = treetable.TableTree;
	var SitesTree, ViewOnSiteTree;

	/** 
	 * @name orion.sites.SiteServicesExplorer
	 * @class Section-based explorer showing the sites on each site service.
	 * @param {orion.serviceregistry.ServiceRegistry} options.serviceRegistry
	 * @param {DomNode} options.parent
	 */
	function SiteServicesExplorer(options) {
		this.registry = options.serviceRegistry;
		this.parentNode = options.parent;
		this.siteServiceRefs = this.registry.getServiceReferences('orion.site');
	}
	SiteServicesExplorer.prototype = /** @lends orion.sites.SiteServicesExplorer.prototype */ {
		display: function() {
			var serviceRegistry = this.registry;
			var commandService = serviceRegistry.getService('orion.page.command');
			var serviceRefs = this.siteServiceRefs;
			for (var i=0; i < serviceRefs.length; i++) {
				var siteServiceRef = serviceRefs[i];
				var siteService = this.registry.getService(siteServiceRef);
				var siteClient = new mSiteClient.SiteClient(serviceRegistry, siteService, siteServiceRef);
				var sectionId = 'section' + i;
				var sitesNodeId = sectionId + 'siteNode';
				var section = new Section(this.parentNode, {
					explorer: this,
					id: sectionId,
					title: 'Site Configurations on ' + siteServiceRef.getProperty('name'),
					content: '<div id="' + sitesNodeId + '" class="plugin-settings-list"></div>',
					commandService: commandService,
					serviceRegistry: serviceRegistry,
					slideout: true
				});
				commandService.registerCommandContribution(section.actionsNode.id, 'orion.site.create', 100);
				commandService.renderCommands(section.actionsNode.id, section.actionsNode, siteServiceRef, this, 'button');

				var sectionItemActionScopeId = 'section' + i + 'Action';
				commandService.registerCommandContribution(sectionItemActionScopeId, 'orion.site.edit', 10);
				commandService.registerCommandContribution(sectionItemActionScopeId, 'orion.site.start', 20);
				commandService.registerCommandContribution(sectionItemActionScopeId, 'orion.site.stop', 30);
				commandService.registerCommandContribution(sectionItemActionScopeId, 'orion.site.delete', 40);
				var refresher = (function(section) {
					return function() {
						section.tree.refresh();
					};
				}(section));
				section.tree = new SitesTree({
					id: sitesNodeId + 'tree',
					parent: sitesNodeId,
					actionScopeId: sectionItemActionScopeId,
					serviceRegistry: this.registry,
					siteService: siteClient,
					startCallback: refresher,
					stopCallback: refresher,
					deleteCallback: refresher
				});
			}
		}
	};

	var SiteTreeModel = (function() {
		/**
		 * @name orion.sites.SiteTreeModel
		 * @class Tree model for powering a tree of site configurations.
		 * @see orion.treetable.TableTree
		 * @private
		 */
		function SiteTreeModel(siteService, id) {
			this._siteService = siteService;
			this._root = {};
			this._id = id;
		}
		SiteTreeModel.prototype = /** @lends orion.sites.SiteTreeModel.prototype */{
			getRoot: function(/**function*/ onItem) {
				onItem(this._root);
			},
			getChildren: function(/**dojo.data.Item*/ parentItem, /**Function(items)*/ onComplete) {
				if (parentItem.children) {
					// The parent already has the children fetched
					onComplete(parentItem.children);
				} else if (parentItem === this._root) {
					this._siteService.getSiteConfigurations().then(
						function(/**Array*/ siteConfigurations) {
							parentItem.children = siteConfigurations;
							onComplete(siteConfigurations);
						});
				} else {
					return onComplete([]);
				}
			},
			getId: function(/**dojo.data.Item|String*/ item) {
				return (item === this._root || item === this._id) ? this._id : item.Id;
			}
		};
		return SiteTreeModel;
	}());
	
	var SitesRenderer = (function() {
		/**
		 * @name orion.sites.SitesRenderer
		 * @class A renderer for a list of site configurations obtained from a site service.
		 * @see orion.treetable.TableTree
		 * @private
		 */
		function SitesRenderer(options) {
			this._commandService = options.serviceRegistry.getService("orion.page.command");
			this._options = options;
		}
		SitesRenderer.prototype = /** @lends orion.sites.SitesRenderer.prototype */{
			initTable: function (tableNode, tableTree) {
				this.tableTree = tableTree;
				dojo.addClass(tableNode, "treetable");
				var thead = dojo.create("thead", null);
				dojo.create("th", {innerHTML: "Name"}, thead, "last");
				dojo.create("th", {innerHTML: "Status"}, thead, "last");
				dojo.create("th", {innerHTML: "URL", className: "urlCol"}, thead, "last");
				dojo.create("th", {innerHTML: "Actions"}, thead, "last");
				tableNode.appendChild(thead);
			},
			render: function(item, tableRow) {
				dojo.addClass(tableRow, "treeTableRow sitesTableRow");
				
				var siteConfigCol = dojo.create("td", {id: tableRow.id + "col1"});
				var statusCol = dojo.create("td", {id: tableRow.id + "col2"});
				var urlCol = dojo.create("td", {id: tableRow.id + "col3"});
				var actionCol = dojo.create("td", {id: tableRow.id + "col4"});
				
				// Site config column
				var href = mSiteUtils.generateEditSiteHref(item);
				var nameLink = dojo.create("a", {href: href}, siteConfigCol, "last");
				dojo.place(document.createTextNode(item.Name), nameLink, "last");
				
				// Status, URL columns
				var status = item.HostingStatus;
				if (typeof status === "object") {
					if (status.Status === "started") {
						dojo.place(document.createTextNode("Started"), statusCol, "last");
						var link = dojo.create("a", {className: "siteURL"}, urlCol, "last");
						dojo.place(document.createTextNode(status.URL), link, "only");
						link.href = status.URL;
					} else {
						var statusString = status.Status.substring(0,1).toUpperCase() + status.Status.substring(1);
						dojo.place(document.createTextNode(statusString), statusCol, "only");
					}
				} else {
					dojo.place(document.createTextNode("Unknown"), statusCol, "only");
				}
				
				// Action column
				var actionsWrapper = dojo.create("span", {id: tableRow.id + "actionswrapper"}, actionCol, "only");
				var options = this._options;
				var userData = {
					startCallback: options.startCallback,
					stopCallback: options.stopCallback,
					deleteCallback: options.deleteCallback,
					errorCallback: function(err) {
						options.serviceRegistry.getService('orion.page.message').setProgressResult(err);
					}
				};
				this._commandService.renderCommands(options.actionScopeId, actionsWrapper, item, null /*handler*/, "tool", userData);
				
				dojo.place(siteConfigCol, tableRow, "last");
				dojo.place(statusCol, tableRow, "last");
				dojo.place(urlCol, tableRow, "last");
				dojo.place(actionCol, tableRow, "last");
			},
			rowsChanged: function() {
				dojo.query(".treeTableRow").forEach(function(node, i) {
					if (i % 2) {
						dojo.addClass(node, "darkTreeTableRow");
						dojo.removeClass(node, "lightTreeTableRow");
					} else {
						dojo.addClass(node, "lightTreeTableRow");
						dojo.removeClass(node, "darkTreeTableRow");
					}
				});
			},
			labelColumnIndex: 0
		};
		return SitesRenderer;
	}());
	
	var ViewOnSiteTreeModel = (function() {
		function createModelItems(siteConfigurations, isRunningOns) {
			function ViewOnSiteModelItem(siteConfig, isFileRunningOn) {
				this.SiteConfiguration = siteConfig;
				this.Id = "ViewOnSite" + siteConfig.Id;
				// Model keeps track of whether the file is available on this site configuration
				this.IsFileRunningOn = isFileRunningOn;
			}
			var modelItems = [];
			modelItems.push(
				{	Id: "newsite",
					Placeholder: true
				});
			for (var i=0; i < siteConfigurations.length; i++) {
				modelItems.push(new ViewOnSiteModelItem(siteConfigurations[i], isRunningOns[i]));
			}
			return modelItems;
		}
		/** @returns {Deferred} */
		function isFileRunningOnSite(siteService, site, file) {
			return siteService.isFileMapped(site, file).then(function(isFileMapped) {
				var isStarted = site.HostingStatus && site.HostingStatus.Status === "started";
				return site && file && isStarted && isFileMapped;
			});
		}
		/**
		 * @param {Object} file
		 */
		function ViewOnSiteTreeModel(siteService, id, file) {
			SiteTreeModel.call(this, siteService, id);
			this._file = file;
		}
		ViewOnSiteTreeModel.prototype = {
			getRoot: SiteTreeModel.prototype.getRoot,
			getId: SiteTreeModel.prototype.getId,
			getChildren: function(parentItem, onComplete) {
				if (parentItem.children) {
					onComplete(parentItem.children);
				} else if (parentItem === this._root) {
					var self = this;
					ViewOnSiteTreeModel.createViewOnSiteModelItems(self._siteService, self._file).then(function(modelItems) {
						parentItem.children = modelItems;
						onComplete(modelItems);
					});
				} else {
					onComplete([]);
				}
			}
		};
		/** @returns {Deferred} */
		ViewOnSiteTreeModel.createViewOnSiteModelItems = function(siteService, file) {
			return siteService.getSiteConfigurations().then(function(siteConfigurations) {
				return new Deferred().all(siteConfigurations.map(function(site) {
					return isFileRunningOnSite(siteService, site, file);
				})).then(function(isRunningOns) {
					return createModelItems(siteConfigurations, isRunningOns);
				});
			});
		};
		return ViewOnSiteTreeModel;
	}());
	
	var ViewOnSiteRenderer = (function() {
		/**
		 * @param {Object} options.file
		 * @param {Function} options.addToCallback
		 * @param {Function} options.errorCallback
		 */
		function ViewOnSiteRenderer(options) {
			SitesRenderer.apply(this, Array.prototype.slice.call(arguments));
			this.serviceRegistry = options.serviceRegistry;
			this.file = options.file;
			this.addToCallback = options.addToCallback;
			this.errorCallback = options.errorCallback;
		}
		ViewOnSiteRenderer.prototype = {
			initTable: function (tableNode, tableTree) {
				this.tableTree = tableTree;
				dojo.addClass(tableNode, "treetable");
				var thead = dojo.create("thead", null);
				dojo.create("th", {innerHTML: "Name"}, thead, "last");
				dojo.create("th", {innerHTML: "Actions"}, thead, "last");
				tableNode.appendChild(thead);
			},
			render: function(item, tableRow) {
				var siteConfig = item.SiteConfiguration;
				dojo.addClass(tableRow, "treeTableRow sitesTableRow");
				if (item.Placeholder) {
					dojo.addClass(tableRow, "newSiteRow");
				}
				var siteConfigCol = dojo.create("td", {id: tableRow.id + "col1"});
				var actionCol = dojo.create("td", {id: tableRow.id + "col2"});
				
				// Site config column
				var name = item.Placeholder ? "New Site" : siteConfig.Name;
				dojo.place(document.createTextNode(name), siteConfigCol, "last");

				// Action column
				var actionsWrapper = dojo.create("span", {id: tableRow.id + "actionswrapper"}, actionCol, "only");

				var userData = {
					file: this.file,
					addToCallback: this.addToCallback,
					errorCallback: this.errorCallback
				};
				this._commandService.renderCommands("viewOnSiteScope", actionsWrapper, item,  null /*handler*/, "tool", userData);

				dojo.place(siteConfigCol, tableRow, "last");
				dojo.place(actionCol, tableRow, "last");
			},
			rowsChanged: SitesRenderer.prototype.rowsChanged,
			labelColumnIndex: 0
		};
		return ViewOnSiteRenderer;
	}());

	/**
	 * @param {orion.sites.SiteService} options.siteService
	 * @param {String} options.id
	 * @param {DomNode} options.parent
	 * @param {orion.sites.SiteTreeModel} [options.model]
	 * @param {orion.sites.SitesRenderer} [options.renderer]
	 * @class
	 * @private
	 */
	SitesTree = (function() {
		function SitesTree(options) {
			this.siteService = options.siteService;
			var model = this.model = options.model || new SiteTreeModel(this.siteService, options.id);
			this.treeWidget = new TableTree({
				id: options.id,
				parent: options.parent,
				model: model,
				showRoot: false,
				renderer: options.renderer || new SitesRenderer(options)
			});
		}
		SitesTree.prototype = {
			refresh: function() {
				var self = this;
				this.siteService.getSiteConfigurations().then(function(siteConfigs) {
					self.treeWidget.refresh(self.model._id, siteConfigs, true);
				});
			}
		};
		return SitesTree;
	}());

	/**
	 * @name orion.sites.ViewOnSiteTree
	 * @class A tree widget that displays a list of sites that a file can be viewed on.
	 * @param {orion.serviceregistry.ServiceRegistry} options.serviceRegistry
	 * @param {String} options.fileLocation
	 *
	 * @param {String} options.id
	 * @param {DomNode} options.parent
	 * @param {orion.sites.SiteTreeModel} [options.model]
	 * @param {orion.sites.SitesRenderer} [options.renderer]
	 */
	ViewOnSiteTree = (function() {
		function ViewOnSiteTree(options) {
			var serviceRegistry = options.serviceRegistry;
			var commandService = serviceRegistry.getService("orion.page.command");
			var siteService = mSiteClient.forFileLocation(serviceRegistry, options.fileLocation);
			var self = this;
			serviceRegistry.getService("orion.core.file").read(options.fileLocation, true).then(function(file) {
				options.siteService = siteService;
				options.model = new ViewOnSiteTreeModel(siteService, options.id, file);
				options.file = self.file = file;

				// TODO should this be done by glue code?
				commandService.registerCommandContribution("viewOnSiteScope", "orion.site.add-to", 10);
				commandService.registerCommandContribution("viewOnSiteScope", "orion.site.view-on-link", 20);

				options.addToCallback = function() {
					self.refresh();
				};
				options.errorCallback = function(err) {
					options.serviceRegistry.getService('orion.page.message').setErrorMessage(err);
				};

				options.renderer = new ViewOnSiteRenderer(options);
				SitesTree.call(self, options);
			});
		}
		ViewOnSiteTree.prototype = /** @lends orion.sites.ViewOnSiteTree.prototype */ {
			refresh: function() {
				// TODO call helper for this
				var self = this;
				ViewOnSiteTreeModel.createViewOnSiteModelItems(self.siteService, self.file).then(
					function(modelItems) {
						self.treeWidget.refresh(self.model._id, modelItems, true);
					});
			}
		};
		return ViewOnSiteTree;
	}());

	return {
		SiteServicesExplorer: SiteServicesExplorer,
		ViewOnSiteTree: ViewOnSiteTree
	};
});