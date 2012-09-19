/*******************************************************************************
 * @license
 * Copyright (c) 2012 VMware, Inc. All Rights Reserved.
 * THIS FILE IS PROVIDED UNDER THE TERMS OF THE ECLIPSE PUBLIC LICENSE
 * ("AGREEMENT"). ANY USE, REPRODUCTION OR DISTRIBUTION OF THIS FILE
 * CONSTITUTES RECIPIENTS ACCEPTANCE OF THE AGREEMENT.
 * You can obtain a current copy of the Eclipse Public License from
 * http://www.opensource.org/licenses/eclipse-1.0.php
 *
 * Contributors:
 *     Andrew Eisenberg (VMware) - initial API and implementation
 ******************************************************************************/

/*global define esprima*/
define("plugins/esprima/esprimaVisitor", [], function() {



	return {
	
		/**
		 * parses the contents with options that are appropriate for inferencing
		 */
		parse : function(contents, extraOptions) {
			if (!extraOptions) {
				extraOptions = {};
			}
			if (!extraOptions.range) {
				extraOptions.range = true;
			}
			if (!extraOptions.tolerant) {
				extraOptions.tolerant = true;
			}
			if (!extraOptions.comment) {
				extraOptions.comment = true;
			}
			var parsedProgram = esprima.parse(contents, extraOptions);
			return parsedProgram;
		},

		/**
		 * Generic AST visitor.  Visits all children in source order, if they have a range property.  Children with
		 * no range property are visited first.
		 * 
		 * @param node The AST node to visit
		 * @param context any extra data required to pass between operations
		 * @param operation function(node, context, [isInitialOp]) an operation on the AST node and the data.  Return falsy if
		 * the visit should no longer continue. Return truthy to continue.
		 * @param [postoperation] (optional) function(node, context, [isInitialOp]) an operation that is exectuted after visiting the current node's children.
		 * will only be invoked if operation returns true for the current node
		 */
		visit: function(node, context, operation, postoperation) {
			var i, key, child, children;

			if (operation(node, context, true)) {
				// gather children to visit
				children = [];
				for (key in node) {
					if (key !== "range" && key !== "errors" && key !== "target" && key !== "extras" && key !== "comments") {
						child = node[key];
						if (child instanceof Array) {
							for (i = 0; i < child.length; i++) {
								if (child[i] && child[i].hasOwnProperty("type")) {
									children.push(child[i]);
								} else if (key === "properties") {
									// might be key-value pair of an object expression
									// don't visit the key since it doesn't have an sloc
									// and it is handle later by inferencing
									// FIXADE - I don't know if this is still necessary since it looks like esprima has changed the
									// way it handles properties in object expressions and they may now be proper AST nodes
									if (child[i].hasOwnProperty("key") && child[i].hasOwnProperty("value")) {
										children.push(child[i].key);
										children.push(child[i].value);
									}
								}
							}
						} else {
							if (child && child.hasOwnProperty("type")) {
								children.push(child);
							}
						}
					}
				}

				if (children.length > 0) {
					// sort children by source location
					children.sort(function(left, right) {
						if (left.range && right.range) {
							return left.range[0] - right.range[0];
						} else if (left.range) {
							return 1;
						} else if (right.range) {
							return -1;
						} else {
							return 0;
						}
					});

					// visit children in order
					for (i = 0; i < children.length; i++) {
						this.visit(children[i], context, operation, postoperation);
					}
				}
				if (postoperation) {
					postoperation(node, context, false);
				}
			}
		}
	};
});