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
define(['i18n!cfui/nls/messages', 'orion/webui/Wizard', 'orion/i18nUtil'], function(messages, mWizard, i18nUtil){
	
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
		    	template: '<div class="manifest formTable" id="debug"></div>' + //$NON-NLS-0$
		    		// TODO: Restore previous parameters
		    		//'<table class="formTable">'+ //$NON-NLS-0$
					//	'<tr>'+ //$NON-NLS-0$
					//		'<td id="cfPasswordLabel" class="label"></td>'+ //$NON-NLS-0$
					//		'<td id="cfPassword" class="selectCell"></td>'+ //$NON-NLS-0$
					//	'</tr>'+ //$NON-NLS-0$
					//	'<tr>'+ //$NON-NLS-0$
					//		'<td id="cfUrlPrefixLabel" class="label"></td>'+ //$NON-NLS-0$
					//		'<td id="cfUrlPrefix" class="selectCell"></td>'+ //$NON-NLS-0$
					//	'</tr>'+ //$NON-NLS-0$
					'</table>' + //$NON-NLS-0$
					'<div class="manifest formTable" id="manifest"></div>', //$NON-NLS-0$
					
				validate: function(callback){
					var checkbox = self._debugCheckbox;
			    	var debugEnabled = checkbox ? checkbox.checked : false;
					if(!debugEnabled)
						return callback(true);
						
					var cfLauncherPassword = ""; //self._cfLauncherPassword.value;
					return callback(cfLauncherPassword && cfLauncherPassword.length > 0);
				},
		    		
		    	render: function(){
		    		
		    		var gandalfthewhite = this.wizard;
		    		var manifestElement = document.getElementById("manifest"); //$NON-NLS-0$
		    		var saveManifestCheckbox = document.createElement("input"); //$NON-NLS-0$
		    		
		    		saveManifestCheckbox.type = "checkbox"; //$NON-NLS-0$
		    		saveManifestCheckbox.id = "saveManifest"; //$NON-NLS-0$
		    		saveManifestCheckbox.checked = "checked"; //$NON-NLS-0$
		    		
					manifestElement.appendChild(saveManifestCheckbox);
					self._saveManifestCheckbox = saveManifestCheckbox;
					
					var label = document.createElement("label"); //$NON-NLS-0$
					label.className = "manifestLabel"; //$NON-NLS-0$
					label.appendChild(document.createTextNode(messages["saveToManifestFile:"]));
					
					var manifestFolder = self._appPath;
					manifestFolder = manifestFolder.substring(0, manifestFolder.lastIndexOf("/") + 1); //$NON-NLS-0$
					label.appendChild(document.createTextNode("/" + manifestFolder + "manifest.yml")); //$NON-NLS-0$ //$NON-NLS-1$
					manifestElement.appendChild(label);
					
					if (localStorage.getItem("darklaunch")){
						var debugElement = document.getElementById("debug"); //$NON-NLS-0$
						var debugCheckbox = document.createElement("input"); //$NON-NLS-0$
						debugCheckbox.type = "checkbox"; //$NON-NLS-0$
						debugCheckbox.id = "debugApp"; //$NON-NLS-0$
						
						debugElement.appendChild(debugCheckbox);
						self._debugCheckbox = debugCheckbox;
						
						label = document.createElement("label"); //$NON-NLS-0$
						label.className = "manifestLabel"; //$NON-NLS-0$
						
						// label.innerHTML = i18nUtil.formatMessage(messages["debugWith${0}:"], "<a href=\"https://www.npmjs.org/package/cf-launcher\">cf-launcher</a>"); //$NON-NLS-1$
						label.innerHTML = messages["runInDebugMode"];
						debugElement.appendChild(label);
					}
					
					// TODO: Restore previous parameters
					/*var cfPasswordLabel = document.getElementById("cfPasswordLabel"); //$NON-NLS-0$
					var passwordLabel = document.createTextNode(messages["password:"]);
					cfPasswordLabel.appendChild(passwordLabel);
					
					var cfPassword = document.getElementById("cfPassword"); //$NON-NLS-0$
					var passwordInput = document.createElement("input"); //$NON-NLS-0$
					self._cfLauncherPassword = passwordInput;
					
					passwordInput.type = "password"; //$NON-NLS-0$
					passwordInput.disabled = true;
					passwordInput.placeholder = messages["requiredToPreventRandomAccess"];
					cfPassword.appendChild(passwordInput);
					
					var cfUrlPrefixLabel = document.getElementById("cfUrlPrefixLabel"); //$NON-NLS-0$
					var urlLabel = document.createTextNode(messages["uRLPrefix:"]);
					cfUrlPrefixLabel.appendChild(urlLabel);
					
					var cfUrlPrefix = document.getElementById("cfUrlPrefix"); //$NON-NLS-0$
					
					var urlInput = document.createElement("input"); //$NON-NLS-0$
					self._cfLauncherURLPrefix = urlInput;
					
					urlInput.placeholder = i18nUtil.formatMessage(messages["leaveBlankForDefault"], "/launcher"); 
					urlInput.disabled = true;
					
					cfUrlPrefix.appendChild(urlInput);
					
					debugCheckbox.addEventListener("change", function(){ //$NON-NLS-0$
						var enable = !debugCheckbox.checked;
						passwordInput.disabled = enable;
						urlInput.disabled = enable;
						
						gandalfthewhite.validate();
					});
					
					passwordInput.addEventListener("keyup", function(){ //$NON-NLS-0$
						gandalfthewhite.validate();
					});*/
		    	},
		    	
	    	getResults: function(){
		    		return {
		    			// TODO: Restore previous parameters
		    			saveManifest : self._saveManifestCheckbox.checked,
		    			cfLauncherPassword : "", //self._cfLauncherPassword.value,
		    			cfLauncherURLPrefix : "" //self._cfLauncherURLPrefix.value
		    		};
		    	}
		    });
		}
	};
	
	return {
		DebugPaneBuilder : DebugPaneBuilder
	};
});