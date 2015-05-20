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
/* eslint-env amd */
define([
'orion/objects',
'orion/Deferred'
], function(Objects, Deferred) {
    
    /**
     * @name CompilationUnit
     * @description Creates a new CompilationUint instance. These instances should not be cached as they do
     * not respond to model change events.
     * @constructor 
     * @param {Array.<String>} sourceblocks The blocks of source to combine into one unit
     * @param {Object} metadata The metadata describing the file this unit represents
     * @param {Object} editorContext Optional editor context for the source file. Delegated to for setText and to get line information
     * @returns {CompilationUnit} The new CompiationUnit instance
     * @since 8.0
     */
    function CompilationUnit(sourceblocks, metadata, editorContext) {
        this._blocks = sourceblocks;
        this._metadata = metadata;
        this._ec = editorContext;
    }
    
    Objects.mixin(CompilationUnit.prototype, {
        
        /**
         * 
         * @description Builds the backing source for the compilation unit
         * @function
         * @private
         */
        /**
         * @name _getSource
         * @description Returns a promise to build the backing source text for the compilation unit, padding the blocks with spaces and newlines
         * @function
         * @private
         * @returns returns a promise that resolves to the source
         */
        _getSource: function _getSource() {
        	var promises = [];
        	if (this._ec && this._ec.getLineAtOffset){  // Tests use a fake editorContext with no line/offset functions
	            for (var i=0; i<this._blocks.length; i++) {
	            	var offset = this._blocks[i].offset;
	            	var length = this._blocks[i].text.length;
	            	promises.push(this._ec.getLineAtOffset(offset));
	            	promises.push(this._ec.getLineAtOffset(offset+length));
	            }
            }
            
        	var self = this;
            return Deferred.all(promises).then(function (lines){
            	var totalLength = 0;
            	var totalLines = 0;
            	var source = "";
            	for(var i = 0; i < self._blocks.length; i++) {
	                var block = self._blocks[i];
	    	        var pad = block.offset - totalLength;
	                var linePad = lines && lines.length > (i*2) ? lines[i*2] : 0;
	                linePad -= totalLines;
	    	        while(pad > 0 && linePad > 0){
	    	        	source += '\n'; //$NON-NLS-1$
	    	        	pad--;
	    	        	linePad --;
	    	        }
	                while(pad > 0) {
	                    source += ' '; //$NON-NLS-1$
	                    pad--;
	                }
	                source += block.text;
	                totalLength = source.length;
	                totalLines = lines && lines.length > (i*2) ? lines[(i*2)+1] : 0;
	            }
	            return source;
            });
        },
        
        /**
         * @description Returns if the given offset is valid compared to the blocks of code
         * that make up this unit
         * @function
         * @param {Number} offset The offset to check
         * @returns {Boolean} If the given offset is within any of the backing code blocks
         */
        validOffset: function validOffset(offset) {
            if(!this._blocks || this._blocks.length < 1 || offset < 0) {
		        return false;
		    }
		    for(var i = 0; i < this._blocks.length; i++) {
		        var block = this._blocks[i];
		        var idx = block.offset;
		        if(offset >= idx && offset <= idx+block.text.length) {
		            return true;
		        }
		    }
		    return false;
        },    
    
        /**
         * @description Returns an EditorContext-like object tat can resolve promises for <code>getText</code>, <code>setText</code> and <code>getFileMetadata</code>
         * @function
         * @returns {Object} The EditorContext object to use when parsing
         */
        getEditorContext: function getEditorContext() {
            var proxy = Object.create(null);
            var that = this;
            proxy.getText = function() {
                return new Deferred().resolve(that._getSource());
            };
            proxy.getFileMetadata = function() {
                return new Deferred().resolve(that._metadata);
            };
            proxy.setText = function(text, start, end) {
                if(that._ec && that._ec.setText) {
                    return that._ec.setText(text, start, end);
                } else {
                    return new Deferred().resolve(null);
                }
            };
            return proxy;
        }
    });
    
    return CompilationUnit;
});