/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global window setTimeout */

function log (text) {
	var console = window.document.getElementById('console');
	if (!console) { return; }
	for (var n = 1; n < arguments.length; n++) {
		text += " ";
		text += arguments[n];
	}
	
	var document = console.contentWindow.document;
	var t = document.createTextNode(text);
	document.body.appendChild(t);
	var br = document.createElement("br");
	document.body.appendChild(br);
	if (!console.scroll) {
		console.scroll = true;
		setTimeout(function() {
			document.body.lastChild.scrollIntoView(false);
			console.scroll = false;
		}, 0);
	}
	
	//IE (causes all kinds of weird behaviour)
//	console.log(text);
}

function clearLog () {
	var console = window.document.getElementById('console');
	if (!console) { return; }
	var document = console.contentWindow.document;
	var body = document.body;
	while (body.hasChildNodes()) { body.removeChild(body.lastChild); }
}
