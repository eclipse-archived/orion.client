/* eslint-disable */
(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    return mod(require("../lib/infer"), require("../lib/tern"), require("./modules"));
  if (typeof define == "function" && define.amd) // AMD
    return define(["../lib/infer", "../lib/tern", "./modules"], mod);
  mod(tern, tern);
})(function(infer, tern) {
  "use strict";

  function getRequire(data) {
    if (!data.require) {
      data.require = new infer.Fn("require", infer.ANull, [infer.cx().str], ["module"], new infer.AVal);
      data.require.computeRet = function(_self, _args, argNodes) {
        if (argNodes.length && argNodes[0].type == "Literal" && typeof argNodes[0].value == "string")
          return getInterface(path.join(path.dirname(data.currentFile), argNodes[0].value), data);
        return infer.ANull;
      };
    }
    return data.require;
  }
  
  var EXPORT_OBJ_WEIGHT = 50;

  function getModuleInterface(data, exports) {
    var mod = new infer.Obj(infer.cx().definitions.requirejs.module, "module");
    var expProp = mod.defProp("exports");
    expProp.propagate(getModule(data.currentFile, data));
    exports.propagate(expProp, EXPORT_OBJ_WEIGHT);
    return mod;
  }

  function getExports(data) {
    var exports = new infer.Obj(true, "exports");
    getModule(data.currentFile, data).addType(exports, EXPORT_OBJ_WEIGHT);
    return exports;
  }

  function getInterface(name, data) {
  	// TODO Is this check necessary now that getModule does a lookup, not a resolve?
	var parent = name !== data.currentFile ? data.currentFile : undefined;
	var data = data.server.mod.modules.resolveModule(name, parent);
	return data;
  }

  function getModule(name, data) {
  	return data.server.mod.modules.get(name)
  }

  var path = {
    dirname: function(path) {
      var lastSep = path.lastIndexOf("/");
      return lastSep == -1 ? "" : path.slice(0, lastSep);
    },
    relative: function(from, to) {
      if (to.indexOf(from) == 0) return to.slice(from.length);
      else return to;
    },
    join: function(a, b) {
      // TODO Orion the resolver plugin figures out the absolute path so we want to keep the relative path here for ./foo dependencies
      if (b /*&& b.charAt(0) != "."*/) return b;
      if (a && b) return a + "/" + b;
      else return (a || "") + (b || "");
    }
  };

  function runModule(server, args, argNodes, out) {
    var data = server.mod.requireJS;
    var deps = [], fn, exports, mod;

    function interf(name) {
      if (name == "require") return getRequire(data);
      if (name == "exports") return exports || (exports = getExports(data));
      if (name == "module") return mod || (mod = getModuleInterface(data, exports || (exports = getExports(data))));
      return getInterface(name, data);
    }

    if (argNodes && args.length > 1) {
      var node = argNodes[args.length == 2 ? 0 : 1];
      var base = path.relative(server.projectDir, path.dirname(node.sourceFile.name));
      if (node.type == "Literal" && typeof node.value == "string") {
        node.required = interf(path.join(base, node.value), data);
        deps.push(node.required);
      } else if (node.type == "ArrayExpression") for (var i = 0; i < node.elements.length; ++i) {
        var elt = node.elements[i];
        //ORION a sparse array entry will cause this to throw an error
        if (elt && elt.type == "Literal" && typeof elt.value == "string") {
          elt.required = interf(path.join(base, elt.value), data);
          deps.push(elt.required);
        }
      }
    } else if (argNodes && args.length == 1 &&
               /FunctionExpression/.test(argNodes[0].type) &&
               argNodes[0].params.length) {
      // Simplified CommonJS call
      deps.push(interf("require", data), interf("exports", data), interf("module", data));
      fn = args[0];
    }

    if (!fn) {
      fn = args[Math.min(args.length - 1, 2)];
      if (!fn.isEmpty() && !fn.getFunctionType()) fn = null;
    }

    if (fn) {
      fn.propagate(new infer.IsCallee(infer.ANull, deps, null, out || infer.ANull));
      if (out) out.originNode = fn.originNode;
    } else if (out) {
      args[0].propagate(out)
    }

    return infer.ANull;
  }

 infer.registerFunction("requirejs_define", function(_self, args, argNodes) {
    if (!args.length) return infer.ANull
    
    var server = infer.cx().parent, data = server.mod.requireJS
    return runModule(infer.cx().parent, args, argNodes, getModule(data.currentFile, data))
  });

  infer.registerFunction("requirejs_require", function(_self, args, argNodes) {
    if (!args.length) return infer.ANull
    return runModule(infer.cx().parent, args, argNodes)
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

  infer.registerFunction("requirejs_config", function(_self, _args, argNodes) {
    var server = infer.cx().parent, data = server && server.mod.requireJS;
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

  
// TODO Can we remove this as modules.js should propagate}//

//  function preCondenseReach(state//{
//  	var data = cx.parent.mod.require//;
//    var interfaces = infer.cx().parent.mod.requireJS.interfac//;
//    var rjs = state.roots["!requirejs"] = new infer.Obj(nul//;
//    for (var name in interfaces//{
//      var prop = rjs.defProp(name.replace(/\./g, "`"//;
//      var module = getModule(name, dat//;
//      if (modul//{
//      	module.propagate(pro//;
//      	prop.origin = module.orig//;
//    //}
//  //}
//  }
//
//  function postLoadDef(data) {
//    var cx = infer.cx(), interfaces = cx.definitions[data["!name"]]["!requirejs"];
//    var data = cx.parent.mod.requireJS;
//    if (interfaces) for (var name in interfaces.props) {
//      interfaces.props[name].propagate(getInterface(name, data));
//    }
//  }

  tern.registerPlugin("requirejs", function(server, options) {
    // TODO getExports?
    server.loadPlugin("modules");
    
    // TODO mod name tests, import tests
    // completable types rather than findCompletions
    
    server.mod.requireJS = {
      interfaces: Object.create(null),
      options: options || {},
      currentFile: null,
      server: server
    };

    server.on("beforeLoad", function(file) {
      this.mod.requireJS.currentFile = file.name;
    });
    server.on("reset", function(l){
      this.mod.requireJS.require = null;
    });

    server.mod.modules.modNameTests.push(isModuleName)
    // TODO Do we need a separate import checker?
//    server.mod.modules.importTests.push(isImport)
    server.mod.modules.completableTypes.Identifier = true;
    server.mod.modules.completableTypes.Literal = true;

    server.addDefs(defs);
    
});

  function _getAST(node){
  	// ORION In our version of Acorn the AST is not available on the given node
    var ast = node.sourceFile.ast;
    if (!ast){
        var server = infer.cx().parent;
        ast = server.fileMap[node.sourceFile.name];
        if (!ast) return;
        ast = ast.ast;
    }
    return ast;
  }
  
  function isModuleName(node) {
    if (node.type != "Literal" || typeof node.value != "string") return
    
    var callExpr = infer.findExpressionAround(_getAST(node), null, node.end, null, "CallExpression");
    if (!callExpr) return;
    var callNode = callExpr.node;
    if (callNode.callee.type != "Identifier") return;
    if (!(callNode.callee.name == "define" || callNode.callee.name == "require" || callNode.callee.name == "requirejs")) return
    if (callNode.arguments.length < 1 || (callNode.arguments[0].type != "ArrayExpression" && (callNode.arguments.length < 2 || callNode.arguments[1].type != "ArrayExpression"))) return;
    return node.value;
  }

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
      "!type": "fn(deps: [string], callback: fn(), errback?: fn(err: +RequireJSError)) -> !custom:requirejs_require",
      onError: {
        "!type": "fn(err: +RequireJSError)",
        "!doc": "To detect errors that are not caught by local errbacks, you can override requirejs.onError()",
        "!url": "http://requirejs.org/docs/api.html#requirejsonerror"
      },
      load: {
        "!type": "fn(context: ?, moduleName: string, url: string)"
      },
      config: "fn(config: config) -> !custom:requirejs_config",
      version: "string",
      isBrowser: "bool"
    },
    require: "requirejs",
    define: {
      "!type": "fn(deps: [string], callback: fn()) -> !custom:requirejs_define",
      amd: {
        jQuery: "bool"
      }
    }
  };
});