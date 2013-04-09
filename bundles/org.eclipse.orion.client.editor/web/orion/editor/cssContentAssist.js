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
/*global define */

define("orion/editor/cssContentAssist", [ //$NON-NLS-0$
	'orion/editor/templates', //$NON-NLS-0$
	'orion/editor/keywords' //$NON-NLS-0$
], function(mTemplates, mKeywords) {
	
	var templates = [
		{
			prefix: "rule", //$NON-NLS-0$
			description: "rule - class selector rule",
			template: ".${class} {\n\t${cursor}\n}" //$NON-NLS-0$
		},
		{
			prefix: "rule", //$NON-NLS-0$
			description: "rule - id selector rule",
			template: "#${id} {\n\t${cursor}\n}" //$NON-NLS-0$
		},
		{
			prefix: "width", //$NON-NLS-0$
			description: "width - width pixel style",
			template: "width: ${value}px;" //$NON-NLS-0$
		},
		{
			prefix: "height", //$NON-NLS-0$
			description: "height - height pixel style",
			template: "width: ${value}px;" //$NON-NLS-0$
		},
		{
			prefix: "background-image", //$NON-NLS-0$
			description: "background-image - image style",
			template: "background-image: url(\"${uri}\");" //$NON-NLS-0$
		},
		{
			prefix: "url", //$NON-NLS-0$
			description: "url - url image",
			template: "url(\"${uri}\");" //$NON-NLS-0$
		},
		{
			prefix: "@", //$NON-NLS-0$
			description: "import - import style sheet",
			template: "@import \"${uri}\";" //$NON-NLS-0$
		}
	];

	/**
	 * @name orion.contentAssist.CssContentAssistProvider
	 * @class Provides content assist for CSS keywords.
	 */
	function CssContentAssistProvider() {
	}
	CssContentAssistProvider.prototype = new mTemplates.TemplateContentAssist(mKeywords.CSSKeywords, templates);
	
	CssContentAssistProvider.prototype.getPrefix = function(buffer, offset, context) {
		var index = offset;
		while (index && /[A-Za-z\-\@]/.test(buffer.charAt(index - 1))) {
			index--;
		}
		return index ? buffer.substring(index, offset) : "";
	};

	return {
		CssContentAssistProvider: CssContentAssistProvider
	};
});
