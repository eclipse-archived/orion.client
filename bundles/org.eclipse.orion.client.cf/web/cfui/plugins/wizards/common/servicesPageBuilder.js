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
define(['i18n!cfui/nls/messages', 'orion/webui/Wizard'], function(messages, mWizard){
	
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
				
				template:'<table class="formTable">'+ //$NON-NLS-0$
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
				'</table>', //$NON-NLS-0$
				
				render: function(){
					
		    		document.getElementById("allServicesLabel").appendChild(document.createTextNode(messages["bindServicesFromTheList."])); //$NON-NLS-0$
		    		document.getElementById("servicesLabel").appendChild(document.createTextNode(messages["availableServices:"])); //$NON-NLS-0$
		    		
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
					});
						
					removeButton.addEventListener('click', function(){ //$NON-NLS-0$
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
							self._servicesList.appendChild(serviceOption);	
		    			});
		    		}
		    		
					self._showMessage(messages["loadingServices..."]);
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
							var serviceOption = document.createElement("option"); //$NON-NLS-0$
							serviceOption.appendChild(document.createTextNode(serviceName));
							serviceOption.service = serviceName;
							serviceOption.id = "service_" + serviceName; //$NON-NLS-0$
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