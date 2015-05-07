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
define(['embeddedEditor/builder/embeddedEditor'],
function(mEmbeddedEditor) {
	var embeddedEditor = new mEmbeddedEditor("embeddedEditor");
	embeddedEditor.startup().then(function() {
		document.getElementById("progressMessageDiv").textContent = "Plugins loaded!";
		embeddedEditor.initEditor();
		//embeddedEditor.editorView.inputMnager.setInput();
		//in case that fiel name and content changed/inputHCnaged, 
		//embeddedEditor.setInput("foo.bar", "dsafsafdsafsafsafsaf");
	});
});
