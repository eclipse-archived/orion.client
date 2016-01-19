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
/*globals Tautologistics */
define([
	'orion/Deferred',
	'orion/objects',
	'javascript/lru',
	'orion/metrics',
	'htmlparser2/parser',
], function(Deferred, Objects, LRU, Metrics, HtmlParser2) {

	var handler = {
		ast: null,
		tagstack: [],
		errors: [],
		attribstack: [],
	    onopentag: function(name, attribs, range){
	    	this.trailingTag = null;
	    	var node = Object.create(null);
	    	node.range = [0, 0];
	    	if(Array.isArray(range)) {
	    		node.range[0] = range[0];
	    		node.range[1] = range[1]; // Inline tags don't have separate onclosetag calls
	    		node.openrange = [range[0], range[1]];
	    	} 
	    	node.name = name;
	    	node.type = 'tag'; //$NON-NLS-1$
	    	
	    	node.attributes = Object.create(null);
	    	for (var i=0; i<this.attribstack.length; i++){
	    		var attrib = this.attribstack[i];
	    		if (attrib.name){
	    			node.attributes[attrib.name] = attrib;
	    		}
	    	}
 	    	node.children = [];
	    	var tag = this._getLastTag();
	    	if(tag) {
	    		tag.children.push(node);
	    	} else {
	    		this.ast.children.push(node);
	    	}
	    	this.attribstack = [];
	    	this.tagstack.push(node);
	    },
	    onclosetag: function(tagname, range){
	    	var tag = this._getLastTag();
	    	if(tag && tag.name === tagname) {
	    		if (range){
	    			tag.range[1] = range[1];
	    			tag.endrange = [range[0], range[1]];
    			} else {
    				// No matching closing tag or void element
    				// TODO Need to add tests for this, can it have children as well as text?
    				if (tag.openrange && tag.text){
    					tag.range[1] = tag.openrange[1] + tag.text.value.length;
    					tag.endrange = [tag.range[1], tag.range[1]];
    				}	
    			}
	    		this.tagstack.pop();
	    	}
	    },
	    onopentagname: function(name, rangeStart) {
	    	this.trailingTag = {name: name, start: rangeStart};
	    },
	    onattribname: function(name, rangeStart) {
	    	this.trailingAttrib = {name: name, start: rangeStart};
	    },
	    onattribute: function(name, value, range) {
	    	this.trailingAttrib = null;
	    	var node = Object.create(null);
	    	node.range = Array.isArray(range) ? [range[0], range[1]] : [0, 0];
	    	node.name = name;
	    	node.type = 'attr'; //$NON-NLS-1$
	    	node.value = value;
	    	this.attribstack.push(node);
	    },
	    onprocessinginstruction: function(name, data, range) {
	    	var node = Object.create(null);
	    	node.range = Array.isArray(range) ? [range[0], range[1]] : [0, 0];
	    	node.name = name;
	    	node.type = 'instr'; //$NON-NLS-1$
	    	node.value = data;
	    	var tag = this._getLastTag();
	    	if(tag) {
	    		tag.children.push(node);
	    	} else {
	    		this.ast.children.push(node);
	    	}
	    },
	    oncomment: function(data, range) {
	    	var node = Object.create(null);
	    	node.range = Array.isArray(range) ? [range[0], range[1]] : [0, 0];
	    	node.type = 'comment'; //$NON-NLS-1$
	    	node.data = data;
	    	
	    	var tag = this._getLastTag();
	    	if(tag) {
	    		tag.children.push(node);
	    	} else {
	    		this.ast.children.push(node);
	    	}
	    },
	    oncdatastart: function() {
	    	var node = Object.create(null);
	    	node.range = [0, 0];
	    	node.type = 'cdata'; //$NON-NLS-1$
	    },
	    ontext: function(text) {
	    	var node = Object.create(null);
	    	node.range = [0, 0];
	    	node.type = 'text'; //$NON-NLS-1$
	    	node.value = text;
	    	var tag = this._getLastTag();
	    	if(tag) {
	    		tag.text = node;
	    	}
	    },
	    onerror: function(error) {
	    	var err = Object.create(null);
	    	err.error = error;
	    	err.range = [0, 0];
	    	this.errors.push(err);
	    },
	    onend: function(range) {
	    	// The ordering is important here as trailing attributes need to be added to the tag
	    	if (this.trailingAttrib){
	    		// TODO Recover trailing value
	    		this.onattribute(this.trailingAttrib.name, null, [this.trailingAttrib.start,range[1]]);
	    	}
	    	if (this.trailingTag){
	    		this.onopentag(this.trailingTag.name, null, [this.trailingTag.start,range[1]]);
	    	}
	    	
	    	if(Array.isArray(range)) {
	    		this.ast.range[0] = this.ast.children.length > 0 ? this.ast.children[0].range[0] : 0;
	    		this.ast.range[1] = range[1];
	    	}
	    },
	    onreset: function() {
			this.ast = Object.create(null);
			this.ast.range = [0,0];
			this.ast.children = [];
			this.tagstack = [];
			this.comments = [];
			this.errors = [];
			this.attribstack = [];
	    },
	    _getLastTag: function() {
	    	if(this.tagstack && this.tagstack.length > 0) {
	    		return this.tagstack[this.tagstack.length-1];
	    	} 
	    	return null;
	    }
	};

	/**
	 * Provides a shared AST.
	 * @class Provides a shared parsed AST.
	 * @since 8.0
	 */
	function HtmlAstManager() {
		this.cache = new LRU(10);
	}

	Objects.mixin(HtmlAstManager.prototype, /** @lends webtools.HtmlAstManager.prototype */ {
		/**
		 * @param {orion.editor.EditorContext} editorContext
		 * @returns {orion.Promise} A promise resolving to the AST.
		 */
		getAST: function(editorContext) {
			var _self = this;
			return editorContext.getFileMetadata().then(function(metadata) {
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
		          return 'unknown'; //$NON-NLS-1$
		      }
		      return metadata.location;
		},

		/**
		 * @private
		 * @param {String} text The code to parse.
		 * @returns {Object} The AST.
		 */
		parse: function(text) {
			var parser = new HtmlParser2(handler, {decodeEntities: true, recognizeSelfClosing: true});
			var start = Date.now();
			parser.reset();
			parser.write(text);
			parser.done();
			var end = Date.now()-start;
			if(handler.ast) {
				handler.ast.source = text;
			}
			Metrics.logTiming('language tools', 'parse', end, 'text/html'); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			return handler.ast;
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
		HtmlAstManager : HtmlAstManager
	};
});
