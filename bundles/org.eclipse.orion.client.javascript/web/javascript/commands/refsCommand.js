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
'orion/Deferred',
'i18n!javascript/nls/messages'
], function(Objects, Finder, Deferred, Messages) {

	/**
	 * @description Creates a new rename command
	 * @constructor
	 * @public
	 * @param {TernWorker} ternWorker The running Tern worker
	 * @returns {javascript.commands.RenameCommand} A new command
	 * @since 10.0
	 */
	function RefsCommand(ternWorker, astManager, scriptResolver, cuProvider, searchClient) {
		this.ternworker = ternWorker;
		this.scriptresolver = scriptResolver;
		this.astmanager = astManager;
		this.cuprovider = cuProvider;
		this.searchclient = searchClient;
	}

	Objects.mixin(RefsCommand.prototype, {
		/**
		 * @callback
		 */
		execute: function(editorContext, options) {
			var that = this;
			var deferred = new Deferred();
			editorContext.getFileMetadata().then(function(metadata) {
				if(options.kind === 'project' && Array.isArray(metadata.parents) && metadata.parents.length > 0) {
					that.scriptresolver.setSearchLocation(metadata.parents[metadata.parents.length - 1].Location);
				} else {
					that.scriptresolver.setSearchLocation(null);
				}
			    if(options.contentType.id === 'application/javascript') {
	    			that._findRefs(editorContext, options, metadata, deferred);
			    } else {
			        return editorContext.getText().then(function(text) {
			            var offset = options.offset;
			        	var cu = that.cuprovider.getCompilationUnit(function(){
		            		return Finder.findScriptBlocks(text);
		            	}, {location:options.input, contentType:options.contentType});
    			        if(cu.validOffset(offset)) {
    			        	that._findRefs(editorContext, options, metadata, deferred);
    			        }
			        }, /* @callback */ function(err) {
			        	deferred.resolve('Could not compute references: failed to compute file text content');
			        });
			    }
			}, /* @callback */ function(err) {
				deferred.resolve('Could not compute references: failed to compute file metadata');
			});
			return deferred;
		},
		
		/**
		 * @description Performs the actual searching and type matching
		 * @function
		 * @private 
		 * @param {Object} editorContext The editor context
		 * @param {Object} options The map of options
		 * @param {Object} metadata The map of origin file metadata
		 * @param {orion.Deferred} deferred The backing Deffered to report back to
		 */
		_findRefs: function _findRefs(editorContext, options, metadata, deferred) {
			var that = this;
			return that.astmanager.getAST(editorContext).then(function(ast) {
				var node = Finder.findNode(options.offset, ast);
				if(node && node.type === 'Identifier') {
					that.ternworker.postMessage(
						{request: 'type', args: {meta: metadata, params: options}},  //$NON-NLS-1$
						function(type, err) {
							if(err) {
								deferred.resolve(err);
							} else {
								var searchParams = {keyword: node.name, resource: that.scriptresolver.getSearchLocation(), fileNamePatterns:["*.js"], caseSensitive: true }; //$NON-NLS-1$
								that.searchclient.search(searchParams, true, true).then(function(searchResult) {
									searchResult.forEach(function(fileItem) {
										if(fileItem.children) {
											for(var i = 0; i < fileItem.children.length; i++) {
												var matchingLine = fileItem.children[i];
												matchingLine.matches.forEach(function(match) {
													that._checkType(type, fileItem, match, searchParams, deferred);
												});
											}
										}
									});	
								}, /* @callback */ function(err) {
								}, /* @callback */ function(result) {
									//TODO progress
								});
						  }
					});
				}
			});
		},
		
		/**
		 * @description Compares one type object to the other. Types are considered the same if they
		 * come from the same origin, have the same location infos, the same inferred base type and the same prototype infos
		 * @function
		 * @private
		 * @param {Object} original The original type object
		 * @param {Object} type The type to compare to the original
		 * @returns {Boolean} If the types are considered equal
		 */
		_checkType: function _checkType(original, fileItem, match, searchParams, deferred) {
			this.ternworker.postMessage(
					{request: 'type', args: {meta:{location: fileItem.location}, params: {offset: match.end}}},  //$NON-NLS-1$
					function(type, err) { //$NON-NLS-1$
						deferred.progress({searchParams: searchParams, refResult: match});
					});
		}
	});

	return RefsCommand;
});
