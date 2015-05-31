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
	var contents = 'var foo = "bar";\n' +
						 "var bar = foo;\n" + 
						 "/*\n" + 
						 " * test demo\n" + 
						 "*/\n" + 
						 "function test(){\n" + 
						 "	var foo1 = bar.lastIndexOf(char, from);\n" + 
						 "}\n" + 
						"//Keep editting in this demo and try the content assit, probem validations and hover service!\n" +
						 "var foo2 = foo."; 
	var contents1 = 
						 '<div class="embeddedEditorParentOuter" id="embeddedEditor1">\n' + 
						 "</div>\n" + 
						 "<span>var foo2</span>"; 
	var embeddedEditor = new mEmbeddedEditor();
	embeddedEditor.create({parent: "embeddedEditor"}).then(function(editorViewer) {
		document.getElementById("progressMessageDiv").textContent = "Plugins loaded!";
		editorViewer.setContents(contents, "application/javascript");
	});
	embeddedEditor.create({parent: "embeddedEditor1",
						   contentType: "text/html",
						   contents: contents1});
});
