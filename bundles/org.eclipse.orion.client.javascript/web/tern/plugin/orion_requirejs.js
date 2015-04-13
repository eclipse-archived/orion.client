/*eslint-env amd */
define([
'../lib/infer',
'../lib/tern',
], function(infer, tern) {
  "use strict";

  function getInterface(name, data, c) {
    if (name === "require") {
    	if (!data.require) {
	      data.require = new infer.Fn("require", infer.ANull, [infer.cx().str], ["module"], new infer.AVal);
	      data.require.computeRet = /* @callback */ function(_self, _args, argNodes) {
	        if (argNodes.length && argNodes[0].type === "Literal" && typeof argNodes[0].value === "string") {
	          return c(getInterface(argNodes[0].value, data, c));
	        }
	        return c(infer.ANull);
	      };
	    }
	    return c(data.require);
    }
    if (name === "module") {
    	return c(infer.cx().definitions.requirejs.module);
    }
    if (data.options.override && Object.prototype.hasOwnProperty.call(data.options.override, name)) {
      var over = data.options.override[name];
      if (typeof over === "string" && over.charAt(0) === "=") {
      	return c(infer.def.parsePath(over.slice(1)));
      }
      if (typeof over === "object") {
        var known = getKnownModule(name, data);
        if (known) {
        	return c(known);
        }
        var scope = data.interfaces[stripJSExt(name)] = new infer.Obj(null, stripJSExt(name));
        infer.def.load(over, scope);
        return c(scope);
      }
      name = over;
    }
	data.server.options.getFile({logical:name}, /* @callback */ function(err, file) {
  		var known = getKnownModule(file.file, data);
	    if (!known) {
	      known = getModule(file.file, data);
	      data.server.addFile(file.file, null, data.currentFile);
	    }
	    return c(known);
  	});
  }

  function getKnownModule(name, data) {
    return data.interfaces[stripJSExt(name)];
  }

  function getModule(name, data) {
    var known = getKnownModule(name, data);
    if (!known) {
      known = data.interfaces[stripJSExt(name)] = new infer.AVal;
      known.origin = name;
    }
    return known;
  }

  var EXPORT_OBJ_WEIGHT = 50;

  function stripJSExt(f) {
    return f.replace(/\.js$/, '');
  }

  infer.registerFunction("orionRequireJS", /* @callback */ function(_self, args, argNodes) {
    var server = infer.cx().parent, data = server && server._requireJS;
    if (!data || !args.length) {
    	return infer.ANull;
    }
    var name = data.currentFile;
    var out = getModule(name, data);
    var deps = [], fn;
    var _set = function(_t) {
		if(_t) {
 			deps.push(_t);
 			if (!fn) {
		      fn = args[Math.min(args.length - 1, 2)];
		      if (!fn.isEmpty() && !fn.getFunctionType()) {
		      	fn = null;
		      }
		    }
		
		    if (fn) {
		    	fn.propagate(new infer.IsCallee(infer.ANull, deps, null, out));
		    }
		    else if (args.length) {
		    	args[0].propagate(out);
			}
 		}
 		data.server.finishAsyncAction();
 		return infer.ANull;
	}
    if (argNodes && args.length > 1) {
      var node = argNodes[args.length === 2 ? 0 : 1];
      if (node.type === "Literal" && typeof node.value === "string") {
      	data.server.startAsyncAction();
        getInterface(node.value, data, _set);
      } else if (node.type === "ArrayExpression") for (var i = 0; i < node.elements.length; ++i) {
        var elt = node.elements[i];
        if (elt.type === "Literal" && typeof elt.value === "string") {
          if (elt.value === "exports") {
            var exports = new infer.Obj(true);
            deps.push(exports);
            out.addType(exports, EXPORT_OBJ_WEIGHT);
          } else {
          	data.server.startAsyncAction();
            getInterface(elt.value, data, _set);
          }
        }
      }
    } else if (argNodes && args.length === 1 && argNodes[0].type === "FunctionExpression" && argNodes[0].params.length) {
      // Simplified CommonJS call
      var exports = new infer.Obj(true);
      data.server.startAsyncAction();
      out.addType(exports, EXPORT_OBJ_WEIGHT);
      getInterface("require", data, _set);
      deps.push(exports);
      fn = args[0];
    }
  });

  // Parse simple ObjectExpression AST nodes to their corresponding JavaScript objects.
  function parseExprNode(node) {
    switch (node.type) {
    case "ArrayExpression":
      return node.elements.map(parseExprNode);
    case "Literal":
      return node.value;
    case "ObjectExpression":
      var obj = {};
      node.properties.forEach(function(prop) {
        var key = prop.key.name || prop.key.value;
        obj[key] = parseExprNode(prop.value);
      });
      return obj;
    }
  }

  function preCondenseReach(state) {
    var interfaces = infer.cx().parent._requireJS.interfaces;
    var rjs = state.roots["!requirejs"] = new infer.Obj(null);
    for (var name in interfaces) {
      var prop = rjs.defProp(name.replace(/\./g, "`"));
      interfaces[name].propagate(prop);
      prop.origin = interfaces[name].origin;
    }
  }

  function postLoadDef(data) {
    var cx = infer.cx(), interfaces = cx.definitions[data["!name"]]["!requirejs"];
    var data = cx.parent._requireJS;
    if (interfaces) {
    	for (var name in interfaces.props) {
      		interfaces.props[name].propagate(getInterface(name, data));
    	}
    }
  }

  tern.registerPlugin("orion_requirejs", function(server, options) {
    server._requireJS = {
      interfaces: Object.create(null),
      options: options || {},
      currentFile: null,
      server: server
    };

    server.on("beforeLoad", function(file) {
      this._requireJS.currentFile = file.name;
    });
    server.on("reset", function() {
      this._requireJS.interfaces = Object.create(null);
      this._requireJS.require = null;
    });
    return {
      defs: defs,
      passes: {
        preCondenseReach: preCondenseReach,
        postLoadDef: postLoadDef
      },
    };
  });

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
      "!type": "fn(deps: [string], callback: fn(), errback: fn()) -> !custom:orionRequireJS",
      onError: "fn(err: +Error)",
      load: "fn(context: ?, moduleName: string, url: string)",
      version: "string",
      isBrowser: "bool"
    },
    require: "requirejs",
    define: {
      "!type": "fn(deps: [string], callback: fn()) -> !custom:orionRequireJS",
      amd: {
        jQuery: "bool"
      }
    }
  };
});