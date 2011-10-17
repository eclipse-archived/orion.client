/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 /*global define document window*/

define(['dojo', 'orion/util', 'orion/commands'], function(dojo, mUtil, mCommands) {

	/**
	 * Constructs a new Outliner with the given options.
	 * @name orion.outliner.Outliner
	 * @class An Outliner is a visual component that renders an itemized overview of a resource and acts as 
	 * a selection provider on that resource. The itemized overview is obtained from the {@link orion.outliner.OutlineService}.
	 * @param {Object} options The options object
	 * @param {Object} options.parent The parent DOM element to put this outliner inside
	 * @param {orion.serviceRegistry.ServiceRegistry} options.serviceRegistry The service registry.
	 * @param {orion.commands.CommandService} options.commandService
	 * @param {Service of type orion.outliner.OutlineService} options.outlineService The outline service to use.
	 * @param {orion.selection.Selection} [options.selectionService] If provided, the 
	 * selection service will be notified on outline selection rather than using anchor tag hrefs.
	 */
	function Outliner(options) {
		this._init(options);
	}
	Outliner.prototype = /** @lends orion.outliner.Outliner.prototype */ {
		_init: function(options) {
			var parent = options.parent;
			if (typeof(parent) === "string") {
				parent = dojo.byId(parent);
			}
			if (!parent) { throw "no parent"; }
			if (!options.outlineService) {throw "no outline service"; }
			this._parent = parent;
			this._serviceRegistry = options.serviceRegistry;
			this._outlineService = options.outlineService;
			this._commandService = options.commandService;
			this._selectionService = options.selectionService;
			var self = this;
			dojo.when(this._outlineService, function(service) {
				service.addEventListener("outline", function(outlineModel, title, providerId) {
					self.providerId = providerId;
					self._renderMenu(self.outlineProviders);
					self._renderOutline.apply(self, Array.prototype.slice.call(arguments));
				});
			});
			
			var switchOutlineCommand = new mCommands.Command({
				name: "Outline",
				id: "eclipse.edit.outline.switch",
				visibleWhen: function(item) {
					return true;
				},
				choiceCallback: dojo.hitch(this, this._menuCallback)});
			this._commandService.addCommand(switchOutlineCommand, "dom");
		},
		outlineChanged: function(outlinerService, title, contents) {
			var self = this;
			outlinerService.getOutline(contents, title).then(function(outlineModel) {
				self._renderOutline(outlineModel, title);
			});
		},
		/**
		 * Clients can connect to this function to be notified of user choice of outline provider.
		 */
		setSelectedProvider: function(/**ServiceReference*/ provider) {
			this.providerId = provider.getProperty("id");
		},
		setOutlineProviders: function(providers) {
			this.outlineProviders = providers;
			this._renderMenu(this.outlineProviders);
		},
		_renderOutline: function(outlineModel, title) {
			outlineModel = outlineModel instanceof Array ? outlineModel : [outlineModel];
			if (outlineModel) {
				if (this.outlineNode) {
					dojo.empty(this.outlineNode);
				} else {
					this.outlineNode = dojo.create("ul", {className: "outline"});
				}
				for (var i=0; i < outlineModel.length; i++) {
					this._renderElement(this.outlineNode, outlineModel[i], title);
				}
				dojo.place(this.outlineNode, this._parent, "last");
			}
		},
		_menuCallback: function() {
			var choices = [];
			for (var i=0; i < this.outlineProviders.length; i++) {
				var provider = this.outlineProviders[i],
				    name = provider.getProperty("name") || (provider.name + provider.serviceId) || "undefined",
				    prefix = (provider.getProperty("id") === this.providerId) ? "&bull; " : "";
				choices.push({
					name: prefix + name,
					callback: dojo.hitch(this, this.setSelectedProvider, provider)});
			}
			return choices;
		},
		_renderMenu: function(/**ServiceReference*/ outlineProviders) {
			if (this.menuNode) {
				dojo.empty(this.menuNode);
			} else {
				this.menuNode = dojo.create("div", {id: "switchOutlineMenu"}, this._parent, "last");
			}
			if (outlineProviders.length > 1) {
				this._commandService.registerCommandContribution("eclipse.edit.outline.switch", 1, this.menuNode.id);
				this._commandService.renderCommands(this.menuNode, "dom", null, this, "image", null, null, true);
			}
		},
		_renderElement: function(/**DOMNode*/ parentNode, /**Object*/ element, title) {
			if (!element) {
				return;
			}
			var elementNode = dojo.create("li", null, parentNode, "last");
			if (element.className) {
				dojo.addClass(elementNode, element.className);
			}
			if (element.href) {
				this._createLink(element.label, element.href, elementNode);
			} else if (element.line || element.column || element.start) {
				var start = element.start || null,
				    end = element.end || null,
				    line = element.line || null,
				    offset = element.column || null,
				    text = element.text || null,
				    href = mUtil.hashFromPosition(title, start, end, line, offset, null, text);
				this._createLink(element.label, href, elementNode);
			} else if (element.label) {
				dojo.place(document.createTextNode(element.label), elementNode, "only");
			}
			var children = element.children;
			if (children) {
				var newParent = dojo.create("ul", null, elementNode, "last");
				for (var i = 0; i < children.length; i++) {
					this._renderElement(newParent, children[i], title);
				}
			}
		},
		/** @returns {DOMNode} */
		_createLink: function(text, href, parentNode) {
			var link = dojo.create("a", null, parentNode, "last");
			// if there is no selection service, we rely on normal link following
			if (!this._selectionService) {
				link.href = href;
			} else {
				dojo.style(link, "cursor", "pointer");
			}
			dojo.addClass(link, "navlinkonpage");
			dojo.place(document.createTextNode(text), link);
			// if a selection service has been specified, we will use it for link selection.
			// Otherwise we assume following the href in the anchor tag is enough.
			if (this._selectionService) {
				var selectionService = this._selectionService;
				var url = href;
				dojo.connect(link, "onclick", link, function(event) {
					if (mUtil.openInNewWindow(event)) {
						mUtil.followLink(url, event);
					} else {
						selectionService.setSelections(url);
					}
				});
			}
			return link;
		}
	};
	Outliner.prototype.constructor = Outliner;
	
	/**
	 * Constructs a new outline service. Clients should obtain an outline service by requesting
	 * the service <tt>orion.edit.outline</tt> from the service registry. This service constructor
	 * is only intended to be used by page service registry initialization code.
	 * @name orion.outliner.OutlineService
	 * @class <code>OutlineService</code> dispatches an event when an outline for a resource is available.
	 * Clients may listen to the service's <code>outline</code> event to receive notification when this occurs.
	 * @param {orion.serviceregistry.ServiceRegistry} options.serviceRegistry The service registry to use for obtaining
	 * outline providers.
	 * @param {orion.preferences.PreferencesService} options.preferences The preferences service to use.
	 */
	function OutlineService(options) {
		this._serviceRegistry = options.serviceRegistry;
		this._preferences = options.preferences;
		this._serviceRegistration = this._serviceRegistry.registerService("orion.edit.outline", this);
		this._outlinePref = this._preferences.getPreferences("/edit/outline");
	}
	OutlineService.prototype = /** @lends orion.outliner.OutlineService.prototype */ {
		setOutlineProviders: function(/**ServiceReference[]*/ providers, contents, title) {
			this.providers = providers;
			// Check pref to see if user has chosen a preferred outline provider
			var self = this;
			dojo.when(this._outlinePref, function(pref) {
				var provider;
				for (var i=0; i < providers.length; i++) {
					provider = providers[i];
					if (pref.get("outlineProvider") === providers[i].getProperty("id")) {
						break;
					}
				}
				if (provider) {
					self.setProvider(provider);
					self.emitOutline(contents, title);
				}
			});
		},
		setProvider: function(/**ServiceReference*/ provider) {
			this.outlineProvider = provider;
			var id = provider.getProperty("id");
			if (id) {
				this._outlinePref.then(function(pref) {
					pref.put("outlineProvider", id);
				});
			}
		},
		emitOutline: function(contents, title, providerId) {
			var self = this;
			dojo.when(this._serviceRegistry.getService(this.outlineProvider), function(service) {
				service.getOutline(contents, title).then(function(outline) {
					self._serviceRegistration.dispatchEvent("outline", outline, title, self.outlineProvider.getProperty("id"));
				});
			});
		}
	};
	OutlineService.prototype.constructor = OutlineService;
	
	//return module exports
	return {
		Outliner: Outliner,
		OutlineService: OutlineService
	};
});

