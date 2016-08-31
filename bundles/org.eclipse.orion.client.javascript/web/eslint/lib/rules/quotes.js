/*eslint-env amd */
define([
	'i18n!javascript/nls/problems',
	'module'
], function(ProblemMessages, module) {
	/**
	 * @fileoverview Rule to flag use of an object property of the global object (Math and JSON) as a function
	 * @author James Allardice
	 */

	"use strict";

	var QUOTE_SETTINGS = {
		double: {
			quote: "\"",
			alternateQuote: "'",
			description: "doublequote"
		},
		single: {
			quote: "'",
			alternateQuote: "\"",
			description: "singlequote"
		},
		backtick: {
			quote: "`",
			alternateQuote: "\"",
			description: "backtick"
		}
	};

	var AVOID_ESCAPE = "avoid-escape",
		FUNCTION_TYPE = /^(?:Arrow)?Function(?:Declaration|Expression)$/;

	/**
	 * Validate that a string passed in is surrounded by the specified character
	 * @param  {string} val The text to check.
	 * @param  {string} character The character to see if it's surrounded by.
	 * @returns {boolean} True if the text is surrounded by the character, false if not.
	 * @private
	 */
	function isSurroundedBy(val, character) {
		return val[0] === character && val[val.length - 1] === character;
	}

	//------------------------------------------------------------------------------
	// Rule Definition
	//------------------------------------------------------------------------------

	module.exports = function(context) {

		var quoteOption = context.options[0],
			settings = QUOTE_SETTINGS[quoteOption || "double"],
			options = context.options[1],
			avoidEscape = options && options.avoidEscape === true,
			allowTemplateLiterals = options && options.allowTemplateLiterals === true;

		// deprecated
		if (options === AVOID_ESCAPE) {
			avoidEscape = true;
		}

		/**
		 * Determines if a given node is part of JSX syntax.
		 * @param {ASTNode} node The node to check.
		 * @returns {boolean} True if the node is a JSX node, false if not.
		 * @private
		 */
		function isJSXElement(node) {
			return node.type.indexOf("JSX") === 0;
		}

		/**
		 * Checks whether or not a given node is a directive.
		 * The directive is a `ExpressionStatement` which has only a string literal.
		 * @param {ASTNode} node - A node to check.
		 * @returns {boolean} Whether or not the node is a directive.
		 * @private
		 */
		function isDirective(node) {
			return node.type === "ExpressionStatement" &&
				node.expression.type === "Literal" &&
				typeof node.expression.value === "string";
		}

		/**
		 * Checks whether or not a given node is a part of directive prologues.
		 * See also: http://www.ecma-international.org/ecma-262/6.0/#sec-directive-prologues-and-the-use-strict-directive
		 * @param {ASTNode} node - A node to check.
		 * @returns {boolean} Whether or not the node is a part of directive prologues.
		 * @private
		 */
		function isPartOfDirectivePrologue(node) {
			var block = node.parent.parent;

			if (block.type !== "Program" && (block.type !== "BlockStatement" || !FUNCTION_TYPE.test(block.parent.type))) {
				return false;
			}

			// Check the node is at a prologue.
			for (var i = 0; i < block.body.length; ++i) {
				var statement = block.body[i];

				if (statement === node.parent) {
					return true;
				}
				if (!isDirective(statement)) {
					break;
				}
			}

			return false;
		}

		/**
		 * Checks whether or not a given node is allowed as non backtick.
		 * @param {ASTNode} node - A node to check.
		 * @returns {boolean} Whether or not the node is allowed as non backtick.
		 * @private
		 */
		function isAllowedAsNonBacktick(node) {
			var parent = node.parent;

			switch (parent.type) {

				// Directive Prologues.
				case "ExpressionStatement":
					return isPartOfDirectivePrologue(node);

					// LiteralPropertyName.
				case "Property":
					return parent.key === node && !parent.computed;

					// ModuleSpecifier.
				case "ImportDeclaration":
				case "ExportNamedDeclaration":
				case "ExportAllDeclaration":
					return parent.source === node;

					// Others don't allow.
				default:
					return false;
			}
		}

		return {

			Literal: function(node) {
				var val = node.value,
					rawVal = node.raw,
					isValid;

				if (settings && typeof val === "string") {
					isValid = (quoteOption === "backtick" && isAllowedAsNonBacktick(node)) ||
						isJSXElement(node.parent) ||
						isSurroundedBy(rawVal, settings.quote);

					if (!isValid && avoidEscape) {
						isValid = isSurroundedBy(rawVal, settings.alternateQuote) && rawVal.indexOf(settings.quote) >= 0;
					}

					if (!isValid) {
						var data = Object.create(null);
						data.quote = QUOTE_SETTINGS[quoteOption].quote;
						context.report(node, ProblemMessages.wrongQuotes, {description: settings.description, data: data});
					}
				}
			},

			TemplateLiteral: function(node) {

				// If backticks are expected or it's a tagged template, then this shouldn't throw an errors
				if (allowTemplateLiterals || quoteOption === "backtick" || node.parent.type === "TaggedTemplateExpression") {
					return;
				}

				var shouldWarn = node.quasis.length === 1 && node.quasis[0].value.cooked.indexOf("\n") === -1;

				if (shouldWarn) {
					var data = Object.create(null);
					data.quote = QUOTE_SETTINGS[quoteOption].quote;
					data.oldQuote = '`';
					context.report(node, ProblemMessages.wrongQuotes, {description: settings.description, data: data});
				}
			}
		};

	};

	module.exports.schema = [
		{
			"enum": ["single", "double", "backtick"]
		},
		{
			anyOf: [{
				"enum": ["avoid-escape"]
			},
			{
				type: "object",
				properties: {
					avoidEscape: {
						type: "boolean"
					},
					allowTemplateLiterals: {
						type: "boolean"
					}
				},
				additionalProperties: false
			}]
		}
	];

	return module.exports;
});