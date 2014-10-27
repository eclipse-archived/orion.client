/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
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
	'orion/webui/littlelib',
	'orion/section',
	'orion/problems/problemsExplorer',
	'orion/webui/Slideout'
], function(objects, lib, mSection, mProblemsExplorer, mSlideout) {
	var SlideoutViewMode = mSlideout.SlideoutViewMode;
	/** 
	 * Constructs a new ProblemView object.
	 * 
	 * @class 
	 * @name orion.BrowseView
	 */
	function ProblemsView(options, slideout) {
		if(slideout) {
			SlideoutViewMode.call(this, slideout);
		}
		var parentId = options.parentId ? options.parentId : "orion.PropertyPanel.container";
		this._parent = lib.node(parentId);
		this.serviceRegistry = options.serviceRegistry;
		this.commandRegistry = options.commandRegistry;
		this.fileClient = options.fileClient;
		this.contentTypeRegistry = options.contentTypeRegistry;
		this._init(slideout);
	}
	ProblemsView.prototype = Object.create(SlideoutViewMode.prototype);
	ProblemsView.prototype.constructor = ProblemsView;
	objects.mixin(ProblemsView.prototype, /** @lends orion.problems.problemsView.prototype */ {
		_init: function(slideout) {
			if(!this._inner_node){
				this._inner_node = document.createElement("div"); //$NON-NLS-0$
				this._inner_node.classList.add("problems_inner_container"); //$NON-NLS-0$
			}
			if(slideout) {
				this._slideout.getContentNode().appendChild(this._inner_node); // temporarily add wrapper node to DOM to get around Safari fussiness
			} else {
				lib.empty(this._parent);
				this._parent.appendChild(this._inner_node);
			}
			var explorerParentNode = document.createElement("div"); //$NON-NLS-0$
			explorerParentNode.id = "problemsExplorerParent_id"; //$NON-NLS-0$
			this._mainSection = new mSection.Section(this._inner_node, {id: "problemsViewSection_id", /*headerClass: ["sectionTreeTableHeader"],*/ title: "Problems", canHide: false});
			this._sectionContents = document.createElement("div"); //$NON-NLS-0$
			this._sectionContents.classList.add("problemsSectionWrapper"); 
			this._mainSection.setContent(this._sectionContents);
			this._problemsExplorer = new mProblemsExplorer.ProblemsExplorer({parentId: explorerParentNode.id, serviceRegistry: this.serviceRegistry, commandRegistry: this.commandRegistry, contentTypeRegistry: this.contentTypeRegistry, fileClient: this.fileClient});
			this._sectionContents.appendChild(explorerParentNode);
		},
		getWrapperNode: function() {
			return this._inner_node;
		},
		validate: function(location) {
			this._problemsExplorer.validate(location);
		}
	});
	return {ProblemsView: ProblemsView};
});
