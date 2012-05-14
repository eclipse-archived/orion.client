/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: 
 *		Felipe Heidrich (IBM Corporation) - initial API and implementation
 *		Silenio Quarti (IBM Corporation) - initial API and implementation
 ******************************************************************************/

/*global define*/

define(['orion/textview/i18n!orion/textview/nls/messages'], function(bundle) {
	var result = {
		root: {
			"multipleAnnotations": "Multiple annotations:",
			"line": "Line: ${0}",
			"breakpoint": "Breakpoint",
			"bookmark": "Bookmark",
			"task": "Task",
			"error": "Error",
			"warning": "Warning",
			"matchingSearch": "Matching Search",
			"currentSearch": "Current Search",
			"currentLine": "Current Line",
			"matchingBracket": "Matching Bracket",
			"currentBracket": "Current Bracket"
		}
	};
	Object.keys(bundle).forEach(function(key) {
		if (typeof result[key] === 'undefined') {
			result[key] = bundle[key];
		}
	});
	return result;
});