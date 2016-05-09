/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd*/
define([
'orion/editor/templates',
"i18n!javascript/nls/messages"
], function(mTemplates, Messages) {

	var typeofValues = {
		type: "link", //$NON-NLS-1$
		values: [
			"boolean", //$NON-NLS-1$
			"function", //$NON-NLS-1$
			"number", //$NON-NLS-1$
			"object", //$NON-NLS-1$
			"string", //$NON-NLS-1$
			"symbol", //$NON-NLS-1$
			"undefined" //$NON-NLS-1$
		],
		title: Messages['typeofOptions'],
		style: 'emphasis' //$NON-NLS-1$
	};

	/**
	 * @description Array of template metadata objects. These get converted into
	 * {orion.editor.Template} objects lazily as they are asked for
	 * @private 
	 */
	var templates = [
		{
			prefix: "if", //$NON-NLS-1$
			name: "if",  //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "if (${condition}) {\n\t${cursor}\n}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/if...else", 
			doc: Messages['ifSimple'],
			ecma: 5
		},
		{
			prefix: "if", //$NON-NLS-1$
			name: "if..else", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "if (${condition}) {\n\t${cursor}\n} else {\n\t\n}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/if...else", 
			doc: Messages['ifElseSimple'],
			ecma: 5
		},
		{
			prefix: "for", //$NON-NLS-1$
			name: "for", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "for (var ${i}=0; ${i}<${array}.length; ${i}++) {\n\t${cursor}\n}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for", 
			doc: Messages['forArray'],
			ecma: 5
		},
		{
			prefix: "for", //$NON-NLS-1$
			name: "for with var", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "for (var ${i}=0; ${i}<${array}.length; ${i}++) {\n\tvar ${value} = ${array}[${i}];\n\t${cursor}\n}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for", 
			doc: Messages['forArrayVar'],
			ecma: 5
		},
		{
			prefix: "for", //$NON-NLS-1$
			name: "for..in", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "for (var ${property} in ${object}) {\n\tif (${object}.hasOwnProperty(${property})) {\n\t\t${cursor}\n\t}\n}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in", 
			doc: Messages['forInSimple'],
			ecma: 5
		},
		{
			prefix: "while", //$NON-NLS-1$
			name: "while", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "while (${condition}) {\n\t${cursor}\n}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/while", 
			doc: Messages['whileSimple'],
			ecma: 5
		},
		{
			prefix: "do", //$NON-NLS-1$
			name: "do", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "do {\n\t${cursor}\n} while (${condition});", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/do...while", 
			doc: Messages['doSimple'],
			ecma: 5
		},
		{
		    prefix: "eslint", //$NON-NLS-1$
			name: "eslint", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false, doc:false, jsdoc:false},
			template: "/* eslint ${rule-id}:${0/1}*/", //$NON-NLS-1$
			url: "http://eslint.org/docs/user-guide/configuring.html#configuring-rules", //$NON-NLS-1$
			doc: Messages['eslintRuleEnableDisable'],
			ecma: 5
		},
		{
		    prefix: "eslint-env", //$NON-NLS-1$
			name: "eslint-env", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false, doc:false, jsdoc:false},
			template: "/* eslint-env ${library}*/", //$NON-NLS-1$
			url: "http://eslint.org/docs/user-guide/configuring.html#specifying-environments", //$NON-NLS-1$
			doc: Messages['eslintEnvDirective'],
			ecma: 5
		},
		{
		    prefix: "eslint-enable", //$NON-NLS-1$
			name: "eslint-enable", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false, doc:false, jsdoc:false},
			template: "/* eslint-enable ${rule-id} */", //$NON-NLS-1$
			url: "http://eslint.org/docs/user-guide/configuring.html#configuring-rule", //$NON-NLS-1$
			doc: Messages['eslintRuleEnable'],
			ecma: 5
		},
		{
		    prefix: "eslint-disable", //$NON-NLS-1$
			name: "eslint-disable", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false, doc:false, jsdoc:false},
			template: "/* eslint-disable ${rule-id} */", //$NON-NLS-1$
			url: "http://eslint.org/docs/user-guide/configuring.html#configuring-rules", //$NON-NLS-1$
			doc: Messages['eslintRuleDisable'],
			ecma: 5
		},
		{
			prefix: "switch", //$NON-NLS-1$
			name: "switch", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "switch (${expression}) {\n\tcase ${value1}:\n\t\t${cursor}\n\t\tbreak;\n\tdefault:\n}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch", 
			doc: Messages['switchSimple'],
			ecma: 5
		},
		{
			prefix: "case", //$NON-NLS-1$
			name: "case", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false, swtch: true},
			template: "case ${value}:\n\t${cursor}\n\tbreak;", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch", 
			doc: Messages['caseSimple'],
			ecma: 5
		},
		{
			prefix: "try", //$NON-NLS-1$
			name: "try..catch", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "try {\n\t${cursor}\n} catch (${err}) {\n}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch", 
			doc: Messages['tryCatch'],
			ecma: 5
		},
		{
			prefix: "try", //$NON-NLS-1$
			name: "try..catch..finally", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "try {\n\t${cursor}\n} catch (${err}) {\n} \n finally {\n}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch", 
			doc: Messages['tryCatchFinally'],
			ecma: 5
		},
		{
			prefix: "typeof", //$NON-NLS-1$
			name: "typeof", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "typeof ${object} === \"${type:" + JSON.stringify(typeofValues).replace("}", "\\}") + "}\"", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof", 
			doc: Messages['typeofSimple'],
			ecma: 5
		},
		{
			prefix: "instanceof", //$NON-NLS-1$
			name: "instanceof", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "${object} instanceof ${type}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof", 
			doc: Messages['instanceofSimple'],
			ecma: 5
		},
		{
			prefix: "with", //$NON-NLS-1$
			name: "with", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "with (${object}) {\n\t${cursor}\n}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with", 
			doc: Messages['withSimple'],
			ecma: 5
		},
		{
			prefix: "function", //$NON-NLS-1$
			name: "function", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "/**\n"+  //$NON-NLS-1$
					  " * @name ${name}\n"+  //$NON-NLS-1$
					  " * @param ${parameter}\n"+  //$NON-NLS-1$
					  " */\n"+  //$NON-NLS-1$
					  "function ${name} (${parameter}) {\n\t${cursor}\n}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function", 
			doc: Messages['functionSimple'],
			ecma: 5
		},
		{
			prefix: "function", //$NON-NLS-1$
			name: "function", //$NON-NLS-1$
			nodes: {top:false, member:false, prop:false, obj:true},
			template: "/**\n"+  //$NON-NLS-1$
					  " * @name ${name}\n"+  //$NON-NLS-1$
					  " * @function\n"+  //$NON-NLS-1$
					  " * @param ${parameter}\n"+  //$NON-NLS-1$
					  " */\n"+  //$NON-NLS-1$
					  "${name}: function(${parameter}) {\n\t${cursor}\n}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function", 
			doc: Messages['functionProp'],
			ecma: 5
		},
		{
			prefix: "function", //$NON-NLS-0$
			name: "function", //$NON-NLS-0$
			nodes: {top:false, member:false, prop:true, obj:false},
			template: "function(${parameter}) {\n\t${cursor}\n}", //$NON-NLS-0$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function", 
			doc: Messages['functionProp'],
		},
		{
			prefix: "define", //$NON-NLS-1$
			name: "define", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "/* eslint-env amd */\n"+ //$NON-NLS-1$
					  "define('${name}', [\n"+  //$NON-NLS-1$
					  "'${import}'\n"+  //$NON-NLS-1$
					  "], function(${importname}) {\n"+  //$NON-NLS-1$
					  "\t${cursor}\n"+  //$NON-NLS-1$
					  "});", //$NON-NLS-1$
			url: "http://requirejs.org/docs/api.html#deffunc", 
			doc: Messages['defineSimple'],
			ecma: 5
		},
		{
			prefix: "nls", //$NON-NLS-1$
			name: "nls", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "${cursor} //$NON-NLS-${0}$", //$NON-NLS-1$
			doc: Messages['nlsSimple'],
			ecma: 5
		},
		{
			prefix: "log", //$NON-NLS-1$
			name: "log", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "console.log(${object});", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en/docs/Web/API/Console/log", 
			doc: Messages['logSimple'],
			ecma: 5
		},
		{
		    prefix: "node", //$NON-NLS-1$
			name: "node", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false, doc:false, jsdoc:false},
			template: "/* eslint-env node*/\n"+ //$NON-NLS-1$
					  "var lib = require('${cursor}');", //$NON-NLS-1$
			url: "https://nodejs.org/api/modules.html#modules_modules", 
			doc: Messages['requireSimple'],
			ecma: 5
		},
		{
			prefix: "arrow", //$NON-NLS-1$
			name: "arrow",  //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "${param} => {${cursor}}", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions", //$NON-NLS-1$
			doc: Messages['arrowFunc'],
			ecma: 6
		},
		{
			prefix: "arrow", //$NON-NLS-1$
			name: "arrow with object",  //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "var ${name} = () => ({ ${prop}: ${val}${cursor} });", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions", //$NON-NLS-1$
			doc: Messages['arrowFuncObj'],
			ecma: 6
		},
		{
			prefix: "class", //$NON-NLS-1$
			name: "class", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "class ${name} extends ${superClass}; {\n"+
						"\tconstructor() {\n"+
						"\t\t${cursor}\n"+
						"\t}\n"+
						"}\n",
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes", //$NON-NLS-1$
			doc: Messages['classSimple'],
			ecma: 6
		},
		{
			prefix: "class", //$NON-NLS-1$
			name: "class expression", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "var ${name} = class ${className} extends ${superClass}; {\n"+
						"\tconstructor() {\n"+
						"\t\t${cursor}\n"+
						"\t}\n"+
						"}\n",
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/class", //$NON-NLS-1$
			doc: Messages['classExpr'],
			ecma: 6
		},
		{
			prefix: "const", //$NON-NLS-1$
			name: "const", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "const ${name} = ${value};", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const", //$NON-NLS-1$
			doc: Messages['constSimple'],
			ecma: 6
		},
		{
			prefix: "export", //$NON-NLS-1$
			name: "export", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "export ${value};", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export", //$NON-NLS-1$
			doc: Messages['exportSimple'],
			ecma: 6
		},
		{
			prefix: "export", //$NON-NLS-1$
			name: "export default", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "export default ${value};", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export", //$NON-NLS-1$
			doc: Messages['exportDefault'],
			ecma: 6
		},
		{
			prefix: "for", //$NON-NLS-1$
			name: "for..of", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "for (${variable} of ${iterable}) {\n"+ //$NON-NLS-1$
  					  "    ${cursor}\n"+ //$NON-NLS-1$
					  "}",
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of", //$NON-NLS-1$
			doc: Messages['forOf'],
			ecma: 6
		},
		{
			prefix: "function*", //$NON-NLS-1$
			name: "function (generator)", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "function* ${name}(${param}) {\n"+ //$NON-NLS-1$
   					  "    ${cursor}\n"+ //$NON-NLS-1$
					  "}",
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*", //$NON-NLS-1$
			doc: Messages['funcGenerator'],
			ecma: 6
		},
		{
			prefix: "import", //$NON-NLS-1$
			name: "import default member",  //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "import ${member} from \"${module}\";", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import", //$NON-NLS-1$
			doc: Messages['importSimpleDefault'],
			ecma: 6
		},
		{
			prefix: "import", //$NON-NLS-1$
			name: "import all as",  //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "import * as ${name} from \"${module}\";", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import", //$NON-NLS-1$
			doc: Messages['importStarAs'],
			ecma: 6
		},
		{
			prefix: "import", //$NON-NLS-1$
			name: "import members",  //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "import { ${member1} , ${member2} } from \"${module}\";", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import", //$NON-NLS-1$
			doc: Messages['importMultiMember'],
			ecma: 6
		},
		{
			prefix: "import", //$NON-NLS-1$
			name: "import module",  //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "import \"${module}\"", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import", //$NON-NLS-1$
			doc: Messages['importSideEffects'],
			ecma: 6
		},
		{
			prefix: "let", //$NON-NLS-1$
			name: "let", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "let ${name} = ${value};", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let", //$NON-NLS-1$
			doc: Messages['letSimple'],
			ecma: 6
		},
		{
			prefix: "yield", //$NON-NLS-1$
			name: "yield", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "yield ${expression};", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield", //$NON-NLS-1$
			doc: Messages['yieldSimple'],
			ecma: 6
		},
		{
			prefix: "yield", //$NON-NLS-1$
			name: "yield with return", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "${value} = yield ${expression};", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield", //$NON-NLS-1$
			doc: Messages['yieldSimpleReturn'],
			ecma: 6
		},
		{
			prefix: "yield*", //$NON-NLS-1$
			name: "yield delegate", //$NON-NLS-1$
			nodes: {top:true, member:false, prop:false},
			template: "yield* ${gennerator};", //$NON-NLS-1$
			url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*", //$NON-NLS-1$
			doc: Messages['yieldDelegate'],
			ecma: 6
		}
	];

	/**
	 * @description Returns the corresponding {orion.editor.Template} object for the given metadata
	 * @private
	 * @param {Object} meta The metadata about the template
	 * @returns {orion.editor.Template} The corresponding template object
	 * @since 6.0
	 */
	function _getTemplate(meta) {
		if(meta.t) {
			return meta.t;
		}
		var t = new mTemplates.Template(meta.prefix, meta.description, meta.template, meta.name);
		if(meta.doc) {
			t.doc = meta.doc;
		}
		if(meta.url) {
			t.url = meta.url;
		}
		t.ecma = meta.ecma;
		meta.t = t;
		return t;
	}

	/**
	 * @description Returns the templates that apply to the given completion kind
	 * @public
	 * @param {String} kind The kind of the completion
	 * @returns {Array} The array of templates that apply to the given completion kind
	 * @since 6.0
	 */
	function getTemplatesForKind(kind) {
		var tmplates = [];
		for(var i = 0, len = templates.length; i < len; i++) {
			var template = templates[i];
			if(template.nodes && template.nodes[kind]) {
				tmplates.push(template);
			}
		}
		return tmplates.map(_getTemplate, this);
	}
	
	return {
		getTemplatesForKind: getTemplatesForKind
	};
});