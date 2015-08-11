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
	'i18n!javascript/nls/workermessages'
], function(Messages) {
   
   /**
    * @description Computes the implementation for the given arguments
    * @param {Object} ternserver The server to query
    * @param {Object} args The arguments
    * @param {Function} callback The callback to call once the request completes or fails
    * @since 10.0
    */
   function computeImplementation(ternserver, args, callback) {
       if(ternserver) {
	       ternserver.request({
	           query: {
		           type: "implementation",  //$NON-NLS-1$
		           file: args.meta.location,
		           end: args.params.offset
	           },
	           files: args.files}, 
	           function(error, impl) {
	               if(error) {
	                   callback({request: 'implementation', error: error.message, message: Messages['failedToComputeImpl']}); //$NON-NLS-1$
	               }
	               if(impl && typeof(impl.start) === 'number' && typeof(impl.end) === "number") {
	               		callback({request: 'implementation', implementation:impl}); //$NON-NLS-1$
       			   } else {
       			   		callback({request: 'implementation', implementation: null}); //$NON-NLS-1$
       			   }
	           });
	   } else {
	       callback({request: 'implementation', message: Messages['failedToComputeImplNoServer']}); //$NON-NLS-1$
	   }
   }
   
   return {
       computeImplementation: computeImplementation
   };
});