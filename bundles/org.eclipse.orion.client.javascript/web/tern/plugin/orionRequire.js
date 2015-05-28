/*******************************************************************************
 * @license
 * Copyright (c) 2015 Marijn Haverbeke and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - Allow original requirejs plugin to find files in Orion workspace
 *******************************************************************************/
/*eslint-env node, amd*/
/*globals infer tern walk*/
(function(mod) {
  if (typeof exports === "object" && typeof module === "object") // CommonJS
    return mod(require("../lib/infer"), require("../lib/tern"), require("acorn/util/walk"));
  if (typeof define === "function" && define.amd) // AMD
    return define(["../lib/infer", "../lib/tern", "acorn/util/walk"], mod);
  mod(infer, tern, walk);
})(/* @callback */ function(infer, tern, walk) {
  "use strict";

  function getRequire(data) {
    if (!data.require) {
      data.require = new infer.Fn("require", infer.ANull, [infer.cx().str], ["module"], new infer.AVal); //$NON-NLS-1$ //$NON-NLS-2$
      data.require.computeRet = /* @callback */ function(_self, _args, argNodes) {
        if (argNodes.length && argNodes[0].type === "Literal" && typeof argNodes[0].value === "string") {
        	var inter = getInterface(argNodes[0].value, data);
        	if(inter) {
        		return inter;
        	}
        }
        return infer.ANull;
      };
    }
    return data.require;
  }

  function getInterface(name, data) {
  	//add caching checks
    if (name === "require") {
    	return getRequire(data);
    }
    if (name === "module") {
    	return infer.cx().definitions.requirejs.module;
    }
    if (data.options.override && Object.prototype.hasOwnProperty.call(data.options.override, name)) {
      var over = data.options.override[name];
      if (typeof over === "string" && over.charAt(0) === "=") {
      	return infer.def.parsePath(over.slice(1));
      }
      if (typeof over === "object") {
        var known = getKnownModule(name, data);
        if (known) {
        	return known;
        }
        var scope = data.interfaces[stripJSExt(name)] = new infer.Obj(null, stripJSExt(name));
        infer.def.load(over, scope);
        return scope;
      }
      name = over;
    }
	known = getModule(name, data);
	if (known) {
      data.server.addFile(known.origin, null, data.currentFile);
    }
	return known;
  }
  
  /**
   * @description Do a quick check to see if we have loaded this dep already.
   * Originally from Tern's built-in requirejs plugin
   * @param {String} name The name of the dependency
   * @param {Object} data The context data object used
   * @returns {Object} The mapped dependency or null if it could not be found
   */
  function getKnownModule(name, data) {
  	var val = data.server._requireJS.resolved[name];
  	if(val && val.file) {
    	return data.interfaces[stripJSExt(val.file)];
    }
    return null;
  }

  /**
   * @description Collects the referenced name from the resolved listing (if present)
   * @param {String} name The logical name
   * @param {Object} data The data context for the plugin
   * @returns {Object} The module (file context) if known
   */
  function getModule(name, data) {
    var known = getKnownModule(name, data);
    if (!known) {
      var val = data.server._requireJS.resolved[name];
      if(val && val.file) {
	      known = data.interfaces[stripJSExt(val.file)] = new infer.AVal;
	      known.origin = val.file;
      }
    }
    return known;
  }

  var EXPORT_OBJ_WEIGHT = 50;

  function stripJSExt(f) {
    return f.replace(/\.js$/, '');
  }

  infer.registerFunction("requireJS", /* @callback */ function(_self, args, argNodes) { //$NON-NLS-1$
    var server = infer.cx().parent, data = server && server._requireJS;
    if (!data || !args.length) return infer.ANull;

    var name = data.currentFile;
    var out = data.interfaces[stripJSExt(name)] = new infer.AVal;
    out.origin = name;
    
	//TODO add caching checks
    var deps = [], fn;
    if (argNodes && args.length > 1) {
      var node = argNodes[args.length === 2 ? 0 : 1];
      if (node.type === "Literal" && typeof node.value === "string") {
      	var inter = getInterface(node.value, data);
      	if(inter) {
        	deps.push(inter);
        }
      } else if (node.type === "ArrayExpression") {
      	for (var i = 0; i < node.elements.length; ++i) {
	        var elt = node.elements[i];
	        if (elt.type === "Literal" && typeof elt.value === "string") {
	          if (elt.value === "exports") {
	            var exports = new infer.Obj(true);
	            deps.push(exports);
	            out.addType(exports, EXPORT_OBJ_WEIGHT);
	          } else {
	          	inter = getInterface(elt.value, data);
	          	if(inter) {
	            	deps.push(inter);
	            }
	          }
	        }
        }
      }
    } else if (argNodes && args.length === 1 && argNodes[0].type === "FunctionExpression" && argNodes[0].params.length) {
      // Simplified CommonJS call
      var exports = new infer.Obj(true);
      inter = getInterface("require", data); //$NON-NLS-1$
      if(inter) {
      	deps.push(inter, exports);
      }
      out.addType(exports, EXPORT_OBJ_WEIGHT);
      fn = args[0];
    }

    if (!fn) {
      fn = args[Math.min(args.length - 1, 2)];
      if (!fn.isEmpty() && !fn.getFunctionType()) fn = null;
    }

    if (fn) fn.propagate(new infer.IsCallee(infer.ANull, deps, null, out));
    else if (args.length) args[0].propagate(out);

    return infer.ANull;
  });

  // Parse simple ObjectExpression AST nodes to their corresponding JavaScript objects.
  function parseExprNode(node) {
    switch (node.type) {
    case "ArrayExpression": //$NON-NLS-1$
      return node.elements.map(parseExprNode);
    case "Literal": //$NON-NLS-1$
      return node.value;
    case "ObjectExpression": //$NON-NLS-1$
      var obj = {};
      node.properties.forEach(function(prop) {
        var key = prop.key.name || prop.key.value;
        obj[key] = parseExprNode(prop.value);
      });
      return obj;
    }
  }

  infer.registerFunction("requireJSConfig", /* @callback */ function(_self, _args, argNodes) { //$NON-NLS-1$
    var server = infer.cx().parent, data = server && server._requireJS;
    if (data && argNodes && argNodes.length && argNodes[0].type === "ObjectExpression") {
      var config = parseExprNode(argNodes[0]);
      for (var key in config) if (config.hasOwnProperty(key)) {
        var value = config[key], exists = data.options[key];
        if (!exists) {
          data.options[key] = value;
        } else if (key === "paths") {
          for (var path in value) if (value.hasOwnProperty(path) && !data.options.paths[path])
            data.options.paths[path] = value[path];
        }
      }
    }
    return infer.ANull;
  });


  function preCondenseReach(state) {
    var interfaces = infer.cx().parent._requireJS.interfaces;
    var rjs = state.roots["!requirejs"] = new infer.Obj(null);
    for (var name in interfaces) {
      var prop = rjs.defProp(name.replace(/\./g, "`")); //$NON-NLS-1$
      interfaces[name].propagate(prop);
      prop.origin = interfaces[name].origin;
    }
  }

  /**
   * @description Rsolves the computed dependencies
   * @param {TernServer} server The Tern server
   * @since 9.0
   */
  function resolveDependencies(server) {
    var keys = Object.keys(server._requireJS.resolved);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var dep = server._requireJS.resolved[key];
      if (dep) {
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
	server.options.getFile({logical: key}, function(err, _file) {
	 	server._requireJS.resolved[key] = {
	   		file: _file.file,
	   		contents: _file.contents,
	   		logical: _file.logical
	   	};
	   	server.finishAsyncAction(err);
	});
  }

  /**
   * @description Callback to cycle waiting for async jobs to finish
   * @param {TernServer} server The server
   */
  function waitOnResolve(server) {
    var done = function() {
      //server.off("everythingFetched", done); //$NON-NLS-1$
      clearTimeout(timeout);
      doPreInfer(server);
    };
    //server.on("everythingFetched", done); //$NON-NLS-1$
    var timeout = setTimeout(done, server.options.fetchTimeout);
  }

  function doPreInfer(server) {
  	if(server.pending) {
		return waitOnResolve(server);
	}
	var done = true;
	var keys = Object.keys(server._requireJS.resolved);
	for(var i = 0; i < keys.length; i++) {
		if(server._requireJS.resolved[keys[i]]) {
			continue;
		}
		done = false;
		break;
	}
	if(!done) {
		return waitOnResolve(server);
	}
  }
  tern.registerPlugin("orionRequire", function(server, options) { //$NON-NLS-1$
    server._requireJS = {
      interfaces: Object.create(null),
      options: options || {},
      currentFile: null,
      server: server,
      resolved: Object.create(null)
    };

    server.on("beforeLoad", function(file) { //$NON-NLS-1$
      this._requireJS.currentFile = file.name;
    });
    server.on("reset", function() { //$NON-NLS-1$
      this._requireJS.interfaces = Object.create(null);
      this._requireJS.require = null;
      this._requireJS.fileMap = Object.create(null);
      this._requireJS.resolved = Object.create(null);
    });
    return {
      defs: defs,
      passes: {
        preCondenseReach: preCondenseReach,
        postLoadDef: function postLoadDef(data) {
		    var cx = infer.cx(), interfaces = cx.definitions[data["!name"]]["!requirejs"];
		    var data = cx.parent._requireJS;
		    if (interfaces) for (var name in interfaces.props) {
		      interfaces.props[name].propagate(getInterface(name, data));
		    }
		},
		/**
		 * @callback
		 */
		postParse: function postParse(ast, text) {
			if(server._requireJS && Object.keys(server._requireJS.resolved).length > 0) {
				return;
			}
			if(Array.isArray(ast.dependencies) && ast.dependencies.length > 0) {
				for(var i = 0; i < ast.dependencies.length; i++) {
					var _d = ast.dependencies[i].value;
					if(_d) {
						if(server._requireJS.resolved[_d]) {
							continue; //we already resolved it, keep going
						}
						server._requireJS.resolved[_d] = null;
					}
				}
				resolveDependencies(server);
			}  	
		},
		/**
		 * @callback
		 */
		preInfer: function preInfer(ast, scope) {
			doPreInfer(server);
		}
      }
    };
  });
  
/* eslint-disable missing-nls */
  var defs = {
    "!name": "requirejs", 
    "!define": {
      module: {
        id: "string", 
        uri: "string", 
        config: "fn() -> ?", 
        exports: "?" 
      }
    },
    requirejs: {
      "!type": "fn(deps: [string], callback: fn(), errback: fn()) -> !custom:requireJS", 
      onError: "fn(err: +Error)", 
      load: "fn(context: ?, moduleName: string, url: string)", 
      config: "fn(config: ?) -> !custom:requireJSConfig", 
      version: "string", 
      isBrowser: "bool" 
    },
    require: "requirejs", 
    define: {
      "!type": "fn(deps: [string], callback: fn()) -> !custom:requireJS", 
      amd: {
        jQuery: "bool" 
      }
    }
  };
});