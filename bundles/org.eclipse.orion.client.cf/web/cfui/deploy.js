/*global parent window document define orion setTimeout*/
	
var uiTestFunc = null;

define(["orion/bootstrap", "orion/xhr", 'orion/webui/littlelib', 'orion/Deferred', 'orion/cfui/cFClient', 'orion/PageUtil', 'orion/selection',
	'orion/URITemplate', 'orion/PageLinks', 'orion/preferences', 'i18n!cfui/nls/messages'], 
		function(mBootstrap, xhr, lib, Deferred, CFClient, PageUtil, mSelection, URITemplate, PageLinks, Preferences, messages) {

	var cloudManageUrl;
	
	mBootstrap.startup().then(
		function(core) {
			
			var pageParams = PageUtil.matchResourceParameters();
			var deployResource = decodeURIComponent(pageParams.resource);
			
			var serviceRegistry = core.serviceRegistry;
			var cFService = new CFClient.CFService(serviceRegistry);
			
			// initial message
			document.getElementById('title').appendChild(document.createTextNode("Configure Application Deployment")); //$NON-NLS-1$//$NON-NLS-0$
			var msgContainer = document.getElementById('messageContainer'); //$NON-NLS-0$
			var msgLabel = document.getElementById('messageLabel'); //$NON-NLS-0$
			var msgNode;
			var okButton = document.getElementById('okbutton'); //$NON-NLS-0$
			var orgsDropdown;
			var spacesDropdown;
			var deployResourceJSON = JSON.parse(deployResource);

			function showMessage(message){
				msgLabel.appendChild(document.createTextNode(message));
				msgContainer.classList.add("showing"); //$NON-NLS-0$
			}
			
			function hideMessage(){
				lib.empty(msgLabel);
				msgContainer.classList.remove("showing"); //$NON-NLS-0$
			}
			
			var selection;
			
			function setValid(valid){
				if(valid){
					okButton.classList.remove("disabled");
				} else {
					okButton.classList.add("disabled");
				}
				okButton.disabled = !valid;
			}
						
			var validate = function() {
				if(!selection){
					setValid(false);
					return;					
				}
				selection.getSelection(function(selection) {
					if(selection===null || selection.length===0){
						setValid(false);
						return;
					}
					setValid(true);
				});
			};
			
			showMessage(messages["Loading deployment settings..."]);
			validate();
			
			
			// register hacked pref service
			
			var temp = document.createElement('a');
			temp.href = "../prefs/user";
			var location = temp.href;
			
			function PreferencesProvider(location) {
				this.location = location;
			}

			PreferencesProvider.prototype = {
				get: function(name) {
					return xhr("GET", this.location + name, {
						headers: {
							"Orion-Version": "1"
						},
						timeout: 15000,
						log: false
					}).then(function(result) {
						return result.response ? JSON.parse(result.response) : null;
					});
				},
				put: function(name, data) {
					return xhr("PUT", this.location + name, {
						data: JSON.stringify(data),
						headers: {
							"Orion-Version": "1"
						},
						contentType: "application/json;charset=UTF-8",
						timeout: 15000
					}).then(function(result) {
						return result.response ? JSON.parse(result.response) : null;
					});
				},
				remove: function(name, key){
					return xhr("DELETE", this.location + name +"?key=" + key, {
						headers: {
							"Orion-Version": "1"
						},
						contentType: "application/json;charset=UTF-8",
						timeout: 15000
					}).then(function(result) {
						return result.response ? JSON.parse(result.response) : null;
					});
				}
			};
			
			var service = new PreferencesProvider(location);
			serviceRegistry.registerService("orion.core.preference.provider", service, {});
			
			// This is code to ensure the first visit to orion works
			// we read settings and wait for the plugin registry to fully startup before continuing
			var preferences = new Preferences.PreferencesService(serviceRegistry);
			
			// cancel button
			var closeFrame = function() {
				 window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
					 source: "org.eclipse.orion.client.cf.deploy.uritemplate", cancelled: true}), "*");
			};
			
			var doAction = function() {
				showMessage("Deploying...");
				setValid(false);
				selection.getSelection(
					function(selection) {
						if(selection===null || selection.length===0){
							closeFrame();
							return;
						}
						
						if(orgsDropdown){
							orgsDropdown.disabled = true;
						}
						if(spacesDropdown){
							spacesDropdown.disabled = true;
						}
						
						
						cFService.pushApp(selection, null, decodeURIComponent(deployResourceJSON.ContentLocation + deployResourceJSON.AppPath)).then(
							function(result){
								var appName = result.App.name || result.App.entity.name;
								var host = result.Route.host || result.Route.entity.host;
								postMsg({
									CheckState: true,
									ToSave: {
										ConfigurationName: appName + " on " + result.Target.Space.Name + " / " + result.Target.Org.Name,
										Parameters: {
											Target: {
												Url: result.Target.Url,
												Org: result.Target.Org.Name,
												Space: result.Target.Space.Name
											},
											Name: appName,
											Timeout: (result.Timeout !== undefined) ? result.Timeout : undefined
										},
										Url: (result.Route !== undefined) ? "http://" + host + "." + result.Domain : undefined,
										UrlTitle: (result.Route !== undefined) ? appName : undefined,
										Type: "Cloud Foundry",
										ManageUrl: result.ManageUrl,
										Path: deployResourceJSON.AppPath
									}
								});
							}, function(error){
								postError(error);
							}
						);
					}
				);
			};

			document.getElementById('okbutton').addEventListener('click', doAction); //$NON-NLS-1$ //$NON-NLS-0$
			document.getElementById('closeDialog').addEventListener('click', closeFrame); //$NON-NLS-1$ //$NON-NLS-0$
			document.getElementById('cancelButton').addEventListener('click', closeFrame); //$NON-NLS-1$ //$NON-NLS-0$
			 
			// allow frame to be dragged by title bar
			var that=this;
			var iframe = window.frameElement;
		    setTimeout(function() {
				var titleBar = document.getElementById('titleBar');
				titleBar.addEventListener('mousedown', function(e) {
					that._dragging=true;
					if (titleBar.setCapture) {
						titleBar.setCapture();
					}
					that.start = {screenX: e.screenX,screenY: e.screenY};
				});
				titleBar.addEventListener('mousemove', function(e) {
					if (that._dragging) {
						var dx = e.screenX - that.start.screenX;
						var dy = e.screenY - that.start.screenY;
						that.start.screenX = e.screenX;
						that.start.screenY = e.screenY;
						var x = parseInt(iframe.style.left) + dx;
						var y = parseInt(iframe.style.top) + dy;
						iframe.style.left = x+"px";
						iframe.style.top = y+"px";
					}
				});
				titleBar.addEventListener('mouseup', function(e) {
					that._dragging=false;
					if (titleBar.releaseCapture) {
						titleBar.releaseCapture();
					}
				});
		    });

		    //
			var configAdmin = serviceRegistry.getService('orion.cm.configadmin'); //$NON-NLS-0$
			configAdmin.getConfiguration("app.settings").then(
				function(config) {
					 // get target and app, then do push and open application
					getTarget(cFService, config, preferences).then(
						function(target){
							cloudManageUrl = target.ManageUrl;
							cFService.getOrgs(target).then(
								function(result2){
									hideMessage();
																		
									document.getElementById("orgsLabel").appendChild(document.createTextNode("Organization:"));

									orgsDropdown = document.createElement("select");
									result2.Orgs.forEach(function(org){
										var option = document.createElement("option");
										option.appendChild(document.createTextNode(org.Name));
										option.org = org;
										orgsDropdown.appendChild(option);
									});
									
									orgsDropdown.onchange = function(event){
										var selectedOrg = event.target.value;
										loadTargets(selectedOrg);
									};
									
									document.getElementById("orgs").appendChild(orgsDropdown);
																		
									var targets = {};
									result2.Orgs.forEach(function(org){
										targets[org.Name] = [];
										if (org.Spaces)
											org.Spaces.forEach(function(space){
												var newTarget = {};
												newTarget.Url = target.Url;
												if (cloudManageUrl)
													newTarget.ManageUrl = cloudManageUrl;
												newTarget.Org = org.Name;
												newTarget.Space = space.Name;
												targets[org.Name].push(newTarget);
											});
									});
									
									selection = new mSelection.Selection(serviceRegistry, "orion.Spaces.selection"); //$NON-NLS-0$
									selection.addEventListener("selectionChanged", validate);

										document.getElementById("spacesLabel").appendChild(document.createTextNode("Space:"));
	
										spacesDropdown = document.createElement("select");
										
										function setSelection(){
											if(!spacesDropdown.value){
												selection.setSelections();
											} else {
												var orgTargets = targets[orgsDropdown.value];
												if(!orgTargets){
													selection.setSelections();
												} else {
													for(var i=0; i<orgTargets.length; i++){
														if(orgTargets[i].Space == spacesDropdown.value){
															selection.setSelections(orgTargets[i]);
															break;
														}
													}
												}
											}											
										}
										
										spacesDropdown.onchange = function(event){
											setSelection();
										};
										
										document.getElementById("spaces").appendChild(spacesDropdown);
									
									function loadTargets(org){
										
										var targetsToDisplay = targets[org];
										lib.empty(spacesDropdown);
										targetsToDisplay.forEach(function(target){
											var option = document.createElement("option");
											option.appendChild(document.createTextNode(target.Space));
											option.target = target;
											spacesDropdown.appendChild(option);
										});
										setSelection();
									}
									
									document.getElementById("manifestLabel").appendChild(document.createTextNode("Using manifest:"));
									
									var manifestFolder = deployResourceJSON.AppPath || "";
									manifestFolder = manifestFolder.substring(0, manifestFolder.lastIndexOf("/")+1);
									
									document.getElementById("manifest").appendChild(document.createTextNode("/" + manifestFolder + "manifest.yml"));
									
									loadTargets(orgsDropdown.value);
									
									
								}, function(error){
									postError(error);
								}
							);
						}, function(error){
							postError(error);
						}
					);
				}
			);
		}
	);
	
	// make sure target is set and it matches the url in settings
	function getTarget(cFService, config, preferences) {
		var deferred = new Deferred();
		
		preferences.getPreferences('/cm/configurations').then(
			function(settings){
				var cloud = settings.get("org.eclipse.orion.client.cf.settings");
				if (cloud && cloud.targetUrl){
					var target = {};
					target.Url = cloud.targetUrl;
					if (cloud.manageUrl)
						target.ManageUrl = cloud.manageUrl;
					if (cloud.org)
						target.Org = cloud.org;
					if (cloud.space)
						target.Space = cloud.space;
					deferred.resolve(target);
					return;
				}
				
				preferences.getPreferences('/settingsCF', 1).then(
					function(settings){
						var cloud = settings;
						if (cloud && cloud.get("targetUrl")){
							var target = {};
							target.Url = cloud.get("targetUrl");
							if (cloud.get("manageUrl"))
								target.ManageUrl = cloud.get("manageUrl");
							deferred.resolve(target);
							return;
						} else {
							var error = {};
							var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
							error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
							error.Severity = "Warning";
							deferred.reject(error);
						}
					}, function(error){
						var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
						error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
						error.Severity = "Warning";
						deferred.reject(error);
					}
				);
			}, function(error){
				var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
				error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
				error.Severity = "Warning";
				deferred.reject(error);
			}
		);
		return deferred;
	}

	function postMsg(status) {
		window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
			 source: "org.eclipse.orion.client.cf.deploy.uritemplate", 
			 status: status}), "*");
	}
	
	function postError(error) {
		if(error.Message){
			if (error.Message.indexOf("The host is taken")===0){
				error.Message = error.Message.replace("The host is taken", "The BlueMix route");
				error.Message += " is already in use by another application. Please check the host/domain in the manifest file.";
			}
		}
		
		if (error.HttpCode === 404){
			error = {
				State: "NOT_DEPLOYED",
				Message: error.Message
			};
		} else if (error.JsonData && error.JsonData.error_code) {
			var err = error.JsonData;
			if (err.error_code === "CF-InvalidAuthToken"){
				error.Retry = {
					parameters: [{id: "user", type: "text", name: "IBM ID:"}, {id: "password", type: "password", name: "Password:"}]
				};
				
				error.forceShowMessage = true;
				error.Severity = "Info";
				error.Message = "Please enter your IBM id below to authorize deployment to BlueMix. Note that ids are case-sensitive. If you have not registered to use BlueMix, you can do so [here](" + cloudManageUrl + ").";				
			
			} else if (err.error_code === "CF-TargetNotSet"){
				var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()});
				error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
			}
		}
		
		window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
			 source: "org.eclipse.orion.client.cf.deploy.uritemplate", 
			 status: error}), "*");
	}

});