/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd, es6*/
define([
	"orion/lsp/languageServer"
], function(LanguageServer) {
	
	var _registry,
		_srvcreg;
		
	/**
	 * @name LanguageServerRegistry
	 * @description The registry of all available language servers, cached by language ID
	 * @param {?} serviceRegistry The backing Orion service registry
	 * @returns {LanguageServerRegistry} A new instance of the registry
	 * @since 13.0
	 */
	function LanguageServerRegistry(serviceRegistry) {
		_srvcreg = serviceRegistry;
	}
	
	/**
	 * @name LanguageServerRegistry.prototype.init
	 * @description Initialize the language server registry if not already initialized
	 * @function
	 */
	LanguageServerRegistry.prototype.init = function init() {
		if(!_registry && _srvcreg) {
			var srvcs = _srvcreg.getServiceReferences("orion.languages.server");
			if(srvcs) {
				_registry = new Map(); //map by languageId
				srvcs.forEach(function(ref) {
					var channel = ref.getProperty("channel"),
						id = ref.getProperty("languageId"),
						url = ref.getProperty("url");
					if(channel && id) {
						_registry.set(id, new LanguageServer(this, id, url, {channel: channel}));
					}
				}.bind(this));
			}
		}
	};
	
	/**
	 * @name LanguageServerRegistry.prototype.getServer
	 * @description description
	 * @function
	 * @param {String} languageId The id of the language to look for a server for
	 * @returns {LanguageServer} A language server impl - if one is mapped
	 */
	LanguageServerRegistry.prototype.getServer = function getServer(languageId) {
		this.init();
		return _registry.get(languageId);
	};
	
	return LanguageServerRegistry;
});