/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
/*global URL*/
define(["orion/Deferred", "orion/xhr"], function(Deferred, xhr) {

	function GoogleAnalyticsImpl() {}

	GoogleAnalyticsImpl.prototype = {
		init: function() {
			var promise = new Deferred();
			var url = new URL("../../metrics", window.location); //$NON-NLS-0$
			xhr("GET", url.href, { //$NON-NLS-0$
				headers: {
					"Orion-Version": "1" //$NON-NLS-1$ //$NON-NLS-0$
				},
				log: false
			}).then(
				function(result) {
					promise.resolve(JSON.parse(result.response));
				},
				function(error) {
					promise.resolve({});
				}
			);
			return promise;
		}
	};

	return GoogleAnalyticsImpl;
});
