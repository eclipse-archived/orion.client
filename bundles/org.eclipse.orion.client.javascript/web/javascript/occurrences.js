 /*******************************************************************************
 * @license
 * Copyright (c) 2013, 2014 IBM Corporation and others.
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
'orion/objects',
'estraverse',
'javascript/finder'
], function(Objects, Estraverse, Finder) {
	
	/**
	 * @name javascript.Visitor
	 * @description The AST visitor passed into estraverse
	 * @constructor
	 * @private
	 * @since 5.0
	 */
	function Visitor() {
	}
	
	Objects.mixin(Visitor.prototype, /** @lends javascript.Visitor.prototype */ {
		occurrences: [],
		scopes: [],
		context: null,
		thisCheck: false,
		
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
					this.scopes = [{range: node.range, occurrences: []}];
					this.defnode = null;
					this.defscope = null;
					break;
				case Estraverse.Syntax.FunctionDeclaration:
					this.checkId(node.id, true);
					//we want the parent scope for a declaration, otherwise we leave it right away
					this._enterScope(node);
					if (node.params) {
						for (var i = 0; i < node.params.length; i++) {
							if(this.checkId(node.params[i], true)) {
								return Estraverse.VisitorOption.Skip;
							}
						}
					}
					break;
				case Estraverse.Syntax.FunctionExpression:
					if (node.params) {
						if(this._enterScope(node)) {
							return Estraverse.VisitorOption.Skip;
						}
						for (var j = 0; j < node.params.length; j++) {
							if(this.checkId(node.params[j], true)) {
								return Estraverse.VisitorOption.Skip;
							}
						}
					}
					break;
				case Estraverse.Syntax.AssignmentExpression:
					this.checkId(node.left);
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
					this.checkId(node.callee, false);
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
					if(this._enterScope(node)) {
						return Estraverse.VisitorOption.Skip;
					}
					if(node.properties) {
						var len = node.properties.length;
						for (var m = 0; m < len; m++) {
							var prop = node.properties[m];
							if(this.thisCheck && prop.value && prop.value.type === Estraverse.Syntax.FunctionExpression) {
								//tag it 
								prop.value.isprop = true;
							}
							this.checkId(prop.value);
						}
					}
					break;
				case Estraverse.Syntax.VariableDeclarator:
					this.checkId(node.id, true);
					this.checkId(node.init);
					break;
				case Estraverse.Syntax.NewExpression:
					this.checkId(node.callee, false);
					if(node.arguments) {
						var len = node.arguments.length;
						for(var m = 0; m < len; m++) {
							this.checkId(node.arguments[m]);
						}
					}
					break;
				case Estraverse.Syntax.LogicalExpression:
					this.checkId(node.left);
					this.checkId(node.right);
					break;
				case Estraverse.Syntax.ThisExpression:
					if(this.thisCheck) {
						var scope = this.scopes[this.scopes.length-1];
						scope.occurrences.push({
							start: node.range[0],
							end: node.range[1]
						});
						// if this node is the selected this we are in the right scope
						if (node.range[0] === this.context.node.range[0]){
							this.defscope = scope;
						}
					}
					break;
			}
		},
		
		/**
		 * @description Enters and records the current scope onthe scope stack
		 * @function
		 * @private
		 * @param {Object} node The AST node
		 * @returns {Boolean} If we should skip visiting children of the scope node
		 */
		_enterScope: function(node) {
			if(this.thisCheck) {
				switch(node.type) {
					case Estraverse.Syntax.ObjectExpression:
						this.scopes.push({range: node.range, occurrences: []});
						if (this.defscope){
							return true;
						}
						break;
					case Estraverse.Syntax.FunctionExpression:
						if (!node.isprop){
							this.scopes.push({range: node.range, occurrences: []});
							// If the outer scope has the selected 'this' we can skip the inner scope
							if (this.defscope){
								return true;
							}
						}
						break;
				}
			}
			else {
				switch(node.type) {
					case Estraverse.Syntax.FunctionDeclaration:
					case Estraverse.Syntax.FunctionExpression:
						this.scopes.push({range: node.range, occurrences: []});	
						break;
				}
			}
			return false;
		},
		
		/**
		 * @name leave
		 * @description Callback from estraverse when visitation of a node has completed
		 * @function
		 * @private
		 * @memberof javascript.Visitor.prototype
		 * @param {Object} node The AST node that ended its visitation
		 * @return The status if we should continue visiting
		 */
		leave: function(node) {
			if(this.thisCheck) {
				switch(node.type) {
					case Estraverse.Syntax.FunctionExpression:
						if(node.isprop) {
							delete node.isprop; //remove the tag
							break;
						}
						//FALL-THROUGH
					case Estraverse.Syntax.ObjectExpression:
					case Estraverse.Syntax.Program:
						if(this._popScope()) {
							//we left an object closure, end
							return Estraverse.VisitorOption.Break;
						}
						break;
				}
			}
			else {
				switch(node.type) {
					case Estraverse.Syntax.FunctionExpression:
					case Estraverse.Syntax.FunctionDeclaration:
					case Estraverse.Syntax.Program:
						if(this._popScope()) {
							return Estraverse.VisitorOption.Break;
						}
						break;
				}
			}
		},
		
		/**
		 * @description Pops the tip of the scope stack off, adds occurrences (if any) and returns if we should
		 * quit visiting
		 * @function
		 * @private
		 * @returns {Boolean} If we should quit visiting
		 */
		_popScope: function() {
			var scope = this.scopes.pop();
			if(this.defscope) {
				var len = scope.occurrences.length;
				for(var i = 0; i < len; i++) {
					this.occurrences.push(scope.occurrences[i]);
				}
				if(this.defscope.range[0] === scope.range[0] && this.defscope.range[1] === scope.range[1]) {
					//we just popped out of the scope the node was defined in, we can quit
					return true;
				}
			}
			return false;
		},
		
		/**
		 * @name checkId
		 * @description Checks if the given identifier matches the occurrence we are looking for
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} node The AST node we are inspecting
		 * @param {Boolean} candefine If the given node can define the word we are looking for
		 * @returns {Boolean} <code>true</code> if we should skip the next nodes, <code>false</code> otherwise
		 */
		checkId: function(node, candefine) {
			if (!this.thisCheck && node && node.type === Estraverse.Syntax.Identifier) {
				if (node.name === this.context.word) {
					var scope = this.scopes[this.scopes.length-1]; // Always will have at least the program scope
					if(candefine) {
						if(this.defscope && this.defnode) {
							//trying to re-define, we can break since any matches past here would not be the original definition
							//redefinition is OK if we are still descending to the offset, but not once we are in position
							if(node.range[0] >= this.context.start) {
								return true;
							}
						}
						//does the scope enclose it?
						if(scope && (scope.range[0] <= this.context.start) && (scope.range[1] >= this.context.end)) {
							this.defscope = {range: scope.range};
						}
						if(node.range[0] <= this.context.start && node.range[1] >= this.context.start) {
							this.defnode = node.range;
						}
					}
					scope.occurrences.push({
						start: node.range[0],
						end: node.range[1]
					});
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
	 * @param {javascript.ASTManager} astManager
	 */
	function JavaScriptOccurrences(astManager) {
		this.astManager = astManager;
	}
	
	Objects.mixin(JavaScriptOccurrences.prototype, /** @lends javascript.JavaScriptOccurrences.prototype*/ {
		
		visitor: null,
		
		/**
		 * @name getVisitor
		 * @description Delegate function to get the visitor
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} context The context (item) to find occurrences for
		 * @returns The instance of {Visitor} to use
		 */
		getVisitor: function(context) {
			if(!this.visitor) {
				this.visitor = new Visitor();
				this.visitor.enter = this.visitor.enter.bind(this.visitor);
				this.visitor.leave = this.visitor.leave.bind(this.visitor);
			}
			this.visitor.thisCheck = context.node && context.node.type === Estraverse.Syntax.ThisExpression;
			this.visitor.context = context;
			return this.visitor;			
		},
		
		/**
		 * @description Computes the node name to use while searching
		 * @function
		 * @private
		 * @param {Object} node The AST node
		 * @returns {String} The node name to use while seraching
		 */
		_nameFromNode: function(node) {
			switch(node.type) {
				case Estraverse.Syntax.Identifier: return node.name;
				case Estraverse.Syntax.ThisExpression: return 'this';
			}
		},
		
		/**
		 * @description If we should skip marking occurrences
		 * @function
		 * @private
		 * @param {Object} context The selection context from the editor
		 * @param {Object} node The AST node
		 * @param {Object} ast The AST
		 * @returns {Boolean} True if we shoud skip computing occurrences
		 */
		_skip: function(context, node, ast) {
			if(!node || node.type === Estraverse.Syntax.Literal) {
				return true;
			}	
			var comment = Finder.findComment(context.selection.start, ast);
			if(comment) {
				return true;
			}
			return false;
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
			return this.astManager.getAST(editorContext).then(function(ast) {
				if(ast) {
					var node = Finder.findNode(ctxt.selection.start, ast);
					if(!that._skip(ctxt, node, ast)) {
						var context = {
							start: ctxt.selection.start,
							end: ctxt.selection.end,
							word: that._nameFromNode(node),
							node: node,
						};
						var visitor = that.getVisitor(context);
						Estraverse.traverse(ast, visitor);
						return visitor.occurrences;
					}
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
