/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
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
	"tern/lib/infer", 
	"tern/lib/tern",
	"orion/objects",
	"javascript/finder",
	"javascript/signatures",
	"javascript/util",
	"json!javascript/rules.json",
	"eslint/conf/environments",
	"orion/i18nUtil",
	"i18n!javascript/nls/workermessages",
	"eslint/lib/eslint",
	"eslint/lib/source-code",
	"orion/metrics",
	"javascript/astManager",
], /* @callback */ function(infer, tern, objects, Finder, Signatures, Util, Rules, ESLintEnvs, i18nUtil, Messages, Eslint, SourceCode, Metrics, ASTManager) {

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
				var token = null;
				if(error.end && error.token) {
					token = {range: [error.index, error.end], value: error.token};
				}
				else if(ast.tokens.length > 0) {
					//error object did not contain the token infos, try to find it
					token = Finder.findToken(error.index, ast.tokens);	
				}
				var msg = error.message;
				if(errorMap[error.index] === msg) {
					continue;
				}
				errorMap[error.index] = msg;
				if(error.type) {
					switch(error.type) {
						case ASTManager.ErrorTypes.Unexpected:
							if(token) {
								error.args = {0: token.value, nls: "syntaxErrorBadToken"}; //$NON-NLS-0$
								error.message = msg = error.args.nls;
							}
							break;
						case ASTManager.ErrorTypes.EndOfInput:
							error.args = {nls: "syntaxErrorIncomplete"}; //$NON-NLS-0$
							error.message = error.args.nls;
							break;
					}
				} else if(!error.token) {
					//an untyped error with no tokens, report the failure
					error.args = {0: error.message, nls: 'esprimaParseFailure'}; //$NON-NLS-1$
					error.message = error.args.nls;
					//use the line number / column
					delete error.start;
					delete error.end;
				}
				if(token) {
					error.node = token;
					if(token.value) {
						if(!error.args) {
							error.args = Object.create(null);
						}
						if(!error.args.data) {
							error.args.data = Object.create(null);
						}
						error.args.data.tokenValue = token.value;
					}
				}
				errors.push(error);
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
				if(node && node.range[0] >= pe.index && node.range[0] <= pe.end) {
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
			var start = Date.now();
			var messages = Eslint.verify(new SourceCode(file.text, file.ast), query.config);
			var end = Date.now() - start;
			Metrics.logTiming('language tools', 'validation', end, 'application/javascript'); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			var strippedMessages = [];
			messages.forEach(function(element) {
				var strippedMessage =
					{
						args: element.args,
						node: {
							range: element.node.range
						},
						severity: element.severity,
						column: element.column,
						line: element.line,
						message: element.message,
						nodeType: element.nodeType,
						ruleId: element.ruleId,
						source: element.source
					};
					if (element.related) {
						strippedMessage.related = {
							range: element.related.range
						};
					}
				strippedMessages.push(strippedMessage);
			});
			var parseErrors = extractParseErrors(file.ast);
			return filterProblems(parseErrors, strippedMessages);
		}
	});
});
