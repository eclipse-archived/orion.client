/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2014 VMware, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *	 Andy Clement (VMware) - initial API and implementation
 *	 Andrew Eisenberg (VMware) - implemented visitor pattern
 *   IBM Corporation - Various improvements
 ******************************************************************************/

/*global esprima doctrine*/
/*jslint amd:true*/
define([
	'javascript/contentAssist/typeEnvironment', 
	'javascript/contentAssist/typeInference', 
	'javascript/contentAssist/typeUtils', 
	'javascript/contentAssist/proposalUtils', 
	'orion/Deferred',
	'orion/objects',
	'estraverse',
	'esprima' // this must stay at the end since it does not load a module
], function(typeEnv, typeInf, typeUtils, proposalUtils, Deferred, Objects, Estraverse) {

	/**
	 * @description Convert an array of parameters into a string and also compute linked editing positions
	 * @param {String} name The name of the function
	 * @param {Object} typeObj The type object of the function
	 * @param {Number} offset The offset into the source
	 * @return {Object} The function proposal object
	 */
	function calculateFunctionProposal(name, typeObj, offset) {
		var params = typeObj.params || [];
		var positions = [];
		var completion = name + '(';
		var plen = params.length;
		for (var p = 0; p < plen; p++) {
			if (params[p].name === 'new' || params[p].name === 'this') {
				continue;
			}
			if (p > 0) {
				completion += ', ';
			}
			var param = params[p];
			var optional, rest;
			if (param.type === 'OptionalType') {
				param = param.expression;
				optional=true;
			}

			if (param.type === 'RestType') {
				param = param.expression;
				rest = true;
			}

			var argName = param.name || 'arg' + p;
			if (rest) {
				argName = '...' + argName;
			}
			if (optional) {
				argName = '[' + argName + ']';
			}
			positions.push({offset:offset+completion.length+1, length: argName.length});
			completion += argName;
		}
		completion += ')';
		return {completion: completion, positions: positions.length === 0 ? null : positions};
	}

	/**
	 * @description Determines if we should bother visiting the AST to compute proposals
	 * @param {Object} ast The backing AST to visit
	 * @param {Number} offset The offset into the source
	 * @param {String} prefix The text prefix to complete on
	 * @param {String} contents The text of the file
	 * @return {Object} Returns the deferred node and the completion kind 
	 */
	function shouldVisit(ast, offset, prefix, contents) {
		var parents = [];
		Estraverse.traverse(ast, {
			skipped: false,
			/*override*/
			enter: function(node) {
				this.skipped = false;
				// extras prop is where we stuff everything that we have added
				if (!node.extras) {
					node.extras = {};
				}
				// the program node is always in range even if the range numbers do not line up
				if ((node.range && proposalUtils.inRange(offset-1, node.range)) || 
					node.type === Estraverse.Syntax.Program) {
					if (node.type === Estraverse.Syntax.Identifier) {
						return Estraverse.VisitorOption.Break;
					}
					parents.push(node);
					if ((node.type === Estraverse.Syntax.FunctionDeclaration || 
							node.type === Estraverse.Syntax.FunctionExpression) &&
							node.nody && proposalUtils.isBefore(offset, node.body.range)) {
						// completion occurs on the word "function"
						return Estraverse.VisitorOption.Break;
					}
					// special case where we are completing immediately after a '.'
					if (node.type === Estraverse.Syntax.MemberExpression && 
							!node.property && proposalUtils.afterDot(offset, node, contents)) {
						return Estraverse.VisitorOption.Break;
					}
				} else {
					this.skipped = true;
					return Estraverse.VisitorOption.Skip;
				}
			},
			/*override*/
			leave: function(node) {
				if(!this.skipped) {
					// if we have reached the end of an inRange block expression then
					// this means we are completing on an empty expression
					if (node.type === Estraverse.Syntax.Program || (node.type === Estraverse.Syntax.BlockStatement) &&
							proposalUtils.inRange(offset, node.range)) {
								return Estraverse.VisitorOption.Break;
					}
					parents.pop();
				}
			}
		});

		// determine if we need to defer infering the enclosing function block
		var toDefer;
		if (parents && parents.length) {
			var parent = parents.pop();
			for (var i = parents.length - 1; i >= 0; i--) {
				if ((parents[i].type === Estraverse.Syntax.FunctionDeclaration || 
						parents[i].type === Estraverse.Syntax.FunctionExpression) &&
						!(parents[i].id && proposalUtils.inRange(offset, parents[i].id.range, true))) {
					toDefer = parents[i];
					break;
				}
			}
			switch(parent.type) {
				case Estraverse.Syntax.MemberExpression: 
					if (parent.property && proposalUtils.inRange(offset-1, parent.property.range)) {
						// on the right hand side of a property, eg: foo.b^
						return { kind : "member", toDefer : toDefer };
					} else if (proposalUtils.inRange(offset-1, parent.range) && proposalUtils.afterDot(offset, parent, contents)) {
						// on the right hand side of a dot with no text after, eg: foo.^
						return { kind : "member", toDefer : toDefer };
					}
					break
				case Estraverse.Syntax.Program:
				case Estraverse.Syntax.BlockStatement:
					// completion at a new expression
					if (!prefix) {
					}
					break;
				case Estraverse.Syntax.VariableDeclarator:
					if(!parent.init || proposalUtils.isBefore(offset, parent.init.range)) {
						return null;
					}
					break;
				case Estraverse.Syntax.FunctionDeclaration:
				case Estraverse.Syntax.FunctionExpression:
					if(proposalUtils.isBefore(offset, parent.body.range)) {
						return true;						
					}
					break;
			}
		}
		return { kind : "top", toDefer : toDefer };
	}

	/**
	 * @description Create the description portion of the proposal
	 * @private
	 * @param {Object} propType The type description
	 * @param {Object} env The currently computed type environment
	 * @returns {String} the description for the proposal
	 */
	function createProposalDescription(propType, env) {
		switch(propType.type) {
			case 'FunctionType':
				if(propType.result && propType.result.type === "UndefinedLiteral") {
					return "";
				}
				break;
		}
		return " : " + typeUtils.createReadableType(propType, env);
	}

	/**
	 * @description Create the array of inferred proposals
	 * @param {String} targetTypeName The name of the type to find
	 * @param {Object} env The backing type environment
	 * @param {String} completionKind The kind of the completion
	 * @param {String} prefix The start of the expression to complete
	 * @param {Number} replaceStart The offset into the source where to start the completion
	 * @param {Object} proposals The object that attach computed proposals to
	 * @param {Number} relevance The ordering relevance of the proposals
	 * @param {Object} visited Those types visited thus far while computing proposals (to detect cycles)
	 */
	function createInferredProposals(targetTypeName, env, completionKind, prefix, replaceStart, proposals, relevance, visited) {
		var prop, propTypeObj, propName, res, type = env.lookupQualifiedType(targetTypeName), proto = type.$$proto;
		if (!relevance) {
			relevance = 100;
		}
		// start at the top of the prototype hierarchy so that duplicates can be removed
		if (proto) {
			var cycle = false;
			if (visited) {
				if (visited[proto.typeObj.name]) {
					cycle = true;
				}
			} else {
				visited = {};
			}
			if (!cycle) {
				visited[proto.typeObj.name] = true;
				createInferredProposals(proto.typeObj.name, env, completionKind, prefix, replaceStart, proposals, relevance - 10, visited);
			}
		}

		// add a separator proposal
		proposals['---dummy' + relevance] = {
			proposal: '',
			name: '',
			description: '---------------------------------',
			relevance: relevance -1,
			style: 'hr',
			unselectable: true
		};

		// need to look at prototype for global and window objects
		// so need to traverse one level up prototype hierarchy if
		// the next level is not Object
		var realProto = Object.getPrototypeOf(type);
		var protoIsObject = !Object.getPrototypeOf(realProto);
		for (prop in type) {
			if (type.hasOwnProperty(prop) || (!protoIsObject && realProto.hasOwnProperty(prop))) {
				if (prop.charAt(0) === "$" && prop.charAt(1) === "$") {
					// special property
					continue;
				}
				if (!proto && prop.indexOf("$_$") === 0) {
					// no prototype that means we must decode the property name
					propName = prop.substring(3);
				} else {
					propName = prop;
				}
				if (propName === "this" && completionKind === "member") {
					// don't show "this" proposals for non-top-level locations
					// (eg- this.this is wrong)
					continue;
				}
				if (!type[prop].typeObj) {
					// minified files sometimes have invalid property names (eg- numbers).  Ignore them)
					continue;
				}
				if (proposalUtils.looselyMatches(prefix, propName)) {
					propTypeObj = type[prop].typeObj;
					// if propTypeObj is a reference to a function type,
					// extract the actual function type
					if ((env._allTypes[propTypeObj.name]) && (env._allTypes[propTypeObj.name].$$fntype)) {
						propTypeObj = env._allTypes[propTypeObj.name].$$fntype;
					}
					if (propTypeObj.type === 'FunctionType') {
						res = calculateFunctionProposal(propName,
								propTypeObj, replaceStart - 1);
						proposals["$"+propName] = {
							proposal: res.completion,
							name: res.completion,
							description: createProposalDescription(propTypeObj, env),
							positions: res.positions,
							escapePosition: replaceStart + res.completion.length,
							// prioritize methods over fields
							relevance: relevance + 5,
							style: 'emphasis',
							overwrite: true
						};
					} else {
						proposals["$"+propName] = {
							proposal: propName,
							relevance: relevance,
							name: propName,
							description: createProposalDescription(propTypeObj, env),
							style: 'emphasis',
							overwrite: true
						};
					}
				}
			}
		}
	}
	
	var browserRegExp = /browser\s*:\s*true/;
	var nodeRegExp = /node\s*:\s*true/;
	var amdRegExp = /amd\s*:\s*true/;
	
	/**
	 * @description Find the global objects given the AST comments and the lint options
	 * @param {Array} comments The array of comment nodes from the AST
	 * @param {Object} lintOptions The lint options
	 */
	function findGlobalObject(comments, lintOptions) {
		for (var i = 0; i < comments.length; i++) {
			var comment = comments[i];
			if (comment.type === "Block" && (comment.value.substring(0, "jslint".length) === "jslint" ||
											  comment.value.substring(0,"jshint".length) === "jshint")) {
				// the lint options section.  now look for the browser or node
				if (comment.value.match(browserRegExp) || comment.value.match(amdRegExp)) {
					return "Window";
				} else if (comment.value.match(nodeRegExp)) {
					return "Module";
				} else {
					return "Global";
				}
			}
		}
		if (lintOptions && lintOptions.options) {
			if (lintOptions.options.browser === true) {
				return "Window";
			} else if (lintOptions.options.node === true) {
				return "Module";
			}
		}
		return "Global";
	}
	
	/**
	 * @description Filter and sort the completion proposals from the given proposal collector.
	 * Proposals are sorted by relevance and name and added to an array.
	 * @param {Object} proposalsObj The object with all of the completion proposals
	 * @returns {Array} The sorted proposals array
	 */
	function filterAndSortProposals(proposalsObj) {
		// convert from object to array
		var proposals = [];
		for (var prop in proposalsObj) {
			if (proposalsObj.hasOwnProperty(prop)) {
				proposals.push(proposalsObj[prop]);
			}
		}
		proposals.sort(function(l,r) {
			// sort by relevance and then by name
			if (l.relevance > r.relevance) {
				return -1;
			} else if (r.relevance > l.relevance) {
				return 1;
			}

			var ldesc = l.name.toLowerCase();
			var rdesc = r.name.toLowerCase();
			if (ldesc < rdesc) {
				return -1;
			} else if (rdesc < ldesc) {
				return 1;
			}
			return 0;
		});

		// filter trailing and leading dummies, as well as double dummies
		var toRemove = [];

		// now remove any leading or trailing dummy proposals as well as double dummies
		var i = proposals.length -1;
		while (i >= 0 && proposals[i].description.indexOf('---') === 0) {
			toRemove[i] = true;
			i--;
		}
		i = 0;
		while (i < proposals.length && proposals[i].description.indexOf('---') === 0) {
			toRemove[i] = true;
			i++;
		}
		i += 1;
		while (i < proposals.length) {
			if (proposals[i].description.indexOf('---') === 0 && proposals[i-1].description.indexOf('---') === 0) {
				toRemove[i] = true;
			}
			i++;
		}

		var newProposals = [];
		for (i = 0; i < proposals.length; i++) {
			if (!toRemove[i]) {
				newProposals.push(proposals[i]);
			}
		}

		return newProposals;
	}


	/**
	 * @description Creates a new JSContentAssist object
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} astManager An AST manager to create ASTs with
	 * @param {Object} [indexer] An indexer to load / work with supplied indexes
	 * @param {Object} lintOptions the given jslint options from the source
	 */
	function JSContentAssist(astManager, indexer, lintOptions) {
		this.astManager = astManager;
		this.indexer = indexer;
		this.lintOptions = lintOptions;
	}

	/**
	 * Main entry point to provider
	 */
	Objects.mixin(JSContentAssist.prototype, {

		/**
		 * @description Implements the Orion content assist API v4.0
		 */
		computeContentAssist: function(editorContext, params) {
			var self = this;
			return Deferred.all([
				this.astManager.getAST(editorContext),
				editorContext.getText(), // TODO Can we avoid getText() here? The AST should have all we need.
				this._createIndexData(editorContext, params)
			]).then(function(results) {
				var ast = results[0], buffer = results[1];
				return self._computeProposalsFromAST(ast, buffer, params);
			});
		},
		/**
		 * Reshapes typedefs into the expected format, sets up indexData
		 * @returns {orion.Promise}
		 */
		_createIndexData: function(editorContext, context) {
			if (!this.indexer) {
				// No need to load indexes
				return new Deferred().resolve();
			}
			if (!this.indexDataPromise) {
				var self = this;
				var defs = context.typeDefs || {}, promises = [];
				Object.keys(defs).forEach(function(id) {
					var props = defs[id];
					if (props.type === "tern") {
						promises.push(editorContext.getTypeDef(id));
					}
				});
				this.indexDataPromise = Deferred.all(promises).then(function(typeDefs) {
					self.indexer.setIndexData(typeDefs);
					return self.indexData;
				});
			}
			return this.indexDataPromise;
		},
		/**
		 * @description Computes inferred proposals from the backing AST
		 * @function
		 * @private
		 * @param {Object} ast The AST
		 * @param {String} buffer The text for the backing compilation unit
		 * @param {Object} context The assist context
		 */
		_computeProposalsFromAST: function(ast, buffer, context) {
			/**
			 * @description An empty promise
			 * @returns {orion.Promise} An empty promise that does no work
			 */
			function emptyArrayPromise() {
				var d = new Deferred();
				d.resolve([]);
				return d.promise;
			}
			if (context.selection && context.selection.start !== context.selection.end) {
				// only propose if an empty selection.
				return emptyArrayPromise();
			}

			var root = ast;
			if (!root) {
				// assume a bad parse
				return emptyArrayPromise();
			}

			var offset = context.offset;
			// note that if selection has length > 0, then just ignore everything past the start
			var completionKind = shouldVisit(root, offset, context.prefix, buffer);
			if (completionKind) {
				var self = this;
				return typeEnv.createEnvironment({
					buffer: buffer,
					uid : "local",
					offset : offset,
					indexer: self.indexer,
					globalObjName : findGlobalObject(root.comments, self.lintOptions),
					comments : root.comments
				}).then(function(environment) {
					// must defer inferring the containing function block until the end
					environment.defer = completionKind.toDefer;
					if (environment.defer) {
						// remove these comments from consideration until we are inferring the deferred
						environment.deferredComments = proposalUtils.extractDocComments(environment.comments, environment.defer.range);
					}
					var target = typeInf.inferTypes(root, environment, self.lintOptions);
					var proposalsObj = { };
					createInferredProposals(target, environment, completionKind.kind, context.prefix, offset - context.prefix.length, proposalsObj);
					return filterAndSortProposals(proposalsObj);
				});
			} else {
				// invalid completion location
				return emptyArrayPromise();
			}
		}
	});
	
	return {
		JSContentAssist : JSContentAssist
	};
});
