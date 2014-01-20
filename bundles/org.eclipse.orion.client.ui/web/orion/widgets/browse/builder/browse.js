/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 (http://www.eclipse.org/legal/epl-v10.html),
 * and the Eclipse Distribution License v1.0
 * (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define require URL document console prompt XMLHttpRequest window*/

var _browser_script_source = null;
var _all_script = document.getElementsByTagName ('script');
_all_script.some(function(script){
	if(script.id && script.id.indexOf("orion.browse.browser")) {
		_browser_script_source = script.src;
		return true;
	}
});

define(['orion/widgets/browse/fileBrowser', 'orion/serviceregistry', 'orion/pluginregistry', 'orion/URL-shim'],
function(mFileBrowser, mServiceRegistry, mPluginRegistry) {
	function Browser(parentId, repoURL) {
		
		var pluginURL = "plugins/GitHubFilePlugin.html?repo=" + repoURL; //"https://github.com/eclipse/orion.client.git"
		pluginURL = new URL(pluginURL, _browser_script_source);
		//var pluginURL = "http://libingw.orion.eclipse.org:8080/plugins/GitHubFilePlugin.html?repo=https://github.com/eclipse/orion.client.git";
		var serviceRegistry = new mServiceRegistry.ServiceRegistry();
		var plugins = {};
		plugins[pluginURL] = true;
		var pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry, {
			storage: {},
			plugins: plugins
		});
		pluginRegistry.start().then(function() {
			var fileBrowser = new mFileBrowser.FileBrowser({
				parent: parentId,//"fileBrowser", 
				//maxEditorHeight: 800,
				serviceRegistry: serviceRegistry
			});
		});
	}
	
//    function Browser(parent, serviceRefs){
//		this.fileBrowser = new mFileBrowser.FileBrowser(parent, serviceRefs);
//    }
//	Browser.prototype = {
//		getFileBrowser: function(){
//			return this.fileBrowser;
//		}	
//	};
    return Browser;
});
