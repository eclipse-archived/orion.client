/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
define("orion/editor/stylers/text_html/syntax", ["orion/editor/stylers/application_javascript/syntax", "orion/editor/stylers/text_css/syntax", "orion/editor/stylers/application_xml/syntax"], //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	function(mJS, mCSS, mXML) {

	var grammars = [];
	grammars.push.apply(grammars, mJS.grammars);
	grammars.push.apply(grammars, mCSS.grammars);
	grammars.push.apply(grammars, mXML.grammars);
	grammars.push({
		id: "orion.html", //$NON-NLS-0$
		contentTypes: ["text/html"], //$NON-NLS-0$
		repository: {
			attribute: {
				match: "hidden|high|href|hreflang|http-equiv|icon|id|ismap|itemprop|keytype|kind|label|lang|language|list|loop|low|manifest|max|maxlength|media|method|min|multiple|name|novalidate|open|optimum|pattern|ping|placeholder|poster|preload|pubdate|radiogroup|readonly|rel|required|reversed|rows|rowspan|sandbox|spellcheck|scope|scoped|seamless|selected|shape|size|sizes|span|src|srcdoc|srclang|srcset|start|step|style|summary|tabindex|target|title|type|usemap|value|width|wrap|border|buffered|challenge|charset|checked|cite|class|code|codebase|color|cols|colspan|content|contenteditable|contextmenu|controls|coords|data-[A-Za-z]+|data|datetime|default|defer|dir|dirname|disabled|download|draggable|dropzone|enctype|for|form|formaction|headers|height|accept|accept-charset|accesskey|action|align|alt|async|autocomplete|autofocus|autoplay|autosave|bgcolor", //$NON-NLS-0$
				name: "meta.tag.html.attribute" //$NON-NLS-0$
			}
		},
		patterns: [
			{
				begin: "(?i)(<style)([^>]*)(>)", //$NON-NLS-0$
				end: "(?i)(</style>)", //$NON-NLS-0$
				captures: {
					1: {name: "meta.tag.html"}, //$NON-NLS-0$
					3: {name: "meta.tag.html"} //$NON-NLS-0$
				},
				contentName: "source.css.embedded.html", //$NON-NLS-0$
				patterns: [
					{include: "orion.css"} //$NON-NLS-0$
				]
			}, {
				begin: "(?i)<script\\s*>|<script\\s.*?(?:language\\s*=\\s*(['\"])javascript\\1|type\\s*=\\s*(['\"])(?:text|application)/(?:javascript|ecmascript)\\2).*?>", //$NON-NLS-0$
				end: "(?i)</script>", //$NON-NLS-0$
				captures: {
					0: {name: "meta.tag.html"} //$NON-NLS-0$
				},
				contentName: "source.js.embedded.html", //$NON-NLS-0$
				patterns: [
					{include: "orion.js"} //$NON-NLS-0$
				]
			},
			{
				begin: "</?[A-Za-z0-9]+", //$NON-NLS-0$
				end: "/?>", //$NON-NLS-0$
				captures: {
					0: {name: "meta.tag.xml"}, //$NON-NLS-0$
				},
				name: "meta.tag.xml", //$NON-NLS-0$
				patterns: [
					{include: "orion.xml#comment"}, //$NON-NLS-0$
					{include: "orion.lib#string_doubleQuote"}, //$NON-NLS-0$
					{include: "orion.lib#string_singleQuote"}, //$NON-NLS-0$
					{include: "#attribute"} //$NON-NLS-0$
				]
			},
			{include: "orion.xml#comment"}, //$NON-NLS-0$
			{include: "orion.xml#doctype"}, //$NON-NLS-0$
			{include: "orion.xml#tag"}, //$NON-NLS-0$
			{include: "orion.xml#huy"}, //$NON-NLS-0$
			{include: "orion.xml#ampersandEscape"} //$NON-NLS-0$
		]
	});
	return {
		id: grammars[grammars.length - 1].id,
		grammars: grammars,
		keywords: []
	};
});
