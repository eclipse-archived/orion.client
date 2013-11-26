/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define require*/
/**
 * Implements eslint's load-rules API for AMD. Our rules are loaded as AMD modules.
 */
define([
	"eslint/rules/eqeqeq",
	"eslint/rules/no-redeclare",
	"eslint/rules/no-undef",
	"eslint/rules/semi"
], function(eqeqeq, noredeclare, noundef, semi) {
	return function() {
		return {
			"eqeqeq": eqeqeq,
			"no-redeclare": noredeclare,
			"no-undef": noundef,
			"semi": semi
		};
	};
});
