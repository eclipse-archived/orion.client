/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 VMware, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     Andrew Eisenberg (VMware) - initial API and implementation
 *     IBM Corporation - Various improvements
 ******************************************************************************/

/*global define esprima console setTimeout doctrine*/
define([
	'javascript/contentAssist/typesFromIndexFile',
	'javascript/contentAssist/typeEnvironment',
	'orion/assert'
], function(mTypes, typeEnv, assert) {

	//////////////////////////////////////////////////////////
	// helpers
	//////////////////////////////////////////////////////////

	function testSig(ternSig, closureSig, constructorName) {
		assert.equal(mTypes.ternSig2ClosureSig(ternSig, constructorName, {}), closureSig, "Bad conversion");
	}
	
	function testType(type, name, expectedTypeInfo) {
		var result = mTypes.parseType(type, name);
		assert.equal(JSON.stringify(result.typeInfo), JSON.stringify(expectedTypeInfo), "Bad parse");
	}
	
	function makeEnvironmentOptionsFromIndex(indexDataArr) {
		var options = {};
		options.buffer = "";
		options.uid = "0";
		options.indexData = indexDataArr;
		return options;
	}
	
	function checkEnvironment(indexData, cb) {
		var options = makeEnvironmentOptionsFromIndex([indexData]);
		var envPromise = typeEnv.createEnvironment(options);
		var result = envPromise.then(cb);
		return result;	
	}
	
	//////////////////////////////////////////////////////////
	// tests
	//////////////////////////////////////////////////////////

	var tests = {};

	tests["test basic 1"] = function() {
		testSig("fn() -> String", "function():String");
	};

	tests["test basic 2"] = function() {
		testSig("fn(m: Number, n?: Number) -> Boolean", "function(m:Number,n:Number=):Boolean");
	};
	
	tests["test constructor 1"] = function() {
		// TODO is this really right?  comma after Fizz?
		testSig("fn()", "function(new:Fizz):Fizz", "Fizz");
	};
	
	tests["test array of functions"] = function() {
		testSig("fn() -> [fn()]", "function():Array");
	};
	tests["test callback"] = function() {
		testSig("fn(cb: fn(x: Object) -> Object) -> Number", "function(cb:function(x:Object):Object):Number");
	};

	tests["test callback 2"] = function() {
		testSig("fn(cb: fn(x: Object) -> Object) -> fn(y: Object) -> Object", 
				"function(cb:function(x:Object):Object):function(y:Object):Object");
	};

	tests["test callback 3"] = function() {
		testSig("fn(cb: fn(x: Object) -> fn(z: Object) -> Object, cb2: fn(p: Object) -> String) -> fn(y: Object) -> Object", 
				"function(cb:function(x:Object):function(z:Object):Object,cb2:function(p:Object):String):function(y:Object):Object");
	};

	tests["test callback 4"] = function() {
		testSig("fn(callback: fn())", "function(callback:function():undefined):undefined");
	};

	tests["test callback 5"] = function() {
		testSig("fn(callback: fn()) -> Function", "function(callback:function():undefined):Function");
	};
	
	tests["test callback 6"] = function() {
		testSig("fn(callback: fn()->Object)", "function(callback:function():Object):undefined");
	};

	tests["test callback 7"] = function() {
		testSig("fn(callback: fn())->Object", "function(callback:function():undefined):Object");
	};
	
	tests["test callback 8"] = function() {
		testSig("fn(callback: fn(), parm:Boolean)->Object", "function(callback:function():undefined,parm:Boolean):Object");
	};

	tests["test callback 9"] = function() {
		testSig("fn(parm:Boolean, callback: fn())->Object", "function(parm:Boolean,callback:function():undefined):Object");
	};
	
	tests["test callback 10"] = function() {
		testSig("fn(parm:Boolean, callback: fn()->Number)->Object", "function(parm:Boolean,callback:function():Number):Object");
	};
	
	tests["test callback 11"] = function() {
		testSig("fn(parm:Boolean, callback: fn()->Number)", "function(parm:Boolean,callback:function():Number):undefined");
	};
	
	tests["test callback 12"] = function() {
		testSig("fn(callback: fn()->Object, parm:Boolean)", "function(callback:function():Object,parm:Boolean):undefined");
	};
	
	tests["test callback 13"] = function() {
		testSig("fn(callback: fn()->Number, parm:Boolean)->Object", "function(callback:function():Number,parm:Boolean):Object");
	};
	
	tests["test callback 14"] = function() {
		testSig("fn(callback: fn()->Function, parm:Boolean)->Object", "function(callback:function():Function,parm:Boolean):Object");
	};
	
	tests["test callback 15"] = function() {
		testSig("fn(callback: fn()->Function, parm:Boolean)->Function", "function(callback:function():Function,parm:Boolean):Function");
	};
	
	tests["test type 1"] = function() {
		var type = {
			fizz: "String",
			bazz: "Number"
		};
		var expected = {
			"Foo": {
				"fizz": {
					"_typeObj": {
						"type": "NameExpression",
						"name": "String"
					}
				},
				"bazz": {
					"_typeObj": {
						"type": "NameExpression",
						"name": "Number"
					}
				},
				"$$isBuiltin": true
			}
		};
		testType(type, "Foo", expected);
	};
	
	tests["test type reference with dot"] = function() {
		var type = {
			foo: "+x.OtherType"
		};
		var expected = {
			"Foo": {
				"foo": {
					"_typeObj": {
						"type": "NameExpression",
						"name": "x..OtherType..prototype"
					}
				},
				"$$isBuiltin": true
			}
		};
		testType(type, "Foo", expected);
	};
	
	tests["test environment basic"] = function() {
		var index = {
			bizz: "String"
		};
		return checkEnvironment(index, function (env) {
			assert.equal("String", env.lookupTypeObj("bizz").name, "bad environment");
		});
	};
	
	tests["test environment prototype"] = function() {
		var index = {
			Fizz: {
				"!type": "fn(p:String)",
				prototype: {
					x: "String"
				}
			},
			Buzz: {
				"!type": "fn(p:String)",
				prototype: {
					"!proto": "Fizz.prototype",
					y: "String"
				}
			}
		};
		return checkEnvironment(index, function (env) {
			assert.equal("String", env.lookupTypeObj("x", "Fizz..prototype").name, "bad environment");
		});
	};
	
	tests["test top-level dot"] = function() {
		var index = {
			Fizz: "foo.bazz"
		};
		return checkEnvironment(index, function (env) {
			assert.equal("foo..bazz", env.lookupTypeObj("Fizz").name, "bad environment");
		});
	};
	return tests;
});
