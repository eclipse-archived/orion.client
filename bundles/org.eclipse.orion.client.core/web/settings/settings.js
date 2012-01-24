/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
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

var preferencesStatusService;
var preferencesCorePreferences;
var preferenceDialogService;
var settingsCore;
var selectedCategory;   
var newPluginDialog = false;

var iconSource = "data:image/png;base64,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";

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
			
			var select = dojo.create( "select", { onchange: "comboSelection(event)" }, node );
			
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

			break;
	}
}

 
function displaySettings( id ){

	var tableNode = dojo.byId( 'table' );
	
	dojo.empty( tableNode );
	
	var category = initialSettings[id].category;

	dojo.create( "h1", { id: category, innerHTML: category }, tableNode );
	
	var subcategory = initialSettings[id].subcategory;
	
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

function addCategory( item ){
	var navbar = dojo.byId( 'navbar' );	
	dojo.create("li", item, navbar );
}

function addPlugins(){

	var item = { id: initialSettings.length, 
				 innerHTML: "Plugins", 
				 "class": 'navbar-item',
				 onClick: 'showPlugins(event)' };
					
	addCategory( item );
}

function addNewPlugins(){

	if( newPluginDialog === false ){		
		dojo.removeClass( "newpluginsdialog", "interactionClosed" );
		dojo.addClass( "newpluginsdialog", "interactionOpen" );
		dojo.byId("addpluginscontrol").innerHTML = "Hide Dialog";
		newPluginDialog = true;
	}else{
		dojo.removeClass( "newpluginsdialog", "interactionOpen" );
		dojo.addClass( "newpluginsdialog", "interactionClosed" );
		dojo.byId("addpluginscontrol").innerHTML = "Add Plugins";
		newPluginDialog = false;
	} 
}


/*	derivePluginNameFromLocation - temporary function - 
	the current plugins don't provide useful enough, or 
	consistent meta-data to use for descriptions. */

function derivePluginNameFromLocation( location ){

	function wordToUpper(strSentence) {

		function convertToUpper() {
			return arguments[0].toUpperCase();
		}

		return strSentence.toLowerCase().replace(/\b[a-z]/g, convertToUpper);
	}

	var divides = location.split( "/" );
	var last = divides[divides.length-1];
	last = last.split( ".html" )[0];
	last = last.replace( /([a-z])([A-Z])/, "$1 $2");
	last = wordToUpper( last );
	return last;
}

/*	pluginUrlFocus - a focus handler for the 
	url entry text field */

function pluginUrlFocus(){
	var node = dojo.byId( 'pluginUrlEntry' );
	node.value = '';
	dojo.style( node, "color", "" );
}

/*	pluginUrlFocus - a blue handler for the 
	url entry text field */

function pluginUrlBlur(){
	var node = dojo.byId( 'pluginUrlEntry' );
	if( node.value === '' ){
		node.value = 'Type a plugin url here ...';
		dojo.style( node, "color", "#AAA" );
	}
}


/*	showPlugins - iterates over the plugin array, reads
	meta-data and creates a dom entry for each plugin.
	
	This HTML structure is a special case - the other 
	settings cases should follow more of the JSEditor
	pattern. */

function showPlugins( event ){

	var settingsPluginList = settingsCore.pluginRegistry.getPlugins();

	if( selectedCategory ){
		dojo.removeClass( selectedCategory, "navbar-item-selected" );
	}
	
	if( event ){
		selectedCategory = event.currentTarget;
	}
	
	dojo.addClass( selectedCategory, "navbar-item-selected" );
	
	var tableNode = dojo.byId( 'table' );
	
	dojo.empty( tableNode );
	
	var titleWrapper = dojo.create( "div", {"class":"pluginwrapper"}, tableNode );
		
	var item = { id: "Plugins", "class":"pluginTitle", innerHTML: "Plugins [" + settingsPluginList.length +"]" };

	dojo.create( "div", item, titleWrapper );
	
	dojo.create( "div", { id: "addpluginscontrol", innerHTML:"Add Plugins", "class":"additions", onclick:"addNewPlugins()"}, titleWrapper );
	
	/* 	The plugins page has a slightly different layout from the other settings pages - so this content 
		section provides the slide down capability to reveal the dialog for adding more plugins */
	
	var content =	'<div class="displaytable">' +
						'<div id="newpluginsdialog" class="interactionClosed">' +
							'<table id="dev-table" width="100%">' +
								'<tr>' +
									'<td>' +
										'<input id="pluginUrlEntry" type="url" onfocus="pluginUrlFocus()" onblur="pluginUrlBlur()" value="Type a plugin url here ..." name="user_url" style="width:400px;color:#AAA;"/>' +
										'<button onclick="installHandler()">Load this plugin</button>' +
									'</td>' +
									'<td align="right">' +
										'<button id="update-extensions-now" onclick="reloadPlugins()">Re-load all</button>' +
									'</td>' +
								'</tr>' +
							'</table>' +
						'</div>' +
						'<div class="plugin-settings">' +
							'<list id="plugin-settings-list"></list>' +
						'</div>' +
					'</div>';
	
	dojo.place( content, tableNode );

    var list = dojo.byId( "plugin-settings-list" );
    		
	for( var p = 0; p < settingsPluginList.length; p++ ){
		var plg = settingsPluginList[p].getData();
		
		var location = settingsPluginList[p].getLocation();
		
		var name = derivePluginNameFromLocation( location );
		
		var extensionListItem = dojo.create( "div", { "class":"plugin-list-item" }, list );
		var horizontalBox = dojo.create( "div", null, extensionListItem );
		var zippy = dojo.create( "div", { "class":"container" }, horizontalBox );
		var icon = dojo.create( "img", { "class":"plugin-icon", "src": iconSource }, horizontalBox );
		var detailsView = dojo.create( "div", { "class":"stretch", "src": iconSource }, horizontalBox );
		var title = dojo.create( "span", { "class":"plugin-title", innerHTML: name }, detailsView );
		dojo.create( "div", null, detailsView );
		var description = dojo.create( "span", { "class":"plugin-description", innerHTML: "A plugin for Eclipse Orion" }, detailsView );
		dojo.create( "a", { "class":"plugin-links-trailing", href: location, innerHTML: "Plugin Website" }, detailsView ); 
		
		dojo.create( "div", null, horizontalBox );
		
		var removeButton = dojo.create( "button", { "id":location, "class":"plugin-delete", innerHTML: "Remove", onClick: "removePlugin(event)" }, horizontalBox );	
	}	                
}

/* reloads all of the plugins - sometimes useful for reaffirming plugin initialization */

function reloadPlugins(){

	var settingsPluginList = settingsCore.pluginRegistry.getPlugins();

	var count = 0;
	
	var d = new dojo.Deferred();

	for( var i = 0; i < settingsPluginList.length; i++) {
	
		settingsPluginList[i]._load().then( function(){
			count++;
			if( count === settingsPluginList.length ){
				d.resolve();
			}
		});
	}
	
	d.then( function(){
		preferencesStatusService.setMessage( "Reloaded " + settingsPluginList.length + " plugin" + ( settingsPluginList.length===1 ? "": "s") + ".", 5000 );
		showPlugins();
	});
}

/* removePlugin - removes a plugin by url */

function removePlugin( event ){

	/* 	The id of the source element is programmed with the
		url of the plugin to remove. */
		
	var confirmMessage = "Are you sure you want to uninstall '" + event.srcElement.id + "'?";
	
	preferenceDialogService.confirm( confirmMessage, function( doit ){
	
		if( doit ){
		
			var settingsPluginList = settingsCore.pluginRegistry.getPlugins();
		
			for( var p = 0; p < settingsPluginList.length; p++ ){
				if( settingsPluginList[p].getLocation() === event.srcElement.id ){
					settingsPluginList[p].uninstall();

					dojo.byId("pluginUrlEntry").value.value="";
					preferencesStatusService.setMessage("Uninstalled " + event.srcElement.id, 5000);
					preferencesCorePreferences.getPreferences("/plugins").then(function(plugins) {
						plugins.remove(event.srcElement.id);
					}); // this will force a sync
					
					showPlugins();
					
					break;
				}
			}
		}
	});
}

var installHandler = function(evt) {
	var pluginUrl = dojo.byId("pluginUrlEntry").value;
	if (/^\S+$/.test(dojo.trim(pluginUrl))) {
		preferencesStatusService.setMessage("Installing " + pluginUrl + "...");
		if (settingsCore.pluginRegistry.getPlugin(pluginUrl)) {
			preferencesStatusService.setErrorMessage("Already installed");
		} else {
			settingsCore.pluginRegistry.installPlugin(pluginUrl).then(
				function(plugin) {
					
					dojo.byId("pluginUrlEntry").value.value="";
					preferencesStatusService.setMessage("Installed " + plugin.getLocation(), 5000);
					preferencesCorePreferences.getPreferences("/plugins").then(function(plugins) {
						plugins.put(pluginUrl, true);
					}); // this will force a sync
					
					showPlugins();
					
				}, function(error) {
					preferencesStatusService.setErrorMessage(error);
			});
		}
	}
};
  
function selectCategory( event ){

	if( selectedCategory ){
		dojo.removeClass( selectedCategory, "navbar-item-selected" );
	}
	
	selectedCategory = event.currentTarget;
	dojo.addClass( selectedCategory, "navbar-item-selected" );
	displaySettings( selectedCategory.id );
}

function drawUserInterface( settings ){

	for( var count = 0; count < settings.length; count++ ){

		var item = { id: count, 
					 innerHTML: settings[count].category, 
					 "class": 'navbar-item',
					 onClick: 'selectCategory(event)' };
		
		addCategory( item );
	}
				
	addPlugins();
	
	var nav = dojo.byId( 'navbar' );
	
	selectCategory({currentTarget: nav.childNodes[1]});
}


function manageDefaultData( preferences, settings ){

	// var example = [ { "subcategory":"Font", [ { "label":"Family", "value":"serif" }, {"label":"Size", "value":"10pt"}, {"label":"Line Height", "value":"12pt"} ] ];

	// preferences.getPreferences('OrionPluginDefaults').then( function(prefs){
	
		for( var count = 0; count < settings.length; count++ ){
		
			var category = settings[count].category;
			
			if( !localStorage.getItem( category ) ){
		
			// if( prefs.get( category ) === undefined ){
			
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

				// prefs.put( category, subcategories );
			}
		}	
	// });
}

define(['require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/commands', 'orion/fileClient',
	        'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'orion/siteService', 'orion/siteUtils', 'orion/siteTree', 'orion/treetable', 
	        'dojo/parser', 'dojo/hash', 'dojo/date/locale', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/NewSiteDialog', 'dijit/form/Button', 'dijit/ColorPalette' ], 
			function(require, dojo, mBootstrap, mStatus, mCommands, mFileClient, mSearchClient, mDialogs, mGlobalCommands, mSiteService, mSiteUtils, mSiteTree, mTreeTable) {

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
			preferencesStatusService = new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
	
			var siteService = new mSiteService.SiteService(serviceRegistry);
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher);

			preferencesStatusService.setMessage("Loading...");		
			manageDefaultData( preferences, initialSettings );			
			drawUserInterface( initialSettings );	
			preferencesStatusService.setMessage("");
		});
	});
});