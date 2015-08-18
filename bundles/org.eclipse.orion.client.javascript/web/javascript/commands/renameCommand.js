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
'javascript/compilationUnit',
'i18n!javascript/nls/messages'
], function(Objects, Finder, Deferred, CU, Messages) {

	var deferred;
	var cachedContext;

	/**
	 * @description Creates a new rename command
	 * @constructor
	 * @public
	 * @param {ASTManager} ASTManager The backing AST manager
	 * @param {TernWorker} ternWorker The running Tern worker
	 * @returns {javascript.commands.RenameCommand} A new command
	 * @since 9.0
	 */
	function RenameCommand(ASTManager, ternWorker, scriptResolver) {
		this.astManager = ASTManager;
		this.ternworker = ternWorker;
		this.scriptResolver = scriptResolver;
		this.ternworker.addEventListener('message', function(evnt) {
			if(typeof(evnt.data) === 'object') {
				var _d = evnt.data;
				if(_d.request === 'rename') {
					var changes = _d.changes;
					if(changes && changes.changes && changes.changes.length > 0) {
						var ranges = changes.changes;
						// turn the ranges into offset / length
						var offsets = [ranges.length];
						for (var i = 0; i < ranges.length; i++) {
							offsets[i] = {
								offset: ranges[i].start,
								length: ranges[i].end - ranges[i].start
							};
						}
						var groups = [{data: {}, positions: offsets}];
						var linkModel = {groups: groups};
						deferred.resolve(cachedContext.exitLinkedMode());
						deferred.resolve(cachedContext.enterLinkedMode(linkModel));
					} else if(typeof(_d.error) === 'string') {
						cachedContext.setStatus({Severity: 'Warning', Message: _d.error}); //$NON-NLS-1$
					}
					deferred.resolve();
					deferred = null;
				}
			}
		});
		this.timeout = null;
	}

	Objects.mixin(RenameCommand.prototype, {
		/*
		 * override
		 * @callback
		 */
		execute: function(editorContext, options) {
			var that = this;
			return editorContext.getFileMetadata().then(function(metadata) {
				that.scriptResolver.setSearchLocation(metadata.parents[metadata.parents.length - 1].Location);
			    if(options.contentType.id === 'application/javascript') {
	    			return that._doRename(editorContext, options);
			    } else {
			        return editorContext.getText().then(function(text) {
			            var offset = options.offset;
			            var blocks = Finder.findScriptBlocks(text);
			            if(blocks && blocks.length > 0) {
			                var cu = new CU(blocks, {location:options.input, contentType:options.contentType});
	    			        if(cu.validOffset(offset)) {
	    			        	return that._doRename(editorContext, options);
	    			        }
				        }
			        });
			    }
			});
		},

		/**
		 * @description Actually do the work
		 * @function
		 * @private
		 * @param {orion.editor.EditorContext} editorContext The editor context
		 * @param {Object} params The parameters
		 * @returns {Deferred} A deferred to resolve
		 */
		_doRename: function _doRename(editorContext, params) {
			var that = this;
			return editorContext.getText().then(function(text) {
				cachedContext = editorContext;
				deferred = new Deferred();
				if(that.timeout) {
					clearTimeout(that.timeout);
				}
				that.timeout = setTimeout(function() {
					cachedContext.setStatus({Severity: 'Error', Message: Messages['renameFailedTimedOut']}); //$NON-NLS-1$
					if(deferred) {
						deferred.resolve();
					}
					that.timeout = null;
				}, 5000);
				var files = [{type:'full', name:params.input, text:text}]; //$NON-NLS-1$
				that.ternworker.postMessage({request:'rename', args:{params:{offset: params.offset}, files: files, meta:{location: params.input}, newname:''}}); //$NON-NLS-1$
				return deferred;
			});
		}
	});

	return {
		RenameCommand : RenameCommand
	};
});
