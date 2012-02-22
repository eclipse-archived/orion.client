/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     Anton McConville (IBM Corporation) - initial API and implementation
 *
 *******************************************************************************/ 
/*global define dojo dijit orion window widgets localStorage*/
/*jslint browser:true devel:true*/

define(['require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/commands', 'orion/operationsClient', 'orion/fileClient', 'orion/PageUtil',
	        'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'orion/siteService', 'orion/siteUtils', 'orion/siteTree', 'orion/treetable', 
	        'dojo/parser', 'dojo/hash', 'dojo/date/locale', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/ServiceCarousel', 'orion/widgets/PluginList', 'dijit/form/Button', 'dijit/ColorPalette' ], 
			function(require, dojo, mBootstrap, mStatus, mCommands, mOperationsClient, mFileClient, PageUtil, mSearchClient, mDialogs, mGlobalCommands, mSiteService, mSiteUtils, mSiteTree, mTreeTable) {

	var preferencesStatusService;
	var preferencesCorePreferences;
	var preferenceDialogService;
	var settingsCore;
	var selectedCategory;   
	var itemToIndexMap = {};

	var commandService;
	var pluginWidget = null;
	
	/* initialSettings is the structure of the settings information that we're working with for now.
	   It is a json structure that describes the categories a setting falls in and the widgets
	   that need to be used for choosing the setting values. Each choice also points to a callback
	   function. We'll need to think about this some more - because we can't assume those functions
	   are all present on the page that we've loaded - so we'll need to think of a loading mechanism. */
	
	/* Need to work on an internationalization scheme - placeholder - 'ui' is the user interface name, 
	   it should be replaceable. Perhaps plugins will need to ship with a translation file, which
	   will need to be correlated with a selected language - will refer to dojo possibly. 'label' is
	   the key for the storage field */
	
	var initialSettings =	[{	"category":"JavaScript Editor", 
								"subcategory":	[{ "ui":"Font", "label":"Font", "items":[	{ "ui":"Family", "label":"Family", "input":"combo", "values":[ { "label":"Sans Serif" }, { "label":"Serif" } ], "setting":"Serif"  },
																				{ "ui":"Size", "label":"Size", "input":"combo", "values":[ { "label": "8pt" },{ "label":"9pt" }, { "label":"10pt" },{ "label":"11pt" }, { "label":"12pt" } ], "setting":"10pt" },
																				{ "ui":"Color", "label":"Color", "input":"color", "setting":"#000000" },
																				{ "ui":"Background", "label":"Background", "input":"color", "setting":"#FFFFFF" } ] },
												
												{ "ui":"Strings", "label":"String Types", "items":[	{ "ui":"Color", "label":"Color", "input":"color", "setting":"blue" },
																					{ "ui":"Weight", "label":"Weight", "input":"combo", "values":[ { "label": "Normal" }, { "label":"Bold" } ], "setting":"Normal" } ] },
												
												{ "ui":"Comments", "label":"Comment Types", "items":[{ "ui":"Color", "label":"Color", "input":"color", "setting":"green" },
																					{ "ui":"Weight", "label":"Weight", "input":"combo", "values":[ { "label": "Normal" }, { "label":"Bold" } ], "setting":"Normal" } ] },
												
												{ "ui":"Keywords", "label":"Keyword Types", "items":[{ "ui":"Color", "label":"Color", "input":"color", "setting":"darkred" },
																					{ "label":"Weight", "input":"combo", "values":[ { "label": "Normal" }, { "label":"Bold" } ], "setting":"Bold" } ] } ] } 
	]; 
	
	function setStorageItem( category, subCategory, element, value, ui ){
		
		var subcategories = JSON.parse( localStorage.getItem( category ) );
		
		for( var sub = 0; sub < subcategories.length; sub++ ){
			if( subcategories[sub].label === subCategory ){
				for( var item = 0; item < subcategories[sub].data.length; item++ ){
					 if( subcategories[sub].data[item].label === element ){
						subcategories[sub].data[item].value = value;
						subcategories[sub].data[item].ui = ui;
						localStorage.setItem( category, JSON.stringify( subcategories ) );
						break;
					 }
				}
			}
		}
	}
	
	function getStorageItem( category, subCategory, element ){
		
		var subcategories = JSON.parse( localStorage.getItem( category ) );
		
		var value;
		
		for( var sub = 0; sub < subcategories.length; sub++ ){
			if( subcategories[sub].label === subCategory ){
				for( var item = 0; item < subcategories[sub].data.length; item++ ){
					 if( subcategories[sub].data[item].label === element ){
						value = subcategories[sub].data[item].value;
						break;
					 }
				}
			}
		}
		
		return value;
	}
	
	
	function comboSelection( event ){
	
		/* These parameters were 'injected' into the
		   combo box domNode on creation of the combo box */
		
		var category = event.currentTarget.category;
		var subCategory = event.currentTarget.item;
		var element = event.currentTarget.element;
		var value = event.currentTarget.value;
		var ui = event.currentTarget.ui;
		
		setStorageItem( category, subCategory, element, value, ui );
	}
	
	function colorSelection( color ){
		
		var category = this.category;
		var subCategory = this.item;
		var element = this.element;
		var ui = this.ui;
		
		setStorageItem( category, subCategory, element, color, ui );
		
		this.colornode.set('label', "" );
		
		dojo.style( this.colornode.domNode.firstChild, "background", color );
	}
	
	function processInputType( category, label, item, node, ui ){
	
		var subcategories = JSON.parse( localStorage.getItem( category ) );
		
		var setting = getStorageItem( category, label, item.label );
	
		switch( item.input ){
		
			case "combo":
				
				var select = dojo.create( "select", { onchange: comboSelection }, node );
				
				select.category = category;
				select.item = label;
				select.element = item.label;
				
				for( var count = 0; count < item.values.length; count++ ){
				
					var comboLabel = item.values[count].label;
				
					var set = { value: comboLabel, innerHTML: comboLabel };
				
					if( comboLabel === setting ){
						set.selected = 'selected';
					}
	
					dojo.create( "option", set, select );
				}
				
				break;
				
			case "color":
			
				var c = new dijit.ColorPalette( { onChange: colorSelection } );
				
				c.category = category;
				c.item = label;
				c.element = item.label;
				
				c.identifier = item.label;
			
				var picker = dojo.create( "div", null, node );
				
				var button = new dijit.form.DropDownButton({
					label: "   ",
					name: item.label,
					dropDown: c
				}, picker );
				
				dojo.style( button.domNode.firstChild, "border", "1px solid #AAA" );
				dojo.style( button.domNode.firstChild, "padding", "2px" );
				dojo.style( button.domNode.firstChild, "padding-right", "3px" );
				dojo.style( button.domNode.firstChild, "background", setting );
				dojo.style( button.domNode.firstChild, "height", "12px" );
				dojo.style( button.domNode.firstChild, "width", "12px" );
	
				c.colornode = button;
				
				var elements = dojo.query( '.dijitArrowButtonInner', button.domNode );		
				dojo.removeClass( elements[0], 'dijitArrowButtonInner' );
	
				break;
		}
	}
	
	// The knowledge that "pageActions" is the toolbar is something only "page glue" code should know.
	// We don't like widgets, etc. knowing this detail.
	function updateToolbar(id) {
		// right now we only have tools for "plugins" category and the widget is handling those.
		// So our only job here is to empty the toolbar of any previous contributions.  
		// In the future, we might also want to ask each "category" to render its toolbar commands, and the plugin
		// category would know that the widget would handle this.
		if (dojo.byId("pageActions")) {
			dojo.empty("pageActions");
		}
	}
	
	 
	function displaySettings( id ){
		var settingsIndex = itemToIndexMap[id];
	
		var tableNode = dojo.byId( 'table' );
		
		dojo.empty( tableNode );
		
		var category = initialSettings[settingsIndex].category;
	
		dojo.create( "h1", { id: category, innerHTML: category }, tableNode );
		
		var subcategory = initialSettings[settingsIndex].subcategory;
		
		for( var sub = 0; sub < subcategory.length; sub++ ){	
				
			var section = dojo.create( "section", { id: subcategory[sub].label }, tableNode );
		
			dojo.create( "h3", { innerHTML: subcategory[sub].ui }, section );
			
			var outer = dojo.create( "div", null, section );
			
			for( var item = 0; item < subcategory[sub].items.length; item++ ){
				
				var inner = dojo.create( "div", null, outer );		
				var label = dojo.create( "label", null, inner );		
				dojo.create( "span", { innerHTML: subcategory[sub].items[item].label + ":" }, label );		
				processInputType( category, subcategory[sub].label, subcategory[sub].items[item], label, subcategory[sub].ui );		
			}
		}
		
		
	}	
	
	function addCategory( item, index ){
		var navbar = dojo.byId( 'navbar' );	
		dojo.create("li", item, navbar );
		itemToIndexMap[item.id] = index;
	}
	
	
	
	/*	showPlugins - iterates over the plugin array, reads
		meta-data and creates a dom entry for each plugin.
		
		This HTML structure is a special case - the other 
		settings cases should follow more of the JSEditor
		pattern. */
	
	function showPlugins( id ){
	
		if( selectedCategory ){
			dojo.removeClass( selectedCategory, "navbar-item-selected" );
		}
		
		if( id ){
			selectedCategory = dojo.byId(id);
		}
		
		dojo.addClass( selectedCategory, "navbar-item-selected" );
		
		var tableNode = dojo.byId( 'table' );
		
		dojo.empty( tableNode );
		
		if( pluginWidget ){
			pluginWidget.destroyRecursive(true);
		}
		
		updateToolbar(id);
		
		pluginWidget = new orion.widgets.PluginList( {  settings: settingsCore, statusService: preferencesStatusService, dialogService:preferenceDialogService, commandService: commandService, toolbarID: "pageActions" }, tableNode );
	}
	
	function addPlugins(){
	
		var item = { id: "plugins",
					 innerHTML: "Plugins", 
					 "class": 'navbar-item'
					};
						
		addCategory( item, initialSettings.length );
		dojo.connect(dojo.byId(item.id), 'onclick', dojo.hitch(null, showPlugins, item.id));
	}
	  
	function selectCategory( id ){
	
		if( selectedCategory ){
			dojo.removeClass( selectedCategory, "navbar-item-selected" );
		}
		
		selectedCategory = dojo.byId(id);
		dojo.addClass( selectedCategory, "navbar-item-selected" );
		updateToolbar(id);
		displaySettings(id);
	}
	
	function showById(id) {
		updateToolbar(id);
		if (id === "plugins") {
			showPlugins(id);
		} else {
			selectCategory(id);
		}
	}
	
	function processHash() {
	
		var pageParams = PageUtil.matchResourceParameters();
		var category = pageParams.category || "plugins";
		showById(category);
		commandService.processURL(window.location.href);
	}
	
	function drawUserInterface( settings ) {
	
		for( var count = 0; count < settings.length; count++ ){
			var itemId = settings[count].category.replace(/\s/g, "").toLowerCase();
			var item = { innerHTML: settings[count].category, 
						 id: itemId,
						 "class": 'navbar-item'};
			
			addCategory( item, count );
			dojo.connect(dojo.byId(itemId), 'onclick', dojo.hitch(null, selectCategory, itemId));
		}
					
		addPlugins();
		processHash();
		
		/* Adjusting width of mainNode - the css class is shared 
		   so tailoring it for the preference apps */
		
		var mainNode = dojo.byId( "mainNode" );	
		dojo.style( mainNode, "maxWidth", "700px" );
		dojo.style( mainNode, "minWidth", "500px" );
	}
	
	
	function manageDefaultData( preferences, settings ){
	
		// var example = [ { "subcategory":"Font", [ { "label":"Family", "value":"serif" }, {"label":"Size", "value":"10pt"}, {"label":"Line Height", "value":"12pt"} ] ];
		
		for( var count = 0; count < settings.length; count++ ){
		
			var category = settings[count].category;
			
			if( !localStorage.getItem( category ) ){
		
				var subcategories = [];
			
				var subcategory = settings[count].subcategory;
	
				for( var sub = 0; sub < subcategory.length; sub++ ){	
				
					var elements = [];
				
					for( var item = 0; item < subcategory[sub].items.length; item++ ){
						
						var element = {};					
						element.label = subcategory[sub].items[item].label;
						element.value = subcategory[sub].items[item].setting;						
						elements.push( element );
					}
					
					subcategories.push( { "label":subcategory[sub].label, "data":elements } );
				}
				
				localStorage.setItem( category, JSON.stringify( subcategories ) );
			}
		}	
	}
	
	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
		
			settingsCore = core;
		
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			
			preferencesCorePreferences = core.preferences;	

			document.body.style.visibility = "visible";
			dojo.parser.parse();

			preferenceDialogService = new mDialogs.DialogService(serviceRegistry);
		
			// Register services
			var dialogService = new mDialogs.DialogService(serviceRegistry);
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			preferencesStatusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea");
			commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
	
			var siteService = new mSiteService.SiteService(serviceRegistry);
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher);

			preferencesStatusService.setMessage("Loading...");		
			manageDefaultData( preferences, initialSettings );			
			drawUserInterface( initialSettings );	
			dojo.subscribe("/dojo/hashchange", this, function() {
				processHash();
			});
			preferencesStatusService.setMessage("");
		});
	});
});
