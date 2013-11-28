/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define document */
define(['orion/PageUtil'], function(PageUtil) {
	var input = PageUtil.matchResourceParameters();
	var resource = input.resource;
	var img = document.createElement("img"); //$NON-NLS-0$
	img.src = resource;
	document.body.appendChild(img);
});
