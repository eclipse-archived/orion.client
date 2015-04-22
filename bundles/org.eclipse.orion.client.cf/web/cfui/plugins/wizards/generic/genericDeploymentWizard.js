/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global parent window document define orion setTimeout URL*/

define(['i18n!cfui/nls/messages', "orion/bootstrap", 'orion/objects', 'orion/cfui/cFClient', 'orion/PageUtil',
	'orion/PageLinks', 'orion/preferences', 'orion/fileClient', 'cfui/cfUtil', 'cfui/plugins/wizards/common/wizardUtils',
	'orion/webui/Wizard', 'cfui/plugins/wizards/common/deploymentLogic', 'cfui/plugins/wizards/common/corePageBuilder',
	'cfui/plugins/wizards/common/servicesPageBuilder', 'cfui/plugins/wizards/common/additionalParamPageBuilder', 'orion/Deferred'],
		function(messages, mBootstrap, objects, CFClient, PageUtil, PageLinks, Preferences, mFileClient, mCfUtil, mWizardUtils, Wizard,
				mDeploymentLogic, mCorePageBuilder, mServicesPageBuilder, mAdditionalParamPageBuilder, Deferred) {

	/* plugin-host communication */
	var postMsg = mWizardUtils.defaultPostMsg;
	var defaultDecorateError = mCfUtil.defaultDecorateError;
	var postError = mWizardUtils.buildDefaultPostError(defaultDecorateError);
	var closeFrame = mWizardUtils.defaultCloseFrame;

	/* default utils */
	var showMessage = mWizardUtils.defaultShowMessage;
	var hideMessage = mWizardUtils.defaultHideMessage;
	var showError = mWizardUtils.defaultShowError;

	mBootstrap.startup().then(function(core) {

		/* set up initial message */
		document.getElementById('title').appendChild(document.createTextNode(messages["configureApplicationDeployment"])); //$NON-NLS-0$

		/* allow the frame to be closed */
		document.getElementById('closeDialog').addEventListener('click', closeFrame); //$NON-NLS-1$ //$NON-NLS-0$

		/* allow frame to be dragged by title bar */
		mWizardUtils.makeDraggable(this);

		var pageParams = PageUtil.matchResourceParameters();
		var resourceString = decodeURIComponent(pageParams.resource);
		var resource = JSON.parse(resourceString);

		var serviceRegistry = core.serviceRegistry;
		var fileClient = new mFileClient.FileClient(serviceRegistry);

		var cfService = new CFClient.CFService(serviceRegistry);

		/* compute relative content location */
		var relativeFilePath = new URL(resource.ContentLocation).href;
		var orionHomeUrl = new URL(PageLinks.getOrionHome());

		if(relativeFilePath.indexOf(orionHomeUrl.origin) === 0)
			relativeFilePath = relativeFilePath.substring(orionHomeUrl.origin.length);

		if(relativeFilePath.indexOf(orionHomeUrl.pathname) === 0)
			relativeFilePath = relativeFilePath.substring(orionHomeUrl.pathname.length);

		var preferences = new Preferences.PreferencesService(serviceRegistry);

		/* built-in wizard error handler */
		var handleError = mCfUtil.buildDefaultErrorHandler({
			cFService : cfService,
			showMessage : showMessage,
			hideMessage : hideMessage,
			showError : showError,
			render : function(fields){
				document.getElementById('messageText').appendChild(fields); //$NON-NLS-0$
			}
		});

		var projectLocation = resource.ContentLocation;
		var appPath = resource.AppPath;
		
		var launchConfParams = resource.ConfParams || {};
		if (launchConfParams.Instrumentation)
			launchConfParams.Instrumentation.name = launchConfParams.Name;

		function ensureLaunchConfName(manifestApplication) {
			if (!resource.ConfName) {
				// Creating a new launch config -- generate a name based on the app name
				var appName = manifestApplication.name;
				return mDeploymentLogic.uniqueLaunchConfigName(fileClient, resource.ContentLocation, appName);
			}
			return new Deferred().resolve(resource.ConfName);
		}

		function checkPlan() {
			var deferred = new Deferred();
			
			var relativeFilePath = new URL(projectLocation + appPath).href;
			var orionHomeUrl = new URL(PageLinks.getOrionHome());
			
			if (relativeFilePath.indexOf(orionHomeUrl.origin) === 0) relativeFilePath = relativeFilePath.substring(orionHomeUrl.origin.length);

			cfService.getDeploymentPlans(relativeFilePath).then(function(resp) {
				var plans = resp.Children;
				deferred.resolve(plans[0]);
			});
			
			return deferred;
		}

		Deferred.all([checkPlan(), mWizardUtils.loadClouds({
			showMessage : showMessage,
			hideMessage : hideMessage,
			preferences : preferences,
			fileClient : fileClient,
			resource : resource
		})]).then(function(results){
			var plan = results[0];
			var resp = results[1];
			var clouds = resp.clouds;
			var defaultTarget = launchConfParams.Target || resp.defaultTarget;
			var manifestApplication = plan.Manifest.applications[0];

			ensureLaunchConfName(manifestApplication).then(
				function(launchConfName){
					
					/* init core page builder */
				    var corePageBuilder = new mCorePageBuilder.CorePageBuilder({
						ConfName: launchConfName,
				    	Clouds : clouds,
				    	DefaultTarget : defaultTarget,
				    	FilePath : relativeFilePath,
						InitManifestPath : resource.AppPath,
				    	ManifestApplication : manifestApplication,
				    	ManifestInstrumentation: launchConfParams.Instrumentation,
				    	serviceRegistry : serviceRegistry,
				    	CFService : cfService,
				    	showMessage : showMessage,
				    	hideMessage : hideMessage,
				    	handleError : handleError,
				    	postError : postError
				    });
		
				    /* init services page builder */
				    var servicesPageBuilder = new mServicesPageBuilder.ServicesPageBuilder({
				    	ManifestServices : manifestApplication.services,
				    	ManifestInstrumentation: launchConfParams.Instrumentation,
				    	CFService : cfService,
				    	InitManifestPath : resource.AppPath,
				    	getTargetSelection : function(){
				    		return corePageBuilder.getSelection();
				    	},
				    	getUserPath : function(){
				    		return corePageBuilder.getManifestPath();
				    	},
				    	getPlan : function(){
				    		return corePageBuilder.getPlan();
				    	},
				    	showMessage : showMessage,
				    	hideMessage : hideMessage,
				    	handleError : handleError,
				    	postError : postError
				    });
		
				    /* init additional parameters page builder */
				    var additionalParamPageBuilder = new mAdditionalParamPageBuilder.AdditionalParamPageBuilder({
				    	ManifestApplication : manifestApplication,
				    	ManifestInstrumentation: launchConfParams.Instrumentation,
				    	InitManifestPath : resource.AppPath,
				    	getUserPath : function(){
				    		return corePageBuilder.getManifestPath();
				    	},
				    	getPlan : function(){
				    		return corePageBuilder.getPlan();
				    	},
				    });
		
				    /* build pages */
				    var page1 = corePageBuilder.build();
				    var page2 = servicesPageBuilder.build();
				    var page3 = additionalParamPageBuilder.build();
					var setUIState = function(disable) {
						if(corePageBuilder._orgsDropdown)
							corePageBuilder._orgsDropdown.disabled = disable;
						if(corePageBuilder._spacesDropdown)
							corePageBuilder._spacesDropdown.disabled = disable;
					};
		
					new Wizard.Wizard({
						parent: "wizard", //$NON-NLS-0$
						pages: [page1, page2, page3],
						onCancel: closeFrame,
						buttonNames: { ok: messages["save"] },
						size: { width: "calc(100% - 24px)", height: "370px" }, //$NON-NLS-0$//$NON-NLS-1$
						onSubmit: mDeploymentLogic.buildDeploymentTrigger({
							ConfName : launchConfName,
							showMessage : showMessage,
							closeFrame : closeFrame,
							disableUI : setUIState.bind(null, true),
							enableUI  : setUIState.bind(null, false),
		
							postMsg : postMsg,
							postError : postError,
		
							FileService: fileClient,
							CFService : cfService,
		
							getTargetSelection : function(){
					    		return corePageBuilder.getSelection();
					    	},
					    	getManifestPath : function(){
					    		return corePageBuilder.getManifestPath();
					    	},

					    	ContentLocation : resource.ContentLocation,
					    	AppPath : resource.AppPath
						})
					});
				}
			)
		}, postError);
	});
});