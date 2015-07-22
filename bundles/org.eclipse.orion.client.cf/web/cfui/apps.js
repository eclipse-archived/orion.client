 /*******************************************************************************
 * @license
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2014, 2015. All Rights Reserved.
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

	var targetNode = document.getElementById("targetNode");
	var applicationsNode = document.getElementById("applicationsTable");
	var orphanRoutesNode = document.getElementById("orphanRoutesTable");

	var cfEventDispatcher = mCfCommands.getEventDispatcher();

	var selectedRegion;

	var regionDropdown;
	var orgDropdown;
	var spaceDropdown;

	function promptLogin(cFService) {
		var deferred = new Deferred();
		function loginFunc(user, password){
			progressService.showWhile(cFService.login(selectedRegion.Url, user, password), messages["loggingInToCloudFoundry"]).then(function (result) {
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
					displayTargets();
				},
				handleError
			);
		} else {
			progressService.setProgressResult(error);
		}
	}

	function displayTargets(){
		lib.empty(targetNode);

		progressService.showWhile(mCfUtil.getTargets(preferences), messages["checkingForCloudFoundrySettings"]).then(function(result){
			selectedRegion = result.clouds[0];

			var targetTable = createElement("table", null, "centerTable");

			// region drop-down
			var regionRow = createDropDownWithLabel("region:");
			regionDropdown = regionRow.dropdown;
			regionDropdown.onchange = loadSelectedRegion;
			targetTable.appendChild(regionRow.row);

			// organization drop-down
			var orgRow = createDropDownWithLabel("organization:");
			orgDropdown = orgRow.dropdown;
			orgDropdown.onchange = function() {
				fillSpaceDropdown();
				loadApplications();
			};
			targetTable.appendChild(orgRow.row);

			// space drop-down
			var spaceRow = createDropDownWithLabel("space:");
			spaceDropdown = spaceRow.dropdown;
			spaceDropdown.onchange = loadApplications;
			targetTable.appendChild(spaceRow.row);

			targetNode.appendChild(targetTable);

			fillRegionDropdown(result.clouds);
			loadSelectedRegion();
		}.bind(this),
		function(error){
			handleError(error);
		});
	}

	function fillRegionDropdown(regions) {
		if (!regions) return;

		regions.forEach(function(region){
			var option = createElement("option");
			if (!region.Name) {
				region.Name = region.Url;
			}
			option.appendChild(document.createTextNode(region.Name));
			option.region = region;
			regionDropdown.appendChild(option);
		});
	}

	function fillOrgDropdown(organizations) {
		if (!organizations) return;

		organizations.forEach(function(organization){
			var option = createElement("option");
			option.appendChild(document.createTextNode(organization.Name));
			option.organization = organization;
			orgDropdown.appendChild(option);
		});
	}

	function fillSpaceDropdown() {
		spaceDropdown.options.length = 0;

		if (isDropdownEmpty(orgDropdown)) return;

		var currentOrg = orgDropdown.options[orgDropdown.selectedIndex].organization;
		if (!currentOrg) return;

		currentOrg.Spaces.forEach(function(space){
			var option = createElement("option");
			option.appendChild(document.createTextNode(space.Name));
			option.space = space;
			spaceDropdown.appendChild(option);
		});
	}

	function loadApplications() {
		// collect data from drop-downs
		var target = regionDropdown.options[regionDropdown.selectedIndex].region;

		if (isDropdownEmpty(orgDropdown)) return;
		target.Org = orgDropdown.options[orgDropdown.selectedIndex].organization.Name;

		if (isDropdownEmpty(spaceDropdown)) return;
		target.Space = spaceDropdown.options[spaceDropdown.selectedIndex].space.Name;

		displayApplications(target);
	}

	function loadSelectedRegion() {
		// clear drop-downs and applications section
		orgDropdown.options.length = 0;
		spaceDropdown.options.length = 0;
		lib.empty(applicationsNode);
		lib.empty(orphanRoutesNode);

		if (isDropdownEmpty(regionDropdown)) return;

		var region = regionDropdown.options[regionDropdown.selectedIndex].region;
		if (!region) return;
		selectedRegion = region;

		progressService.showWhile(cFService.getOrgs(region), messages["loading..."]).then(function(result){
			fillOrgDropdown(result.Orgs);
			fillSpaceDropdown();
			loadApplications();
		},
		function(error){
			handleError(error);
		});
	}

	function isDropdownEmpty(dropdown) {
		return dropdown.options.length === 0;
	}

	function createElement(tag, id, className) {
		var element = document.createElement(tag);
		if (id) {
			element.id = id;
		}
		if (className) {
			element.className = className;
		}
		return element;
	}

	function createDropDownWithLabel(labelMsg) {
		var row = createElement("tr");

		var labelCell = createElement("td", null, "targetLabel");
		var label = createElement("label");
		label.appendChild(document.createTextNode(messages[labelMsg]));
		labelCell.appendChild(label);
		row.appendChild(labelCell);

		var dropdownCell = createElement("td", null, "targetSelect");
		var dropdown = createElement("select");
		dropdownCell.appendChild(dropdown);
		row.appendChild(dropdownCell);

		return { row: row, dropdown: dropdown};
	}

	var explorerParent = createElement("div", "applicationsSectionParent");
	var explorer = new mCfExplorer.ApplicationsExplorer(serviceRegistry, selection,	commandRegistry, explorerParent);

	mCfCommands.createCfCommands(serviceRegistry, commandRegistry, explorer, displayTargets);
	mCfCommands.createRoutesCommands(serviceRegistry, commandRegistry, explorer, displayTargets);

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

	var routesParent = createElement("div", "orphanRoutesParent");
	var routesSelection = new mSelection.Selection(serviceRegistry, "orion.Routes.selection");
	var routesExplorer = new mCfExplorer.OrphanRoutesExplorer(serviceRegistry, routesSelection, commandRegistry, routesParent);

	mCfCommands.createRoutesCommands(serviceRegistry, commandRegistry, routesExplorer, displayTargets);

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

	displayTargets();
	});

//end of define
});

