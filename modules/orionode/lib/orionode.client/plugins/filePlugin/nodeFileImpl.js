/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define(['plugins/filePlugin/fileImpl', 'orion/objects'], function(FileServiceImpl, objects) {
	// Override the Orion FileServiceImpl to remove the search method, which we don't support.
	function NodeFileServiceImpl() {
		FileServiceImpl.apply(this, arguments);
	}
	NodeFileServiceImpl.prototype = Object.create(FileServiceImpl.prototype);
	NodeFileServiceImpl.prototype.search = null;
	return NodeFileServiceImpl;
});