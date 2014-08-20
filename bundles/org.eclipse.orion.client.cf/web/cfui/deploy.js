/*eslint-env browser,amd*/
	
var uiTestFunc = null;

define(['i18n!cfui/nls/messages', 'orion/i18nUtil', "orion/bootstrap", "orion/xhr", 'orion/webui/littlelib', 'orion/Deferred', 'orion/cfui/cFClient', 'orion/PageUtil', 'orion/selection', 'orion/explorers/explorer',
	'orion/URITemplate', 'orion/PageLinks', 'orion/preferences'], 
		function(messages, i18nUtil, mBootstrap, xhr, lib, Deferred, CFClient, PageUtil, mSelection, mExplorer, URITemplate, PageLinks, Preferences) {

	mBootstrap.startup().then(
		function(core) {
			
			var pageParams = PageUtil.matchResourceParameters();
			var deployResource = decodeURIComponent(pageParams.resource);
			
			var serviceRegistry = core.serviceRegistry;
//			var preferences = core.preferences;
			var cFService = new CFClient.CFService(serviceRegistry);
			
			// initial message
			document.getElementById('title').appendChild(document.createTextNode(messages['deploy.chooseSpace'])); //$NON-NLS-0$
			var progressPane = document.getElementById('progressPane'); //$NON-NLS-0$
			var msgLabel = document.getElementById('messageLabel'); //$NON-NLS-0$
			var msgNode;
			var orgsDropdownNode = document.getElementById('orgsSection'); //$NON-NLS-0$
			var spacesTree = document.getElementById('spacesTree'); //$NON-NLS-0$
			var okButton = document.getElementById('okbutton'); //$NON-NLS-0$
			var explorer;
			
			function showMessage(message){
				msgNode = msgLabel.appendChild(document.createTextNode(message)); //$NON-NLS-0$
				progressPane.classList.add("running"); //$NON-NLS-0$
			}
			
			function hideMessage(){
				if(msgNode){
					msgLabel.removeChild(msgNode);
				}
				progressPane.classList.remove("running"); //$NON-NLS-0$
			}
			
			var selection;
			
			function setValid(valid){
				if(valid){
					okButton.classList.remove("disabled"); //$NON-NLS-0$
				} else {
					okButton.classList.add("disabled"); //$NON-NLS-0$
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
			
			showMessage(messages['deploy.gettingSpaces']);
			validate();
			
			
			// register hacked pref service
			
			var temp = document.createElement('a'); //$NON-NLS-0$
			temp.href = "../prefs/user"; //$NON-NLS-0$
			var location = temp.href;
			
			function PreferencesProvider(location) {
				this.location = location;
			}

			PreferencesProvider.prototype = {
				get: function(name) {
					return xhr("GET", this.location + name, { //$NON-NLS-0$
						headers: {
							"Orion-Version": "1" //$NON-NLS-0$ //$NON-NLS-1$
						},
						timeout: 15000,
						log: false
					}).then(function(result) {
						return result.response ? JSON.parse(result.response) : null;
					});
				},
				put: function(name, data) {
					return xhr("PUT", this.location + name, { //$NON-NLS-0$
						data: JSON.stringify(data),
						headers: {
							"Orion-Version": "1" //$NON-NLS-0$ //$NON-NLS-1$
						},
						contentType: "application/json;charset=UTF-8", //$NON-NLS-0$
						timeout: 15000
					}).then(function(result) {
						return result.response ? JSON.parse(result.response) : null;
					});
				},
				remove: function(name, key){
					return xhr("DELETE", this.location + name +"?key=" + key, { //$NON-NLS-0$ //$NON-NLS-1$
						headers: {
							"Orion-Version": "1" //$NON-NLS-0$ //$NON-NLS-1$
						},
						contentType: "application/json;charset=UTF-8", //$NON-NLS-0$
						timeout: 15000
					}).then(function(result) {
						return result.response ? JSON.parse(result.response) : null;
					});
				}
			};
			
			var service = new PreferencesProvider(location);
			serviceRegistry.registerService("orion.core.preference.provider", service, {}); //$NON-NLS-0$
			
			// This is code to ensure the first visit to orion works
			// we read settings and wait for the plugin registry to fully startup before continuing
			var preferences = new Preferences.PreferencesService(serviceRegistry);
			
			// cancel button
			var closeFrame = function() {
				 window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI",  //$NON-NLS-0$
					 source: "org.eclipse.orion.client.cf.deploy.uritemplate", cancelled: true}), "*"); //$NON-NLS-0$ //$NON-NLS-1$
			};
			
			var doAction = function() {
				showMessage(messages['deploy.deploying']);
				setValid(false);
				selection.getSelection(
					function(selection) {
						if(selection===null || selection.length===0){
							closeFrame();
							return;
						}
						
						explorer.getNavHandler().setSelectionPolicy("readonlySelection"); //$NON-NLS-0$
						
						var deployResourceJSON = JSON.parse(deployResource);
						
						cFService.pushApp(selection, null, decodeURIComponent(deployResourceJSON.ContentLocation + deployResourceJSON.AppPath)).then(
							function(result){
								var appName = result.App.name || result.App.entity.name;
								var host = (result.Route !== undefined ? (result.Route.host || result.Route.entity.host) : undefined);
								postMsg({
									CheckState: true,
									ToSave: {
										ConfigurationName: appName + " on " + result.Target.Space.Name + " / " + result.Target.Org.Name, //$NON-NLS-0$ //$NON-NLS-1$
										Parameters: {
											Target: {
												Url: result.Target.Url,
												Org: result.Target.Org.Name,
												Space: result.Target.Space.Name
											},
											Name: appName,
											Timeout: (result.Timeout !== undefined) ? result.Timeout : undefined
										},
										Url: (result.Route !== undefined) ? "http://" + host + "." + result.Domain : undefined, //$NON-NLS-0$
										UrlTitle: (result.Route !== undefined) ? appName : undefined,
										Type: "Cloud Foundry", //$NON-NLS-0$
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

			document.getElementById('okbutton').onclick = doAction; //$NON-NLS-0$
			document.getElementById('closeDialog').onclick = closeFrame; //$NON-NLS-0$
			 
			// allow frame to be dragged by title bar
			var that=this;
			var iframe = window.frameElement;
		    setTimeout(function() {
				var titleBar = document.getElementById('titleBar'); //$NON-NLS-0$
				titleBar.addEventListener('mousedown', function(e) { //$NON-NLS-0$
					that._dragging=true;
					if (titleBar.setCapture) {
						titleBar.setCapture();
					}
					that.start = {screenX: e.screenX,screenY: e.screenY};
				});
				titleBar.addEventListener('mousemove', function(e) { //$NON-NLS-0$
					if (that._dragging) {
						var dx = e.screenX - that.start.screenX;
						var dy = e.screenY - that.start.screenY;
						that.start.screenX = e.screenX;
						that.start.screenY = e.screenY;
						var x = parseInt(iframe.style.left) + dx;
						var y = parseInt(iframe.style.top) + dy;
						iframe.style.left = x+"px"; //$NON-NLS-0$
						iframe.style.top = y+"px"; //$NON-NLS-0$
					}
				});
				titleBar.addEventListener('mouseup', function(e) { //$NON-NLS-0$
					that._dragging=false;
					if (titleBar.releaseCapture) {
						titleBar.releaseCapture();
					}
				});
		    });

		    //
			var configAdmin = serviceRegistry.getService('orion.cm.configadmin'); //$NON-NLS-0$
			configAdmin.getConfiguration("app.settings").then( //$NON-NLS-0$
				function(config) {
					 // get target and app, then do push and open application
					getTarget(cFService, config, preferences).then(
						function(target){
							cFService.getOrgs(target).then(
								function(result2){
									hideMessage();
									
									var div1 = document.createElement("div"); //$NON-NLS-0$
									div1.id = "orgsLabel"; //$NON-NLS-0$
									var label = document.createElement("label"); //$NON-NLS-0$
									label.appendChild(document.createTextNode(messages['deploy.org']));
									div1.appendChild(label);
									orgsDropdownNode.appendChild(div1);

									var div2 = document.createElement("div"); //$NON-NLS-0$
									div2.id = "orgsDropdown"; //$NON-NLS-0$
									var orgsDropdown = document.createElement("select"); //$NON-NLS-0$
									result2.Orgs.forEach(function(org){
										var option = document.createElement("option"); //$NON-NLS-0$
										option.appendChild(document.createTextNode(org.Name));
										option.org = org;
										orgsDropdown.appendChild(option);
									});
									
									orgsDropdown.onchange = function(event){
										var selectedOrg = event.target.value;
										loadTargets(selectedOrg);
									};
									
									div2.appendChild(orgsDropdown);
									orgsDropdownNode.classList.add("sectionTable"); //$NON-NLS-0$
									orgsDropdownNode.appendChild(div2);
																		
									var targets = {};
									result2.Orgs.forEach(function(org){
										targets[org.Name] = [];
										if (org.Spaces)
											org.Spaces.forEach(function(space){
												var newTarget = {};
												newTarget.Url = target.Url;
												if (target.ManageUrl)
													newTarget.ManageUrl = target.ManageUrl;
												newTarget.Org = org.Name;
												newTarget.Space = space.Name;
												targets[org.Name].push(newTarget);
											});
									});
									
									selection = new mSelection.Selection(serviceRegistry, "orion.Spaces.selection"); //$NON-NLS-0$
									selection.addEventListener("selectionChanged", validate); //$NON-NLS-0$

									explorer = new mExplorer.Explorer(
										serviceRegistry,
										selection,
										new SpacesRenderer({checkbox: false, singleSelection: true, treeTableClass: "Spaces"})); //$NON-NLS-0$
									
									function loadTargets(org){
										var model = new mExplorer.ExplorerFlatModel(null, null, targets[org]);
										model.getId = function(item){
											return item.Space + item.Org;
										};
										spacesTree.classList.add("sectionTable"); //$NON-NLS-0$
										explorer.createTree(spacesTree.id, model, {});										
									}
									
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
		
		preferences.getPreferences('/cm/configurations').then( //$NON-NLS-0$
			function(settings){
				var cloud = settings.get("org.eclipse.orion.client.cf.settings"); //$NON-NLS-0$
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
				} else {
					var error = {};
					var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()}); //$NON-NLS-0$
					error.Message = i18nUtil.formatMessage(messages['deploy.setUpYourCloud'], cloudSettingsPageUrl); 
					error.Severity = "Warning"; //$NON-NLS-0$
					deferred.reject(error);
				}
			}, function(error){
				var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()}); //$NON-NLS-0$
				error.Message = i18nUtil.formatMessage(messages['deploy.setUpYourCloud'], cloudSettingsPageUrl); 
				error.Severity = "Warning"; //$NON-NLS-0$
				deferred.reject(error);
			}
		);
		return deferred;
	}

	function postMsg(status) {
		window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI",  //$NON-NLS-0$
			 source: "org.eclipse.orion.client.cf.deploy.uritemplate",  //$NON-NLS-0$
			 status: status}), "*"); //$NON-NLS-0$
	}
	
	function postError(error) {
		if (error.HttpCode === 404){
			error = {
				State: "NOT_DEPLOYED", //$NON-NLS-0$
				Message: error.Message
			};
		} else if (error.JsonData && error.JsonData.error_code) {
			var err = error.JsonData;
			if (err.error_code === "CF-InvalidAuthToken" || err.error_code === "CF-NotAuthenticated"){ //$NON-NLS-0$ //$NON-NLS-1$
				error.Retry = {
					parameters: [{id: "user", type: "text", name: messages['deploy.user']},  //$NON-NLS-0$ //$NON-NLS-1$
								 {id: "password", type: "password", name: messages['deploy.password']}]  //$NON-NLS-0$ //$NON-NLS-1$
				};
				
				error.forceShowMessage = true;
				error.Severity = "Info"; //$NON-NLS-0$
				error.Message = messages["deploy.enterCredentials"];
			
			} else if (err.error_code === "CF-TargetNotSet"){ //$NON-NLS-0$
				var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=Cloud").expand({OrionHome : PageLinks.getOrionHome()}); //$NON-NLS-0$
				error.Message = i18nUtil.formatMessage(messages['deploy.setUpYourCloud'], cloudSettingsPageUrl); 
			}
		}
		
		window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI",  //$NON-NLS-0$
			 source: "org.eclipse.orion.client.cf.deploy.uritemplate",  //$NON-NLS-0$
			 status: error}), "*"); //$NON-NLS-0$
	}
	
	function SpacesRenderer (options) {
		this._init(options);
	}
	SpacesRenderer.prototype = new mExplorer.SelectionRenderer(); 
	SpacesRenderer.prototype.constructor = SpacesRenderer;
	SpacesRenderer.prototype.getLabelColumnIndex = function() {
		return 0;
	};
	SpacesRenderer.prototype.emptyCallback = function(bodyElement){
		var tr = document.createElement("tr"); //$NON-NLS-0$
		var td = document.createElement("td"); //$NON-NLS-0$
		var noWorkspaceItems = document.createElement("div"); //$NON-NLS-0$
		noWorkspaceItems.classList.add("noFile"); //$NON-NLS-0$
		noWorkspaceItems.textContent = messages['deploy.noSpaces'];
		td.appendChild(noWorkspaceItems);
		tr.appendChild(td);
		bodyElement.appendChild(tr);
	}
	SpacesRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		if(col_no===0){
			var col = document.createElement("td"); //$NON-NLS-0$
			var span = document.createElement("span"); //$NON-NLS-0$
			span.id = tableRow.id+"navSpan"; //$NON-NLS-0$
			col.appendChild(span);
			span.className = "mainNavColumn singleNavColumn"; //$NON-NLS-0$
			span.appendChild(document.createTextNode(i18nUtil.formatMessage(messages['deploy.spaceOrg'], item.Space, item.Org)));
			return col;
		}
	};

});