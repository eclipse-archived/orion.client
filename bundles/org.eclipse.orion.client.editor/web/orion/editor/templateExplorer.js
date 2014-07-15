/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define*/
define(["orion/Deferred"], function(Deferred) {	
	/**
	 * @name orion.editor.TemplateExplorer
	 * @description creates a new instance of the outliner
	 * @constructor
	 * @public
	 */
	function TemplateExplorer(templateCollector) {
		this.templateCollector = templateCollector;
	}
	
	TemplateExplorer.prototype.computeTemplateExplorer = function(editorContext, options) {
    	var promisedTemplates = this.templateCollector.getTemplates(options.contentType);
    	return promisedTemplates.then(function(templates) {
			var templateItems = [];
	    	templates.forEach(function(template){
	    		var pre = template.prefix || 'Undefined';
	    		var index = -1;
	    		templateItems.forEach(function(item, i){
	    			if(item.label === pre){
	    				index = i;
	    			}
	    		});
	    		
	    		var obj;
	    		if(index === -1){
	    			obj = {label: pre};
	    			templateItems.push(obj);
	    		} else{
	    			obj = templateItems[index];
	    		}
	    		
	    		if (obj.children)
	    			obj.children.push({label: template.name, labelPost: template.description, template: template});
	    		else
	    			obj.children = [{label: template.name, labelPost: template.description, template: template}];
	    	});
	    	return new Deferred().resolve(templateItems);
    	});
	};
	        
	return {
		TemplateExplorer: TemplateExplorer
	};

});
