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
define(['i18n!orion/sites/nls/messages', 'orion/i18nUtil', 'dojo', 'orion/explorers/explorer', 'orion/Deferred', 'orion/commands', 'orion/section', 'orion/globalCommands',
		'orion/selection', 'orion/sites/siteUtils', 'orion/explorers/navigationUtils', 'orion/sites/siteClient', 'orion/sites/siteCommands', 'orion/treetable'],
		function(messages, i18nUtil, dojo, mExplorer, Deferred, mCommands, mSection, mGlobalCommands, mSelection, mSiteUtils, mNavUtils, mSiteClient, mSiteCommands, treetable) {
	var SiteServicesExplorer, SitesRenderer, SiteTreeModel;

	/** 
	 * Generates an explorer showing the sites on each site service.
	 * 
	 * @param {orion.serviceregistry.ServiceRegistry} options.serviceRegistry
	 * @param registry [required] service registry
	 * @param selection [required] selection service
	 * @param parentId [required] parent node id
	 * @returns SiteServicesExplorer object
	 */
	SiteServicesExplorer = (function() {
		
		function SiteServicesExplorer(registry, selection, parentId) {
			this.registry = registry;
			this.checkbox = false;
			this.parentId = parentId;
			this.selection = selection;
			
			this.pageActionsWrapperId = "pageActions";
			this.selectionActionsWrapperId = "selectionTools";
			this.defaultActionWrapperId = "DefaultActionWrapper";
		}
		
		SiteServicesExplorer.prototype = new mExplorer.Explorer();
		
		SiteServicesExplorer.prototype._updatePageActions = function(registry, item){
			var toolbar = dojo.byId(this.pageActionsWrapperId);
			var commandService = registry.getService("orion.page.command");  //$NON-NLS-0$
			if (toolbar) {
				commandService.destroy(toolbar);
			} else {
				throw "could not find toolbar " + this.pageActionsWrapperId; //$NON-NLS-0$
			}
			commandService.renderCommands(this.pageActionsWrapperId, toolbar, item, this, "button", this.getRefreshHandler());  //$NON-NLS-0$
		};
		
		SiteServicesExplorer.prototype._getSiteConfigurations = function(siteServices, result, deferred){
			var that = this;
			
			if (!deferred)
				deferred = new dojo.Deferred();
			
			if (!result)
				result = [];
			
			if (siteServices.length > 0) {
				siteServices[0].getSiteConfigurations().then(
					function(/**Array*/ siteConfigurations) {
						var item = {};
						item.siteService = siteServices[0];
						item.siteConfigurations = siteConfigurations;
						
						result.push(item);
						that._getSiteConfigurations(siteServices.slice(1), result, deferred);
					}
				);					
			} else {
				deferred.callback(result);
			}
			
			return deferred;
		};
		
		SiteServicesExplorer.prototype.display = function(){
			var that = this;
			
			var progressService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
			var loadingDeferred = new dojo.Deferred();
			progressService.showWhile(loadingDeferred, messages['Loading...']);
			
			var siteServiceRefs = this.registry.getServiceReferences('orion.site'); //$NON-NLS-0$

			this.siteClients = [];
			for (var i=0; i < siteServiceRefs.length; i++) {
				var siteServiceRef = siteServiceRefs[i];
				var siteService = this.registry.getService(siteServiceRef);
				this.siteClients.push(new mSiteClient.SiteClient(this.registry, siteService, siteServiceRef));
			}

			this._getSiteConfigurations(this.siteClients).then(
				function(siteConfigurations){
					that.renderer = new SitesRenderer({registry: that.registry, actionScopeId: "sdsd", cachePrefix: "SitesExplorer", checkbox: false}, that); //$NON-NLS-0$

					var commandService = that.registry.getService('orion.page.command'); //$NON-NLS-0$
					
					commandService.registerCommandContribution(that.pageActionsWrapperId, 'orion.site.create', 100); //$NON-NLS-0$
					
					commandService.registerCommandContribution(that.selectionActionsWrapperId, 'orion.site.start', 20); //$NON-NLS-0$
					commandService.registerCommandContribution(that.selectionActionsWrapperId, 'orion.site.stop', 30); //$NON-NLS-0$
					commandService.registerCommandContribution(that.selectionActionsWrapperId, 'orion.site.delete', 40); //$NON-NLS-0$
					
					commandService.registerCommandContribution(that.defaultActionWrapperId, 'orion.site.start', 20); //$NON-NLS-0$
					commandService.registerCommandContribution(that.defaultActionWrapperId, 'orion.site.stop', 30); //$NON-NLS-0$
					
					for (var i=0; i<siteConfigurations.length; i++){
						
						if	(siteConfigurations.length > 1){
							var titleWrapper = new mSection.Section(dojo.byId(that.parentId), {
								id: siteConfigurations[i].siteService._id + "_Section", //$NON-NLS-0$
								title: siteConfigurations[i].siteService._name,
								content: '<div id="' + siteConfigurations[i].siteService._id + '_Node" class="mainPadding"></list>', //$NON-NLS-1$ //$NON-NLS-0$
								canHide: true
							});
						} else {
							var contentParent = dojo.create("div", {"role": "region", "class":"sectionTable"}, dojo.byId(that.parentId), "last");
							contentParent.innerHTML = '<div id="' + siteConfigurations[i].siteService._id + '_Node" class="mainPadding"></div>'; //$NON-NLS-1$ //$NON-NLS-0$
						}
					
						that.createTree(siteConfigurations[i].siteService._id + "_Node", new SiteTreeModel(siteConfigurations[i].siteConfigurations), {setFocus: true});
					}
					
					// TODO should show Create per each site service
					that._updatePageActions(that.registry, siteServiceRefs[0]); //$NON-NLS-1$ //$NON-NLS-0$
					
					if (!that.doOnce){
						that.registry.getService("orion.page.selection").addEventListener("selectionChanged", function(event) { //$NON-NLS-1$ //$NON-NLS-0$
							var selectionTools = dojo.byId(that.selectionActionsWrapperId);
							if (selectionTools) {
								commandService.destroy(selectionTools);						
								commandService.renderCommands(that.selectionActionsWrapperId, selectionTools, event.selections, that, "button", that.getRefreshHandler()); //$NON-NLS-1$ //$NON-NLS-0$
							}
						});
						
						that.doOnce = true;
					}
					
					loadingDeferred.callback();
					progressService.setProgressMessage("");
				}
			);
		};
		
		SiteServicesExplorer.prototype.getRefreshHandler = function(){
			return {
				startCallback: dojo.hitch(this, this.refresh),
				stopCallback: dojo.hitch(this, this.refresh),
				deleteCallback: dojo.hitch(this, this.refresh),
				errorCallback: dojo.hitch(this, this.refresh)
			};
		};
		
		SiteServicesExplorer.prototype.refresh = function(){
			var that = this;

			this._getSiteConfigurations(this.siteClients).then(
				function(siteConfigurations){
					for (var i=0; i<siteConfigurations.length; i++){
						dojo.empty(siteConfigurations[i].siteService._id + "_Node");
						that.createTree(siteConfigurations[i].siteService._id + "_Node", new SiteTreeModel(siteConfigurations[i].siteConfigurations), {setFocus: true});
					}
				}
			);
		};
		
		return SiteServicesExplorer;
	}());
	
	SitesRenderer = (function() {
		
		SitesRenderer.prototype = new mExplorer.SelectionRenderer();
		
		/**
		 * @name orion.sites.SitesRenderer
		 * @class A renderer for a list of site configurations obtained from a site service.
		 * @see orion.treetable.TableTree
		 * @private
		 */
		function SitesRenderer(options, explorer) {
			this._init(options);
			this.options = options;
			this.explorer = explorer;
			this.registry = options.registry;
		}
		
		SitesRenderer.prototype.getCellElement = function(col_no, item, tableRow){					
			switch(col_no){
				case 0:
					var td = document.createElement("td"); //$NON-NLS-0$
					var div = dojo.create( "div", {"class" : "sectionTableItem"}, td ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					
					var navGridHolder = this.explorer.getNavDict() ? this.explorer.getNavDict().getGridNavHolder(item, true) : null;
					
					// Site config column
					var href = mSiteUtils.generateEditSiteHref(item);
					var nameLink = dojo.create("a", {href: href}, div, "last"); //$NON-NLS-1$ //$NON-NLS-0$
					dojo.place(document.createTextNode(item.Name), nameLink, "last"); //$NON-NLS-0$
					mNavUtils.addNavGrid(this.explorer.getNavDict(), item, nameLink);
					
					var statusField = dojo.create("span", {"style" : "padding-left:10px; padding-right:10px"}, div, "last");
					
					// Status, URL columns
					var status = item.HostingStatus;
					if (typeof status === "object") { //$NON-NLS-0$
						if (status.Status === "started") { //$NON-NLS-0$
							dojo.place(document.createTextNode("(" + messages["Started"] + " "), statusField, "last"); //$NON-NLS-1$
							
							var link = dojo.create("a", null, statusField, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							dojo.place(document.createTextNode(status.URL), link, "last"); //$NON-NLS-0$
							mNavUtils.addNavGrid(this.explorer.getNavDict(), item, link);
							
							dojo.place(document.createTextNode(")"), statusField, "last");
							
							var inlineAction = dojo.create("span", {"style" : "padding-left:10px;"}, statusField, "last");
							this.registry.getService('orion.page.command').renderCommands("DefaultActionWrapper", inlineAction, item, this.explorer, "button", this.explorer.getRefreshHandler(), navGridHolder); //$NON-NLS-1$ //$NON-NLS-0$
							
							var statusString = "this site.";
							dojo.place(document.createTextNode(statusString), statusField, "last"); //$NON-NLS-0$
							
							link.href = status.URL;
						} else {
							var statusString = "(" + status.Status.substring(0,1).toUpperCase() + status.Status.substring(1) + ")";
							dojo.place(document.createTextNode(statusString), statusField, "last"); //$NON-NLS-0$
							
							var inlineAction = dojo.create("span", {"style" : "padding-left:10px"}, statusField, "last");
							this.registry.getService('orion.page.command').renderCommands("DefaultActionWrapper", inlineAction, item, this.explorer, "button", this.explorer.getRefreshHandler(), navGridHolder); //$NON-NLS-1$ //$NON-NLS-0$
							
							dojo.place(document.createTextNode("this site"), statusField, "last"); //$NON-NLS-0$
						}
					} else {
						dojo.place(document.createTextNode(messages["Unknown"]), statusField, "last"); //$NON-NLS-1$
					}
	
					return td;
				break;
			}
		};
				
		return SitesRenderer;
	}());
	
	SiteTreeModel = (function() {
		/**
		 * @name orion.sites.SiteTreeModel
		 * @class Tree model for powering a tree of site configurations.
		 * @see orion.treetable.TableTree
		 * @private
		 */
		function SiteTreeModel(siteConfigurations, id) {
			this._siteConfigurations = siteConfigurations;
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
					parentItem.children = this._siteConfigurations;
					onComplete(this._siteConfigurations);
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

	return SiteServicesExplorer;
});