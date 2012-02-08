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

/*global chrome*/
/*jslint browser:true*/

var incoming = document.getElementById("orion-debugMessaging-toExtension");
var outgoing = document.getElementById("orion-debugMessaging-toPage");

if (incoming && outgoing) {
	incoming.addEventListener("DOMNodeInserted", function() {
		var children = incoming.childNodes;
		for (var i = children.length - 1; i >= 0; i--) {
			var current = children[i];
			incoming.removeChild(current);
			chrome.extension.sendRequest({id: current.id, content: JSON.parse(current.innerText)}, function(response) {
				if (response && response.id) {
					var responseLabel = document.createElement('label');
					responseLabel.setAttribute('id', response.id);
					responseLabel.style.display = 'none';
					responseLabel.innerText = JSON.stringify(response.content);
					var outgoingChildren = outgoing.childNodes;
					if (outgoingChildren.length > 0) {
						outgoing.insertBefore(responseLabel, outgoingChildren[0]);
					} else {
						outgoing.appendChild(responseLabel);
					}
				}
			});
		}
	});

	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
		var eventLabel = document.createElement('label');
		eventLabel.setAttribute('id', request.id);
		eventLabel.style.display = 'none';
		eventLabel.innerText = JSON.stringify(request.content);
		var outgoingChildren = outgoing.childNodes;
		if (outgoingChildren.length > 0) {
			outgoing.insertBefore(eventLabel, outgoingChildren[0]);
		} else {
			outgoing.appendChild(eventLabel);
		}
		sendResponse({});
	});
}
