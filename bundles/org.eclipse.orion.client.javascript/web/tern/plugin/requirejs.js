/*eslint-env node, amd*/
/*globals tern */
(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    return mod(require("../lib/infer"), require("../lib/tern"));
  if (typeof define == "function" && define.amd) // AMD
    return define(["../lib/infer", "../lib/tern"], mod);
  mod(tern, tern);
})(function(infer, tern) {
  "use strict";

  //ORION
  function addInterfaceDep(inter, deps) {
  	if(inter) {
    	deps.push(inter);
    } else {
    	deps.push(infer.ANull);
    }
  }
    
  function getRequire(data) {
    if (!data.require) {
      data.require = new infer.Fn("require", infer.ANull, [infer.cx().str], ["module"], new infer.AVal);
      data.require.computeRet = function(_self, _args, argNodes) {
        if (argNodes.length && argNodes[0].type == "Literal" && typeof argNodes[0].value == "string") {
          var _i = getInterface(argNodes[0].value, data); //ORION
          if(_i) {
          	return _i;
          }
        }
        return infer.ANull;
      };
    }
    return data.require;
  }

  var EXPORT_OBJ_WEIGHT = 50;

  function getModuleInterface(data, exports) {
    var mod = new infer.Obj(infer.cx().definitions.requirejs.module, "module");
    var expProp = mod.defProp("exports");
    var _m = getModule(stripJSExt(data.currentFile), data); //ORION
    if(_m) {
 	   expProp.propagate(_m);
	}
    exports.propagate(expProp, EXPORT_OBJ_WEIGHT);
    return mod;
  }

  function getExports(data) {
  //ORION
    var _exports = new infer.Obj(true, "exports");
    var mod = getModule(stripJSExt(data.currentFile), data);
    if(mod) {
    	mod.addType(_exports, EXPORT_OBJ_WEIGHT);
    }
    return _exports;
  }

  function getInterface(name, data, resolved) {
    if (data.options.override && Object.prototype.hasOwnProperty.call(data.options.override, name)) {
      var over = data.options.override[name];
      if (typeof over === "string" && over.charAt(0) === "=") return infer.def.parsePath(over.slice(1));
      if (typeof over === "object") {
        var known = getKnownModule(name, data);
        if (known) return known;
        var scope = data.interfaces[stripJSExt(name)] = new infer.Obj(null, stripJSExt(name));
        infer.def.load(over, scope);
        return scope;
      }
      name = over;
    }
    known = getModule(name, data, resolved);
    if (known) {
      data.server.addFile(known.origin, known.contents, data.currentFile);
    }
    return known;
  }

  function getKnownModule(name, data, resolved) {
    var val = resolved; //ORION
  	if(val && val.file) {
    	return data.interfaces[stripJSExt(val.file)];
    }
    return null;
  }

  function getModule(name, data, resolved) {
    var known = getKnownModule(name, data, resolved);
    if (!known) {
      var val = resolved; //ORION
      if(val && val.file) {
	      known = data.interfaces[stripJSExt(val.file)] = new infer.AVal();
	      known.origin = val.file;
	      known.contents = val.contents;
	      known.reqName = name;
      }
    }
    return known;
  }

  function stripJSExt(f) {
    return f.replace(/\.js$/, '');
  }

  infer.registerFunction("requireJS", function(_self, args, argNodes) {
    var server = infer.cx().parent, data = server && server._requireJS;
    if (!data || !args.length) return infer.ANull;

    var name = data.currentFile;
    var out = data.interfaces[stripJSExt(name)] = new infer.AVal;
    out.origin = name;

    var deps = [], fn, _exports, mod;

    function interf(name, resolved) {
      if (name == "require") return getRequire(data);
      if (name == "exports") return _exports || (_exports = getExports(data));
      if (name == "module") return mod || (mod = getModuleInterface(data, _exports || (_exports = getExports(data))));
      return getInterface(name, data, resolved);
    }

    if (argNodes && args.length > 1) {
      var node = argNodes[args.length == 2 ? 0 : 1]; //ORION
      if (node.type == "Literal" && typeof node.value == "string") {
        addInterfaceDep(interf(node.value), deps); //ORION
      } else if (node.type == "ArrayExpression") for (var i = 0; i < node.elements.length; ++i) {
        var elt = node.elements[i];
        if (elt.type == "Literal" && typeof elt.value == "string") {
          addInterfaceDep(interf(elt.value, elt.resolved), deps); //ORION
        }
      }
    } else if (argNodes && args.length == 1 && argNodes[0].type == "FunctionExpression" && argNodes[0].params.length) {
      // Simplified CommonJS call
      addInterfaceDep(interf("require", data), deps); //ORION
      addInterfaceDep(interf("exports", data), deps); //ORION
      addInterfaceDep(interf("module", data), deps); //ORION
      fn = args[0];
    }

    if (!fn) {
      fn = args[Math.min(args.length - 1, 2)];
      if (!fn.isEmpty() && !fn.getFunctionType()) fn = null;
    }

    if (fn) {
      fn.propagate(new infer.IsCallee(infer.ANull, deps, null, out)); 
      out.originNode = fn.originNode;
    } else if (args.length) args[0].propagate(out);

    return infer.ANull;
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

  infer.registerFunction("requireJSConfig", function(_self, _args, argNodes) {
    var server = infer.cx().parent, data = server && server._requireJS;
    if (data && argNodes && argNodes.length && argNodes[0].type == "ObjectExpression") {
      var config = parseExprNode(argNodes[0]);
      for (var key in config) if (config.hasOwnProperty(key)) {
        var value = config[key], exists = data.options[key];
        if (!exists) {
          data.options[key] = value;
        } else if (key == "paths") {
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
      var prop = rjs.defProp(name.replace(/\./g, "`"));
      interfaces[name].propagate(prop);
      prop.origin = interfaces[name].origin;
    }
  }

  function postLoadDef(data) {
    var cx = infer.cx(), interfaces = cx.definitions[data["!name"]]["!requirejs"];
    var data = cx.parent._requireJS;
    if (interfaces) for (var name in interfaces.props) {
      interfaces.props[name].propagate(getInterface(name, data));
    }
  }

  tern.registerPlugin("requirejs", function(server, options) {
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
        postLoadDef: postLoadDef,
        typeAt: findTypeAt
      }
    };
  });

  function findTypeAt(_file, _pos, expr, type) {
    if (!expr || expr.node.type != "Literal" ||
        typeof expr.node.value != "string" || !expr.node.required)
      return type;

    // The `type` is a value shared for all string literals.
    // We must create a copy before modifying `origin` and `originNode`.
    // Otherwise all string literals would point to the last jump location
    type = Object.create(type);

    // Provide a custom origin location pointing to the require()d file
    var exportedType = expr.node.required;
    type.origin = exportedType.origin;
    type.originNode = exportedType.originNode;
    return type;
  }
/* eslint-disable missing-nls */
  var defs = {
    "!name": "requirejs",
    "!define": {
      module: {
        id: "string",
        uri: "string",
        config: "fn() -> ?"
      },
      config: {
        "!url": "http://requirejs.org/docs/api.html#config",
        baseUrl: {
          "!type": "string",
          "!doc": "the root path to use for all module lookups",
          "!url": "http://requirejs.org/docs/api.html#config-baseUrl"
        },
        paths: {
          "!type": "?",
          "!doc": "path mappings for module names not found directly under baseUrl. The path settings are assumed to be relative to baseUrl, unless the paths setting starts with a '/' or has a URL protocol in it ('like http:').",
          "!url": "http://requirejs.org/docs/api.html#config-paths"
        },
        shim: {
          "!type": "?",
          "!doc": "Configure the dependencies, exports, and custom initialization for older, traditional 'browser globals' scripts that do not use define() to declare the dependencies and set a module value.",
          "!url": "http://requirejs.org/docs/api.html#config-shim"
        },
        map: {
          "!type": "?",
          "!doc": "For the given module prefix, instead of loading the module with the given ID, substitute a different module ID.",
          "!url": "http://requirejs.org/docs/api.html#config-map"
        },
        config: {
          "!type": "?",
          "!doc": "There is a common need to pass configuration info to a module. That configuration info is usually known as part of the application, and there needs to be a way to pass that down to a module. In RequireJS, that is done with the config option for requirejs.config(). Modules can then read that info by asking for the special dependency 'module' and calling module.config().",
          "!url": "http://requirejs.org/docs/api.html#config-moduleconfig"
        },
        packages: {
          "!type": "?",
          "!doc": "configures loading modules from CommonJS packages. See the packages topic for more information.",
          "!url": "http://requirejs.org/docs/api.html#config-packages"
        },
        nodeIdCompat: {
          "!type": "?",
          "!doc": "Node treats module ID example.js and example the same. By default these are two different IDs in RequireJS. If you end up using modules installed from npm, then you may need to set this config value to true to avoid resolution issues.",
          "!url": "http://requirejs.org/docs/api.html#config-nodeIdCompat"
        },
        waitSeconds: {
          "!type": "number",
          "!doc": "The number of seconds to wait before giving up on loading a script. Setting it to 0 disables the timeout. The default is 7 seconds.",
          "!url": "http://requirejs.org/docs/api.html#config-waitSeconds"
        },
        context: {
          "!type": "number",
          "!doc": "A name to give to a loading context. This allows require.js to load multiple versions of modules in a page, as long as each top-level require call specifies a unique context string. To use it correctly, see the Multiversion Support section.",
          "!url": "http://requirejs.org/docs/api.html#config-context"
        },
        deps: {
          "!type": "?",
          "!doc": "An array of dependencies to load. Useful when require is defined as a config object before require.js is loaded, and you want to specify dependencies to load as soon as require() is defined. Using deps is just like doing a require([]) call, but done as soon as the loader has processed the configuration. It does not block any other require() calls from starting their requests for modules, it is just a way to specify some modules to load asynchronously as part of a config block.",
          "!url": "http://requirejs.org/docs/api.html#config-deps"
        },
        callback: {
          "!type": "fn()",
          "!doc": "A function to execute after deps have been loaded. Useful when require is defined as a config object before require.js is loaded, and you want to specify a function to require after the configuration's deps array has been loaded.",
          "!url": "http://requirejs.org/docs/api.html#config-callback"
        },
        enforceDefine: {
          "!type": "bool",
          "!doc": "If set to true, an error will be thrown if a script loads that does not call define() or have a shim exports string value that can be checked. See Catching load failures in IE for more information.",
          "!url": "http://requirejs.org/docs/api.html#config-enforceDefine"
        },
        xhtml: {
          "!type": "bool",
          "!doc": "If set to true, document.createElementNS() will be used to create script elements.",
          "!url": "http://requirejs.org/docs/api.html#config-xhtml"
        },
        urlArgs: {
          "!type": "string",
          "!doc": "Extra query string arguments appended to URLs that RequireJS uses to fetch resources. Most useful to cache bust when the browser or server is not configured correctly.",
          "!url": "http://requirejs.org/docs/api.html#config-urlArgs"
        },
        scriptType: {
          "!type": "string",
          "!doc": "Specify the value for the type='' attribute used for script tags inserted into the document by RequireJS. Default is 'text/javascript'. To use Firefox's JavaScript 1.8 features, use 'text/javascript;version=1.8'.",
          "!url": "http://requirejs.org/docs/api.html#config-scriptType"
        },
        skipDataMain: {
          "!type": "bool",
          "!doc": "Introduced in RequireJS 2.1.9: If set to true, skips the data-main attribute scanning done to start module loading. Useful if RequireJS is embedded in a utility library that may interact with other RequireJS library on the page, and the embedded version should not do data-main loading.",
          "!url": "http://requirejs.org/docs/api.html#config-skipDataMain"
        }
      },
      RequireJSError: {
        "prototype" : {
          "!proto": "Error.prototype",
          "requireType": {
            "!type": "string",
            "!doc": "A string value with a general classification, like 'timeout', 'nodefine', 'scripterror'.",
            "!url": "http://requirejs.org/docs/api.html#errors"
          },
          "requireModules": {
            "!type": "[string]",
            "!doc": "An array of module names/URLs that timed out.",
            "!url": "http://requirejs.org/docs/api.html#errors"
          }
        }
      }
    },
    requirejs: {
      "!type": "fn(deps: [string], callback: fn(), errback?: fn(err: +RequireJSError)) -> !custom:requireJS",
      onError: {
        "!type": "fn(err: +RequireJSError)",
        "!doc": "To detect errors that are not caught by local errbacks, you can override requirejs.onError()",
        "!url": "http://requirejs.org/docs/api.html#requirejsonerror"
      },
      load: {
        "!type": "fn(context: ?, moduleName: string, url: string)"
      },
      config: "fn(config: config) -> !custom:requireJSConfig",
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
