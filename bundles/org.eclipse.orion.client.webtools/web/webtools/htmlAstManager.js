/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
/*globals Tautologistics */
define([
	'orion/Deferred',
	'orion/objects',
	'javascript/lru',
	'htmlparser/htmlparser'  //stays last, exports into global scope
], function(Deferred, Objects, LRU) {

	/**
	 * Provides a shared AST.
	 * @class Provides a shared parsed AST.
	 * @since 8.0
	 */
	function HtmlAstManager() {
		this.cache = new LRU.LRU(10);
	}
	
	Objects.mixin(HtmlAstManager.prototype, /** @lends webtools.HtmlAstManager.prototype */ {
		/**
		 * @param {orion.editor.EditorContext} editorContext
		 * @returns {orion.Promise} A promise resolving to the AST.
		 */
		getAST: function(editorContext) {
			var metadataPromise = (typeof editorContext.getFileMetadata === "function")
				? editorContext.getFileMetadata()
				: new Deferred().resolve({});
			var _self = this;
			return metadataPromise.then(function(metadata) {
				metadata = metadata || {};
				var loc = _self._getKey(metadata);
				var ast = _self.cache.get(loc);
				if (ast) {
					return new Deferred().resolve(ast);
				}
				return editorContext.getText().then(function(text) {
					ast = _self.parse(text);
					_self.cache.put(loc, ast);
					if(metadata.location) {
					    //only set this if the original metadata has a real location
					    ast.fileLocation = metadata.location;
					}
					return ast;
				});
			});
		},
		/**
		 * Returns the key to use when caching
		 * @param {Object} metadata The file infos 
		 */
		_getKey: function _getKey(metadata) {
		      if(!metadata.location) {
		          return 'unknown';
		      }    
		      return metadata.location;
		},
		
		/**
		 * @private
		 * @param {String} text The code to parse.
		 * @returns {Object} The AST.
		 */
		parse: function(text) {
		    var domResult;
			var handler = new Tautologistics.NodeHtmlParser.HtmlBuilder(function(error, dom) {
				if (!error) {
					//parsing done
					domResult = dom;
				}
			}, {ignoreWhitespace: true, includeLocation: true, verbose: false});
			var parser = new Tautologistics.NodeHtmlParser.Parser(handler);
			parser.parseComplete(text);
			domResult.source = text;
			return domResult;
		},

		/**
		 * Callback from the orion.edit.model service
		 * @param {Object} event An <tt>orion.edit.model</tt> event.
		 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
		 */
		onModelChanging: function(event) {
		    if(this.inputChanged) {
		        //TODO haxxor, eat the first model changing event which immediately follows
		        //input changed
		        this.inputChanged = null;
		    } else {
		        this.cache.remove(this._getKey(event.file));
		    }
		},
		/**
		 * Callback from the orion.edit.model service
		 * @param {Object} event An <tt>orion.edit.model</tt> event.
		 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
		 * @callback
		 */
		onDestroy: function(event) {
		    //TODO with multi-env we will not need to destory the cache each editor switch
		    //but we could do a consistency check
		},
		/**
		 * Callback from the orion.edit.model service
		 * @param {Object} event An <tt>orion.edit.model</tt> event.
		 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
		 */
		onSaving: function(event) {
		    this.cache.remove(this._getKey(event.file));
		},
		/**
		 * Callback from the orion.edit.model service
		 * @param {Object} event An <tt>orion.edit.model</tt> event.
		 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
		 */
		onInputChanged: function(event) {
		    this.inputChanged = event;
		    //TODO will add to mult-env
		}
	});
	return {
		HtmlAstManager : HtmlAstManager,
	};
});
