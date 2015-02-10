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
/*eslint-env browser, amd*/
/*global URL*/
define(['i18n!cfui/nls/messages', 'orion/objects', 'cfui/cfUtil', 'orion/URITemplate', 'orion/PageLinks', 'cfui/manifestUtils'],
 function(messages, objects, mCfUtil, URITemplate, PageLinks, mManifestUtils){

	function _getManifestInstrumentation(manifestContents, results){
		manifestContents = manifestContents || { applications: [{}] };
		var manifestInstrumentation = {};

		if(!manifestContents.applications.length > 0)
			manifestContents.applications.push({});

		if(manifestContents.applications[0].host !== results.host)
			manifestInstrumentation.host = results.host;
		
		if(manifestContents.applications[0].domain !== results.domain)
			manifestInstrumentation.domain = results.domain;

//		if(results.services){
//			if(results.services.length === 0)
//				delete manifestContents.applications[0].services;
//			else
//				manifestContents.applications[0].services = results.services;
//		}

		var manifestCommand = manifestContents.applications[0].command || "";
		if(manifestCommand !== results.command && typeof results.command === "string") //$NON-NLS-0$
			manifestInstrumentation.command = results.command;
		
		var manifestPath = manifestContents.applications[0].path || "";
		if(manifestPath !== results.path && typeof results.path === "string") //$NON-NLS-0$
			manifestInstrumentation.path = results.path;
		
		var manifestBuildpack = manifestContents.applications[0].buildpack || "";
		if(manifestBuildpack !== results.buildpack && typeof results.buildpack === "string") //$NON-NLS-0$
			manifestInstrumentation.buildpack = results.buildpack;
		
		console.info(manifestContents.applications[0].memory);
		console.info(results.memory);
		if(manifestContents.applications[0].memory !== results.memory && typeof results.memory === "string") //$NON-NLS-0$
			manifestInstrumentation.memory = results.memory;
		
		if(manifestContents.applications[0].instances !== results.instances && typeof results.instances !== "undefined") //$NON-NLS-0$
			manifestInstrumentation.instances = results.instances;

		var manifestTimeout = manifestContents.applications[0].timeout || "";
		if(manifestTimeout !== results.timeout && typeof results.timeout !== "undefined") //$NON-NLS-0$
			manifestInstrumentation.timeout = results.timeout;

		return manifestInstrumentation;
	}

	/**
	 * A utility trigger factory for Cloud Foundry deployment logic
	 * after the 'Deploy' button in a deployment wizard was clicked.
	 */
	function buildDeploymentTrigger(options){
		options = options || {};

		return function(results){
			
			var confName = options.ConfName;

			var disableUI = options.disableUI;
			var showMessage = options.showMessage;
			var closeFrame = options.closeFrame;

			var postMsg = options.postMsg;
			var postError = options.postError;

//			var fileService = options.FileService;
//			var cfService = options.CFService;
			var targetSelection = options.getTargetSelection();

			var userManifest = options.Manifest;
			var contentLocation = options.ContentLocation;
			var appPath = options.AppPath;

			showMessage(messages["saving..."]);
			targetSelection.getSelection(function(selection){
				if(selection === null || selection.length === 0){
					closeFrame();
					return;
				}

				/* disable any UI at this point */
				disableUI();

				var instrumentation = _getManifestInstrumentation(userManifest, results);
				var devMode = options.getDevMode ? options.getDevMode() : null;
				
				var appName = results.name;
				var configName = confName || (appName + "-" + Math.floor(Date.now() / 1000));
				var target = selection;
				
				mCfUtil.prepareLaunchConfigurationContent(configName, target, appName, appPath, instrumentation, devMode).then(
					function(launchConfigurationContent){
						postMsg(launchConfigurationContent);
					}, function(error){
						postError(error, selection);
					}
				);

			}, postError);
		};
	}

	return {
		buildDeploymentTrigger : buildDeploymentTrigger
	};
});
