/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *   IBM Corporation - Initial API and implementation
 ******************************************************************************/
/* eslint-env amd */
define([
    
], function() {
   
   /**
    * @description Computes the declaration for the given arguments
    * @param {Object} ternserver The server to query
    * @param {Function} postMessage The callback to post back from the worker
    * @param {Object} args The arguments
    * @since 9.0
    */
   function computeDeclaration(ternserver, postMessage, args) {
       if(ternserver) {
	       ternserver.request({
	           query: {
		           type: "definition", 
		           file: args.meta.location,
		           end: args.params.offset,
	           }}, 
	           function(error, decl) {
	               if(error) {
	                   postMessage({error: error.message, message: 'Failed to compute declaration'});
	               }
	               if(Array.isArray(decl)) {
        			   postMessage({request: 'decl', decl:decl});
	               }
	           });
	   } else {
	       postMessage({message: 'failed to compute declaration, server not started'});
	   }
   }
   
   return {
       computeDeclaration: computeDeclaration
   };
});