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
/*jslint sub:true*/
define(['i18n!orion/sites/nls/messages', 'orion/i18nUtil', 'dojo', 'orion/Deferred', 'orion/commands', 'orion/globalCommands',
		'orion/selection', 'orion/sites/siteUtils', 'orion/sites/siteClient', 'orion/sites/siteCommands', 'orion/treetable'],
		function(messages, i18nUtil, dojo, Deferred, mCommands, mGlobalCommands, mSelection, mSiteUtils, mSiteClient, mSiteCommands, treetable) {
	var formatMessage = i18nUtil.formatMessage;
	var TableTree = treetable.TableTree;
	var ViewOnSiteTree;

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
			this._commandService = options.serviceRegistry.getService("orion.page.command"); //$NON-NLS-0$
			this._options = options;
		}
		SitesRenderer.prototype = /** @lends orion.sites.SitesRenderer.prototype */{
			initTable: function (tableNode, tableTree) {
				dojo.addClass(tableNode, "treetable");
			},
			render: function(item, tableRow) {
				dojo.addClass(tableRow, "treeTableRow sitesTableRow"); //$NON-NLS-0$
				
				var siteConfigCol = dojo.create("td", {id: tableRow.id + "col1"}); //$NON-NLS-1$ //$NON-NLS-0$
				var actionCol = dojo.create("td", {id: tableRow.id + "col4"}); //$NON-NLS-1$ //$NON-NLS-0$
				
				// Site config column
				var href = mSiteUtils.generateEditSiteHref(item);
				var nameLink = dojo.create("a", {href: href}, siteConfigCol, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				dojo.place(document.createTextNode(item.Name), nameLink, "last"); //$NON-NLS-0$
				
				var statusField = dojo.create("span", {"style" : "padding-left:10px; padding-right:10px"}, siteConfigCol, "last");
				
				// Status, URL columns
				var status = item.HostingStatus;
				if (typeof status === "object") { //$NON-NLS-0$
					if (status.Status === "started") { //$NON-NLS-0$
						dojo.place(document.createTextNode(messages["Started"]), statusField, "last"); //$NON-NLS-1$
						var link = dojo.create("a", null, siteConfigCol, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						dojo.place(document.createTextNode(status.URL), link, "last"); //$NON-NLS-0$
						link.href = status.URL;
					} else {
						var statusString = status.Status.substring(0,1).toUpperCase() + status.Status.substring(1);
						dojo.place(document.createTextNode(statusString), statusField, "last"); //$NON-NLS-0$
					}
				} else {
					dojo.place(document.createTextNode(messages["Unknown"]), statusField, "last"); //$NON-NLS-1$
				}
				
				// Action column
				var actionsWrapper = dojo.create("span", {id: tableRow.id + "actionswrapper", "class":"sectionTableItemActions"}, actionCol, "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				var options = this._options;
				var userData = {
					startCallback: options.startCallback,
					stopCallback: options.stopCallback,
					deleteCallback: options.deleteCallback,
					errorCallback: function(err) {
						options.serviceRegistry.getService('orion.page.message').setProgressResult(err); //$NON-NLS-0$
					}
				};
				this._commandService.renderCommands(options.actionScopeId, actionsWrapper, item, null /*handler*/, "tool", userData); //$NON-NLS-0$
				
				dojo.place(siteConfigCol, tableRow, "last"); //$NON-NLS-0$
				dojo.place(actionCol, tableRow, "last"); //$NON-NLS-0$
			},
			rowsChanged: function() {
				dojo.query(".treeTableRow").forEach(function(node, i) { //$NON-NLS-0$
					if (i % 2) {
						dojo.addClass(node, "darkTreeTableRow"); //$NON-NLS-0$
						dojo.removeClass(node, "lightTreeTableRow"); //$NON-NLS-0$
					} else {
						dojo.addClass(node, "lightTreeTableRow"); //$NON-NLS-0$
						dojo.removeClass(node, "darkTreeTableRow"); //$NON-NLS-0$
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
				this.Id = "ViewOnSite" + siteConfig.Id; //$NON-NLS-0$
				// Model keeps track of whether the file is available on this site configuration
				this.IsFileRunningOn = isFileRunningOn;
			}
			var modelItems = [];
			modelItems.push(
				{	Id: "newsite", //$NON-NLS-0$
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
				var isStarted = site.HostingStatus && site.HostingStatus.Status === "started"; //$NON-NLS-0$
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
				return Deferred.all(siteConfigurations.map(function(site) {
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
				dojo.addClass(tableNode, "treetable"); //$NON-NLS-0$
				var thead = dojo.create("thead", null); //$NON-NLS-0$
				var nameCol = dojo.create("th", null, thead, "last"); //$NON-NLS-2$ //$NON-NLS-0$
				var actionsCol = dojo.create("th", null, thead, "last"); //$NON-NLS-2$ //$NON-NLS-0$
				nameCol.textContent = messages['Name'];
				actionsCol.textContent = messages['Actions'];
				tableNode.appendChild(thead);
			},
			render: function(item, tableRow) {
				var siteConfig = item.SiteConfiguration;
				dojo.addClass(tableRow, "treeTableRow sitesTableRow"); //$NON-NLS-0$
				if (item.Placeholder) {
					dojo.addClass(tableRow, "newSiteRow"); //$NON-NLS-0$
				}
				var siteConfigCol = dojo.create("td", { //$NON-NLS-0$
					id: tableRow.id + "col1", //$NON-NLS-0$
					className: item.Placeholder ? "newSiteCol" : ""}); //$NON-NLS-0$ //$NON-NLS-1$
				var actionCol = dojo.create("td", {id: tableRow.id + "col2"}); //$NON-NLS-1$ //$NON-NLS-0$
				
				// Site config column
				var name = item.Placeholder ? messages["New Site"] : siteConfig.Name;
				dojo.place(document.createTextNode(name), siteConfigCol, "last"); //$NON-NLS-0$

				// Action column
				var actionsWrapper = dojo.create("span", {id: tableRow.id + "actionswrapper"}, actionCol, "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

				var userData = {
					file: this.file,
					addToCallback: this.addToCallback,
					errorCallback: this.errorCallback
				};
				this._commandService.renderCommands("viewOnSiteScope", actionsWrapper, item,  null /*handler*/, "button", userData); //$NON-NLS-1$ //$NON-NLS-0$

				dojo.place(siteConfigCol, tableRow, "last"); //$NON-NLS-0$
				dojo.place(actionCol, tableRow, "last"); //$NON-NLS-0$
			},
			rowsChanged: SitesRenderer.prototype.rowsChanged,
			labelColumnIndex: 0
		};
		return ViewOnSiteRenderer;
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
	ViewOnSiteTree = /** @ignore */ (function() {
		function ViewOnSiteTree(options) {
			var serviceRegistry = options.serviceRegistry;
			var commandService = serviceRegistry.getService("orion.page.command"); //$NON-NLS-0$
			var siteService = this.siteService = mSiteClient.forFileLocation(serviceRegistry, options.fileLocation);
			serviceRegistry.getService("orion.core.file").read(options.fileLocation, true).then(function(file) { //$NON-NLS-0$
				options.siteService = siteService;
				options.model = new ViewOnSiteTreeModel(siteService, options.id, file);
				options.file = this.file = file;

				// TODO should this be done by glue code?
				commandService.registerCommandContribution("viewOnSiteScope", "orion.site.add-to", 10); //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution("viewOnSiteScope", "orion.site.view-on-link", 20); //$NON-NLS-1$ //$NON-NLS-0$

				mGlobalCommands.setPageTarget({
						task: messages.ViewOnSiteTitle,
						target: file,
						serviceRegistry: serviceRegistry,
						commandService: commandService});

				var self = this;
				options.addToCallback = function() {
					self.refresh();
				};
				options.errorCallback = function(err) {
					options.serviceRegistry.getService('orion.page.message').setErrorMessage(err); //$NON-NLS-0$
				};

				options.renderer = new ViewOnSiteRenderer(options);
				if (options.label) {
					dojo.byId(options.label).textContent = formatMessage(messages.ViewOnSiteCaption, file.Name);
				}

				// Create tree widget
				var model = this.model = options.model || new SiteTreeModel(siteService, options.id);
				this.treeWidget = new TableTree({
					id: options.id,
					parent: options.parent,
					model: model,
					showRoot: false,
					renderer: options.renderer || new SitesRenderer(options)
				});
			}.bind(this));
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

	return ViewOnSiteTree;
});