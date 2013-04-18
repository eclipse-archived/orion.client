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
/*global define*/
/*jslint */
define(['require', 'orion/explorers/navigatorRenderer'], function(require, mNavigatorRenderer) {
	var NavigatorRenderer = mNavigatorRenderer.NavigatorRenderer;

	function MiniNavRenderer() {
		NavigatorRenderer.apply(this, arguments);
	}
	MiniNavRenderer.prototype = Object.create(NavigatorRenderer.prototype);
	// TODO see https://bugs.eclipse.org/bugs/show_bug.cgi?id=400121
	MiniNavRenderer.prototype.folderLink = require.toUrl("navigate/table.html"); //$NON-NLS-0$
	MiniNavRenderer.prototype.oneColumn = true;

	return MiniNavRenderer;
});
