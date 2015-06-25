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

define("orion/editor/stylers/text_x-git-ignore/syntax", ["orion/editor/stylers/lib/syntax"], function(mLib) { //$NON-NLS-1$ //$NON-NLS-0$

	var grammars = [];
	grammars.push.apply(grammars, mLib.grammars);
	grammars.push({
		id: "orion.gitignore", //$NON-NLS-0$
		contentTypes: ["text/x-git-ignore"], //$NON-NLS-1$
		patterns: [
			// http://git-scm.com/docs/gitignore
			{
				match: {match: "^\\s*#[^$]*", literal: "#"}, //$NON-NLS-1$
				name: "comment.line.number-sign.ignore" //$NON-NLS-1$
			}, {
				match: "^\\s*!", //$NON-NLS-0$
				name: "punctuation.operator.negation.ignore" //$NON-NLS-0$
			}
		]
	});
	return {
		id: grammars[grammars.length - 1].id,
		grammars: grammars,
		keywords: []
	};
});
