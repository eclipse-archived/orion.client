/*jslint amd:true*/
/*global esprima:true*/
define([
	"chai/chai",
	"esprima",
	'estraverse'
], function(chai, _esprima, Estraverse) {
	var assert = chai.assert;
	if (_esprima) {
		esprima = _esprima;
	}

	//////////////////////////////////////////////////////////
	// Helpers
	//////////////////////////////////////////////////////////
	function parseFull(contents) {
		// esprima ~1.1.0 always sets 'raw' field on Literal nodes. Esprima ~1.0.0 only does so if
		// 'raw' flag passed. To ensure identical AST shape across versions, set the flag.
		return esprima.parse(contents, {
			range: true,
			tolerant: true,
			comment: true,
			tokens: true,
			raw: true
		});
	}
	/* */
	function pf(str /*, args*/) {
		var args = Array.prototype.slice.call(arguments, 1);
		var i=0;
		return str.replace(/%s/g, function() {
			return String(args[i++]);
		});
	}

	/**
	 * @description Run a test
	 */
	function runTest(name, data) {
		assert.ok(data.source);
		var ast = parseFull(data.source);

		//Check tokens 
		var expectedTokens = data.tokens, actualTokens = ast.tokens;
		if(expectedTokens) {
			assert(actualTokens, 'The AST should contain the tokens');
			var len = actualTokens.length;
			assert.equal(len, expectedTokens.length, 'Token streams are not the same');
			for(var i = 0; i < len; i++) {
				assert.equal(actualTokens[i].type, expectedTokens[i].type, 'Unexpected token found in stream: ');
				assert.equal(actualTokens[i].value, expectedTokens[i].value, 'Unexpected token value found in stream');
			}
		}
		// Check the nodes
		var expectedNodes = data.nodes && data.nodes.slice(0);
		if(expectedNodes) {
			assert(ast, 'The AST should exist');
			var counter = 0;
			Estraverse.traverse(ast, {
				enter: function(node) {
					if(node.type !== 'Program') {
						assert(counter < expectedNodes.length, 'There are more nodes to visit: '+ JSON.stringify(node));
						var expected = expectedNodes[counter];
						assert.equal(node.type, expected.type, 'The node types differ');
						assert(expected.range, 'The expected node has no range');
						assert.equal(node.range[0], expected.range[0], 'The node starts differ');
						assert.equal(node.range[1], expected.range[1], 'The node ends differ');
						if (expected.name) {
							assert.equal(node.name, expected.name, 'The names differ');
						}
						if (expected.kind) {
							assert.equal(node.kind, expected.kind, 'The kinds differ');
						}
						if (expected.value && typeof expected.value !== "object") {
							assert.equal(node.value, expected.value, 'The values differ');
						}
						counter++;
					}
				}
			});
			//assert(expectedNodes.length === 0, 'We did not find all of the nodes');
			assert(counter === expectedNodes.length, 'We did not find all of the nodes');
		}
		// Check errors
		var expectedErrors = data.errors, actualErrors = ast.errors;
		if (expectedErrors) {
			expectedErrors = Array.isArray(expectedErrors) ? expectedErrors : [expectedErrors];
			assert.equal(actualErrors.length, expectedErrors.length, "Correct number of errors");
			expectedErrors.forEach(function(expected, i) {
				var actual = actualErrors[i];
				var formatStr = "Error #%s has correct %s";
				if (typeof expected.token === "string") {
					assert.equal(actual.token, expected.token, pf(formatStr, i, "token"));
				}
				if (typeof expected.index === "number") {
					assert.equal(actual.index, expected.index, pf(formatStr, i, "index"));
				}
				if (typeof expected.lineNumber === "number") {
					assert.equal(actual.lineNumber, expected.lineNumber, pf("Error %s has correct %s", i, "lineNumber"));
				}
				assert.equal(actual.message.replace(/^Line [0-9]*: /, ""), expected.message, pf("Error %s has correct %s", i, "message"));
			});
		}

		// TODO extras
	}

	//////////////////////////////////////////////////////////
	// Tests
	//////////////////////////////////////////////////////////
	var tests = {};
	var testData = {
		"recovery basic parse": {
			source: "foo.bar",
			errors: [],
			nodes:[{type:"ExpressionStatement",range:[0,7]},{type:"MemberExpression",range:[0,7]},{type:"Identifier",name:"foo",range:[0,3]},{type:"Identifier",name:"bar",range:[4,7]}]
		},
		"recovery - dot followed by EOF": {
			source: "foo.",
			errors: [{ index: 4, lineNumber: 1, message: "Unexpected end of input" }],
			nodes: [{type:"ExpressionStatement",range:[0,4]},{type:"MemberExpression",range:[0,4]},{type:"Identifier",name:"foo",range:[0,3]}]
			
		},
		"Function args 2": {
			source: "var ttt, uuu;\nttt(ttt, /**/)",
			errors: [{ index:27, lineNumber: 2, message: "Unexpected token )", token: ")" }],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,13]},{type:"VariableDeclarator",range:[4,7]},{type:"Identifier",name:"ttt",range:[4,7]},{type:"VariableDeclarator",range:[9,12]},{type:"Identifier",name:"uuu",range:[9,12]},{type:"ExpressionStatement",range:[14,28]}]
		},
		"Function args 3": {
			source: "var ttt, uuu;\nttt(ttt, /**/, uuu)",
			errors: [
				{ index: 27, message: "Unexpected token ,",    token: "," },
				{ index: 29, message: "Unexpected identifier", token: "uuu" },
				{ index: 32, message: "Unexpected token )",    token: ")" }
			],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,13]},{type:"VariableDeclarator",range:[4,7]},{type:"Identifier",name:"ttt",range:[4,7]},{type:"VariableDeclarator",range:[9,12]},{type:"Identifier",name:"uuu",range:[9,12]},{type:"ExpressionStatement",range:[14,29]},{type:"ExpressionStatement",range:[29,32]},{type:"Identifier",name:"uuu",range:[29,32]},{type:"ExpressionStatement",range:[32,33]}]
		},
		"broken after dot 1": {
			source: "var ttt = { ooo:8};\nttt.",
			errors: [{ index: 24, message: "Unexpected end of input" }],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,19]},{type:"VariableDeclarator",range:[4,18]},{type:"Identifier",name:"ttt",range:[4,7]},{type:"ObjectExpression",range:[10,18]},{type:"Property",kind:"init",range:[12,17],value:{type:"Literal",value:8,range:[16,17]}},{type:"Identifier",name:"ooo",range:[12,15]},{type:"Literal",range:[16,17],value:8},{type:"ExpressionStatement",range:[20,24]},{type:"MemberExpression",range:[20,24]},{type:"Identifier",name:"ttt",range:[20,23]}]
		},
		"broken after dot 2": {
			source: "var ttt = { ooo:8};\nif (ttt.) { ttt }",
			errors: [{ index: 28, message: "Unexpected token )", token: ")" }],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,19]},{type:"VariableDeclarator",range:[4,18]},{type:"Identifier",name:"ttt",range:[4,7]},{type:"ObjectExpression",range:[10,18]},{type:"Property",kind:"init",range:[12,17],value:{type:"Literal",value:8,range:[16,17]}},{type:"Identifier",name:"ooo",range:[12,15]},{type:"Literal",range:[16,17],value:8},{type:"IfStatement",range:[20,37]},{type:"MemberExpression",range:[24,28]},{type:"Identifier",name:"ttt",range:[24,27]},{type:"BlockStatement",range:[30,37]},{type:"ExpressionStatement",range:[32,36]},{type:"Identifier",name:"ttt",range:[32,35]}]
		},
		"broken after dot 3": {
			source: "var ttt = { ooo:this.};",
			errors: [{ index: 21, message: "Unexpected token }", token: "}" }],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,23]},{type:"VariableDeclarator",range:[4,22]},{type:"Identifier",name:"ttt",range:[4,7]},{type:"ObjectExpression",range:[10,22]},{type:"Property",kind:"init",range:[12,21],value:{type:"MemberExpression",computed:false,object:{type:"ThisExpression",range:[16,20]},property:null,range:[16,21]}},{type:"Identifier",name:"ooo",range:[12,15]},{type:"MemberExpression",range:[16,21]},{type:"ThisExpression",range:[16,20]}]
		},
		"broken after dot 3a": {
			source: "var ttt = { ooo:this./**/};",
			errors: [{ index: 25, message: "Unexpected token }", token: "}" }],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,27]},{type:"VariableDeclarator",range:[4,26]},{type:"Identifier",name:"ttt",range:[4,7]},{type:"ObjectExpression",range:[10,26]},{type:"Property",kind:"init",range:[12,21],value:{type:"MemberExpression",computed:false,object:{type:"ThisExpression",range:[16,20]},property:null,range:[16,21]}},{type:"Identifier",name:"ooo",range:[12,15]},{type:"MemberExpression",range:[16,21]},{type:"ThisExpression",range:[16,20]}]
		},
		"broken after dot 4": {
			source: "var ttt = { ooo:8};\nfunction ff() { \nttt.}",
			errors: [{ index: 41, message: "Unexpected token }", token: "}" }],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,19]},{type:"VariableDeclarator",range:[4,18]},{type:"Identifier",name:"ttt",range:[4,7]},{type:"ObjectExpression",range:[10,18]},{type:"Property",kind:"init",range:[12,17],value:{type:"Literal",value:8,range:[16,17]}},{type:"Identifier",name:"ooo",range:[12,15]},{type:"Literal",range:[16,17],value:8},{type:"FunctionDeclaration",range:[20,42]},{type:"Identifier",name:"ff",range:[29,31]},{type:"BlockStatement",range:[34,42]},{type:"ExpressionStatement",range:[37,41]},{type:"MemberExpression",range:[37,41]},{type:"Identifier",name:"ttt",range:[37,40]}]
		},
		"broken after dot 4a": {
			source: "var ttt = { ooo:8};\nfunction ff() { \nttt./**/}",
			errors: [{ index: 45, message: "Unexpected token }", token: "}" }],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,19]},{type:"VariableDeclarator",range:[4,18]},{type:"Identifier",name:"ttt",range:[4,7]},{type:"ObjectExpression",range:[10,18]},{type:"Property",kind:"init",range:[12,17],value:{type:"Literal",value:8,range:[16,17]}},{type:"Identifier",name:"ooo",range:[12,15]},{type:"Literal",range:[16,17],value:8},{type:"FunctionDeclaration",range:[20,46]},{type:"Identifier",name:"ff",range:[29,31]},{type:"BlockStatement",range:[34,46]},{type:"ExpressionStatement",range:[37,45]},{type:"MemberExpression",range:[37,41]},{type:"Identifier",name:"ttt",range:[37,40]}]
		},
		"broken after dot 5": {
			source: "var first = {ooo:9};\nfirst.\nvar jjj;",
			errors: [{ index: 32, message: "Unexpected identifier", token: "jjj" }],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,20]},{type:"VariableDeclarator",range:[4,19]},{type:"Identifier",name:"first",range:[4,9]},{type:"ObjectExpression",range:[12,19]},{type:"Property",kind:"init",range:[13,18],value:{type:"Literal",value:9,range:[17,18]}},{type:"Identifier",name:"ooo",range:[13,16]},{type:"Literal",range:[17,18],value:9},{type:"ExpressionStatement",range:[21,27]},{type:"MemberExpression",range:[21,31]},{type:"Identifier",name:"first",range:[21,26]},{type:"Identifier",name:"var",range:[28,31]},{type:"VariableDeclaration",kind:"var",range:[28,36]},{type:"VariableDeclarator",range:[32,35]},{type:"Identifier",name:"jjj",range:[32,35]}]
		},
		"broken after dot 6": {
			source: "var first = {ooo:9};\nfirst.\nif (x) { }",
			errors: [{ index: 35, message: "Unexpected token {", token: "{" }],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,20]},{type:"VariableDeclarator",range:[4,19]},{type:"Identifier",name:"first",range:[4,9]},{type:"ObjectExpression",range:[12,19]},{type:"Property",kind:"init",range:[13,18],value:{type:"Literal",value:9,range:[17,18]}},{type:"Identifier",name:"ooo",range:[13,16]},{type:"Literal",range:[17,18],value:9},{type:"ExpressionStatement",range:[21,27]},{type:"CallExpression",range:[21,34]},{type:"MemberExpression",range:[21,30]},{type:"Identifier",name:"first",range:[21,26]},{type:"Identifier",name:"if",range:[28,30]},{type:"Identifier",name:"x",range:[32,33]},{type:"IfStatement",range:[28,38]},{type:"Identifier",name:"x",range:[32,33]},{type:"BlockStatement",range:[35,38]}]
		},
		"computed member expressions5": {
			source: "var foo = { at: { bar: 0} };\nfoo[at.foo.bar].",
			errors: [{ lineNumber: 2, message: "Unexpected end of input" }],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,28]},{type:"VariableDeclarator",range:[4,27]},{type:"Identifier",name:"foo",range:[4,7]},{type:"ObjectExpression",range:[10,27]},{type:"Property",kind:"init",range:[12,25],value:{type:"ObjectExpression",properties:[{type:"Property",key:{type:"Identifier",name:"bar",range:[18,21]},value:{type:"Literal",value:0,range:[23,24]},kind:"init",range:[18,24]}],range:[16,25]}},{type:"Identifier",name:"at",range:[12,14]},{type:"ObjectExpression",range:[16,25]},{type:"Property",kind:"init",range:[18,24],value:{type:"Literal",value:0,range:[23,24]}},{type:"Identifier",name:"bar",range:[18,21]},{type:"Literal",range:[23,24]},{type:"ExpressionStatement",range:[29,45]},{type:"MemberExpression",range:[29,45]},{type:"MemberExpression",range:[29,44]},{type:"Identifier",name:"foo",range:[29,32]},{type:"MemberExpression",range:[33,43]},{type:"MemberExpression",range:[33,39]},{type:"Identifier",name:"at",range:[33,35]},{type:"Identifier",name:"foo",range:[36,39]},{type:"Identifier",name:"bar",range:[40,43]}]
		},
		"computed member expressions6": {
			source: "var x = 0;\nvar foo = [];\nfoo[x./**/]",
			errors: [{ lineNumber: 3, message: "Unexpected token ]", token: "]" }],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,10]},{type:"VariableDeclarator",range:[4,9]},{type:"Identifier",name:"x",range:[4,5]},{type:"Literal",range:[8,9]},{type:"VariableDeclaration",kind:"var",range:[11,24]},{type:"VariableDeclarator",range:[15,23]},{type:"Identifier",name:"foo",range:[15,18]},{type:"ArrayExpression",range:[21,23]},{type:"ExpressionStatement",range:[25,36]},{type:"MemberExpression",range:[25,36]},{type:"Identifier",name:"foo",range:[25,28]},{type:"MemberExpression",range:[29,31]},{type:"Identifier",name:"x",range:[29,30]}]
		},
		"invalid member expression1": {
			source: "x./**/\nvar x = {};\nx.fff = '';",
			errors: [{ lineNumber: 2, message: "Unexpected identifier", token: "x" }],
			nodes: [{type:"ExpressionStatement",range:[0,6]},{type:"MemberExpression",range:[0,10]},{type:"Identifier",name:"x",range:[0,1]},{type:"Identifier",name:"var",range:[7,10]},{type:"VariableDeclaration",kind:"var",range:[7,18]},{type:"VariableDeclarator",range:[11,17]},{type:"Identifier",name:"x",range:[11,12]},{type:"ObjectExpression",range:[15,17]},{type:"ExpressionStatement",range:[19,30]},{type:"AssignmentExpression",range:[19,29]},{type:"MemberExpression",range:[19,24]},{type:"Identifier",name:"x",range:[19,20]},{type:"Identifier",name:"fff",range:[21,24]},{type:"Literal",range:[27,29]}]
		},
		"invalid member expression2": {
			source: "function a() {\nx.fff = '';\n}\nx./**/\nvar x = {}; ",
			errors: [{ lineNumber: 5, message: "Unexpected identifier", token: "x" }],
			nodes: [{type:"FunctionDeclaration",range:[0,28]},{type:"Identifier",name:"a",range:[9,10]},{type:"BlockStatement",range:[13,28]},{type:"ExpressionStatement",range:[15,26]},{type:"AssignmentExpression",range:[15,25]},{type:"MemberExpression",range:[15,20]},{type:"Identifier",name:"x",range:[15,16]},{type:"Identifier",name:"fff",range:[17,20]},{type:"Literal",range:[23,25]},{type:"ExpressionStatement",range:[29,35]},{type:"MemberExpression",range:[29,39]},{type:"Identifier",name:"x",range:[29,30]},{type:"Identifier",name:"var",range:[36,39]},{type:"VariableDeclaration",kind:"var",range:[36,47]},{type:"VariableDeclarator",range:[40,46]},{type:"Identifier",name:"x",range:[40,41]},{type:"ObjectExpression",range:[44,46]}]
		},
		"invalid member expression3": {
			source: "x./**/\nfunction a() {\nx.fff = '';\n}\nvar x = {}; ",
			errors: [{ lineNumber: 2, message: "Unexpected identifier", token: "a" }],
			nodes: [{type:"ExpressionStatement",range:[0,6]},{type:"MemberExpression",range:[0,15]},{type:"Identifier",name:"x",range:[0,1]},{type:"Identifier",name:"function",range:[7,15]},{type:"FunctionDeclaration",range:[7,35]},{type:"Identifier",name:"a",range:[16,17]},{type:"BlockStatement",range:[20,35]},{type:"ExpressionStatement",range:[22,33]},{type:"AssignmentExpression",range:[22,32]},{type:"MemberExpression",range:[22,27]},{type:"Identifier",name:"x",range:[22,23]},{type:"Identifier",name:"fff",range:[24,27]},{type:"Literal",range:[30,32]},{type:"VariableDeclaration",kind:"var",range:[36,47]},{type:"VariableDeclarator",range:[40,46]},{type:"Identifier",name:"x",range:[40,41]},{type:"ObjectExpression",range:[44,46]}]
		},
//		node12: {
//			source: "/*jslint node:true*/\nprocess.",
//			errors: [{ lineNumber: 2, message: "Unexpected identifier" }],
//			nodes: [{type:"ExpressionStatement",range:[21,29]},{type:"MemberExpression",range:[21,29]},{type:"Identifier",name:"process",range:[21,28]}]
//		},
		"tolerant parsing function 1": {
			source: "var xxxyyy = {};\nfunction foo() {\n    if (xx",
			errors: [{ lineNumber: 3, message: "Unexpected end of input" }],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,16]},{type:"VariableDeclarator",range:[4,15]},{type:"Identifier",name:"xxxyyy",range:[4,10]},{type:"ObjectExpression",range:[13,15]},{type:"FunctionDeclaration",range:[17,44]},{type:"Identifier",name:"foo",range:[26,29]},{type:"BlockStatement",range:[32,44]},{type:"IfStatement",range:[38,44]},{type:"Identifier",name:"xx",range:[42,44]}]
		},
		"tolerant parsing function 2": {
			source: "function foo() {\n    var xxxyyy = false;\n    if (!xx",
			errors: [{ lineNumber: 3, message: "Unexpected end of input" }],
			nodes: [{type:"FunctionDeclaration",range:[0,52]},{type:"Identifier",name:"foo",range:[9,12]},{type:"BlockStatement",range:[15,52]},{type:"VariableDeclaration",kind:"var",range:[21,40]},{type:"VariableDeclarator",range:[25,39]},{type:"Identifier",name:"xxxyyy",range:[25,31]},{type:"Literal",range:[34,39]},{type:"IfStatement",range:[45,52]},{type:"UnaryExpression",range:[49,52]},{type:"Identifier",name:"xx",range:[50,52]}]
		},
		"tolerant parsing function 3": {
			source: "function foo(xxxyyy) {\n    if (!xx",
			errors: [{ lineNumber: 2, message: "Unexpected end of input" }],
			nodes: [{type:"FunctionDeclaration",range:[0,34]},{type:"Identifier",name:"foo",range:[9,12]},{type:"Identifier",name:"xxxyyy",range:[13,19]},{type:"BlockStatement",range:[21,34]},{type:"IfStatement",range:[27,34]},{type:"UnaryExpression",range:[31,34]},{type:"Identifier",name:"xx",range:[32,34]}]
		},
		"tolerant parsing function 4": {
			source: "var x = { bazz: 3 };\nfunction foo() {\n    if (x.b",
			errors: [{ lineNumber: 3, message: "Unexpected end of input" }],
			nodes: [{type:"VariableDeclaration",kind:"var",range:[0,20]},{type:"VariableDeclarator",range:[4,19]},{type:"Identifier",name:"x",range:[4,5]},{type:"ObjectExpression",range:[8,19]},{type:"Property",kind:"init",range:[10,17],value:{type:"Literal",value:3,range:[16,17]}},{type:"Identifier",name:"bazz",range:[10,14]},{type:"Literal",range:[16,17],value:3},{type:"FunctionDeclaration",range:[21,49]},{type:"Identifier",name:"foo",range:[30,33]},{type:"BlockStatement",range:[36,49]},{type:"IfStatement",range:[42,49]},{type:"MemberExpression",range:[46,49]},{type:"Identifier",name:"x",range:[46,47]},{type:"Identifier",name:"b",range:[48,49]}]
		},
		"tolerant parsing function 5": {
			source: "function foo(p) {\n    p.ffffff = false;\n    while (p.ff",
			errors: [{ lineNumber: 3, message: "Unexpected end of input" }],
			nodes: [{type:"FunctionDeclaration",range:[0,55]},{type:"Identifier",name:"foo",range:[9,12]},{type:"Identifier",name:"p",range:[13,14]},{type:"BlockStatement",range:[16,55]},{type:"ExpressionStatement",range:[22,39]},{type:"AssignmentExpression",range:[22,38]},{type:"MemberExpression",range:[22,30]},{type:"Identifier",name:"p",range:[22,23]},{type:"Identifier",name:"ffffff",range:[24,30]},{type:"Literal",range:[33,38]},{type:"WhileStatement",range:[44,55]},{type:"MemberExpression",range:[51,55]},{type:"Identifier",name:"p",range:[51,52]},{type:"Identifier",name:"ff",range:[53,55]}]
		},
		"tolerant parsing function 6": {
			source: "function foo(p) {\n    p.ffffff = false;\n    if (p) {\n        while (p.ff",
			errors: [{ lineNumber: 4, message: "Unexpected end of input" }],
			nodes: [{type:"FunctionDeclaration",range:[0,72]},{type:"Identifier",name:"foo",range:[9,12]},{type:"Identifier",name:"p",range:[13,14]},{type:"BlockStatement",range:[16,72]},{type:"ExpressionStatement",range:[22,39]},{type:"AssignmentExpression",range:[22,38]},{type:"MemberExpression",range:[22,30]},{type:"Identifier",name:"p",range:[22,23]},{type:"Identifier",name:"ffffff",range:[24,30]},{type:"Literal",range:[33,38]},{type:"IfStatement",range:[44,72]},{type:"Identifier",name:"p",range:[48,49]},{type:"BlockStatement",range:[51,72]},{type:"WhileStatement",range:[61,72]},{type:"MemberExpression",range:[68,72]},{type:"Identifier",name:"p",range:[68,69]},{type:"Identifier",name:"ff",range:[70,72]}]
		},
		"tolerant parsing function 7": {
			source: "function foo(p) {\n    p.ffffff = false;\n    if (p) {\n        for (var q in p.ff",
			errors: [{ lineNumber: 4, message: "Unexpected end of input" }],
			nodes: [{type:"FunctionDeclaration",range:[0,79]},{type:"Identifier",name:"foo",range:[9,12]},{type:"Identifier",name:"p",range:[13,14]},{type:"BlockStatement",range:[16,79]},{type:"ExpressionStatement",range:[22,39]},{type:"AssignmentExpression",range:[22,38]},{type:"MemberExpression",range:[22,30]},{type:"Identifier",name:"p",range:[22,23]},{type:"Identifier",name:"ffffff",range:[24,30]},{type:"Literal",range:[33,38]},{type:"IfStatement",range:[44,79]},{type:"Identifier",name:"p",range:[48,49]},{type:"BlockStatement",range:[51,79]},{type:"ForInStatement",range:[61,79]},{type:"VariableDeclaration",kind:"var",range:[66,71]},{type:"VariableDeclarator",range:[70,71]},{type:"Identifier",name:"q",range:[70,71]},{type:"MemberExpression",range:[75,79]},{type:"Identifier",name:"p",range:[75,76]},{type:"Identifier",name:"ff",range:[77,79]}]
		},
		"tolerant parsing function 8": {
			source: "function foo(p) {\n    p.ffffff = false;\n    if (p) {\n        for (var q in p) {\n            while (p.ff",
			errors: [{ lineNumber: 5, message: "Unexpected end of input" }],
			nodes: [{type:"FunctionDeclaration",range:[0,103]},{type:"Identifier",name:"foo",range:[9,12]},{type:"Identifier",name:"p",range:[13,14]},{type:"BlockStatement",range:[16,103]},{type:"ExpressionStatement",range:[22,39]},{type:"AssignmentExpression",range:[22,38]},{type:"MemberExpression",range:[22,30]},{type:"Identifier",name:"p",range:[22,23]},{type:"Identifier",name:"ffffff",range:[24,30]},{type:"Literal",range:[33,38]},{type:"IfStatement",range:[44,103]},{type:"Identifier",name:"p",range:[48,49]},{type:"BlockStatement",range:[51,103]},{type:"ForInStatement",range:[61,103]},{type:"VariableDeclaration",kind:"var",range:[66,71]},{type:"VariableDeclarator",range:[70,71]},{type:"Identifier",name:"q",range:[70,71]},{type:"Identifier",name:"p",range:[75,76]},{type:"BlockStatement",range:[78,103]},{type:"WhileStatement",range:[92,103]},{type:"MemberExpression",range:[99,103]},{type:"Identifier",name:"p",range:[99,100]},{type:"Identifier",name:"ff",range:[101,103]}]
		},
		"tolerant parsing function 9": {
			source: "function f(s) {}\nf(JSON.str",
			errors: [{ lineNumber: 2, message: "Unexpected end of input" }],
			nodes: [{type:"FunctionDeclaration",range:[0,16]},{type:"Identifier",name:"f",range:[9,10]},{type:"Identifier",name:"s",range:[11,12]},{type:"BlockStatement",range:[14,16]},{type:"ExpressionStatement",range:[17,27]},{type:"CallExpression",range:[17,27]},{type:"Identifier",name:"f",range:[17,18]},{type:"MemberExpression",range:[19,27]},{type:"Identifier",name:"JSON",range:[19,23]},{type:"Identifier",name:"str",range:[24,27]}]
		},
		"tolerant parsing function 10": {
			source: "function f(a,b) {}\nf(0,JSON.str",
			errors: [{ lineNumber: 2, message: "Unexpected end of input" }],
			nodes: [{type:"FunctionDeclaration",range:[0,18]},{type:"Identifier",name:"f",range:[9,10]},{type:"Identifier",name:"a",range:[11,12]},{type:"Identifier",name:"b",range:[13,14]},{type:"BlockStatement",range:[16,18]},{type:"ExpressionStatement",range:[19,31]},{type:"CallExpression",range:[19,31]},{type:"Identifier",name:"f",range:[19,20]},{type:"Literal",range:[21,22]},{type:"MemberExpression",range:[23,31]},{type:"Identifier",name:"JSON",range:[23,27]},{type:"Identifier",name:"str",range:[28,31]}]
		},
		"cycle 2": {
			source: "function foo() {\nthis._init = function() { return this; }\nthis.cmd = function() {\nthis._in",
			errors: [{ lineNumber: 4, message: "Unexpected end of input" }],
			nodes: [{type:"FunctionDeclaration",range:[0,90]},{type:"Identifier",name:"foo",range:[9,12]},{type:"BlockStatement",range:[15,90]},{type:"ExpressionStatement",range:[17,58]},{type:"AssignmentExpression",range:[17,57]},{type:"MemberExpression",range:[17,27]},{type:"ThisExpression",range:[17,21]},{type:"Identifier",name:"_init",range:[22,27]},{type:"FunctionExpression",range:[30,57]},{type:"BlockStatement",range:[41,57]},{type:"ReturnStatement",range:[43,55]},{type:"ThisExpression",range:[50,54]},{type:"ExpressionStatement",range:[58,90]},{type:"AssignmentExpression",range:[58,90]},{type:"MemberExpression",range:[58,66]},{type:"ThisExpression",range:[58,62]},{type:"Identifier",name:"cmd",range:[63,66]},{type:"FunctionExpression",range:[69,90]},{type:"BlockStatement",range:[80,90]},{type:"ExpressionStatement",range:[82,90]},{type:"MemberExpression",range:[82,90]},{type:"ThisExpression",range:[82,86]},{type:"Identifier",name:"_in",range:[87,90]}]
		},
		/**
		 *
		 * Object property recovery tests
		 *
		 */
		"obj prop recovery1": {
			source: "var f = {\na\n};",
			errors: [],
			nodes: [{type:'VariableDelcaration', value:'f', range:[0, 14]}, {type:'VariableDeclarator'}, {type:'ObjectExpression', range:[8, 14]}],
			tokens: [{type:'Keyword', value:'var'}, {type:'Identifier', value:'f'}, {type:'Operand', value:'='}, {type:'Punctuator', value:'{'}, {type:'Identifier', value:'a'}, {type:'Punctuator', value:'}'}, {type:'Punctuator', value:';'}]
		},
		"obj prop recovery2": {
			source: "var f = {\na:\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property*/]
		},
		"obj prop recovery3": {
			source: "var f = {\na: b.\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property*/]
		},
		"obj prop recovery4": {
			source: "var f = {\na: b/**/\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property*/]
		},
		"obj prop recovery5": {
			source: "var f = {\na: b/**/\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property*/]
		},
		"obj prop recovery6": {
			source: "var f = {\na.\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression*/]
		},
		"obj prop recovery7": {
			source: "var f = {\na/**/\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression*/]
		},
		"obj prop recovery8": {
			source: "var f = {\nz: function(){}\na: this.z\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property*/]
		},
		"obj prop recovery9": {
			source: "var f = {\nz: function(){}\na: this.z(\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property*/]
		},
		"obj prop recovery10": {
			source: "var f = {\nz: function(){}\na: this.z(this.)\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property*/]
		},
		"obj prop recovery11": {
			source: "var f = {\na: {\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property*/]
		},
		"nested obj prop recovery1": {
			source: "var f = {\none: {\na}\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property -> ObjectExpression*/]
		},
		"nested obj prop recovery2": {
			source: "var f = {\none: {\na:}\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property -> ObjectExpression -> Property*/]
		},
		"nested obj prop recovery3": {
			source: "var f = {\none: {\na: d}\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property -> ObjectExpression -> Property*/]
		},
		"nested obj prop recovery4": {
			source: "var f = {\none: {\na: d.}\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property -> ObjectExpression -> Property*/]
		},
		"nested obj prop recovery5": {
			source: "var f = {\none: {\na: d(}\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property -> ObjectExpression -> Property*/]
		},
		"nested obj prop recovery6": {
			source: "var f = {\none: {\na: {}\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property -> ObjectExpression -> Property*/]
		},
		"nested obj prop recovery7": {
			source: "var f = {\none: {\na: d(c.)\n};",
			errors: [],
			nodes: [/*VariableDelcaration -> VariableDeclarator -> ObjectExpression -> Property -> ObjectExpression -> Property*/]
		}
	};
	Object.keys(testData).forEach(function(name) {
		tests["test " + name] = runTest.bind(tests, name, testData[name]);
	});

	return tests;
});
