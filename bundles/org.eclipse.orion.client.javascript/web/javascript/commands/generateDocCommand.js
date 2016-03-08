/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
 /*eslint-env amd*/
define([
'orion/objects',
'javascript/finder',
'javascript/signatures',
'orion/Deferred',
], function(Objects, Finder, Signatures, Deferred) {
	
	/**
		 * @description Creates a new generate doc command
		 * @constructor
		 * @public
		 * @returns {javascript.commands.GenerateDocCommand} A new command
		 * @since 6.0
		 */
		function GenerateDocCommand(ASTManager, CUProvider) {
			this.astManager = ASTManager;
			this.cuprovider = CUProvider;
		}
		
		/**
		 * @description Creates a new generate doc command for external uses
		 * @constructor
		 * @public
		 * @returns {javascript.commands.GenerateDocCommand} A new command
		 * @since 11.0
		 */
		function GenerateDocCommandExternalLib(ASTManager, CUProvider) {
			this.astManager = ASTManager;
			this.cuprovider = CUProvider;
		}
	
		Objects.mixin(GenerateDocCommand.prototype, {
			/**
			 * @callback
			 */
			execute: function(editorContext, options) {
				var that = this;
				return editorContext.getFileMetadata().then(function(meta) {
					if(meta.contentType.id === 'application/javascript') {
						return that.astManager.getAST(editorContext).then(function(ast) {
							that._doCommand(editorContext, ast, options.offset);
						});
					} 
					return editorContext.getText().then(function(text) {
						var offset = options.offset;
						var cu = that.cuprovider.getCompilationUnit(function() {
							return Finder.findScriptBlocks(text);
						}, meta);
						if(cu.validOffset(offset)) {
							 return that.astManager.getAST(cu.getEditorContext()).then(function(ast) {
								  that._doCommand(editorContext, ast, offset); 
							 });
						}
					});
				});
			},
	
			/**
			 * @description Actually do the work
			 * @function
			 * @private
			 * @returns {Deferred} A deferred to insert the template
			 * @since 8.0
			 */
			_doCommand: function _doCommand(editorContext, ast, offset) {
				var node = Finder.findNode(offset, ast, {parents:true});
				if(node) {
					var text = ast.source;
					var parent = this._resolveParent(node);
					if(parent) {
						//don't monkey with existing comments
						var template;
						var start = parent.range[0];
						if(parent.type === 'FunctionDeclaration') {
							template = this._genTemplate(parent.id.name, parent.params, false, parent.range[0], text);
						} else if(parent.type === 'Property') {
							template = this._genTemplate(parent.key.name ? parent.key.name : parent.key.value, parent.value.params, true, parent.range[0], text);
						} else if(parent.type === 'VariableDeclarator') {
							start = parent.range[0];
							if(parent.decl) {
								if(parent.decl.leadingComments) {
									return;
								}
								if(parent.decl.declarations && parent.decl.declarations.length === 1) {
									start = parent.decl.range[0];
								}
							}
							template = this._genTemplate(parent.id.name, parent.init.params, true, start, text);
						} else if(parent.type === 'AssignmentExpression') {
							template = this._genTemplate(Signatures.expandMemberExpression(parent.left, ''), 
															parent.right.params, 
															true, 
															parent.range[0], 
															text);
						}
					}
					if(template) {
						return Deferred.all([
										editorContext.setText(template, start, start),
										editorContext.setCaretOffset(offset+template.length)
										]);
					}
				}
			},
			
			/**
			 * @description Creates the boilerplate template
			 * @function
			 * @private
			 * @param {String} name The name of the function
			 * @param {Array} params The array of AST nodes 
			 * @param {Boolean} isexpr If the template is for a function expression
			 * @param {Number} offset The offset to start the template from
			 * @param {String} text The original text
			 */
			_genTemplate: function(name, params, isexpr, offset, text) {
				var char = text[--offset];
				var preamble = '';
				//walk the preceeding whitespace so we will insert formatted at the same level
				while(char === ' ' || char === '\t') {
					preamble += char;
					char = text[--offset];
				}
				var parts = [];
				parts.push('/**\n'+preamble+' * @name '+name+'\n'); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
				//TODO add in description template once editor bug is fixed
				//${description}
				parts.push(preamble+' * @description description\n');  //$NON-NLS-1$
				if(isexpr) {
					parts.push(preamble+' * @function\n'); //$NON-NLS-1$
				}
				if(name.charAt(0) === '_') {
					parts.push(preamble+' * @private\n'); //$NON-NLS-1$
				} 
				var idx = name.lastIndexOf('.');
				if(idx > -1) {
					//might be member expression, take the last segment and see if it starts wth an underscore
					if(name.slice(idx+1).charAt(0) === '_') {
						parts.push(preamble+' * @private\n'); //$NON-NLS-1$
					}
				}
				if(params) {
					var  len = params.length;
					for(var i = 0; i < len; i++) {
						//TODO add template for type infos after suporting editor bug is fixed
						// {${param'+(i+1)+'}}
						parts.push(preamble+' * @param '+ params[i].name+'\n');  //$NON-NLS-1$ //$NON-NLS-2$
					}
				}
				//TODO add in returns template once editor bug is fixed
				//{${returns}}
				parts.push(preamble+' * @returns returns\n'+preamble+' */\n'+preamble); //$NON-NLS-1$ //$NON-NLS-2$
				return parts.join('');
			},
			
			/**
			 * @description Computes the parent node to attach the doc to
			 * @function
			 * @private
			 * @param {Object} node The AST node
			 * @returns {Object} The parent node to attach the doc to or <code>null</code>
			 */
			_resolveParent: function(node) {
				if(!node.parents || node.parents.length < 1) {
					return null;
				}
				switch(node.type) {
					case 'FunctionDeclaration':
						return node;
					case 'Property':
						if(node.value && node.value.type === 'FunctionExpression') {
							return node;
						}
						return null;
					case 'VariableDeclarator':
						if(node.init && node.init.type === 'FunctionExpression') {
							node.decl = node.parents[node.parents.length -1];
							return node;
						}
						return null;
					case 'VariableDeclaration':
						if(node.declarations && node.declarations.length === 1) {
							var n = node.declarations[0];
							if(n.init && n.init.type === 'FunctionExpression') {
								node.parents.push(node);
								n.parents = node.parents;
								return this._resolveParent(n);
							}
						}
						//$FALLTHROUGH$
					case 'AssignmentExpression':
						if(node.left && node.left.type === 'MemberExpression' && 
							(node.right && node.right.type === 'FunctionExpression')) {
							return node;
						}
				}
				var len = node.parents.length-1;
				var parent = node.parents[len];
				parent.parents = node.parents.slice(0, len);
				return this._resolveParent(parent);
			}
		});
		
		Objects.mixin(GenerateDocCommandExternalLib.prototype, {
			/**
			 * @callback
			 */
			execute: function(data,ast) {
				return this._doCommand(data, ast);
			},
	
			/**
			 * @description Actually do the work
			 * @function
			 * @private
			 * @returns {Deferred} A deferred to insert the template
			 * @since 11.0
			 */
			_doCommand: function _doCommand(data, ast) {			
				var offset = data["offset"];
				var node = Finder.findNode(offset, ast, {parents:true});
				if(node) {
					var text = ast.source;
					var parent = this._resolveParent(node);
					if(parent) {
						//don't monkey with existing comments
						var template;
						var start = parent.range[0];
						if(parent.type === 'FunctionDeclaration') {
							template = this._genTemplate(parent.id.name, parent.params, false, parent.range[0], text);
						} else if(parent.type === 'Property') {
							template = this._genTemplate(parent.key.name ? parent.key.name : parent.key.value, parent.value.params, true, parent.range[0], text);
						} else if(parent.type === 'VariableDeclarator') {
							start = parent.range[0];
							if(parent.decl) {
								if(parent.decl.leadingComments) {
									return;
								}
								if(parent.decl.declarations && parent.decl.declarations.length === 1) {
									start = parent.decl.range[0];
								}
							}
							template = this._genTemplate(parent.id.name, parent.init.params, true, start, text);
						} else if(parent.type === 'AssignmentExpression') {
							template = this._genTemplate(Signatures.expandMemberExpression(parent.left, ''), 
															parent.right.params, 
															true, 
															parent.range[0], 
															text);
						}
					}
					if(template) {
						return {"start" : start, "end" : start, "text" : template};
					}
				}
			},
			
			/**
			 * @description Creates the boilerplate template
			 * @function
			 * @private
			 * @param {String} name The name of the function
			 * @param {Array} params The array of AST nodes 
			 * @param {Boolean} isexpr If the template is for a function expression
			 * @param {Number} offset The offset to start the template from
			 * @param {String} text The original text
			 */
			_genTemplate: function(name, params, isexpr, offset, text) {
				var char = text[--offset];
				var preamble = '';
				//walk the preceeding whitespace so we will insert formatted at the same level
				while(char === ' ' || char === '\t') {
					preamble += char;
					char = text[--offset];
				}
				var parts = [];
				parts.push('/**\n'+preamble+' * @name '+name+'\n'); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
				//TODO add in description template once editor bug is fixed
				//${description}
				parts.push(preamble+' * @description description\n');  //$NON-NLS-1$
				if(isexpr) {
					parts.push(preamble+' * @function\n'); //$NON-NLS-1$
				}
				if(name.charAt(0) === '_') {
					parts.push(preamble+' * @private\n'); //$NON-NLS-1$
				} 
				var idx = name.lastIndexOf('.');
				if(idx > -1) {
					//might be member expression, take the last segment and see if it starts wth an underscore
					if(name.slice(idx+1).charAt(0) === '_') {
						parts.push(preamble+' * @private\n'); //$NON-NLS-1$
					}
				}
				if(params) {
					var  len = params.length;
					for(var i = 0; i < len; i++) {
						//TODO add template for type infos after suporting editor bug is fixed
						// {${param'+(i+1)+'}}
						parts.push(preamble+' * @param '+ params[i].name+'\n');  //$NON-NLS-1$ //$NON-NLS-2$
					}
				}
				//TODO add in returns template once editor bug is fixed
				//{${returns}}
				parts.push(preamble+' * @returns returns\n'+preamble+' */\n'+preamble); //$NON-NLS-1$ //$NON-NLS-2$
				return parts.join('');
			},
			
			/**
			 * @description Computes the parent node to attach the doc to
			 * @function
			 * @private
			 * @param {Object} node The AST node
			 * @returns {Object} The parent node to attach the doc to or <code>null</code>
			 */
			_resolveParent: function(node) {
				if(!node.parents || node.parents.length < 1) {
					return null;
				}
				switch(node.type) {
					case 'FunctionDeclaration':
						return node;
					case 'Property':
						if(node.value && node.value.type === 'FunctionExpression') {
							return node;
						}
						return null;
					case 'VariableDeclarator':
						if(node.init && node.init.type === 'FunctionExpression') {
							node.decl = node.parents[node.parents.length -1];
							return node;
						}
						return null;
					case 'VariableDeclaration':
						if(node.declarations && node.declarations.length === 1) {
							var n = node.declarations[0];
							if(n.init && n.init.type === 'FunctionExpression') {
								node.parents.push(node);
								n.parents = node.parents;
								return this._resolveParent(n);
							}
						}
						//$FALLTHROUGH$
					case 'AssignmentExpression':
						if(node.left && node.left.type === 'MemberExpression' && 
							(node.right && node.right.type === 'FunctionExpression')) {
							return node;
						}
				}
				var len = node.parents.length-1;
				var parent = node.parents[len];
				parent.parents = node.parents.slice(0, len);
				return this._resolveParent(parent);
			}
		});
		return {
			GenerateDocCommand : GenerateDocCommand,
			GenerateDocCommandExternalLib : GenerateDocCommandExternalLib
		};
});