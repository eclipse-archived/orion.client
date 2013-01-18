/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 /*global define document window*/

define(['i18n!orion/nls/messages', 'orion/Deferred', 'orion/webui/littlelib', 'orion/uiUtils', 'orion/section', 'orion/explorers/explorer', 'orion/commands', 'orion/URITemplate', 'orion/EventTarget'], function(messages, Deferred, lib, mUIUtils, mSection, mExplorer, mCommands, URITemplate, EventTarget) {

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
		var elementNode = document.createElement("span"); //$NON-NLS-0$
		tableRow.appendChild(elementNode);
		if (item.className) {
			elementNode.classList.add(item.className);
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
			elementNode.appendChild(document.createTextNode(item.label)); //$NON-NLS-0$
		}
	};
	
	OutlineRenderer.prototype._createLink = function(text, href, parentNode) {
		var link = document.createElement("a"); //$NON-NLS-0$
		parentNode.appendChild(link);
		// if there is no selection service, we rely on normal link following
		if (!this.selectionService) {
			link.href = href;
		} else {
			link.style.cursor = "pointer"; //$NON-NLS-0$
		}
		link.classList.add("navlinkonpage"); //$NON-NLS-0$
		link.appendChild(document.createTextNode(text));
		// if a selection service has been specified, we will use it for link selection.
		// Otherwise we assume following the href in the anchor tag is enough.
		if (this.selectionService) {
			var selectionService = this.selectionService;
			var url = href;
			link.addEventListener("click", function(event) { //$NON-NLS-0$
				if (mUIUtils.openInNewWindow(event)) {
					mUIUtils.followLink(url, event);
				} else {
					selectionService.setSelections(url);
				}
			}, false);
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
		this.renderer = new OutlineRenderer({checkbox: false, treeTableClass: "outlineExplorer"}, this, title, selection);  //$NON-NLS-0$ 
	}
	OutlineExplorer.prototype = mExplorer.Explorer.prototype;	
	OutlineExplorer.prototype.constructor = OutlineExplorer;
	
	function OutlineModel(items, rootId) {
		this.items = items;
		this.root = {children: items};
		this.root.outlinerId = rootId;
		this.idItemMap = {};
	}
	OutlineModel.prototype.constructor = OutlineModel;
	
	OutlineModel.prototype.getRoot = function(onItem){
		onItem(this.root);
	};
	
	OutlineModel.prototype.destroy = function() {
	};
	
	OutlineModel.prototype.getId = function(/* item */ item){
		// Do we have a cached id?
		if (item.outlinerId) {
			return item.outlinerId;
		}
		// Generate an id.  Since these id's are used in the DOM, we strip out characters that shouldn't be in a DOM id.
		var id = item.label.replace(/[\\\/\.\:\-\_]/g, "");
		// We might have duplicate id's if the outline items are duplicated, or if we happen to have another dom id using
		// this name.  Check for this case and use a timestamp in lieu of the generated id.
		if ((this.idItemMap[id] && this.idItemMap[id]!== item) ||
			lib.node(id)) {// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=389760
			id = new Date().getTime().toString();
			this.idItemMap[id] = item;
			item.outlinerId = id;
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
	
	OutlineModel.prototype.doExpansions = function(tree) {
		// for now, just expand the first level of the model
		// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=389547
		for (var i=0; i < this.root.children.length; i++) {
			if (this.root.children[i].children) {
				tree.expand(this.root.children[i]);
			}
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
			parent = lib.node(parent);
			if (!parent) { throw "no parent"; } //$NON-NLS-0$
			if (!options.outlineService) {throw "no outline service"; } //$NON-NLS-0$
			this._parent = parent;
			this._serviceRegistry = options.serviceRegistry;
			this._outlineService = options.outlineService;
			this._commandService = options.commandService;
			this._selectionService = options.selectionService;
			this._onSelectedProvider = options.onSelectedProvider;
			var self = this;
			Deferred.when(self._outlineService, function(service) {
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
				choiceCallback: this._menuCallback.bind(this)
			});
			this._commandService.addCommand(switchOutlineCommand);
		},
		outlineChanged: function(outlinerService, title, contents) {
			var self = this;
			var progress = this._serviceRegistry.getService("orion.page.progress");
			progress.progress(outlinerService.getOutline(contents, title), "Getting outline for " + title).then(function(outlineModel) {
				self._renderOutline(outlineModel, title);
			});
		},
		setSelectedProvider: function(/**ServiceReference*/ provider) {
			this.providerId = provider.getProperty("id"); //$NON-NLS-0$
			this.providerName = provider.getProperty("name"); //$NON-NLS-0$
			if (this._onSelectedProvider) {
				this._onSelectedProvider(provider);
			}
		},
		setOutlineProviders: function(providers) {
			this.outlineProviders = providers;
			this._renderHeadingAndMenu(this.outlineProviders);
		},
		_renderOutline: function(outlineModel, title) {
			var contentParent = lib.node("outlinerHeading"); //$NON-NLS-0$
			if (!contentParent) {
				this._renderHeadingAndMenu();
			}
			var contentNode = lib.node("outlineSectionContent"); //$NON-NLS-0$
			lib.empty(contentNode);
			outlineModel = outlineModel instanceof Array ? outlineModel : [outlineModel];
			if (outlineModel) {
				var treeModel = new OutlineModel(outlineModel);
				this.explorer = new OutlineExplorer(this._serviceRegistry, this._selectionService, title);
				this.explorer.createTree("outlineSectionContent", treeModel, {selectionPolicy: "cursorOnly", setFocus: false}); //$NON-NLS-1$ //$NON-NLS-0$
				treeModel.doExpansions(this.explorer.myTree);
			}
		},
		_menuCallback: function() {
			var choices = [];
			for (var i=0; i < this.outlineProviders.length; i++) {
				var provider = this.outlineProviders[i],
				    name = provider.displayName || provider.getProperty("name") || (provider.name + provider.serviceId) || "undefined", //$NON-NLS-1$ //$NON-NLS-0$
				    prefix = (provider.getProperty("id") === this.providerId) ? "* " : ""; //$NON-NLS-1$ //$NON-NLS-0$
				choices.push({
					name: prefix + name,
					callback: this.setSelectedProvider.bind(this, provider)});
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
		this._provider = new Deferred();
		this._providerResolved = false;
	}
	OutlineService.prototype = /** @lends orion.outliner.OutlineService.prototype */ {
		setOutlineProviders: function(/**ServiceReference[]*/ providers) {
			this.providers = providers;
			// Check pref to see if user has chosen a preferred outline provider
			var self = this;
			Deferred.when(this._outlinePref, function(pref) {
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
			if (this._providerResolved) {
				this._provider = new Deferred();
			}
			this._provider.resolve(provider);
			this._providerResolved = true;
			var id = provider.getProperty("id"); //$NON-NLS-0$
			if (id) {
				this._outlinePref.then(function(pref) {
					pref.put("outlineProvider", id); //$NON-NLS-0$
				});
			}
		},

		getProvider: function() {
			return this._provider.promise;
		},
		emitOutline: function(contents, title, providerId) {
			var self = this;
			
			Deferred.when(this.getProvider(), function(provider) {
				var progress = self._serviceRegistry.getService("orion.page.progress");
				progress.progress(self._serviceRegistry.getService(provider).getOutline(contents, title), "Getting outline for " + title + " from " + provider.displayName).then(function(outline) {
					if (outline) {
						self.dispatchEvent({type:"outline", outline: outline, title: title, providerId: provider.getProperty("id")}); //$NON-NLS-1$ //$NON-NLS-0$
					}
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

