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
    * @description Computes the refs for the given arguments
    * @param {Object} ternserver The server to query
    * @param {Object} args The arguments
    * @param {Function} callback The callback to call once the request completes or fails
    * @since 9.0
    */
   function computeRefs(ternserver, args, callback) {
        if(ternserver) {
	       ternserver.request({
	           query: {
		           type: "refs",  //$NON-NLS-1$
		           file: args.meta.location,
		           end: args.params.offset,
		           newName: args.newname
	           },
	           files: args.files}, 
	           function(error, refs) {
	               if(error) {
	                   callback({request: 'refs', error: error.message, message: 'Failed to find refs'}); //$NON-NLS-1$
	               } else if(refs && Array.isArray(refs.refs)) {
        			   callback({request: 'refs', refs:refs.refs}); //$NON-NLS-1$
	               } else {
	               		callback({request: 'refs', refs:[]}); //$NON-NLS-1$
	               }
	           });
	   } else {
	       callback({request: 'refs', message: 'failed to find refs - server not started'}); //$NON-NLS-1$
	   }
   }
   
   return {
       computeRefs: computeRefs
   };
});