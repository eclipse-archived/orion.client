/*******************************************************************************
 * @license
 * Copyright (c) 2015, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - Allow original requirejs plugin to find files in Orion workspace
 *******************************************************************************/
/* eslint-disable missing-nls */
/*eslint-env node, amd*/
/*globals tern tern */
define([
	"tern/lib/tern",
	"javascript/finder",
	"eslint/lib/eslint",
	"eslint/lib/source-code",
	"i18n!javascript/nls/problems"
], function(tern, Finder, Eslint, SourceCode, ProblemMessages) {

	tern.registerPlugin("eslint", /* @callback */ function(server, options) {
		return {
			//don't need any passes yet
		};
	});

	/**
	 * @description Extracts any errors captured by the tolerant Esprima parser and returns them
	 * @function
	 * @private
	 * @param {esprima.AST} ast The AST
	 * @returns {esprima.Error[]} The array of AST errors (if any)
	 */
	function extractParseErrors(ast) {
		var errors = [], errorMap = Object.create(null);
		var asterrors = ast.errors;
		if(asterrors) {
			var len = asterrors.length;
			for(var i = 0; i < len; i++) {
				var error = asterrors[i];
				var msg = error.message;
				if(errorMap[error.index] === msg) {
					continue;
				}
				errorMap[error.index] = msg;
				var start = error.start;
				var message = msg;
				var index = msg.lastIndexOf(" (");
				if (index !== -1) {
					message = msg.substr(0, index);
				}
				if(ast.tokens.length > 0) {
					//error object did not contain the token infos, try to find it
					var token = Finder.findToken(error.index, ast.tokens);
					if (start === error.end && token.range && token.range[1] === start) {
						error.start = token.range[0];
					}
					switch(token.type) {
						case "Keyword" :
							if (token.value === "export" || token.value === "import") {
								// convert to a problem with a different ruleId
								var problem = {
									severity: "error",
									start: token.start,
									end: token.end,
									message: message,
									ruleId: "forbiddenExportImport"
								};
								errors.push(problem);
								error = null;
							}
					}
				}
				if (error) {
					error.message = message;
					errors.push(error);
				}
			}
		}
		return errors;
	}
	
	/**
	 * @description Post-processes the ESLint generated problems to determine if there are any linting issues reported for the same 
	 * nodes as parse errors. If there are we discard those problems.
	 * @function
	 * @private
	 * @param {Array} parseErrors The array of parse errors, never <code>null</code>
	 * @param {Array} eslintErrors The array of eslint computed errors, never <code>null</code>
	 * @returns {Array} The filtered list of errors to report to the editor
	 * @since 6.0
	 */
	function filterProblems(parseErrors, eslintErrors) {
		var len = parseErrors.length;
		if(len < 1) {
			return eslintErrors;
		}
		var filtered = [].concat(parseErrors);
		var len2 = eslintErrors.length;
		filter: for(var i = 0; i < len2; i++) {
			var ee = eslintErrors[i];
			for(var j = 0; j < len; j++) {
				var pe = parseErrors[j];
				var node = ee.node;
				if(node && node.range && node.range[0] >= pe.index && node.range[0] <= pe.end) {
					continue filter;
				}
			}
			filtered.push(ee);
		}
		return filtered;
	}

	tern.defineQueryType("lint", {
		takesFile: true,
		/**
		 * @callback
		 */
		run: function(server, query, file) {
			var config = query.config;
			var _tern = Object.create(null);
			// delegate tern functions
			_tern.findRefs = function(query, file) {
				return tern.findRefs(server, query, file);
			};
			_tern.findRefsToVariable = function(query, file, expr, checkShadowing) {
				return tern.findRefsToVariable(server, query, file, expr, checkShadowing);
			};
			_tern.findRefsToProperty = function(query, expr, prop) {
				return tern.findRefsToProperty(server, query, expr, prop);
			};
			_tern.ternError = function(msg) {
				return tern.ternError(msg);
			};
			_tern.findQueryExpr = function(file, query, wide) {
				return tern.findQueryExpr(file, query, wide);
			};
			_tern.findExprType = function(query, file, expr) {
				return tern.findExprType(server, query, file, expr);
			};
			_tern.plugins = server.options.plugins;
			_tern.getDef = function(defName) {
				for(var i = 0, len = server.defs.length; i < len; i++) {
					var def = server.defs[i];
					if(def && (def['!name'] === defName || def[defName])) {
						return def;
					}
				}
			};
			_tern.libKnown = function libKnown(name) {
				if(server.mod && server.mod.modules) {
					if(server.mod.modules.knownModules && server.mod.modules.knownModules[name]) {
						return true;
					}
					var keys = Object.keys(server.mod.modules.modules);
					for(var i = 0, len = keys.length; i < len; i++) {
						var mod = server.mod.modules.modules[keys[i]];
						if(mod && mod.modName === name) {
							return true;
						}
					}
				}
				if(server._requireJS && server._requireJS.interfaces) {
					keys = Object.keys(server._requireJS.interfaces);
					for(i = 0, len = keys.length; i < len; i++) {
						mod = server._requireJS.interfaces[keys[i]];
						if(mod && mod.reqName === name) {
							return true;
						}
					}
				}
				return false;
			};
			_tern.isLoadEagerly = function isLoadEagerly(fileName) {
				if(server.options && Array.isArray(server.options.loadEagerly)) {
					return server.options.loadEagerly.length > 0 && server.options.loadEagerly.indexOf(fileName) > -1;
				}
				return false;
			};
			_tern.optionalPlugins = server.options.optionalPlugins;
			_tern.query = query;
			_tern.file = file;
			config.tern = _tern;
			var features = Object.create(null);
			features.modules = false;
			var ecmaVersion = server.options.ecmaVersion ? server.options.ecmaVersion : 5;
			if (ecmaVersion === 6) {
				features.arrowFunctions = true;
				features.binaryLiterals = true;
				features.blockBindings = true;
				features.classes = true;
				features.defaultParams = true;
				features.destructuring = true;
				features.forOf = true;
				features.generators = true;
				features.objectLiteralComputedProperties = true;
				features.objectLiteralDuplicateProperties = true;
				features.objectLiteralShorthandMethods = true;
				features.objectLiteralShorthandProperties = true;
				features.octalLiterals = true;
				features.regexUFlag = true;
				features.regexYFlag = true;
				features.restParams = true;
				features.spread = true;
				features.superInFunctions = true;
				features.templateStrings = true;
				features.unicodeCodePointEscapes = true;
			}
			var sourceType = server.options.sourceType;
			if (sourceType === "module") {
				features.modules = true;
			}
			config.ecmaFeatures = features;
			
			var strippedMessages = [];
			var error = null;
			try {
				var messages = Eslint.verify(new SourceCode(file.text, file.ast), config, file.name);
				messages.forEach(function(element) {
					var strippedMessage =
						{
							args: element.args,
							severity: element.severity,
							column: element.column,
							line: element.line,
							message: element.message,
							nodeType: element.nodeType,
							ruleId: element.ruleId,
							source: element.source
						};
						if (element.node && element.node.range) {
							strippedMessage.node = {
								range: element.node.range
							};
						}
						if (element.related) {
							strippedMessage.related = {
								range: element.related.range
							};
						}
					strippedMessages.push(strippedMessage);
				});
			} catch(e) {
				// ignore errors during validation
				error =
					{
						severity: "error",
						column: 1,
						line: 0,
						args: { nls: 'eslintValidationFailure', 0: e.message && e.message.length !== 0 ? e.message : ProblemMessages['noErrorDetailed']},
						start: 0,
						end: 1
					};
			}
			var parseErrors = extractParseErrors(file.ast);
			if (error && parseErrors.length === 0) {
				parseErrors.push(error);
			}
			return filterProblems(parseErrors, strippedMessages);
		}
	});
});
