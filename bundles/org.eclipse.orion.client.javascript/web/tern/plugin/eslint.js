/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - Allow original requirejs plugin to find files in Orion workspace
 *******************************************************************************/
/* eslint-disable missing-nls */
/*eslint-env node, amd*/
/*globals tern tern */
define([
	"../lib/infer", 
	"../lib/tern",
	"orion/objects",
	"javascript/finder",
	"javascript/signatures",
	"javascript/util",
	"json!javascript/rules.json",
	"eslint/conf/environments",
	"orion/i18nUtil",
	"i18n!javascript/nls/workermessages"
], /* @callback */ function(infer, tern, objects, Finder, Signatures, Util, Rules, ESLintEnvs, i18nUtil, Messages) {

	tern.registerPlugin("eslint", /* @callback */ function(server, options) {
		return {
			//don't need any passes yet
    	};	
	});

	tern.defineQueryType("lint", {
		takesFile: true,
		run: function(server, query, file) {
			
		}
	})
});