/*******************************************************************************
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global setTimeout orion dojo eclipse importScripts */

importScripts("../../orion/Deferred.js");
importScripts("../../orion/plugin.js");
var provider = new orion.PluginProvider();
provider.registerService("test", {
	test: function(echo) {
		return echo;
	},
	testPromise: function(echo) {
		var d = new orion.Deferred();
		setTimeout(function() {
			d.progress("progress");
			d.resolve(echo);
		}, 0);
		return d;
	}
}, {
	name: "echotest"
});
provider.connect();
