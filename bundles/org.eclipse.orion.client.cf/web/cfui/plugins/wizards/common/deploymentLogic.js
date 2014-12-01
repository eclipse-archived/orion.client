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

	function _getManifestApplication(manifestContents, results){
		manifestContents = manifestContents || { applications: [{}] };
		var ret = objects.clone(manifestContents);

		if(!manifestContents.applications.length > 0)
			manifestContents.applications.push({});

		if(results.name)
			manifestContents.applications[0].name = results.name;

		if(results.host)
			manifestContents.applications[0].host = results.host;

		if(results.services){
			if(results.services.length === 0)
				delete manifestContents.applications[0].services;
			else
				manifestContents.applications[0].services = results.services;
		}

		if(typeof results.command === "string"){ //$NON-NLS-0$
			if(results.command)
				manifestContents.applications[0].command = results.command;
			else
				delete manifestContents.applications[0].command;
		}

		if(typeof results.path === "string"){ //$NON-NLS-0$
			if(results.path)
				manifestContents.applications[0].path = results.path;
			else
				delete manifestContents.applications[0].path;
		}

		if(typeof results.buildpack === "string"){ //$NON-NLS-0$
			if(results.buildpack)
				manifestContents.applications[0].buildpack = results.buildpack;
			else
				delete manifestContents.applications[0].buildpack;
		}

		if(typeof results.memory === "string"){ //$NON-NLS-0$
			if(results.memory)
				manifestContents.applications[0].memory = results.memory;
			else
				delete manifestContents.applications[0].memory;
		}

		if(typeof results.instances !== "undefined"){ //$NON-NLS-0$
			if(results.instances)
				manifestContents.applications[0].instances = results.instances;
			else
				delete manifestContents.applications[0].instances;
		}

		if(typeof results.timeout !== "undefined"){ //$NON-NLS-0$
			if(results.timeout)
				manifestContents.applications[0].timeout = results.timeout;
			else
				delete manifestContents.applications[0].timeout;
		}

		return ret;
	}

	/**
	 * A utility trigger factory for Cloud Foundry deployment logic
	 * after the 'Deploy' button in a deployment wizard was clicked.
	 */
	function buildDeploymentTrigger(options){
		options = options || {};

		return function(results){

			var disableUI = options.disableUI;
			var showMessage = options.showMessage;
			var closeFrame = options.closeFrame;

			var postMsg = options.postMsg;
			var postError = options.postError;

			var fileService = options.FileService;
			var cfService = options.CFService;
			var targetSelection = options.getTargetSelection();
			var saveManifest = options.saveManifest();

			var userManifest = options.Manifest;
			var contentLocation = options.ContentLocation;
			var appPath = options.AppPath;

			showMessage(messages["deploying..."]);
			targetSelection.getSelection(function(selection){
				if(selection === null || selection.length === 0){
					closeFrame();
					return;
				}

				/* disable any UI at this point */
				disableUI();

				var manifest = _getManifestApplication(userManifest, results);
				var devMode = options.getDevMode ? options.getDevMode(manifest) : null;
				
				/* manifest to persist as additional configuration */

				var additionalConfiguration = {
					DevMode : devMode,
					Manifest : manifest
				};
				
				if (devMode && devMode.On){
					var packager = devMode.Packager;
					var instrumentation = devMode.Instrumentation;
				}
				
				var expandedURL = new URITemplate("{+OrionHome}/edit/edit.html#{,ContentLocation}").expand({ //$NON-NLS-0$
					OrionHome: PageLinks.getOrionHome(),
					ContentLocation: contentLocation,
				});

				var editLocation = new URL(expandedURL);
				cfService.pushApp(selection, null, decodeURIComponent(contentLocation + appPath), manifest, saveManifest, packager, instrumentation).then(
					function(result){
						mCfUtil.prepareLaunchConfigurationContent(result, appPath, editLocation, contentLocation, fileService, additionalConfiguration).then(
							function(launchConfigurationContent){
								postMsg(launchConfigurationContent);
							}, function(error){
								postError(error, selection);
							}
						);
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
