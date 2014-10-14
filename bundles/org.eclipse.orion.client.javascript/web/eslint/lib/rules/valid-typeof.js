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
/*eslint-env amd */
define([
],  function() {
	return function(context) {
		"use strict";  //$NON-NLS-0$
		
		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
		var symbols = ['undefined', 'object', 'function', 'boolean', 'number', 'string', 'symbol'];
		
		return {
			'UnaryExpression' : function(node){
			    if(node.operator === 'typeof') {
			        var parent = node.parent;
			        if(parent && parent.type === 'BinaryExpression' && 
			             (parent.right.type !== 'Literal' || symbols.indexOf(parent.right.value) < 0)) {
			            context.report(parent.right, "Invalid typeof comparison.");
			        }
			    }
			}
		};
	};
});
