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
], function() {
	
	var _resolved = Object.create(null);
	
	/**
	 * @description Resolves the computed dependencies
	 * @param {TernServer} server The Tern server
	 * @since 9.0
	 */
	function resolveDependencies(server) {
	    var keys = Object.keys(_resolved);
	    for (var i = 0; i < keys.length; i++) {
	        var key = keys[i];
	        var dep = _resolved[key];
	        if (dep && (dep.pending || dep.file)) {
	      	  continue;
	        }
	  		resolve(server, key);
		}
	}
	
	/**
	 * @description Resolves the given key (logical name) via the server. This function starts an asynchronous job to resolve the
	 * script via the scriptResolver in the client
	 * @param {TernServer} server The server
	 * @param {String} key The logcial name to resolve
	 * @since 9.0
	 */
	function resolve(server, key) {
  		server.startAsyncAction();
  		_resolved[key].pending = true;
		server.options.getFile({logical: key}, function(err, _file) {
	 		_resolved[key].file = _file.file;
	   		_resolved[key].contents = _file.contents;
	   		_resolved[key].logical = _file.logical;
	   		delete _resolved.pending;
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
	 * @since 9.0
	 */
	function doPostParse(server, ast) {
		if(Array.isArray(ast.dependencies) && ast.dependencies.length > 0) {
			for(var i = 0; i < ast.dependencies.length; i++) {
				var _d = ast.dependencies[i].value;
				if(_d) {
					if(_resolved[_d] !== undefined) {
						continue; //we already resolved it or are trying, keep going
					}
					_resolved[_d] = Object.create(null);
				}
			}
			resolveDependencies(server);
		}  	
	}
	
	function getResolved(name) {
		return _resolved[name];
	}
	
	return {
		doPostParse: doPostParse,
		doPreInfer: doPreInfer,
		getResolved: getResolved
	};
});