/*******************************************************************************
* @license
* Copyright (c) 2011 IBM Corporation and others.
* All rights reserved. This program and the accompanying materials are made
* available under the terms of the Eclipse Public License v1.0
* (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
* License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
*
* Contributors:
* IBM Corporation - initial API and implementation
*******************************************************************************/

var debugMessaging = document.getElementById("orion-debugMessaging");
if (!debugMessaging) {
	return;
}

debugMessaging.addEventListener("DOMNodeInserted", function() {
	var portLabel = document.getElementById("debug-port");
	if (!portLabel) {
		return;
	}
	var port = parseInt(portLabel.innerHTML);
	debugMessaging.removeChild(portLabel);
	if (port === NaN || !(1000 <= port && port < 65535)) {
		alert("Invalid port, value must be 1000 - 65535");
		return;
	}
	var url = "http://localhost:" + port + "/json";
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.responseText.length > 0) {
				var responseLabel = document.createElement('label');
				responseLabel.setAttribute('id', 'debug-response');
				responseLabel.style.display = 'none';
				responseLabel.innerHTML = xhr.responseText;
				debugMessaging.appendChild(responseLabel);
			}
		}
	}
	xhr.onerror = function () {
		alert("XHR error: " + xhr.status);
	};
	xhr.open("GET", url, true);
	xhr.send(null);
});
