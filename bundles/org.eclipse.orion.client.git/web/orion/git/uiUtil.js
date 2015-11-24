/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/

/**
 * This class extends orion/git/util to provide UI-related utility methods.
 */
define([
	'i18n!git/nls/gitmessages',
	'orion/webui/tooltip',
	'orion/compare/compareCommands',
	'orion/compare/resourceComparer',
	'orion/webui/littlelib',
	'orion/git/util'
], function(messages, Tooltip, mCompareCommands, mResourceComparer, lib, mGitUtil) {
	var exports = Object.create(mGitUtil); // extend util

	function createFilter(section, msg, callback) {
		var filterDiv = document.createElement("div"); //$NON-NLS-0$
		filterDiv.className = "gitFilterBox"; //$NON-NLS-0$
			
		var filter = document.createElement("input"); //$NON-NLS-0$
		filter.type = "search"; //$NON-NLS-1$
		filter.placeholder = msg;
		filter.setAttribute("aria-label", msg); //$NON-NLS-1$ 
		filterDiv.appendChild(filter);
		
		var createTooltip = function(button) {
			var tooltip = new Tooltip.Tooltip({
				node: button,
				text: msg,
				position: ["above", "below", "right", "left"] //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$
			});
			return tooltip;
		};
		
		var button = document.createElement("button"); //$NON-NLS-0$
		button.setAttribute("aria-label", messages["Filter"]); //$NON-NLS-1$
		button.className = "core-sprite-filter searchButton"; //$NON-NLS-0$
		var commandTooltip = createTooltip(button);
		filterDiv.appendChild(button);
			
		var doFilter = function() {
			callback(filter.value);
			if (filter.value) {
				button.classList.remove("core-sprite-filter"); //$NON-NLS-0$
				button.classList.add("core-sprite-show-filtered"); //$NON-NLS-0$
			} else {
				button.classList.remove("core-sprite-show-filtered"); //$NON-NLS-0$
				button.classList.add("core-sprite-filter"); //$NON-NLS-0$
			}
		};
		
		var clickFilter = function() {
			doFilter();
		};
		button.addEventListener("click", clickFilter); //$NON-NLS-0$
		
		var sectionContent = section.getContentElement();
		sectionContent.insertBefore(filterDiv, sectionContent.firstChild);
		
		var keyDownFilter  = function(e) {
			if (e.keyCode === 13) {
				doFilter();
			}
		};
		filter.addEventListener("keydown", keyDownFilter); //$NON-NLS-0$	
		
		return {
			filter: filter,
			button: button,
			commandTooltip: commandTooltip,
			clickFilter: clickFilter,
			keyDownFilter: keyDownFilter,
			
			destroy: function() {
				this.commandTooltip.destroy();
				this.button.removeEventListener("click", this.clickFilter);
				this.filter.removeEventListener("keydown", this.keyDownFilter);
			}
		};
	}
	exports.createFilter = createFilter;

	/**
	 * Create an embedded toggleable compare widget inside a given DIV.
	 * @param {Object} serviceRegistry The serviceRegistry.
	 * @param {Object} commandService The commandService.
	 * @param {String} resoure The URL string of the complex URL which will be resolved by a diff provider into two file URLs and the unified diff.
	 * @param {Boolean} hasConflicts The flag to indicate if the compare contains conflicts.
	 * @param {Object} parentDivId The DIV node or string id of the DIV that holds the compare widget.
	 * @param {String} commandSpanId The id of the DIV where all the commands of the compare view are rendered. "Open in compare page", "toggle", "navigate diff" commands will be rendered.
	 * @param {Boolean} editableInComparePage The flag to indicate if opening compage will be editable on the left side. Default is false. Optional.
	 * @param {Object} gridRenderer If all the commands have to be rendered as grids, especially inside a row of Orion explorer, this has to be provided. Optional.
	 * @param {String} compareTo Optional. If the resource parameter is a simple file URL then this can be used as the second file URI to compare with.
	 * @param {String} toggleCommandSpanId Optional. The id of the DIV where the "toggle" command will be rendered. If this parameter is defined, the "toggle" command will ONLY be rendered in this DIV.
	 */
	function createCompareWidget(serviceRegistry, commandService, resource, hasConflicts, parentDivId, commandSpanId, editableInComparePage, gridRenderer, compareTo, toggleCommandSpanId, 
								 preferencesService, saveCmdContainerId, saveCmdId, titleIds, containerModel, standAloneOptions) {
		var setCompareSelection = function(diffProvider, cmdProvider, ignoreWhitespace, type) {
				var comparerOptions = {
				toggleable: true,
				type: type, //$NON-NLS-0$ //From user preference
				ignoreWhitespace: ignoreWhitespace,//From user reference
				readonly: !saveCmdContainerId || !editableInComparePage,
				hasConflicts: hasConflicts,
				diffProvider: diffProvider,
				resource: resource,
				compareTo: compareTo,
				saveLeft: {	saveCmdContainerId: saveCmdContainerId, saveCmdId: saveCmdId, titleIds: titleIds},
				editableInComparePage: editableInComparePage,
				standAlone: (standAloneOptions ? true : false)
			};
			var viewOptions = {
				parentDivId: parentDivId,
				commandProvider: cmdProvider,
				highlighters: (standAloneOptions ? standAloneOptions.highlighters : null)
			};
			var comparer = new mResourceComparer.ResourceComparer(serviceRegistry, commandService, comparerOptions, viewOptions);
			if(containerModel) {
				containerModel.resourceComparer = comparer;
				containerModel.destroy = function() {
					this.resourceComparer.destroy();
				};
			}
			comparer.start().then(function(maxHeight) {
				var vH = 420;
				if (maxHeight < vH) {
					vH = maxHeight;
				}
				var diffContainer = lib.node(parentDivId);
				diffContainer.style.height = vH + "px"; //$NON-NLS-0$
			});
		};
		
		var diffProvider = new mResourceComparer.DefaultDiffProvider(serviceRegistry);
		var cmdProvider = new mCompareCommands.CompareCommandFactory({commandService: commandService, commandSpanId: commandSpanId, toggleCommandSpanId: toggleCommandSpanId, gridRenderer: gridRenderer});
		var ignoreWhitespace = false;
		var mode = "inline";  //$NON-NLS-0$
		if (preferencesService) {
			cmdProvider.addEventListener("compareConfigChanged", function(e) { //$NON-NLS-0$
				preferencesService.getPreferences("/git/compareSettings").then(function(prefs) {  //$NON-NLS-0$
					switch (e.name) {
						case "mode":  //$NON-NLS-0$
							prefs.put("mode", e.value);  //$NON-NLS-0$
						break;
						case "ignoreWhiteSpace":  //$NON-NLS-0$
							prefs.put("ignoreWhitespace", e.value);  //$NON-NLS-0$
						break;
					}
				});
			}.bind(this));
			preferencesService.getPreferences("/git/compareSettings").then(function(prefs) {  //$NON-NLS-0$
				ignoreWhitespace = prefs.get("ignoreWhitespace") || ignoreWhitespace; //$NON-NLS-0$
				mode =  prefs.get("mode") || mode; //$NON-NLS-0$
				setCompareSelection(diffProvider, cmdProvider, ignoreWhitespace, mode);
			});
		} else {
			setCompareSelection(diffProvider, cmdProvider, ignoreWhitespace, mode);
		}
	}
	
	//return module exports
	exports.createCompareWidget = createCompareWidget;
	return exports;
});
