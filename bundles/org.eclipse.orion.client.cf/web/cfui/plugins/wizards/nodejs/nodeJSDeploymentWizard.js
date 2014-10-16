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
/*global parent window document define orion setTimeout*/

define(["orion/bootstrap", "orion/xhr", 'orion/webui/littlelib', 'orion/Deferred', 'orion/cfui/cFClient', 'orion/PageUtil', 'orion/selection', 'orion/i18nUtil',
	'orion/URITemplate', 'orion/PageLinks', 'orion/preferences', 'orion/fileClient', 'cfui/cfUtil', 'cfui/plugins/wizards/common/wizardUtils', 'orion/objects', 'orion/widgets/input/ComboTextInput', 'orion/i18nUtil',
	'orion/webui/Wizard', 'cfui/plugins/wizards/common/deploymentLogic', 'cfui/plugins/wizards/common/debugPaneBuilder', 'cfui/plugins/wizards/common/corePageBuilder', 
	'cfui/plugins/wizards/common/servicesPageBuilder', 'cfui/plugins/wizards/common/additionalParamPageBuilder'], 
		function(mBootstrap, xhr, lib, Deferred, CFClient, PageUtil, mSelection, i18nUtil, URITemplate, PageLinks, Preferences, mFileClient, mCfUtil, mWizardUtils, objects, ComboTextInput, i18nUtil, Wizard,
				mDeploymentLogic, mDebugPaneBuilder, mCorePageBuilder, mServicesPageBuilder, mAdditionalParamPageBuilder) {
	
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
		document.getElementById('title').appendChild(document.createTextNode("Configure Node.js Application Deployment")); //$NON-NLS-1$//$NON-NLS-0$
		
		/* allow the frame to be closed */
		document.getElementById('closeDialog').addEventListener('click', closeFrame); //$NON-NLS-1$ //$NON-NLS-0$
		 
		/* allow frame to be dragged by title bar */
		mWizardUtils.makeDraggable(this);
			
		var pageParams = PageUtil.matchResourceParameters();
		var resourceString = decodeURIComponent(pageParams.resource);
		var resource = JSON.parse(resourceString);
			
		var serviceRegistry = core.serviceRegistry;
		var cfService = new CFClient.CFService(serviceRegistry);
			
		/* compute relative content location */
		var relativeFilePath = new URL(resource.ContentLocation).href;
		var orionHomeUrl = new URL(PageLinks.getOrionHome());
			
		if(relativeFilePath.indexOf(orionHomeUrl.origin) === 0)
			relativeFilePath = relativeFilePath.substring(orionHomeUrl.origin.length);
			
		if(relativeFilePath.indexOf(orionHomeUrl.pathname) === 0)
			relativeFilePath = relativeFilePath.substring(orionHomeUrl.pathname.length);
			
		var preferences = new Preferences.PreferencesService(serviceRegistry);
		var fileClient = new mFileClient.FileClient(serviceRegistry);
		
		/* built-in wizard error handler */
		var handleError = mCfUtil.buildDefaultErrorHandler({
			cFService : cfService,
			showMessage : showMessage,
			hideMessage : hideMessage,
			showError : showError,
			render : function(fields){
				document.getElementById('messageText').appendChild(fields);
			}
		});
		
		/* deployment plan */
		var plan = resource.Plan;
		var manifestApplication = plan.Manifest.applications[0];
		
		function getDefaultNonEmptyTarget(clouds){
			var d = new Deferred();
			
			var target = clouds[0];
			clouds = clouds.length === 1 ? [] : clouds.slice(1);
			
			cfService.getOrgs(target).then(function(resp){
				
				d.resolve({
					resp: resp,
					target: target
				});
				
			}, function(error){
				
				if(clouds.length === 0)
					return d.reject({
						error: error,
						target: target
					});
				
				var dp = getDefaultNonEmptyTarget(clouds);
				dp.then(d.resolve, d.reject);
			});
			
			return d;
		}
		
		Deferred.all([
		 		     
		     mCfUtil.getTargets(preferences),
		     mWizardUtils.getDefaultTarget(fileClient, resource)
		 		     
		]).then(function(results){
			
			var clouds = results[0];
			var defaultTarget = results[1];
			
			/* welcome page */
			var defaultSelection;
			var page0 = new Wizard.WizardPage({
				
				template: "<table class=\"formTable\">"+
			    	"<tr>"+
						"<td id=\"_runtimeLabel\" class=\"label\"></td>"+
						"<td id=\"_runtime\" class=\"selectCell\"></td>"+
					"</tr>"+
					"<tr>"+
						"<td id=\"_targetLabel\" class=\"label\"></td>"+
						"<td id=\"_target\" class=\"selectCell\"></td>"+
					"</tr>"+
					"<tr>"+
						"<td id=\"_organizationLabel\" class=\"label\"></td>"+
						"<td id=\"_organization\" class=\"selectCell\"></td>"+
					"</tr>"+
					"<tr>"+
						"<td id=\"_spaceLabel\" class=\"label\"></td>"+
						"<td id=\"_space\" class=\"selectCell\"></td>"+
					"</tr>"+
					"<tr>"+
						"<td id=\"_nameLabel\" class=\"label\"></td>"+
						"<td id=\"_name\" class=\"selectCell\"></td>"+
					"</tr>"+
				"</table><br /><div class=\"deployMessage\" id=\"confirmationMessage\"></div>",
		    	
		    	render: function(){
		    		this.wizard.validate();
		    		
		    		showMessage("Preparing deployment settings...");
		    		getDefaultNonEmptyTarget(clouds).then(function(nonEmpty){
		    			
		    			var resp = nonEmpty.resp;
		    			var target = nonEmpty.target;
		    			
		    			hideMessage();
		    			
		    			var org = resp.Orgs[0];
		    			var space = org.Spaces[0];
		    			
		    			target.Org = org.Name;
		    			target.Space = space.Name;
		    			
		    			defaultSelection = new mSelection.Selection(serviceRegistry, "orion.Spaces.selection"); //$NON-NLS-0$
		    			defaultSelection.setSelections(target);
		    			
		    			/* runtime */
		    			var label = document.createTextNode("Runtime:");
		    			document.getElementById("_runtimeLabel").appendChild(label);
		    			
		    			var node = document.createTextNode("node.js");
		    			document.getElementById("_runtime").appendChild(node);
		    			
		    			/* target */
		    			label = document.createTextNode("Target:");
		    			document.getElementById("_targetLabel").appendChild(label);
		    			
		    			node = document.createTextNode(defaultTarget.Name || defaultTarget.Url || target.Name || target.Url);
		    			document.getElementById("_target").appendChild(node);
		    			
		    			/* organization */
		    			label = document.createTextNode("Organization:");
		    			document.getElementById("_organizationLabel").appendChild(label);
		    			
		    			node = document.createTextNode(org.Name);
		    			document.getElementById("_organization").appendChild(node);
		    			
		    			/* space */
		    			label = document.createTextNode("Space:");
		    			document.getElementById("_spaceLabel").appendChild(label);
		    			
		    			node = document.createTextNode(space.Name);
		    			document.getElementById("_space").appendChild(node);
		    			
		    			/* application name */
		    			label = document.createTextNode("Application Name:");
		    			document.getElementById("_nameLabel").appendChild(label);
		    			
		    			node = document.createTextNode(manifestApplication.name);
		    			document.getElementById("_name").appendChild(node);
		    			
		    			var message = "<p>Click <b>\"Deploy\"</b> to proceed or <b>\"Next\"</b> to change the deployment parameters.</p>";
		    			
		    			var messageDiv = document.getElementById("confirmationMessage");
			    		messageDiv.innerHTML = message;
		    			
		    		}, function(err){
		    			
		    			var error = err.error;
		    			var target = err.target;
		    			handleError(error, target, function(){ return page0.render(); });
		    		});
		    	},
		    	
		    	validate: function(setValid){
		    		setValid(true);
		    		return;
		    	},
		    	
		    	getResults: function(){
		    		return {};
		    	}
		    });
			
			/* init common pane builder */
			var debugPaneBuilder = new mDebugPaneBuilder.DebugPaneBuilder({
		    	AppPath : resource.AppPath /* relative application path */
		    });
			
			/* init core page builder */
		    var corePageBuilder = new mCorePageBuilder.CorePageBuilder({
		    	Clouds : clouds,
		    	DefaultTarget : defaultTarget,
		    	
		    	ManifestApplication : manifestApplication,
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
		    	
		    	CFService : cfService,
		    	getTargetSelection : function(){
		    		return corePageBuilder.getSelection();
		    	},
		    	
		    	showMessage : showMessage,
		    	hideMessage : hideMessage,
		    	handleError : handleError,
		    	postError : postError
		    });
		    
		    /* init additional parameters page builder */
		    var additionalParamPageBuilder = new mAdditionalParamPageBuilder.AdditionalParamPageBuilder({
		    	ManifestApplication : manifestApplication
		    });
		    
		    /* build pages */
		    var commonPane = debugPaneBuilder.build();
		    var page1 = corePageBuilder.build();
		    var page2 = servicesPageBuilder.build();
		    var page3 = additionalParamPageBuilder.build();
		    
			var wizard = new Wizard.Wizard({
				parent: "wizard",
				pages: [page0, page1, page2, page3],
				commonPane: commonPane,
				onCancel: closeFrame,
				buttonNames: { ok: "Deploy" },
				size: { width: "420px", height: "180px" },
				onSubmit: mDeploymentLogic.buildDeploymentTrigger({
					
					showMessage : showMessage,
					closeFrame : closeFrame,
					disableUI : function(){
						if(corePageBuilder._orgsDropdown)
							corePageBuilder._orgsDropdown.disabled = true;
						
						if(corePageBuilder._spacesDropdown)
							corePageBuilder._spacesDropdown.disabled = true;
						
						if(debugPaneBuilder._cfLauncherPassword)
							debugPaneBuilder._cfLauncherPassword.disabled = true;
						
						if(debugPaneBuilder._cfLauncherURLPrefix)
							debugPaneBuilder._cfLauncherURLPrefix.disabled = true;
					},
					
					postMsg : postMsg,
					postError : postError,
					
					CFService : cfService,
					getTargetSelection : function(){
						
						var selection = corePageBuilder.getSelection();
						if(typeof selection === "undefined" && defaultSelection)
							return defaultSelection;
						
			    		return selection;
			    	},
			    	
			    	saveManifest : function(){
			    		var checkbox = debugPaneBuilder._saveManifestCheckbox;
			    		return checkbox ? checkbox.checked : false;
			    	},
			    	
			    	getPackager : function(){
			    		var checkbox = debugPaneBuilder._debugCheckbox;
			    		var debugEnabled = checkbox ? checkbox.checked : false;
			    		if(!debugEnabled)
			    			return null;
			    					    		
			    		return "org.eclipse.orion.server.cf.nodejs.CFLauncherDeploymentPackager";
			    	},
			    	
			    	getManifestInstrumentation : function(manifest){
			    		var checkbox = debugPaneBuilder._debugCheckbox;
			    		var debugEnabled = checkbox ? checkbox.checked : false;
			    		if(!debugEnabled)
			    			return;
			    		
			    		var instrumentation = {};
			    		var app = manifest.applications[0];
			    		
			    		var password = debugPaneBuilder._cfLauncherPassword.value;
			    		var userURLPrefix = debugPaneBuilder._cfLauncherURLPrefix.value;
			    		
			    		var command = userURLPrefix ?
			    				i18nUtil.formatMessage("node_modules/.bin/launcher --password ${0} --urlprefix ${1} -- ${2}", password, userURLPrefix, app.command)
			    				: i18nUtil.formatMessage("node_modules/.bin/launcher --password ${0} -- ${1}", password, app.command);
			    		
			    		instrumentation.command = command;
			    		return instrumentation;
			    	},
			    	
			    	Manifest : plan.Manifest,
			    	ContentLocation : resource.ContentLocation,
			    	AppPath : resource.AppPath
				})
			});
		    
		}, postError);
	});
});