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
	    'attr-bans': 0,
	    'attr-bans-config': [
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
	    'fig-req-figcaption': 1,
	    'img-req-alt': 1,
	    
	    
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
			if (!opts['attr-bans']) {
		        return [];
		    }
		    
			var bannedAttrs = opts['attr-bans-config'];
		    if (!bannedAttrs || !element.attributes) {
		        return [];
		    }
		
		    var issues = [];
		
		    var attrs = element.attributes;
		    bannedAttrs.forEach(function (name) {
		        if (attrs[name]) {
		            issues.push(createProblem(attrs[name], 'attr-bans', 'The \'' + name + '\' attribute is not recommended.', opts['attr-bans']));
		        }
		    });
		    return issues;
		});
		// Require img alt
		addRule('img', function(element){
			if (!opts['img-req-alt']) {
		        return [];
		    }
		
		    var a = element.attributes;
		
		    if (a && a.alt && a.alt !== '') {
		        return [];
		    }
		
		    return createProblem(element.openrange, 'img-req-alt', 'The \'alt\' property must be set for image tags (for accessibility).', opts['img-req-alt']);
		});
		// Require figcaption
		function figReqFigCaption(ele){
			if (!opts['fig-req-figcaption']) {
		        return [];
		    }
		
		    if (ele.name === 'figure') {
		        // get the children of this figure
		        var children = ele.children;
		
		        // check for a figcaption element
		        for (var i = 0; i < children.length; i++) {
		            if (children[i].name === 'figcaption') {
		                return [];
		            }
		        }
		    }
		    else if (ele.name === 'figcaption') {
		        if (ele.parent && ele.parent.name === 'figure'){
		            return [];
		        }
		    }
		    return createProblem(ele.openrange, 'fig-req-figcaption', '\'figure\' must have a \'figcaption\', \'figcaption\' must be in a \'figure\' (for accessibility).', opts['fig-req-figcaption']);
		    
		}
		addRule('figure', figReqFigCaption);
		addRule('figcaption', figReqFigCaption);
		
		/*
		 * label-req-for
fig-req-figcaption
id-no-dup

Not sure about these next two. Should we enforce them?
html-req-lang
doctype-html5
		 */
		
		return rules;
	}
	
	function createProblem(nodeOrRange, id, message, severity){
		var start, end = 0;
		if (Array.isArray(nodeOrRange)){
			start = nodeOrRange[0];
			end = nodeOrRange[1];	
		} else if (nodeOrRange.range){
			start = nodeOrRange.range[0];
			end = nodeOrRange.range[1];
		}
		if (typeof severity === 'number'){
			severity = severity === 2 ? "error" : "warning";
		}
		return {
			id: id,
			description: message,
			start: start,
			end: end,
			severity: severity ? severity : 'warning'
		};
	}
	
	return {
		ruleMap: ruleMap,
		defaultOptions: defaultOptions
	};
});
