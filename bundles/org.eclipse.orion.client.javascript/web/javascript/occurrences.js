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
/*global define console escope*/
define([
'orion/Deferred',
'orion/objects',
'estraverse',
'javascript/wordfinder'
], function(Deferred, Objects, Estraverse, WordFinder) {
	
	/**
	 * @name javascript.Visitor
	 * @description The AST visitor passed into estraverse
	 * @constrcutor
	 * @private
	 * @since 5.0
	 */
	function Visitor() {
	}
	
	Objects.mixin(Visitor.prototype, /** @lends javascript.Visitor.prototype */ {
		occurrences: [],
		defscope: null,
		defnode: null,
		scopes: [],
		GENERAL: 1,
		FUNCTION: 2,
		
		/**
		 * @name enter
		 * @description Callback from estraverse when a node is starting to be visited
		 * @function
		 * @private
		 * @memberof javascript.Visitor.prototype
		 * @param {Object} node The AST node currently being visited
		 * @returns The status if we should continue visiting
		 */
		enter: function(node) {
			switch(node.type) {
				case Estraverse.Syntax.Program:
					this.occurrences = [];
					this.defscope = null;
					this.defnode = null;
					
					this.scopes.push({range: node.range});
					break;
				case Estraverse.Syntax.FunctionDeclaration:
					this.checkId(node.id, this.FUNCTION, true);
					//we want the parent scope for a declaration, otherwise we leave it right away
					this.scopes.push({range: node.range});
					if (node.params) {
						for (var i = 0; i < node.params.length; i++) {
							if(this.checkId(node.params[i], this.GENERAL, true)) {
								return Estraverse.VisitorOption.Skip;
							}
						}
					}
					break;
				case Estraverse.Syntax.FunctionExpression:
					if (node.params) {
						this.scopes.push({range: node.range});
						for (var j = 0; j < node.params.length; j++) {
							if(this.checkId(node.params[j], this.GENERAL, true)) {
								return Estraverse.VisitorOption.Skip;
							}
						}
					}
					break;
				case Estraverse.Syntax.AssignmentExpression:
					var leftNode = node.left;
					this.checkId(leftNode);
					if (leftNode.type === Estraverse.Syntax.MemberExpression) {
						this.checkId(leftNode.object);
					}
					this.checkId(node.right);
					break;
				case Estraverse.Syntax.ArrayExpression: 
					if (node.elements) {
						for (var k = 0; k < node.elements.length; k++) {
							this.checkId(node.elements[k]);
						}
					}
					break;
				case Estraverse.Syntax.MemberExpression:
					this.checkId(node.object);
					if (node.computed) { //computed = true for [], false for . notation
						this.checkId(node.property);
					}
					break;
				case Estraverse.Syntax.BinaryExpression:
					this.checkId(node.left);
					this.checkId(node.right);
					break;
				case Estraverse.Syntax.UnaryExpression:
					this.checkId(node.argument);
					break;
				case Estraverse.Syntax.IfStatement:
					this.checkId(node.test);
					break;
				case Estraverse.Syntax.SwitchStatement:
					this.checkId(node.discriminant);
					break;
				case Estraverse.Syntax.UpdateExpression:
					this.checkId(node.argument);
					break;
				case Estraverse.Syntax.ConditionalExpression:
					this.checkId(node.test);
					this.checkId(node.consequent);
					this.checkId(node.alternate);
					break;
				case Estraverse.Syntax.CallExpression:
					this.checkId(node.callee, this.FUNCTION, false);
					if (node.arguments) {
						for (var l = 0; l < node.arguments.length; l++) {
							this.checkId(node.arguments[l]);
						}
					}
					break;
				case Estraverse.Syntax.ReturnStatement:
					this.checkId(node.argument);
					break;
				case Estraverse.Syntax.ObjectExpression:
					if(node.properties) {
						var len = node.properties.length;
						for (var m = 0; m < len; m++) {
							this.checkId(node.properties[m].value);
						}
					}
					break;
				case Estraverse.Syntax.VariableDeclarator:
					this.checkId(node.id, this.GENERAL, true);
					break;
				case Estraverse.Syntax.NewExpression:
					this.checkId(node.callee, this.FUNCTION, false);
					break;
			}
		},
		
		/**
		 * @name leave
		 * @description Callback from estraverse when visitation of a node has completed
		 * @function
		 * @private
		 * @memberof javascript.Visitor.prototype
		 * @param {Object} node The AST node that ended its visitation
		 */
		leave: function(node) {
			if(node.type === Estraverse.Syntax.FunctionDeclaration || 
				node.type === Estraverse.Syntax.FunctionExpression) {
				//if we leave the defining scope
				var scope = this.scopes.pop();
				if(this.defscope) {
					if(this.defscope.range[0] === scope.range[0] && this.defscope.range[1] === scope.range[1]) {
						//we just popped out of the scope the word was defined in, we can quit
						return Estraverse.VisitorOption.Break;
					}
				}
			}
		},
		
		/**
		 * @name setContext
		 * @description Sets the current context for the visitor to match for occurrences
		 * @function
		 * @private
		 * @memberof javascript.Visitor.prototype
		 * @param {Object} ctxt The context to match for occurrences
		 */
		setContext: function(ctxt) {
			this.context = ctxt;
		},
		
		/**
		 * @name checkId
		 * @description Checks if the given identifier matches the occurrence we are looking for
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} node The AST node we are inspecting
		 * @param {Number} kind The kind of occurrence to consider
		 * @param {Boolean} candefine If the given node can define the word we are looking for
		 * @returns {Boolean} <code>true</code> if we should skip the next nodes, <code>false</code> otherwise
		 */
		checkId: function(node, kind, candefine) {
			if (node && node.type === Estraverse.Syntax.Identifier) {
				if (node.name === this.context.word) {
					if(candefine) {
						if(this.defscope && this.defnode) {
							//trying to re-define, we can break since any matches past here would not be the original definition
							return true;
						}
						var len = this.scopes.length;
						var scope = len > 0 ? this.scopes[len-1] : null;
						//does the scope enclose it?
						if(scope && (scope.range[0] <= this.context.start) && (scope.range[1] >= this.context.end)) {
							this.defscope = scope;
						}
						if(node.range[0] <= this.context.start) {
							this.defnode = node.range;
							this.defnode.kind = !kind ? this.GENERAL : kind;
						}
					}
					if(this.defscope && this.defnode && this.defnode.kind === (!kind ? this.GENERAL : kind)) {
						this.occurrences.push({
							start: node.range[0],
							end: node.range[1]
						});
					}
				}
			}
			return false;
		}
	});
	
	Visitor.prototype.constructor = Visitor;
	
	/**
	 * @name javascript.JavaScriptOccurrences
	 * @description creates a new instance of the outliner
	 * @constructor
	 * @public
	 */
	function JavaScriptOccurrences() {
	}
	
	Objects.mixin(JavaScriptOccurrences.prototype, /** @lends javascript.JavaScriptOccurrences.prototype*/ {
		
		visitor: null,
		
		/**
		 * @name getVisitor
		 * @description Delegate function to get the visitor
		 * @function
		 * @private
		 * @memberof javascript.JSOutliner.prototype
		 * @param {Object} context The context (item) to find occurrrences for
		 * @returns The instance of {Visitor} to use
		 */
		getVisitor: function(context) {
			if(!this.visitor) {
				this.visitor = new Visitor();
				this.visitor.enter = this.visitor.enter.bind(this.visitor);
				this.visitor.leave = this.visitor.leave.bind(this.visitor);
				this.visitor.setContext = this.visitor.setContext.bind(this.visitor);
			} 
			this.visitor.setContext(context);
			return this.visitor;			
		},
		
		/**
		 * @name computeOccurrences
		 * @description Callback from the editor to compute the occurrences
		 * @function
		 * @public 
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} editorContext The current editor context
		 * @param {Object} ctxt The current selection context
		 */
		computeOccurrences: function(editorContext, ctxt) {
			var that = this;
			var word;
			return editorContext.getText().then(function(text) {
				word = WordFinder.findWord(text, ctxt.selection.start);
				if(word) {
					return editorContext.getAST();
				}
			}).then(function(ast) {
				if(ast) {
					var context = {
						start: ctxt.selection.start,
						end: ctxt.selection.end,
						word: word,
						mScope: null
					};
					var visitor = that.getVisitor(context);
					Estraverse.traverse(ast, visitor);
					return visitor.occurrences;
				}
				return [];
			});
		}
	});
	
	JavaScriptOccurrences.prototype.contructor = JavaScriptOccurrences;
	
	return {
		JavaScriptOccurrences: JavaScriptOccurrences
		};
});