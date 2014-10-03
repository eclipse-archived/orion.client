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
define(['orion/webui/Wizard'], function(mWizard){
	
	/**
	 * A services page builder.
	 */
	function ServicesPageBuilder(options){
		options = options || {};
		this._init(options);
	}
	
	ServicesPageBuilder.constructor = ServicesPageBuilder;
	ServicesPageBuilder.prototype = {
			
		_init : function(options){
			
			this._manifestServices = options.ManifestServices;
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
		    		
		    		self._servicesDropdown = document.createElement("select");
		    		self._servicesDropdown.size = 8;
		    		self._servicesDropdown.multiple="multiple";
			    	
		    		document.getElementById("servicesDropdown").appendChild(self._servicesDropdown);
			    	
			    	document.getElementById("servicesAdded").appendChild(document.createTextNode("Application Services:"));
			    	self._servicesList = document.createElement("select");
			    	self._servicesList.multiple="multiple";
			    	self._servicesList.size = 8;
		    		
			    	document.getElementById("servicesList").appendChild(self._servicesList);
			    	
			    	var addButton = document.createElement("button");
			    	addButton.appendChild(document.createTextNode(">"));
			    	addButton.className = "orionButton commandButton";
			    	
			    	var removeButton = document.createElement("button");
			    	removeButton.className = "orionButton commandButton";
			    	removeButton.appendChild(document.createTextNode("<"));
			    	
			    	document.getElementById("servicesAddRemoveButtonsCol").appendChild(removeButton);
			    	document.getElementById("servicesAddRemoveButtonsCol").appendChild(addButton);
			    	
			    	addButton.addEventListener('click', function(){
			    		for(var i=self._servicesDropdown.options.length-1; i>=0; i--){
			    			var option = self._servicesDropdown.options[i];
							if(option.selected){
								self._servicesDropdown.removeChild(option);
								self._servicesList.appendChild(option);
							}
						}
					});
						
					removeButton.addEventListener('click', function(){
			    		for(var i=self._servicesList.options.length-1; i>=0; i--){
			    			var option = self._servicesList.options[i];
							if(option.selected){
								self._servicesList.removeChild(option);
								self._servicesDropdown.appendChild(option);
							}
						}
					});
					
					var services = self._manifestServices;
					if(self._manifestServices){
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
							self._servicesList.appendChild(serviceOption);	
		    			});
		    		}
		    		
					self._showMessage("Loading services...");
					self._targetSelection = self._getTargetSelection();
					
					self._cfService.getServices(self._targetSelection.getSelection()).then(function(servicesResp){
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
							var serviceOption = document.createElement("option");
							serviceOption.appendChild(document.createTextNode(serviceName));
							serviceOption.service = serviceName;
							serviceOption.id = "service_" + serviceName;
							self._servicesDropdown.appendChild(serviceOption);
				    	});
				    	
			    	}, function(error){
			    		self._handleError(error, self._targetSelection.getSelection());
			    	});
			    },
			    
			    getResults: function(){
			    	var ret = {};
			    	if(self._servicesList){
						var services = [];
						for(var i=0; i<self._servicesList.options.length; i++){
							services.push(self._servicesList.options[i].value);
						}
						
						ret.services = services;
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