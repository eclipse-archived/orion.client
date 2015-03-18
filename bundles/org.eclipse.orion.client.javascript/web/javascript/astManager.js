/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2015 IBM Corporation and others.
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
	'orion/Deferred',
	'orion/objects',
	'orion/serialize',
	'javascript/lru',
	'orion/metrics'
], function(Deferred, Objects, Serialize, LRU, Metrics) {
	/**
	 * @description Object of error types
	 * @since 5.0
	 */
	var ErrorTypes = {
		/**
		 * @description Something unexpected has been found while parsing, most commonly a syntax error
		 */
		Unexpected: 1,
		/**
		 * @description A Syntax problem that reports the last entered token as the problem
		 */
		EndOfInput: 2
	};

	/**
	 * Provides a shared AST.
	 * @name javascript.ASTManager
	 * @class Provides a shared AST.
	 * @param {Object} esprima The esprima parser that this ASTManager will use.
	 */
	function ASTManager(esprima) {
		this.parser = esprima;
		this.cache = new LRU.LRU(10);
		if (!this.parser) {
			throw new Error("Missing parser");
		}
	}
	
	Objects.mixin(ASTManager.prototype, /** @lends javascript.ASTManager.prototype */ {
		/**
		 * @param {orion.editor.EditorContext} editorContext
		 * @returns {orion.Promise} A promise resolving to the AST.
		 */
		getAST: function(editorContext) {
			var _self = this;
			return editorContext.getFileMetadata().then(function(metadata) {
				var loc = _self._getKey(metadata);
				var ast = _self.cache.get(loc);
				if (ast) {
					return new Deferred().resolve(ast);
				}
				return editorContext.getText().then(function(text) {
					ast = _self.parse(text);
					_self.cache.put(loc, ast);
					if(metadata && metadata.location) {
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
		 * @since 8.0
		 */
		_getKey: function _getKey(metadata) {
		      if(!metadata || !metadata.location) {
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
		    var start = Date.now();
			try {
				var ast = this.parser.parse(text, {
					range: true,
					loc: true,
					tolerant: true,
					tokens: true,
					attachComment: true
				});
			} catch (e) {
				ast = this._emptyAST(text);
				ast.errors = [e];
			}
			var end = Date.now() - start;
			Metrics.logTiming('language tools', 'parse', end, 'application/javascript  - ('+(typeof(text) === 'string' ? text.length : '?')+' chars)');
			if (ast.errors) {
				this._computeErrorTypes(ast.errors);
				ast.errors = ast.errors.map(Serialize.serializeError);
			}
			ast.source = text;
			return ast;
		},
		/**
		 * @description Returns an empty AST in the event a parse failed with a thrown exception
		 * @function
		 * @private
		 * @param {String} text The text that failed to parse
		 * @returns {Object} A new, empty AST object
		 */
		_emptyAST: function(text) {
			var charCount = (text && typeof text.length === "number") ? text.length : 0;  //$NON-NLS-0$
			return {
				type: "Program", //$NON-NLS-0$
				body: [],
				comments: [],
				tokens: [],
				range: [0, charCount]
			};
		},
		/**
		 * @description Computes the problem type from the error and sets a 'type' property
		 * on the error object
		 * @function
		 * @private
		 * @param {Array} errors The error array from Esprima
		 */
		_computeErrorTypes: function(errors) {
			if(errors && Array.isArray(errors)) {
				errors.forEach(function(error) {
					var msg = error.message;
					//first sanitize it
					error.message = msg = msg.replace(/^Line \d+: /, '');
					if(/^Unexpected/.test(msg)) {
						error.type = ErrorTypes.Unexpected;
						if(/end of input$/.test(msg)) {
							error.type = ErrorTypes.EndOfInput;
						}
					}
				});
			}
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
		 */
		onInputChanged: function(event) {
		    this.inputChanged = event;
		}
	});
	return {
			ASTManager : ASTManager,
			ErrorTypes : ErrorTypes};
});
