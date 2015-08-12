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
/*eslint-env amd*/
define([
'orion/objects',
'javascript/finder',
'estraverse'
], function(Objects, Finder, Estraverse) {
	
	/**
	 * make sure we are skipping the recovered node
	 * @since 9.0
	 */
	Estraverse.VisitorKeys.RecoveredNode = []; //do not visit

	/**
	 * @name javascript.Visitor
	 * @description The AST visitor passed into estraverse
	 * @constructor
	 * @private
	 * @since 5.0
	 */
	function Visitor() {
	    //constructor
	}
	
	Objects.mixin(Visitor.prototype, /** @lends javascript.Visitor.prototype */ {
		occurrences: [],
		scopes: [],
		context: null,
		thisCheck: false,
		objectPropCheck: false,
		
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
			var len, idx;
			switch(node.type) {
				case Estraverse.Syntax.Program:
					this.occurrences = [];
					this.scopes = [{range: node.range, occurrences: [], kind:'p'}];   //$NON-NLS-0$
					this.defscope = null;
					this.skipScope = null;
					break;
				case Estraverse.Syntax.FunctionDeclaration:
					this.checkId(node.id, true);
					this._enterScope(node);
					if (this.skipScope){
						// If the function decl was a redefine, checkId may set skipScope and we can skip processing the contents
						return Estraverse.VisitorOption.Skip;
					}
					
					if (node.params) {
						len = node.params.length;
						for (idx = 0; idx < len; idx++) {
							if(this.checkId(node.params[idx], true)) {
								return Estraverse.VisitorOption.Skip;
							}
						}
					}
					break;
				case Estraverse.Syntax.FunctionExpression:
				case Estraverse.Syntax.ArrowFunctionExpression:
					if(this._enterScope(node)) {
						return Estraverse.VisitorOption.Skip;
					}
					this.checkId(node.id, true); // Function expressions can be named expressions
					if (node.params) {
						len = node.params.length;
						for (idx = 0; idx < len; idx++) {
							if(this.checkId(node.params[idx], true)) {
								return Estraverse.VisitorOption.Skip;
							}
						}
					}
					break;
				case Estraverse.Syntax.AssignmentExpression:
					this.checkId(node.left);
					this.checkId(node.right);
					break;
				case Estraverse.Syntax.ExpressionStatement:
					this.checkId(node.expression);
					break;
				case Estraverse.Syntax.ArrayExpression: 
					if (node.elements) {
						len = node.elements.length;
						for (idx = 0; idx < len; idx++) {
							this.checkId(node.elements[idx]);
						}
					}
					break;
				case Estraverse.Syntax.MemberExpression:
					this.checkId(node.object);
					if (node.computed) { //computed = true for [], false for . notation
						this.checkId(node.property);
					} else {
						this.checkId(node.property, false, true);
					}
					break;
				case Estraverse.Syntax.BinaryExpression:
					this.checkId(node.left);
					this.checkId(node.right);
					break;
				case Estraverse.Syntax.UnaryExpression:
					this.checkId(node.argument);
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
						len = node.arguments.length;
						for (idx = 0; idx < len; idx++) {
							this.checkId(node.arguments[idx]);
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
						len = node.properties.length;
						for (idx = 0; idx < len; idx++) {
							var prop = node.properties[idx];
							if (prop.value && prop.value.type === Estraverse.Syntax.FunctionExpression){
								if(this.thisCheck) {
									//tag it 
									prop.value.isprop = true;
								} else {
									this.checkId(prop.value.id, false, true);
								}
							}
							this.checkId(prop.key, true, true);
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
						len = node.arguments.length;
						for(idx = 0; idx < len; idx++) {
							this.checkId(node.arguments[idx]);
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
						if (node.range[0] === this.context.token.range[0]){
							this.defscope = scope;
						}
					}
					break;
				case Estraverse.Syntax.IfStatement:
				case Estraverse.Syntax.DoWhileStatement:
				case Estraverse.Syntax.WhileStatement:
					this.checkId(node.test);
					break;
				case Estraverse.Syntax.ForStatement:
					this.checkId(node.init);
					break;
				case Estraverse.Syntax.ForInStatement:
                    this.checkId(node.left);
                    this.checkId(node.right);
                    break;
				case Estraverse.Syntax.WithStatement:
                    this.checkId(node.object);
                    break;
                case Estraverse.Syntax.ThrowStatement:
                    this.checkId(node.argument);
                    break;
                case Estraverse.Syntax.LabeledStatement:
               		this._enterScope(node);
                    this.checkId(node.label, true, false, true);
                    break;
                case Estraverse.Syntax.ContinueStatement :
                    this.checkId(node.label, false, false, true);
                    break;
                case Estraverse.Syntax.BreakStatement:
                    this.checkId(node.label, false, false, true);
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
						this.scopes.push({range: node.range, occurrences: [], kind:'o'});  //$NON-NLS-0$
						if (this.defscope){
							return true;
						}
						break;
					case Estraverse.Syntax.FunctionExpression:
						if (!node.isprop){
							this.scopes.push({range: node.body.range, occurrences: [], kind:'fe'});  //$NON-NLS-0$
							// If the outer scope has the selected 'this' we can skip the inner scope
							if (this.defscope){
								return true;
							}
						}
						break;
				}
			} else if (this.objectPropCheck){
				switch(node.type) {
					case Estraverse.Syntax.ObjectExpression:
						this.scopes.push({range: node.range, occurrences: [], kind:'o'});  //$NON-NLS-0$
				}
			} else if (this.labeledStatementCheck){
				switch(node.type) {
					case Estraverse.Syntax.LabeledStatement:
						this.scopes.push({range: node.range, occurrences: [], kind:'ls'});  //$NON-NLS-0$
						// Skip labelled loops that don't contain the selection
						if(node.range[0] > this.context.start || node.range[1] < this.context.end) {
							return true;
						}						
				}
			} else {
				var kind;
				var rangeStart = node.range[0];
				if (node.body){
					rangeStart = node.body.range[0];
				}
				switch(node.type) {
					case Estraverse.Syntax.FunctionDeclaration:
						kind = 'fd';  //$NON-NLS-0$
						// Include the params and body in the scope, but not the identifier
						if (node.params && (node.params.length > 0)){
							rangeStart = node.params[0].range[0];
						}
						break;
					case Estraverse.Syntax.FunctionExpression:
					case Estraverse.Syntax.ArrowFunctionExpression:
						kind = 'fe';  //$NON-NLS-0$
						// Include the params, body and identifier (if available) See Bug 447413
						if (node.id) {
							rangeStart = node.id.range[0];
						} else if (node.params && (node.params.length > 0)){
							rangeStart = node.params[0].range[0];
						}
						break;
				}
				if (kind){
					this.scopes.push({range: [rangeStart,node.range[1]], occurrences: [], kind:kind});	
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
					//$FALLTHROUGH$
					case Estraverse.Syntax.ObjectExpression:
					case Estraverse.Syntax.Program:
						if(this._popScope()) {
							//we left an object closure, end
							return Estraverse.VisitorOption.Break;
						}
						break;
				}
			} else if (this.objectPropCheck) {
				switch(node.type){
					case Estraverse.Syntax.ObjectExpression:
					case Estraverse.Syntax.Program:
						if(this._popScope()) {
							return Estraverse.VisitorOption.Break;
						}
						break;
				}
			} else if (this.labeledStatementCheck) {
				switch(node.type){
					case Estraverse.Syntax.LabeledStatement:
						if(this._popScope()) {
							return Estraverse.VisitorOption.Break;
						}
						break;
				}
			} else {
				switch(node.type) {
					case Estraverse.Syntax.FunctionExpression:
					case Estraverse.Syntax.FunctionDeclaration: 
					case Estraverse.Syntax.ArrowFunctionExpression: {
					    if(this._popScope()) {
							return Estraverse.VisitorOption.Break;
						}
						break;
					}
					case Estraverse.Syntax.Program: {
					    this._popScope(); // pop the last scope
						break;
					}
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
			
			if (this.skipScope){
				if (this.skipScope === scope){
					this.skipScope = null;
				}
				return false;
			}
			
			var len = scope.occurrences.length;
			var i, j;
			// Move all occurrences into the defining scope in case an inner scope redefines (Bug 448535)
			if(this.defscope && this.defscope === scope) {
				for(i = 0; i < len; i++) {
					this.occurrences.push(scope.occurrences[i]);
				}
				if(this.defscope.range[0] === scope.range[0] && this.defscope.range[1] === scope.range[1] &&
					this.defscope.kind === scope.kind) {
					//we just popped out of the scope the node was defined in, we can quit
					return true;
				}
			} else {
				if (this.scopes.length > 0){
					// We popped out of a scope but don't know where the define is, treat the occurrences like they belong to the outer scope (Bug 445410)
					for (j=0; j< len; j++) {
						this.scopes[this.scopes.length - 1].occurrences.push(scope.occurrences[j]);
					}
				} else {
					// We are leaving the AST, add the occurrences if we never found a defining scope
					this.occurrences = [];
					for (j=0; j< len; j++) {
						this.occurrences.push(scope.occurrences[j]);
					}
				}
			}
			return false;
		},
		
		/**
		 * @description Checks if the given node is a parameter specifying an AMD define dependency.  If so, mark the matching dependency path.
		 * @function
		 * @private
		 * @param {ASTNode} node The AST node we are inspecting
		 * @param {Array} occurrencesList The array of occurrences to add the new occurrence to
		 */
		_markDefineStatementOccurrences: function(node, occurrencesList){
			// If ESLint verify has been run on the AST, the nodes will have their parent marked
			// If the cursor is on this node, it will have a parents array added by Finder.findNode()
			// If no parent can be found, we cannot mark the matching define argument
			var parent = node.parent ? node.parent : (node.parents && node.parents.length > 0 ? node.parents[node.parents.length-1] : null);
			if (parent && parent.type === Estraverse.Syntax.FunctionExpression){
				var parent2 = parent.parent ? parent.parent : (node.parents && node.parents.length > 1 ? node.parents[node.parents.length-2] : null);
				if (parent2 && parent2.type === Estraverse.Syntax.CallExpression && parent2.callee && parent2.callee.name === "define"){
					var funcExpression = parent;
					for (var i=0; i<funcExpression.params.length; i++) {
						if (funcExpression.params[i] === node){
							if (parent2.arguments.length === 2 || parent2.arguments.length === 3){
								var pathsNode = parent2.arguments[parent2.arguments.length-2];
								if (pathsNode.elements && pathsNode.elements.length > i){
									occurrencesList.push({
										start: pathsNode.elements[i].range[0],
										end: pathsNode.elements[i].range[1]
									});
								}
							}
							break;
						}
					}
				}
			}
		},
		
		/**
		 * @name checkId
		 * @description Checks if the given identifier matches the occurrence we are looking for
		 * @function
		 * @private
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} node The AST node we are inspecting
		 * @param {Boolean} candefine If the given node can define the word we are looking for
		 * @param {Boolean} isObjectProp Whether the given node is only an occurrence if we are searching for object property occurrences
		 * @param {Boolean} isLabeledStatement Whether the given node is only an occurrence if we are searching for labeled statements
		 * @returns {Boolean} <code>true</code> if we should skip the next nodes, <code>false</code> otherwise
		 */
		checkId: function(node, candefine, isObjectProp, isLabeledStatement) {
			if (this.skipScope){
				return true;
			}
			if (this.thisCheck){
				return false;
			}
			if ((isObjectProp && !this.objectPropCheck) || (!isObjectProp && this.objectPropCheck)){
				return false;
			}
			if ((isLabeledStatement && !this.labeledStatementCheck) || (!isLabeledStatement && this.labeledStatementCheck)){
				return false;
			}			
			if (node && node.type === Estraverse.Syntax.Identifier) {
				if (node.name === this.context.word) {
					var scope = this.scopes[this.scopes.length-1]; // Always will have at least the program scope
					if(candefine) {
						// Check if we are redefining
						if(this.defscope) {
							if((scope.range[0] <= this.context.start) && (scope.range[1] >= this.context.end)) {
								// Selection inside this scope, use this scope as the defining scope
								this.occurrences = []; // Clear any occurrences in sibling scopes
								this.defscope = scope;
								scope.occurrences.push({
									start: node.range[0],
									end: node.range[1]
								});
								return false;
							} else {
								// Selection belongs to an outside scope so use the outside definition
								scope.occurrences = []; // Clear any occurrences we have found in this scope
								this.skipScope = scope;  // Skip this scope and all inner scopes
								return true;  // Where possible we short circuit checking this scope
							}
						}
						//does the scope enclose it?
						if((scope.range[0] <= this.context.start) && (scope.range[1] >= this.context.end)) {
							this.defscope = scope;
							
							// If identifier is an argument of a define statement, also mark the matching dependency
							this._markDefineStatementOccurrences(node, scope.occurrences);
						} else {
							// Selection belongs to an outside scope so use the outside definition (Bug 447962)
							scope.occurrences = [];
							this.skipScope = scope;
							return true;
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
	 * @description Finds all of the occurrences of the token / ranges / text from the context within the given AST
	 * @function 
	 * @public 
	 * @param {Object} ast The editor context to get the AST from
	 * @param {Object} ctxt The context object {start:number, end:number, contentType:string}
	 * @returns {orion.Promise} The promise to compute occurrences
	 * @since 6.0
	 */
	function findOccurrences(ast, ctxt) {
		if(ast && ctxt) {
			var start = ctxt.selection.start;
			var end = ctxt.selection.end;
			var token = _getToken(start, ast);
			if (token) {
				// The token ignores punctuators, but the node is required for context
				// TODO Look for a more efficient way to move between node/token, see Bug 436191
				var node = Finder.findNode(start, ast, {parents: true});
				if(!_skip(node)) {
					if (token.range[0] >= node.range[0] && token.range[1] <= node.range[1]){
						
						// Check if the user has selected a AMD define statement dependency path.  If so run findOccurrences on matching dependency param instead
						if (node.type === Estraverse.Syntax.Literal){
							var amdNode = checkNodeDefineStatement(node);
							if (amdNode){
								node = amdNode;
								start = node.range[0];
								end = node.range[1];
							} else {
								// No other literals can have occurrences so bail
								return [];
							}
						}
						
						var context = {
							start: start,
							end: end,
							word: _nameFromNode(node),
							token: node
						};
						var visitor = _getVisitor(context);
						Estraverse.traverse(ast, visitor);
						return visitor.occurrences;
					}
				}
			}
		}
		return [];
		
		function checkNodeDefineStatement(node){
			var parent = node.parent ? node.parent : (node.parents && node.parents.length > 0 ? node.parents[node.parents.length-1] : null);
			if (parent && parent.type === Estraverse.Syntax.ArrayExpression){
				var parent2 = parent.parent ? parent.parent : (node.parents && node.parents.length > 1 ? node.parents[node.parents.length-2] : null);
				if (parent2 && parent2.type === Estraverse.Syntax.CallExpression && parent2.callee && parent2.callee.name === "define"){
					var elements = parent.elements;
					for (var i=0; i<elements.length; i++) {
						if (elements[i] === node){
							var deps = parent2;
							if (deps && deps.arguments && (deps.arguments.length === 2 || deps.arguments.length === 3)){
								deps = deps.arguments[deps.arguments.length-1];
								if (deps.params && deps.params.length > i){
									return Finder.findNode(deps.params[i].range[0], ast, {parents: true});
								}
							}
							break;
						}
					}
				}
			}
			return null;
		}
	}

	
	/**
	 * @description Gets the token from the given offset or the proceeding token if the found token 
	 * is a punctuator
	 * @function
	 * @private
	 * @param {Number} offset The offset into the source
	 * @param {Object} ast The AST
	 * @return {Object} The token for the given offset or null
	 * @since 6.0
	 */
	function _getToken(offset, ast) {
		if(ast.tokens && ast.tokens.length > 0) {
			var token = Finder.findToken(offset, ast.tokens);
			if(token) {
				if(token.type === 'Punctuator') {  //$NON-NLS-0$
					var index = token.index;
					//only check back if we are at the start of the punctuator i.e. here -> {
					if(offset === token.range[0] && index != null && index > 0) {
						var prev = ast.tokens[index-1];
						if(prev.range[1] !== token.range[0]) {
							return null;
						}
						else {
							token = prev;
						}
					}
				}
				if(token.type === 'Identifier' || token.type === "String" || (token.type === 'Keyword' && token.value === 'this')) { //$NON-NLS-0$  //$NON-NLS-1$  //$NON-NLS-2$
					return token;
				}
			}
		}
		return null;
	}
	
	/**
	 * @description Computes the node name to use while searching
	 * @function
	 * @private
	 * @param {Object} node The AST token
	 * @returns {String} The node name to use while seraching
	 * @since 6.0
	 */
	function _nameFromNode(node) {
		switch(node.type) {
			case Estraverse.Syntax.Identifier: return node.name;
			case Estraverse.Syntax.ThisExpression: return 'this'; //$NON-NLS-0$
		}
	}
	
	/**
	 * @description If we should skip marking occurrences
	 * @function
	 * @private
	 * @param {Object} node The AST node
	 * @returns {Boolean} True if we shoud skip computing occurrences
	 * @since 6.0
	 */
	function _skip(node) {
		if(!node) {
			return true;
		}
		if(node.type === Estraverse.Syntax.ThisExpression) {
			return false;
		}
		
		if (node.type === Estraverse.Syntax.Literal){
			return false;
		}
		
		return node.type !== Estraverse.Syntax.Identifier;
	}
	
	/**
	 * @name getVisitor
	 * @description Delegate function to get the visitor
	 * @function
	 * @private
	 * @memberof javascript.JavaScriptOccurrences.prototype
	 * @param {Object} context The context (item) to find occurrences for
	 * @returns The instance of {Visitor} to use
	 * @since 6.0
	 */
	function _getVisitor(context) {
		if(!this.visitor) {
			this.visitor = new Visitor();
			this.visitor.enter = this.visitor.enter.bind(this.visitor);
			this.visitor.leave = this.visitor.leave.bind(this.visitor);
		}
		
		if (context.token){
			var parent = context.token.parent ? context.token.parent : (context.token.parents && context.token.parents.length > 0 ? context.token.parents[context.token.parents.length-1] : null);
			
			// See if a 'this' keyword was selected
			this.visitor.thisCheck = context.token.type === Estraverse.Syntax.ThisExpression;
			
			// See if we are doing an object property check
			this.visitor.objectPropCheck = false;
			if (parent && parent.type === Estraverse.Syntax.Property){
				// Object property key is selected
				this.visitor.objectPropCheck = context.token === parent.key;
			} else if (parent && (parent.type === Estraverse.Syntax.MemberExpression)){
				if (parent.object && parent.object.type === Estraverse.Syntax.ThisExpression){
					// Usage of this within an object
					this.visitor.objectPropCheck = true;
				} else if (!parent.computed && parent.property && context.start >= parent.property.range[0] && context.end <= parent.property.range[1]){
				 	// Selecting the property key of a member expression that is not computed (foo.a vs foo[a])
					this.visitor.objectPropCheck = true;
				}
			} else if (parent && parent.type === Estraverse.Syntax.FunctionExpression && context.token.parents && context.token.parents.length > 1 && context.token.parents[context.token.parents.length-2].type === Estraverse.Syntax.Property){
				// Both the name and the params have the same parent
				if (parent.id && parent.id.range === context.token.range){
					// Named function expresison as the child of a property
					this.visitor.objectPropCheck = true;
				}
			}
			
			// See if a labeled statement is selected
			this.visitor.labeledStatementCheck = parent && (parent.type === Estraverse.Syntax.LabeledStatement || parent.type === Estraverse.Syntax.ContinueStatement || parent.type === Estraverse.Syntax.BreakStatement);
		}
			
		this.visitor.context = context;
		return this.visitor;			
	}
	
	/**
	 * @name javascript.JavaScriptOccurrences
	 * @description creates a new instance of the outliner
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} astManager
	 * @param {javascript.CUProvider} cuProvider
	 */
	function JavaScriptOccurrences(astManager, cuProvider) {
		this.astManager = astManager;
		this.cuprovider = cuProvider;
	}
	
	Objects.mixin(JavaScriptOccurrences.prototype, /** @lends javascript.JavaScriptOccurrences.prototype*/ {
		
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
			return editorContext.getFileMetadata().then(function(meta) {
			    if(meta.contentType.id === 'application/javascript') {
			        return that.astManager.getAST(editorContext).then(function(ast) {
						return findOccurrences(ast, ctxt);
					});
			    }
			    return editorContext.getText().then(function(text) {
    			    var blocks = Finder.findScriptBlocks(text);
    	            if(blocks && blocks.length > 0) {
    		            var cu = that.cuprovider.getCompilationUnit(blocks, meta);
    		            if(cu.validOffset(ctxt.selection.start)) {
        		            return that.astManager.getAST(cu.getEditorContext()).then(function(ast) {
                				return findOccurrences(ast, ctxt);
                			});
            			}
        			}
    			});
			});
		}
	});
	
	JavaScriptOccurrences.prototype.contructor = JavaScriptOccurrences;
	
	return {
		JavaScriptOccurrences: JavaScriptOccurrences
		};
});
