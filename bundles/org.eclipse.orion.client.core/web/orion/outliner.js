/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 /*global define document window*/

define(['i18n!orion/nls/messages', 'dojo', 'orion/util', 'orion/section', 'orion/explorers/explorer', 'orion/commands', 'orion/URITemplate', 'orion/EventTarget'], function(messages, dojo, mUtil, mSection, mExplorer, mCommands, URITemplate, EventTarget) {

	function OutlineRenderer (options, explorer, title, selectionService) {
		this.explorer = explorer;
		this._init(options);
		this.title = title;
		this.selectionService = selectionService;
	}
	
	OutlineRenderer.prototype = mExplorer.SelectionRenderer.prototype;
	OutlineRenderer.prototype.constructor = OutlineRenderer;
	OutlineRenderer.prototype.getLabelColumnIndex = function() {
		return 0;
	};
	OutlineRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		if (!item) {
			return;
		}
		var elementNode = dojo.create("span", null, tableRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
		if (item.className) {
			dojo.addClass(elementNode, item.className);
		}
		if (item.children) {
			this.getExpandImage(tableRow, elementNode);
		}
		if (item.href) {
			this._createLink(item.label, item.href, elementNode);
		} else if (item.line || item.column || item.start) {
			var href = new URITemplate("#{,resource,params*}").expand({resource: this.title, params: item}); //$NON-NLS-0$
			this._createLink(item.label, href, elementNode);
		} else if (item.label) {
			dojo.place(document.createTextNode(item.label), elementNode, "last"); //$NON-NLS-0$
		}
	};
	
	OutlineRenderer.prototype._createLink = function(text, href, parentNode) {
		var link = dojo.create("a", null, parentNode, "last"); //$NON-NLS-1$ //$NON-NLS-0$
		// if there is no selection service, we rely on normal link following
		if (!this.selectionService) {
			link.href = href;
		} else {
			dojo.style(link, "cursor", "pointer"); //$NON-NLS-1$ //$NON-NLS-0$
		}
		dojo.addClass(link, "navlinkonpage"); //$NON-NLS-0$
		dojo.place(document.createTextNode(text), link);
		// if a selection service has been specified, we will use it for link selection.
		// Otherwise we assume following the href in the anchor tag is enough.
		if (this.selectionService) {
			var selectionService = this.selectionService;
			var url = href;
			dojo.connect(link, "onclick", link, function(event) { //$NON-NLS-0$
				if (mUtil.openInNewWindow(event)) {
					mUtil.followLink(url, event);
				} else {
					selectionService.setSelections(url);
				}
			});
		}
		return link;
	};
	

	function OutlineExplorer(serviceRegistry, selection, title) {
		/*	we intentionally do not do this:
				this.selection = selection;
			Our renderer is going to trigger the selection events using specialized URL's when an outline
			link is clicked.  We don't want the explorer triggering selection events on the outline model item
		*/
		this.registry = serviceRegistry;
		this.renderer = new OutlineRenderer({checkbox: false, decorateAlternatingLines: false, treeTableClass: "outlineExplorer"}, this, title, selection);  //$NON-NLS-0$ 
	}
	OutlineExplorer.prototype = mExplorer.Explorer.prototype;	
	OutlineExplorer.prototype.constructor = OutlineExplorer;
	
	function OutlineModel(items) {
		this.items = items;
		this.root = {children: items};
		this.idItemMap = {};
		this.specialIds = [];
	}
	OutlineModel.prototype.constructor = OutlineModel;
	
	OutlineModel.prototype.getRoot = function(onItem){
		onItem(this.root);
	};
	
	OutlineModel.prototype.destroy = function() {
	};
	
	OutlineModel.prototype.getId = function(/* item */ item){
		// first see if we have already generated an id because of a special case (duplicates)
		// We hope this list remains relatively small, or we should consider a different implementation
		// for mapping items back to their id.
		for (var i=0; i<this.specialIds.length; i++) {
			if (this.specialIds[i].item === item) {
				return this.specialIds[i].id;
			}
		}
		// Generate an id.  This code is assuming that generating an id for an item is faster than if we kept an array
		// of all id/item combinations.  Since these id's are used in the DOM, we strip out characters that shouldn't be in a DOM id.
		var id = item.label.replace(/[\\\/\.\:\-\_]/g, "");
		// We might have duplicate id's if the outline items are duplicated.  Check for this case and use a timestamp in lieu
		// of the generated id.
		if (this.idItemMap[id] && this.idItemMap[id]!== item) {
			id = new Date().getTime().toString();
			this.idItemMap[id] = item;
			this.specialIds.push({id: id, item: item});
		} else {
			this.idItemMap[id] = item;
		}
		return id;
	};
		
	OutlineModel.prototype.getChildren = function(parentItem, /* function(items) */ onComplete){
		if (parentItem.children) {
			// The tree model iterator assumes that there are back links to the parent
			for (var i=0; i<parentItem.children.length; i++) {
				parentItem.children[i].parent = parentItem;
			}
			onComplete(parentItem.children);
		} else {
			onComplete([]);
		}
	};



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
			if (typeof(parent) === "string") { //$NON-NLS-0$
				parent = dojo.byId(parent);
			}
			if (!parent) { throw "no parent"; } //$NON-NLS-0$
			if (!options.outlineService) {throw "no outline service"; } //$NON-NLS-0$
			this._parent = parent;
			this._serviceRegistry = options.serviceRegistry;
			this._outlineService = options.outlineService;
			this._commandService = options.commandService;
			this._selectionService = options.selectionService;
			var self = this;
			dojo.when(this._outlineService, function(service) {
				service.addEventListener("outline", function(event) { //$NON-NLS-0$
					self.providerId = event.providerId;
					self._renderHeadingAndMenu(self.outlineProviders);
					self._renderOutline(event.outline, event.title);
				});
			});
			
			var switchOutlineCommand = new mCommands.Command({
				name: messages["Switch"],
				tooltip: messages["Switch the type of outliner used"],
				id: "eclipse.edit.outline.switch", //$NON-NLS-0$
				visibleWhen: function(item) {
					return true;
				},
				choiceCallback: dojo.hitch(this, this._menuCallback)});
			this._commandService.addCommand(switchOutlineCommand);
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
			this.providerId = provider.getProperty("id"); //$NON-NLS-0$
			this.providerName = provider.getProperty("name"); //$NON-NLS-0$
		},
		setOutlineProviders: function(providers) {
			this.outlineProviders = providers;
			this._renderHeadingAndMenu(this.outlineProviders);
		},
		_renderOutline: function(outlineModel, title) {
			var contentParent = dojo.byId("outlinerHeading"); //$NON-NLS-0$
			if (!contentParent) {
				this._renderHeadingAndMenu();
			}
			var contentNode = dojo.byId("outlineSectionContent"); //$NON-NLS-0$
			dojo.empty(contentNode);
			outlineModel = outlineModel instanceof Array ? outlineModel : [outlineModel];
			if (outlineModel) {
				this.explorer = new OutlineExplorer(this._serviceRegistry, this._selectionService, title);
				this.explorer.createTree("outlineSectionContent", new OutlineModel(outlineModel), {selectionPolicy: "cursorOnly", setFocus: false}); //$NON-NLS-1$ //$NON-NLS-0$
				// expand the first level of the model
				for (var i=0; i < outlineModel.length; i++) {
					if (outlineModel[i].children) {
						this.explorer.myTree.expand(outlineModel[i]);
					}
				}
			}
		},
		_menuCallback: function() {
			var choices = [];
			for (var i=0; i < this.outlineProviders.length; i++) {
				var provider = this.outlineProviders[i],
				    name = provider.displayName || provider.getProperty("name") || (provider.name + provider.serviceId) || "undefined", //$NON-NLS-1$ //$NON-NLS-0$
				    prefix = (provider.getProperty("id") === this.providerId) ? "&bull; " : ""; //$NON-NLS-1$ //$NON-NLS-0$
				choices.push({
					name: prefix + name,
					callback: dojo.hitch(this, this.setSelectedProvider, provider)});
			}
			return choices;
		},
		_renderHeadingAndMenu: function(/**ServiceReference*/ outlineProviders) {
			if (!this.outlineSection) {
				this.outlineSection = new mSection.Section(this._parent, {
					id: "outlinerHeading", //$NON-NLS-0$
					title: messages["Outliner"],
					content: '<div id="outlineSectionContent"></div>', //$NON-NLS-0$
					useAuxStyle: true
				});
				this._commandService.registerCommandContribution(this.outlineSection.selectionNode.id, "eclipse.edit.outline.switch", 1); //$NON-NLS-0$
			}
			this._commandService.destroy(this.outlineSection.selectionNode.id);
			if (outlineProviders.length > 1) {
				this._commandService.renderCommands(this.outlineSection.selectionNode.id, this.outlineSection.selectionNode.id, {}, this, "button"); //$NON-NLS-0$
			}
		}
	};
	Outliner.prototype.constructor = Outliner;
	
	/**
	 * Constructs a new outline service. Clients should obtain an outline service by requesting
	 * the service <code>orion.edit.outline</code> from the service registry. This service constructor
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
		EventTarget.attach(this);
		this._serviceRegistration = this._serviceRegistry.registerService("orion.edit.outline", this); //$NON-NLS-0$
		this._outlinePref = this._preferences.getPreferences("/edit/outline"); //$NON-NLS-0$
		this._provider = new dojo.Deferred();
	}
	OutlineService.prototype = /** @lends orion.outliner.OutlineService.prototype */ {
		setOutlineProviders: function(/**ServiceReference[]*/ providers) {
			this.providers = providers;
			// Check pref to see if user has chosen a preferred outline provider
			var self = this;
			dojo.when(this._outlinePref, function(pref) {
				var provider;
				for (var i=0; i < providers.length; i++) {
					provider = providers[i];
					if (pref.get("outlineProvider") === providers[i].getProperty("id")) { //$NON-NLS-1$ //$NON-NLS-0$
						break;
					}
				}
				if (provider) {
					self.setProvider(provider);
				}
			});
		},
		setProvider: function(/**ServiceReference*/ provider) {
			if (this._provider.fired !== -1) {
				this._provider = new dojo.Deferred();
			}
			this._provider.callback(provider);
			var id = provider.getProperty("id"); //$NON-NLS-0$
			if (id) {
				this._outlinePref.then(function(pref) {
					pref.put("outlineProvider", id); //$NON-NLS-0$
				});
			}
		},
		/** @returns {dojo.Deferred} */
		getProvider: function() {
			return this._provider;
		},
		emitOutline: function(contents, title, providerId) {
			var self = this;
			dojo.when(this.getProvider(), function(provider) {
				self._serviceRegistry.getService(provider).getOutline(contents, title).then(function(outline) {
					self.dispatchEvent({type:"outline", outline: outline, title: title, providerId: provider.getProperty("id")}); //$NON-NLS-1$ //$NON-NLS-0$
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

