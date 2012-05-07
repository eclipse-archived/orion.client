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
/*global define document*/


var today= new Date();
var month = today.getMonth() + 1;
var day = today.getDate();
var year = today.getFullYear();
var node = document.getElementById("date");
if (node) {
	node.innerHTML = "<p>You are running this sample on " + month + "/" + day + "/" + year + "</p>";
}
