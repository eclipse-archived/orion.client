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
	 * A common pane builder.
	 * 
	 * @param options.AppPath {String} [options.AppPath=""] Application deployment path
	 */
	function DebugPaneBuilder(options){
		options = options || {};
		this._init(options);
	}
	
	DebugPaneBuilder.constructor = DebugPaneBuilder;
	DebugPaneBuilder.prototype = {
			
		_init : function(options){
			this._appPath = options.AppPath || "";
		},
			
		build : function(){
			
			var self = this;
			return new mWizard.WizardPage({
		    	template: '<div class="manifest formTable" id="debug"></div>' +
		    		'<table class="formTable">'+
						'<tr>'+
							'<td id="cfPasswordLabel" class="label"></td>'+
							'<td id="cfPassword" class="selectCell"></td>'+
						'</tr>'+
						'<tr>'+
							'<td id="cfUrlPrefixLabel" class="label"></td>'+
							'<td id="cfUrlPrefix" class="selectCell"></td>'+
						'</tr>'+
					'</table>' +
					'<div class="manifest formTable" id="manifest"></div>',
					
				validate: function(callback){
					var checkbox = self._debugCheckbox;
			    	var debugEnabled = checkbox ? checkbox.checked : false;
					if(!debugEnabled)
						return callback(true);
						
					var cfLauncherPassword = self._cfLauncherPassword.value;
					return callback(cfLauncherPassword && cfLauncherPassword.length > 0);
				},
		    		
		    	render: function(){
		    		
		    		var gandalfthewhite = this.wizard;
		    		var manifestElement = document.getElementById("manifest");
		    		var saveManifestCheckbox = document.createElement("input");
		    		
		    		saveManifestCheckbox.type = "checkbox";
		    		saveManifestCheckbox.id = "saveManifest";
		    		saveManifestCheckbox.checked = "checked";
		    		
					manifestElement.appendChild(saveManifestCheckbox);
					self._saveManifestCheckbox = saveManifestCheckbox;
					
					var label = document.createElement("label");
					label.className = "manifestLabel";
					label.appendChild(document.createTextNode("Save to manifest file: "));
					
					var manifestFolder = self._appPath;
					manifestFolder = manifestFolder.substring(0, manifestFolder.lastIndexOf("/") + 1);
					label.appendChild(document.createTextNode("/" + manifestFolder + "manifest.yml"));
					manifestElement.appendChild(label);
					
					var debugElement = document.getElementById("debug");
					var debugCheckbox = document.createElement("input");
					debugCheckbox.type = "checkbox";
					debugCheckbox.id = "debugApp";
					
					debugElement.appendChild(debugCheckbox);
					self._debugCheckbox = debugCheckbox;
					
					var label = document.createElement("label");
					label.className = "manifestLabel";
					label.innerHTML = "Debug with <a href=\"https://www.npmjs.org/package/cf-launcher\">cf-launcher</a>:";
					debugElement.appendChild(label);
					
					var cfPasswordLabel = document.getElementById("cfPasswordLabel");
					var passwordLabel = document.createTextNode("Password: ");
					cfPasswordLabel.appendChild(passwordLabel);
					
					var cfPassword = document.getElementById("cfPassword");
					var passwordInput = document.createElement("input");
					self._cfLauncherPassword = passwordInput;
					
					passwordInput.type = "password";
					passwordInput.disabled = true;
					passwordInput.placeholder = "Required to prevent random access to cf-launcher";
					cfPassword.appendChild(passwordInput);
					
					var cfUrlPrefixLabel = document.getElementById("cfUrlPrefixLabel");
					var urlLabel = document.createTextNode("URL Prefix: ");
					cfUrlPrefixLabel.appendChild(urlLabel);
					
					var cfUrlPrefix = document.getElementById("cfUrlPrefix");
					
					var urlInput = document.createElement("input");
					self._cfLauncherURLPrefix = urlInput;
					
					urlInput.placeholder = "Leave blank for default /launcher";
					urlInput.disabled = true;
					
					cfUrlPrefix.appendChild(urlInput);
					
					debugCheckbox.addEventListener("change", function(){
						var enable = !debugCheckbox.checked;
						passwordInput.disabled = enable;
						urlInput.disabled = enable;
						
						gandalfthewhite.validate();
					});
					
					passwordInput.addEventListener("keyup", function(){
						gandalfthewhite.validate();
					});
		    	},
		    	
	    	getResults: function(){
		    		return {
		    			saveManifest : self._saveManifestCheckbox.checked,
		    			cfLauncherPassword : self._cfLauncherPassword.value,
		    			cfLauncherURLPrefix : self._cfLauncherURLPrefix.value
		    		};
		    	}
		    });
		}
	};
	
	return {
		DebugPaneBuilder : DebugPaneBuilder
	};
});