/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
define([
	'orion/webui/littlelib'
], function(lib) {

	function progress(msg) {
		var splashProgress = lib.node("splashProgress");
		if (splashProgress) {
			splashProgress.innerHTML = msg;
		}
	}

	function takeDown() {
		var splash = lib.node("splash");
		if (splash) {
			splash.classList.remove("splashShown");
		}
	}

	return {
		progress: progress,
		takeDown: takeDown
	};
});
