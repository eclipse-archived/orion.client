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
define([], function() {
	var tid = 'UA-55945995-1'; //$NON-NLS-0$

	var init = function(args) {
		if (window.location.host.indexOf("orion.eclipse.org") !== -1) {
			(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

			args = args || {};
			args.siteSpeedSampleRate = 50;
			window.ga('create', tid, args); //$NON-NLS-0$
//			window.ga('require', 'linkid', 'linkid.js'); /* adds enhanced link attribution */
			window.ga('send', 'pageview'); //$NON-NLS-1$ //$NON-NLS-0$
		}
	};

	var logEvent = function(category, action, label, value) {
		if (window.ga) {
			window.ga('send', 'event', category, action, label, value);
		}
	};

	return {
		init: init,
		logEvent: logEvent
	};
});