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
eclipse.TestConfigurator = (function() {
	function Configurator(options) {
		this._navigator =  eclipse.uTestUtils.getOptionValue(options , "navigator" , undefined);
		this._configSelDiv = dojo.byId("testConfig");
		this._delConfigBtnDiv = dijit.byId("del_test_config");
		this._editConfigBtnDiv = dijit.byId("edit_test_config");
		var self = this;
		dojo.connect(this._configSelDiv, "onchange", function() {
			self.onSelChange();
		});
		this._delConfigBtnDiv.attr('disabled' , true);
		this._editConfigBtnDiv.attr('disabled' , true);
		this._registry = options.serviceRegistry;
		this._initConfig();
	}
	Configurator.prototype = {
		showNewItemDialog: function() {
			var dialog = dijit.byId('newItemDialog');
			dialog.attr('title', "Create Test Config From Selected Files");
			var itemNameLabel = dojo.byId("itemNameLabel");
			itemNameLabel.value = "Config name";
			var itemName = dojo.byId("itemName");
			var self = this;
			dialog.execute = function(){
				self.addConfig(itemName.value);
			};
			dialog.show();
		},
		
		_makeRelative: function(configValue){
			for(var i = 0; i < configValue.length ; i++){
				configValue[i] = eclipse.util.makeRelative(configValue[i]);
			}
			return configValue;
		},
		
		_makeFullPath: function(configValue){
	    	var nonHash = window.location.href.split('#')[0];
			var hostName = nonHash.substring(0, nonHash.length - window.location.pathname.length);
			var retVal = [];
			for(var i = 0; i < configValue.length ; i++){
				retVal.push(hostName + configValue[i]);
			}
			return retVal;
		},
		
		onSelChange: function(){
			var selIndex = this._configSelDiv.selectedIndex;
			if(selIndex === 0){
				this._delConfigBtnDiv.attr('disabled' , true);
				this._editConfigBtnDiv.attr('disabled' , true);
			} else {
				this._delConfigBtnDiv.attr('disabled' , false);
				this._editConfigBtnDiv.attr('disabled' , false);
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
		
		_updateConfigUI: function(){
  			for (var i=0; i < this._configs.length; i++) {
  				this._addConfigUI(this._configs[i].name);
  			}
		},
		
		addConfig: function(configName){
		    var cValue = this._makeRelative(this._navigator._renderer.getSelectedURL(true));
			
		    var config = {name: configName ,
				      	  value: cValue};
			this._configs.push(config);
			this._addConfigUI(configName);
			this._configSelDiv.selectedIndex = this._configSelDiv.options.length  -1;
			this.onSelChange();
			this._saveConfigs();
			
		},
		
		editConfig: function(){
			var selIndex = this._configSelDiv.selectedIndex;
			if(selIndex === 0)
					return;
			var config = this._configs[selIndex];
			config.value =this._makeRelative(this._navigator._renderer.getSelectedURL(true));
			this._saveConfigs();
		},
		
		deleteConfig: function(){
			var selIndex = this._configSelDiv.selectedIndex;
			if(selIndex === 0)
					return;
			this._configs.splice(selIndex , 1);
			this._saveConfigs();
			this._clearConfigUI();
			this._updateConfigUI();
			this._configSelDiv.selectedIndex =selIndex  -1;
			this.onSelChange();
		},
		
		_initConfig: function(){
			this._configs = [];
			this._configs.push({name:"Test Selected" , value:""});
			var self = this;
			//window.document.eas.preferences.get("jsunit_test/configs", function(prefs) { // TODO refactor eas
			this._registry.callService("IPreferenceService", "get", null, ["jsunit_test/configs", function(prefs) {
				if (prefs) {
					var configs = JSON.parse(prefs);
					for (var i in configs) {
						self._configs.push(configs[i]);
					}
				}
				self._updateConfigUI();
			}]);
		},
		
		_saveConfigs: function(){
			if (this._configs.length > 1) {
				var storedConfigs = this._configs.slice(1);
				this._registry.callService("IPreferenceService", "put", null, ["jsunit_test/configs", JSON.stringify(storedConfigs)]); 
				//window.document.eas.preferences.put("jsunit_test/configs", JSON.stringify(storedConfigs)); // TODO refactor eas
			}
		},
		
		getCurrentConfig: function(){
			var selIndex = this._configSelDiv.selectedIndex;
			return selIndex === 0 ?this._navigator._renderer.getSelectedURL(true) : this._makeFullPath(this._configs[selIndex].value);
		}
		
	};
	return Configurator;
}());