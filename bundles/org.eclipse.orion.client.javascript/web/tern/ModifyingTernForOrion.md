## Updating Tern in Orion

Fix tern.js:
- Disable ESLint in tern.js
- Include acorn/acorn/acorn_loose in imported modules of tern.js and infer.js
- Add additional pass during parse (after preParse pass is signalled).  Called 'parseOptions' which allows
orionAcorn to be set up with correct options. The pass must get acorn and acorn_loose passed in. In Tern 16 we participated 
in the preParse phase, but in Tern 18 the pass is short circuited when our html plugin returns text.
		var text = srv.signalReturnFirst("preParse", file.text, options) || file.text
	    // ORION: Add parseOptions pass to allow orionAcorn to setup the parser and modify the options
	    srv.signal("parseOptions", text, options, acorn, acornloose);
	    var ast = infer.parse(text, options)
- Add the needed functions to tern.js exports:
		exports.findDef = findDef; //ORION
	    exports.findExprType = findExprType; //ORION
	    exports.resolveFile = resolveFile; //ORION
	    exports.storeTypeDocs = storeTypeDocs; //ORION
	    exports.parseDoc = parseDoc; //ORION
	    exports.findRefs = findRefs; // ORION
	    exports.findRefsToProperty = findRefsToProperty; // ORION
	    exports.findRefsToVariable = findRefsToVariable; // ORION
	    exports.ternError = ternError; // ORION
- Support returning multiple declarations when guessing.  Rather than take just the first result, we modify
Tern to return all of the potential matches.  This is then displayed in the client so the user can select.
		//ORION When guessing, we return all potential matches to display in UI
		var result = getResult(type, srv, query);
		if (infer.didGuess()) {
			   if (type.potentialMatches) {
			      var temp = [];
			      for (var i = 0; i < type.potentialMatches.length; i++) {
				temp.push(getResult(type.potentialMatches[i], srv, query));
			      }
			      result.results = temp;
			   }
			}
			return result;
		};
	There also needs to be changes to infer.js to include potential matches:
 	 MemberExpression: function(node, scope) {
      var propN = propName(node), obj = findType(node.object, scope).getType();
      
      // ORION Collect potential matches
      if (obj) {
			var currentMatch = obj.getProp(propN);
			if (guessing && Array.isArray(obj.potentialMatches)) {
				var potentialMatches = obj.potentialMatches;
				var matchesProp = [];
				for(var i = 0, len = potentialMatches.length; i < len; i++) {
					var match = potentialMatches[i];
					var propMatch = match.getProp(propN);
					if (typeof propMatch !== "undefined") {
						if (typeof propMatch.originNode !== "undefined"
								&& typeof propMatch.origin !== "undefined") {
							if (propMatch.originNode.sourceFile) {
								if (propMatch.originNode.sourceFile.name === propMatch.origin) {
									matchesProp.push(propMatch);
								}
							}
						}
					}
				}
				if (matchesProp.length > 0) {
					currentMatch.potentialMatches = matchesProp;
				}
			}
			return currentMatch;
		}
      
      // Before Orion: if (obj) return obj.getProp(propN);
    Also:
	       var canon = canonicalType(matches);
	        if (canon) {
	        	guessing = true;
	        	
	        	// ORION
	        	if (matches.length > 0) {
	        		canon.potentialMatches = matches;
	        	}
	        	
	        	return canon;
	        }

Problems checking for truthiness
- tern.js when calling signalReturnFirst for preParse, we should check whether we are getting string text back, not truthiness
- signal.js in signalReturnFirst we should be checking for null/undefined, not truthiness

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
- CommonJS gets the AST using node.sourceFile.ast, our version of Acorn does not attach the ast here and will be undefined.  Check anywhere the ast is accessed from a node, isImport() and isModuleName()
	    // ORION In our version of Acorn the AST is not available on the given node
	    var ast = node.sourceFile.ast;
	    if (!ast){
	        var server = infer.cx().parent;
	        ast = server.fileMap[node.sourceFile.name];
	        if (!ast) return;
	        ast = ast.ast;
	    }
- Check that the indexed library plugins (express, amqp, etc.) get code completions, module name completions and correct type information.
One way to check is with no-undef-expression rule turned on, call a bogus function on the object returned from the require.  If no problem is found
there likely isn't type information for the return of the require.  The plugins have to hook into the node plugin using a special entry in their defs.
For Tern 18 this is !known_modules (previously !node).
- All of these plugins have dependencies on each other
- The file contents are resolved in node_modules, so modify it to get the content from resolver
	     // ORION Get the resolved file from Orion resolver plugin
	  	 var resolvedFile = resolver.getResolved(name);
	  	 if (resolvedFile){
	  	 	return resolvedFile.file;
	  	 }
- The CommonJS plugin adds modules and exports to every scope which we don't want.  The easiest way to turn this
off is to skip the withScope pass if the file is not running a node environment.  Will have to look at better solutions
in the future, see TODO in commonjs.js
		if (scope.originNode && scope.originNode.environments && scope.originNode.environments.node){
- The node plugin listens to beforeLoad and afterLoad events.  This causes two problems. 1) A wrapping scope is created for every file
which breaks any use of global properties, 2) We attempt to add every file to module exports even if the file isn't using node/es_module exports.
Current fix is to check that the we are running in a node environment:
		function usingNode(file) {
			if(/\.js$/g.test(file.name) && file.ast && file.ast.environments) {
	      	  	return file.ast.environments.node;
	      	}
	      	return false;
		}
	
	    server.on("beforeLoad", function(file) {
	      // ORION Only modify the scope if we are using node for dependencies in this file or we cannot use globals from other files
	      if (usingNode(file)){
	      	file.scope = this.mod.modules.buildWrappingScope(file.scope, file.name, file.ast)
	  	  }
	    })
	
	    server.on("afterLoad", function(file) {
	      // ORION Only collect exports for this file if we are using for dependencies in this file
	      if (usingNode(file)){
	        var mod = this.mod.modules.get(file.name)
	        mod.origin = file.name
	        this.mod.modules.signal("getExports", file, mod)
	      }
	    })

