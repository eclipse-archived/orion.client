/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global eclipse:true dojo */
/*jslint maxerr:150 browser:true devel:true */

dojo.require("dojo.DeferredList");

/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * A ContentAssist will look for content assist providers in the service registry (if provided).
 * Alternately providers can be registered directly by calling {@link #addProvider}.
 * @name eclipse.ContentAssist
 * @param {eclipse.Editor} editor
 * @param {String} contentAssistId
 * @param {eclipse.ServiceRegistry} [serviceRegistry] If omitted, providers must be registered via {@link #addProvider}.
 */
eclipse.ContentAssist = (function() {
	function ContentAssist(editor, contentAssistId, serviceRegistry) {
		this.editor = editor;
		this.editorWidget = editor.getEditorWidget();
		this.contentAssistPanel = dojo.byId(contentAssistId);
		this.active = false;
		this.prefix = "";
		this.serviceRegistry = serviceRegistry;
		this.contentAssistProviders = [];
		this.activeServiceReferences = [];
		this.activeContentAssistProviders = [];
		this.contentAssistListener = {
			onVerify: function(event){
				this.showContentAssist(false);
			},
			onSelectionChanged: function() {
				this.showContentAssist(false);
			}
		};
		this.init();
	}
	ContentAssist.prototype = {
		init: function() {
			var isMac = navigator.platform.indexOf("Mac") !== -1;
			this.editorWidget.setKeyBinding(isMac ? new eclipse.KeyBinding(' ', false, false, false, true) : new eclipse.KeyBinding(' ', true), "contentAssist");
			this.editorWidget.setAction("contentAssist", dojo.hitch(this, function() {
				this.showContentAssist(true);
				return true;
			}));
			dojo.connect(this.editor, "onInputChange", this, this.inputChanged);
		},
	
		inputChanged: function(fileName) {
			if (this.serviceRegistry) {
				// Filter the ServiceReferences
				this.activeServiceReferences = [];
				var serviceReferences = this.serviceRegistry.getServiceReferences("orion.edit.contentAssist");
				var serviceReference;
				dojo.forEach(serviceReferences, dojo.hitch(this, function(serviceReference) {
					var info = {};
					var propertyNames = serviceReference.getPropertyNames();
					for (var i = 0; i < propertyNames.length; i++) {
						info[propertyNames[i]] = serviceReference.getProperty(propertyNames[i]);
					}
					if (new RegExp(info.pattern).test(fileName)) {
						this.activeServiceReferences.push(serviceReference);
					}
				}));
			}
			// Filter the registered providers
			for (var i=0; i < this.contentAssistProviders.length; i++) {
				var provider = this.contentAssistProviders[i];
				if (new RegExp(provider.pattern).test(fileName)) {
					this.activeContentAssistProviders.push(provider.provider);
				}
			}
		},
		
		cancel: function() {
			this.showContentAssist(false);
		},
		isActive: function() {
			return this.active;
		},
		lineUp: function() {
			if (this.contentAssistPanel) {
				var nodes = dojo.query('> div', this.contentAssistPanel);
				var index = 0;
				for (var i=0; i<nodes.length; i++) {
					if (nodes[i].className === "selected") {
						nodes[i].className = "";
						index = i;
						break;
					}
				}
				if (index > 0) {
					nodes[index-1].className = "selected";
				} else {
					nodes[nodes.length - 1].className = "selected";
				}
				return true;
			}
		},
		lineDown: function() {
			if (this.contentAssistPanel) {
				var nodes = dojo.query('> div', this.contentAssistPanel);
				var index = 0;
				for (var i=0; i<nodes.length; i++) {
					if (nodes[i].className === "selected") {
						nodes[i].className = "";
						index = i;
						break;
					}
				}
				if (index < nodes.length - 1) {
					nodes[index+1].className = "selected";
				} else {
					nodes[0].className = "selected";
				}
				return true;
			}
		},
		enter: function() {
			if (this.contentAssistPanel) {
				var proposal = dojo.query("> .selected", this.contentAssistPanel);
				this.editorWidget.setText(proposal[0].innerHTML.substring(this.prefix.length), this.editorWidget.getCaretOffset(), this.editorWidget.getCaretOffset());
				this.showContentAssist(false);
				return true;
			}
		},
		showContentAssist: function(enable) {
			if (!this.contentAssistPanel) {
				return;
			}
			function createDiv(proposal, isSelected, parent) {
				var attributes = {innerHTML: proposal, onclick: function(){alert(proposal);}};
				if (isSelected) {
					attributes.className = "selected";
				}
				dojo.create("div", attributes, parent, this);
			}
			if (!enable) {
				this.editorWidget.removeEventListener("Verify", this, this.contentAssistListener.onVerify);
				this.editorWidget.removeEventListener("Selection", this, this.contentAssistListener.onSelectionChanged);
				this.active = false;
				this.contentAssistPanel.style.display = "none";
			} else {
				var offset = this.editorWidget.getCaretOffset();
				var index = offset;
				var c;
				while (index > 0 && ((97 <= (c = this.editorWidget.getText(index - 1, index).charCodeAt(0)) && c <= 122) || (65 <= c && c <= 90) || c === 95 || (48 <= c && c <= 57))) { //LETTER OR UNDERSCORE OR NUMBER
					index--;
				}
				
				// Show all proposals
//				if (index === offset) {
//					return;
//				}
				this.prefix = this.editorWidget.getText(index, offset);
				
				var proposals = [],
				    buffer = this.editorWidget.getText(),
				    selection = this.editorWidget.getSelection();
				this.getKeywords(this.prefix, buffer, selection).then(
					dojo.hitch(this, function(keywords) {
						for (var i = 0; i < keywords.length; i++) {
							var proposal = keywords[i];
							if (proposal.substr(0, this.prefix.length) === this.prefix) {
								proposals.push(proposal);
							}
						}
						if (proposals.length === 0) {
							return;
						}
						
						var caretLocation = this.editorWidget.getLocationAtOffset(offset);
						caretLocation.y += this.editorWidget.getLineHeight();
						this.contentAssistPanel.innerHTML = "";
						for (i = 0; i<proposals.length; i++) {
							createDiv(proposals[i], i===0, this.contentAssistPanel);
						}
						this.editorWidget.convert(caretLocation, "document", "page");
						this.contentAssistPanel.style.position = "absolute";
						this.contentAssistPanel.style.left = caretLocation.x + "px";
						this.contentAssistPanel.style.top = caretLocation.y + "px";
						this.contentAssistPanel.style.display = "block";
						this.editorWidget.addEventListener("Verify", this, this.contentAssistListener.onVerify);
						this.editorWidget.addEventListener("Selection", this, this.contentAssistListener.onSelectionChanged);
						this.active = true;
					}));
			}
		},
		/**
		 * @param {String} The string buffer.substring(w+1, c) where c is the caret offset and w is the index of the 
		 * rightmost whitespace character preceding c.
		 * @param {String} buffer The entire buffer being edited
		 * @param {eclipse.Selection} selection The current editor selection.
		 * @returns {dojo.Deferred} A future that will provide the keywords.
		 */
		getKeywords: function(prefix, buffer, selection) {
			var keywords = [];
			
			// Add keywords from directly registered providers
			dojo.forEach(this.activeContentAssistProviders, function(provider) {
				keywords = keywords.concat(provider.getKeywords() || []);
			});
			
			// Add keywords from providers registered through service registry
			if (this.serviceRegistry) {
				var keywordPromises = dojo.map(this.activeServiceReferences, dojo.hitch(this, function(serviceRef) {
						return this.serviceRegistry.getService(serviceRef).then(function(service) {
							return service.getKeywords(prefix, buffer, selection);
						});
					}));
				var dl = new dojo.DeferredList(keywordPromises);
				return dl.then(function(results) {
					for (var i=0; i < results.length; i++) {
						var result = results[i];
						if (result[0]) {
							var serviceKeywords = result[1];
							keywords = keywords.concat(serviceKeywords);
						}
					}
					return keywords;
				});
			} else {
				var d = new dojo.Deferred();
				d.callback(keywords);
				return d;
			}
		},
		/**
		 * Adds a content assist provider.
		 * @param {Object} provider The provider object. See {@link orion.contentAssist.CssContentAssistProvider} for an example.
		 * @param {String} name Name for this provider.
		 * @param {String} pattern The regex pattern matching filenames that provider can offer content assist for.
		 */
		addProvider: function(provider, name, pattern) {
			this.contentAssistProviders = this.contentAssistProviders || [];
			this.contentAssistProviders.push({name: name, pattern: pattern, provider: provider});
		}
	};
	return ContentAssist;
}());
