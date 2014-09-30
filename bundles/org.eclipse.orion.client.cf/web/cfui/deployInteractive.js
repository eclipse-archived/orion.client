/*global parent window document define orion setTimeout*/
	
var uiTestFunc = null;

define(["orion/bootstrap", "orion/xhr", 'orion/webui/littlelib', 'orion/Deferred', 'orion/cfui/cFClient', 'orion/PageUtil', 'orion/selection',
	'orion/URITemplate', 'orion/PageLinks', 'orion/preferences', 'cfui/cfUtil', 'orion/objects', 'orion/widgets/input/ComboTextInput',
	'orion/webui/Wizard', 'orion/fileClient', 'orion/urlUtils'], 
		function(mBootstrap, xhr, lib, Deferred, CFClient, PageUtil, mSelection, URITemplate, PageLinks, 
				Preferences, mCfUtil, objects, ComboTextInput, Wizard, mFileClient, URLUtil) {
	
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
			var msgText = document.getElementById('messageText'); //$NON-NLS-0$
			var msgButton = document.getElementById('messageButton');
			var page1;
			var page2;
			var page3;
			var commonPane;
			var _clouds;
			var _defaultTarget;
			var cloudsDropdown;
			var orgsDropdown;
			var spacesDropdown;
			var appsInput;
			var appsDropdown;
			var hostInput;
			var hostDropdown;
			var servicesList;
			var servicesDropdown;
			var saveManifestCheckbox;
			var command;
			var path;
			var instances;
			var buildpack;
			var memory;
			var memoryUnit;
			var timeout;
			var deployResourceJSON = JSON.parse(deployResource);
			var relativeFilePath = new URL(deployResourceJSON.ContentLocation).href;
			var orionHomeUrl = new URL(PageLinks.getOrionHome());
			if(relativeFilePath.indexOf(orionHomeUrl.origin) === 0){
				relativeFilePath = relativeFilePath.substring(orionHomeUrl.origin.length);
			}
			if(relativeFilePath.indexOf(orionHomeUrl.pathname) === 0){
				relativeFilePath = relativeFilePath.substring(orionHomeUrl.pathname.length);
			}
			var manifestContents = {applications: [{}]};
			var manifestInfo = {};
			
			function parseMessage(msg){
				var chunks, msgNode;
				try {
					chunks = URLUtil.detectValidURL(msg);
				} catch (e) {
					// Contained a corrupt URL
					chunks = [];
				}
				if (chunks.length) {
					msgNode = document.createDocumentFragment();
					URLUtil.processURLSegments(msgNode, chunks);
					// All status links open in new window
					Array.prototype.forEach.call(lib.$$("a", msgNode), function(link) { //$NON-NLS-0$
						link.target = "_blank"; //$NON-NLS-0$
					});
				}
				return msgNode || document.createTextNode(msg);
			}

			function showMessage(message){
				msgLabel.classList.remove("errorMessage");
				msgContainer.classList.remove("errorMessage");
				lib.empty(msgText);
				msgText.style.width = "100%";
				msgText.appendChild(parseMessage(message));
				msgButton.className = "";
				msgContainer.classList.add("showing"); //$NON-NLS-0$
			}
			
			function showError(message){
				msgLabel.classList.add("errorMessage");
				msgContainer.classList.add("errorMessage");
				lib.empty(msgText);
				msgText.style.width = "calc(100% - 10px)";
				msgText.appendChild(parseMessage(message.Message || message));
				lib.empty(msgButton);
				msgButton.className = "dismissButton core-sprite-close imageSprite";
				msgButton.onclick = hideMessage;
				msgContainer.classList.add("showing"); //$NON-NLS-0$
			}
			
			function hideMessage(){
				msgLabel.classList.remove("errorMessage");
				msgContainer.classList.remove("errorMessage");
				lib.empty(msgText);
				msgContainer.classList.remove("showing"); //$NON-NLS-0$
			}
			
			var selection;
			
//			showMessage("Loading deployment settings...");
			
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
			
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			
			// cancel button
			var closeFrame = function() {
				 window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
					 source: "org.eclipse.orion.client.cf.deploy.uritemplate", cancelled: true}), "*");
			};
			
			var getManifestInfo = function(results){
				var ret = objects.clone(manifestContents);
				if(!manifestContents.applications.length>0){
					manifestContents.applications.push({});
				}
				if(results.name){
					manifestContents.applications[0].name = results.name;
				}
				if(results.host){
					manifestContents.applications[0].host = results.host;
				}
				if(results.services){
					if(results.services.length === 0){
						delete manifestContents.applications[0].services;
					} else {
						manifestContents.applications[0].services = results.services;
					}
				}
				if(typeof results.command === "string"){
					if(results.command){
						manifestContents.applications[0].command = results.command;
					} else {
						delete manifestContents.applications[0].command;
					}
				}
				if(typeof results.path === "string"){
					if(results.path){
						manifestContents.applications[0].path = results.path;
					} else {
						delete manifestContents.applications[0].path;
					}
				}
				if(typeof results.buildpack === "string"){
					if(results.buildpack){
						manifestContents.applications[0].buildpack = results.buildpack;
					} else {
						delete manifestContents.applications[0].buildpack;
					}
				}
				if(typeof results.memory === "string"){
					if(results.memory){
						manifestContents.applications[0].memory = results.memory;
					} else {
						delete manifestContents.applications[0].memory;
					}
				}
				if(typeof results.instances !== "undefined"){
					if(results.instances){
						manifestContents.applications[0].instances = results.instances;
					} else {
						delete manifestContents.applications[0].instances;
					}
				}
				if(typeof results.timeout !== "undefined"){
					if(results.timeout){
						manifestContents.applications[0].timeout = results.timeout;
					} else {
						delete manifestContents.applications[0].timeout;
					}
				}
				return ret;
			};
			
			var doAction = function(results) {
				showMessage("Deploying...");
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
						
						var editLocation = new URL("../edit/edit.html#" + deployResourceJSON.ContentLocation, window.location.href);
						
						var manifest = getManifestInfo(results);
						
						cFService.pushApp(selection, null, decodeURIComponent(deployResourceJSON.ContentLocation + deployResourceJSON.AppPath), manifest, saveManifestCheckbox.checked).then(
							function(result){
								postMsg(mCfUtil.prepareLaunchConfigurationContent(result, deployResourceJSON.AppPath, editLocation));
							}, function(error){
								handleError(error, selection, true);
							}
						);
					}
				);
			};
			
			document.getElementById('closeDialog').addEventListener('click', closeFrame); //$NON-NLS-1$ //$NON-NLS-0$
			 
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
		    
		    commonPane = new Wizard.WizardPage({
		    	template: '<div class="manifest formTable" id="manifest"></div>',
		    	render: function(){
		    		var manifestElement = document.getElementById("manifest");
					saveManifestCheckbox = document.createElement("input");
					saveManifestCheckbox.type = "checkbox";
					saveManifestCheckbox.id = "saveManifest";
					saveManifestCheckbox.checked = "checked";
					manifestElement.appendChild(saveManifestCheckbox);
					var label = document.createElement("label");
					label.className = "manifestLabel";
					label.appendChild(document.createTextNode("Save to manifest file: "));
					var manifestFolder = deployResourceJSON.AppPath || "";
					manifestFolder = manifestFolder.substring(0, manifestFolder.lastIndexOf("/")+1);
					label.appendChild(document.createTextNode("/" + manifestFolder + "manifest.yml"));
					manifestElement.appendChild(label);
		    	},
		    	getResults: function(){
		    		var ret = {};
		    		ret.saveManifest = saveManifestCheckbox.checked;
		    		return ret;
		    	}
		    });
		    
		    page1 = new Wizard.WizardPage({
		    	template: "<table class=\"formTable\">"+
			    	"<tr>"+
						"<td id=\"cloudsLabel\" class=\"label\"></td>"+
						"<td id=\"clouds\" class=\"selectCell\"></td>"+
					"</tr>"+
					"<tr>"+
						"<td id=\"orgsLabel\" class=\"label\"></td>"+
						"<td id=\"orgs\" class=\"selectCell\"></td>"+
					"</tr>"+
					"<tr>"+
						"<td id=\"spacesLabel\" class=\"label\"></td>"+
						"<td id=\"spaces\" class=\"selectCell\"></td>"+
					"</tr>"+
					"<tr>"+
						"<td id=\"nameLabel\" class=\"label\"></td>"+
						"<td id=\"name\" class=\"selectCell\"></td>"+
					"</tr>"+
					"<tr>"+
						"<td id=\"hostLabel\" class=\"label\"></td>"+
						"<td id=\"host\" class=\"selectCell\"></td>"+
					"</tr>"+
				"</table>",
				render: function(){
					this.wizard.validate();

					var targets = {};
					
					// clouds field
					if (_clouds.length > 1){
						document.getElementById("cloudsLabel").appendChild(document.createTextNode("Location*:"));
						cloudsDropdown = document.createElement("select");
						_clouds.forEach(function(cloud){
							var option = document.createElement("option");
							option.appendChild(document.createTextNode(cloud.Name || cloud.Url));
							option.cloud = cloud;
							if (_defaultTarget && _defaultTarget.Url === cloud.Url)
								option.selected = "selected";
							cloudsDropdown.appendChild(option);
						});
						cloudsDropdown.onchange = function(event){
							lib.empty(orgsDropdown);
							lib.empty(spacesDropdown);
							setSelection();
							var selectedCloud = _clouds[event.target.selectedIndex];
							loadTargets(selectedCloud);
						};
						document.getElementById("clouds").appendChild(cloudsDropdown);
					} else {
						document.getElementById("cloudsLabel").appendChild(document.createTextNode("Location:"));
						document.getElementById("clouds").appendChild(document.createTextNode(_clouds[0].Name || _clouds[0].Url));
					}

					// orgs field
					document.getElementById("orgsLabel").appendChild(document.createTextNode("Organization*:"));
					orgsDropdown = document.createElement("select");
					orgsDropdown.onchange = function(event){
						var selectedOrg = event.target.value;
						loadSpaces(selectedOrg);
					};
					document.getElementById("orgs").appendChild(orgsDropdown);
					
					// spaces field
					selection = new mSelection.Selection(serviceRegistry, "orion.Spaces.selection"); //$NON-NLS-0$
					selection.addEventListener("selectionChanged", function(){this.validate();}.bind(this.wizard));
					
					document.getElementById("spacesLabel").appendChild(document.createTextNode("Space*:"));
					spacesDropdown = document.createElement("select");
					spacesDropdown.onchange = function(event){
						setSelection();
						selection.getSelection(
							function(selection) {
								loadApplications(selection);
								loadHosts(selection);
							}
						);
					};
					document.getElementById("spaces").appendChild(spacesDropdown);
					
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

					function loadTargets(target){
						showMessage("Loading deployment settings...");
						cFService.getOrgs(target).then(
							function(orgs){
								lib.empty(orgsDropdown);
								orgs.Orgs.forEach(function(org){
									var option = document.createElement("option");
									option.appendChild(document.createTextNode(org.Name));
									option.org = org;
									if (_defaultTarget && _defaultTarget.OrgId === org.Guid)
										option.selected = "selected";
									orgsDropdown.appendChild(option);
									
									targets[org.Name] = [];
									if (org.Spaces){
										org.Spaces.forEach(function(space){
											var newTarget = {};
											newTarget.Url = target.Url;
											if (target.ManageUrl)
												newTarget.ManageUrl = target.ManageUrl;
											newTarget.Org = org.Name;
											newTarget.Space = space.Name;
											newTarget.SpaceId = space.Guid;
											targets[org.Name].push(newTarget);
										});
									}
								});

								loadSpaces(orgsDropdown.value);
								hideMessage();
							}, function(error){
								handleError(error, target, false, function(){loadTargets(target);});
							}
						);
					}
					
					function loadSpaces(org){
						var targetsToDisplay = targets[org];
						lib.empty(spacesDropdown);
						targetsToDisplay.forEach(function(target){
							var option = document.createElement("option");
							option.appendChild(document.createTextNode(target.Space));
							option.target = target;
							if (_defaultTarget && _defaultTarget.SpaceId === target.SpaceId)
								option.selected = "selected";
							spacesDropdown.appendChild(option);
						});
						setSelection();
						selection.getSelection(
							function(selection) {
								loadApplications(selection);
								loadHosts(selection);
							});
					}
					
					var appsList = [];
					var appsDeferred;
					
					function loadApplications(target){
						appsDeferred = cFService.getApps(target);
						appsDeferred.then(function(apps){
							appsList = [];
							if(apps.Apps){
								apps.Apps.forEach(function(app){
									appsList.push(app.Name);
								});
							}
						}.bind(this));
					}
					
					var routesList = [];
					var routesDeferred;
					
					function loadHosts(target){
						routesDeferred = cFService.getRoutes(target);
						routesDeferred.then(function(routes){
							if(routes.Routes){
								routesList = [];
								routes.Routes.forEach(function(route){
									routesList.push(route.Host);
								});
							}
						}.bind(this));							
					}
					
					document.getElementById("nameLabel").appendChild(document.createTextNode("Application Name*:"));
					
					appsDropdown = new ComboTextInput({
						id: "applicationNameTextInput", //$NON-NLS-0$
						parentNode: document.getElementById("name"),
						insertBeforeNode: this._replaceWrapper,
						hasButton: false,
						hasInputCompletion: true,
						serviceRegistry: this._serviceRegistry,
						onRecentEntryDelete: null,
						defaultRecentEntryProposalProvider: function(onItem){
							appsDeferred.then(function(){
								var ret = [];
								appsList.forEach(function(app){
									if(!app) return;
									ret.push({type: "proposal", label: app, value: app});
								});
								onItem(ret);									
							}.bind(this));
						}
					});
					
					appsInput= appsDropdown.getTextInputNode();						
					appsInput.onkeyup = function(){this.validate();}.bind(this.wizard);
					appsInput.addEventListener("focus",function(){this.validate();}.bind(this.wizard));
					
					if(manifestInfo.name){
						appsInput.value = manifestInfo.name;
					}
					
					document.getElementById("hostLabel").appendChild(document.createTextNode("Host:"));
					
					hostDropdown = new ComboTextInput({
						id: "applicationRouteTextInput", //$NON-NLS-0$
						parentNode: document.getElementById("host"),
						insertBeforeNode: this._replaceWrapper,
						hasButton: false,
						hasInputCompletion: true,
						serviceRegistry: this._serviceRegistry,
						onRecentEntryDelete: null,
						defaultRecentEntryProposalProvider: function(onItem){
							routesDeferred.then(function(){
								var ret = [];
								routesList.forEach(function(route){
									if(!route) return;
									ret.push({type: "proposal", label: route, value: route});
								});
								onItem(ret);
							}.bind(this));
						}
					});
					
					hostInput = hostDropdown.getTextInputNode();
					hostInput.value = manifestInfo.host || manifestInfo.name || "";
					
					var selectedCloud = _clouds[_clouds.lenght > 1 ? cloudsDropdown.selectedIndex : 0];
					loadTargets(selectedCloud);
			    },
			    validate: function(setValid) {
					if(!selection){
						setValid(false);
						return;
					}
					if(!appsInput.value){
						setValid(false);
						return;
					}
					selection.getSelection(function(selection) {
						if(selection===null || selection.length===0){
							setValid(false);
							return;
						}
						if(appsInput.value){
							setValid(true);
						} else {
							setValid(true);
						}
					});
				},
				getResults: function(){
					var res = {};
					if(appsInput && appsInput.value){
						res.name = appsInput.value;
					}
					if(hostInput && hostInput.value){
						res.host = hostInput.value;
					}
					return res;
				}
			});
		    
		page2 = new Wizard.WizardPage({
			template:'<table class="formTable">'+
				'<tr>'+
					'<td id="allServicesLabel" class="label" colspan="3"></td>'+
				'</tr>'+
				'<tr>'+
					'<td id="servicesLabel" class="label"></td>'+
					'<td id="servicesLabel">&nbsp;</td>'+
					'<td id="servicesAdded" class="label"></td>'+
				'</tr>'+
				'<tr>'+
					'<td id="servicesDropdown" class="listCell"></td>'+
					'<td id="servicesAddRemoveButtonsCol" class="listCell"></td>'+
					'<td id="servicesList" class="listCell"></td>'+
				'</tr>'+
			'</table>',
			render: function(){
	    		document.getElementById("allServicesLabel").appendChild(document.createTextNode("Add services from the list."));
	    		document.getElementById("servicesLabel").appendChild(document.createTextNode("Existing Services:"));
	    		servicesDropdown = document.createElement("select");
	    		servicesDropdown.size = 8;
	    		servicesDropdown.multiple="multiple";
		    	document.getElementById("servicesDropdown").appendChild(servicesDropdown);
		    	
		    	document.getElementById("servicesAdded").appendChild(document.createTextNode("Application Services:"));
	    		servicesList = document.createElement("select");
	    		servicesList.multiple="multiple";
	    		servicesList.size = 8;
		    	document.getElementById("servicesList").appendChild(servicesList);
		    	
		    	var addButton = document.createElement("button");
		    	addButton.appendChild(document.createTextNode(">"));
		    	addButton.className = "orionButton commandButton";
		    	var removeButton = document.createElement("button");
		    	removeButton.className = "orionButton commandButton";
		    	removeButton.appendChild(document.createTextNode("<"));
		    	document.getElementById("servicesAddRemoveButtonsCol").appendChild(removeButton);
		    	document.getElementById("servicesAddRemoveButtonsCol").appendChild(addButton);
		    	
		    	addButton.addEventListener('click', function(){
		    		for(var i=servicesDropdown.options.length-1; i>=0; i--){
		    			var option = servicesDropdown.options[i];
							if(option.selected){
								servicesDropdown.removeChild(option);
								servicesList.appendChild(option);
							}
						}
					});
					
				removeButton.addEventListener('click', function(){
		    		for(var i=servicesList.options.length-1; i>=0; i--){
		    			var option = servicesList.options[i];
							if(option.selected){
								servicesList.removeChild(option);
								servicesDropdown.appendChild(option);
							}
						}
					});
					
				var services = manifestInfo.services;
				if(manifestInfo.services){
					if(!Array.isArray(services)){
						if(typeof services === "object"){
							services = Object.keys(services);
							if(services.lengh > 0){
								document.getElementById("allServicesLabel").appendChild(document.createElement("br"));
								document.getElementById("allServicesLabel").appendChild(document.createTextNode("Convert my manifest.yml file to v6"));
							}
						} else {
							services = [];
						}
					}
	    			services.forEach(function(serviceName){
		    			var serviceOption = document.createElement("option");
		    			if(typeof serviceName !== "string"){
		    				return;
		    			}
						serviceOption.appendChild(document.createTextNode(serviceName));
						serviceOption.service = serviceName;
						serviceOption.id = "service_" + serviceName;
						servicesList.appendChild(serviceOption);	
	    			});
	    		}
	    		
	    		showMessage("Loading services...");
		    	cFService.getServices(selection.getSelection()).then(
		    		function(servicesResp){
			    		hideMessage();
			    		var servicesToChooseFrom = [];
			    		
						if(servicesResp.Children){
							servicesResp.Children.forEach(function(service){
								if(services && services.some(function(manService){return manService === service.Name;})){
									
								} else {
									servicesToChooseFrom.push(service.Name);
								}
							});
						}
							
			    		servicesToChooseFrom.forEach(function(serviceName){
							var serviceOption = document.createElement("option");
							serviceOption.appendChild(document.createTextNode(serviceName));
							serviceOption.service = serviceName;
							serviceOption.id = "service_" + serviceName;
							servicesDropdown.appendChild(serviceOption);
			    		});
		    		}.bind(this), 
		    		function(error){
		    			handleError(error, selection.getSelection());
		    		}.bind(this)
		    	);
		    },
		    getResults: function(){
		    	var ret = {};
		    	if(servicesList){
					var services = [];
					for(var i=0; i<servicesList.options.length; i++){
						services.push(servicesList.options[i].value);
					}
					ret.services = services;
				}
				return ret;
		    }
		    });
		    
		    
		     page3 = new Wizard.WizardPage({
		    	template: '<table class="formTable">'+
				'<tr>'+
					'<td id="commandLabel" class="label"></td>'+
					'<td id="command" class="selectCell"></td>'+
				'</tr>'+
				'<tr>'+
					'<td id="pathLabel" class="label"></td>'+
					'<td id="path" class="selectCell"></td>'+
				'</tr>'+
				'<tr>'+
					'<td id="buildpackLabel" class="label"></td>'+
					'<td id="buildpack" class="selectCell"></td>'+
				'</tr>'+
				'<tr>'+
					'<td id="memoryLabel" class="label"></td>'+
					'<td id="memory" class="selectCell"></td>'+
				'</tr>'+
				'<tr>'+
					'<td id="instancesLabel" class="label"></td>'+
					'<td id="instances" class="selectCell"></td>'+
				'</tr>'+
				'<tr>'+
					'<td id="timeoutLabel" class="label"></td>'+
					'<td id="timeout" class="selectCell"></td>'+
				'</tr>'+
			'</table>',
		    	render: function(){
			    	document.getElementById("commandLabel").appendChild(document.createTextNode("Command:"));
			    	command = document.createElement("input");
			    	if(manifestInfo.command){
			    		command.value = manifestInfo.command;
			    	}
			    	document.getElementById("command").appendChild(command);
			    	document.getElementById("pathLabel").appendChild(document.createTextNode("Path:"));
			    	path = document.createElement("input");
			    	if(manifestInfo.path){
			    		path.value = manifestInfo.path;
			    	}
			    	document.getElementById("path").appendChild(path);
			    	document.getElementById("buildpackLabel").appendChild(document.createTextNode("Buildpack Url:"));
			    	buildpack = document.createElement("input");
			    	if(manifestInfo.buildpack){
			    		buildpack.value = manifestInfo.buildpack;
			    	}
			    	document.getElementById("buildpack").appendChild(buildpack);
			    	document.getElementById("memoryLabel").appendChild(document.createTextNode("Memory:"));
			    	memory = document.createElement("input");
			    	memory.id = "memoryInput";
			    	memory.type = "number";
			    	memory.min = "0";
			    	memoryUnit = document.createElement("select");
			    	memoryUnit.id = "memoryUnit";
					var option = document.createElement("option");
					option.appendChild(document.createTextNode("MB"));
					option.value = "MB";
					memoryUnit.appendChild(option);
					option = document.createElement("option");
					option.appendChild(document.createTextNode("GB"));
					option.value = "GB";
					memoryUnit.appendChild(option);
			    	if(manifestInfo.memory){
			    		if(manifestInfo.memory.toUpperCase().indexOf("M")>0 || manifestInfo.memory.toUpperCase().indexOf("G")>0){
			    			var indexOfUnit = manifestInfo.memory.toUpperCase().indexOf("M") > 0 ? manifestInfo.memory.toUpperCase().indexOf("M") : manifestInfo.memory.toUpperCase().indexOf("G");
							memory.value = manifestInfo.memory.substring(0, indexOfUnit);
							var unit = manifestInfo.memory.substring(indexOfUnit).toUpperCase();
							if(unit.trim().length === 1){
								unit += "B";
							}
							memoryUnit.value = unit;
			    		}
			    	}
			    	document.getElementById("memory").appendChild(memory);
			    	document.getElementById("memory").appendChild(memoryUnit);
			    	
			    	document.getElementById("instancesLabel").appendChild(document.createTextNode("Instances:"));
			    	instances = document.createElement("input");
			    	instances.type = "number";
			    	instances.min = "0";
			    	if(manifestInfo.instances){
			    		instances.value = manifestInfo.instances;
			    	}
			    	document.getElementById("instances").appendChild(instances);
			    	document.getElementById("timeoutLabel").appendChild(document.createTextNode("Timeout (sec):"));
			    	timeout = document.createElement("input");
			    	timeout.type = "number";
			    	timeout.min = "0";
			    	if(manifestInfo.timeout){
			    		timeout.value = manifestInfo.timeout;
			    	}
			    	document.getElementById("timeout").appendChild(timeout);
			    },
			    getResults: function(){
			    var ret = {};
			    if(command){
			    	ret.command = command.value;
			    }
			    if(buildpack){
					ret.buildpack = buildpack.value;
				}
				if(memory){
					ret.memory = memory.value ? memory.value + memoryUnit.value : "";
				}
				if(instances){
					ret.instances = instances.value;
				}
				if(timeout){
					ret.timeout = timeout.value;
				}
				if(path){
					ret.path = path.value;
				}
		    	return ret;
			    }
		    });

		    //
		    function loadScreen(){
				Deferred.all([getTargets(cFService, preferences), getDefaultTarget(fileClient, deployResourceJSON)]).then(
					function(results){
						_clouds = results[0];
						_defaultTarget = results[1];
						var wizard = new Wizard.Wizard({
							parent: "wizard",
							pages: [page1, page2, page3],
							commonPane: commonPane,
							onSubmit: doAction,
							onCancel: closeFrame,
							buttonNames: {ok: "Deploy"},
							size: {width: "420px", height: "180px"}
						});
					}, function(error){
						handleError(error, null, true);
					}
				);
			}
			
				function getDefaultTarget(fileClient, deployResourceJSON) {
		var clientDeferred = new Deferred();
		fileClient.read(deployResourceJSON.ContentLocation, true).then(
			function(result){
				mCfUtil.getDefaultTarget(result).then(
					clientDeferred.resolve,
					clientDeferred.reject
				);
			}, clientDeferred.reject
		);
		return clientDeferred;
	}
	
	function getTargets(cFService, preferences) {
		return mCfUtil.getTargets(preferences);
	}

	function postMsg(status) {
		window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
			 source: "org.eclipse.orion.client.cf.deploy.uritemplate", 
			 status: status}), "*");
	}
	
	function handleError(error, target, post, retryFunc) {
		error.Severity = "Error";
		if(error.Message){
			if (error.Message.indexOf("The host is taken")===0){
				error.Message = "The host is already in use by another application. Please check the host/domain in the manifest file.";
			}
		}
		
		if (error.HttpCode === 404){
			error = {
				State: "NOT_DEPLOYED",
				Message: error.Message,
				Severity: "Error"
			};
		} else if (error.JsonData && error.JsonData.error_code) {
			var err = error.JsonData;
			if (err.error_code === "CF-InvalidAuthToken" || err.error_code === "CF-NotAuthenticated"){
				error.Retry = {
					parameters: [{id: "user", type: "text", name: "ID:"}, {id: "password", type: "password", name: "Password:"}, {id: "url", hidden: true, value: target.Url}]
				};
				
				error.forceShowMessage = true;
				error.Severity = "Info";
				error.Message = mCfUtil.getLoginMessage(target.ManageUrl);
			
			} else if (err.error_code === "CF-TargetNotSet"){
				var cloudSettingsPageUrl = new URITemplate("{+OrionHome}/settings/settings.html#,category=cloud").expand({OrionHome : PageLinks.getOrionHome()});
				error.Message = "Set up your Cloud. Go to [Settings](" + cloudSettingsPageUrl + ")."; 
			}
		}
		if(post){
			window.parent.postMessage(JSON.stringify({pageService: "orion.page.delegatedUI", 
				 source: "org.eclipse.orion.client.cf.deploy.uritemplate", 
				 status: error}), "*");
		} else {
			showError(error);
			
			if(error.Retry && error.Retry.parameters){
				var fields = document.createElement("div");
				var paramInputs = {};
				function submitParams(){
					var params = {};
					for(var i=0; i<error.Retry.parameters.length; i++){
						var param = error.Retry.parameters[i];
						if(param.hidden){
							params[param.id] = param.value;
						} else {
							params[param.id] = paramInputs[param.id].value;
						}
					}
					if(params.url && params.user && params.password){
						showMessage("Logging in to " + params.url + "...");
						cFService.login(params.url, params.user, params.password).then(function(result){
							hideMessage();
							if(retryFunc){
								retryFunc(result);
							}
						}, function(newError){
							hideMessage();
							if(newError.HttpCode === 401){
								handleError(error, target, post, retryFunc);
							} else {
								handleError(newError, target, post, retryFunc);
							}
						});
					}
				}
				fields.className = "retryFields";
				for(var i=0; i<error.Retry.parameters.length; i++){
					var param = error.Retry.parameters[i];
					if(param.hidden){
						continue;
					}
					var label = document.createElement("label");
					label.appendChild(document.createTextNode(param.name));
					var input = document.createElement("input");
					input.type = param.type;
					input.id = param.id;
					input.onkeydown = function(event){
						if(event.keyCode === 13){
							submitParams();
						} else if(event.keyCode === 27) {
							hideMessage();
						}
					}
					paramInputs[param.id] = input;
					fields.appendChild(label);
					fields.appendChild(input);
				}
				var submitButton = document.createElement("button");
				submitButton.appendChild(document.createTextNode("Submit"));
				submitButton.onclick = submitParams;
				fields.appendChild(submitButton);
				msgText.appendChild(fields);
			}
		}
	}
		    
			cFService.getManifestInfo(relativeFilePath).then(function(manifestResponse){
				if(manifestResponse.Type === "Manifest" && manifestResponse.Contents && manifestResponse.Contents.applications && manifestResponse.Contents.applications.length > 0){				
					manifestContents = manifestResponse.Contents;
			    	manifestInfo = manifestResponse.Contents.applications[0];
				}
		    	loadScreen();
		    }.bind(this), loadScreen);
		}
	);
	
});
