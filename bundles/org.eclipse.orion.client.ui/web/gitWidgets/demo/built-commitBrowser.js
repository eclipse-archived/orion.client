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
/*eslint-env browser, amd*/
define(['gitWidgets/builder/commitBrowser'],
function(mCommitBrowser) {
	var commitBrowser = new mCommitBrowser("commitBrowser");
	commitBrowser.startup().then(function() {
		commitBrowser.displayCommit(null, "/gitapi/diff/0977fdc693d3cf8955304335ff11e8445dc85d45/file/libingw-OrionContent/OrionClient/", "1959585b786038e12ac72e44e5b170bbb3eb5aa6", "0977fdc693d3cf8955304335ff11e8445dc85d45");
	});
});
