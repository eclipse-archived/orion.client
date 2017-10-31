/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define([
	'orion/objects',
	'i18n!orion/nls/messages',
	'orion/Deferred',
	'orion/webui/littlelib',
	'orion/uiUtils',
	'orion/explorers/explorer',
	'orion/commands',
	'orion/URITemplate',
	'orion/EventTarget',
	'orion/i18nUtil',
	'orion/keyBinding',
	'orion/globalCommands',
	'orion/webui/Slideout'
], function(objects, messages, Deferred, lib, mUIUtils, mExplorer, mCommands, URITemplate, EventTarget, i18nUtil, KeyBinding, mGlobalCommands, mSlideout) {

	var OUTLINE_TIMEOUT_MS = 2 * 60 * 1000; // determines how many milliseconds we will wait for the outline service to compute and return an outline before considering it timed out
	
	function OutlineRenderer (options, explorer, title, inputManager) {
		this.explorer = explorer;
		this._init(options);
		this.title = title;
		this.inputManager = inputManager;
	}
	
	OutlineRenderer.prototype = new mExplorer.SelectionRenderer();
	OutlineRenderer.prototype.constructor = OutlineRenderer;
	OutlineRenderer.prototype.getLabelColumnIndex = function() {
		return 0;
	};
	OutlineRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		if (!item) {
			return;
		}
		
		// ExpandNode | ContentsNode { Link { LinkContentsNode {PreNode <labelPre> | <label> | PostNode <labelPost>} } }
		// className applies to all of ContentsNode, classNamePre applies to PreNode, classNamePost applies to PostNode
		
		var elementNode = document.createElement("span"); //$NON-NLS-0$
		var expandNode = document.createElement("span"); //$NON-NLS-0$
		var contentsNode = document.createElement("span"); //$NON-NLS-0$
 		tableRow.appendChild(elementNode);
		elementNode.appendChild(expandNode);
		elementNode.appendChild(contentsNode);
		
 		if (item.className) {
			contentsNode.className += item.className;
 		}
 		if (item.children) {
			this.getExpandImage(tableRow, expandNode);
		} else {
			expandNode.classList.add("outlineLeafIndent"); //$NON-NLS-0$
 		}
 		
 		// Create the link content (labelPre + label + labelPost)
 		var linkContents = document.createElement("span"); //$NON-NLS-0$
 		if (item.labelPre || item.classNamePre){
 			var preNode = document.createElement("span"); //$NON-NLS-0$
 			linkContents.appendChild(preNode);
 			if (item.labelPre) {
 				preNode.appendChild(document.createTextNode(item.labelPre));
 			}
	 		if (item.classNamePre) {
				preNode.className += item.classNamePre;
	 		}
 		}
 		if (item.label){
 			linkContents.appendChild(document.createTextNode(item.label));
 		}
 		if (item.labelPost || item.classNamePost){
 			var postNode = document.createElement("span"); //$NON-NLS-0$
 			linkContents.appendChild(postNode);
 			if (item.labelPost) {
 				postNode.appendChild(document.createTextNode(item.labelPost));
 			}
	 		if (item.classNamePost) {
				postNode.className += item.classNamePost;
	 		}
 		}
 		
 		if (item.href) {
			this._createLink(linkContents, item.href, contentsNode);
 		} else if (item.line || item.column || item.start || item.end) {
 			var href = new URITemplate("#{,resource,params*}").expand({resource: this.title, params: item}); //$NON-NLS-0$
			this._createLink(linkContents, href, contentsNode);
 			item.outlineLink = href;
 		} else {
			contentsNode.appendChild(linkContents); //$NON-NLS-0$
 		}
 	};
 	
 	OutlineRenderer.prototype.getSelectionService = function() {
 		return this.inputManager.selection;
 	}
	
	OutlineRenderer.prototype._createLink = function(contentsNode, href, parentNode) {
		var link = document.createElement("a"); //$NON-NLS-0$
		parentNode.appendChild(link);
		
		link.classList.add("navlinkonpage"); //$NON-NLS-0$
		link.appendChild(contentsNode);
		
		// if a selection service has been specified, we will use it for link selection.
		// Otherwise we assume following the href in the anchor tag is enough.
		var selectionService = this.getSelectionService();
		if (selectionService) {
			link.style.cursor = "pointer"; //$NON-NLS-0$
			link.addEventListener("click", function(event) { //$NON-NLS-0$
				this._followLink(event, href);
			}.bind(this), false);
		} else {
			// if there is no selection service, we rely on normal link following
			link.href = href;	
		}
		
		return link;
	};
	
	//This is an optional function for explorerNavHandler. It performs an action when Enter is pressed on a table row.
    //The explorerNavHandler hooked up by the explorer will check if this function exists and call it on Enter key press.
    OutlineRenderer.prototype.performRowAction = function(event, item) {
		this._followLink(event, item.outlineLink);
    };
    
    OutlineRenderer.prototype._followLink = function(event, url) {
		var selectionService = this.getSelectionService();
		if (selectionService) {
			if (mUIUtils.openInNewWindow(event)) {
				mUIUtils.followLink(url, event);
			} else {
				selectionService.setSelections(url);
			}
		}
    };
	
	
	function OutlineExplorer(serviceRegistry, inputManager, title) {
		/*	we intentionally do not do this:
				this.selection = selection;
			Our renderer is going to trigger the selection events using specialized URL's when an outline
			link is clicked.  We don't want the explorer triggering selection events on the outline model item
		*/
		this.registry = serviceRegistry;
		this.renderer = new OutlineRenderer({checkbox: false, treeTableClass: "outlineExplorer"}, this, title, inputManager);  //$NON-NLS-0$ 
	}
	OutlineExplorer.prototype = new mExplorer.Explorer();	
	OutlineExplorer.prototype.constructor = OutlineExplorer;
	
	OutlineExplorer.prototype.filterChanged = function (filter) {
		var navHandler = this.getNavHandler();
		var modifiedFilter = null;
		
		if (filter) {
			var filterFlags = "i"; // case insensitive by default //$NON-NLS-0$
			modifiedFilter = filter.replace(/([.+^=!:${}()|\[\]\/\\])/g, "\\$1"); //add start of line character and escape all special characters except * and ? //$NON-NLS-1$ //$NON-NLS-0$
			modifiedFilter = modifiedFilter.replace(/([*?])/g, ".$1");	//convert user input * and ? to .* and .? //$NON-NLS-0$
			
			if (/[A-Z]/.test(modifiedFilter)) {
				//filter contains uppercase letters, perform case sensitive search
				filterFlags = "";	
			}
			
			modifiedFilter = new RegExp(modifiedFilter, filterFlags);
			this._currentModifiedFilter = modifiedFilter;

		
			//figure out if we need to expand
			if (this._previousUnmodifiedFilter) {
				if (0 !== filter.indexOf(this._previousUnmodifiedFilter)) {
					//this is not a more specific version of the previous filter, expand again
					this.expandAll();
				}
			} else {
				//there was no previous filter, expand all
				this.expandAll();
			}
		} else {
			//filter was emptied, expand all
			this.expandAll();
			this._currentModifiedFilter = null;
		}
		
		// filter the tree nodes recursively
		// this should also be done if the passed in filter is empty
		// because it will traverse all the nodes and reset their states
		var topLevelNodes = navHandler.getTopLevelNodes();
		for (var i = 0; i < topLevelNodes.length ; i++){
			this._filterRecursively(topLevelNodes[i], modifiedFilter);
		}
		
		this._previousUnmodifiedFilter = filter;
	};
	
	OutlineExplorer.prototype._filterRecursively = function (node, filter) {
		var navHandler = this.getNavHandler();
		var self = this;
		var rowDiv = navHandler.getRowDiv(node);
		// true if the filter is null or if the node's label matches it
		var nodeMatchesFilter = -1 !== node.label.search(filter);
		if(typeof node.labelPost === 'string') {
			nodeMatchesFilter |= -1 !== node.labelPost.search(filter);
		}		
		if (node.children) {
			// if this node has children ensure it is expanded otherwise we've already filtered it out
			if (navHandler.isExpanded(node)) {
				var hasVisibleChildren = false;
				node.children.forEach(function(childNode){
					if (self._filterRecursively(childNode, filter)) {
						hasVisibleChildren = true;
					}
				});
				
				if (!hasVisibleChildren) {
					this.myTree.collapse(node);
				}
			}
		}
		
		// node is visible if one of the following is true: 
		// 1) filter === null
		// 2) the node has visible children
		// 3) the node matches the filter
		var visible = !filter || hasVisibleChildren || nodeMatchesFilter;
		
		if (filter) {
			// set row visibility
			if (visible) {
				//show row
				rowDiv.classList.remove("outlineRowHidden"); //$NON-NLS-0$
			} else {
				//hide
				rowDiv.classList.add("outlineRowHidden"); //$NON-NLS-0$
			}
			// set visual indicator for matching rows
			if (nodeMatchesFilter) {
				rowDiv.classList.add("outlineRowMatchesFilter"); //$NON-NLS-0$
			} else {
				rowDiv.classList.remove("outlineRowMatchesFilter"); //$NON-NLS-0$
			}	
			
			// set node's keyboard traversal selectability
			navHandler.setIsNotSelectable(node, !nodeMatchesFilter);
		} else {
			rowDiv.classList.remove("outlineRowHidden"); //$NON-NLS-0$ //show row
			rowDiv.classList.remove("outlineRowMatchesFilter"); //$NON-NLS-0$ //remove filter match decoration
			navHandler.setIsNotSelectable(node, false); // make node keyboard traversable
		}	
	
		return visible;
	};
	
	/**
	 * This function should be called after the user triggers an outline
	 * node expansion in order to filter the node's children.
	 * 
	 * @param {String} nodeId The id of the node that was expanded
	 */
	OutlineExplorer.prototype.postUserExpand = function (nodeId) {
		if (this._currentModifiedFilter) {
			var node = this.getNavDict().getValue(nodeId).model;
			this._expandRecursively(node);
			this._filterRecursively(node, this._currentModifiedFilter);
		}
 	};
 	
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
		var originalId = item.label.replace(/[\\\/\.\:\-\_\s]/g, "");
		var id = originalId;
		var number = 0;
		// We might have duplicate id's if the outline items are duplicated, or if we happen to have another dom id using
		// this name.  Check for this case and use a timestamp in lieu of the generated id.
		while ((this.idItemMap[id] && this.idItemMap[id]!== item) ||
			lib.node(id)) {// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=389760
			id = originalId + "[" + number + "]";
			number = number + 1;
		}
		
		this.idItemMap[id] = item; //store the item
		item.outlinerId = id;		// cache the id
			
		return id;
	};
	
	OutlineModel.prototype.getIdItemMap = function(){
		return this.idItemMap;
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
	 * @param {Element} options.toolbar The DOM element to render toolbar commands in.
	 * @param {orion.serviceRegistry.ServiceRegistry} options.serviceRegistry The service registry.
	 * @param {orion.commands.CommandService} options.commandService
	 * @param {Service of type orion.outliner.OutlineService} options.outlineService The outline service to use.
	 * @param {orion.InputManager} [options.inputManager] the editor input manager
	 * @param {orion.selection.Selection} [options.inputManager.selection] If provided, the 
	 * selection service will be notified on outline selection rather than using anchor tag hrefs.
	 * @param {orion.sidebar.Sidebar} Parent sidebar
	 */
	function Outliner(slideout, options) {
		mSlideout.SlideoutViewMode.call(this, slideout);
		this._init(options);
	}
	Outliner.prototype = Object.create(mSlideout.SlideoutViewMode.prototype);
	Outliner.prototype.constructor = Outliner;
	
	objects.mixin(Outliner.prototype, /** @lends orion.outliner.Outliner.prototype */ {
		_init: function(options) {
			this._commandIds = {};
			var toolbar = lib.node(options.toolbar);
			if (!options.outlineService) {throw new Error("no outline service"); } //$NON-NLS-0$
			
			this._wrapperNode = document.createElement("div"); //$NON-NLS-0$
			this._wrapperNode.classList.add("outlinerWrapper"); //$NON-NLS-0$
			
			this._createFilterInput();
			
			this._outlineNode = document.createElement("div"); //$NON-NLS-0$
			this._outlineNode.classList.add("outlineNodeWrapper"); //$NON-NLS-0$
			this._outlineNode.addEventListener("keydown", function(e){
				if (e.keyCode === lib.KEY.ESCAPE || e.keyCode === lib.KEY.ENTER) {
					if (this._slideout.getPreviousActiveElement()) {
						this.hide();
					}
				}
			}.bind(this), false);
			
			this._wrapperNode.appendChild(this._outlineNode);
			
			this._toolbar = toolbar;
			
			this._serviceRegistry = options.serviceRegistry;
			this._contentTypeRegistry = options.contentTypeRegistry;
			this._outlineService = options.outlineService;
			this._commandService = options.commandService;
			this._inputManager = options.inputManager;
			this._sidebar = options.sidebar;
			this._switcherNode = options.switcherNode;
			
			var _self = this;

			this._inputManager.addEventListener("InputChanged", function(event) { //$NON-NLS-0$
				_self.setContentType(event.contentType, event.location);
				if (_self._editor !== event.editor) {
					if (_self._editor) {
						_self._editor.removeEventListener("InputChanged", _self._editorListener); //$NON-NLS-0$
					}
					_self._editor = event.editor;
					if (_self._editor) {
						_self._editor.addEventListener("InputChanged", _self._editorListener = _self.generateOutline.bind(_self)); //$NON-NLS-0$
					}
				}
			});

			Deferred.when(_self._outlineService, function(service) {
				service.addEventListener("outline", function(event) { //$NON-NLS-0$
					_self.providerId = event.providerId;
					_self._renderOutline(event.outline, event.title);
				});
			});
		},
		getWrapperNode: function() {
			return this._wrapperNode;
		},	
		/** Invokes the outline service to produce an outline */
		generateOutline: function() {
			if (!this._isActive()) {
				return;
			}
			
			this._filterInput.value = ""; //$NON-NLS-0$
			lib.empty(this._outlineNode);
			
			// display spinner while outline is being calculated
			var spinner = document.createElement("span"); //$NON-NLS-0$
			spinner.classList.add("modelDecorationSprite"); //$NON-NLS-0$
			spinner.classList.add("core-sprite-progress"); //$NON-NLS-0$
			this._outlineNode.appendChild(spinner);
			
			if (this._outlineTimeout) {
				window.clearTimeout(this._outlineTimeout);
			}
			this._outlineTimeout = window.setTimeout(function() {
				lib.empty(this._outlineNode);
				var span = document.createElement("span"); //$NON-NLS-0$
				span.appendChild(document.createTextNode(messages["outlineTimeout"])); //$NON-NLS-0$
				span.classList.add("outlineTimeoutSpan"); //$NON-NLS-0$
				this._outlineNode.appendChild(span);
			}.bind(this), OUTLINE_TIMEOUT_MS);
			
			// Bail we're in the process of looking up capable providers
			if (this._providerLookup) {
				return;
			}
			this._outlineService.emitOutline(this._inputManager);
		},
		setSelectedProvider: function(/** orion.serviceregistry.ServiceReference */ provider) {
			this.providerId = provider.getProperty("id"); //$NON-NLS-0$
			this.providerName = provider.getProperty("name"); //$NON-NLS-0$
			this._outlineService.setProvider(provider);
		},
		setOutlineProviders: function(providers) {
			var oldProviders = this.outlineProviders;
			var isActive = this._isActive();
			this.outlineProviders = providers;
			this._updateViewModes(oldProviders, this.outlineProviders);
			if (isActive) {
				this._selectNewProvider();
			}
		},
		_renderOutline: function(outlineModel, title) {
			if (this._outlineTimeout) {
				window.clearTimeout(this._outlineTimeout);
				this._outlineTimeout = null;
			}
			lib.empty(this._outlineNode);
			if (outlineModel) {
				outlineModel = outlineModel instanceof Array ? outlineModel : [outlineModel];
				var treeModel = new OutlineModel(outlineModel);
				if (this.explorer) {
					this.explorer.destroy();
				}
				this.explorer = new OutlineExplorer(this._serviceRegistry, this._inputManager, title);
				this.explorer.createTree(this._outlineNode, treeModel, {selectionPolicy: "cursorOnly", setFocus: false}); //$NON-NLS-1$ //$NON-NLS-0$
				treeModel.doExpansions(this.explorer.myTree);
			}
		},
		_selectNewProvider: function() {
			var newProviders = this.outlineProviders;
			// If the currently selected provider is not among the new set of providers, pick another one
			var isStaleProvider = newProviders.every(function(provider) {
				return this.providerId !== provider.getProperty("id"); //$NON-NLS-0$
			}.bind(this));
			if (isStaleProvider) {
				var next = newProviders[0];
				if (next) {
					this.createViewMode(next);
				}
			}
		},
		/** @returns {String} view mode id for the outline provider */
		_viewModeId: function(provider) {
			return "outline." + provider.getProperty("id"); //$NON-NLS-1$ //$NON-NLS-0$
		},
		/**
		 * @param {orion.serviceregistry.ServiceReference[]} oldProviders
		 * @param {orion.serviceregistry.ServiceReference[]} newProviders
		 */
		_updateViewModes: function(oldProviders, newProviders) {
			if (oldProviders) {
				oldProviders.forEach(function(provider) {
					var commandId = this._viewModeId(provider);
					this._commandService.unregisterCommandContribution(this._switcherNode.id, commandId, "orion.menuBarViewGroup/orion.slideoutMenuGroup"); //$NON-NLS-0$
				}, this);
			}

			if (newProviders) {
				var keyBindingSet = false;
				newProviders.forEach(function(provider) {
					if (provider) {
						var commandId = this._viewModeId(provider);
						var openOutlineCommand = new mCommands.Command({
							name: provider.displayName || provider.getProperty("name"), //$NON-NLS-0$
							id: commandId, //$NON-NLS-0$
							callback: this._openOutlineCallback.bind(this, provider)
						});
						this._commandService.addCommand(openOutlineCommand);
						var keyBinding = null;
						if (!keyBindingSet) {
							keyBinding = new KeyBinding.KeyBinding("o", true); //$NON-NLS-0$
							keyBindingSet = true;
						}
						this._commandService.registerCommandContribution(this._switcherNode.id, commandId, 1, "orion.menuBarViewGroup/orion.slideoutMenuGroup", false, keyBinding); //$NON-NLS-0$
					}
				}, this);
			}
			
			this._sidebar.renderViewModeMenu();
		},
		_openOutlineCallback: function(provider) {
			if (this._isActive(provider)) {
				if (document.activeElement === this._filterInput) {
					this._slideout.hide(); // hide the slideout if the user triggers the command again while in the filter
				} else {
					this._filterInput.select(); // select the filter if the user triggers the command while another element has focus
				}
			} else {
				// open the outliner with the specified provider
				var mainSplitter = mGlobalCommands.getMainSplitter();
				if (mainSplitter.splitter.isClosed()) {
					mainSplitter.splitter.toggleSidePanel();
				}
				this.createViewMode(provider);
				this._filterInput.select();
			}
		},
		/**
		 * Returns a boolean indicating whether the outliner is visible.
		 * @param {orion.serviceregistry.ServiceReference} provider Optional. If specified this function will only return true
		 * 															if the currently selected provider matches the one passed in.
		 * @return true if the outliner is visible, false otherwise 
		 */
		_isActive: function(provider) {
			var isActive = this._slideout.isVisible() && (this === this._slideout.getCurrentViewMode());
			if (isActive && provider) {
				isActive = (provider.getProperty("id") === this.providerId); //$NON-NLS-0$
				if (isActive) {
					isActive = (provider.getProperty("name") === this.providerName); //$NON-NLS-0$
				}
			}
			return isActive;
		},
		createViewMode: function(provider) {
			this.setSelectedProvider(provider);
			this.show();
			this.generateOutline();
		},
		_createFilterInput: function() {
			var label = document.createElement("label"); //$NON-NLS-0$
			label.textContent = messages["Filter outline:"];
			label.classList.add("outlineFilterLabel"); //$NON-NLS-0$
			label.setAttribute("for", "filterText"); //$NON-NLS-0$

			var input = document.createElement("input"); //$NON-NLS-0$
			input.id = "filterText"; //$NON-NLS-0$
			input.classList.add("outlineFilter"); //$NON-NLS-0$
			input.placeholder = messages["Filter"]; //$NON-NLS-0$
			input.type="text"; //$NON-NLS-0$
			input.addEventListener("input", function (e) { //$NON-NLS-0$
				if (this._filterInputTimeout) {
					window.clearTimeout(this._filterInputTimeout);
				}
				var that = this;
				this._filterInputTimeout = window.setTimeout(function(){
					if (that.explorer) {
						that.explorer.filterChanged(input.value);
					}
					that._filterInputTimeout = null;
				}, 200);
			}.bind(this));
		
			input.addEventListener("keydown", function (e) { //$NON-NLS-0$
				var navHandler = null;
				var nodes = null;
				if (e.keyCode === lib.KEY.DOWN)	{
					navHandler = this.explorer.getNavHandler();
					nodes = navHandler.getTopLevelNodes();
					if (nodes){
						input.blur();
						navHandler.focus();
						navHandler.cursorOn(nodes[0], false, true);
						if (nodes[0].isNotSelectable) {
							navHandler.iterate(true, false, false, true);
						}
					}
					//prevent the browser's default behavior of automatically scrolling 
					//the outline view down because the DOWN key was pressed
					if (e.preventDefault) {
						e.preventDefault();	
					}
				} else if (e.keyCode === lib.KEY.ESCAPE) {
					if (this._slideout.getPreviousActiveElement()) {
						if (this._slideout.getPreviousActiveElement() === input) {
							input.blur();
						} else {
							this._slideout.getPreviousActiveElement().focus();
						}
						this.hide();
					}
				} else if (e.keyCode === lib.KEY.ENTER) {
					navHandler = this.explorer.getNavHandler();
					nodes = navHandler.getTopLevelNodes();
					if (nodes){
						input.blur();
						navHandler.focus();
						navHandler.cursorOn(nodes[0], false, true);
						if (nodes[0].isNotSelectable) {
							navHandler.iterate(true, false, false, true);
						}
					}
				}
			}.bind(this), false);
			
			this._wrapperNode.appendChild(label);
			this._wrapperNode.appendChild(input);
			this._filterInput = input;
		},
		
		/**
		 * Called when the inputManager's contentType has changed, so we need to look up the capable outline providers.
		 * @param {String} fileContentType
		 * @param {String} title TODO this is deprecated, should be removed along with "pattern" property of outliners.
		 */
		setContentType: function(fileContentType, title) {
			var allOutlineProviders = this._serviceRegistry.getServiceReferences("orion.edit.outliner"); //$NON-NLS-0$
			var _self = this;
			// Filter to capable providers
			var filteredProviders = this.filteredProviders = allOutlineProviders.filter(function(serviceReference) {
				var contentTypeIds = serviceReference.getProperty("contentType"), //$NON-NLS-0$
				    pattern = serviceReference.getProperty("pattern"); // for backwards compatibility //$NON-NLS-0$
				if (contentTypeIds) {
					return contentTypeIds.some(function(contentTypeId) {
						return _self._contentTypeRegistry.isExtensionOf(fileContentType, contentTypeId);
					});
				} else if (pattern && new RegExp(pattern).test(title)) {
					return true;
				}
				return false;
			});
			// Load resource bundles
			this._providerLookup = true;
			filteredProviders.forEach(function(provider) {
				provider.displayName = provider.getProperty("name") || provider.getProperty("nameKey"); //$NON-NLS-0$
			});
			
			_self._providerLookup = false;
			_self._outlineService.setOutlineProviders(filteredProviders);
			_self.setOutlineProviders(filteredProviders);
			_self.generateOutline();
		
		}
	});
	
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
		this._provider = new Deferred();
		this._providerResolved = false;

		this.filteredProviders = [];
		//this.setOutlineProviders(this.filteredProviders);
	}
	OutlineService.prototype = /** @lends orion.outliner.OutlineService.prototype */ {
		setOutlineProviders: function(/** orion.serviceregistry.ServiceReference[] */ providers) {
			this.providers = providers;
			// Check pref to see if user has chosen a preferred outline provider
			var self = this;
			this._preferences.get("/edit/outline").then(function(pref) { //$NON-NLS-1$
				var provider;
				for (var i=0; i < providers.length; i++) {
					provider = providers[i];
					if (pref["outlineProvider"] === providers[i].getProperty("id")) { //$NON-NLS-1$ //$NON-NLS-0$
						break;
					}
				}
				if (provider) {
					self.setProvider(provider);
				}
			});
		},
		setProvider: function(/** orion.serviceregistry.ServiceReference */ provider) {
			if (this._providerResolved) {
				this._provider = new Deferred();
			}
			this._provider.resolve(provider);
			this._providerResolved = true;
			var id = provider.getProperty("id"); //$NON-NLS-0$
			if (id) {
				this._preferences.put("/edit/outline", {outlineProvider: id}); //$NON-NLS-1$
			}
		},

		getProvider: function() {
			return this._provider.promise;
		},
		emitOutline: function(inputManager) {
			var self = this;
			Deferred.when(this.getProvider(), function(provider) {
				var editor = inputManager.getEditor();
				if (!editor) {
					self.dispatchEvent({ type:"outline", outline: null}); //$NON-NLS-0$
					return;
				}
				var title = editor.getTitle();
				var serviceRegistry = self._serviceRegistry;
				var progress = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
				var outlineProviderService = serviceRegistry.getService(provider);
				var method, args;
				if ((method = outlineProviderService.computeOutline)) {
					var contentType = inputManager.getContentType();
					args = [editor.getEditorContext(), {
						contentType: contentType && contentType.id
					}];
				} else if ((method = outlineProviderService.getOutline)) {
					args = [editor.getText(), title];
				}
				progress.progress(method.apply(outlineProviderService, args), i18nUtil.formatMessage(messages["OutlineProgress"], title, provider.displayName)).then(function(outline) { //$NON-NLS-0$
					if (outline) {
						self.dispatchEvent({ type:"outline", outline: outline, title: title, providerId: provider.getProperty("id") }); //$NON-NLS-1$ //$NON-NLS-0$
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

