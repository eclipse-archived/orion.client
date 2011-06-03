/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
define(['dojo', 'orion/serviceregistry', 'orion/preferences', 'orion/pluginregistry', 'orion/status', 'orion/commands', 
	        'orion/fileClient', 'orion/searchClient', 'orion/globalCommands', 'orion/compare/compare-features', 'orion/compare/diff-provider', 'orion/compare/compare-container',
	        'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
			function(dojo, mServiceregistry, mPreferences, mPluginRegistry, mStatus, mCommands, mFileClient, mSearchClient, mGlobalCommands, mCompareFeatures, mDiffProvider, mCompareContainer) {

dojo.addOnLoad(function() {
	
	dojo.parser.parse();
	// initialize service registry and EAS services
	var serviceRegistry = new mServiceregistry.ServiceRegistry();
	var pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry);
	var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
	var preferenceService = new mPreferences.PreferencesService(serviceRegistry, "/prefs/user");
	var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry});
	// File operations
	var fileServices = serviceRegistry.getServiceReferences("orion.core.file");
	var fileServiceReference;
	
	for (var i=0; i<fileServices.length; i++) {
		var info = {};
		var propertyNames = fileServices[i].getPropertyNames();
		for (var j = 0; j < propertyNames.length; j++) {
			info[propertyNames[j]] = fileServices[i].getProperty(propertyNames[j]);
		}
		if (new RegExp(info.pattern).test(dojo.hash())) {
			fileServiceReference = fileServices[i];
		}
	}

	serviceRegistry.getService(fileServiceReference).then(function(fileService) {
		var fileClient = new mFileClient.FileClient(fileService);
		
		mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferenceService, searcher);
		/* experiment for multiple compare containers
		var fileClient1 = new eclipse.FileClient(fileService);
		var uiFactory1 = new orion.CompareMergeUIFactory({parentDivID : "compareContainer1" , showTitle : false , showLineStatus : false});
		uiFactory1.buildUI();
		var compareMergeContainer1 = new orion.CompareMergeContainer(readOnly ,new orion.DiffProvider(serviceRegistry),serviceRegistry , commandService, fileClient1,uiFactory1);
		compareMergeContainer1.resolveDiff(dojo.hash(), 
				  function(newFile , oldFile){
				     handleTile(newFile , oldFile , uiFactory);
		  		  },
				  function(errorResponse , ioArgs){
		  			 handleErrorTile(errorResponse , ioArgs , uiFactory);
				  }
		);
		*/
		var uiFactory = new mCompareFeatures.CompareMergeUIFactory({parentDivID : "compareContainer" , showTitle : true , showLineStatus : true});
		uiFactory.buildUI();
		
		// Diff operations
		var readOnly = isReadOnly();
		compareMergeContainer = new mCompareContainer.CompareMergeContainer(readOnly, new mDiffProvider.DiffProvider(serviceRegistry),serviceRegistry , commandService, fileClient,uiFactory);
		compareMergeContainer.resolveDiff(dojo.hash(), 
				  function(newFile , oldFile){
				     handleTile(newFile , oldFile , uiFactory);
		  		  },
				  function(errorResponse , ioArgs){
		  			 handleErrorTile(errorResponse , ioArgs , uiFactory);
				  }
		);
		
		//every time the user manually changes the hash, we need to load the diff
		dojo.subscribe("/dojo/hashchange", compareMergeContainer, function() {
			compareMergeContainer = new mCompareContainer.CompareMergeContainer(readOnly, new mDiffProvider.DiffProvider(serviceRegistry),serviceRegistry , commandService , fileClient,uiFactory);
			compareMergeContainer.resolveDiff(dojo.hash(), 
					  function(newFile , oldFile){
						 handleTile(newFile , oldFile , uiFactory);
					  },
					  function(errorResponse , ioArgs){
						  handleErrorTile(errorResponse , ioArgs , uiFactory);
					  });
		});
	});
});

function isReadOnly(){
	var queryParams = dojo.queryToObject(window.location.search.slice(1));
	return queryParams["readonly"] != null;
};

function handleTile(newFile , oldFile , uiFactory){
	if(uiFactory.getTitleDivId(true) && uiFactory.getTitleDivId(false)){
		dojo.place(document.createTextNode(newFile), uiFactory.getTitleDivId(true), "only");				  
		dojo.place(document.createTextNode(oldFile), uiFactory.getTitleDivId(false), "only");	
	}
};

function handleErrorTile(errorResponse , ioArgs , uiFactory){
	if(uiFactory.getTitleDivId(true) && uiFactory.getTitleDivId(false)){
		  var message = typeof(errorResponse.message) === "string" ? errorResponse.message : ioArgs.xhr.statusText; 
		  dojo.place(document.createTextNode(message), uiFactory.getTitleDivId(true), "only");				  
		  dojo.place(document.createTextNode(message), uiFactory.getTitleDivId(false), "only");				  
		  dojo.style(uiFactory.getTitleDivId(true), "color", "red");
		  dojo.style(uiFactory.getTitleDivId(false), "color", "red");
	}
};

});
