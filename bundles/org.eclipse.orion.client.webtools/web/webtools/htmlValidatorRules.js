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
'webtools/tags',
"i18n!webtools/nls/problems",
"orion/i18nUtil"
], function(Tags, Messages, i18nUtil){
	
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
		addRule('tag', function(element){ //$NON-NLS-1$
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
		            issues.push(createProblem(attrs[name], 'attr-bans', i18nUtil.formatMessage(Messages['attr-bans'], name), opts['attr-bans'])); //$NON-NLS-1$
		        }
		    });
		    return issues;
		});
		// Tag closed
		addRule('tag', function(element){ //$NON-NLS-1$
			if (!opts['tag-close']) {
		        return [];
		    }
		    
	        if (element.name && element.openrange){
	        	if (!element.endrange || (element.endrange[0] === element.openrange[1] && element.endrange[1] === element.openrange[1])){
	        		if (Tags.voidElements.indexOf(element.name) < 0){
	        			return createProblem(element.openrange, 'tag-close', i18nUtil.formatMessage(Messages['tag-close'], element.name), opts['tag-close']); //$NON-NLS-1$
        			}
    			}
	        }
		});
		// Require img alt
		addRule('img', function(element){ //$NON-NLS-1$
			if (!opts['img-req-alt']) {
		        return [];
		    }
		
		    var a = element.attributes;
		
		    if (a && a.alt && a.alt !== '') {
		        return [];
		    }
		
		    return createProblem(element.openrange, 'img-req-alt', Messages['img-req-alt'], opts['img-req-alt']); //$NON-NLS-1$
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
		    return createProblem(ele.openrange, 'fig-req-figcaption', Messages['fig-req-figcaption'], opts['fig-req-figcaption']); //$NON-NLS-1$
		    
		}
		addRule('figure', figReqFigCaption); //$NON-NLS-1$
		addRule('figcaption', figReqFigCaption); //$NON-NLS-1$
		
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
		var stringSeverity = severity;
		if (typeof severity === 'number'){
			stringSeverity = severity === 2 ? "error" : "warning"; //$NON-NLS-1$ //$NON-NLS-2$
		}
		return {
			id: id,
			description: message,
			start: start,
			end: end,
			severity: stringSeverity ? stringSeverity : 'warning' //$NON-NLS-1$
		};
	}
	
	return {
		ruleMap: ruleMap,
	};
});
