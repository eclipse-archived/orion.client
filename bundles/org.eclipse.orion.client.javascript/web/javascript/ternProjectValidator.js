/*******************************************************************************
 * @license
 * Copyright (c) 2015, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 /*eslint-env amd */
define([
'acorn/dist/acorn',
'estraverse/estraverse',
'i18n!javascript/nls/problems',
'orion/i18nUtil'
], /* @callback */ function(Acorn, Estraverse, Messages, i18nUtil) {

	/**
	 * @description Takes the source - a JSON object - and runs some static checks on it
	 * @param {Object} json The JSON object to check
	 * @returns {Array.<String>} The problem array
	 * @since 11.0
	 */
	function validate(json) {
		if(json) {
			var problems = [];
			if(typeof json.ecmaVersion !== 'undefined' && typeof json.ecmaVersion !== 'number') {
				problems.push(i18nUtil.formatMessage(Messages['notNum'], "ecmaVersion")); //$NON-NLS-1$
			} 
			if(typeof json.dependencyBudget !== 'undefined' && typeof json.dependencyBudget !== 'number') {
				problems.push(i18nUtil.formatMessage(Messages['notNum'], "dependencyBudget")); //$NON-NLS-1$
			}
			if(typeof json.dontLoad !== 'undefined') {
				if(!Array.isArray(json.dontLoad)) {
					problems.push(i18nUtil.formatMessage(Messages['notArray'], "dontLoad")); //$NON-NLS-1$
				} else {
					if(json.dontLoad.length < 1) {
						problems.push(i18nUtil.formatMessage(Messages['notEmpty'], "dontLoad")); //$NON-NLS-1$
					} else {
						if(!json.dontLoad.every(function(entry) { return typeof entry === 'string';})) {
							problems.push(i18nUtil.formatMessage(Messages['onlyStrings'], "dontLoad")); //$NON-NLS-1$
						}
					}
				}
			}
			if(typeof json.libs !== 'undefined') {
				if(!Array.isArray(json.libs)) {
					problems.push(i18nUtil.formatMessage(Messages['notArray'], "libs")); //$NON-NLS-1$
				} else {
					if(json.libs.length < 1) {
						problems.push(i18nUtil.formatMessage(Messages['notEmpty'], "libs")); //$NON-NLS-1$
					} else {
						if(!json.libs.every(function(entry) { return typeof entry === 'string';})) {
							problems.push(i18nUtil.formatMessage(Messages['onlyStrings'], "libs")); //$NON-NLS-1$
						}
					}
				}
			}
			if(typeof json.plugins !== 'undefined') {
				if(json.plugins === null || Array.isArray(json.plugins) || typeof json.plugins !== 'object') {
					problems.push(i18nUtil.formatMessage(Messages['notObject'], "plugins")); //$NON-NLS-1$
				}
				var keys = Object.keys(json.plugins);
				for(var i = 0, len = keys.length; i < len; i++) {
					var p = json.plugins[keys[i]];
					if(p === null || typeof p !== 'object') {
						problems.push(i18nUtil.formatMessage(Messages['pluginNotObject'], keys[i]));
					}
				}
			}
			if(typeof json.loadEagerly !== 'undefined') {
				if(!Array.isArray(json.loadEagerly)) {
					problems.push(i18nUtil.formatMessage(Messages['notArray'], "loadEagerly")); //$NON-NLS-1$
				} else if(!json.loadEagerly.every(function(entry) { return typeof entry === 'string';})) {
					problems.push(i18nUtil.formatMessage(Messages['onlyStrings'], "loadEagerly")); //$NON-NLS-1$
				}
			}
		}
		return problems;
	}	

	/**
	 * @description Validates the given source after parsing it to an AST
	 * @param {String} source The source to parse and check
	 * @returns returns
	 */
	function validateAST(source) {
		var problems = [];
		if(typeof source === 'string' && source.trim().length > 0) {
			//hack to parse JSON to an AST - prepend a var decl
			var src = "var v=" + source; //$NON-NLS-1$
			try {
				var ast = Acorn.parse(src, {
					ranges: true
				});
				if(ast && ast.body && ast.body.length > 0) {
					var root = true;
					Estraverse.traverse(ast, {
						/**
						 * @callback 
						 */
						enter: function(node) {
							if(node.type === 'ObjectExpression') {
								var props = node.properties, 
									seen = Object.create(null);
								props.forEach(function(property) {
									var key = property.key.value;
									if(Object.prototype.hasOwnProperty.call(seen, key)) {
										_reportAstError(problems, Messages['noDupes'], property.key.range);
									} else {
										seen[key] = 1;
									}
									if(root) {
										//we only want to check the root values
										switch(key) {
											case "ecmaVersion":
											case "dependencyBudget": {
												if(typeof property.value.value !== 'number') {
													_reportAstError(problems, i18nUtil.formatMessage(Messages['notNum'], key), property.value.range);
												}
												break;
											}
											case 'libs':
											case 'dontLoad':
											case 'loadEagerly': {
												var arr = property.value;
												if(arr.type !== 'ArrayExpression') {
													_reportAstError(problems, i18nUtil.formatMessage(Messages['notArray'], key), arr.range);
												} else if(arr.elements) {
													if(arr.elements.length < 1 && key !== 'loadEagerly') {
														_reportAstError(problems, i18nUtil.formatMessage(Messages['notEmpty'], key), arr.range);
													}
													arr.elements.forEach(function(entry) { 
														if(entry.type !== 'Literal' || entry.type === "Literal" && typeof entry.value !== 'string') {
															_reportAstError(problems, i18nUtil.formatMessage(Messages['onlyStrings'], key), entry.range);
														}
													});
												}
												break;
											}
											case 'plugins': {
												var obj = property.value;
												if(obj.value === null || obj.type !== 'ObjectExpression') {
													_reportAstError(problems, i18nUtil.formatMessage(Messages['notObject'], key), obj.range);
												} else if(obj.properties) {
													obj.properties.forEach(function(prop) {
														if(prop.value === null || prop.value.type !== 'ObjectExpression') {
															_reportAstError(problems, i18nUtil.formatMessage(Messages['notObject'], prop.key.value), prop.value.range);
														}
													});
												}
												break;
											}
										}
									}
								});
								root = false;
							}
						}
					});
				}
			} catch (e) {
				//do nothing, jslint handles parse errors
			}
		}
		return problems;
	}
	
	/**
	 * @description Creates a new problem object and adds it to the given problems collector
	 * @private
	 * @param {Array.<Object>} problems The collector for the new problem
	 * @param {String} message The human-readable message for the problem
	 * @param {Array.<Number>} range The start / end range array
	 * @param {String} id The internal id for the problem
	 * @param {String} severity The severity of the problem
	 * @returns returns
	 */
	function _reportAstError(problems, message, range, id, severity) {
		var pb = Object.create(null);
		pb.start = range[0]-6;
		pb.end = range[1]-6;
		pb.id = typeof id === 'string' && id.length > 0 ? id : 'tern-project-pb'; //$NON-NLS-1$
		pb.description = message;
		pb.severity = typeof severity === 'string' && severity.length > 0 ? severity : 'error'; //$NON-NLS-1$
		problems.push(pb);
	}

	return {
		validate: validate,
		validateAST: validateAST
	};
});