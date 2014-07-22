/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define URL*/
/*jslint browser:true sub:true*/
define([
	'orion/objects',
	'orion/webui/littlelib',
	'text!orion/search/InlineSearchPane.html',
	'orion/searchClient',
	'orion/inlineSearchResultExplorer',
	'orion/globalSearch/advSearchOptRenderer'
], function(
	objects, lib, InlineSearchPaneTemplate, mSearchClient, InlineSearchResultExplorer, mAdvSearchOptRenderer
) {
	/**
	 * @param {DOMNode} options.parentNode
	 */
	function InlineSearchPane(options) {
		this._parentNode = options.parentNode;
		this._serviceRegistry = options.serviceRegistry;
		this._commandRegistry = options.commandRegistry;
		this._fileClient = options.fileClient;
		this._initialize();
	}

	objects.mixin(InlineSearchPane.prototype, /** @lends orion.search.InlineSearchPane.prototype */ {
		_initialize: function() {
			var range = document.createRange();
			range.selectNode(this._parentNode);
			var domNodeFragment = range.createContextualFragment(InlineSearchPaneTemplate);
			this._parentNode.appendChild(domNodeFragment);
			
			this._wrapperDiv = lib.$(".inlineSearchWrapperDiv", this._parentNode); //$NON-NLS-0$
			
			this._displayButton = lib.$(".inlineSearchButton", this._parentNode); //$NON-NLS-0$
			
			var focusOnTextInput = function(){
				this._searchOptRenderer.getSearchTextInputBox().focus();
			}.bind(this);
			
			this._displayButton.addEventListener("click", function(){ //$NON-NLS-0$
				if (this._wrapperDiv.classList.contains("isVisible")) { //$NON-NLS-0$
					// hide
					this._wrapperDiv.classList.remove("isVisible"); //$NON-NLS-0$
					this._displayButton.classList.remove("inlineSearchButtonActive"); //$NON-NLS-0$
				} else {
					// show
					this._wrapperDiv.classList.add("isVisible"); //$NON-NLS-0$
					this._displayButton.classList.add("inlineSearchButtonActive"); //$NON-NLS-0$
					window.setTimeout(focusOnTextInput, 100);
				}
			}.bind(this));
			
			this._searchOptWrapperDiv = lib.$(".searchOptWrapperDiv", this._wrapperDiv); //$NON-NLS-0$
			this._searchResultsWrapperDiv = lib.$(".searchResultsWrapperDiv", this._wrapperDiv); //$NON-NLS-0$
			
			this._searchResultsWrapperDiv.id = "inlineSearchResultsWrapper";

			var searcher = new mSearchClient.Searcher({serviceRegistry: this._serviceRegistry, commandService: this._commandRegistry, fileService: this._fileClient});
			this._searchOptRenderer = new mAdvSearchOptRenderer.AdvSearchOptRenderer(this._searchOptWrapperDiv, searcher, this._serviceRegistry);
			var searchResultsExplorer = new InlineSearchResultExplorer(this._serviceRegistry, this._commandRegistry);
			
			this._searchOptRenderer.setResultInfo(searchResultsExplorer, this._searchResultsWrapperDiv); //$NON-NLS-0$
		},
		
		isVisible: function() {
			return this._wrapperDiv.classList.contains("isVisible"); //$NON-NLS-0$
		}
	});

	return InlineSearchPane;
});
