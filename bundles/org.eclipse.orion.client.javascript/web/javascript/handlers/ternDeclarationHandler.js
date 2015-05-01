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
    * @description Computes the definition for the given arguments
    * @param {Object} ternserver The server to query
    * @param {Object} args The arguments
    * @param {Function} callback The callback to call once the request completes or fails
    * @since 9.0
    */
   function computeDeclaration(ternserver, args, callback) {
       if(ternserver) {
	       ternserver.request({
	           query: {
		           type: "definition", 
		           file: args.meta.location,
		           end: args.params.offset
	           },
	           files: args.files}, 
	           function(error, decl) {
	               if(error) {
	                   callback({request: 'definition', error: error.message, message: 'Failed to compute declaration'});
	               }
	               if(decl && typeof(decl.start) === 'number' && typeof(decl.end) === "number" &&
	               		decl.file === args.meta.location) { //TODO only work on local decls
       			   		callback({request: 'definition', declaration:decl});
       			   } else {
       			   		callback({request: 'definition', declaration: null});
       			   }
	           });
	   } else {
	       callback({request: 'definition', message: 'Failed to compute declaration, server not started'});
	   }
   }
   
   return {
       computeDeclaration: computeDeclaration
   };
});