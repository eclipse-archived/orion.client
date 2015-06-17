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
		           type: "rename",  //$NON-NLS-1$
		           file: args.meta.location,
		           end: args.params.offset,
		           newName: args.newname
	           },
	           files: args.files}, 
	           function(error, changes) {
	               if(error) {
	                   callback({request: 'rename', error: error.message, message: Messages['failedRename']}); //$NON-NLS-1$
	               } else if(changes && Array.isArray(changes.changes)) {
        			   callback({request: 'rename', changes:changes}); //$NON-NLS-1$
	               } else {
	               		callback({request: 'rename', changes:[]}); //$NON-NLS-1$
	               }
	           });
	   } else {
	       callback({request: 'rename', message: Messages['failedRenameNoServer']}); //$NON-NLS-1$
	   }
   }
   
   return {
       computeRename: computeRename
   };
});