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
	function CommonPaneBuilder(options){
		options = options || {};
		this._init(options);
	}
	
	CommonPaneBuilder.constructor = CommonPaneBuilder;
	CommonPaneBuilder.prototype = {
			
		_init : function(options){
			this._appPath = options.AppPath || "";
		},
			
		build : function(){
			
			var self = this;
			return new mWizard.WizardPage({
		    	template: '<div class="manifest formTable" id="manifest"></div>',
		    	render: function(){
		    		
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
		    	},
		    	
		    	getResults: function(){
		    		return {
		    			saveManifest : self._saveManifestCheckbox.checked
		    		};
		    	}
		    });
		}
	};
	
	return {
		CommonPaneBuilder : CommonPaneBuilder
	};
});