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
define([
	'i18n!cfui/nls/messages',
	'orion/webui/tooltip',
	'orion/webui/Wizard',
	'orion/webui/littlelib'
], function(messages, mTooltip, mWizard, lib){
	var Tooltip = mTooltip.Tooltip;
	
	var rendered = false;

	/**
	 * A services page builder.
	 */
	function ServicesPageBuilder(options){
		options = options || {};
		this._init(options);
	}
	
	function isRendered(){
		return rendered;
	}
	
	function setRendered(state){
		rendered = state;
	}
	
	ServicesPageBuilder.constructor = ServicesPageBuilder;
	ServicesPageBuilder.prototype = {
			
		_init : function(options){
			
			this._manifestServices = options.ManifestServices;
			this._manifestInstrumentation = options.ManifestInstrumentation || {};
			this._getTargetSelection = options.getTargetSelection;
			
			this._cfService = options.CFService;
			
			this._showMessage = options.showMessage;
			this._hideMessage = options.hideMessage;
			this._handleError = options.handleError;
			this._postError = options.postError;
		},
			
		build : function(){
			
			var self = this;
			return new mWizard.WizardPage({
				
				template:'<table class="formTable">'+ //$NON-NLS-0$
					"<tr class=\"rowSeparator\">" +
						"<td colspan=\"3\"><div class=\"wiz-hr\"><span id=\"servicesManifestSettings\"></span></div></td>" + //$NON-NLS-0$
					"</tr>" + //$NON-NLS-0$
					'<tr>'+ //$NON-NLS-0$
						'<td id="allServicesLabel" class="label" colspan="3"></td>'+ //$NON-NLS-0$
					'</tr>'+ //$NON-NLS-0$
					'<tr>'+ //$NON-NLS-0$
						'<td id="servicesLabel" class="label"></td>'+ //$NON-NLS-0$
						'<td id="servicesLabel">&nbsp;</td>'+ //$NON-NLS-0$
						'<td id="servicesAdded" class="label"></td>'+ //$NON-NLS-0$
					'</tr>'+ //$NON-NLS-0$
					'<tr>'+ //$NON-NLS-0$
						'<td id="servicesDropdown" class="listCell"></td>'+ //$NON-NLS-0$
						'<td id="servicesAddRemoveButtonsCol" class="listCell"></td>'+ //$NON-NLS-0$
						'<td id="servicesList" class="listCell"></td>'+ //$NON-NLS-0$
					'</tr>'+ //$NON-NLS-0$
				'</table>' + //$NON-NLS-0$
				'<div class="manifestOverride">' + //$NON-NLS-0$
					'<div id="servicesOverrideNote"></div>' + //$NON-NLS-0$
				'</div>', //$NON-NLS-0$
				
				render: function(){

					if(!isRendered()){
						document.getElementById("servicesManifestSettings").textContent = messages["manifestSettings"]; //$NON-NLS-0$
			    		document.getElementById("allServicesLabel").appendChild(document.createTextNode(messages["bindServicesFromTheList."])); //$NON-NLS-0$
			    		document.getElementById("servicesLabel").appendChild(document.createTextNode(messages["availableServices:"])); //$NON-NLS-0$
						document.getElementById("servicesOverrideNote").textContent = messages["manifestOverride"]; //$NON-NLS-1$ //$NON-NLS-0$
			    		
			    		self._servicesDropdown = document.createElement("select"); //$NON-NLS-0$
			    		self._servicesDropdown.size = 7;
			    		self._servicesDropdown.multiple="multiple"; //$NON-NLS-0$
				    	
			    		document.getElementById("servicesDropdown").appendChild(self._servicesDropdown); //$NON-NLS-0$
				    	
				    	document.getElementById("servicesAdded").appendChild(document.createTextNode(messages["boundServices:"])); //$NON-NLS-0$
				    	self._servicesList = document.createElement("select"); //$NON-NLS-0$
				    	self._servicesList.multiple="multiple"; //$NON-NLS-0$
				    	self._servicesList.size = 7;
			    		
				    	document.getElementById("servicesList").appendChild(self._servicesList); //$NON-NLS-0$
				    	
				    	var addButton = document.createElement("button"); //$NON-NLS-0$
				    	addButton.appendChild(document.createTextNode(">")); //$NON-NLS-0$
				    	addButton.className = "orionButton commandButton"; //$NON-NLS-0$
				    	
				    	var removeButton = document.createElement("button"); //$NON-NLS-0$
				    	removeButton.className = "orionButton commandButton"; //$NON-NLS-0$
				    	removeButton.appendChild(document.createTextNode("<")); //$NON-NLS-0$
				    	
				    	document.getElementById("servicesAddRemoveButtonsCol").appendChild(removeButton); //$NON-NLS-0$
				    	document.getElementById("servicesAddRemoveButtonsCol").appendChild(addButton); //$NON-NLS-0$
				    	
				    	addButton.addEventListener('click', function(){ //$NON-NLS-0$
				    		for(var i=self._servicesDropdown.options.length-1; i>=0; i--){
				    			var option = self._servicesDropdown.options[i];
								if(option.selected){
									self._servicesDropdown.removeChild(option);
									self._servicesList.appendChild(option);
								}
							}
				    		
				    		var selectedServices = [];
		    				for(var i=0; i<self._servicesList.options.length; i++){
		    					selectedServices.push(self._servicesList.options[i].value);
							}
		    				var manifestServices = self._manifestServices || [];
		    				
		    				if (manifestServices.length === selectedServices.length) {
		    					self._servicesList.classList.remove("modifiedCell");
		    					for (var i=0; i<manifestServices.length; i++){
		    						if (manifestServices[i] !== selectedServices[i]){
		    							self._servicesList.classList.add("modifiedCell");
		    							break;
		    						}
		    					}
		    				} else {
		    					self._servicesList.classList.add("modifiedCell");
		    				}
						});
							
						removeButton.addEventListener('click', function(){ //$NON-NLS-0$
				    		for(var i=self._servicesList.options.length-1; i>=0; i--){
				    			var option = self._servicesList.options[i];
								if(option.selected){
									self._servicesList.removeChild(option);
									self._servicesDropdown.appendChild(option);
								}
							}
				    		
				    		var selectedServices = [];
		    				for(var i=0; i<self._servicesList.options.length; i++){
		    					selectedServices.push(self._servicesList.options[i].value);
							}
		    				var manifestServices = self._manifestServices || [];
		    				
		    				if (manifestServices.length === selectedServices.length) {
		    					self._servicesList.classList.remove("modifiedCell");
		    					for (var i=0; i<manifestServices.length; i++){
		    						if (manifestServices[i] !== selectedServices[i]){
		    							self._servicesList.classList.add("modifiedCell");
		    							break;
		    						}
		    					}
		    				} else {
		    					self._servicesList.classList.add("modifiedCell");
		    				}
						});
						
					}
					
					if(!isRendered() || self._targetSelection.Org != self._getTargetSelection().getSelection().Org ||  self._targetSelection.Space != self._getTargetSelection().getSelection().Space ||  self._targetSelection.Url != self._getTargetSelection().getSelection().Url){

						if(self._servicesDropdown.hasChildNodes()){
							lib.empty(self._servicesDropdown);
						}
						if(self._servicesList.hasChildNodes()){
							lib.empty(self._servicesList);
							self._servicesList.classList.remove("modifiedCell");
						}

						self._showMessage(messages["loadingServices..."]);

						var services = self._manifestInstrumentation.services || self._manifestServices;
						if(services){
							if(!Array.isArray(services)){
								if(typeof services === "object"){ //$NON-NLS-0$
									services = Object.keys(services);
									if(services.lengh > 0){
										document.getElementById("allServicesLabel").appendChild(document.createElement("br")); //$NON-NLS-0$//$NON-NLS-1$
										document.getElementById("allServicesLabel").appendChild(document.createTextNode(messages["convertMyManifest.ymlFileTo"])); //$NON-NLS-0$
									}
								} else {
									services = [];
								}
							}

			    			services.forEach(function(serviceName){
				    			var serviceOption = document.createElement("option"); //$NON-NLS-0$
				    			if(typeof serviceName !== "string"){ //$NON-NLS-0$
				    				return;
				    			}

								serviceOption.appendChild(document.createTextNode(serviceName));
								serviceOption.service = serviceName;
								serviceOption.id = "service_" + serviceName; //$NON-NLS-0$
								new Tooltip({ node: serviceOption, text: serviceName });
								self._servicesList.appendChild(serviceOption);	
			    			});
			    		}

						if (self._manifestInstrumentation.services)
		    				self._servicesList.classList.add("modifiedCell");

						self._targetSelection = self._getTargetSelection().getSelection();

						self._cfService.getServices(self._targetSelection).then(function(servicesResp){
							self._hideMessage();
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
								var serviceOption = document.createElement("option"); //$NON-NLS-0$
								serviceOption.appendChild(document.createTextNode(serviceName));
								serviceOption.service = serviceName;
								serviceOption.id = "service_" + serviceName; //$NON-NLS-0$
								new Tooltip({ node: serviceOption, text: serviceName });
								self._servicesDropdown.appendChild(serviceOption);
					    	});
					    	
				    	}, function(error){
				    		self._handleError(error, self._targetSelection);
				    	});
						
						setRendered(true);
					}
			    },
			    
			    getResults: function(){
			    	var ret = {};
			    	if(self._servicesList){
						var services = [];
						for(var i=0; i<self._servicesList.options.length; i++){
							services.push(self._servicesList.options[i].value);
						}
						
						ret.services = services;
					} else {
						var services = [];
						ret.services = self._manifestInstrumentation.services || self._manifestServices || {};
					}
			    	
					return ret;
			    }
			});
		}
	};
	
	return {
		ServicesPageBuilder : ServicesPageBuilder
	};
});