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
'orion/objects',
'javascript/signatures',
'estraverse/estraverse'
], function(Objects, Signatures, Estraverse) {
	
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
		outline: [],
		scope: [],
		
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
			var item;
			var that = this;
			if(node.type === 'FunctionDeclaration') {
				item = this.addElement(Signatures.computeSignature(node));
				if(item) {
					this.scope.push(item);
				}
			}
			else if(node.type === 'FunctionExpression') {
				item = this.addElement(Signatures.computeSignature(node));
				if(item) {
					this.scope.push(item);
				}
				delete node.sig;
			}
			else if(node.type === 'ObjectExpression') {
				item = this.addElement(Signatures.computeSignature(node));
				if(item) {
					this.scope.push(item);
				}
				delete node.sig;
				if(node.properties) {
					node.properties.forEach(function(property) {
						if(property.value) {
							if(property.value.type === 'FunctionExpression' || property.value.type === 'ObjectExpression') {
								property.value.sig = Signatures.computeSignature(property);
							}
							else {
								that.addElement(Signatures.computeSignature(property));
							}
						}
					});
				}
			}
			else if(node.type === 'VariableDeclaration') {
				if(node.declarations) {
					node.declarations.forEach(function(declaration) {
						if(declaration.init) {
							if(declaration.init.type === 'ObjectExpression') {
								declaration.init.sig = Signatures.computeSignature(declaration);
							}
						}
					});
				}
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
			if(node.type === 'ObjectExpression' || node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
				this.scope.pop();
			}
		},
		
		/**
		 * @name addElement
		 * @description Appends the given signature object to the running outline
		 * @function
		 * @private
		 * @memberof javascript.Visitor.prototype
		 * @param {Object} sig The signature object
		 * @param {Boolean}  seen If the element has been seen before, if so do not add it to the outline
		 */
		addElement: function(sig) {
			if(sig) {
				var item = {
					label: sig.sig,
					start: sig.range[0],
					end: sig.range[1]
				};
				if(this.scope.length < 1) {
					this.outline.push(item);
				}
				else {
					var parent = this.scope[this.scope.length-1];
					if(!parent.children) {
						parent.children = [];
					}
					parent.children.push(item);
				}
				return item;
			}
		}
	});
	
	Visitor.prototype.constructor = Visitor;
	
	/**
	 * @name javascript.JSOutliner
	 * @description creates a new instance of the outliner
	 * @constructor
	 * @public
	 */
	function JSOutliner() {
	}
	
	Objects.mixin(JSOutliner.prototype, /** @lends javascript.JSOutliner.prototype*/ {
	
		visitor: null,
		
		/**
		 * @name getVisitor
		 * @description Delegate function to get the visitor
		 * @function
		 * @private
		 * @memberof javascript.JSOutliner.prototype
		 * @returns The instance of {Visitor} to use
		 */
		getVisitor: function() {
			if(!this.visitor) {
				this.visitor = new Visitor();
				this.visitor.enter = this.visitor.enter.bind(this.visitor);
				this.visitor.leave = this.visitor.leave.bind(this.visitor);
			} 
			this.visitor.outline = [];
			return this.visitor;			
		},
		
		/**
		 * @name computeOutline
		 * @description callback from the <code>orion.edit.outliner</code> service to create
		 * an outline
		 * @function
		 * @public
		 * @memberof javascript.JSOutliner.prototype
		 * @param {orion.edit.EditorContext} editorContext The editor context
		 * @param {Object} options The options
		 * @returns {orion.Promise} to compute the outline
		 */
		computeOutline: function(editorContext, options) {
			var that = this;
			var astoptions = {loc:true, comment:true, tolerant:true, tokens:false, range:false, raw:false};
			return editorContext.getAST(astoptions).then(function(ast) {
				if(ast) {
					var visitor = that.getVisitor();
					Estraverse.traverse(ast, visitor);
					return visitor.outline;
				}
				return [];
			});
		}
	});
	
	JSOutliner.prototype.contructor = JSOutliner;
	
	return {
		JSOutliner: JSOutliner
		};
});