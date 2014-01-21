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

define("orion/editor/stylers/html/html", ["orion/editor/stylers/shared/shared", "orion/editor/stylers/js/js", "orion/editor/stylers/css/css"], function(mShared, mJS, mCSS) { //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	var grammars = mShared.grammars.concat(mJS.grammars).concat(mCSS.grammars);
	grammars.push({
		id: "orion.html",
		contentTypes: ["text/html"],
		patterns: [
			{
				begin: "(<!(?:doctype|DOCTYPE))",
				end: "(>)",
				captures: {
					1: {name: "entity.name.tag.doctype.html"},
				},
				name: "meta.tag.doctype.html",
			}, {
				begin: "(<script)([^>]*)(>)",
				end: "(</script>)",
				captures: {
					1: {name: "entity.name.tag"},
					3: {name: "entity.name.tag"}
				},
				contentName: "source.js.embedded.html",
				patterns: [
					{
						include: "orion.js"
					}
				]
			}, {
				begin: "(<style)([^>]*)(>)",
				end: "(</style>)",
				captures: {
					1: {name: "entity.name.tag"},
					3: {name: "entity.name.tag"}
				},
				contentName: "source.css.embedded.html",
				patterns: [
					{
						include: "orion.css"
					}
				]
			}, {
				id: "comment",
				begin: "<!--",
				end: "-->",
				name: "comment.block"
			}, {
				begin: "(</?[A-Za-z0-9]+)",
				end: "(/?>)",
				captures: {
					1: {name: "entity.name.tag"},
				},
				name: "meta.tag.html",
				patterns: [
					{
						include: "#comment"
					}, {
						include: "orion.patterns#string"
					}, {
						include: "orion.patterns#string_singleQuote"
					}
				]
			}
		]
	});
	return {
		grammars: grammars,
		keywords: []
	};
});
