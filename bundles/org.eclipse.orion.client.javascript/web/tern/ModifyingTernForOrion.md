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

Fixing node/modules/node_resolve/commonjs
- All of these plugins have dependencies on each other
- TODO: node_resolve is using script resolver to get the file, but doesn't pass the file contents onto Tern
- TODO : Do we want to prevent node plugin from running? Call this function in the beforeLoad/afterLoad events
        /**
		 * @description If we should be using the node plugin
		 * @param {Object} file The file object
		 * @returns {Boolean} If we should do any work in the node plugin
		 * @since 10.0
		 * Orion
		 */
		function usingNode(file) {
			if(/\.js$/g.test(file.name) && file.ast && file.ast.environments) {
	      	  	if(file.ast.environments.node) {
	      	  		return true;
	      	  	}
	      	  	if(typeof file.parent === 'string') {
	      	  		var p = server.fileMap[file.parent];
	      	  		if(p && p.ast && p.ast.environments) {
	      	  			return p.ast.environments.node;
	      	  		}
	      	  	}
	      	}
	      	return false;
		}

Alter the requrejs plugin to use the resolver plugin

*** THIS APPLIES TO OTHER PLUGINS?