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
/*global define dojo window*/
/*jslint maxerr:150 browser:true devel:true */

/**
 * @namespace The container for Orion APIs.
 */ 
var orion = orion || {};
orion.editor = orion.editor || {};

/**
 * @name orion.editor.ContentAssist
 * @class A key mode for {@link orion.editor.Editor} that can display content assist suggestions.
 * @description A <code>ContentAssist</code> will look for content assist providers in the service registry (if provided).
 * Alternatively, providers can be registered directly by calling {@link #addProvider}.
 * <p>To be notified when a proposal has been accepted by the user, clients can register a listener for the <code>"accept"</code> event
 * using {@link #addEventListener}.</p>
 * @param {orion.editor.Editor} editor The Editor to provide content assist for.
 * @param {String|DomNode} contentAssistId The ID or DOMNode to use as the parent for content assist.
 * @param {orion.serviceregistry.ServiceRegistry} [serviceRegistry] Service registry to use for looking up content assist providers.
 * If this parameter is omitted, providers must instead be registered by calling {@link #addProvider}.
 */
orion.editor.ContentAssist = (function() {
	/** @private */
	function ContentAssist(editor, contentAssistId, serviceRegistry) {
		this.editor = editor;
		this.textView = editor.getTextView();
		this.contentAssistPanel = dojo.byId(contentAssistId);
		this.active = false;
		this.prefix = "";
		this.serviceRegistry = serviceRegistry;
		this.contentAssistProviders = [];
		this.activeServiceReferences = [];
		this.activeContentAssistProviders = [];
		this.listeners = {};
		this.proposals = [];
		this.contentAssistListener = {
			onModelChanged: function(event) {
				if (!this.finishing) {
					this.showContentAssist(true, event);
				}
			},
			onScroll: function(event) {
				this.showContentAssist(false);
			}
		};

		this.init();
	}
	ContentAssist.prototype = /** @lends orion.editor.ContentAssist.prototype */ {
		init: function() {
			var isMac = navigator.platform.indexOf("Mac") !== -1;
			this.textView.setKeyBinding(isMac ? new orion.textview.KeyBinding(' ', false, false, false, true) : new orion.textview.KeyBinding(' ', true), "Content Assist");
			this.textView.setAction("Content Assist", dojo.hitch(this, function() {
				this.showContentAssist(true);
				return true;
			}));
			dojo.connect(this.editor, "onInputChange", this, this.inputChanged);
		},
		/** Registers a listener with this <code>ContentAssist</code>. */
		addEventListener: function(/** String */ type, /** Function */ listener) {
			if (!this.listeners[type]) {
				this.listeners[type] = [];
			}
			this.listeners[type].push(listener);
		},
		/** @private */
		dispatchEvent: function(/** String */ type, /** Object */ data) {
			var event = { type: type, data: data };
			var listeners = this.listeners[type];
			if (listeners) {
				for (var i=0; i < listeners.length; i++) {
					listeners[i](event);
				}
			}
		},
		/** @private */
		inputChanged: function(/**String*/ fileName) {
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
				var selected = this.getSelectedNode();
				if (selected === this.contentAssistPanel.firstChild) {
					this.setSelected(this.contentAssistPanel.lastChild);
				} else {
					this.setSelected(selected.previousSibling);
				}
				return true;
			}
		},
		lineDown: function() {
			if (this.contentAssistPanel) {
				var selected = this.getSelectedNode();
				if (selected === this.contentAssistPanel.lastChild) {
					this.setSelected(this.contentAssistPanel.firstChild);
				} else {
					this.setSelected(selected.nextSibling);
				}
				return true;
			}
		},
		enter: function() {
			if (this.contentAssistPanel) {
				return this.accept();
			} else {
				return false;
			}
		},
		/**
		 * Accepts the currently selected proposal, if any.
		 * @returns {Boolean}
		 */
		accept: function() {
			var proposal = this.getSelectedProposal();
			if (proposal === null) {
				return false;
			}
			this.finishing = true;
			this.showContentAssist(false);
			var data = {
				proposal: proposal,
				start: this.textView.getCaretOffset() - this.prefix.length,
				end: this.textView.getCaretOffset()
			};
			this.dispatchEvent("accept", data);
			return true;
		},
		setSelected: function(/** DOMNode */ node) {
			var nodes = this.contentAssistPanel.childNodes;
			for (var i=0; i < nodes.length; i++) {
				var child = nodes[i];
				if (child.className === "selected") {
					child.className = "";
				}
				if (child === node) {
					child.className = "selected";
				}
			}
		},
		/** @returns {DOMNode} The DOM node of the currently selected proposal. */
		getSelectedNode: function() {
			var index = this.getSelectedIndex();
			return index === -1 ? null : this.contentAssistPanel.childNodes[index];
		},
		/** @returns {Number} The index of the currently selected proposal. */
		getSelectedIndex: function() {
			var nodes = this.contentAssistPanel.childNodes;
			for (var i=0; i < nodes.length; i++) {
				if (nodes[i].className === "selected") {
					return i;
				}
			}
			return -1;
		},
		/** @returns {Object} The currently selected proposal. */
		getSelectedProposal: function() {
			var index = this.getSelectedIndex();
			return index === -1 ? null : this.proposals[index];
		},
		click: function(e) {
			this.setSelected(e.target);
			this.accept();
			this.editor.getTextView().focus();
		},
		/**
		 * @param {Boolean} enable
		 * @param {orion.textview.ModelChangedEvent} [event]
		 */
		showContentAssist: function(enable, event) {
			if (!this.contentAssistPanel) {
				return;
			}
			function createDiv(proposal, isSelected, parent) {
				var attributes = {innerHTML: proposal};
				if (isSelected) {
					attributes.className = "selected";
				}
				dojo.create("div", attributes, parent, this);
			}
			if (!enable) {
				if (this.listenerAdded) {
					this.textView.removeEventListener("ModelChanged", this, this.contentAssistListener.onModelChanged);
					this.textView.removeEventListener("Scroll", this, this.contentAssistListener.onScroll);
					this.listenerAdded = false;
				}
				this.active = false;
				this.contentAssistPanel.style.display = "none";
				this.contentAssistPanel.onclick = null;
			} else {
				var offset = event ? (event.start + event.addedCharCount) : this.textView.getCaretOffset();
				var index = offset;
				var c;
				while (index > 0 && ((97 <= (c = this.textView.getText(index - 1, index).charCodeAt(0)) && c <= 122) || (65 <= c && c <= 90) || c === 95 || (48 <= c && c <= 57))) { //LETTER OR UNDERSCORE OR NUMBER
					index--;
				}
				
				// Show all proposals
//				if (index === offset) {
//					return;
//				}
				this.prefix = this.textView.getText(index, offset);
				
				var buffer = this.textView.getText(),
				    selection = this.textView.getSelection();

				/**
				 * Bug/feature: The selection returned by the textView doesn't seem to be updated before notifying the listeners
				 * of onModelChanged. If content assist is triggered by Ctrl+Space, the start/end position of the selection
				 * (i.e. the caret position) is correct. But if the user then starts to type some text (in order to filter the
				 * the completion proposals list by a prefix) - i.e. onModelChanged listeners are notified and, in turn,
				 * this method - the selection is not up-to-date. Because of that, I just did a simple hack of adding the offset
				 * field for selection, which is computed above and is always correct. The selection is passed to the content
				 * assist providers.
				 */
				selection.offset = offset;

				/**
				 * Each element of the keywords array returned by content assist providers may be either:
				 * - String: a simple string proposal
				 * - Object: must have a property "proposal" giving the proposal string. May also have other fields, which 
				 * can trigger linked mode behavior in the editor.
				 */
				this.getKeywords(this.prefix, buffer, selection).then(
					dojo.hitch(this, function(keywords) {
						this.proposals = [];
						for (var i = 0; i < keywords.length; i++) {
							var proposal = keywords[i];
							if (proposal === null || proposal === undefined) {
								continue;
							}
							if (this.matchesPrefix(proposal) || this.matchesPrefix(proposal.proposal)) {
								this.proposals.push(proposal);
							}
						}
						if (this.proposals.length === 0) {
							this.showContentAssist(false);
							return;
						}
						
						var caretLocation = this.textView.getLocationAtOffset(offset);
						caretLocation.y += this.textView.getLineHeight();
						this.contentAssistPanel.innerHTML = "";
						for (i = 0; i < this.proposals.length; i++) {
							createDiv(this.getDisplayString(this.proposals[i]), i===0, this.contentAssistPanel);
						}
						this.textView.convert(caretLocation, "document", "page");
						this.contentAssistPanel.style.position = "absolute";
						this.contentAssistPanel.style.left = caretLocation.x + "px";
						this.contentAssistPanel.style.top = caretLocation.y + "px";
						this.contentAssistPanel.style.display = "block";
						if (!this.listenerAdded) {
							this.textView.addEventListener("ModelChanged", this, this.contentAssistListener.onModelChanged);
							this.textView.addEventListener("Scroll", this, this.contentAssistListener.onScroll);
						}
						this.listenerAdded = true;
						this.contentAssistPanel.onclick = dojo.hitch(this, this.click);
						this.active = true;
						this.finishing = false;
					}));
			}
		},
		getDisplayString: function(proposal) {
			return typeof proposal === "string" ? proposal : proposal.proposal;
		},
		matchesPrefix: function(str) {
			return typeof str === "string" && str.substr(0, this.prefix.length) === this.prefix;
		},
		/**
		 * @param {String} prefix A prefix against which content assist proposals should be evaluated.
		 * @param {String} buffer The entire buffer being edited.
		 * @param {orion.textview.Selection} selection The current selection from the Editor.
		 * @returns {dojo.Deferred} A future that will provide the keywords.
		 */
		getKeywords: function(prefix, buffer, selection) {
			var keywords = [];
			
			// Add keywords from directly registered providers
			dojo.forEach(this.activeContentAssistProviders, function(provider) {
				keywords = keywords.concat(provider.getKeywords() || []);
			});
			
			// Add keywords from providers registered through service registry
			var d = new dojo.Deferred();
			if (this.serviceRegistry) {
				var keywordPromises = dojo.map(this.activeServiceReferences, dojo.hitch(this, function(serviceRef) {
					return this.serviceRegistry.getService(serviceRef).then(function(service) {
						return service.getKeywords(prefix, buffer, selection);
					});
				}));
				var keywordCount = 0;
				for (var i=0; i < keywordPromises.length; i++) {
					keywordPromises[i].then(function(result) {
						keywordCount++;
						keywords = keywords.concat(result);
						if (keywordCount === keywordPromises.length) {
							d.resolve(keywords);
						}
					}, function(e) {
						keywordCount = -1;
						d.reject(e); 
					});
				}
			} else {
				d.resolve(keywords);
			}
			return d;
		},
		/**
		 * Adds a content assist provider.
		 * @param {Object} provider The provider object. See {@link orion.contentAssist.CssContentAssistProvider} for an example.
		 * @param {String} name Name for this provider.
		 * @param {String} pattern A regex pattern matching filenames that <tt>provider</tt> can offer content assist for.
		 */
		addProvider: function(provider, name, pattern) {
			this.contentAssistProviders = this.contentAssistProviders || [];
			this.contentAssistProviders.push({name: name, pattern: pattern, provider: provider});
		}
	};
	return ContentAssist;
}());

if (typeof window !== "undefined" && typeof window.define !== "undefined") {
	define(['dojo', 'orion/textview/keyBinding'], function() {
		return orion.editor;	
	});
}
