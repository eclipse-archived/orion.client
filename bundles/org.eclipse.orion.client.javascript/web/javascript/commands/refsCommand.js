/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 /*eslint-env amd, browser*/
define([
'orion/objects',
'javascript/finder',
'javascript/compilationUnit'
], function(Objects, Finder, CU) {

	/**
	 * @description Creates a new rename command
	 * @constructor
	 * @public
	 * @param {TernWorker} ternWorker The running Tern worker
	 * @returns {javascript.commands.RenameCommand} A new command
	 * @since 10.0
	 */
	function RefsCommand(ternWorker, scriptResolver) {
		this.ternworker = ternWorker;
		this.scriptResolver = scriptResolver;
	}

	Objects.mixin(RefsCommand.prototype, {
		/*
		 * override
		 * @callback
		 */
		execute: function(editorContext, options) {
			var that = this;
			return editorContext.getFileMetadata().then(function(metadata) {
				that.scriptResolver.setSearchLocation(metadata.parents[metadata.parents.length - 1].Location);
			    if(options.contentType.id === 'application/javascript') {
	    			return that.findRefs();
			    } else {
			        return editorContext.getText().then(function(text) {
			            var offset = options.offset;
			            var blocks = Finder.findScriptBlocks(text);
			            if(blocks && blocks.length > 0) {
			                var cu = new CU(blocks, {location:options.input, contentType:options.contentType});
	    			        if(cu.validOffset(offset)) {
	    			        	return that.findRefs();
	    			        }
				        }
			        });
			    }
			});
		},

		findRefs: function findDefs(options) {
			//TODO
			if(options.kind === 'workspace') {

			} else if(options.kind === 'project') {

			}
			return [];
		}
	});

	return RefsCommand;
});
