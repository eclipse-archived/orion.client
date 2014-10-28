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
	 * An additional parameter page builder. The page gathers additional
	 * parameters, such as command, instances, path, etc.
	 */
	function AdditionalParamPageBuilder(options){
		options = options || {};
		this._init(options);
	}
	
	AdditionalParamPageBuilder.constructor = AdditionalParamPageBuilder;
	AdditionalParamPageBuilder.prototype = {
			
		_init : function(options){
			this._manifestApplication = options.ManifestApplication || {};
		},
			
		build : function(){
			
			var self = this;
			return new mWizard.WizardPage({
				
				template: '<table class="formTable">'+ //$NON-NLS-0$
					'<tr>'+ //$NON-NLS-0$
						'<td id="commandLabel" class="label"></td>'+ //$NON-NLS-0$
						'<td id="command" class="selectCell"></td>'+ //$NON-NLS-0$
					'</tr>'+ //$NON-NLS-0$
					'<tr>'+ //$NON-NLS-0$
						'<td id="pathLabel" class="label"></td>'+ //$NON-NLS-0$
						'<td id="path" class="selectCell"></td>'+ //$NON-NLS-0$
					'</tr>'+ //$NON-NLS-0$
					'<tr>'+ //$NON-NLS-0$
						'<td id="buildpackLabel" class="label"></td>'+ //$NON-NLS-0$
						'<td id="buildpack" class="selectCell"></td>'+ //$NON-NLS-0$
					'</tr>'+ //$NON-NLS-0$
					'<tr>'+ //$NON-NLS-0$
						'<td id="memoryLabel" class="label"></td>'+ //$NON-NLS-0$
						'<td id="memory" class="selectCell"></td>'+ //$NON-NLS-0$
					'</tr>'+ //$NON-NLS-0$
					'<tr>'+ //$NON-NLS-0$
						'<td id="instancesLabel" class="label"></td>'+ //$NON-NLS-0$
						'<td id="instances" class="selectCell"></td>'+ //$NON-NLS-0$
					'</tr>'+ //$NON-NLS-0$
					'<tr>'+ //$NON-NLS-0$
						'<td id="timeoutLabel" class="label"></td>'+ //$NON-NLS-0$
						'<td id="timeout" class="selectCell"></td>'+ //$NON-NLS-0$
					'</tr>'+ //$NON-NLS-0$
				'</table>', //$NON-NLS-0$
				
				render: function(){

					/* command */
			    	document.getElementById("commandLabel").appendChild(document.createTextNode(messages["command:"])); //$NON-NLS-0$
			    	self._command = document.createElement("input"); //$NON-NLS-0$
			    	if(self._manifestApplication.command)
			    		self._command.value = self._manifestApplication.command;
			    	
			    	document.getElementById("command").appendChild(self._command); //$NON-NLS-0$
			    	
			    	/* path */
			    	document.getElementById("pathLabel").appendChild(document.createTextNode(messages["path:"])); //$NON-NLS-0$
			    	self._path = document.createElement("input"); //$NON-NLS-0$
			    	if(self._manifestApplication.path)
			    		self._path.value = self._manifestApplication.path;
			    	
			    	document.getElementById("path").appendChild(self._path); //$NON-NLS-0$
			    	
			    	/* buildpack */
			    	document.getElementById("buildpackLabel").appendChild(document.createTextNode(messages["buildpackUrl:"])); //$NON-NLS-0$
			    	self._buildpack = document.createElement("input"); //$NON-NLS-0$
			    	if(self._manifestApplication.buildpack)
			    		self._buildpack.value = self._manifestApplication.buildpack;
			    	
			    	document.getElementById("buildpack").appendChild(self._buildpack); //$NON-NLS-0$
			    	
			    	/* memory */
			    	document.getElementById("memoryLabel").appendChild(document.createTextNode(messages["memory:"])); //$NON-NLS-0$
			    	self._memory = document.createElement("input"); //$NON-NLS-0$
			    	
			    	self._memory.id = "memoryInput"; //$NON-NLS-0$
			    	self._memory.type = "number"; //$NON-NLS-0$
			    	self._memory.min = "0"; //$NON-NLS-0$
			    	
			    	self._memoryUnit = document.createElement("select"); //$NON-NLS-0$
			    	self._memoryUnit.id = "memoryUnit"; //$NON-NLS-0$
					
			    	var option = document.createElement("option"); //$NON-NLS-0$
					option.appendChild(document.createTextNode("MB")); //$NON-NLS-0$
					option.value = "MB"; //$NON-NLS-0$
					self._memoryUnit.appendChild(option);
					
					option = document.createElement("option"); //$NON-NLS-0$
					option.appendChild(document.createTextNode("GB")); //$NON-NLS-0$
					option.value = "GB"; //$NON-NLS-0$
					self._memoryUnit.appendChild(option);
					
			    	if(self._manifestApplication.memory && (self._manifestApplication.memory.toUpperCase().indexOf("M") > 0 || self._manifestApplication.memory.toUpperCase().indexOf("G") > 0)){ //$NON-NLS-0$ //$NON-NLS-1$
			    		var indexOfUnit = self._manifestApplication.memory.toUpperCase().indexOf("M") > 0 ? self._manifestApplication.memory.toUpperCase().indexOf("M") : self._manifestApplication.memory.toUpperCase().indexOf("G"); //$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$
			    		self._memory.value = self._manifestApplication.memory.substring(0, indexOfUnit);
			    		
						var unit = self._manifestApplication.memory.substring(indexOfUnit).toUpperCase();
						if(unit.trim().length === 1)
							unit += "B"; //$NON-NLS-0$
						
						self._memoryUnit.value = unit;
			    	}
			    	
			    	document.getElementById("memory").appendChild(self._memory); //$NON-NLS-0$
			    	document.getElementById("memory").appendChild(self._memoryUnit); //$NON-NLS-0$
			    	
			    	/* instances */
			    	document.getElementById("instancesLabel").appendChild(document.createTextNode(messages["instances:"])); //$NON-NLS-0$
			    	self._instances = document.createElement("input"); //$NON-NLS-0$
			    	self._instances.type = "number"; //$NON-NLS-0$
			    	self._instances.min = "0"; //$NON-NLS-0$
			    	if(self._manifestApplication.instances)
			    		self._instances.value = self._manifestApplication.instances;
			    	
			    	document.getElementById("instances").appendChild(self._instances); //$NON-NLS-0$
			    	
			    	/* timeout */
			    	document.getElementById("timeoutLabel").appendChild(document.createTextNode(messages["timeout(sec):"])); //$NON-NLS-0$
			    	self._timeout = document.createElement("input"); //$NON-NLS-0$
			    	self._timeout.type = "number"; //$NON-NLS-0$
			    	self._timeout.min = "0"; //$NON-NLS-0$
			    	if(self._manifestApplication.timeout)
			    		self._timeout.value = self._manifestApplication.timeout;
			    	
			    	document.getElementById("timeout").appendChild(self._timeout); //$NON-NLS-0$
			    },
			    
			    getResults: function(){
			    	
			    	var ret = {};
				    if(self._command)
				    	ret.command = self._command.value;
				    
				    if(self._buildpack)
						ret.buildpack = self._buildpack.value;
					
					if(self._memory)
						ret.memory = self._memory.value ? self._memory.value + self._memoryUnit.value : "";
					
					if(self._instances)
						ret.instances = self._instances.value;
					
					if(self._timeout)
						ret.timeout = self._timeout.value;
					
					if(self._path)
						ret.path = self._path.value;
					
			    	return ret;
			    }
			});
		}
	};
	
	return {
		AdditionalParamPageBuilder : AdditionalParamPageBuilder
	};
});