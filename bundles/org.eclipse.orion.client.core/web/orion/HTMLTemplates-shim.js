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
/*global document addEventListener console*/
// HTML Templates Shim -- see http://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/templates/index.html

(function() {
	document.body.insertAdjacentHTML("beforeend", "<template id='__testTemplate__'><div></div></template>");
	var testTemplate = document.getElementById("__testTemplate__");
	var supportsTemplate = !! testTemplate.content;
	document.body.removeChild(testTemplate);
	if (supportsTemplate) {
		return;
	}

	var templatesDoc = document.implementation.createHTMLDocument("");

	function shimTemplate(template) {
		templatesDoc = templatesDoc || document.implementation.createHTMLDocument("");
		Object.defineProperty(template, "content", {
			value: templatesDoc.createDocumentFragment(),
			enumerable: true
		});
		Object.defineProperty(template, "innerHTML", {
			set: function(text) {
				while (this.content.firstChild) {
					this.content.removeChild(this.content.firstChild);
				}
				var template = templatesDoc.createElement("template");
				template.innerHTML = text;
				while (template.firstChild) {
					this.content.appendChild(template.firstChild);
				}
			},
			get: function() {
				var template = templatesDoc.createElement("template");
				template.appendChild(this.content.cloneNode(true));
				return template.innerHTML;
			}
		});
		while (template.firstChild) {
			template.content.appendChild(template.firstChild);
		}
	}

	// hide template styling
	var templateStyle = document.createElement("style");
	templateStyle.textContent = "template{display:none;}";
	document.head.appendChild(templateStyle);

	//process existing templateElements
	Array.prototype.forEach.call(document.querySelectorAll("template"), function(template) {
		if (!template.content) {
			shimTemplate(template);
		}
	});

	// listen for new template additions
	// Note: we use DOMNodeInserted because this has to happen synchronously to let code access the "content" property
	addEventListener("DOMNodeInserted", function(mutationEvent) {
		var target = mutationEvent.target;
		if (target.nodeType === 1 && target.localName === "template" && target.ownerDocument === document && !target.content) {
			shimTemplate(target);
		}
	});
}());