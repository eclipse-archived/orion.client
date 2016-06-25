/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - Allow original requirejs plugin to find files in Orion workspace
 *******************************************************************************/
/* eslint-disable missing-nls */
/*eslint-env node, amd*/
/*globals tern tern */
define([
	"tern/lib/tern",
	"beautifier/beautifier"
], function(tern, Beautifier) {

	tern.registerPlugin("beautifier", /* @callback */ function(server, options) {
		return {
			//don't need any passes yet
		};
	});

	tern.defineQueryType("beautify", {
		takesFile: true,
		/**
		 * @callback
		 */
		run: function(server, query, file) {
			return format(query, file);
		}
	});

	/**
	 * @description Format the code using the right beautifier
	 * @param {Object} query The original Tern query object
	 * @param {Object} file The file object from Tern 
	 */
	function format(query, file) {
		// we should format using the right beautifier based on the file extension
		var args = query.args;
		var text = file.text;
		var contentType = "";
		if (args) {
			if (args.start && args.end) {
				text = file.text.substring(args.start, args.end);
			}
			contentType = args.contentType;
		}
		switch(contentType) {
			case "text/html" :
				return Beautifier.html_beautify(text, query.args.config);
			case "text/css" :
				return Beautifier.css_beautify(text, query.args.config);
			case "application/javascript" :
				return Beautifier.js_beautify(text, query.args.config);
		}
		return text;
	}
});
