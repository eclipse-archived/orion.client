/*jslint browser:true*/
/*global define orion console esprima */
define(['orion/plugin', 'esprima/esprima'], function(PluginProvider) {

	function createAST(context) {
        var ast = esprima.parse(context.text, {
            range: true,
            loc: true,
            tolerant: true
        });
        //	if (ast !== null) {console.log(stringify(ast));}
        return ast;
    }
    
	function isOccurrenceInSelScope(oScope, wScope) {
        if (oScope.global && wScope.global) {
            return true;
        }
        if (!oScope.global && !wScope.global && (oScope.name === wScope.name) && (oScope.loc.start.line === wScope.loc.start.line) &&
            (oScope.loc.start.column === wScope.loc.start.column)) {
            return true;
        }
        return false;
    }

	function filterOccurrences(occurrences, context) {
        if (!context.scope) {
            return null;
        }
        var matches = [];
        for (var i = 0; i < occurrences.length; i++) {
            if (isOccurrenceInSelScope(occurrences[i].scope, context.scope)) {
                matches.push({
                    readAccess: occurrences[i].readAccess,
                    line: occurrences[i].node.loc.start.line,
                    start: occurrences[i].node.loc.start.column + 1,
                    end: occurrences[i].node.loc.end.column,
                    description: (occurrences[i].readAccess ? "occurrence of " : "write occurrence of") + context.word	//$NON-NLS-0$ //$NON-NLS-1$
                }); 
            }
        }
        return matches;
    }
    
    function updateScope(node, scope) {
        if (!node || !node.type) {
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
    }
    
    function traverse(node, context, func, occurrences, scope) {
        func(node, context, occurrences, scope);
        for (var key in node) {
            if (node.hasOwnProperty(key)) {
                var child = node[key];
                if (typeof child === 'object' && child !== null) { //$NON-NLS-0$
                    if (Array.isArray(child)) {
                        child.forEach(function (node) {
                            traverse(node, context, func, occurrences, scope);
                        });
                    } else {
                        traverse(child, context, func, occurrences, scope);
                    }
                }
            }
        }
        updateScope(node, scope);
    }
    
    function traverse1(node, context, func) {
        func(node, context);
        for (var key in node) {
            if (node.hasOwnProperty(key)) {
                var child = node[key];
                if (typeof child === 'object' && child !== null) { //$NON-NLS-0$
                    if (Array.isArray(child)) {
                        for (var i=0; i<child.length; i++) {
                            traverse1(child[i], context, func);
                        }
                    } else {
                        traverse1(child, context, func);
                    }
                }
            }
        }
    }

    /* convert ast array to String */

    function stringify(parsedProgram) {
        var body = parsedProgram.body;
        if (body.length === 1) {
            body = body[0];
        }
        var replacer = function (key, value) {
            if (key === 'computed') { //$NON-NLS-0$
                return;
            }
            return value;
        };
        return JSON.stringify(body, replacer).replace(/"/g, '');
    }

    function checkIdentifier(node, context) {
        if (node && node.type === 'Identifier') { //$NON-NLS-0$
            if (node.name === context.word) {
                return true;
            }
        }
        return false;
    }

    function findMatchingDeclarationScope(scope) {
        for (var i = scope.length - 1; i >= 0; i--) {
            if (scope[i].decl) {
                return scope[i];
            }
        }
        return null;
    }

    function addOccurrence(scope, node, context, occurrences, readAccess) {
        if (node) {
            if (readAccess === undefined) {
                readAccess = true;
            }

			//SSQ: can this be done in the first traverse?
            var mScope = findMatchingDeclarationScope(scope);
            if (!mScope) {
                return;
            }
	
			//SSQ: check for inclusion, not equality
			if ((node.range[0] <= context.start) && (context.end <= node.range[1])) {
          //  if ((node.loc.start.line === context.line) && (node.loc.start.column === context.column.start)) {
                if (mScope) {
                    context.scope = mScope;
                } else {
                    console.error("matching declaration scope for selected type not found " + context.word); //$NON-NLS-0$
                }
            }
            //SSQ ---------------------------------------------

            occurrences.push({
                readAccess: readAccess,
                node: node,
                scope: mScope
            });
        }
    }

    function findOccurrence(node, context, occurrences, scope) {
        if (!node || !node.type) {
			return;
        }
        var readAccess = true;
        switch (node.type) {
        case 'Program': //$NON-NLS-0$
            var curScope = {
                global: true,
                name: null,
                decl: false
            };
            scope.push(curScope);
            break;
        case 'VariableDeclarator': //$NON-NLS-0$
            if (checkIdentifier(node.id, context)) {
                var varScope = scope.pop();
                varScope.decl = true;
                scope.push(varScope);
                addOccurrence(scope, node.id, context, occurrences, false);
            }
            if (node.init) {
				if (checkIdentifier(node.init, context)) {
					addOccurrence(scope, node.init, context, occurrences);
					break;
				} 
                if (node.init.type === 'ObjectExpression') { //$NON-NLS-0$
                    var properties = node.init.properties;
                    for (var i = 0; i < properties.length; i++) {
                        //						if (checkIdentifier (properties[i].key, context)) {
                        //							var varScope = scope.pop();
                        //							varScope.decl = true;
                        //							scope.push(varScope);
                        //							addOccurrence (scope, properties[i].key, context, occurrences, false);
                        //						}
                        if (checkIdentifier(properties[i].value, context)) {
                            addOccurrence(scope, properties[i].value, context, occurrences);
                        }
                    }
                }
            }
            break;
        case 'ArrayExpression': //$NON-NLS-0$
            if (node.elements) {
                for (var i = 0; i < node.elements.length; i++) {
                    if (checkIdentifier(node.elements[i], context)) {
                        addOccurrence(scope, node.elements[i], context, occurrences);
                    }
                }
            }
            break;
        case 'AssignmentExpression': //$NON-NLS-0$
            var leftNode = node.left;
            if (checkIdentifier(leftNode, context)) {
                addOccurrence(scope, leftNode, context, occurrences, false);
            }
            if (leftNode.type === 'MemberExpression') { //$NON-NLS-0$
                if (checkIdentifier(leftNode.object, context)) {
                    addOccurrence(scope, leftNode.object, context, occurrences, false);
                }
            }
            var rightNode = node.right;
            if (checkIdentifier(rightNode, context)) {
                addOccurrence(scope, rightNode, context, occurrences);
            }
            break;
        case 'MemberExpression': //$NON-NLS-0$
            if (checkIdentifier(node.object, context)) {
                addOccurrence(scope, node.object, context, occurrences);
            }
            if (node.computed) { //computed = true for [], false for . notation
                if (checkIdentifier(node.property, context)) {
                    addOccurrence(scope, node.property, context, occurrences);
                }
            }
            break;
        case 'BinaryExpression': //$NON-NLS-0$
            if (checkIdentifier(node.left, context)) {
                addOccurrence(scope, node.left, context, occurrences);
            }
            if (checkIdentifier(node.right, context)) {
                addOccurrence(scope, node.right, context, occurrences);
            }
            break;
        case 'UnaryExpression': //$NON-NLS-0$
            if (checkIdentifier(node.argument, context)) {
                addOccurrence(scope, node.argument, context, occurrences, node.operator === 'delete' ? false : true); //$NON-NLS-0$
            }
            break;
        case 'IfStatement': //$NON-NLS-0$
            if (checkIdentifier(node.test, context)) {
                addOccurrence(scope, node.test, context, occurrences);
            }
            break;
        case 'SwitchStatement': //$NON-NLS-0$
            if (checkIdentifier(node.discriminant, context)) {
                addOccurrence(scope, node.discriminant, context, occurrences, false);
            }
            break;
        case 'UpdateExpression': //$NON-NLS-0$
            if (checkIdentifier(node.argument, context)) {
                addOccurrence(scope, node.argument, context, occurrences, false);
            }
            break;
        case 'ConditionalExpression': //$NON-NLS-0$
            if (checkIdentifier(node.test, context)) {
                addOccurrence(scope, node.test, context, occurrences);
            }
            if (checkIdentifier(node.consequent, context)) {
                addOccurrence(scope, node.consequent, context, occurrences);
            }
            if (checkIdentifier(node.alternate, context)) {
                addOccurrence(scope, node.alternate, context, occurrences);
            }
            break;
        case 'FunctionDeclaration': //$NON-NLS-0$
            var curScope = {
                global: false,
                name: node.id.name,
                loc: node.loc,
                decl: false
            };
            scope.push(curScope);
            if (node.params) {
                for (var i = 0; i < node.params.length; i++) {
                    if (checkIdentifier(node.params[i], context)) {
                        var varScope = scope.pop();
                        varScope.decl = true;
                        scope.push(varScope);
                        addOccurrence(scope, node.params[i], context, occurrences, false);
                    }
                }
            }
            break;
        case 'FunctionExpression': //$NON-NLS-0$
            var curScope = {
                global: false,
                name: null,
                loc: node.loc,
                decl: false
            };
            scope.push(curScope);
            if (!node.params) break;
            for (var i = 0; i < node.params.length; i++) {
                if (checkIdentifier(node.params[i], context)) {
                    var varScope = scope.pop();
                    varScope.decl = true;
                    scope.push(varScope);
                    addOccurrence(scope, node.params[i], context, occurrences, false);
                }
            }
            break;
        case 'CallExpression': //$NON-NLS-0$
            if (!node.arguments) {
				break;
            }
            for (var j = 0; j < node.arguments.length; j++) {
                if (checkIdentifier(node.arguments[j], context)) {
                    addOccurrence(scope, node.arguments[j], context, occurrences);
                }
            }
            break;
        case 'ReturnStatement': //$NON-NLS-0$
            if (checkIdentifier(node.argument, context)) {
                addOccurrence(scope, node.argument, context, occurrences);
            }
        }
    }
    
    function getOccurrences(context) {
        var ast = createAST(context);
        if (ast) {
            var occurrences = [],
                scope = [];
                
            // SSQ: traverse1 computes the context.word using text buffer and selection
            // SSQ: traverse1 and traverse should be the same.  For that, stop passing "occurrences" and "scope" as parameters to traverse. Pass them inside the "context" object
			traverse1(ast, context, function(node, context) {
				if (node.range && node.name && (node.range[0] <= context.start) && (context.end <= node.range[1])) {
					context.word = node.name;
				}
            });
            window.console.log("word=" + context.word);
            
            // SSQ: if word (=identifier) not found, give up
            if (!context || !context.word) {
                return null;
            }
                
            traverse(ast, context, findOccurrence, occurrences, scope);
            occurrences = filterOccurrences(occurrences, context);
//            SSQ: should not throw error, just return an empty array (or null)
//            if (!occurrences) {
//                console.error("no matching occurrences found");	//$NON-NLS-0$
//            }
            return occurrences;
        }
        console.error("ast is null");	//$NON-NLS-0$
        return null;
    }

////
    var headers = {
         name: "Occurrence Plugin",	//$NON-NLS-0$
         version: "0.1",	//$NON-NLS-0$
         description: "Esprima-based mark occurrences plugin."	//$NON-NLS-0$
    };
    var provider = new PluginProvider(headers);
    
    // Create the service implementation for getting selected text
    var serviceImpl = {
        findOccurrences: function(text, selection) {
            var context = {
                text: text,
                start: selection.start,
                end: selection.end,
                scope: null
            };
//            SSQ: compute word using AST. Remove word parameter from findOccurrences. This check needs to happen later in getOccurrences
//            if (!context || !context.word) {
//                return null;
//            }
	        return  getOccurrences (context);
        }
    };

     var serviceProperties = {
        name: 'Mark Occurrences',	//$NON-NLS-0$
        id: 'markoccurrences.editor',	//$NON-NLS-0$
        tooltip: 'Mark Occurrences',	//$NON-NLS-0$
        key: ['M', true, true], // Ctrl+Shift+M	//$NON-NLS-0$
        contentType: ['application/javascript']	//$NON-NLS-0$
    };

    provider.registerService("orion.edit.occurrences", serviceImpl, serviceProperties);	//$NON-NLS-0$
    provider.connect();
});
  