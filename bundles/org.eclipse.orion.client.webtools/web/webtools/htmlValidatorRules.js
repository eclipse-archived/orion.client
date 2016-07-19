/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd, worker */
/**
 * Implements eslint's load-rules API for AMD. Our rules are loaded as AMD modules.
 */
define([
], function(){
	
	var defaultOptions = {
	    'attr-bans': [
	        'align',
	        'background',
	        'bgcolor',
	        'border',
	        'frameborder',
	        'longdesc',
	        'marginwidth',
	        'marginheight',
	        'scrolling',
	        'style',
	        'width'
	    ],
	    'indent-style': 'nonmixed',
	    'indent-width': 4,
	    'indent-width-cont': false,
	    'text-escape-spec-char': true,
	    'tag-bans': ['style', 'b', 'i'],
	    'tag-close': true,
	    'tag-name-lowercase': true,
	    'tag-name-match': true,
	    'tag-self-close': false,
	    'doctype-first': false,
	    'doctype-html5': false,
	    'attr-name-style': 'lowercase',
	    'attr-name-ignore-regex': false,
	    'attr-no-dup': true,
	    'attr-no-unsafe-chars': true,
	    'attr-quote-style': 'double',
	    'attr-req-value': true,
	    'id-no-dup': true,
	    'id-class-no-ad': true,
	    'id-class-style': 'underscore',
	    'class-no-dup': true,
	    'class-style': false,
	    'id-class-ignore-regex': false,
	    'href-style': false,
	    'img-req-alt': true,
	    'img-req-src': true,
	    'csslint': false,
	    'label-req-for': true,
	    'line-end-style': 'lf',
	    'line-max-len': false,
	    'line-max-len-ignore-regex': false,
	    'head-req-title': true,
	    'title-no-dup': true,
	    'title-max-len': 60,
	    'html-req-lang': false,
	    'lang-style': 'case'
	};
	
	function ruleMap(opts){
		var rules = {};
		function addRule(type, rule){
			if (!rules[type]){
				rules[type] = [rule];
			} else {
				rules[type].push(rule);
			}
		}
		// Banned attributes
		addRule('tag', function(element){
			// Banned Attrs
			var bannedAttrs = opts['attr-bans'];

		    if (!bannedAttrs || !element.attributes) {
		        return [];
		    }
		
		    var issues = [];
		
		    var attrs = element.attributes;
		    bannedAttrs.forEach(function (name) {
		        if (attrs[name]) {
		            issues.push(createProblem(attrs[name], 'attr-bans', 'The \'' + name + '\' attribute is banned.'));
		        }
		    });
		    return issues;
		});
		return rules;
	};
	
	function createProblem(node, id, message, severity){
		return {
			id: id,
			description: message,
			start: node.range[0],
			end: node.range[1],
			severity: severity ? severity : 'warning'
		};
	}
	
	return {
		ruleMap: ruleMap,
		defaultOptions: defaultOptions
	};
});
