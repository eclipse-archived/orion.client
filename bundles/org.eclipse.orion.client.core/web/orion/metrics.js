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
define(["orion/xhr"], function(xhr) {
	var GA_ID = "OrionGA"; //$NON-NLS-0$
	var queue = [];

	var init = function(serviceRegistry, args) {
		var refs = serviceRegistry.getServiceReferences("orion.analytics.google"); //$NON-NLS-0$
		if (refs.length) {
			var ref = refs[0];
			var service = serviceRegistry.getService(ref);
			if (service && service.init) {
				service.init().then(
					function(result) {
						if (!result.tid) { /* not tracking */
							queue = null;
							return;
						}

						(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
						(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
						m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
						})(window,document,'script','//www.google-analytics.com/analytics.js',GA_ID);

						args = args || {};
						if (result.siteSpeedSampleRate) {
							args.siteSpeedSampleRate = result.siteSpeedSampleRate;
						}
						window[GA_ID]("create", result.tid, args); //$NON-NLS-0$
						window[GA_ID]("send", "pageview"); //$NON-NLS-1$ //$NON-NLS-0$

						queue.forEach(function(current) {
							logEvent(current.category, current.action, current.label, current.value);
						});
						queue = null; /* no longer needed */
					}
				);
			}
		}
		if (!(service && service.init)) {
			queue = null; /* not tracking */
		}
	};

	var logEvent = function(category, action, label, value) {
		if (window[GA_ID]) {
			window[GA_ID]("send", "event", category, action, label, value); //$NON-NLS-1$ //$NON-NLS-0$
		} else {
			if (queue) {
				queue.push({category: category, action: action, label: label, value: value});
			}
		}
	};

	return {
		init: init,
		logEvent: logEvent
	};
});
