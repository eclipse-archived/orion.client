/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation.
 *
 * THIS FILE IS PROVIDED UNDER THE TERMS OF THE ECLIPSE PUBLIC LICENSE
 * ("AGREEMENT"). ANY USE, REPRODUCTION OR DISTRIBUTION OF THIS FILE
 * CONSTITUTES RECIPIENTS ACCEPTANCE OF THE AGREEMENT.
 * You can obtain a current copy of the Eclipse Public License from
 * http://www.opensource.org/licenses/eclipse-1.0.php
 *
 * Contributors:
 *     Manu Sridharan (IBM) - Initial API and implementation
 ******************************************************************************/


/**
 * This module contains the code for parsing index files and converting them
 * to the type structure expected by esprimaJsContentAssist.js
 */

/*global define require*/
define("plugins/esprima/typesFromIndexFile", ["orion/Deferred", "plugins/esprima/typeUtils", "plugins/esprima/indexFiles/ecma5Index"], 
       function (Deferred, typeUtils, ecma5) {


	/**
	 * for case where an object has its own hasOwnProperty property 
	 */
	function hop(obj, prop) {
		return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	/**
	 * @param {String} char a string of at least one char14acter
	 * @return {boolean} true iff uppercase ascii character
	 */
	function isUpperCaseChar(c) {
		if (c.length < 1) {
			return false;
		}
		var charCode = c.charCodeAt(0);
		if (isNaN(charCode)) {
			return false;
		}
		return charCode >= 65 && charCode <= 90;
	}


	/**
	 * Global is the type of the global variable.  This can 
	 * vary based on what libraries are being used
	 */
	var Global = function () {};
	var globalPrototype = {};
	Global.prototype = globalPrototype;

	/**
	 * A prototype that contains the common built-in types
	 */
	var Types = function (globalObjName) {

		this.Global = new Global();
	};


	var typesPrototype = {};

	Types.prototype = typesPrototype;


	// NOTE: this works even with function types for arguments due to greediness in regexp matching
	var fnTypeRegexp = /fn\((.*)\)(\s*->\s*(.*))?/;

	var primitiveTypeMap = {
		"number": "Number",
		"bool": "Boolean",
		"string": "String"
	};

	var namePrefix = typeUtils.GEN_NAME + "index~";

	var _typeCount = 0;

	function genObjName() {
		return namePrefix + _typeCount++;
	}
	
	/**
	 * creates a Definition object for the given type and name.
	 * As a side-effect, adds information about the type (e.g.,
	 * the types of its properties) to typeInfo
	 */
	function definitionForType(typeInfo, type, name) {
	
		/**
		 * parse the properties from type, with special handling
		 * of the "!type" property
		 */
		function parseObjType(type, name) {
			var propInfo = {}, def;

			for (var p in type) {
				if (hop(type, p)) {
					if (p === "!type") {
						def = definitionForType(typeInfo, type[p], name);
						if (typeUtils.isFunctionOrConstructor(def.typeObj)) {
							propInfo.$$fntype = def.typeObj;
							if (name) {
								def = new typeUtils.Definition(name);
							} else {
								def = new typeUtils.Definition(genObjName());
							}
						}
					} else if (p === "!proto") {
						// prototype chain
						propInfo.$$proto = definitionForType(typeInfo, type[p]);
					} else if (p === "!url" || p === "!stdProto" || p === "!effects" || p === "!doc") {
						// do nothing for now
					} else if (p[0] === '!') {
						throw "didn't handle special property " + p;
					} else if (p === "prototype") {
						if (typeof type[p] === "string") {
							propInfo.$$newtype = new typeUtils.Definition(type[p]);
						} else {
							var tmpProtoName = name ? name + "_prototype" : genObjName();
							propInfo.$$newtype = definitionForType(typeInfo, type[p], tmpProtoName);
						}
					} else {
						propInfo[p] = definitionForType(typeInfo, type[p]);
					}
				}
			}
			if (propInfo.$$newtype && propInfo.$$fntype && typeof type.prototype === "string") {
				// if we have a named prototype, use that name as the return type
				// in $$fntype
				var protoName = propInfo.$$newtype.typeObj.name;
				var funType = propInfo.$$fntype;
				//          if (!funType.new) { throw "something broken"; }
				funType.result.name = protoName;
			}
			if (!def) {
				if (name) {
					def = new typeUtils.Definition(name);
				} else {
					// this occurs with nested object types, e.g.,
					// Element.prototype.style in the DOM model
					def = new typeUtils.Definition(genObjName());
				}
			}
			return {
				propInfo: propInfo,
				def: def
			};
		}

		function definitionForFunctionType(fnType, name) {
			function parseArgs(str) {
				// strip all spaces
				var leftToParse = str.replace(/\s+/g, '');
				var result = "";
				// need to be a bit smart here to handle 
				// arguments with function types
				while (leftToParse !== "") {
					var colonInd = leftToParse.indexOf(":");
					var argName = leftToParse.slice(0, colonInd);
					var optional = argName[argName.length - 1] === '?';
					if (optional) {
						argName = argName.slice(0, argName.length - 1);
					}
					leftToParse = leftToParse.slice(colonInd + 1, leftToParse.length);
					var commaInd;
					if (leftToParse.slice(0, 2) === "fn") {
						// find the close paren.  end of argument is next comma after
						// that (or the end of the string)
						var closeParenInd = leftToParse.indexOf(")");
						commaInd = leftToParse.indexOf(",", closeParenInd);
					} else {
						commaInd = leftToParse.indexOf(",");
					}
					var argTypeEndInd = commaInd === -1 ? leftToParse.length : commaInd;
					var argTypeStr = leftToParse.slice(0, argTypeEndInd);
					result += argName + ":" + definitionForType(typeInfo, argTypeStr).typeObj.name;
					if (optional) {
						result += "=";
					}
					if (argTypeEndInd !== leftToParse.length) {
						result += ",";
						leftToParse = leftToParse.slice(argTypeEndInd + 1, leftToParse.length);
					} else {
						leftToParse = "";
					}
				}
				return result;
			}

			function parseRet(str) {
				return definitionForType(typeInfo, str).typeObj.name;
			}
			var match = fnTypeRegexp.exec(fnType);
			if (!match) {
				throw "unexpected function type " + fnType;
			}
			var argString = match[1] === "" ? "" : parseArgs(match[1]);
			var retString;
			// HACK: if there is no return type in fnType,
			// use name as the return type, if it is defined.  
			// Otherwise, use undefined
			if (match[2]) {
				retString = parseRet(match[3]);
			} else if (name) {
				retString = name;
			}
			// use convention of upper-case names being constructors
			var isConstructor = !match[2] && retString && isUpperCaseChar(retString);
			var defName = "function(";
			if (isConstructor) {
				defName += "new:" + retString + ",";
			}
			defName += argString + "):" + retString;
			return new typeUtils.Definition(defName);
		}

		if (typeof type === "string") {
			if (primitiveTypeMap[type]) {
				return new typeUtils.Definition(primitiveTypeMap[type]);
			} else if (type === "?") {
				if (name === "undefined") {
					// special case: we want a NameExpression for name "undefined"
					return new typeUtils.Definition({
						name: "undefined",
						type: "NameExpression"
					});
				}
				// just make a dummy definition using the name for now
				return name ? new typeUtils.Definition(name) : new typeUtils.Definition("Object");
			} else if (type === "<top>") {
				// type of the global object
				return new typeUtils.Definition("Global");
			} else if (type[0] === "$") {
				// TODO handle these properly
				return new typeUtils.Definition(name);
			} else if (type.slice(0, 2) === "fn") {
				return definitionForFunctionType(type, name);
			} else if (type[0] === "[") {
				return new typeUtils.Definition("Array");
			} else if (type[0] === "+") {
				// a user-defined type.  just assume it exists for now; probably should check
				return new typeUtils.Definition(type.slice(1, type.length));
			} else if (type.slice(0, 7) === "!custom" || type.slice(0, 5) === "!this" || type.slice(0, 2) === "!0") {
				// don't understand this; treat it as Object for now
				return new typeUtils.Definition("Object");
			} else if (type.indexOf(".") !== -1) {
				var typeName = type.indexOf(".prototype") !== -1 ? type.replace(".", "_") : type;
				// TODO should we enforce this?  
				//          if (!typesPrototype[typeName]) {
				//            throw "bad type name " + typeName;
				//          }
				return new typeUtils.Definition(typeName);
			} else {
				if (type.slice(0, 1) === "!") {
					throw "unhandled special case " + type;
				}
				return name ? new typeUtils.Definition(name) : new typeUtils.Definition(type);
			}
		} else { // an object type
			var parsed = parseObjType(type, name);
			var newTypeName = parsed.def.typeObj.name;
			if (newTypeName) {
				if (newTypeName === "Object") {
					// need to mangle the property names as in original types.js
					var mangled = {};
					for (var p in parsed.propInfo) {
						if (hop(parsed.propInfo, p)) {
							mangled["$_$" + p] = parsed.propInfo[p];
						}
					}
					// mark as built-in so not mucked up by inference
					mangled.$$isBuiltin = true;
					typeInfo[newTypeName] = mangled;

				} else {
					// don't overwrite property info with empty types
					if (!typeInfo[newTypeName] || Object.keys(parsed.propInfo).length > 0) {
						// mark as built-in so not mucked up by inference
						parsed.propInfo.$$isBuiltin = true;
						typeInfo[newTypeName] = parsed.propInfo;
					}
				}
			}
			return parsed.def;
		}
	}


	/**
	 * adds the info from the given json index file.  global variables are added to globals,
	 * and type information to typeInfo
	 */

	function addIndexInfo(json, globals, typeInfo) {
		var p;
		for (p in json) {
			if (hop(json, p)) {
				if (p === "!name") {
					// ignore
				} else if (p === "!define") {
					// these are anonymous types, i.e.,
					// types with no corresponding global
					var anonTypes = json[p];
					for (var n in anonTypes) {
						if (hop(anonTypes, n)) {
							// invoking definitionForType will have
							// the side effect of adding the type
							// information
							definitionForType(typeInfo, anonTypes[n], n);
						}
					}
				} else if (typeof json[p] === "string") {
					globals[p] = json[p] === "<top>" ? new typeUtils.Definition("Global") : new typeUtils.Definition(json[p]);
				} else {
					// new global
					var type = json[p];
					globals[p] = definitionForType(typeInfo, type, p);
				}
			}
		}
	}

	// prototype of global object is Object
	globalPrototype.$$proto = new typeUtils.Definition("Object");

	// add information for core libraries directly to Global.prototype
	// and Types.prototype
	addIndexInfo(ecma5, globalPrototype, typesPrototype);

	/////////////////////////
	// code for adding other index files
	//
	// Strategy: when someone asks for another index file, we parse that
	// file, and then add the results to a *particular* Types object.  This
	// is in contrast to types.js, which keeps three separate global object
	// representations (for standard js, browser, and node) and keeps relevant
	// type info on each of their prototypes.
	//
	// We also cache the results of parsing an index file, to avoid repeating things.
	/////////////////////////

	var parsedIndexFileCache = {};

	/**
	 * Add information for library libName to the knownTypes object.
	 *
	 * Returns a promise, as the library index file may need to be loaded
	 * asynchronously.  The promise is resolved with the knownTypes object.
	 */
	function addLibrary(knownTypes, libName) {
		// first, get the global and types info
		// check the cache
		var d = new Deferred();
		var globalsAndTypes = parsedIndexFileCache[libName];
		if (!globalsAndTypes) {
			globalsAndTypes = { globals: {}, types: {} };
			var indexFile;
			if (libName === "browser") {
				indexFile = "plugins/esprima/indexFiles/browserIndex";
			} else if (libName === "node") {
				indexFile = "plugins/esprima/indexFiles/nodeIndex";
			} else {
				throw "unknown library name " + libName;				
			}
			require([indexFile], function (indexData) {
				addIndexInfo(indexData, globalsAndTypes.globals, globalsAndTypes.types);
				parsedIndexFileCache[libName] = globalsAndTypes;
				d.resolve(globalsAndTypes);
			});
		} else {
			// already have the info
			d.resolve(globalsAndTypes);
		}
		var result = d.then(function (globalsAndTypes) {
			// now, add the globals and types for the index file to knownTypes
			// we want globals on the *prototype* of knownTypes.Global.  (We
			// need them on the prototype so their types cannot be overwritten
			// by user code.)  So, we create a new prototype object with extant
			// globals and the new ones from the index file, and then re-allocate
			// knownTypes.Global.  (gross)
			var newProto = {};
			var knownGlobals = Object.getPrototypeOf(knownTypes.Global);
			Object.keys(knownGlobals).forEach(function (globName) {
				newProto[globName] = knownGlobals[globName];
			});		
			Object.keys(globalsAndTypes.globals).forEach(function (globName) {
				newProto[globName] = globalsAndTypes.globals[globName];
			});
			Global.prototype = newProto;
			knownTypes.Global = new Global();
			Global.prototype = globalPrototype;
		
			// we want types on knownTypes itself
			Object.keys(globalsAndTypes.types).forEach(function (typeName) {
				if (typeName !== "Global") {
					knownTypes[typeName] = globalsAndTypes.types[typeName];
				}
			});	
			return knownTypes;
		});
		return result;
	}

	return {
		Types: Types,
		addLibrary: addLibrary
	};
});