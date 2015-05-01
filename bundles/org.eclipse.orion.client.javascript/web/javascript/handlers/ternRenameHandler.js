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
    * @description Computes the complete rename changes for the given arguments
    * @param {Object} ternserver The server to query
    * @param {Object} args The arguments
    * @param {Function} callback The callback to call once the request completes or fails
    * @since 9.0
    */
   function computeRename(ternserver, args, callback) {
        if(ternserver) {
	       ternserver.request({
	           query: {
		           type: "rename", 
		           file: args.meta.location,
		           end: args.params.offset,
		           newName: args.newname
	           },
	           files: args.files}, 
	           function(error, changes) {
	               if(error) {
	                   callback({request: 'rename', error: error.message, message: 'Failed to rename changes'});
	               } else if(changes && Array.isArray(changes.changes)) {
        			   callback({request: 'rename', changes:changes});
	               } else {
	               		callback({request: 'rename', changes:[]});
	               }
	           });
	   } else {
	       callback({request: 'rename', message: 'failed to rename, server not started'});
	   }
   }
   
   return {
       computeRename: computeRename
   };
});