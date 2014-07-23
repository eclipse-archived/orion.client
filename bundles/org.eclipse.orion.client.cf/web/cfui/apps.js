 /*******************************************************************************
 * @license
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2014. All Rights Reserved. 
 * 
 * Note to U.S. Government Users Restricted Rights:  Use, 
 * duplication or disclosure restricted by GSA ADP Schedule 
 * Contract with IBM Corp.
 *******************************************************************************/
 /*global define window document*/
define(['require', 'orion/webui/littlelib', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commandRegistry', 'orion/commands', 'orion/keyBinding', 'orion/dialogs', 'orion/selection',
		'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/globalCommands', 'orion/links',
		'orion/cfui/cFClient', 'orion/Deferred', 'cfui/autodeploy/widgets/CfLoginDialog',
		'orion/section', 'orion/explorers/explorer', 'cfui/cfUtil', 'cfui/cfCommands', 'orion/URITemplate', 'orion/PageLinks'],
		function(require, lib, mBootstrap, mStatus, mProgress, CommandRegistry, Commands, KeyBinding, mDialogs, mSelection,
			mFileClient, mOperationsClient, mSearchClient, mGlobalCommands, mLinks, 
			mCFClient, Deferred, CfLoginDialog, mSection, mExplorer, mCfUtil, mCfCommands, URITemplate, PageLinks) {

mBootstrap.startup().then(function(core) {
	
	var serviceRegistry = core.serviceRegistry;
	var preferences = core.preferences;
	var pluginRegistry = core.pluginRegistry;

	new mDialogs.DialogService(serviceRegistry);
	var selection = new mSelection.Selection(serviceRegistry, "orion.CloudFoundry.selection");
	var commandRegistry = new CommandRegistry.CommandRegistry({selection: selection});
	var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
	new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient, commandRegistry);

	// ...
	var linkService = new mLinks.TextLinkService({serviceRegistry: serviceRegistry});
	var fileClient = new mFileClient.FileClient(serviceRegistry);
	var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandRegistry, fileService: fileClient});
	var cFService = new mCFClient.CFService(serviceRegistry);
		
	mGlobalCommands.generateBanner("cfView", serviceRegistry, commandRegistry, preferences, searcher, {});
	
	mGlobalCommands.setPageTarget({task: 'Cloud Foundry Applications', serviceRegistry: serviceRegistry, commandService: commandRegistry});
	
	var orgsNode = document.getElementById("orgsNode");
	var applicationsNode = document.getElementById("applicationsTable");
	var orphanRoutesNode = document.getElementById("orphanRoutesTable");
	
	function promptLogin(cFService) {
		var deferred = new Deferred();
		function loginFunc(user, password){
			progressService.showWhile(cFService.login(user, password), "Logging in to Cloud Foundry").then(function (result) {
				deferred.resolve(result);					
			}, function(error) {
				deferred.reject(error);					
			});
		}
		
		(new CfLoginDialog({func: loginFunc})).show();
		return deferred;
	}
	
	function handleError(error){
		if(error.responseText){
			try{
				error = JSON.parse(error.responseText);
			} catch (e){
				error = {Message: error.responseText, HttpCode: error.status};
			}
		}
		if(error.HttpCode && error.HttpCode === 401){
			promptLogin(cFService).then(
				function(){
					displayOrgsAndSpaces();
				},
				handleError
			);
		} else {
			progressService.setProgressResult(error);
		}
	}
	
	function getUrlLinkNode(url, name){
		if(!name){
			name = url;
		}
		var a = document.createElement("a");
		a.target = "_new";
		a.href = url.indexOf("://")<0 ? "http://" + url : url;
		a.title = url;
		a.appendChild(document.createTextNode(name));
		return a;
	}
	
	function displayOrgsAndSpaces(){
		progressService.showWhile(mCfUtil.getTarget(preferences), "Checking for Cloud Foundry settings").then(function(target){
			progressService.showWhile(cFService.getOrgs(target), "Listing organizations").then(function(result){
				
				var table = document.createElement("table");
				table.className = "centerTable";
				var tr1 = document.createElement("tr");
				table.appendChild(tr1);
				
					var td1 = document.createElement("td");
					td1.className = "orgsLabel";
					td1.id = "orgsLabel";
					var label = document.createElement("label");
					label.appendChild(document.createTextNode("Organization:"));
					td1.appendChild(label);
					tr1.appendChild(td1);

					var td2 = document.createElement("td");
					td2.className = "orgsSelect";
					td2.id = "orgsDropdown";
					var orgsDropdown = document.createElement("select");
					result.Orgs.forEach(function(org){
						var option = document.createElement("option");
						option.appendChild(document.createTextNode(org.Name));
						option.org = org;
						orgsDropdown.appendChild(option);
					});
					
					orgsDropdown.onchange = function(event){
						var selectedOrg = event.target.selectedOptions[0].org;
						loadTargets(selectedOrg);
					};
					
					td2.appendChild(orgsDropdown);
					tr1.appendChild(td2);
					
					var tr2 = document.createElement("tr");
					table.appendChild(tr2);
					
					td1 = document.createElement("td");
					td1.className = "orgsLabel";
					td1.id = "spacesLabel";
					var label = document.createElement("label");
					label.appendChild(document.createTextNode("Space:"));
					td1.appendChild(label);
					tr2.appendChild(td1);

					td2 = document.createElement("td");
					td2.className = "orgsSelect";
					td2.id = "spacesDropdown";
					var spacesDropdown = document.createElement("select");
					
					if(result.Orgs && result.Orgs.length>0){
						loadTargets(result.Orgs[0]);
					}
					
					spacesDropdown.onchange = function(event){
						var selectedSpace = event.target.selectedOptions[0].space;
						target.Space = selectedSpace.Name;
						target.Org = selectedSpace.Org.Name;
						displayApplications(target);
					};
					
					td2.appendChild(spacesDropdown);
					tr2.appendChild(td2);
					
					function loadTargets(org){
						org.Spaces.forEach(function(space){
							var option = document.createElement("option");
							space.Org = org;
							option.appendChild(document.createTextNode(space.Name));
							option.space = space;
							spacesDropdown.appendChild(option);
						});
						if(org.Spaces.length > 0){
							var selectedSpace = org.Spaces[0];
							target.Space = selectedSpace.Name;
							target.Org = selectedSpace.Org.Name;
							displayApplications(target);
						}
					}
					orgsNode.appendChild(table);

			}.bind(this),
			function(error){
				handleError(error);
			});
		}.bind(this),
		function(error){
			handleError(error);
		});
	}
	
	function ApplicationsRenderer (options) {
		this._init(options);
	}
	ApplicationsRenderer.prototype = new mExplorer.SelectionRenderer(); 
	ApplicationsRenderer.prototype.constructor = ApplicationsRenderer;
	ApplicationsRenderer.prototype.getLabelColumnIndex = function() {
		return 0;
	};
	
	ApplicationsRenderer.prototype.emptyCallback = function(bodyElement){
		var tr = document.createElement("tr");
		var td = document.createElement("td");
		td.appendChild(document.createTextNode("You have no applications in this space"));
		tr.appendChild(td);
		bodyElement.appendChild(tr);
	};
	
	ApplicationsRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		
			var col = document.createElement("td"); //$NON-NLS-0$
			var span = document.createElement("span"); //$NON-NLS-0$
			span.id = tableRow.id+"navSpan"; //$NON-NLS-0$
			col.appendChild(span);
			span.className = "mainNavColumn singleNavColumn"; //$NON-NLS-0$
			var val = "";
		
		if(item.Type === "Route"){
			switch (col_no) {
				case 0:
					span.appendChild(getUrlLinkNode(item.host + "." + item.domain.name));
					return col;
				case 1:
				case 2:
					val = "";
					break;
				default:
					return null;
			}
		} else {
			switch(col_no){
				case 0:
					this.getExpandImage(tableRow, span);
					if(item.urls && item.urls.length>0){
						span.appendChild(getUrlLinkNode(item.urls[0], item.name));
						return col;
					}
					
					val = item.name;
					break;
				case 1:
					var a = document.createElement("a");
					a.target = "_new";
					var uriTemplate = new URITemplate("{+OrionHome}/cfui/logs.html#{Name,Target*}");
					a.href = uriTemplate.expand({OrionHome : PageLinks.getOrionHome(), Name: item.name, Target: item.parent.Target});
					a.appendChild(document.createTextNode("Logs"));
					span.appendChild(a);	
					return col;
				case 2:
				col.classList.add("secondaryColumnRight");
				if(item.state === "STARTED"){
					span.className = "imageSprite core-sprite-applicationrunning";
					span.title = (typeof item.instances !== "undefined" && typeof item.running_instances !== "undefined") ? ( item.running_instances + " of " + item.instances + " instances running") : "Started";
					return col;
				} else if(item.state==="STOPPED"){
					span.className = "imageSprite core-sprite-applicationstopped";
					span.title = (typeof item.instances !== "undefined" && typeof item.running_instances !== "undefined") ? ( item.running_instances + " of " + item.instances + " instances running") : "Stopped";
					return col;
				} else if(item.state==="NOT_DEPLOYED"){
					span.className = "imageSprite core-sprite-applicationnotdeployed";
					span.title = "Not deployed";
					return col;
				} else if(item.state==="PROGRESS"){
					span.className = "imageSprite core-sprite-progress";
					span.title = "Checking application state";
					return col;
				} else {
					span.appendChild(document.createTextNode("State unknown"));
					return col;
				}
					
					break;
				default:
					return null;
			}
		}
		
		span.appendChild(document.createTextNode(val));
		return col;
	};
	
	function ApplicationsModel(apps, target){
		this.apps = apps;
		this.apps.Target = target;
	}
	
	ApplicationsModel.prototype = {
		constructor: ApplicationsModel,
		getRoot: function(onItem){
			onItem(this.apps);
		},
		decorateChildren: function(item, children, type){
			if(!children){
				return;
			}
			children.forEach(function(child){
				child.Type = type;
				child.parent = item;
			});
		},
		getChildren: function(item, onItem){
			if(item.apps){
				if(!item.children){
					this.decorateChildren(item, item.apps, "App");
					item.children = item.apps;
				}
				return onItem(item.apps);
			}
			if(!item.children){
				this.decorateChildren(item, item.routes, "Route");
				item.children = item.routes;
			}
			return onItem(item.routes);
		},
		getId: function(item){
			if(!item){
				return "rootApps";
			}
			return item.guid;
		},
		destroy: function(){}
	};
	
	var explorer = new mExplorer.Explorer(
			serviceRegistry,
			selection,
		new ApplicationsRenderer({checkbox: false, singleSelection: true,	treeTableClass: "sectionTreeTable",	cachePrefix: "CfExplorer"}),
				commandRegistry);
	
	mCfCommands.createCfCommands(serviceRegistry, commandRegistry, explorer);

	function displayApplications(target){
		
		lib.empty(applicationsNode);
		lib.empty(orphanRoutesNode);
		
		var applicationsSection = new mSection.Section(applicationsNode, {
							id: "applicationsSection", //$NON-NLS-0$
							title: "Applications",
							slideout: true,
							canHide: false,
							preferenceService: preferences,
							keepHeader: true,
							headerClass: ["sectionTreeTableHeader"]
						}); 
						
		progressService.showWhile(cFService.getApps(target), "Listing applications").then(function(apps){
			
			var explorerParent = document.createElement("div");
			explorerParent.id = "applicationsSectionParent";
			explorer.parent = explorerParent;
				
			var model = new ApplicationsModel(apps, target);
			
			applicationsSection.embedExplorer(explorer);
			
			explorer.createTree(explorerParent, model, {});
			
			progressService.showWhile(cFService.getRoutes(target), "Loading routes").then(function(routes){
				
			displayOrphanRoutes(routes, apps, target);
			
			}, function(error){
				handleError(error);
			});
		}, handleError);
	}
	
	
	function OrphanRoutesRenderer(options){
		this._init(options);
	}
	OrphanRoutesRenderer.prototype = new mExplorer.SelectionRenderer(); 
	OrphanRoutesRenderer.prototype.constructor = OrphanRoutesRenderer;
	OrphanRoutesRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		
		var col = document.createElement("td"); //$NON-NLS-0$
		var span = document.createElement("span"); //$NON-NLS-0$
		span.id = tableRow.id+"navSpan"; //$NON-NLS-0$
		col.appendChild(span);
		span.className = "mainNavColumn singleNavColumn"; //$NON-NLS-0$
		var val = "";
	
		switch (col_no) {
			case 0:
				span.appendChild(getUrlLinkNode(item.Host + "." + item.DomainName));
				return col;
			default:
				return null;
		}
		
		span.appendChild(document.createTextNode(val));
		return col;
	};
	
	OrphanRoutesRenderer.prototype.emptyCallback = function(bodyElement){
		var tr = document.createElement("tr");
		var td = document.createElement("td");
		td.appendChild(document.createTextNode("You have no orphan routes in this space"));
		tr.appendChild(td);
		bodyElement.appendChild(tr);
	};
	
	var routesSelection = new mSelection.Selection(serviceRegistry, "orion.Routes.selection");
	var routesExplorer = new mExplorer.Explorer(
			serviceRegistry,
			routesSelection,
	new OrphanRoutesRenderer({checkbox: false, singleSelection: true,	treeTableClass: "sectionTreeTable",	cachePrefix: "OrphanRoutesExplorer"}),
				commandRegistry);
				
	mCfCommands.createRoutesCommands(serviceRegistry, commandRegistry, routesExplorer);
		
	function displayOrphanRoutes(routes, apps, target){
		
		lib.empty(orphanRoutesNode);
			
		var orphanRoutesSection = new mSection.Section(orphanRoutesNode, {
			id: "orphanRoutes", //$NON-NLS-0$
			title: "Orphan Routes",
			slideout: true,
			canHide: false,
			preferenceService: preferences,
			keepHeader: true,
			headerClass: ["sectionTreeTableHeader"]
		});
		
		var actionsNodeScope = orphanRoutesSection.actionsNode.id;
		commandRegistry.registerCommandContribution(actionsNodeScope, "orion.cf.CreateRoute", 1000); //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.renderCommands(actionsNodeScope, actionsNodeScope, target, this, "button"); //$NON-NLS-0$
		
		var explorerParent = document.createElement("div");
		explorerParent.id = "orphanRoutesParent";
		routesExplorer.parent = explorerParent;
		
		var orphanRoutes = [];
		
		if(routes && routes.Routes){
			routes.Routes.forEach(function(route){
				if(apps.apps.every(function(app){
					return app.routes.every(function(appRoute){
						return appRoute.guid !== route.Guid;
					});
				})){
					 orphanRoutes.push(route);
				}
			});
		}
		
		var routesModel = new mExplorer.ExplorerFlatModel(null, null, orphanRoutes);
		routesModel.getId = function(item){return item.Guid;};
		
		orphanRoutesSection.embedExplorer(routesExplorer);
		
		routesExplorer.createTree(explorerParent, routesModel, {});
		
	}
	
	displayOrgsAndSpaces();
	
	});

//end of define
});

