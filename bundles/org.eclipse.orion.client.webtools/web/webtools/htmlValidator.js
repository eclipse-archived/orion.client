/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
define("webtools/htmlValidator", [
	'orion/objects',
	'htmlparser2/visitor',
	'webtools/htmlValidatorRules',
], function(Objects, Visitor, Rules) {

	/**
	 * @description Creates a new validator
	 * @constructor
	 * @public
	 * @param {Object} cssResultManager The back result manager
	 * @since 6.0
	 */
	function HtmlValidator(htmlAstManager) {
	    this.htmlAstManager = htmlAstManager;
	}

	Objects.mixin(HtmlValidator.prototype, /** @lends webtools.CssValidator.prototype*/ {
		
		/**
		 * @description Callback to create problems from orion.edit.validator
		 * @function
		 * @public
		 * @param {orion.edit.EditorContext} editorContext The editor context
		 * @param {Object} context The in-editor context (selection, offset, etc)
		 * @returns {orion.Promise} A promise to compute some problems
		 * @callback
		 */
		computeProblems: function(editorContext, context) {
			var that = this;
		    return that.htmlAstManager.getAST(editorContext).then(function(ast) {
				return that._computeProblems(ast, context);
			});
		},
		
		/**
		 * @description Create the problems 
		 * @function
		 * @private
		 * @param {String} contents The file contents
		 * @returns {Array} The problem array
		 */
		_computeProblems: function(ast, context) {
		    if (!ast){
				return null;
			}
			// TODO Load options from settings https://github.com/htmllint/htmllint/wiki/Options
			var options;
			if (!options){
				options = Rules.defaultOptions;
			}
		    var problems = [];
			function addProblems(newProblems){
				if (newProblems){
					if (Array.isArray(newProblems)){
						problems = problems.concat(newProblems);
					} else {
						problems.push(newProblems);
					}
				}
			}
			var ruleMap = Rules.ruleMap(options);
			var dom = ast;
			if (!Array.isArray(ast) && ast.children){
				dom = ast.children;
			}
			Visitor.visit(dom, {
	            visitNode: function(node) {
					if (node.type === 'tag'){
						var rules = ruleMap['tag'];
						if (rules){
							for (var i = 0; i < rules.length; i++) {
								addProblems(rules[i](node));
							}
						}
						if (node.name){
							rules = ruleMap[node.name.toLowerCase()];
							if (rules){
								for (i = 0; i < rules.length; i++) {
									addProblems(rules[i](node));
								}
							}
						}
					}
	            },
	            /**
	             * @callback
	             */
	            endVisitNode: function(node) {
	            	
	            }
	        });
			return {problems: problems};
		},
	});
	
	return HtmlValidator;
});