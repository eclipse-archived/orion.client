/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets orion  window console define localStorage*/
/*jslint browser:true*/

/* This SettingsContainer widget is a dojo border container with a left and right side. The left is for choosing a 
   category, the right shows the resulting HTML for that category. */

define(['require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/PageUtil', 'dijit/TooltipDialog', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/plugin/PluginList', 'orion/widgets/settings/InputBuilder'], function(require, dojo, dijit, mUtil, mCommands, PageUtil) {

	dojo.declare("orion.widgets.settings.SplitSelectionLayout", [dijit._Widget, dijit._Templated], {

		widgetsInTemplate: true,

		templateString: '<div style="height:100%;">' + 
							'<div data-dojo-type="dijit.layout.BorderContainer" style="height:100%;" data-dojo-props="design:\'heading\', gutters:false, liveSplitters:false">' + 
								'<div class="auxpane" id="categories" data-dojo-type="dijit.layout.ContentPane" data-dojo-props="region:\'leading\', splitter:false"  style="width: 150px;">' + 
									'<div id="categoryNode">' + '<h1 id="content-title">Categories</h1>' + 
										'<ul class="navbar" data-dojo-attach-point="navbar" role="tablist" aria-labelledby="content-title"></ul>' + 
									'</div>' + 
								'</div>' +
								'<div data-dojo-type="dijit.layout.ContentPane" class="mainpane"  data-dojo-props="region:\'center\'">' + 
									'<div data-dojo-attach-point="mainNode" class="settings" role="tabpanel">' + 
									'<div data-dojo-attach-point="table" class="displayTable">' + 
								'</div>' + 
							'</div>' + 
						'</div>',

		itemToIndexMap: null,

		constructor: function() {
			this.toolbar = dojo.byId( this.pageActions );
		},

		postCreate: function() {
			this.itemToIndexMap = {};
			this.manageDefaultData(this.initialSettings);
			this.drawUserInterface(this.initialSettings);
			dojo.subscribe("/dojo/hashchange", this, "processHash");
		},

		// The knowledge that "pageActions" is the toolbar is something only "page glue" code should know.
		// We don't like widgets, etc. knowing this detail.

		updateToolbar: function(id) {
			// right now we only have tools for "plugins" category and the widget is handling those.
			// So our only job here is to empty the toolbar of any previous contributions.  
			// In the future, we might also want to ask each "category" to render its toolbar commands, and the plugin
			// category would know that the widget would handle this.
			if (this.toolbar) {
				dojo.empty(this.toolbar);
			}
		},

		displaySettings: function(id) {
			var settingsIndex = this.itemToIndexMap[id];

			dojo.empty(this.table);

			var category = this.initialSettings[settingsIndex].category;

			dojo.create("h1", {
				id: category,
				innerHTML: category
			}, this.table);

			// Extend here for adding section pages of your choice
		},


		addCategory: function(item, index) {
			dojo.create("li", item, this.navbar);
			this.itemToIndexMap[item.id] = index;
		},


		selectCategory: function(id) {

			if (this.selectedCategory) {
				dojo.removeClass(this.selectedCategory, "navbar-item-selected");
				dojo.attr(this.selectedCategory, "aria-selected", "false");
				this.selectedCategory.tabIndex = -1;
			}

			this.selectedCategory = dojo.byId(id);
			dojo.addClass(this.selectedCategory, "navbar-item-selected");
			dojo.attr(this.selectedCategory, "aria-selected", "true");
			dojo.attr(this.mainNode, "aria-labelledby", id);
			this.selectedCategory.tabIndex = 0;
			this.selectedCategory.focus();
			this.updateToolbar(id);
			this.displaySettings(id);
		},
		
		
		drawUserInterface: function(settings) {

			for (var count = 0; count < settings.length; count++) {
				var itemId = settings[count].category.replace(/\s/g, "").toLowerCase();
				var item = {
					innerHTML: settings[count].category,
					id: itemId,
					"class": 'navbar-item',
					role: "tab",
					tabindex: -1,
					"aria-selected": "false",
					onclick: dojo.hitch( this, "selectCategory", itemId )
				};

				this.addCategory(item, count);
			}
			
			var that = this;
			dojo.connect(this.navbar, "onkeypress", function(evt) {
				if (evt.keyCode === dojo.keys.LEFT_ARROW || evt.keyCode === dojo.keys.UP_ARROW) {
					if (that.selectedCategory.previousSibling) {
						var click = document.createEvent("MouseEvents");
						click.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
						that.selectedCategory.previousSibling.dispatchEvent(click);
					}
				} else if (evt.keyCode === dojo.keys.RIGHT_ARROW || evt.keyCode === dojo.keys.DOWN_ARROW) {
					if (that.selectedCategory.nextSibling) {
						var click = document.createEvent("MouseEvents");
						click.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
						that.selectedCategory.nextSibling.dispatchEvent(click);
					}
				}
			});
		}
	});
});

