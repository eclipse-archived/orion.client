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
'orion/editor/templates'
], function(mTemplates) {

	var typeofValues = {
		type: "link", //$NON-NLS-0$
		values: [
			"boolean", //$NON-NLS-0$
			"function", //$NON-NLS-0$
			"number", //$NON-NLS-0$
			"object", //$NON-NLS-0$
			"string", //$NON-NLS-0$
			"symbol", //$NON-NLS-1$
			"undefined" //$NON-NLS-0$
		],
		title: 'Typeof Options',
		style: 'emphasis' //$NON-NLS-1$
	};

	/**
	 * @description Array of template metadata objects. These get converted into
	 * {orion.editor.Template} objects lazily as they are asked for
	 * @private 
	 */
	var templates = [
	    {
			prefix: "arrow", //$NON-NLS-0$
			name: "arrow",  //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - arrow function expression", //$NON-NLS-0$
			template: "${param} => {${cursor}}" //$NON-NLS-0$
		},
		{
			prefix: "arrow", //$NON-NLS-0$
			name: "arrow object",  //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - arrow function expression returning an object", //$NON-NLS-0$
			template: "var ${name} = () => ({ ${prop}: ${val}${cursor} });" //$NON-NLS-0$
		},
		{
			prefix: "if", //$NON-NLS-0$
			name: "if",  //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - if statement", //$NON-NLS-0$
			template: "if (${condition}) {\n\t${cursor}\n}" //$NON-NLS-0$
		},
		{
			prefix: "if", //$NON-NLS-0$
			name: "if", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - if else statement", //$NON-NLS-0$
			template: "if (${condition}) {\n\t${cursor}\n} else {\n\t\n}" //$NON-NLS-0$
		},
		{
			prefix: "for", //$NON-NLS-0$
			name: "for", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - iterate over array", //$NON-NLS-0$
			template: "for (var ${i}=0; ${i}<${array}.length; ${i}++) {\n\t${cursor}\n}" //$NON-NLS-0$
		},
		{
			prefix: "for", //$NON-NLS-0$
			name: "for", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - iterate over array with local var", //$NON-NLS-0$
			template: "for (var ${i}=0; ${i}<${array}.length; ${i}++) {\n\tvar ${value} = ${array}[${i}];\n\t${cursor}\n}" //$NON-NLS-0$
		},
		{
			prefix: "for", //$NON-NLS-0$
			name: "for..in", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - iterate over properties of an object", //$NON-NLS-0$
			template: "for (var ${property} in ${object}) {\n\tif (${object}.hasOwnProperty(${property})) {\n\t\t${cursor}\n\t}\n}" //$NON-NLS-0$
		},
		{
			prefix: "while", //$NON-NLS-0$
			name: "while", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - while loop with condition", //$NON-NLS-0$
			template: "while (${condition}) {\n\t${cursor}\n}" //$NON-NLS-0$
		},
		{
			prefix: "do", //$NON-NLS-0$
			name: "do", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - do while loop with condition", //$NON-NLS-0$
			template: "do {\n\t${cursor}\n} while (${condition});" //$NON-NLS-0$
		},
		{
		    prefix: "eslint", //$NON-NLS-0$
			name: "eslint", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false, doc:false, jsdoc:false},
			description: " - ESLint rule enable / disable directive", //$NON-NLS-0$
			template: "/* eslint ${rule-id}:${0/1}*/" //$NON-NLS-0$
		},
		{
		    prefix: "eslint-env", //$NON-NLS-0$
			name: "eslint-env", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false, doc:false, jsdoc:false},
			description: " - ESLint environment directive", //$NON-NLS-0$
			template: "/* eslint-env ${library}*/" //$NON-NLS-0$
		},
		{
		    prefix: "eslint-enable", //$NON-NLS-0$
			name: "eslint-enable", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false, doc:false, jsdoc:false},
			description: " - ESLint rule enablement directive", //$NON-NLS-0$
			template: "/* eslint-enable ${rule-id} */" //$NON-NLS-0$
		},
		{
		    prefix: "eslint-disable", //$NON-NLS-0$
			name: "eslint-disable", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false, doc:false, jsdoc:false},
			description: " - ESLint rule disablement directive", //$NON-NLS-0$
			template: "/* eslint-disable ${rule-id} */" //$NON-NLS-0$
		},
		{
			prefix: "switch", //$NON-NLS-0$
			name: "switch", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - switch case statement", //$NON-NLS-0$
			template: "switch (${expression}) {\n\tcase ${value1}:\n\t\t${cursor}\n\t\tbreak;\n\tdefault:\n}" //$NON-NLS-0$
		},
		{
			prefix: "case", //$NON-NLS-0$
			name: "case", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false, swtch: true},
			description: " - case statement", //$NON-NLS-0$
			template: "case ${value}:\n\t${cursor}\n\tbreak;" //$NON-NLS-0$
		},
		{
			prefix: "try", //$NON-NLS-0$
			name: "try", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - try..catch statement", //$NON-NLS-0$
			template: "try {\n\t${cursor}\n} catch (${err}) {\n}" //$NON-NLS-0$
		},
		{
			prefix: "try", //$NON-NLS-0$
			name: "try", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - try..catch statement with finally block", //$NON-NLS-0$
			template: "try {\n\t${cursor}\n} catch (${err}) {\n} \n finally {\n}" //$NON-NLS-0$
		},
		{
			prefix: "typeof", //$NON-NLS-0$
			name: "typeof", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - typeof statement", //$NON-NLS-0$
			template: "typeof ${object} === \"${type:" + JSON.stringify(typeofValues).replace("}", "\\}") + "}\"" //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
		},
		{
			prefix: "instanceof", //$NON-NLS-0$
			name: "instanceof", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - instanceof statement", //$NON-NLS-0$
			template: "${object} instanceof ${type}" //$NON-NLS-0$
		},
		{
			prefix: "with", //$NON-NLS-0$
			name: "with", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - with statement", //$NON-NLS-0$
			template: "with (${object}) {\n\t${cursor}\n}" //$NON-NLS-0$
		},
		{
			prefix: "function", //$NON-NLS-0$
			name: "function", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - function declaration",  //$NON-NLS-0$
			template: "/**\n"+  //$NON-NLS-0$
					  " * @name ${name}\n"+  //$NON-NLS-0$
					  " * @param ${parameter}\n"+  //$NON-NLS-0$
					  " */\n"+  //$NON-NLS-0$
					  "function ${name} (${parameter}) {\n\t${cursor}\n}" //$NON-NLS-0$
		},
		{
			prefix: "function", //$NON-NLS-0$
			name: "function", //$NON-NLS-0$
			nodes: {top:false, member:false, prop:false, obj:true},
			description: " - member function expression",  //$NON-NLS-0$
			template: "/**\n"+  //$NON-NLS-0$
					  " * @name ${name}\n"+  //$NON-NLS-0$
					  " * @function\n"+  //$NON-NLS-0$
					  " * @param ${parameter}\n"+  //$NON-NLS-0$
					  " */\n"+  //$NON-NLS-0$
					  "${name}: function(${parameter}) {\n\t${cursor}\n}" //$NON-NLS-0$
		},
		{
			prefix: "function", //$NON-NLS-0$
			name: "function", //$NON-NLS-0$
			nodes: {top:false, member:false, prop:true, obj:false},
			description: " - member function expression",  //$NON-NLS-0$
			template: "function(${parameter}) {\n\t${cursor}\n}" //$NON-NLS-0$
		},
		{
			prefix: "define", //$NON-NLS-0$
			name: "define", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - define function call",  //$NON-NLS-0$
			template: "/* eslint-env amd */\n"+ //$NON-NLS-1$
					  "define('${name}', [\n"+  //$NON-NLS-0$
					  "'${import}'\n"+  //$NON-NLS-0$
					  "], function(${importname}) {\n"+  //$NON-NLS-0$
					  "\t${cursor}\n"+  //$NON-NLS-0$
					  "});" //$NON-NLS-0$
		},
		{
			prefix: "nls", //$NON-NLS-0$
			name: "nls", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - non NLS string", //$NON-NLS-0$
			template: "${cursor} //$NON-NLS-${0}$" //$NON-NLS-0$
		},
		{
			prefix: "log", //$NON-NLS-0$
			name: "log", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - console log", //$NON-NLS-0$
			template: "console.log(${object});" //$NON-NLS-0$
		},
		{
		    prefix: "node", //$NON-NLS-0$
			name: "node", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false, doc:false, jsdoc:false},
			description: " - Node require function call", //$NON-NLS-0$
			template: "/* eslint-env node*/\n"+ //$NON-NLS-1$
					  "var lib = require('${cursor}');" //$NON-NLS-1$
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
		var len = templates.length;
		for(var i = 0; i < len; i++) {
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