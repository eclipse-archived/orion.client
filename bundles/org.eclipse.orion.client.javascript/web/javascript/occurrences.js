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
/*global define console*/
define([
"orion/Deferred"
], function(Deferred) {
	
	/**
	 * @name javascript.JavaScriptOccurrences
	 * @description creates a new instance of the outliner
	 * @constructor
	 * @public
	 */
	function JavaScriptOccurrences() {
	}
	
	JavaScriptOccurrences.prototype = /** @lends javascript.JavaScriptOccurrences.prototype*/ {
		/**
		 * @name isOccurrenceInSelScope
		 * @description Computes if the occurrence scope is covered by the other scope
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} oScope The current occurrence scope
		 * @param {Object} wScope The scope to check
		 * @returns {Boolean} <code>true</code> if the given scope encloses the occurrence scope, <code>false</code> otherwise
		 */
		isOccurrenceInSelScope: function(oScope, wScope) {
			if (oScope.global && wScope.global) {
				return true;
			}
			if (!oScope.global && !wScope.global && (oScope.name === wScope.name) && (oScope.loc.start.line === wScope.loc.start.line) &&
				(oScope.loc.start.column === wScope.loc.start.column)) {
				return true;
			}
			return false;
		},
		
		/**
		 * @name filterOccurrences
		 * @description Filters the computed occurrences given the context
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} context The current context
		 * @returns {Array|null} Returns the array of matches or <code>null</code>
		 */
		filterOccurrences: function(context) {
			if (!context.mScope) {
				return null;
			}
			var matches = [];
			for (var i = 0; i < context.occurrences.length; i++) {
				if (this.isOccurrenceInSelScope(context.occurrences[i].scope, context.mScope)) {
					matches.push({
						readAccess: context.occurrences[i].readAccess,
						line: context.occurrences[i].node.loc.start.line,
						start: context.occurrences[i].node.loc.start.column + 1,
						end: context.occurrences[i].node.loc.end.column,
						description: (context.occurrences[i].readAccess ? 'Occurrence of "' : 'Write occurrence of "') + context.word + '"'	//$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$
					});
				}
			}
			return matches;
		},
		
		/**
		 * @name updateScope
		 * @description Update the given scope when leaving the given node. This function removes scope elements
		 * when done processing <code>FunctionDeclaration</code> and <code>FunctionExpression</code> nodes.
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} node The AST node we are currently inspecting
		 * @param {Object} scope The current scope we are in
		 */
		updateScope: function(node, scope) {
			if (!node || !node.type || !scope) {
				return;
			}
			switch (node.type) {
				case 'FunctionDeclaration': //$NON-NLS-0$
					scope.pop();
					break;
				case 'FunctionExpression':	//$NON-NLS-0$
					scope.pop();
					break;
			}
		},

		/**
		 * @name traverse
		 * @description Walks the given node and context to find occurrences, returns if the traversal
		 * should continue to child nodes
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} node the AST node we are currently visiting
		 * @param {Object} context the current context
		 * @param {Function} func A function to call on the node and context to process the node in the given context
		 * @returns {Boolean} <code>true</code> if we should continue traversing the given node and its children, <code>false</code> otherwise
		 */
		traverse: function(node, context, func) {
			if (func(node, context, this)) {
				return false;	// stop traversal
			}
			for (var key in node) {
				if (node.hasOwnProperty(key)) {
					var child = node[key];
					if (child && typeof child === 'object' && child !== null) { //$NON-NLS-0$
						if (Array.isArray(child)) {
							for (var i=0; i<child.length; i++) {
								if (!this.traverse(child[i], context, func)) {
									return false;
								}
							}
						} else {
							if (!this.traverse(child, context, func)) {
								return false;
							}
						}
					}
				}
			}
			this.updateScope(node, context.scope);
			return true;
		},
		
		/**
		 * @name checkIdentifier
		 * @description Checks if the given identifier matches the occurrence we are looking for
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} node The AST node we are inspecting
		 * @param {Object} context the current occurrence context
		 * @returns {Boolean} <code>true</code> if we should continue traversing the given node and its children, <code>false</code> otherwise
		 */
		checkIdentifier: function(node, context) {
			if (node && node.type === 'Identifier') { //$NON-NLS-0$
				if (node.name === context.word) {
					return true;
				}
			}
			return false;
		},

		/**
		 * @name findMatchingDeclaration
		 * @description Finds the first scope in the array that has a declaration
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Array} scope the array of scopes
		 * @returns {Object} Returns the scope with the declaration or <code>null</code>
		 */
		findMatchingDeclarationScope: function(scope) {
			for (var i = scope.length - 1; i >= 0; i--) {
				if (scope[i].decl) {
					return scope[i];
				}
			}
			return null;
		},

		/**
		 * @name addOccurrence
		 * @description Adds an occurrence for the given node and context to the collection
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} node The AST we found the occurrence in
		 * @param {Object} context The occurrence context
		 * @param {Boolean} readAccess if there is read access to the given occurrence
		 */
		addOccurrence: function(node, context, readAccess) {
			if (node) {
				if (readAccess === undefined) {
					readAccess = true;
				}
	
				var mScope = this.findMatchingDeclarationScope(context.scope);
				if (!mScope) {
					return;
				}
	
				if ((node.range[0] <= context.start) && (context.end <= node.range[1])) {
					if (mScope) {
						context.mScope = mScope;
					} else {
						console.error("matching declaration scope for selected type not found " + context.word); //$NON-NLS-0$
					}
				}
	
				context.occurrences.push({
					readAccess: readAccess,
					node: node,
					scope: mScope
				});
			}
		},

		/**
		 * @name  findOccurrence
		 * @description Finds the occurrence from the given context in the given AST node
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} node The current AST node to check
		 * @param {Object} context The occurrence context
		 * @param {Object} that The 'this' context to use when traversing
		 */
		findOccurrence: function(node, context, that) {
			if (!node || !node.type) {
				return;
			}
			var varScope, curScope, i;
			switch (node.type) {
			case 'Program': //$NON-NLS-0$
				curScope = {
					global: true,
					name: null,
					decl: false
				};
				context.scope.push(curScope);
				break;
			case 'VariableDeclarator': //$NON-NLS-0$
				if (that.checkIdentifier(node.id, context)) {
					varScope = context.scope.pop();
					varScope.decl = true;
					context.scope.push(varScope);
					that.addOccurrence(node.id, context, false);
				}
				if (node.init) {
					if (that.checkIdentifier(node.init, context)) {
						that.addOccurrence(node.init, context);
						break;
					}
					if (node.init.type === 'ObjectExpression') { //$NON-NLS-0$
						var properties = node.init.properties;
						for (i = 0; i < properties.length; i++) {
							//if (checkIdentifier (properties[i].key, context)) {
							//	var varScope = scope.pop();
							//	varScope.decl = true;
							//	scope.push(varScope);
							//	addOccurrence (scope, properties[i].key, context, occurrences, false);
							//}
							if (that.checkIdentifier(properties[i].value, context)) {
								that.addOccurrence(properties[i].value, context);
							}
						}
					}
				}
				break;
			case 'ArrayExpression': //$NON-NLS-0$
				if (node.elements) {
					for (i = 0; i < node.elements.length; i++) {
						if (that.checkIdentifier(node.elements[i], context)) {
							that.addOccurrence(node.elements[i], context);
						}
					}
				}
				break;
			case 'AssignmentExpression': //$NON-NLS-0$
				var leftNode = node.left;
				if (that.checkIdentifier(leftNode, context)) {
					that.addOccurrence(leftNode, context, false);
				}
				if (leftNode.type === 'MemberExpression') { //$NON-NLS-0$
					if (that.checkIdentifier(leftNode.object, context)) {
						that.addOccurrence(leftNode.object, context, false);
					}
				}
				var rightNode = node.right;
				if (that.checkIdentifier(rightNode, context)) {
					that.addOccurrence(rightNode, context);
				}
				break;
			case 'MemberExpression': //$NON-NLS-0$
				if (that.checkIdentifier(node.object, context)) {
					that.addOccurrence(node.object, context);
				}
				if (node.computed) { //computed = true for [], false for . notation
					if (that.checkIdentifier(node.property, context)) {
						that.addOccurrence(node.property, context);
					}
				}
				break;
			case 'BinaryExpression': //$NON-NLS-0$
				if (that.checkIdentifier(node.left, context)) {
					that.addOccurrence(node.left, context);
				}
				if (that.checkIdentifier(node.right, context)) {
					that.addOccurrence(node.right, context);
				}
				break;
			case 'UnaryExpression': //$NON-NLS-0$
				if (that.checkIdentifier(node.argument, context)) {
					that.addOccurrence(node.argument, context, node.operator === 'delete' ? false : true); //$NON-NLS-0$
				}
				break;
			case 'IfStatement': //$NON-NLS-0$
				if (that.checkIdentifier(node.test, context)) {
					that.addOccurrence(node.test, context);
				}
				break;
			case 'SwitchStatement': //$NON-NLS-0$
				if (that.checkIdentifier(node.discriminant, context)) {
					that.addOccurrence(node.discriminant, context, false);
				}
				break;
			case 'UpdateExpression': //$NON-NLS-0$
				if (that.checkIdentifier(node.argument, context)) {
					that.addOccurrence(node.argument, context, false);
				}
				break;
			case 'ConditionalExpression': //$NON-NLS-0$
				if (that.checkIdentifier(node.test, context)) {
					that.addOccurrence(node.test, context);
				}
				if (that.checkIdentifier(node.consequent, context)) {
					that.addOccurrence(node.consequent, context);
				}
				if (that.checkIdentifier(node.alternate, context)) {
					that.addOccurrence(node.alternate, context);
				}
				break;
			case 'FunctionDeclaration': //$NON-NLS-0$
				curScope = {
					global: false,
					name: node.id.name,
					loc: node.loc,
					decl: false
				};
				context.scope.push(curScope);
				if (node.params) {
					for (i = 0; i < node.params.length; i++) {
						if (that.checkIdentifier(node.params[i], context)) {
							varScope = context.scope.pop();
							varScope.decl = true;
							context.scope.push(varScope);
							that.addOccurrence(node.params[i], context, false);
						}
					}
				}
				break;
			case 'FunctionExpression': //$NON-NLS-0$
				curScope = {
					global: false,
					name: null,
					loc: node.loc,
					decl: false
				};
				context.scope.push(curScope);
				if (!node.params) {
					break;
				}
				for (i = 0; i < node.params.length; i++) {
					if (that.checkIdentifier(node.params[i], context)) {
						varScope = context.scope.pop();
						varScope.decl = true;
						context.scope.push(varScope);
						that.addOccurrence(node.params[i], context, false);
					}
				}
				break;
			case 'CallExpression': //$NON-NLS-0$
				if (!node.arguments) {
					break;
				}
				for (var j = 0; j < node.arguments.length; j++) {
					if (that.checkIdentifier(node.arguments[j], context)) {
						that.addOccurrence(node.arguments[j], context);
					}
				}
				break;
			case 'ReturnStatement': //$NON-NLS-0$
				if (that.checkIdentifier(node.argument, context)) {
					that.addOccurrence(node.argument, context);
				}
			}
		},

		/**
		 * @name getOccurrences
		 * @description Computes the occurrences from the given AST and context
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} ast the AST to find occurrences in
		 * @param {Object} context the current occurrence context
		 * @returns {Array|null} Returns the found array of occurrences or <code>null</code>
		 */
		getOccurrences: function(ast, context) {
			if (ast) {
				this.traverse(ast, context, function(node, context) {
					var found = false;
					if (node.range && node.name && (node.range[0] <= context.start) && (context.end <= node.range[1])) {
						context.word = node.name;
						found = true;
					}
					return found;
				});
	
				if (!context || !context.word) {
					return null;
				}
				context.scope = [];
				context.occurrences = [];
				this.traverse(ast, context, this.findOccurrence);
				return this.filterOccurrences(context);
			}
			console.error("AST is null");	//$NON-NLS-0$
			return null;
		},
		
		/**
		 * @name computeOccurrences
		 * @description Callback from the editor to compute the occurrences
		 * @function
		 * @public 
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} editorContext The current editor context
		 * @param {Object} ctx The current selection context
		 */
		computeOccurrences: function(editorContext, ctx) {
			var d = new Deferred();
			var that = this;
			editorContext.getAST().then(function(ast) {
				var context = {
					start: ctx.selection.start,
					end: ctx.selection.end,
					mScope: null
				};
				d.resolve(that.getOccurrences(ast, context));
			});
			return d;
		}
		
	};
	
	JavaScriptOccurrences.prototype.contructor = JavaScriptOccurrences;
	
	return {
		JavaScriptOccurrences: JavaScriptOccurrences
		};
});