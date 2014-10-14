/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define*/
/*global console*//*elosnoc labolg*/


define(["orion/editor/templates","orion/objects","orion/Deferred"], function(mTemplates,Objects,Deferred) { //$NON-NLS-0$
	/**
	 * @description Creates a new delegate to create keyword and template proposals
	 */
	function TemplateCollector(serviceRegistry, inputManager){
		var self = this;
		this.serviceRegistry = serviceRegistry;
		
		inputManager.addEventListener("InputChanged", function() { //$NON-NLS-0$
			//workarounds
			var contentType = inputManager.getContentType();
			if ("text/plain" === contentType.id || "image" === contentType.id.substring(0,5)){ //$NON-NLS-1$ //$NON-NLS-0$
				return;
			}
			self.setContentType(contentType);

			// Avoid registering the same service multiple times
			var id = "orion.templates." + contentType.id;  //$NON-NLS-0$
			var registered = serviceRegistry.getServiceReferences("orion.edit.contentassist").some(function(service) { //$NON-NLS-0$
				return service.getProperty("id") === id; //$NON-NLS-0$
			});
			if (registered) return;

			serviceRegistry.registerService("orion.edit.contentassist", self, { //$NON-NLS-0$
				contentType: [contentType.id],  //$NON-NLS-0$
				name: 'templateCollector',  //$NON-NLS-0$
				id: id,
			});
		});
		this.getTemplates();
	}
	
	TemplateCollector.prototype = new mTemplates.TemplateContentAssist(null,[]);
	Objects.mixin(TemplateCollector.prototype, {
		uninterestingChars: ":!@#$^&*.?<>", //$NON-NLS-0$
		/**
		 * @description Override from TemplateContentAssist
		 */
		isValid: function(prefix, buffer, offset/*, context*/) {
			var char = buffer.charAt(offset-prefix.length-1);
			return !char || this.uninterestingChars.indexOf(char) === -1;
		},
		
		_flatten : function(arrayOfArray){
			var merged = [];
			//concat.apply is sneaky trick for flattening one level of arrays: http://stackoverflow.com/questions/10865025
			return merged.concat.apply(merged,arrayOfArray);
		},
		
		/**
		 * @description set the content type to be returned
		 */
		setContentType : function(contentType){
			this.contentType = contentType;
		},
		
		/**
		 * @description get the raw template objects
		 * called by templateExplorer
		 */
		getTemplates: function() {
			var self = this;
			var collectedProposals = [];
			var templateProviders = this.serviceRegistry.getServiceReferences("orion.edit.templates"); //$NON-NLS-0$
			var deferredTemplates = templateProviders.map(function(templateProviderRef){
				var templateProvider = this.serviceRegistry.getService(templateProviderRef);
				return templateProvider.getTemplates();
			}, this);
			
			return Deferred.all(deferredTemplates, function(error) {
				console.error("error collecting the templates2: " + error.message);}) //$NON-NLS-0$
			.then(function(templateObjectsArray) {
				if (!self.contentType) return new Deferred().reject("Error collecting the templates. ContentType has not been set."); //$NON-NLS-0$
				templateObjectsArray.forEach(function(templateObjects){
					if (!templateObjects) {
						return;
					}
					var templates = [];
					templateObjects.templates.forEach(function(template) {
						if (template.contentType === self.contentType.id) {
							var div = (template.description && template.name) ? " - " : ""; //$NON-NLS-1$ //$NON-NLS-0$
							var name = (template.name) ? template.name : ""; //$NON-NLS-0$
							var temp = new mTemplates.Template(template.prefix, div + template.description, template.template, name);
							templates.push(temp);
						}
					});
					collectedProposals.push(templates);
				});
				return new Deferred().resolve(self._flatten(collectedProposals));
			});
		},
		
		/**
		 * @description override
		 * called by contentAssist
		 */
		getTemplateProposals: function(prefix, offset, context, completionKind) {
			var self = this;
			if (completionKind !== 'top') {
				return [];
			}
			var templateProviders = this.serviceRegistry.getServiceReferences("orion.edit.templates"); //$NON-NLS-0$
			var deferredTemplates = templateProviders.map(function(templateProviderRef){
				var templateProvider = this.serviceRegistry.getService(templateProviderRef);
				return templateProvider.getTemplates();
			}, this);
			
			return Deferred.all(deferredTemplates, function(error) {
				console.error("error collecting the templates: " + error.message); //$NON-NLS-0$
			})
			.then( function(templateObjectsArray) {
				if (!self.contentType) return new Deferred().reject("Error collecting the templates. ContentType has not been set."); //$NON-NLS-0$
				var collectedProposals = [];
				templateObjectsArray.forEach(function(templateObjects) {
					if (!templateObjects) {
						return;
					}
					var templates = [];
					templateObjects.templates.forEach(function(template){
						if (template.contentType === self.contentType.id) {
							var div = (template.description && template.name) ? " - " : ""; //$NON-NLS-1$ //$NON-NLS-0$
							var name = (template.name) ? template.name : "";
							var temp = new mTemplates.Template(template.prefix, div + template.description, template.template, name);
							templates.push(temp);
						}
					});
					var proposals = [];
					for (var t = 0; t < templates.length; t++) {
						var template = templates[t];
						if (template.match(prefix)) {
							var proposal = template.getProposal(prefix, offset, context);
							self.removePrefix(prefix, proposal);
							proposals.push(proposal);
						}
					}
					
					if (0 < proposals.length) {
						//sort the proposals by name
						proposals.sort(function(p1, p2) {
							if (p1.name < p2.name) {
								return -1;
							}
							if (p1.name > p2.name) {
								return 1;
							}
							return 0;
						});
						// if any templates were added to the list of 
						// proposals, add a title as the first element
						proposals.splice(0, 0, {
							proposal: '',
							description: templateObjects.title, //$NON-NLS-0$
							style: 'noemphasis_title', //$NON-NLS-0$
							unselectable: true
						});
						
						collectedProposals.push(proposals);
					}
				});
				
				return new Deferred().resolve(self._flatten(collectedProposals));
			});	
		},
		
		/**
		 * @description Implements the Orion content assist API v4.0
		 */
		computeContentAssist: function(editorContext, params) {
			var self = this;
			return editorContext.getText().then(function(buffer) {
				return self._createTemplateProposals(buffer, params);
			});
		},
		
		/**
		 * @description Create the template proposals
		 * @function
		 * @private
		 * @param {String} buffer The text for the backing compilation unit
		 * @param {Object} context The assist context
		 */
		_createTemplateProposals: function(buffer, context) {
			if((typeof context.template === 'undefined' || context.template) &&  //$NON-NLS-0$
					this.isValid(context.prefix, buffer, context.offset, context)) {
				return this.getTemplateProposals(context.prefix, context.offset, context, 'top'); //$NON-NLS-0$
			}
			return [];
		},
	});
	
	return {
		TemplateCollector : TemplateCollector
	};
});