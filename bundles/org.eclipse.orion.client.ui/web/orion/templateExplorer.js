
/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define document window */
/*jslint sub:true browser:true*/
define([
	'i18n!orion/nls/messages',
	'orion/Deferred',
	'orion/webui/littlelib',
	'orion/explorers/explorer',
	'orion/commands',
	'orion/keyBinding',
	'orion/globalCommands'
], function(messages, Deferred, lib, mExplorer, mCommands, KeyBinding, mGlobalCommands) {

	function TemplateRenderer (options, explorer, title, selectionService, inputManager) {
		this.explorer = explorer;
		this._init(options);
		this.title = title;
		this.selectionService = selectionService;
		this.inputManager = inputManager;
	}
	
	function insertTemplate(templateProposal, editor){
		var contentAssist = editor.getContentAssist();
		var offset = editor.getCaretOffset();
		var sel = editor.getSelection();
		var selectionStart = Math.min(sel.start, sel.end);			
		contentAssist._initialCaretOffset = Math.min(offset, selectionStart);
		contentAssist.apply(templateProposal);
		editor.focus();
	}
	
	// Toggles explorer CSS classes
	function snippetToggle (node) {
		if(node.className.match('templateExplorerItemShown')) { //$NON-NLS-0$
			node.classList.remove('templateExplorerItemShown'); //$NON-NLS-0$
			node.classList.add('templateExplorerItemHidden'); //$NON-NLS-0$
		}
		else {
			node.classList.remove('templateExplorerItemHidden'); //$NON-NLS-0$
			node.classList.add('templateExplorerItemShown'); //$NON-NLS-0$
		}
	}
	
	TemplateRenderer.prototype = new mExplorer.SelectionRenderer();
	TemplateRenderer.prototype.constructor = TemplateRenderer;
	TemplateRenderer.prototype.getLabelColumnIndex = function() {
		return 0;
	};
	
	TemplateRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		var _self = this;
		if (!item) {
			return;
		}
		
		var elementNode = document.createElement("span"); //$NON-NLS-0$
		var expandNode = document.createElement("span"); //$NON-NLS-0$
		var contentsNode = document.createElement("span"); //$NON-NLS-0$
 		tableRow.appendChild(elementNode);
		elementNode.appendChild(expandNode);
		elementNode.appendChild(contentsNode);
		
		/*------------------------------------------------------------*/
		elementNode.onmouseover = function() { elementNode.style.color = 'whitesmoke';elementNode.parentNode.style.backgroundColor = "darksalmon";}; //$NON-NLS-0$
		elementNode.onmouseout = function() { elementNode.style.color = "#222";elementNode.parentNode.style.backgroundColor = "";}; //$NON-NLS-0$
		elementNode.style.padding = '1px'; //$NON-NLS-0$
		
		function htmlEscape(str) {
			return String(str)
					.replace(/&/g, '&amp;') //$NON-NLS-0$
					.replace(/"/g, '&quot;') //$NON-NLS-0$
					.replace(/'/g, '&#39;') //$NON-NLS-0$
					.replace(/</g, '&lt;') //$NON-NLS-0$
					.replace(/>/g, '&gt;'); //$NON-NLS-0$
		}
		
		if (!(item.children)) {
			var previewNode = document.createElement("div"); //$NON-NLS-0$
			var escapedString = htmlEscape(item.template.template);
			previewNode.innerHTML = "<pre draggable='true'>"+ escapedString +"</pre>"; //$NON-NLS-1$ //$NON-NLS-0$
			previewNode.classList.add('templateExplorerItemHidden'); //$NON-NLS-0$
			elementNode.appendChild(previewNode);
			elementNode.parentNode.onmouseover = function() { elementNode.style.color = 'whitesmoke';elementNode.parentNode.style.backgroundColor = "darksalmon";}; //$NON-NLS-1$ //$NON-NLS-0$
			elementNode.parentNode.onmouseout = function() {
				elementNode.style.color = "#222";  //$NON-NLS-0$
				if(previewNode.className.match('templateExplorerItemShown')) { //$NON-NLS-0$
					elementNode.parentNode.style.backgroundColor = "gray";} //$NON-NLS-0$
				else{elementNode.parentNode.style.backgroundColor = "";} //$NON-NLS-0$
			};
			elementNode.parentNode.onclick = function() {snippetToggle(previewNode);elementNode.style.color = "whitesmoke";}; //$NON-NLS-0$
			previewNode.onclick = function(event) {
				event.cancelBubble=true;
				var editor = _self.inputManager.getEditor();
				var offset = editor.getCaretOffset();
				var proposal = item.template.getProposal("",offset,{});
				insertTemplate(proposal, editor);
			};
		}
		/*------------------------------------------------------------*/
		
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
 		
 		contentsNode.appendChild(linkContents); //$NON-NLS-0$
 	};
	
	//This is an optional function for explorerNavHandler. It performs an action when Enter is pressed on a table row.
	//The explorerNavHandler hooked up by the explorer will check if this function exists and call it on Enter key press.
	TemplateRenderer.prototype.performRowAction = function(event, item) {
		// Invoke templates here?
	};
	
	function TemplateExplorerWidget(serviceRegistry, selection, title, inputManager) {
		/*	we intentionally do not do this:
				this.selection = selection;
			Our renderer is going to trigger the selection events using specialized URL's when a template explorer
			link is clicked.  We don't want the explorer triggering selection events on the template explorer model item
		*/
		this.registry = serviceRegistry;
		this.renderer = new TemplateRenderer({checkbox: false, treeTableClass: "templateExplorer"}, this, title, selection, inputManager);  //$NON-NLS-0$ 
	}
	TemplateExplorerWidget.prototype = new mExplorer.Explorer();	
	TemplateExplorerWidget.prototype.constructor = TemplateExplorerWidget;
	
	TemplateExplorerWidget.prototype.filterChanged = function (filter) {
		var navHandler = this.getNavHandler();
		var modifiedFilter = null;
		
		if (filter) {
			var filterFlags = "i"; // case insensitive by default //$NON-NLS-0$
			modifiedFilter = filter.replace(/([.+^=!:${}()|\[\]\/\\])/g, "\\$1"); //add start of line character and escape all special characters except * and ? //$NON-NLS-0$
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
	
	TemplateExplorerWidget.prototype._filterRecursively = function (node, filter) {
		var navHandler = this.getNavHandler();
		var self = this;
		var rowDiv = navHandler.getRowDiv(node);
		// true if the filter is null or if the node's label matches it
		var nodeMatchesFilter = (-1 !== node.label.search(filter));
		
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
	 * This function should be called after the user triggers a template explorer
	 * node expansion in order to filter the node's children.
	 * 
	 * @param {String} nodeId The id of the node that was expanded
	 */
	TemplateExplorerWidget.prototype.postUserExpand = function (nodeId) {
		if (this._currentModifiedFilter) {
			var node = this.getNavDict().getValue(nodeId).model;
			this._expandRecursively(node);
			this._filterRecursively(node, this._currentModifiedFilter);
		}
 	};
 	
	function TemplateExplorerModel(items, rootId) {
		this.items = items;
		this.root = {children: items};
		this.root.templateExplorerId = rootId;
		this.idItemMap = {};
	}
	TemplateExplorerModel.prototype.constructor = TemplateExplorerModel;
	
	TemplateExplorerModel.prototype.getRoot = function(onItem){
		onItem(this.root);
	};
	
	TemplateExplorerModel.prototype.destroy = function() {
	};
	
	TemplateExplorerModel.prototype.getId = function(/* item */ item){
		// Do we have a cached id?
		if (item.templateExplorerId) {
			return item.templateExplorerId;
		}
		// Generate an id.  Since these id's are used in the DOM, we strip out characters that shouldn't be in a DOM id.
		var originalId = item.label.replace(/[\\\/\.\:\-\_\s]/g, ""); //$NON-NLS-0$
		var id = originalId;
		var number = 0;
		// We might have duplicate id's if the template explorer items are duplicated, or if we happen to have another dom id using
		// this name.  Check for this case and use a timestamp in lieu of the generated id.
		while ((this.idItemMap[id] && this.idItemMap[id]!== item) ||
			lib.node(id)) {// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=389760
			id = originalId + "[" + number + "]"; //$NON-NLS-1$ //$NON-NLS-0$
			number = number + 1;
		}
		
		this.idItemMap[id] = item; //store the item
		item.templateExplorerId = id;		// cache the id
			
		return id;
	};
	
	TemplateExplorerModel.prototype.getIdItemMap = function(){
		return this.idItemMap;
	};
		
	TemplateExplorerModel.prototype.getChildren = function(parentItem, /* function(items) */ onComplete){
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
	
	TemplateExplorerModel.prototype.doExpansions = function(tree) {
		// for now, just expand the first level of the model
		// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=389547
		for (var i=0; i < this.root.children.length; i++) {
			if (this.root.children[i].children) {
				tree.expand(this.root.children[i]);
			}
		}
	};


	/**
	 * Constructs a new TemplateExplorer with the given options.
	 * @name orion.templates.TemplateExplorer
	 * @class An TemplateExplorer is a visual component that renders an itemized overview of a resource and acts as 
	 * a selection provider on that resource. The itemized overview is obtained from the {@link orion.templates.TemplateExplorerService}.
	 * @param {Object} options The options object
	 * @param {Element} options.parent The parent DOM element to put this template explorer inside.
	 * @param {Element} options.toolbar The DOM element to render toolbar commands in.
	 * @param {orion.serviceRegistry.ServiceRegistry} options.serviceRegistry The service registry.
	 * @param {orion.commands.CommandService} options.commandService
	 * @param {Service of type orion.templates.TemplateExplorerService} options.templateExplorerService The template explorer service to use.
	 * @param {orion.selection.Selection} [options.selectionService] If provided, the 
	 * selection service will be notified on template explorer selection rather than using anchor tag hrefs.
	 * @param {orion.sidebar.Sidebar} Parent sidebar
	 */
	function TemplateExplorer(options) {
		this._init(options);
	}
	TemplateExplorer.prototype = /** @lends orion.templates.TemplateExplorer.prototype */ {
		id: "templateExplorer", //$NON-NLS-0$
		_init: function(options) {
			var parent = lib.node(options.parent), toolbar = lib.node(options.toolbar);
			if (!parent) { throw new Error("no parent"); } //$NON-NLS-0$
			if (!options.templateCollector) {throw new Error("no template collector"); } //$NON-NLS-0$
			this._parent = parent;
			this._toolbar = toolbar;
			this._serviceRegistry = options.serviceRegistry;
			this._contentTypeRegistry = options.contentTypeRegistry;
			this._templateCollector = options.templateCollector;
			this._commandService = options.commandService;
			this._selectionService = options.selectionService;
			this._inputManager = options.inputManager;
			this._sidebar = options.sidebar;
			var _self = this;
			_self._sidebar.addViewMode(this.id, {
				label: messages['TemplateExplorerLabel'],
				create: _self.createViewMode.bind(_self),
				destroy: _self.destroyViewMode.bind(_self)
			});
			this._inputManager.addEventListener("InputChanged", function() { //$NON-NLS-0$
				_self.generateTemplateExplorer();
			});
		},
		/** Produce a templateExplorer */
		generateTemplateExplorer: function() {
			var _self = this;
			var sidebar = this._sidebar;
			var openTemplateExplorerCommand = new mCommands.Command({
				name: messages['OpenTemplateExplorer'],
				id: "orion.openTemplateExplorer", //$NON-NLS-0$
				callback: function () {
					var mainSplitter = mGlobalCommands.getMainSplitter();
					if (mainSplitter.splitter.isClosed()) {
						mainSplitter.splitter.toggleSidePanel();
					}
					if (sidebar.getActiveViewModeId() !== _self.id) {
						sidebar.setViewMode(_self.id);
					}
					if (_self._filterInput) {
						_self._previousActiveElement = document.activeElement;
						_self._filterInput.select();
					}
				}
			});
			this._commandService.addCommand(openTemplateExplorerCommand);
			this._commandService.registerCommandContribution(this._toolbar.id, "orion.openTemplateExplorer", 1, null, true, new KeyBinding.KeyBinding("O", true, false, true, false)); //$NON-NLS-1$ //$NON-NLS-0$
			this._commandService.renderCommands(this._toolbar.id, this._toolbar, {}, {}, "tool"); //$NON-NLS-0$
			
			if (!this._isActive()) {
				return;
			}
			this.emitTemplateExplorer();
		},
		_renderTemplateExplorer: function(templateExplorerModel, title) {
			var contentNode = this._parent;
			lib.empty(contentNode);
			templateExplorerModel = templateExplorerModel instanceof Array ? templateExplorerModel : [templateExplorerModel];
			if (templateExplorerModel) {
				var treeModel = new TemplateExplorerModel(templateExplorerModel);
				this.explorer = new TemplateExplorerWidget(this._serviceRegistry, this._selectionService, title, this._inputManager);
				this.explorer.createTree(contentNode, treeModel, {selectionPolicy: "cursorOnly", setFocus: false}); //$NON-NLS-1$ //$NON-NLS-0$
				treeModel.doExpansions(this.explorer.myTree);
			}
		},
		_isActive: function() {
			var viewModeId = this._sidebar.getActiveViewModeId();
			if (!viewModeId) {
				return false;
			}
			return viewModeId === this.id;
		},
		createViewMode: function(provider) {
			this._createFilterInput();
			this.generateTemplateExplorer();
		},
		destroyViewMode: function(provider) {
			if (this.explorer) {
				this.explorer.destroy();
				this.explorer = null;
			}
		},
		
		_createFilterInput: function() {
			var input = document.createElement("input"); //$NON-NLS-0$
		
			input.classList.add("outlineFilter"); //$NON-NLS-0$
			input.placeholder = messages["Filter"]; //$NON-NLS-0$
			input.type="text"; //$NON-NLS-0$
			input.addEventListener("input", function () { //$NON-NLS-0$
				if (this._filterInputTimeout) {
					window.clearTimeout(this._filterInputTimeout);
				}
				var that = this;
				this._filterInputTimeout = window.setTimeout(function(){
					that.explorer.filterChanged(input.value);
					that._filterInputTimeout = null;
				}, 200);
			}.bind(this));
		
			input.addEventListener("keydown", function (e) { //$NON-NLS-0$
				var navHandler = null;
				var firstNode = null;
				if (e.keyCode === lib.KEY.DOWN)	{
					input.blur();
					navHandler = this.explorer.getNavHandler();
					navHandler.focus();
					if (navHandler.getTopLevelNodes()) {
						firstNode = navHandler.getTopLevelNodes()[0];
						navHandler.cursorOn(firstNode, false, true);
						if (firstNode.isNotSelectable) {
							navHandler.iterate(true, false, false, true);
						}
					}
					
					//prevent the browser's default behavior of automatically scrolling 
					//the template explorer view down because the DOWN key was pressed
					if (e.preventDefault) {
						e.preventDefault();	
					}
				} else if (e.keyCode === lib.KEY.ESCAPE) {
					if (this._previousActiveElement) {
						this._previousActiveElement.focus();
					}
				}
			}.bind(this), false);
			
			this._toolbar.appendChild(input);
			this._filterInput = input;
		},
		
		emitTemplateExplorer: function() {
			this.computeTemplateExplorer().then(this._renderTemplateExplorer.bind(this));
		},
		
		computeTemplateExplorer : function() {
			var promisedTemplates = this._templateCollector.getTemplates();
			return promisedTemplates.then(function(templates) {
				var templateItems = [];
				templates.forEach(function(template){
					var pre = template.prefix || 'Undefined'; //$NON-NLS-0$
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
		},
	};
	TemplateExplorer.prototype.constructor = TemplateExplorer;
	
	//return module exports
	return {
		TemplateExplorer: TemplateExplorer,
	};
});

