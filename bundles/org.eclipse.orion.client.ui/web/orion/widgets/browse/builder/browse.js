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
var _browser_script_source = null;//We need to know where the browser script lives
var _all_script = document.getElementsByTagName ('script');
if(_all_script && _all_script.length && _all_script.length > 0) {
	for(var j = 0; j < 2; j++) {// try twice in all the script tags
		for (var i = 0; i < _all_script.length; i++) {
			if(j === 0) {//First try: if the script id is ""orion.browse.browser""
			    if(_all_script[i].id === "orion.browse.browser") {
			    	_browser_script_source = _all_script[i].src;
			    	break;
			    }
			} else {
				var regex = /.*built-browse.*.js/;
			    if(_all_script[i].src && regex.exec(_all_script[i].src)) {
			    	_browser_script_source = _all_script[i].src;
			    	break;
			    }
			}
		}
		if(_browser_script_source) {
			break;
		}
	}
	if(!_browser_script_source) {
		_browser_script_source = _all_script[_all_script.length - 1].src;
	}
}

define('orion/widgets/browse/builder/browse',['orion/widgets/browse/fileBrowser', 'orion/serviceregistry', 'orion/pluginregistry', 'orion/URL-shim'],
function(mFileBrowser, mServiceRegistry, mPluginRegistry) {
	function Browser(parentId, repoURL, base) {
		var pluginURL;
		var url = new URL(repoURL || window.location.href);	
		if (url.host==="github.com") {
			pluginURL = new URL("../../plugins/GitHubFilePlugin.html?repo=" + repoURL, _browser_script_source);
		} else if (url.pathname.indexOf("/git/") === 0) {
			pluginURL = new URL("/gerrit/plugins/gerritFilesystem/static/plugins/GerritFilePlugin.html", repoURL);
			pluginURL.query.set("project", url.pathname.substring(5));
		} else if (url.pathname.indexOf("/project/") === 0) {
			if (!base) {
				base = new URL("/ccm01", repoURL).href;
			}
			pluginURL = new URL(base + "/service/com.ibm.team.filesystem.service.jazzhub.IOrionFilesystem/sr/pluginOrionWs.html?" + repoURL);
		} else {
			throw "Bad Repo URL - " + repoURL;
		}
		var serviceRegistry = new mServiceRegistry.ServiceRegistry();
		var plugins = {};
		plugins[pluginURL.href] = true;
		var pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry, {
			storage: {},
			plugins: plugins
		});
		pluginRegistry.start().then(function() {
			this._fileBrowser = new mFileBrowser.FileBrowser({
				parent: parentId,//"fileBrowser", 
				showBranch: true,
				//maxEditorHeight: 800,
				serviceRegistry: serviceRegistry
			});
		}.bind(this));
	}
	
	Browser.prototype = {
		getFileBrowser: function(){
			return this._fileBrowser;
		}
	};
    return Browser;
});
