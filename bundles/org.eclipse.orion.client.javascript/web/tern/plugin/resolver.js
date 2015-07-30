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
	'orion/editor/templates'
], function(mTemplates) {
	
	var _resolved = Object.create(null);
	
	/**
	 * @description Resolves the computed dependencies
	 * @param {TernServer} server The Tern server
	 * @param {String} loc The original file context location (from the AST)
	 * @since 9.0
	 */
	function resolveDependencies(server, loc) {
	    var keys = Object.keys(_resolved);
	    for (var i = 0; i < keys.length; i++) {
	        var key = keys[i];
	        var dep = _resolved[key];
	        if (dep && (dep.pending || dep.file)) {
	      	  continue;
	        }
	  		resolve(server, key, loc);
		}
	}
	
	/**
	 * @description Resolves the given key (logical name) via the server. This function starts an asynchronous job to resolve the
	 * script via the scriptResolver in the client
	 * @param {TernServer} server The server
	 * @param {String} key The logcial name to resolve
	 * @param {String} loc The original file context location (from the AST)
	 * @since 9.0
	 */
	function resolve(server, key, loc) {
		if(_resolved[key].pending) {
			//if we are waiting don't fire of another request
			return;
		}
  		server.startAsyncAction();
  		_resolved[key].pending = true;
		server.options.getFile({logical: key, file: loc}, function(err, _file) {
			_resolved[key].file = _file.file;
	   		_resolved[key].contents = _file.contents;
	   		_resolved[key].logical = _file.logical;
	   		_resolved[key].err = err;
	   		delete _resolved[key].pending;
	   		server.finishAsyncAction(err);
		});
	}
	
	/**
	 * @description Callback to cycle waiting for async jobs to finish
	 * @param {TernServer} server The server
	 */
	function waitOnResolve(server) {
    	var done = function() {
      		clearTimeout(timeout);
      		doPreInfer(server);
    	};
    	var timeout = setTimeout(done, server.options.fetchTimeout);
	}
	/**
	 * @description Default callback to be used durning the pre-infer phase of plugin loading
	 * @param {TernServer} server The server
	 * @param {Object} resolved The object containing names to be resolved
	 * @since 9.0
	 */
	function doPreInfer(server) {
	  	if(server.pending) {
			return waitOnResolve(server);
		}
		var done = true;
		var keys = Object.keys(_resolved);
		for(var i = 0; i < keys.length; i++) {
			if(_resolved[keys[i]]) {
				continue;
			}
			done = false;
			break;
		}
		if(!done) {
			return waitOnResolve(server);
		}
	}
	
	/**
	 * @description Default callback to be used durning the post-parse phase of plugin loading
	 * @param {TernServer} server The server
	 * @param {Object} ast The backing AST that was just parsed
	 * @param {Object} ignores A mapping of names that can be ignored
	 * @since 9.0
	 */
	function doPostParse(server, ast, ignores) {
		if(Array.isArray(ast.dependencies) && ast.dependencies.length > 0) {
			for(var i = 0; i < ast.dependencies.length; i++) {
				var _d = ast.dependencies[i].value;
				if(_d) {
					if(typeof(_resolved[_d]) === 'object') {
						continue; //we already resolved it or are trying, keep going
					}
					if(typeof(ignores) === 'object') {
						if(ignores[_d]) {
							continue;
						}
						if(typeof(ignores.node) === 'object' && ignores.node[_d]) {
							continue;
						}
						if(typeof(ignores.requirejs) === 'object' && ignores.requirejs[_d]) {
							continue;
						}
					}
					_resolved[_d] = Object.create(null);
				}
			}
			resolveDependencies(server, ast.sourceFile ? ast.sourceFile.name : null);
		}  	
	}
	
	/**
	 * @description Get the resolved file for the given logical name
	 * @param {String} _name The logical name 
	 * @sinnce 9.0
	 */
	function getResolved(_name) {
		return _resolved[_name];
	}
	
	/**
	 * @description Returns the corresponding {orion.editor.Template} object for the given metadata
	 * @private
	 * @param {Object} meta The metadata about the template
	 * @returns {orion.editor.Template} The corresponding template object
	 * @since 9.0
	 */
	function _getTemplate(meta) {
		if(meta.t) {
			return meta.t;
		}
		var t = new mTemplates.Template(meta.prefix, meta.description, meta.template, meta.name);
		meta.t = t;
		return t;
	}
	
	/**
	 * @description Gets the template kind of node
	 * @param {Object} node The AST node
	 * @returns {Object} The kind object or null
	 * @since 9.0
	 */
	function _getKind(node) {
		if(node) {
    		if(node.parents && node.parents.length > 0) {
	    		var parent = node.parents.pop();
	    		switch(parent.type) {
					case 'MemberExpression': {
						return { kind : 'member'}; //$NON-NLS-1$
					}
					case 'VariableDeclarator': {
						return null;
					}
					case 'FunctionDelcaration':
					case 'FunctionExpression': {
						if(offset < parent.body.range[0]) {
							return null;						
						}
						break;
					}
					case 'Property': {
						if(offset-1 >= parent.value.range[0] && offset-1 <= parent.value.range[1]) {
							return { kind : 'prop'}; //$NON-NLS-1$
						}
						return null;
					}
					case 'SwitchStatement': {
						return {kind: 'swtch'}; //$NON-NLS-1$
					}
				}
			}
    	}
		return {kind:'top'}; //$NON-NLS-1$
	}

	/**
	 * @description Returns the templates that apply to the given completion kind
	 * @public
	 * @param {Array.<Object>} templates The array of raw template data 
	 * @param {String} kind The kind of the completion
	 * @returns {Array} The array of templates that apply to the given completion kind
	 * @since 9.0
	 */
	function getTemplatesForNode(templates, node) {
		var kind = _getKind(node);
		if(kind && kind.kind) {
			var tmplates = [];
			var len = templates.length;
			for(var i = 0; i < len; i++) {
				var template = templates[i];
				if(template.nodes && template.nodes[kind.kind]) {
					tmplates.push(template);
				}
			}
			return tmplates.map(_getTemplate, this);
		}
	}
	
	return {
		doPostParse: doPostParse,
		doPreInfer: doPreInfer,
		getResolved: getResolved,
		getTemplatesForNode: getTemplatesForNode
	};
});