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
'javascript/compilationUnit',
'orion/gSearchClient',
'orion/Deferred'
], function(Objects, Finder, CU, mGSearchClient, Deferred) {

	/**
	 * @description Creates a new rename command
	 * @constructor
	 * @public
	 * @param {TernWorker} ternWorker The running Tern worker
	 * @returns {javascript.commands.RenameCommand} A new command
	 * @since 10.0
	 */
	function RefsCommand(ternWorker, scriptResolver, serviceRegistry, fileClient) {
		this.ternworker = ternWorker;
		this.scriptResolver = scriptResolver;
		this.serviceRegistry = serviceRegistry;
		this.fileClient = fileClient;
		this.searchClient = new mGSearchClient.GSearchClient({serviceRegistry: this.serviceRegistry, fileClient: this.fileClient});
	}

	Objects.mixin(RefsCommand.prototype, {
		/*
		 * override
		 * @callback
		 */
		execute: function(editorContext, options) {
			var that = this;
			var deferred = new Deferred();
			editorContext.getFileMetadata().then(function(metadata) {
				var searchLoc = metadata.parents[metadata.parents.length - 1].Location;
				that.scriptResolver.setSearchLocation(searchLoc);
			    if(options.contentType.id === 'application/javascript') {
	    			that.findRefs(options.kind, searchLoc, editorContext, deferred);
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
			return deferred;
		},

		findRefs: function findRefs(kind, searchLoc, editorContext, deferred) {
			editorContext.getSelectionText().then(function(selText) {
				//TODO: Not sure about the difference between 'workspace' and 'project'. But only searchLoc will be different I think
				if(kind === 'workspace' || kind === 'project') {//Not sure 
					var searchParams = {keyword: selText, resource: searchLoc};
					this.searchClient.search(searchParams).then(function(searchResult) {
						if(searchResult) {
							//TODO: Attach detail items on each array items from searchResult, contract to be decided.
							//this.fillDetails(searchParams, searchResult);
						}
						//TODO: Need a default replace string?
						searchParams.replace = selText + "temporary";
						deferred.resolve({searchParams: searchParams, refResult: searchResult});
					}.bind(this), function(error) {
						//Handle error
					}.bind(this), function(result/*format of param to be decided*/) {
						//Handle progress
						//TODO: We need to incrementally feed the result back to UI.
						//deferred.progress(result);
					}.bind(this));
				}			
			}.bind(this), function(err) {
				console.log(err);
			});
		}
	});

	return RefsCommand;
});
