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

/*global define*/

define("orion/editor/stylers/text_html/syntax", ["orion/editor/stylers/lib/syntax", "orion/editor/stylers/application_javascript/syntax", "orion/editor/stylers/text_css/syntax", "orion/editor/stylers/application_xml/syntax"], //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	function(mLib, mJS, mCSS, mXML) {

	var grammars = mLib.grammars.concat(mJS.grammars).concat(mCSS.grammars).concat(mXML.grammars);
	grammars.push({
		id: "orion.html",
		contentTypes: ["text/html"],
		patterns: [
			{
				include: "orion.xml"
			}, {
				/* override orion.xml#xmlDeclaration (no-op) */
				include: "#xmlDeclaration"
			}, {
				begin: "(?i)(<style)([^>]*)(>)",
				end: "(?i)(</style>)",
				captures: {
					1: {name: "entity.name.tag.html"},
					3: {name: "entity.name.tag.html"}
				},
				contentName: "source.css.embedded.html",
				patterns: [
					{
						include: "orion.css"
					}
				]
			}, {
				begin: "(?i)<script\\s*>|<script\\s.*?(?:language\\s*=\\s*(['\"])javascript\\1|type\\s*=\\s*(['\"])(?:text|application)/(?:javascript|ecmascript)\\2).*?>",
				end: "(?i)</script>",
				captures: {
					0: {name: "entity.name.tag.html"}
				},
				contentName: "source.js.embedded.html",
				patterns: [
					{
						include: "orion.js"
					}
				]
			}
		],
		repository: {
			xmlDeclaration: {}
		}
	});
	return {
		id: grammars[grammars.length - 1].id,
		grammars: grammars,
		keywords: []
	};
});
