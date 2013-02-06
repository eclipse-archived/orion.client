/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 ******************************************************************************/
/*global define document window URL*/
define(["require", "orion/Deferred", "orion/PageUtil", "orion/URITemplate", "orion/URL-shim"], function(require, Deferred, PageUtil, URITemplate) {

	/**
	 * Read info from an <code>orion.page.*</code> service extension.
	 * @methodOf orion.PageLinks
	 * @param {orion.ServiceRegistry} serviceRegistry The service registry.
	 * @param {String} serviceName Service name to read extensions from.
	 * @return {Deferred} A promise that resolves to an Array of info objects.
	 */
	function getPageLinksInfo(serviceRegistry, serviceName) {
		serviceName = serviceName || "orion.page.link"; //$NON-NLS-0$
		// Note that the shape of the "orion.page.link" extension is not in any shape or form that could be considered final.
		// We've included it to enable experimentation. Please provide feedback on IRC or bugzilla.

		// The shape of a contributed navigation link is (for now):
		// info - information about the navigation link (object).
		//     required attribute: name - the name of the navigation link
		//     required attribute: id - the id of the navigation link
		//     required attribute: uriTemplate - the URL for the navigation link
		//     optional attribute: image - a URL to an icon representing the link (currently not used, may use in future)
		var navLinks= serviceRegistry.getServiceReferences(serviceName); //$NON-NLS-0$
		var params = PageUtil.matchResourceParameters(window.location.href);
		// TODO: should not be necessary, see bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=373450
		var orionHome = new URL(require.toUrl("."), window.location).href.slice(0,-1); //$NON-NLS-0$
		var locationObject = {OrionHome: orionHome, Location: params.resource};
		var infos = [];
		for (var i=0; i<navLinks.length; i++) {
			var info = {};
			var propertyNames = navLinks[i].getPropertyKeys();
			for (var j = 0; j < propertyNames.length; j++) {
				info[propertyNames[j]] = navLinks[i].getProperty(propertyNames[j]);
			}
			if(info.uriTemplate && info.nls && (info.name || info.nameKey)){
				var d = new Deferred();
				require(['i18n!'+info.nls], function(commandMessages){ //$NON-NLS-0$
					var uriTemplate = new URITemplate(info.uriTemplate);
					var expandedHref = window.decodeURIComponent(uriTemplate.expand(locationObject));
					expandedHref = PageUtil.validateURLScheme(expandedHref);

					info.href = expandedHref;
					info.textContent = (info.nameKey? commandMessages[info.nameKey]: info.name);
					d.resolve(info);
				});
				infos.push(d);
			} else if (info.uriTemplate && info.name) {
				var uriTemplate = new URITemplate(info.uriTemplate);
				var expandedHref = window.decodeURIComponent(uriTemplate.expand(locationObject));
				expandedHref = PageUtil.validateURLScheme(expandedHref);

				info.href = expandedHref;
				info.textContent = info.name;
				infos.push(new Deferred().resolve(info));
			}
		}
		return Deferred.all(infos);
	}

	function createLink(href, target, textContent) {
		var a = document.createElement("a");
		a.href = href;
		a.target = target;
		a.classList.add("targetSelector");
		a.textContent = textContent;
		return a;
	}

	/**
	 * Build links from an <code>orion.page.link</code> service extension.
	 * @methodOf orion.PageLinks
	 * @param {orion.ServiceRegistry} serviceRegistry The service registry.
	 * @param {String} serviceName Service name to read extensions from.
	 * @return {Deferred} A promise that resolves to an Array of DOM elements which are the links.
	 */
	function createPageLinks(serviceRegistry, serviceName) {
		return getPageLinksInfo(serviceRegistry, serviceName).then(function(links) {
			return links.map(function(info) {
				return createLink(info.href, "_self", info.textContent); //$NON-NLS-0$
			});
		});
	}

	/**
	 * @name orion.PageLinks
	 * @class Utilities for reading <code>orion.page.links</code> services.
	 * @description Utilities for reading <code>orion.page.links</code> services.
	 */
	return {
		createPageLinks: createPageLinks,
		getPageLinksInfo: getPageLinksInfo
	};
});
