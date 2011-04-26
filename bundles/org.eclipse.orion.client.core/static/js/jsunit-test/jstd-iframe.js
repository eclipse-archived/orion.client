/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/* Globals */

window.onload = function() {
	var message = {type:"frameReady" , response:""};
	if (window.opener) {
		window.opener.postMessage(JSON.stringify(message),"*");
	} else if (window.content) {
		window.content.postMessage(JSON.stringify(message),"*");
	}
};
