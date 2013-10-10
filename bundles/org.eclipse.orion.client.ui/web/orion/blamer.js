/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window define */

define ([
	'orion/PageLinks', //$NON-NLS-0$
	'orion/URITemplate' //$NON-NLS-0$
], function(PageLinks, URITemplate) {

	function isVisible(serviceRegistry) {
		return !!serviceRegistry.getService("orion.edit.blamer") && !!serviceRegistry.getService("orion.core.blame"); //$NON-NLS-1$ //$NON-NLS-0$
	}

	function getBlame(serviceRegistry, editor, fileName){
		var service = serviceRegistry.getService("orion.edit.blamer"); //$NON-NLS-0$
		if (service) {
			service.doBlame(fileName).then(function(results) {
				var orionHome = PageLinks.getOrionHome();
				for (var i=0; i<results.length; i++) {
					var range = results[i];
					var uriTemplate = new URITemplate(range.CommitLink);
					var params = {};
					params.OrionHome = orionHome;
					range.CommitLink = window.decodeURIComponent(uriTemplate.expand(params));
				}
				serviceRegistry.getService("orion.core.blame")._setAnnotations(results); //$NON-NLS-0$
			});
		}
	}
	return {isVisible: isVisible, getBlame: getBlame}; 
});


