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
/*global define document */
// HTML Templates Shim -- see http://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/templates/index.html

define(function(){
	document.body.insertAdjacentHTML("beforeend", "<template id='__testTemplate__'><div></div></template>");
	var testTemplate = document.getElementById("__testTemplate__");
	var supportsTemplate = !!testTemplate.content;
	document.body.removeChild(testTemplate);

	var templateScripts = document.querySelectorAll("script[type='text/x-html-template']");
	var templateElements = supportsTemplate ? [] : document.querySelectorAll("template");
	if (templateScripts.length === 0 && templateElements.length === 0) {
		return;
	}

	if (!supportsTemplate) {
		var templateStyle = document.createElement("style");
		templateStyle.textContent = "template{display:none;}";
		document.head.appendChild(templateStyle);
	}

	var templatesDoc = document.implementation.createHTMLDocument("");

	// process templateScripts
	Array.prototype.forEach.call(templateScripts, function(templateScript) {
		var text = templateScript.textContent;
		if (text.match(/^\s*<!--/) && text.match(/-->\s*$/)) {
			text = text.replace(/^\s*<!--|-->\s*$/g, "");
		}
		templatesDoc.body.insertAdjacentHTML("beforeend", text);
	});
	var templates = templatesDoc.querySelectorAll("template");
	Array.prototype.forEach.call(templates, function(template) {
		if (!supportsTemplate) {
			template.content = templatesDoc.createDocumentFragment();
			while (template.firstChild) {
				template.content.appendChild(template.firstChild);
			}
		}
		document.body.appendChild(template);
	});
	templatesDoc.body.innerHTML = "";

	//process templateElements
	Array.prototype.forEach.call(templateElements, function(template) {
		template.content = templatesDoc.createDocumentFragment();
		while (template.firstChild) {
			template.content.appendChild(template.firstChild);
		}
	});
});