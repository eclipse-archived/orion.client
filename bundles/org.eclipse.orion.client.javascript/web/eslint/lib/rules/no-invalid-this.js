/*eslint-env amd */
define([
	'i18n!javascript/nls/problems',
	'module'
], function(ProblemMessages, module) {

	"use strict";
	
	var thisTagPattern = /^[\s\*]*@this/m;
	var bindOrCallOrApplyPattern = /^(?:bind|call|apply)$/;
	var arrayMethodPattern = /^(?:every|filter|find|findIndex|forEach|map|some)$/;
	var anyFunctionPattern = /^(?:Function(?:Declaration|Expression)|ArrowFunctionExpression)$/;
	var arrayOrTypedArrayPattern = /Array$/;

	/**
	 * Checks whether or not a node has a '@this' tag in its comments.
	 * @param {ASTNode} node - A node to check.
	 * @param {SourceCode} sourceCode - A SourceCode instance to get comments.
	 * @returns {boolean} Whether or not the node has a '@this' tag in its comments.
	 */
	function hasJSDocThisTag(node, sourceCode) {
		var jsdocComment = sourceCode.getJSDocComment(node);
	
		if (jsdocComment && thisTagPattern.test(jsdocComment.value)) {
			return true;
		}
	
		// Checks '@this' in its leading comments for callbacks,
		// because callbacks don't have its JSDoc comment.
		// e.g.
		//     sinon.test(/* @this sinon.Sandbox */function() { this.spy(); });
		return sourceCode.getComments(node).leading.some(function(comment) {
			return thisTagPattern.test(comment.value);
		});
	}
	
	/**
	 * Checks whether or not a node is 'Reclect.apply'.
	 * @param {ASTNode} node - A node to check.
	 * @returns {boolean} Whether or not the node is a 'Reclect.apply'.
	 */
	function isReflectApply(node) {
		return node.type === "MemberExpression" &&
			node.object.type === "Identifier" &&
			node.object.name === "Reflect" &&
			node.property.type === "Identifier" &&
			node.property.name === "apply" &&
			node.computed === false;
	}
	
	/**
	 * Checks whether or not a node is 'Array.from'.
	 * *@param {ASTNode} node - A node to check.
	 * @returns {boolean} Whether or not the node is a 'Array.from'.*/

	function isArrayFromMethod(node) {
		return node.type === "MemberExpression" &&
			node.object.type === "Identifier" &&
			arrayOrTypedArrayPattern.test(node.object.name) &&
			node.property.type === "Identifier" &&
			node.property.name === "from" &&
			node.computed === false;
	}

	/**
	 * Checks whether or not a node is a method which has `thisArg`.
	 * @param {ASTNode} node - A node to check.
	 * @returns {boolean} Whether or not the node is a method which has `thisArg`.
	 */
	function isMethodWhichHasThisArg(node) {
		var currentNode = node;
		while (currentNode) {
			if (currentNode.type === "Identifier") {
				return arrayMethodPattern.test(currentNode.name);
			}
			if (currentNode.type === "MemberExpression" && !currentNode.computed) {
				currentNode = currentNode.property;
				continue;
			}
	
			break;
		}
	
		return false;
	}
	
	/**
	 * Checks whether or not a node is a constructor.
	 * @param {ASTNode} node - A function node to check.
	 * @returns {boolean} Wehether or not a node is a constructor.
	 */
	function isES5Constructor(node) {
		return node.id &&
			node.id.name[0] !== node.id.name[0].toLocaleLowerCase();
	}
	/**
	 * Finds a function node from ancestors of a node.
	 * @param {ASTNode} node - A start node to find.
	 * @returns {Node|null} A found function node.
	 */
	function getUpperFunction(node) {
		var currentNode = node;
		while (currentNode) {
			if (anyFunctionPattern.test(currentNode.type)) {
				return currentNode;
			}
			currentNode = currentNode.parent;
		}
		return null;
	}

	/**
	 * Checks whether or not a node is 'null' or 'undefined'.
	 * 
	 * @param {ASTNode} node - A node to check.
	 * @returns {boolean} Whether or not the node is a 'null' or 'undefined'
	 * @public
	 */
	function isNullOrUndefined(node) {
		return (node.type === "Literal" && node.value === null) ||
			(node.type === "Identifier" && node.name === "undefined") ||
			(node.type === "UnaryExpression" && node.operator === "void");
	}

	/**
	 * Checks whether or not a node is callee.
	 * @param {ASTNode} node - A node to check.
	 * @returns {boolean} Whether or not the node is callee.
	 */
	function isCallee(node) {
		return node.parent.type === "CallExpression" && node.parent.callee === node;
	}

	function isDefaultThisBinding(node, sourceCode) {
		if (isES5Constructor(node) || hasJSDocThisTag(node, sourceCode)) {
			return false;
		}

		var currentNode = node;
		while (currentNode) {
			var parent = currentNode.parent;

			switch (parent.type) {

				/*
				 * Looks up the destination.
				 * e.g., obj.foo = nativeFoo || function foo() { ... };
				 */
				case "LogicalExpression":
				case "ConditionalExpression":
					currentNode = parent;
					break;

					// If the upper function is IIFE, checks the destination of the return value.
					// e.g.
					//   obj.foo = (function() {
					//     // setup...
					//     return function foo() { ... };
					//   })();
				case "ReturnStatement":
					var func = getUpperFunction(parent);

					if (func === null || !isCallee(func)) {
						return true;
					}
					currentNode = func.parent;
					break;

					// e.g.
					//   var obj = { foo() { ... } };
					//   var obj = { foo: function() { ... } };
				case "Property":
					return false;

					// e.g.
					//   obj.foo = foo() { ... };
				case "AssignmentExpression":
					return parent.right !== node ||
						parent.left.type !== "MemberExpression";

					// e.g.
					//   class A { constructor() { ... } }
					//   class A { foo() { ... } }
					//   class A { get foo() { ... } }
					//   class A { set foo() { ... } }
					//   class A { static foo() { ... } }
				case "MethodDefinition":
					return false;

					// e.g.
					//   var foo = function foo() { ... }.bind(obj);
					//   (function foo() { ... }).call(obj);
					//   (function foo() { ... }).apply(obj, []);
				case "MemberExpression":
					return parent.object !== node ||
						parent.property.type !== "Identifier" ||
						!bindOrCallOrApplyPattern.test(parent.property.name) ||
						!isCallee(parent) ||
						parent.parent.arguments.length === 0 ||
						isNullOrUndefined(parent.parent.arguments[0]);

					// e.g.
					//   Reflect.apply(function() {}, obj, []);
					//   Array.from([], function() {}, obj);
					//   list.forEach(function() {}, obj);
				case "CallExpression":
					if (isReflectApply(parent.callee)) {
						return parent.arguments.length !== 3 ||
							parent.arguments[0] !== node ||
							isNullOrUndefined(parent.arguments[1]);
					}
					if (isArrayFromMethod(parent.callee)) {
						return parent.arguments.length !== 3 ||
							parent.arguments[1] !== node ||
							isNullOrUndefined(parent.arguments[2]);
					}
					if (isMethodWhichHasThisArg(parent.callee)) {
						return parent.arguments.length !== 2 ||
							parent.arguments[0] !== node ||
							isNullOrUndefined(parent.arguments[1]);
					}
					return true;

					// Otherwise 'this' is default.
				default:
					return true;
			}
		}

		/* istanbul ignore next */
		return true;
	}

	//------------------------------------------------------------------------------
	// Rule Definition
	//------------------------------------------------------------------------------

	module.exports = function(context) {
		var stack = [],
			sourceCode = context.getSourceCode();

		/**
		 * Gets the current checking context.
		 *
		 * The return value has a flag that whether or not 'this' keyword is valid.
		 * The flag is initialized when got at the first time.
		 *
		 * @returns {{valid: boolean}}
		 *   an object which has a flag that whether or not 'this' keyword is valid.
		 */
		stack.getCurrent = function() {
			var current = this[this.length - 1];

			if (!current.init) {
				current.init = true;
				current.valid = !isDefaultThisBinding(
					current.node,
					sourceCode);
			}
			return current;
		};

		/**
		 * Pushs new checking context into the stack.
		 *
		 * The checking context is not initialized yet.
		 * Because most functions don't have 'this' keyword.
		 * When 'this' keyword was found, the checking context is initialized.
		 *
		 * @param {ASTNode} node - A function node that was entered.
		 * @returns {void}
		 */
		function enterFunction(node) {

			// 'this' can be invalid only under strict mode.
			stack.push({
				init: !context.getScope().isStrict,
				node: node,
				valid: true
			});
		}

		/**
		 * Pops the current checking context from the stack.
		 * @returns {void}
		 */
		function exitFunction() {
			stack.pop();
		}

		return {

			/*
			 * 'this' is invalid only under strict mode.
			 * Modules is always strict mode.
			 */
			Program: function(node) {
				var scope = context.getScope(),
					features = context.ecmaFeatures || {};

				stack.push({
					init: true,
					node: node,
					valid: !(
						scope.isStrict ||
						node.sourceType === "module" ||
						(features.globalReturn && scope.childScopes[0].isStrict)
					)
				});
			},

			"Program:exit": function() {
				stack.pop();
			},

			"FunctionDeclaration": enterFunction,
			"FunctionDeclaration:exit": exitFunction,
			"FunctionExpression": enterFunction,
			"FunctionExpression:exit": exitFunction,

			// Reports if 'this' of the current context is invalid.
			"ThisExpression": function(node) {
				var current = stack.getCurrent();

				if (current && !current.valid) {
					context.report(node, ProblemMessages.noInvalidThis);
				}
			}
		};
	};

	module.exports.schema = [];

	return module.exports;
});