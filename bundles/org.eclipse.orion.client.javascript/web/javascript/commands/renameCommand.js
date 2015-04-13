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
 /*eslint-env amd*/
define([
'orion/objects',
'javascript/finder',
'javascript/signatures',
'orion/Deferred',
'javascript/compilationUnit'
], function(Objects, Finder, Signatures, Deferred, CU) {
	
	/**
	 * @description Creates a new rename command
	 * @constructor
	 * @public
	 * @param {ASTManager} ASTManager The backing AST manager
	 * @param {TernWorker} ternWorker The running Tern worker
	 * @returns {javascript.commands.GenerateDocCommand} A new command
	 * @since 9.0
	 */
	function RenameCommand(ASTManager, ternWorker) {
		this.astManager = ASTManager;
		this.ternWorker = ternWorker;
	}
	
	Objects.mixin(RenameCommand.prototype, {
		/* override
		 * @callback
		 */
		execute: function(editorContext, options) {
			var that = this;
			return editorContext.getFileMetadata().then(function(meta) {
			    if(meta.contentType.id === 'application/javascript') {
			        return that.astManager.getAST(editorContext).then(function(ast) {
        				that._doRename(editorContext, ast, options.offset);
        			});
			    } else {
			        return editorContext.getText().then(function(text) {
			            var offset = options.offset;
			            var blocks = Finder.findScriptBlocks(text);
			            if(blocks && blocks.length > 0) {
			                var cu = new CU(blocks, meta);
        			        if(cu.validOffset(offset)) {
        			            return that.astManager.getAST(cu.getEditorContext()).then(function(ast) {
        			               that._doRename(editorContext, ast, offset); 
        			            });
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
		 * @returns {Deferred} A deferred to insert the template
		 */
		_doRename: function _doRename(editorContext, ast, offset) {
			//TODO show dialog for new name
			//TODO request the worker
		}
	});
	
	return {
		RenameCommand : RenameCommand
	};
});