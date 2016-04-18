## Updating Tern in Orion

Disable ESLint in tern.js

Include acorn/acorn/acorn_loose in imported modules of tern.js and infer.js
Pass acorn and acorn loose into the preParse function (orionAcorn) (may be in parseFile of tern.js)

Add the needed functions to tern.js exports:
  exports.findDef = findDef; //ORION
  exports.findExprType = findExprType; //ORION
  exports.resolveFile = resolveFile; //ORION
  exports.storeTypeDocs = storeTypeDocs; //ORION
  exports.parseDoc = parseDoc; //ORION
  exports.findRefs = findRefs; // ORION
  exports.findRefsToProperty = findRefsToProperty; // ORION
  exports.findRefsToVariable = findRefsToVariable; // ORION
  exports.ternError = ternError; // ORION

Fix the RequireJS plugin
RequireJS plugin needs to use the Orion 'resolver' plugin to resolve file paths
- Replace the functions getKnownModule and getModule with calls to resolver plugin
	  function getKnownModule(name, data) {
	  	// ORION Use resolver plugin
	    var val = resolver.getResolved(name);
	  	if(val && val.file) {
	    	return data.interfaces[stripJSExt(val.file)];
	    }
	    return null;
	  }
	
	  function getModule(name, data) {
	  	// ORION Use resolver plugin
	  	var known = getKnownModule(name, data);
	    if (!known) {
	      var val = resolver.getResolved(name); //ORION
	      if(val && val.file) {
		      known = data.interfaces[stripJSExt(val.file)] = new infer.AVal();
		      known.origin = val.file;
		      known.contents = val.contents;
		      known.reqName = name;
	      }
	    }
	    return known;
	  }	
- Add postParse and preInfer phases to call to resolver
		server.on("postParse", function(ast, text){
    		resolver.doPostParse(server, ast, infer.cx().definitions);
    	});
    	server.on("preInfer", function(ast, scope){
    		resolver.doPreInfer(server);
		});

Reduce the plugins to what we need.  Even though only a certain set of plugins will be started, having the plugins around can still cause problems.

- Remove commonjs

Alter the requrejs plugin to use the resolver plugin

*** THIS APPLIES TO OTHER PLUGINS?