/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *   IBM Corporation - Various improvements
 ******************************************************************************/
/*eslint-env amd */
define([
    'orion/Deferred',  //$NON-NLS-0$
	'orion/objects',  //$NON-NLS-0$
	'javascript/finder',
	'javascript/compilationUnit'
], function(Deferred, Objects, Finder, CU) {

	var deferred = null;

	var handler = function(event) {
		 if(deferred && typeof(event.data) === 'object') {
	        var _d = event.data;
	        if(_d.request === 'completions') {
	        	deferred.resolve(_d.proposals);
	        	deferred = null;
	        }
	     }
	};
	
	/**
	 * @description Creates a new TernContentAssist object
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} astManager An AST manager to create ASTs with
	 * @param {TernWorker} ternWorker The worker running Tern
	 */
	function TernContentAssist(astManager, ternWorker) {
		this.astManager = astManager;
		this.ternworker = ternWorker;
		this.ternworker.addEventListener('message', handler);
	}

	/**
	 * Main entry point to provider
	 */
	Objects.mixin(TernContentAssist.prototype, {

		/**
		 * Called by the framework to initialize this provider before any <tt>computeContentAssist</tt> calls.
		 */
		initialize: function() {
		    //override
		},
        
		/**
		 * @description Implements the Orion content assist API v4.0
		 */
		computeContentAssist: function(editorContext, params) {
			var self = this;
			return editorContext.getFileMetadata().then(function(meta) {
			    if(meta.contentType.id === 'text/html') {
			        return editorContext.getText().then(function(text) {
			            var blocks = Finder.findScriptBlocks(text);
			            if(blocks && blocks.length > 0) {
			                var cu = new CU(blocks, meta);
        			        if(cu.validOffset(params.offset)) {
        			            return self.astManager.getAST(cu.getEditorContext()).then(function(ast) {
        			            	self.ternworker.postMessage({request: 'addFile', args: {file: meta.location, source: ast.source}});
        			            	self.ternworker.postMessage({request: 'completions', args: {params: params, meta: meta}});
        			            	deferred = new Deferred();
                    				return deferred;
                    			});
        			        }
    			        }
			        });
			    } else {
			        return self.astManager.getAST(editorContext).then(function(ast) {
			        	self.ternworker.postMessage({request: 'addFile', args: {file: meta.location, source: ast.source}});
			        	self.ternworker.postMessage({request: 'completions', args: {params: params, meta: meta}});
			        	deferred = new Deferred();
                    	return deferred;
        			});
			    }
			});
		}
	});
	
	return {
		TernContentAssist : TernContentAssist
	};
});
