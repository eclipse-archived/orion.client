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
				
				template: '<table class="formTable">'+
					'<tr>'+
						'<td id="commandLabel" class="label"></td>'+
						'<td id="command" class="selectCell"></td>'+
					'</tr>'+
					'<tr>'+
						'<td id="pathLabel" class="label"></td>'+
						'<td id="path" class="selectCell"></td>'+
					'</tr>'+
					'<tr>'+
						'<td id="buildpackLabel" class="label"></td>'+
						'<td id="buildpack" class="selectCell"></td>'+
					'</tr>'+
					'<tr>'+
						'<td id="memoryLabel" class="label"></td>'+
						'<td id="memory" class="selectCell"></td>'+
					'</tr>'+
					'<tr>'+
						'<td id="instancesLabel" class="label"></td>'+
						'<td id="instances" class="selectCell"></td>'+
					'</tr>'+
					'<tr>'+
						'<td id="timeoutLabel" class="label"></td>'+
						'<td id="timeout" class="selectCell"></td>'+
					'</tr>'+
				'</table>',
				
				render: function(){

					/* command */
			    	document.getElementById("commandLabel").appendChild(document.createTextNode("Command:"));
			    	self._command = document.createElement("input");
			    	if(self._manifestApplication.command)
			    		self._command.value = self._manifestApplication.command;
			    	
			    	document.getElementById("command").appendChild(self._command);
			    	
			    	/* path */
			    	document.getElementById("pathLabel").appendChild(document.createTextNode("Path:"));
			    	self._path = document.createElement("input");
			    	if(self._manifestApplication.path)
			    		self._path.value = self._manifestApplication.path;
			    	
			    	document.getElementById("path").appendChild(self._path);
			    	
			    	/* buildpack */
			    	document.getElementById("buildpackLabel").appendChild(document.createTextNode("Buildpack Url:"));
			    	self._buildpack = document.createElement("input");
			    	if(self._manifestApplication.buildpack)
			    		self._buildpack.value = self._manifestApplication.buildpack;
			    	
			    	document.getElementById("buildpack").appendChild(self._buildpack);
			    	
			    	/* memory */
			    	document.getElementById("memoryLabel").appendChild(document.createTextNode("Memory:"));
			    	self._memory = document.createElement("input");
			    	
			    	self._memory.id = "memoryInput";
			    	self._memory.type = "number";
			    	self._memory.min = "0";
			    	
			    	self._memoryUnit = document.createElement("select");
			    	self._memoryUnit.id = "memoryUnit";
					
			    	var option = document.createElement("option");
					option.appendChild(document.createTextNode("MB"));
					option.value = "MB";
					self._memoryUnit.appendChild(option);
					
					option = document.createElement("option");
					option.appendChild(document.createTextNode("GB"));
					option.value = "GB";
					self._memoryUnit.appendChild(option);
					
			    	if(self._manifestApplication.memory && (self._manifestApplication.memory.toUpperCase().indexOf("M") > 0 || self._manifestApplication.memory.toUpperCase().indexOf("G") > 0)){
			    		var indexOfUnit = self._manifestApplication.memory.toUpperCase().indexOf("M") > 0 ? self._manifestApplication.memory.toUpperCase().indexOf("M") : self._manifestApplication.memory.toUpperCase().indexOf("G");
			    		self._memory.value = self._manifestApplication.memory.substring(0, indexOfUnit);
			    		
						var unit = self._manifestApplication.memory.substring(indexOfUnit).toUpperCase();
						if(unit.trim().length === 1)
							unit += "B";
						
						self._memoryUnit.value = unit;
			    	}
			    	
			    	document.getElementById("memory").appendChild(self._memory);
			    	document.getElementById("memory").appendChild(self._memoryUnit);
			    	
			    	/* instances */
			    	document.getElementById("instancesLabel").appendChild(document.createTextNode("Instances:"));
			    	self._instances = document.createElement("input");
			    	self._instances.type = "number";
			    	self._instances.min = "0";
			    	if(self._manifestApplication.instances)
			    		self._instances.value = self._manifestApplication.instances;
			    	
			    	document.getElementById("instances").appendChild(self._instances);
			    	
			    	/* timeout */
			    	document.getElementById("timeoutLabel").appendChild(document.createTextNode("Timeout (sec):"));
			    	self._timeout = document.createElement("input");
			    	self._timeout.type = "number";
			    	self._timeout.min = "0";
			    	if(self._manifestApplication.timeout)
			    		self._timeout.value = self._manifestApplication.timeout;
			    	
			    	document.getElementById("timeout").appendChild(self._timeout);
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