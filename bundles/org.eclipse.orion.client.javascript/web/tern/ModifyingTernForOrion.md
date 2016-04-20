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

New options:
- Tern 18 - Tern now strips the projectDir from paths so we have to set a projectDir in ternDefaults.js
- Tern 18 - Completions has a new option, filter, the filters based on the text, set it to false

Fix the RequireJS plugin
RequireJS plugin needs to use the Orion 'resolver' plugin to resolve file paths
- Replace the function getModule with calls to resolver plugin
		function getModule(name, data) {
    	var known = getKnownModule(name, data);
	    if (!known) {
	      known = new infer.AVal();
	      // ORION
	      var resolvedFile = resolver.getResolved(stripJSExt(name)); // ORION
	      if (resolvedFile){
	      	data.interfaces[stripJSExt(name)] = known; // Only cache the interface if a file was found, allows checking for the file existence later
	        known.origin = resolvedFile.file;
	        known.contents = resolvedFile.contents;
	      }
	      /* Before Orion
	      known.origin = name;
	      */
	    }
	    return known;
  	}
- Change the server.addFile call in getInterface to include name and contents from the resolver
		// Cannot flatten/modify the path as it has to match what resolver.js caches
		//    if (!/^(https?:|\/)|\.js$/.test(name))
		//      name = resolveName(name, data);
		//    name = flattenPath(name);
		
		    var known = getKnownModule(name, data);
		
		    if (!known) {
		      known = getModule(name, data);
		      // ORION
		      if (known.origin){
		        data.server.addFile(known.origin, known.contents, data.currentFile);
		      }
		      /* Before Orion:
		      data.server.addFile(name, null, data.currentFile);
		      */
		    }
		    return known;
- Add postParse and preInfer phases to call to resolver
		server.on("postParse", function(ast, text){
    		resolver.doPostParse(server, ast, infer.cx().definitions);
    	});
    	server.on("preInfer", function(ast, scope){
    		resolver.doPreInfer(server);
		});
- Check that the paths used are correct.  For Tern 0.18.0 the projectDir was stripped from the path resulting in file names not matching.  Also remember to strip the extension from the name.

Reduce the plugins to what we need.  Even though only a certain set of plugins will be started, having the plugins around can still cause problems.

- Remove commonjs

Alter the requrejs plugin to use the resolver plugin

*** THIS APPLIES TO OTHER PLUGINS?