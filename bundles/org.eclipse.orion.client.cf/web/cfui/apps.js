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
 /*eshint-env browser, amd*/
define(['i18n!cfui/nls/messages', 'orion/webui/littlelib', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commandRegistry',
 	'orion/dialogs', 'orion/selection', 'orion/fileClient', 'orion/operationsClient', 'orion/searchClient',
 	'orion/globalCommands', 'orion/links', 'orion/cfui/cFClient', 'orion/Deferred', 'orion/cfui/widgets/CfLoginDialog',
	'orion/section', 'cfui/cfUtil', 'cfui/cfCommands', 'cfui/cfExplorer'],
		function(messages, lib, mBootstrap, mStatus, mProgress, CommandRegistry,
			mDialogs, mSelection, mFileClient, mOperationsClient, mSearchClient,
			mGlobalCommands, mLinks, mCFClient, Deferred, CfLoginDialog,
			mSection, mCfUtil, mCfCommands, mCfExplorer) {

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
	
	mGlobalCommands.setPageTarget({task: messages["cloudApplications"], serviceRegistry: serviceRegistry, commandService: commandRegistry});
	
	var orgsNode = document.getElementById("orgsNode");
	var applicationsNode = document.getElementById("applicationsTable");
	var orphanRoutesNode = document.getElementById("orphanRoutesTable");
	
	var cfEventDispatcher = mCfCommands.getEventDispatcher();
	
	var _target;
	
	function promptLogin(cFService) {
		var deferred = new Deferred();
		function loginFunc(user, password){
			progressService.showWhile(cFService.login(_target.Url, user, password), messages["loggingInToCloudFoundry"]).then(function (result) {
				deferred.resolve(result);					
			}, function(error) {
				deferred.reject(error);					
			});
		}
		
		(new CfLoginDialog({func: loginFunc})).show();
		return deferred;
	}
	
	function handleError(error, url){
		if(error.responseText){
			try{
				error = JSON.parse(error.responseText);
			} catch (e){
				error = {Message: error.responseText, HttpCode: error.status};
			}
		}
		if(error.HttpCode && error.HttpCode === 401){
			promptLogin(cFService, url).then(
				function(){
					displayOrgsAndSpaces();
				},
				handleError
			);
		} else {
			progressService.setProgressResult(error);
		}
	}
	
	
	function displayOrgsAndSpaces(){
		lib.empty(orgsNode);

		progressService.showWhile(mCfUtil.getTargets(preferences), messages["checkingForCloudFoundrySettings"]).then(function(targets){
			_target = targets[0];
			
			var targetsDropdown;
			var orgsDropdown;
			var spacesDropdown;
			
			createDropdowns();
			loadAll();
			
			function createDropdowns() {
				var table = document.createElement("table");
				table.className = "centerTable";
				
				targetsDropdown = createDropdown("targetsLabel", "target:", "targetsDropdown", table);
				targetsDropdown.onchange = function(event){
					_target = event.target.selectedOptions[0].target;
					loadOrgs();
				};
				
				orgsDropdown = createDropdown("orgsLabel", "organization:", "orgsDropdown", table);
				orgsDropdown.onchange = function(event){
					loadSpaces(event.target.selectedOptions[0].org);
				};
				
				spacesDropdown = createDropdown("spacesLabel", "space:", "spacesDropdown", table);
				spacesDropdown.onchange = function(event){
					var selectedSpace = event.target.selectedOptions[0].space;
					_target.Space = selectedSpace.Name;
					_target.Org = selectedSpace.Org.Name;
					displayApplications(_target);
				};

				orgsNode.appendChild(table);
			}
			
			function disableDropdowns() {
				targetsDropdown.setAttribute("disabled", "disabled");
				orgsDropdown.setAttribute("disabled", "disabled");
				spacesDropdown.setAttribute("disabled", "disabled");
			}

			function enableDropdowns() {
				targetsDropdown.removeAttribute("disabled");
				orgsDropdown.removeAttribute("disabled");
				spacesDropdown.removeAttribute("disabled");
			}
			
			function loadAll() {
				targets.forEach(function(target){
					var option = document.createElement("option");
					option.appendChild(document.createTextNode(target.Name));
					option.target = target;
					targetsDropdown.appendChild(option);
				});
				loadOrgs();
			}

			function loadOrgs() {
				lib.empty(orgsDropdown);
				lib.empty(spacesDropdown);
				lib.empty(applicationsNode);
				lib.empty(orphanRoutesNode);
				disableDropdowns();
				progressService.showWhile(cFService.getOrgs(_target), messages["loading..."]).then(
						function(result) {
							result.Orgs.forEach(function(org){
								var option = document.createElement("option");
								option.appendChild(document.createTextNode(org.Name));
								option.org = org;
								orgsDropdown.appendChild(option);

							});
							
							if(result.Orgs && result.Orgs.length>0){
								loadSpaces(result.Orgs[0]);
							}
							enableDropdowns();
						},
						function(error){
							handleError(error);
							enableDropdowns();
					});
			}
			
			function loadSpaces(org){
				lib.empty(spacesDropdown);
				org.Spaces.forEach(function(space){
					var option = document.createElement("option");
					space.Org = org;
					option.appendChild(document.createTextNode(space.Name));
					option.space = space;
					spacesDropdown.appendChild(option);
				});
				if(org.Spaces.length > 0){
					var selectedSpace = org.Spaces[0];
					_target.Space = selectedSpace.Name;
					_target.Org = selectedSpace.Org.Name;
					displayApplications(_target);
				}
			}

			function createDropdown(labelId, labelText, dropdownId, parent) {
				var row = document.createElement("tr");
				parent.appendChild(row);
				
				// label
				var tdLabel = document.createElement("td");
				tdLabel.className = "appsLabel";
				tdLabel.id = labelId;
				var label = document.createElement("label");
				label.appendChild(document.createTextNode(messages[labelText]));
				tdLabel.appendChild(label);
				row.appendChild(tdLabel);
				
				// dropdown
				var tdDropdown = document.createElement("td");
				tdDropdown.className = "appsSelect";
				tdDropdown.id = dropdownId;
				var dropdown = document.createElement("select");
				tdDropdown.appendChild(dropdown);
				row.appendChild(tdDropdown);
				
				return dropdown;
			};
		}.bind(this),
		function(error){
			handleError(error);
		});
	}
	
	var explorerParent = document.createElement("div");
	explorerParent.id = "applicationsSectionParent";
	var explorer = new mCfExplorer.ApplicationsExplorer(serviceRegistry, selection,	commandRegistry, explorerParent);
	
	mCfCommands.createCfCommands(serviceRegistry, commandRegistry, explorer, displayOrgsAndSpaces);
	mCfCommands.createRoutesCommands(serviceRegistry, commandRegistry, explorer, displayOrgsAndSpaces);

	function displayApplications(target){
		
		lib.empty(applicationsNode);
		lib.empty(orphanRoutesNode);
		
		var applicationsSection = new mSection.Section(applicationsNode, {
			id: "applicationsSection", //$NON-NLS-0$
			title: messages["applications"],
			slideout: true,
			canHide: false,
			preferenceService: preferences,
			keepHeader: true,
			headerClass: ["sectionTreeTableHeader"]
		}); 
		
		commandRegistry.registerCommandContribution("appLevelCommands", "orion.cf.UnmapRoute", 100);
		commandRegistry.registerCommandContribution("appLevelCommands", "orion.cf.StopApp", 200);
		
		selection.addEventListener("selectionChanged", function(event){
			var selections = event.selections;
			var selectionActionsNode = applicationsSection.selectionNode;
			lib.empty(selectionActionsNode);
			if(selections && selections.length>=1){
				commandRegistry.renderCommands("appLevelCommands", selectionActionsNode.id, selections, this, "tool");
			}
		});
						
		progressService.showWhile(cFService.getApps(target), messages["loading..."]).then(function(apps){
			apps = apps || {};
			if (!apps.Apps)
				apps.Apps = [];
			
			explorer.destroyListeners();
			applicationsSection.embedExplorer(explorer);
			explorer.loadApps(apps, target);
			explorer.addListeners(cfEventDispatcher);
			
			progressService.showWhile(cFService.getRoutes(target), messages["loading..."]).then(
				function(routes){
					displayOrphanRoutes(routes, target);
				}, function(error){
					handleError(error);
				}
			);
		}, handleError);
	}
	
	var routesParent = document.createElement("div");
	routesParent.id = "orphanRoutesParent";
	var routesSelection = new mSelection.Selection(serviceRegistry, "orion.Routes.selection");
	var routesExplorer = new mCfExplorer.OrphanRoutesExplorer(serviceRegistry, routesSelection, commandRegistry, routesParent);
				
	mCfCommands.createRoutesCommands(serviceRegistry, commandRegistry, routesExplorer, displayOrgsAndSpaces);
		
	function displayOrphanRoutes(routes, target){
		
		lib.empty(orphanRoutesNode);
			
		var orphanRoutesSection = new mSection.Section(orphanRoutesNode, {
			id: "orphanRoutes", //$NON-NLS-0$
			title: messages["unmappedRoutes"],
			slideout: true,
			canHide: false,
			preferenceService: preferences,
			keepHeader: true,
			headerClass: ["sectionTreeTableHeader"]
		});
		
		var actionsNodeScope = orphanRoutesSection.actionsNode.id;
		commandRegistry.registerCommandContribution(actionsNodeScope, "orion.cf.CreateRoute", 1000); //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.registerCommandContribution(actionsNodeScope, "orion.cf.DeleteOrphanedRoutes", 1100); //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.renderCommands(actionsNodeScope, actionsNodeScope, target, this, "button"); //$NON-NLS-0$
		
		commandRegistry.registerCommandContribution("routeLevelCommands", "orion.cf.MapRoute", 100);
		commandRegistry.registerCommandContribution("routeLevelCommands", "orion.cf.DeleteRoute", 200);
		
		routesExplorer.destroyListeners();
		
		routesSelection.addEventListener("selectionChanged", function(event){
			var selections = event.selections;
			var selectionActionsNode = orphanRoutesSection.selectionNode;
			lib.empty(selectionActionsNode);
			if(selections && selections.length>=1){
				commandRegistry.renderCommands("routeLevelCommands", selectionActionsNode.id, selections, this, "tool");
			}
		});
		
		orphanRoutesSection.embedExplorer(routesExplorer);
		routesExplorer.loadRoutes(routes, target);
		routesExplorer.addListeners(cfEventDispatcher);
	}
	
	displayOrgsAndSpaces();
	});

//end of define
});

