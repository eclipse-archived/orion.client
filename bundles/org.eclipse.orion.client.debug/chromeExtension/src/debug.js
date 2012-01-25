/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

/*jslint browser:true*/

var debugMessaging = document.getElementById("orion-debugMessaging");
if (debugMessaging) {
	debugMessaging.addEventListener("DOMNodeInserted", function() {
		var children = debugMessaging.childNodes;
		for (var i = 0; i < children.length; i++) {
			var current = children[i];
			if (current.id.indexOf("debug-port-") === 0) {
				var port = parseInt(current.innerHTML, 10);
				debugMessaging.removeChild(current);
				if (isNaN(port) || !(1000 <= port && port < 65535)) {
					var responseLabel = document.createElement('label');
					responseLabel.setAttribute('id', 'debug-error');
					responseLabel.style.display = 'none';
					responseLabel.innerHTML = "Invalid port, value must be 1000 - 65535";
					debugMessaging.appendChild(responseLabel);
				} else {
					var url = "http://localhost:" + port + "/json";
					var xhr = new XMLHttpRequest();
					xhr.onreadystatechange = function() {
						if (xhr.readyState === 4) {
							if (xhr.responseText.length > 0) {
								var responseLabel = document.createElement('label');
								responseLabel.setAttribute('id', 'debug-response-' + port);
								responseLabel.style.display = 'none';
								responseLabel.innerHTML = xhr.responseText;
								debugMessaging.appendChild(responseLabel);
							}
						}
					};
					xhr.open("GET", url, true);
					xhr.setRequestHeader('Cache-Control','no-cache');
					xhr.send(null);
				}
			}
		}
	});
}
