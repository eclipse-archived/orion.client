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
 
 define("orion/textview/nls/messages", {
    "root": {
        "multipleAnnotations": "Multiple annotations:",
        "line": "Line: {0}",
        "matchingBracket": "Matching Bracket",
        "currentBracket": "Current Bracket",
        "formatMessage": function(msg) {
			var args = arguments;
			return msg.replace(/\{([^\}]+)\}/g, function(str, index) { return args[(index << 0) + 1]; });
		}
    },
    "pt-br": true,
    "fr-fr": true
});