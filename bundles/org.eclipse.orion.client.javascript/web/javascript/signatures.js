/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define*/
define([
], function() {

	var Signatures = {
	
		/**
		 * @name computeSignature
		 * @description Computes a signature object from the given AST node. The object holds two properties:
		 * <code>sig</code> - the human readable signature and <code>range</code> 
		 * @function
		 * @public
		 * @memberof javascript.Signatures.prototype
		 * @param {Object} astnode The AST node to parse and compute the signature from
		 * @returns {Object} The computed signature object or <code>null</code> if the computation fails
		 */
		computeSignature: function(astnode) {
			if(astnode) {
				var val = this.getNameFrom(astnode);
				return {
					sig: val,
					range: this.getSignatureSourceRangeFrom(astnode)
				};
			}
			return null;
		},
		
		/**
		 * @name getParamsFrom
		 * @description Retrieves the parameters from the given AST node iff it a function declaration. If there is an attached doc node
		 * it will be consulted to help compute the types of the parameters
		 * @function
		 * @public
		 * @memberof javascript.Signatures.prototype
		 * @param {Object} astnode The AST node to compute the parameters from
		 * @returns {Array} An array of parameter names suitable for display, in the order they are defined in source. If no parameters
		 * can be computed an empty array is returned, never <code>null</code>
		 */
		getParamsFrom: function(astnode) {
			if(astnode) {
				var params = astnode.params;
				//TODO with the attached doc node we can augment this infos
				if(params && params.length > 0) {
					var length = params.length;
					var value = '';
					for(var i = 0; i < length; i++) {
						if(params[i].name) {
							value += params[i].name;
						}
						else {
							value += 'Object';
						}
						if(i < length -1) {
							value += ', ';
						}
					}
					return value;
				} 
			}
		},
		
		/**
		 * @name getNameFrom
		 * @description Returns the name to display for the given AST node. If there is an attached doc node it
		 * will be consulted to help compute the name to display
		 * @function
		 * @public
		 * @memberof javascript.Signatures.prototype
		 * @param {Object} astnode The AST node to compute the name from
		 * @returns {String} The computed name to display for the node or <code>null</code> if one could not be computed
		 */
		getNameFrom: function(astnode) {
			var name = "Anonyous " + astnode.type;
			if(astnode && astnode.type) {
				if(astnode.type === 'FunctionDeclaration') {
					//TODO with the attached doc node we can augment this infos
					if(astnode.id && astnode.id.name) {
						name = astnode.id.name+'(';
						var fparams = this.getParamsFrom(astnode);
						if(fparams) {
							name += fparams;
						}
						name += ')';
						return name;
					}
				}
				else if(astnode.type === 'FunctionExpression') {
					name = 'function(';
					var feparams = this.getParamsFrom(astnode);
					if(feparams) {
						name += feparams;
					}
					name += ')';
					return name;
				}
				else if(astnode.type === 'ObjectExpression') {
					name = 'closure {...}';
				}
				else if(astnode.type === 'Property') {
					if(astnode.value) {
						if(astnode.value.type === 'FunctionExpression') {
							if(astnode.key && astnode.key.name) {
								name = astnode.key.name + '(';
							}
							else {
								name = 'function(';
							}
							var pparams = this.getParamsFrom(astnode.value);
							if(pparams) {
								name += pparams;
							}
							name += ')';
						}
						else if(astnode.value.type === 'ObjectExpression') {
							if(astnode.key && astnode.key.name) {
								name = astnode.key.name + ' {...}';
							}
						}
						else if(astnode.key && astnode.key.name) {
							name = astnode.key.name;
						}
					}
				}
				else if(astnode.type === 'VariableDeclarator') {
					if(astnode.init) {
						if(astnode.init.type === 'ObjectExpression') {
							if(astnode.id && astnode.id.name) {
								name = 'var '+astnode.id.name+ ' = {...}';
							}
						}
						else if(astnode.init.type === 'FunctionDeclaration') {
							if(astnode.id && astnode.id.name) {
								name = this.getNameFrom(astnode.init);
							}
						}
					}
				}
			}
			return name;
		},
		
		/**
		 * @name getSignatureSourceRangeFrom
		 * @description Computes the signature source range (start, end) for the given node 
		 * @function
		 * @ppublic
		 * @memberof javascript.Signatures.prototype
		 * @param {Object} astnode The AST node to compute the range from
		 * @returns {Array} The computed signature source range as an array [start, end] or <code>[-1, -1]</code> if it could not
		 * be computed
		 */
		getSignatureSourceRangeFrom: function(astnode) {
			var range = [0, 0];
			if(astnode) {
				if(astnode.type === 'Property') {
					if(astnode.key && astnode.key.range) {
						range = astnode.key.range;
					}
				}
				else if(astnode.id && astnode.id.range) {
					range = astnode.id.range;
				}
				else if(astnode.range) {
					range = astnode.range;
					if(astnode.type === 'FunctionExpression') {
						range[1] = range[0]+8;
					}
				}
				if(range[0] < 1) {
					//TODO hack since passing in a range starting with 0 causes no selection to be made
					range[0] = 1;
				}
			}
			return range;
		}
		
	};
	
	return Signatures;
});