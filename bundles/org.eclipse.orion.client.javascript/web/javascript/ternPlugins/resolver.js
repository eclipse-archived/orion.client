/*******************************************************************************
 * @license
 * Copyright (c) 2015, 2016 IBM Corporation and others.
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
	        //we will try again for a timed out read
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
		if(_resolved[key].pending || _resolved[key].err) {
			//if we are waiting don't fire of another request
			return;
		}
		var resetPending = function(key) {
			clearTimeout(_resolved[key].timeout);
			_resolved[key].file = null;
			_resolved[key].contents = '';
			_resolved[key].err = "Read operation timed out."; //$NON-NLS-1$
			delete _resolved[key].pending;
			server.finishAsyncAction(_resolved[key].err);
		};
  		server.startAsyncAction();
  		_resolved[key].pending = true;
  		_resolved[key].timeout = setTimeout(resetPending, 10000, key);
		server.options.getFile({logical: key, file: loc, env: _resolved[key].env}, function(err, _file) {
			clearTimeout(_resolved[key].timeout);
			_resolved[key].file = _file.file;
	   		_resolved[key].contents = typeof _file.contents === 'string' ? _file.contents : '';
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
	 * @param {Function} test An optional function callback to test the name of the dependency
	 * @since 9.0
	 */
	function doPostParse(server, ast, ignores, test) {
		if(Array.isArray(ast.dependencies) && ast.dependencies.length > 0) {
			for(var i = 0; i < ast.dependencies.length; i++) {
				var _d = _getDependencyName(ast.dependencies[i]);
				if(_d) {
					if(typeof _resolved[_d] === 'object') {
						continue; //we already resolved it or are trying, keep going
					}
					if(typeof ignores === 'object') {
						if(ignores[_d]) {
							continue;
						}
						if(typeof ignores.node === 'object' && ignores.node[_d]) {
							continue;
						}
						if(typeof ignores.requirejs === 'object' && ignores.requirejs[_d]) {
							continue;
						}
					}
					/**
					 * @since 11.0
					 * @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=481271
					 */
					if(typeof test === 'function' && !test(_d)) {
						continue;
					}
					_resolved[_d] = Object.create(null);
					_resolved[_d].env = ast.dependencies[i].env;
				}
				
			}
			resolveDependencies(server, ast.sourceFile ? ast.sourceFile.name : null);
		}  	
	}
	
	/**
	 * @description Resolve the dependency name
	 * @param {Object|String} dep
	 * @since 10.0
	 */
	function _getDependencyName(dep) {
		if(typeof dep === 'string') {
			return dep;
		} else if(dep && typeof dep === 'object') {
			return dep.value;
		}
		return null;
	}
	
	/**
	 * @description Get the resolved file for the given logical name
	 * @param {String} _name The logical name 
	 * @sinnce 9.0
	 */
	function getResolved(_name) {
		return _resolved[_name];
	}
	
	return {
		doPostParse: doPostParse,
		doPreInfer: doPreInfer,
		getResolved: getResolved
	};
});