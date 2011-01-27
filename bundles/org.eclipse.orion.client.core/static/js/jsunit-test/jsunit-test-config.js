/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
eclipse = eclipse || {};
eclipse.TestConfigService = (function() {
	function TestConfigService(options) {
		this._selectedConfigIndex = 0;
		this._registry = options.serviceRegistry;
		this._serviceRegistration = this._registry.registerService("ITestConfigs", this);
		this._initConfig();
	}
	TestConfigService.prototype = {
		/**
		 * Private functions
		 */	
		_initConfig: function(){
			this._configs = [];
			this._configs.push({name:"Test Selected" , value:""});
			var self = this;
			this._registry.getService("IPreferenceService").then(function(service) {
				service.get("jsunit_test/configs", function(prefs) {
					if (prefs) {
						var prefJson = JSON.parse(prefs);
						for (var i = 0 ; i < prefJson.length ; i++) {
							var configValues = prefJson[i].value;
							var config = {name:prefJson[i].name, value:[]};
							self._configs.push(config);
							for(var j = 0 ; j < configValues.length ; j++){
								var singleValue = {location:eclipse.util.makeFullPath(configValues[j]) , parents:[]};
								config.value.push(singleValue);
								self._loadFileParents(i,j);
							}
						}
						self._notifyListeners();
					}
				});
			});
		},
			
		_loadFileParents: function(configIndex , valueIndex){
			var configValue = this._configs[configIndex+1].value[valueIndex];
			dojo.xhrGet({
				url: configValue.location,
				content: { "parts": "meta" },
				headers: { "Orion-Version": "1" },
				handleAs: "json",
				timeout: 5000,
				load: dojo.hitch(this, function(metadata, secondArg) {
					var parents = metadata.Parents;
					if(parents){
						for(var k = 0; k < parents.length ; k++){
							configValue.parents.push(parents[k].Location);
						}
					}
				}),
				error: dojo.hitch(this, function(error, ioArgs) {
					handleGetAuthenticationError(this, ioArgs);
					console.error("Error loading file metadata: " + error.message);
				})
			});
		},
		
		_saveConfigs: function(){
			if (this._configs.length >  1) {
				var storedConfigs = [];
				for(var i = 1 ; i <  this._configs.length ; i++){
					var configValues = this._configs[i].value;
					var config = {name: this._configs[i].name , value:[]};
					for(var j = 0 ; j < configValues.length ; j++){
						config.value.push(eclipse.util.makeRelative(configValues[j].location));
					}
					storedConfigs.push(config);
				}
				this._registry.getService("IPreferenceService").then(function(service) {
					service.put("jsunit_test/configs", JSON.stringify(storedConfigs)); 
				});
			} else {
				this._registry.getService("IPreferenceService").then(function(service) {
					service.put("jsunit_test/configs", ""); 
				});
			}
		},
		
		_notifyListeners: function() {
			this._serviceRegistration.dispatchEvent("configsChanged", this._configs , this._selectedConfigIndex);
		},
			
		addConfig: function(configName , configValue){
		    var config = {name: configName ,
				      	  value: configValue};
			this._configs.push(config);
			this._selectedConfigIndex = this._configs.length - 1;
			this._saveConfigs();
			this._notifyListeners();
		},
		
		updateConfig: function(configValue){
			if(this._selectedConfigIndex === 0)
				return;
			var config = this._configs[this._selectedConfigIndex];
			config.value =configValue;
			this._saveConfigs();
		},
		
		deleteConfig: function(){
			if(this._selectedConfigIndex === 0)
				return;
			this._configs.splice(this._selectedConfigIndex , 1);
			this._saveConfigs();
			this._selectedConfigIndex = this._selectedConfigIndex - 1;
			this._notifyListeners();
		},
		
		getCurrentConfig: function(){
			return this._selectedConfigIndex  === 0 ? null : this._configs[this._selectedConfigIndex ].value;
		},
		
		getCurConfigIndex: function(){
			return this._selectedConfigIndex;
		},
		
		setCurConfigIndex: function(index){
			this._selectedConfigIndex = index;
		}		
	};
	return TestConfigService;
}());

eclipse.TestConfigurator = (function() {
	function TestConfigurator(options) {
		this._navigator =  eclipse.uTestUtils.getOptionValue(options , "navigator" , undefined);
		this._resultController = options.resultController;
		this._configSelDiv = dojo.byId("testConfig");
		this._delConfigBtnDiv = dijit.byId("del_test_config");
		this._editConfigBtnDiv = dijit.byId("edit_test_config");
		var self = this;
		dojo.connect(this._configSelDiv, "onchange", function() {
			self._onSelChange();
		});
		this._delConfigBtnDiv.set('disabled' , true);
		this._editConfigBtnDiv.set('disabled' , true);
		this._registry = options.serviceRegistry;
		var self = this;
		this._registry.getService("ITestConfigs").then(function(service) {
			service.addEventListener("configsChanged", function(configs, selIndex) {
				self._render(configs, selIndex);
			});
		});
	}
	TestConfigurator.prototype = {
		showNewItemDialog: function() {
			var dialog = new widgets.NewItemDialog({
				title: "Create Test Config From Selected Files",
				label: "Config name:",
				func:  dojo.hitch(this, function(itemName){
					var cValue = this._makeConfigValue(this._navigator._renderer.getSelectedURL(true));
					this._registry.getService("ITestConfigs").then(function(service) {
						service.addConfig(itemName, cValue);
					});
					if(this._resultController)
						this._resultController.clearResultUI();
				})
			});
			dialog.startup();
			dialog.show();
		},
			
		_makeConfigParents: function(configVal , originalFileItem){
			if(originalFileItem.parent === undefined || originalFileItem === null)
				return;
			configVal.parents.push( originalFileItem.parent.Location);
			this._makeConfigParents(configVal , originalFileItem.parent);
		},
		
		_makeSingleConfig: function(originalFileItem){
			var configVal = {location: originalFileItem.Location,parents:[]};
			this._makeConfigParents(configVal , originalFileItem);
			return configVal;
		},
		
		_makeConfigValue: function(selectedFiles){
			var retVal = [];
			for(var i = 0; i < selectedFiles.length ; i++){
				retVal.push(this._makeSingleConfig(selectedFiles[i]));
			}
			return retVal;
		},
		
		_onSelChange: function(){
			if(this._resultController)
				this._resultController.clearResultUI();
			var selIndex = this._configSelDiv.selectedIndex;
			if(selIndex === 0){
				this._delConfigBtnDiv.set('disabled' , true);
				this._editConfigBtnDiv.set('disabled' , true);
			} else {
				this._delConfigBtnDiv.set('disabled' , false);
				this._editConfigBtnDiv.set('disabled' , false);
			}
			this._registry.getService("ITestConfigs").then(function(service) {
				service.setCurConfigIndex(selIndex);
			});
			if(selIndex !== 0){
				var self = this;
				this._registry.getService("ITestConfigs").then(function(service) {
					return service.getCurrentConfig()}).then(function(result) {
		   				self._navigator._renderer.updateBySelection(result);
		   			});
			}
		},
		
		_clearConfigUI: function(){
			this._configSelDiv.length = 0;
		},
		
		_addConfigUI: function(configName){
		    var elOptNew = document.createElement('option');
		    elOptNew.text = configName;
		    this._configSelDiv.add(elOptNew , null);
		},
		
		_render: function(configs, selIndex){
			this._clearConfigUI();
  			for (var i=0; i < configs.length; i++) {
  				this._addConfigUI(configs[i].name);
  			}
			this._configSelDiv.selectedIndex =selIndex;
		},
		
		updateConfig: function(){
		    var cValue = this._makeConfigValue(this._navigator._renderer.getSelectedURL(true));
		    this._registry.getService("ITestConfigs").then(function(service) {
		    	service.updateConfig(cValue);
		    });
		},
		
		deleteConfig: function(){
			var self = this;
		    this._registry.getService("ITestConfigs").then(function(service) {
				service.deleteConfig().then(function(result) {
					self._onSelChange();
				});
			});
		},
		
		testCurrentConfig: function(callBack){
			var selIndex = this._configSelDiv.selectedIndex;
			this._testCallBack = callBack;
			var self = this;
			return selIndex === 0 ? callBack(this._navigator._renderer.getSelectedURL(false)) : 
								   this._registry.getService("ITestConfigs").then(function(service) {
								  		return service.getCurrentConfig()}).then(function(result) {
								  			callBack(result);
								  		});
		}

	};
	return TestConfigurator;
})();
