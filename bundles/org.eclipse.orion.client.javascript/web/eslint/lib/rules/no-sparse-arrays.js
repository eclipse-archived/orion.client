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
		
		return {
			'ArrayExpression' : function(node){
			    if(node.elements.indexOf(null) > -1) {
			        context.report(node, "Sparse array declarations should be avoided.");
			    }
			}
		};
	};
});
