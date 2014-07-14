/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd, node */
(function(root, factory) {
	if(typeof exports === 'object') {  //$NON-NLS-0$
		module.exports = factory(require('../util'), require, exports, module);  //$NON-NLS-0$
	}
	else if(typeof define === 'function' && define.amd) {  //$NON-NLS-0$
		define(['eslint/util', 'require', 'exports', 'module', 'logger'], factory);
	}
	else {
		var req = function(id) {return root[id];},
			exp = root,
			mod = {exports: exp};
		root.rules.noundef = factory(req, exp, mod);
	}
}(this, function(util, require, exports, module, Logger) {

	/**
	 * @name module.exports
	 * @description Exported rule
	 * @function
	 * @param context
	 * @returns {Object} Exported AST nodes to lint
	 */
	module.exports = function(context) {
		"use strict";  //$NON-NLS-0$
		
		function fallsthrough(node) {
		    // cases with no statements or only a single case are implicitly fall-through
		    if(node.consequent) {
		        var statements = node.consequent;
		        if(statements.length > 0 && statements[0].type === 'BlockStatement') {
		            statements = statements[0].body;
		        }
		        if(statements.length < 1) {
					return false;
				}
		        var statement = null;
		        for(var i = 0; i < statements.length; i++) {
		            statement = statements[i];
		            if(util.returnableStatement(statement)) {
		                return false;
		            }
		        }
		        return true;
		    }
		    return false;
		}
		
		return {
			'SwitchStatement' : function(node) {
			    try {
    			    if(node.cases && node.cases.length > 1) {
    			        //single case is implicitly fallthrough
    			        var caselen  = node.cases.length;
    			       cases: for(var i = 0; i < caselen; i++) {
    			            if(i+1 === caselen) {
    			                //last node is implicitly fall-through
    			                break;
    			            }
    			            if(fallsthrough(node.cases[i])) {
    			                //corect the highlighting to match eclipse
    			                var reportednode = node.cases[i+1];
    			                if(reportednode.test) {
    			                    reportednode.range[1] = reportednode.test.range[1];
    			                } else {
    			                    //default case - tag the token
    			                    var tokens = context.getTokens(reportednode);
    			                    if(tokens && tokens.length > 0) {
    			                        reportednode.range[1] = tokens[0].range[1];
    			                    }
    			                }
    			                var len = reportednode.leadingComments ? reportednode.leadingComments.length : 0;
    			                if(len > 0) {
                		            var comment = null;
                		            for(var c = 0; c < len; c++) {
                		                comment = reportednode.leadingComments[c];
                		                if(/\s*\$FALLTHROUGH\$\s*/.test(comment.value)) {
                		                    continue cases;
                		                }
                		            }
                		        }
    			                context.report(reportednode, 'Switch case may be entered by falling through the previous case. If intended, add a new comment //$FALLTHROUGH$ on the line above.');
    			            }
    			        }
    			    }
			    }
			    catch(ex) {
			        Logger.log(ex);
			    }
			 }
		};
	};
	return module.exports;
}));
