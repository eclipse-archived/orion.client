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
define(["orion/plugin", "plugins/metrics/googleAnalyticsImpl"], function(PluginProvider, GoogleAnalyticsImpl) {
	var headers = {
		name: "Google Analytics Plugin",
		version: "1.0",
		description: "Google Analytics Plugin"
	};
	var provider = new PluginProvider(headers);
	var servletPath = new URL("../../metrics", window.location).href; //$NON-NLS-0$
	var service = new GoogleAnalyticsImpl(servletPath); //$NON-NLS-0$
	provider.registerService("orion.metrics", service, {}); //$NON-NLS-0$
	provider.connect();
});
