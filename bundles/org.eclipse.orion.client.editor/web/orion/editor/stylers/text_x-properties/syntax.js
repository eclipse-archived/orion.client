/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
define("orion/editor/stylers/text_x-properties/syntax", [], function() {
	var grammars = [];
	grammars.push({
		id: "orion.properties",
		contentTypes: ["text/x-properties"],
		patterns: [
			{
				match: "^\\s*#[^$]*",
				name: "comment.line.properties"
			}, {
				match: "(^[^=]*)(=)([^$]*)",
				captures: {
					1: {name: "entity.other.attribute-name.properties"},
					3: {name: "string.unquoted.properties"}
				}
			}, {
				match: "^[^=]*$",
				name: "string.unquoted.properties"
			}
		]
	});
	return {
		id: grammars[grammars.length - 1].id,
		grammars: grammars,
		keywords: []
	};
});
