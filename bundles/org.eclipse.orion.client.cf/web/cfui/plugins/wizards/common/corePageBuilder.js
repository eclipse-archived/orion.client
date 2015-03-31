/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define(['i18n!cfui/nls/messages', 'orion/selection', 'orion/widgets/input/ComboTextInput', 'orion/webui/Wizard', 'orion/webui/littlelib'], 
		function(messages, mSelection, ComboTextInput, mWizard, lib){
	
	/**
	 * A core page builder. The page gathers the minimum necessary
	 * deployment parameters, i.e. target, application name & host.
	 *
	 */
	
	var rendered = false;
	
	function CorePageBuilder(options){
		options = options || {};
		this._init(options);
	}
	
	function isRendered(){
		return rendered;
	}
	
	function setRendered(state){
		rendered = state;
	}
	
	CorePageBuilder.constructor = CorePageBuilder;
	CorePageBuilder.prototype = {
			
		_init : function(options){
			this._confName = options.ConfName || null,
			this._clouds = options.Clouds || [];
			this._defaultTarget = options.DefaultTarget;
			this._manifestPath = options.ManifestPath || ""; //$NON-NLS-0$
			this._manifestApplication = options.ManifestApplication;
			this._manifestInstrumentation = options.ManifestInstrumentation || {};
			this._serviceRegistry = options.serviceRegistry;
			this._cfService = options.CFService;
			
			this._showMessage = options.showMessage;
			this._hideMessage = options.hideMessage;
			this._handleError = options.handleError;
			this._postError = options.postError;		
			
			/* application list */
			this._appsList = [];
			this._appsDeferred;
			
			/* route list */
			this._routesList = [];
			this._routesDeferred;
		},
		
		_setSelection : function(){
			var self = this;
			
			if(!self._spacesDropdown.value){
				self._selection.setSelections();
				return;
			}
			
			var orgTargets = self._targets[self._orgsDropdown.value];
			if(!orgTargets){
				self._selection.setSelections();
				return;
			}
			
			for(var i=0; i<orgTargets.length; i++){
				if(orgTargets[i].Space == self._spacesDropdown.value){
					self._selection.setSelections(orgTargets[i]);
					self._defaultTarget.OrgId = null;
					self._defaultTarget.Org = orgTargets[i].Org;
					self._defaultTarget.SpaceId = null;
					self._defaultTarget.Space = orgTargets[i].Space;
					return;
				}
			}
		},
		
		_loadTargets : function(target){
			var self = this;
			
			self._showMessage(messages["loadingDeploymentSettings..."]);
			self._cfService.getOrgs(target).then(
				function(orgs){
					lib.empty(self._orgsDropdown);
					orgs.Orgs.forEach(
						function(org){
							var option = document.createElement("option"); //$NON-NLS-0$
							option.appendChild(document.createTextNode(org.Name));
							option.org = org;
							
							if (self._defaultTarget && (self._defaultTarget.OrgId === org.Guid
									|| self._defaultTarget.Org === org.Name)){
								option.selected = "selected"; //$NON-NLS-0$
								self._defaultTarget.Org = org.Name;
							}
							
							self._orgsDropdown.appendChild(option);
							self._targets[org.Name] = [];
							
							if (org.Spaces){
								org.Spaces.forEach(function(space){
									var newTarget = {};
									newTarget.Url = target.Url;
									if (target.ManageUrl)
										newTarget.ManageUrl = target.ManageUrl;
									
									newTarget.Org = org.Name;
									newTarget.Space = space.Name;
									newTarget.SpaceId = space.Guid;
									self._targets[org.Name].push(newTarget);
								});
							}
						}
					);
					
					self._loadSpaces(self._orgsDropdown.value);
					self._hideMessage();
				}, function(error){
					self._handleError(error, target, function(){ self._loadTargets(target); });
				}
			);
		},
		
		_loadSpaces : function(org){
			var self = this;
			
			var targetsToDisplay = self._targets[org];
			lib.empty(self._spacesDropdown);
			lib.empty(self._domainsDropdown);
			
			targetsToDisplay.forEach(function(target){
				var option = document.createElement("option"); //$NON-NLS-0$
				option.appendChild(document.createTextNode(target.Space));
				option.target = target;
				
				if (self._defaultTarget && (self._defaultTarget.SpaceId === target.SpaceId
						|| self._defaultTarget.Space === target.Space)){
					option.selected = "selected"; //$NON-NLS-0$
					self._defaultTarget.Space = target.Space;
				}
				
				self._spacesDropdown.appendChild(option);
			});
			
			self._setSelection();
			self._selection.getSelection(function(selection){
				self._loadDomains(selection);
				self._loadApplications(selection);
				self._loadHosts(selection);
			});
		},
		
		_loadDomains : function(target){
			var self = this;
			lib.empty(self._domainsDropdown);
			
			self._domainsDeferred = self._cfService.getDomains(target);
			self._domainsDeferred.then(function(domains){
				if(domains.Domains){
					domains.Domains.forEach(function(domain){
						var option = document.createElement("option"); //$NON-NLS-0$
						option.appendChild(document.createTextNode(domain.DomainName));
						
						if (domain.DomainName === (self._manifestInstrumentation.domain || self._manifestApplication.domain)){
							option.selected = "selected"; //$NON-NLS-0$
				    	}
						if (self._manifestInstrumentation.domain) {
							self._domainsDropdown.classList.add("modifiedCell");
						}
						
						self._domainsDropdown.appendChild(option);
					});
					
					self._domainsDropdown.onchange = function(evt) {
			    		if (self._domainsDropdown.value === self._manifestApplication.domain){
			    			self._domainsDropdown.classList.remove("modifiedCell");
			    		} else {
			    			self._domainsDropdown.classList.add("modifiedCell");
			    		}
			    	}
				}
			});
		},
		
		_loadApplications : function(target){
			var self = this;
			
			self._appsDeferred = self._cfService.getApps(target);
			self._appsDeferred.then(function(apps){
				self._appsList = [];
				if(apps.Apps){
					apps.Apps.forEach(function(app){
						self._appsList.push(app.Name);
					});
				}
			});
		},
		
		_loadHosts : function(target){
			var self = this;
			
			self._routesDeferred = self._cfService.getRoutes(target);
			self._routesDeferred.then(function(routes){
				if(routes.Routes){
					self._routesList = [];
					routes.Routes.forEach(function(route){
						self._routesList.push(route.Host);
					});
				}
			});							
		},
		
		getSelection : function(){
			return this._selection;
		},
			
		build : function(){
			
			var self = this;
			return new mWizard.WizardPage({
				
		    	template: "<table class=\"formTable\">"+ //$NON-NLS-0$
					"<tr>"+ //$NON-NLS-0$
						"<td id=\"launchConfLabel\" class=\"label\"></td>"+ //$NON-NLS-0$
						"<td id=\"launchConf\" class=\"selectCell\"></td>"+ //$NON-NLS-0$
					"</tr>"+ //$NON-NLS-0$
					"<tr>"+ //$NON-NLS-0$
						"<td id=\"cloudsLabel\" class=\"label\"></td>"+ //$NON-NLS-0$
						"<td id=\"clouds\" class=\"selectCell\"></td>"+ //$NON-NLS-0$
					"</tr>"+ //$NON-NLS-0$
					"<tr>"+ //$NON-NLS-0$
						"<td id=\"orgsLabel\" class=\"label\"></td>"+ //$NON-NLS-0$
						"<td id=\"orgs\" class=\"selectCell\"></td>"+ //$NON-NLS-0$
					"</tr>"+ //$NON-NLS-0$
					"<tr>"+ //$NON-NLS-0$
						"<td id=\"spacesLabel\" class=\"label\"></td>"+ //$NON-NLS-0$
						"<td id=\"spaces\" class=\"selectCell\"></td>"+ //$NON-NLS-0$
					"</tr>"+ //$NON-NLS-0$
					"<tr>"+ //$NON-NLS-0$
						"<td id=\"manifestLabel\" class=\"label\"></td>"+ //$NON-NLS-0$
						"<td id=\"manifest\" class=\"selectCell\"></td>"+ //$NON-NLS-0$
					"</tr>"+ //$NON-NLS-0$
					"<tr class=\"rowSeparator\">" + //$NON-NLS-0$
						"<td colspan=\"2\"><div class=\"wiz-hr\"><span id=\"manifestSettings\"></span></div></td>" + //$NON-NLS-0$
					"</tr>" + //$NON-NLS-0$
					"<tr>"+ //$NON-NLS-0$
						"<td id=\"nameLabel\" class=\"label\"></td>"+ //$NON-NLS-0$
						"<td id=\"name\" class=\"selectCell\"></td>"+ //$NON-NLS-0$
					"</tr>"+ //$NON-NLS-0$
					"<tr>"+ //$NON-NLS-0$
						"<td id=\"hostLabel\" class=\"label\"></td>"+ //$NON-NLS-0$
						"<td id=\"host\" class=\"selectCell\"></td>"+ //$NON-NLS-0$
					"</tr>"+ //$NON-NLS-0$
					"<tr>"+ //$NON-NLS-0$
						"<td id=\"domainsLabel\" class=\"label\"></td>"+ //$NON-NLS-0$
						"<td id=\"domains\" class=\"selectCell\"></td>"+ //$NON-NLS-0$
					"</tr>"+ //$NON-NLS-0$
				"</table>" +  //$NON-NLS-0$
				'<div class="manifestOverride">' + //$NON-NLS-0$
					'<div id="overrideNote"></div>' + //$NON-NLS-0$
				'</div>', //$NON-NLS-0$
				
				render: function(){
					
					if(!isRendered()){
						function addListener(inputField, manifestValue){
							inputField.onkeyup = function(evt) {
					    		if (inputField.value === ""){
					    			inputField.value = manifestValue || "";
					    			inputField.classList.remove("modifiedCell");
					    		} else if (inputField.value === manifestValue){
					    			inputField.classList.remove("modifiedCell");
					    		} else {
					    			inputField.classList.add("modifiedCell");
					    		}
					    	}
						};
						
						this.wizard.validate();
						self._targets = {};
	
						// render the override note
						document.getElementById("overrideNote").textContent = messages["manifestOverride"]; //$NON-NLS-1$ //$NON-NLS-0$
	
						// render the launch config field
						document.getElementById("launchConfLabel").textContent = messages["launchConfLabel"]; //$NON-NLS-1$ //$NON-NLS-0$
						self._launchConfInput = document.createElement("input"); //$NON-NLS-0$
						self._launchConfInput.value = self._confName;
						document.getElementById("launchConf").appendChild(self._launchConfInput); //$NON-NLS-0$
						
						/* render the clouds field */
						if (self._clouds.length > 1){
							document.getElementById("cloudsLabel").appendChild(document.createTextNode(messages["target*:"])); //$NON-NLS-0$
							self._cloudsDropdown = document.createElement("select"); //$NON-NLS-0$
							
							self._clouds.forEach(function(cloud){
								var option = document.createElement("option"); //$NON-NLS-0$
								option.appendChild(document.createTextNode(cloud.Name || cloud.Url));
								option.cloud = cloud;
								
								if (self._defaultTarget && self._defaultTarget.Url === cloud.Url)
									option.selected = "selected"; //$NON-NLS-0$
								
								self._cloudsDropdown.appendChild(option);
							});
							
							self._cloudsDropdown.onchange = function(event){
								lib.empty(self._orgsDropdown);
								lib.empty(self._spacesDropdown);
								lib.empty(self._domainsDropdown);
								self._setSelection();
								
								var selectedCloud = self._clouds[event.target.selectedIndex];
								self._loadTargets(selectedCloud);
							};
							
							document.getElementById("clouds").appendChild(self._cloudsDropdown); //$NON-NLS-0$
							
						} else {
							document.getElementById("cloudsLabel").appendChild(document.createTextNode(messages["target:"])); //$NON-NLS-0$
							var span = document.createElement("span");
							span.textContent = self._clouds[0].Name || self._clouds[0].Url;
							document.getElementById("clouds").appendChild(span); //$NON-NLS-0$
						}
		
						/* render the organizations field */
						document.getElementById("orgsLabel").appendChild(document.createTextNode(messages["organization*:"])); //$NON-NLS-0$
						self._orgsDropdown = document.createElement("select"); //$NON-NLS-0$
						self._orgsDropdown.onchange = function(event){
							var selectedOrg = event.target.value;
							self._loadSpaces(selectedOrg);
	
						};
						
						document.getElementById("orgs").appendChild(self._orgsDropdown); //$NON-NLS-0$
						
						/* render the spaces field */
						self._selection = new mSelection.Selection(self._serviceRegistry, "orion.Spaces.selection"); //$NON-NLS-0$
						self._selection.addEventListener("selectionChanged", function(){this.validate();}.bind(this.wizard)); //$NON-NLS-0$
						
						document.getElementById("spacesLabel").appendChild(document.createTextNode(messages["space*:"])); //$NON-NLS-0$
						self._spacesDropdown = document.createElement("select"); //$NON-NLS-0$
						self._spacesDropdown.onchange = function(/*event*/){
							self._setSelection();
							var selection = self._selection.getSelection();
							self._loadDomains(selection);
							self._loadApplications(selection);
							self._loadHosts(selection);
						};
						
						document.getElementById("spaces").appendChild(self._spacesDropdown); //$NON-NLS-0$
						
						// render the manifest file
						document.getElementById("manifestLabel").textContent = messages["manifestLabel"];
						var manifestInput = document.createElement("input"); //$NON-NLS-0$
						manifestInput.value = self._manifestPath || "";
						manifestInput.readOnly = true; // TODO should be editable
						document.getElementById("manifest").appendChild(manifestInput); //$NON-NLS-0$
						
						// Manifest Settings section
						document.getElementById("manifestSettings").textContent = messages["manifestSettings"]; //$NON-NLS-0$
						
						/* render the domains field */
						document.getElementById("domainsLabel").appendChild(document.createTextNode(messages["domain*:"])); //$NON-NLS-0$
						self._domainsDropdown = document.createElement("select"); //$NON-NLS-0$
						document.getElementById("domains").appendChild(self._domainsDropdown); //$NON-NLS-0$
						
						/* render the application name field */
						document.getElementById("nameLabel").appendChild(document.createTextNode(messages["applicationName*:"])); //$NON-NLS-0$
						self._appsDropdown = new ComboTextInput({
							id: "applicationNameTextInput", //$NON-NLS-0$
							parentNode: document.getElementById("name"), //$NON-NLS-0$
							insertBeforeNode: this._replaceWrapper,
							hasButton: false,
							hasInputCompletion: true,
							serviceRegistry: this._serviceRegistry,
							onRecentEntryDelete: null,
							defaultRecentEntryProposalProvider: function(onItem){
								self._appsDeferred.then(function(){
									
									var ret = [];
									self._appsList.forEach(function(app){
										if(!app) return;
										ret.push({
											type: "proposal", //$NON-NLS-0$
											label: app,
											value: app
										});
									});
									
									onItem(ret);									
								});
							}
						});
						
						self._appsInput = self._appsDropdown.getTextInputNode();						
						self._appsInput.onkeyup = function(){this.validate();}.bind(this.wizard);
						self._appsInput.addEventListener("focus",function(){this.validate();}.bind(this.wizard)); //$NON-NLS-0$
						
	//					if(self._manifestApplication.name)
	//						self._appsInput.value = self._manifestApplication.name;
						
						if (self._manifestInstrumentation.name) {
				    		self._appsInput.value = self._manifestInstrumentation.name;
				    	} else if (self._manifestApplication.name){
				    		self._appsInput.value = self._manifestApplication.name;
				    	}
						
						/* render the application host field */
						document.getElementById("hostLabel").appendChild(document.createTextNode(messages["host:"])); //$NON-NLS-0$
						self._hostDropdown = new ComboTextInput({
							id: "applicationRouteTextInput", //$NON-NLS-0$
							parentNode: document.getElementById("host"), //$NON-NLS-0$
							insertBeforeNode: this._replaceWrapper,
							hasButton: false,
							hasInputCompletion: true,
							serviceRegistry: this._serviceRegistry,
							onRecentEntryDelete: null,
							defaultRecentEntryProposalProvider: function(onItem){
								self._routesDeferred.then(function(){
									
									var ret = [];
									self._routesList.forEach(function(route){
										if(!route) return;
										ret.push({
											type: "proposal", //$NON-NLS-0$
											label: route,
											value: route
										});
									});
									
									onItem(ret);
								});
							}
						});
						
						self._hostInput = self._hostDropdown.getTextInputNode();
	//					self._hostInput.value = self._manifestApplication.host || self._manifestApplication.name || "";
						
						if (self._manifestInstrumentation.host) {
				    		self._hostInput.value = self._manifestInstrumentation.host;
				    		self._hostInput.classList.add("modifiedCell");
				    	} else if (self._manifestApplication.host){
				    		self._hostInput.value = self._manifestApplication.host;
				    	}
				    	addListener(self._hostInput, self._manifestApplication.host);
						
						var selectedCloud = self._clouds[self._clouds.length > 1 ? self._cloudsDropdown.selectedIndex : 0];
						self._loadTargets(selectedCloud);
						
						setRendered(true);
					}
			    },
			    
			    validate: function(setValid) {
					
			    	if(!self._selection){
						setValid(false);
						return;
					}
					
					if (!self._launchConfInput.value) {
						setValid(false);
						return;
					}
					
					if(!self._appsInput.value){
						setValid(false);
						return;
					}
					
					var selection = self._selection.getSelection();
					if(selection === null || selection.length === 0){
						setValid(false);
						return;
					}
					
					if(self._appsInput.value){ setValid(true); }
					else { setValid(false); }
				},
				
				getResults: function(){
					var res = {};
					if(self._appsInput && self._appsInput.value){
						res.name = self._appsInput.value;
					}
					
					if(self._hostInput && self._hostInput.value){
						res.host = self._hostInput.value;
					}
					
					res.domain = self._domainsDropdown.value;
					
					if (self._launchConfInput && self._launchConfInput.value) {
						res.ConfName = self._launchConfInput.value;
					}
					
					return res;
				}
			});
		}
	};
	
	return {
		CorePageBuilder : CorePageBuilder
	};
});