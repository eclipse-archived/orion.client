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

define("orion/editor/stylers/python/python", ["orion/editor/stylers/shared/shared"], function(mShared) { //$NON-NLS-0$
	var keywords = [
		"and", "as", "assert", //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"break", //$NON-NLS-0$
		"class", "continue", //$NON-NLS-1$ //$NON-NLS-0$
		"def", "del", //$NON-NLS-1$ //$NON-NLS-0$
		"exec", "elif", "else", "except", "Ellipsis", //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"False", "finally", "for", "from", //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"global", //$NON-NLS-0$
		"if", "import", "in", "is", //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"lambda", //$NON-NLS-0$
		"not", "None", "NotImplemented", //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"or", //$NON-NLS-0$
		"pass", "print", //$NON-NLS-1$ //$NON-NLS-0$
		"raise", "return", //$NON-NLS-1$ //$NON-NLS-0$
		"try", "True", //$NON-NLS-1$ //$NON-NLS-0$
		"while", "with", //$NON-NLS-1$ //$NON-NLS-0$
		"yield" //$NON-NLS-0$

	];

	var grammars = mShared.grammars;
	grammars.push({
		id: "orion.py",
		contentTypes: ["text/x-python"],
		patterns: [
			{
				include: "orion.patterns"
			}, {
				match: "\\b(?:" + keywords.join("|") + ")\\b",
				name: "keyword.control"
			}
		]
	});
	return {
		grammars: grammars,
		keywords: keywords
	};
});
