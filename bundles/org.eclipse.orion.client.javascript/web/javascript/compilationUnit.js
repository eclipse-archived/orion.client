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
     * @returns {CompilationUnit} The new CompiationUnit instance
     * @since 8.0
     */
    function CompilationUnit(sourceblocks, metadata) {
        this._init(sourceblocks, metadata);
    }
    
    Objects.mixin(CompilationUnit.prototype, {
        
        /**
         * @description Set up the compilation unit
         * @function
         * @private
         * @param {Array.<String>} sourceblocks The blocks of source to compute the unit from 
         * @param {Object} metadata The metadata describing the file this unit represents
         * @returns returns
         */
        _init: function _init(sourceblocks, metadata) {
            this._metadata = metadata;
            var _cursor = 0;
            this._source = '';
            for(var i = 0; i < sourceblocks.length; i++) {
                var block = sourceblocks[i];
                var pad = block.offset - _cursor;
                while(pad > 0) {
                    this._source += ' ';
                    pad--;
                }
                this._source += block.text;
                _cursor = this._source.length;
            }
        },
        
        /**
         * @description Returns the source of this compilation unit
         * @function
         * @returns {String} The source of the compilation unit
         */
        getSource: function getSource() {
            return this._source;
        },
        
        /**
         * @description Returns an EditorContext-like object tat can resolve promises for <code>getText</code> and <code>getFileMetadata</code>
         * @function
         * @returns {Object} The EditorContext object to use when parsing
         */
        getEditorContext: function getEditorContext() {
            var proxy = Object.create(null);
            var that = this;
            proxy.getText = function() {
                return new Deferred().resolve(that._source);
            };
            proxy.getFileMetadata = function() {
                return new Deferred().resolve(that._metadata);
            };
            return proxy;
        }
    });
    
    return CompilationUnit;
});