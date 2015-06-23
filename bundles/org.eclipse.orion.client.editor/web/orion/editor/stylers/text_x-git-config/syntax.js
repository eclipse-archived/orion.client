/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/

define("orion/editor/stylers/text_x-git-config/syntax", ["orion/editor/stylers/lib/syntax"], function(mLib) { //$NON-NLS-1$ //$NON-NLS-0$

	var grammars = [];
	grammars.push.apply(grammars, mLib.grammars);
	grammars.push({
		id: "orion.xml", //$NON-NLS-0$
		contentTypes: ["text/x-git-config"], //$NON-NLS-1$
		patterns: [
			// http://git-scm.com/docs/git-config
			// Comments are lines starting with # or ;
			{
				match: "^\\s*\\#.*", //$NON-NLS-1$
				name: "comment.line.character.git" //$NON-NLS-1$
			},
//			{
//				match: {match: "(\\s*)([^=]*)(=.*)"}, //$NON-NLS-0$
//				captures: {
//					1: {name: "entity"},
//					2: {name: "keyword.operator.git"}, //$NON-NLS-0$
//					3: {name: "entity"}
//				}
//			},
		]
	});
	return {
		id: grammars[grammars.length - 1].id,
		grammars: grammars,
		keywords: []
	};
});
