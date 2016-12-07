/*eslint-disable */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('estraverse/estraverse'), require('esrecurse/esrecurse')) :
  typeof define === 'function' && define.amd ? define(['exports', 'estraverse/estraverse', 'esrecurse/esrecurse'], factory) :
  (factory((global.escope = global.escope || {}),global.estraverse,global.esrecurse));
}(this, (function (exports,estraverse_estraverse,esrecurse) { 'use strict';

esrecurse = 'default' in esrecurse ? esrecurse['default'] : esrecurse;

/*
  Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var READ = 0x1;
var WRITE = 0x2;
var RW = READ | WRITE;

/**
 * A Reference represents a single occurrence of an identifier in code.
 * @class Reference
 */
var Reference = function Reference(ident, scope, flag,writeExpr, maybeImplicitGlobal, partial, init) {
      /**
       * Identifier syntax node.
       * @member {esprima#Identifier} Reference#identifier
       */
      this.identifier = ident;
      /**
       * Reference to the enclosing Scope.
       * @member {Scope} Reference#from
       */
      this.from = scope;
      /**
       * Whether the reference comes from a dynamic scope (such as 'eval',
       * 'with', etc.), and may be trapped by dynamic scopes.
       * @member {boolean} Reference#tainted
       */
      this.tainted = false;
      /**
       * The variable this reference is resolved with.
       * @member {Variable} Reference#resolved
       */
      this.resolved = null;
      /**
       * The read-write mode of the reference. (Value is one of {@link
       * Reference.READ}, {@link Reference.RW}, {@link Reference.WRITE}).
       * @member {number} Reference#flag
       * @private
       */
      this.flag = flag;
      if (this.isWrite()) {
          /**
           * If reference is writeable, this is the tree being written to it.
           * @member {esprima#Node} Reference#writeExpr
           */
          this.writeExpr = writeExpr;
          /**
           * Whether the Reference might refer to a partial value of writeExpr.
           * @member {boolean} Reference#partial
           */
          this.partial = partial;
          /**
           * Whether the Reference is to write of initialization.
           * @member {boolean} Reference#init
           */
          this.init = init;
      }
      this.__maybeImplicitGlobal = maybeImplicitGlobal;
  };

  /**
   * Whether the reference is static.
   * @method Reference#isStatic
   * @return {boolean}
   */
  Reference.prototype.isStatic = function isStatic () {
      return !this.tainted && this.resolved && this.resolved.scope.isStatic();
  };

  /**
   * Whether the reference is writeable.
   * @method Reference#isWrite
   * @return {boolean}
   */
  Reference.prototype.isWrite = function isWrite () {
      return !!(this.flag & Reference.WRITE);
  };

  /**
   * Whether the reference is readable.
   * @method Reference#isRead
   * @return {boolean}
   */
  Reference.prototype.isRead = function isRead () {
      return !!(this.flag & Reference.READ);
  };

  /**
   * Whether the reference is read-only.
   * @method Reference#isReadOnly
   * @return {boolean}
   */
  Reference.prototype.isReadOnly = function isReadOnly () {
      return this.flag === Reference.READ;
  };

  /**
   * Whether the reference is write-only.
   * @method Reference#isWriteOnly
   * @return {boolean}
   */
  Reference.prototype.isWriteOnly = function isWriteOnly () {
      return this.flag === Reference.WRITE;
  };

  /**
   * Whether the reference is read-write.
   * @method Reference#isReadWrite
   * @return {boolean}
   */
  Reference.prototype.isReadWrite = function isReadWrite () {
      return this.flag === Reference.RW;
  };

/**
 * @constant Reference.READ
 * @private
 */
Reference.READ = READ;
/**
 * @constant Reference.WRITE
 * @private
 */
Reference.WRITE = WRITE;
/**
 * @constant Reference.RW
 * @private
 */
Reference.RW = RW;

/* vim: set sw=4 ts=4 et tw=80 : */

/*
  Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 * A Variable represents a locally scoped identifier. These include arguments to
 * functions.
 * @class Variable
 */
var Variable = function Variable(name, scope) {
      /**
       * The variable name, as given in the source code.
       * @member {String} Variable#name
       */
      this.name = name;
      /**
       * List of defining occurrences of this variable (like in 'var ...'
       * statements or as parameter), as AST nodes.
       * @member {esprima.Identifier[]} Variable#identifiers
       */
      this.identifiers = [];
      /**
       * List of {@link Reference|references} of this variable (excluding parameter entries)
       * in its defining scope and all nested scopes. For defining
       * occurrences only see {@link Variable#defs}.
       * @member {Reference[]} Variable#references
       */
      this.references = [];

      /**
       * List of defining occurrences of this variable (like in 'var ...'
       * statements or as parameter), as custom objects.
       * @member {Definition[]} Variable#defs
       */
      this.defs = [];

      this.tainted = false;
      /**
       * Whether this is a stack variable.
       * @member {boolean} Variable#stack
       */
      this.stack = true;
      /**
       * Reference to the enclosing Scope.
       * @member {Scope} Variable#scope
       */
      this.scope = scope;
  };

Variable.CatchClause = 'CatchClause';
Variable.Parameter = 'Parameter';
Variable.FunctionName = 'FunctionName';
Variable.ClassName = 'ClassName';
Variable.Variable = 'Variable';
Variable.ImportBinding = 'ImportBinding';
Variable.TDZ = 'TDZ';
Variable.ImplicitGlobalVariable = 'ImplicitGlobalVariable';

/* vim: set sw=4 ts=4 et tw=80 : */

/*
  Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 * @class Definition
 */
var Definition = function Definition(type, name, node, parent, index, kind) {
      /**
       * @member {String} Definition#type - type of the occurrence (e.g. "Parameter", "Variable", ...).
       */
      this.type = type;
      /**
       * @member {esprima.Identifier} Definition#name - the identifier AST node of the occurrence.
       */
      this.name = name;
      /**
       * @member {esprima.Node} Definition#node - the enclosing node of the identifier.
       */
      this.node = node;
      /**
       * @member {esprima.Node?} Definition#parent - the enclosing statement node of the identifier.
       */
      this.parent = parent;
      /**
       * @member {Number?} Definition#index - the index in the declaration statement.
       */
      this.index = index;
      /**
       * @member {String?} Definition#kind - the kind of the declaration statement.
       */
      this.kind = kind;
  };

/**
 * @class ParameterDefinition
 */
var ParameterDefinition = (function (Definition) {
  function ParameterDefinition(name, node, index, rest) {
        Definition.call(this, Variable.Parameter, name, node, null, index, null);
        /**
         * Whether the parameter definition is a part of a rest parameter.
         * @member {boolean} ParameterDefinition#rest
         */
        this.rest = rest;
    }

  if ( Definition ) ParameterDefinition.__proto__ = Definition;
  ParameterDefinition.prototype = Object.create( Definition && Definition.prototype );
  ParameterDefinition.prototype.constructor = ParameterDefinition;

  return ParameterDefinition;
}(Definition));

/*
  Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

function isStrictScope(scope, block, isMethodDefinition, useDirective) {
    var body, i, iz, stmt, expr;

    // When upper scope is exists and strict, inner scope is also strict.
    if (scope.upper && scope.upper.isStrict) {
        return true;
    }

    // ArrowFunctionExpression's scope is always strict scope.
    if (block.type === estraverse_estraverse.Syntax.ArrowFunctionExpression) {
        return true;
    }

    if (isMethodDefinition) {
        return true;
    }

    if (scope.type === 'class' || scope.type === 'module') {
        return true;
    }

    if (scope.type === 'block' || scope.type === 'switch') {
        return false;
    }

    if (scope.type === 'function') {
        if (block.type === estraverse_estraverse.Syntax.Program) {
            body = block;
        } else {
            body = block.body;
        }
    } else if (scope.type === 'global') {
        body = block;
    } else {
        return false;
    }

    // Search 'use strict' directive.
    if (useDirective) {
        for (i = 0, iz = body.body.length; i < iz; ++i) {
            stmt = body.body[i];
            if (stmt.type !== estraverse_estraverse.Syntax.DirectiveStatement) {
                break;
            }
            if (stmt.raw === '"use strict"' || stmt.raw === '\'use strict\'') {
                return true;
            }
        }
    } else {
        for (i = 0, iz = body.body.length; i < iz; ++i) {
            stmt = body.body[i];
            if (stmt.type !== estraverse_estraverse.Syntax.ExpressionStatement) {
                break;
            }
            expr = stmt.expression;
            if (expr.type !== estraverse_estraverse.Syntax.Literal || typeof expr.value !== 'string') {
                break;
            }
            if (expr.raw !== null) {
                if (expr.raw === '"use strict"' || expr.raw === '\'use strict\'') {
                    return true;
                }
            } else {
                if (expr.value === 'use strict') {
                    return true;
                }
            }
        }
    }
    return false;
}

function registerScope(scopeManager, scope) {
    var scopes;

    scopeManager.scopes.push(scope);

    scopes = scopeManager.__nodeToScope.get(scope.block);
    if (scopes) {
        scopes.push(scope);
    } else {
        scopeManager.__nodeToScope.set(scope.block, [ scope ]);
    }
}

function shouldBeStatically(def) {
    return (
        (def.type === Variable.ClassName) ||
        (def.type === Variable.Variable && def.parent.kind !== 'var')
    );
}

/**
 * @class Scope
 */
var Scope = function Scope(scopeManager, type, upperScope, block, isMethodDefinition) {
      /**
       * One of 'TDZ', 'module', 'block', 'switch', 'function', 'catch', 'with', 'function', 'class', 'global'.
       * @member {String} Scope#type
       */
      this.type = type;
       /**
       * The scoped {@link Variable}s of this scope, as <code>{ Variable.name
       * : Variable }</code>.
       * @member {Map} Scope#set
       */
      this.set = new Map();
      /**
       * The tainted variables of this scope, as <code>{ Variable.name :
       * boolean }</code>.
       * @member {Map} Scope#taints */
      this.taints = new Map();
      /**
       * Generally, through the lexical scoping of JS you can always know
       * which variable an identifier in the source code refers to. There are
       * a few exceptions to this rule. With 'global' and 'with' scopes you
       * can only decide at runtime which variable a reference refers to.
       * Moreover, if 'eval()' is used in a scope, it might introduce new
       * bindings in this or its parent scopes.
       * All those scopes are considered 'dynamic'.
       * @member {boolean} Scope#dynamic
       */
      this.dynamic = this.type === 'global' || this.type === 'with';
      /**
       * A reference to the scope-defining syntax node.
       * @member {esprima.Node} Scope#block
       */
      this.block = block;
       /**
       * The {@link Reference|references} that are not resolved with this scope.
       * @member {Reference[]} Scope#through
       */
      this.through = [];
       /**
       * The scoped {@link Variable}s of this scope. In the case of a
       * 'function' scope this includes the automatic argument <em>arguments</em> as
       * its first element, as well as all further formal arguments.
       * @member {Variable[]} Scope#variables
       */
      this.variables = [];
       /**
       * Any variable {@link Reference|reference} found in this scope. This
       * includes occurrences of local variables as well as variables from
       * parent scopes (including the global scope). For local variables
       * this also includes defining occurrences (like in a 'var' statement).
       * In a 'function' scope this does not include the occurrences of the
       * formal parameter in the parameter list.
       * @member {Reference[]} Scope#references
       */
      this.references = [];

       /**
       * For 'global' and 'function' scopes, this is a self-reference. For
       * other scope types this is the <em>variableScope</em> value of the
       * parent scope.
       * @member {Scope} Scope#variableScope
       */
      this.variableScope =
          (this.type === 'global' || this.type === 'function' || this.type === 'module') ? this : upperScope.variableScope;
       /**
       * Whether this scope is created by a FunctionExpression.
       * @member {boolean} Scope#functionExpressionScope
       */
      this.functionExpressionScope = false;
       /**
       * Whether this is a scope that contains an 'eval()' invocation.
       * @member {boolean} Scope#directCallToEvalScope
       */
      this.directCallToEvalScope = false;
       /**
       * @member {boolean} Scope#thisFound
       */
      this.thisFound = false;

      this.__left = [];

       /**
       * Reference to the parent {@link Scope|scope}.
       * @member {Scope} Scope#upper
       */
      this.upper = upperScope;
       /**
       * Whether 'use strict' is in effect in this scope.
       * @member {boolean} Scope#isStrict
       */
      this.isStrict = isStrictScope(this, block, isMethodDefinition, scopeManager.__useDirective());

       /**
       * List of nested {@link Scope}s.
       * @member {Scope[]} Scope#childScopes
       */
      this.childScopes = [];
      if (this.upper) {
          this.upper.childScopes.push(this);
      }

      this.__declaredVariables = scopeManager.__declaredVariables;

      registerScope(scopeManager, this);
  };

  Scope.prototype.__shouldStaticallyClose = function __shouldStaticallyClose (scopeManager) {
      return (!this.dynamic || scopeManager.__isOptimistic());
  };

  Scope.prototype.__shouldStaticallyCloseForGlobal = function __shouldStaticallyCloseForGlobal (ref) {
      // On global scope, let/const/class declarations should be resolved statically.
      var name = ref.identifier.name;
      if (!this.set.has(name)) {
          return false;
      }

      var variable = this.set.get(name);
      var defs = variable.defs;
      return defs.length > 0 && defs.every(shouldBeStatically);
  };

  Scope.prototype.__staticCloseRef = function __staticCloseRef (ref) {
      if (!this.__resolve(ref)) {
          this.__delegateToUpperScope(ref);
      }
  };

  Scope.prototype.__dynamicCloseRef = function __dynamicCloseRef (ref) {
      // notify all names are through to global
      var current = this;
      do {
          current.through.push(ref);
          current = current.upper;
      } while (current);
  };

  Scope.prototype.__globalCloseRef = function __globalCloseRef (ref) {
      // let/const/class declarations should be resolved statically.
      // others should be resolved dynamically.
      if (this.__shouldStaticallyCloseForGlobal(ref)) {
          this.__staticCloseRef(ref);
      } else {
          this.__dynamicCloseRef(ref);
      }
  };

  Scope.prototype.__close = function __close (scopeManager) {
        var this$1 = this;

      var closeRef;
      if (this.__shouldStaticallyClose(scopeManager)) {
          closeRef = this.__staticCloseRef;
      } else if (this.type !== 'global') {
          closeRef = this.__dynamicCloseRef;
      } else {
          closeRef = this.__globalCloseRef;
      }

      // Try Resolving all references in this scope.
      for (var i = 0, iz = this.__left.length; i < iz; ++i) {
          var ref = this$1.__left[i];
          closeRef.call(this$1, ref);
      }
      this.__left = null;

      return this.upper;
  };

  Scope.prototype.__resolve = function __resolve (ref) {
      var variable, name;
      name = ref.identifier.name;
      if (this.set.has(name)) {
          variable = this.set.get(name);
          variable.references.push(ref);
          variable.stack = variable.stack && ref.from.variableScope === this.variableScope;
          if (ref.tainted) {
              variable.tainted = true;
              this.taints.set(variable.name, true);
          }
          ref.resolved = variable;
          return true;
      }
      return false;
  };

  Scope.prototype.__delegateToUpperScope = function __delegateToUpperScope (ref) {
      if (this.upper) {
          this.upper.__left.push(ref);
      }
      this.through.push(ref);
  };

  Scope.prototype.__addDeclaredVariablesOfNode = function __addDeclaredVariablesOfNode (variable, node) {
      if (!node) {
          return;
      }

      var variables = this.__declaredVariables.get(node);
      if (!Array.isArray(variables)) {
          variables = [];
          this.__declaredVariables.set(node, variables);
      }
      if (variables.indexOf(variable) === -1) {
          variables.push(variable);
      }
  };

  Scope.prototype.__defineGeneric = function __defineGeneric (name, set, variables, node, def) {
      var variable;

      variable = set.get(name);
      if (!variable) {
          variable = new Variable(name, this);
          set.set(name, variable);
          variables.push(variable);
      }

      if (def) {
          variable.defs.push(def);
          if (def.type !== Variable.TDZ) {
              this.__addDeclaredVariablesOfNode(variable, def.node);
              this.__addDeclaredVariablesOfNode(variable, def.parent);
          }
      }
      if (node) {
          variable.identifiers.push(node);
      }
  };

  Scope.prototype.__define = function __define (node, def) {
      if (node && node.type === estraverse_estraverse.Syntax.Identifier) {
          this.__defineGeneric(
                  node.name,
                  this.set,
                  this.variables,
                  node,
                  def);
      }
  };

  Scope.prototype.__referencing = function __referencing (node, assign, writeExpr, maybeImplicitGlobal, partial, init) {
      // because Array element may be null
      if (!node || node.type !== estraverse_estraverse.Syntax.Identifier) {
          return;
      }

      // Specially handle like `this`.
      if (node.name === 'super') {
          return;
      }

      var ref = new Reference(node, this, assign || Reference.READ, writeExpr, maybeImplicitGlobal, !!partial, !!init);
      this.references.push(ref);
      this.__left.push(ref);
  };

  Scope.prototype.__detectEval = function __detectEval () {
      var current;
      current = this;
      this.directCallToEvalScope = true;
      do {
          current.dynamic = true;
          current = current.upper;
      } while (current);
  };

  Scope.prototype.__detectThis = function __detectThis () {
      this.thisFound = true;
  };

  Scope.prototype.__isClosed = function __isClosed () {
      return this.__left === null;
  };

  /**
   * returns resolved {Reference}
   * @method Scope#resolve
   * @param {Esprima.Identifier} ident - identifier to be resolved.
   * @return {Reference}
   */
  Scope.prototype.resolve = function resolve (ident) {
        var this$1 = this;

      var ref, i, iz;
      if(!this.__isClosed()) {
        	throw new Error("Scope should be closed.");
      }
      if(ident.type !== estraverse_estraverse.Syntax.Identifier) {
        	throw new Error('Target should be identifier.');
      }
      for (i = 0, iz = this.references.length; i < iz; ++i) {
          ref = this$1.references[i];
          if (ref.identifier === ident) {
              return ref;
          }
      }
      return null;
  };

  /**
   * returns this scope is static
   * @method Scope#isStatic
   * @return {boolean}
   */
  Scope.prototype.isStatic = function isStatic () {
      return !this.dynamic;
  };

  /**
   * returns this scope has materialized arguments
   * @method Scope#isArgumentsMaterialized
   * @return {boolean}
   */
  Scope.prototype.isArgumentsMaterialized = function isArgumentsMaterialized () {
      return true;
  };

  /**
   * returns this scope has materialized `this` reference
   * @method Scope#isThisMaterialized
   * @return {boolean}
   */
  Scope.prototype.isThisMaterialized = function isThisMaterialized () {
      return true;
  };

  Scope.prototype.isUsedName = function isUsedName (name) {
        var this$1 = this;

      if (this.set.has(name)) {
          return true;
      }
      for (var i = 0, iz = this.through.length; i < iz; ++i) {
          if (this$1.through[i].identifier.name === name) {
              return true;
          }
      }
      return false;
  };

var GlobalScope = (function (Scope) {
  function GlobalScope(scopeManager, block) {
        Scope.call(this, scopeManager, 'global', null, block, false);
        this.implicit = {
            set: new Map(),
            variables: [],
            /**
            * List of {@link Reference}s that are left to be resolved (i.e. which
            * need to be linked to the variable they refer to).
            * @member {Reference[]} Scope#implicit#left
            */
            left: []
        };
    }

  if ( Scope ) GlobalScope.__proto__ = Scope;
  GlobalScope.prototype = Object.create( Scope && Scope.prototype );
  GlobalScope.prototype.constructor = GlobalScope;

    GlobalScope.prototype.__close = function __close (scopeManager) {
        var this$1 = this;

        var implicit = [];
        for (var i = 0, iz = this.__left.length; i < iz; ++i) {
            var ref = this$1.__left[i];
            if (ref.__maybeImplicitGlobal && !this$1.set.has(ref.identifier.name)) {
                implicit.push(ref.__maybeImplicitGlobal);
            }
        }

        // create an implicit global variable from assignment expression
        for (var i$1 = 0, iz$1 = implicit.length; i$1 < iz$1; ++i$1) {
            var info = implicit[i$1];
            this$1.__defineImplicit(info.pattern,
                    new Definition(
                        Variable.ImplicitGlobalVariable,
                        info.pattern,
                        info.node,
                        null,
                        null,
                        null
                    ));

        }

        this.implicit.left = this.__left;

        return Scope.prototype.__close.call(this, scopeManager);
    };

    GlobalScope.prototype.__defineImplicit = function __defineImplicit (node, def) {
        if (node && node.type === estraverse_estraverse.Syntax.Identifier) {
            this.__defineGeneric(
                    node.name,
                    this.implicit.set,
                    this.implicit.variables,
                    node,
                    def);
        }
    };

  return GlobalScope;
}(Scope));

var ModuleScope = (function (Scope) {
  function ModuleScope(scopeManager, upperScope, block) {
        Scope.call(this, scopeManager, 'module', upperScope, block, false);
    }

  if ( Scope ) ModuleScope.__proto__ = Scope;
  ModuleScope.prototype = Object.create( Scope && Scope.prototype );
  ModuleScope.prototype.constructor = ModuleScope;

  return ModuleScope;
}(Scope));

var FunctionExpressionNameScope = (function (Scope) {
  function FunctionExpressionNameScope(scopeManager, upperScope, block) {
        Scope.call(this, scopeManager, 'function-expression-name', upperScope, block, false);
        this.__define(block.id,
                new Definition(
                    Variable.FunctionName,
                    block.id,
                    block,
                    null,
                    null,
                    null
                ));
        this.functionExpressionScope = true;
    }

  if ( Scope ) FunctionExpressionNameScope.__proto__ = Scope;
  FunctionExpressionNameScope.prototype = Object.create( Scope && Scope.prototype );
  FunctionExpressionNameScope.prototype.constructor = FunctionExpressionNameScope;

  return FunctionExpressionNameScope;
}(Scope));

var CatchScope = (function (Scope) {
  function CatchScope(scopeManager, upperScope, block) {
        Scope.call(this, scopeManager, 'catch', upperScope, block, false);
    }

  if ( Scope ) CatchScope.__proto__ = Scope;
  CatchScope.prototype = Object.create( Scope && Scope.prototype );
  CatchScope.prototype.constructor = CatchScope;

  return CatchScope;
}(Scope));

var WithScope = (function (Scope) {
  function WithScope(scopeManager, upperScope, block) {
        Scope.call(this, scopeManager, 'with', upperScope, block, false);
    }

  if ( Scope ) WithScope.__proto__ = Scope;
  WithScope.prototype = Object.create( Scope && Scope.prototype );
  WithScope.prototype.constructor = WithScope;

    WithScope.prototype.__close = function __close (scopeManager) {
        var this$1 = this;

        if (this.__shouldStaticallyClose(scopeManager)) {
            return Scope.prototype.__close.call(this, scopeManager);
        }

        for (var i = 0, iz = this.__left.length; i < iz; ++i) {
            var ref = this$1.__left[i];
            ref.tainted = true;
            this$1.__delegateToUpperScope(ref);
        }
        this.__left = null;

        return this.upper;
    };

  return WithScope;
}(Scope));

var TDZScope = (function (Scope) {
  function TDZScope(scopeManager, upperScope, block) {
        Scope.call(this, scopeManager, 'TDZ', upperScope, block, false);
    }

  if ( Scope ) TDZScope.__proto__ = Scope;
  TDZScope.prototype = Object.create( Scope && Scope.prototype );
  TDZScope.prototype.constructor = TDZScope;

  return TDZScope;
}(Scope));

var BlockScope = (function (Scope) {
  function BlockScope(scopeManager, upperScope, block) {
        Scope.call(this, scopeManager, 'block', upperScope, block, false);
    }

  if ( Scope ) BlockScope.__proto__ = Scope;
  BlockScope.prototype = Object.create( Scope && Scope.prototype );
  BlockScope.prototype.constructor = BlockScope;

  return BlockScope;
}(Scope));

var SwitchScope = (function (Scope) {
  function SwitchScope(scopeManager, upperScope, block) {
        Scope.call(this, scopeManager, 'switch', upperScope, block, false);
    }

  if ( Scope ) SwitchScope.__proto__ = Scope;
  SwitchScope.prototype = Object.create( Scope && Scope.prototype );
  SwitchScope.prototype.constructor = SwitchScope;

  return SwitchScope;
}(Scope));

var FunctionScope = (function (Scope) {
  function FunctionScope(scopeManager, upperScope, block, isMethodDefinition) {
        Scope.call(this, scopeManager, 'function', upperScope, block, isMethodDefinition);

        // section 9.2.13, FunctionDeclarationInstantiation.
        // NOTE Arrow functions never have an arguments objects.
        if (this.block.type !== estraverse_estraverse.Syntax.ArrowFunctionExpression) {
            this.__defineArguments();
        }
    }

  if ( Scope ) FunctionScope.__proto__ = Scope;
  FunctionScope.prototype = Object.create( Scope && Scope.prototype );
  FunctionScope.prototype.constructor = FunctionScope;

    FunctionScope.prototype.isArgumentsMaterialized = function isArgumentsMaterialized () {
        // TODO(Constellation)
        // We can more aggressive on this condition like this.
        //
        // function t() {
        //     // arguments of t is always hidden.
        //     function arguments() {
        //     }
        // }
        if (this.block.type === estraverse_estraverse.Syntax.ArrowFunctionExpression) {
            return false;
        }

        if (!this.isStatic()) {
            return true;
        }

        var variable = this.set.get('arguments');
        if(!variable) {
        	throw new Error('Always have arguments variable.');
        }
        return variable.tainted || variable.references.length  !== 0;
    };

    FunctionScope.prototype.isThisMaterialized = function isThisMaterialized () {
        if (!this.isStatic()) {
            return true;
        }
        return this.thisFound;
    };

    FunctionScope.prototype.__defineArguments = function __defineArguments () {
        this.__defineGeneric(
                'arguments',
                this.set,
                this.variables,
                null,
                null);
        this.taints.set('arguments', true);
    };

  return FunctionScope;
}(Scope));

var ForScope = (function (Scope) {
  function ForScope(scopeManager, upperScope, block) {
        Scope.call(this, scopeManager, 'for', upperScope, block, false);
    }

  if ( Scope ) ForScope.__proto__ = Scope;
  ForScope.prototype = Object.create( Scope && Scope.prototype );
  ForScope.prototype.constructor = ForScope;

  return ForScope;
}(Scope));

var ClassScope = (function (Scope) {
  function ClassScope(scopeManager, upperScope, block) {
        Scope.call(this, scopeManager, 'class', upperScope, block, false);
    }

  if ( Scope ) ClassScope.__proto__ = Scope;
  ClassScope.prototype = Object.create( Scope && Scope.prototype );
  ClassScope.prototype.constructor = ClassScope;

  return ClassScope;
}(Scope));

/* vim: set sw=4 ts=4 et tw=80 : */

/*
  Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 * @class ScopeManager
 */
var ScopeManager = function ScopeManager(options) {
      this.scopes = [];
      this.globalScope = null;
      this.__nodeToScope = new WeakMap();
      this.__currentScope = null;
      this.__options = options;
      this.__declaredVariables = new WeakMap();
  };

  ScopeManager.prototype.__useDirective = function __useDirective () {
      return this.__options.directive;
  };

  ScopeManager.prototype.__isOptimistic = function __isOptimistic () {
      return this.__options.optimistic;
  };

  ScopeManager.prototype.__ignoreEval = function __ignoreEval () {
      return this.__options.ignoreEval;
  };

  ScopeManager.prototype.__isNodejsScope = function __isNodejsScope () {
      return this.__options.nodejsScope;
  };

  ScopeManager.prototype.isModule = function isModule () {
      return this.__options.sourceType === 'module';
  };

  ScopeManager.prototype.isImpliedStrict = function isImpliedStrict () {
      return this.__options.impliedStrict;
  };

  ScopeManager.prototype.isStrictModeSupported = function isStrictModeSupported () {
      return this.__options.ecmaVersion >= 5;
  };

  // Returns appropriate scope for this node.
  ScopeManager.prototype.__get = function __get (node) {
      return this.__nodeToScope.get(node);
  };

  /**
   * Get variables that are declared by the node.
   *
   * "are declared by the node" means the node is same as `Variable.defs[].node` or `Variable.defs[].parent`.
   * If the node declares nothing, this method returns an empty array.
   * CAUTION: This API is experimental. See https://github.com/estools/escope/pull/69 for more details.
   *
   * @param {Esprima.Node} node - a node to get.
   * @returns {Variable[]} variables that declared by the node.
   */
  ScopeManager.prototype.getDeclaredVariables = function getDeclaredVariables (node) {
      return this.__declaredVariables.get(node) || [];
  };

  /**
   * acquire scope from node.
   * @method ScopeManager#acquire
   * @param {Esprima.Node} node - node for the acquired scope.
   * @param {boolean=} inner - look up the most inner scope, default value is false.
   * @return {Scope?}
   */
  ScopeManager.prototype.acquire = function acquire (node, inner) {
      var scopes, scope, i, iz;

      function predicate(scope) {
          if (scope.type === 'function' && scope.functionExpressionScope) {
              return false;
          }
          if (scope.type === 'TDZ') {
              return false;
          }
          return true;
      }

      scopes = this.__get(node);
      if (!scopes || scopes.length === 0) {
          return null;
      }

      // Heuristic selection from all scopes.
      // If you would like to get all scopes, please use ScopeManager#acquireAll.
      if (scopes.length === 1) {
          return scopes[0];
      }

      if (inner) {
          for (i = scopes.length - 1; i >= 0; --i) {
              scope = scopes[i];
              if (predicate(scope)) {
                  return scope;
              }
          }
      } else {
          for (i = 0, iz = scopes.length; i < iz; ++i) {
              scope = scopes[i];
              if (predicate(scope)) {
                  return scope;
              }
          }
      }

      return null;
  };

  /**
   * acquire all scopes from node.
   * @method ScopeManager#acquireAll
   * @param {Esprima.Node} node - node for the acquired scope.
   * @return {Scope[]?}
   */
  ScopeManager.prototype.acquireAll = function acquireAll (node) {
      return this.__get(node);
  };

  /**
   * release the node.
   * @method ScopeManager#release
   * @param {Esprima.Node} node - releasing node.
   * @param {boolean=} inner - look up the most inner scope, default value is false.
   * @return {Scope?} upper scope for the node.
   */
  ScopeManager.prototype.release = function release (node, inner) {
      var scopes, scope;
      scopes = this.__get(node);
      if (scopes && scopes.length) {
          scope = scopes[0].upper;
          if (!scope) {
              return null;
          }
          return this.acquire(scope.block, inner);
      }
      return null;
  };

  ScopeManager.prototype.attach = function attach () { };

  ScopeManager.prototype.detach = function detach () { };

  ScopeManager.prototype.__nestScope = function __nestScope (scope) {
      if (scope instanceof GlobalScope) {
        	if(this.__currentScope !== null) {
        		throw new Error("_currentScope is not null trying to nest scopes.");
        	}
          this.globalScope = scope;
      }
      this.__currentScope = scope;
      return scope;
  };

  ScopeManager.prototype.__nestGlobalScope = function __nestGlobalScope (node) {
      return this.__nestScope(new GlobalScope(this, node));
  };

  ScopeManager.prototype.__nestBlockScope = function __nestBlockScope (node, isMethodDefinition) {
      return this.__nestScope(new BlockScope(this, this.__currentScope, node));
  };

  ScopeManager.prototype.__nestFunctionScope = function __nestFunctionScope (node, isMethodDefinition) {
      return this.__nestScope(new FunctionScope(this, this.__currentScope, node, isMethodDefinition));
  };

  ScopeManager.prototype.__nestForScope = function __nestForScope (node) {
      return this.__nestScope(new ForScope(this, this.__currentScope, node));
  };

  ScopeManager.prototype.__nestCatchScope = function __nestCatchScope (node) {
      return this.__nestScope(new CatchScope(this, this.__currentScope, node));
  };

  ScopeManager.prototype.__nestWithScope = function __nestWithScope (node) {
      return this.__nestScope(new WithScope(this, this.__currentScope, node));
  };

  ScopeManager.prototype.__nestClassScope = function __nestClassScope (node) {
      return this.__nestScope(new ClassScope(this, this.__currentScope, node));
  };

  ScopeManager.prototype.__nestSwitchScope = function __nestSwitchScope (node) {
      return this.__nestScope(new SwitchScope(this, this.__currentScope, node));
  };

  ScopeManager.prototype.__nestModuleScope = function __nestModuleScope (node) {
      return this.__nestScope(new ModuleScope(this, this.__currentScope, node));
  };

  ScopeManager.prototype.__nestTDZScope = function __nestTDZScope (node) {
      return this.__nestScope(new TDZScope(this, this.__currentScope, node));
  };

  ScopeManager.prototype.__nestFunctionExpressionNameScope = function __nestFunctionExpressionNameScope (node) {
      return this.__nestScope(new FunctionExpressionNameScope(this, this.__currentScope, node));
  };

  ScopeManager.prototype.__isES6 = function __isES6 () {
      return this.__options.ecmaVersion >= 6;
  };

/*
  Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

function getLast(xs) {
    return xs[xs.length - 1] || null;
}

var PatternVisitor = (function (superclass) {
  function PatternVisitor(options, rootPattern, callback) {
        superclass.call(this, null, options);
        this.rootPattern = rootPattern;
        this.callback = callback;
        this.assignments = [];
        this.rightHandNodes = [];
        this.restElements = [];
    }

  if ( superclass ) PatternVisitor.__proto__ = superclass;
  PatternVisitor.prototype = Object.create( superclass && superclass.prototype );
  PatternVisitor.prototype.constructor = PatternVisitor;

    PatternVisitor.isPattern = function isPattern (node) {
        var nodeType = node.type;
        return (
            nodeType === estraverse_estraverse.Syntax.Identifier ||
            nodeType === estraverse_estraverse.Syntax.ObjectPattern ||
            nodeType === estraverse_estraverse.Syntax.ArrayPattern ||
            nodeType === estraverse_estraverse.Syntax.SpreadElement ||
            nodeType === estraverse_estraverse.Syntax.RestElement ||
            nodeType === estraverse_estraverse.Syntax.AssignmentPattern
        );
    };

  PatternVisitor.prototype.Identifier = function Identifier (pattern) {
        var lastRestElement = getLast(this.restElements);
        this.callback(pattern, {
            topLevel: pattern === this.rootPattern,
            rest: lastRestElement != null && lastRestElement.argument === pattern,
            assignments: this.assignments
        });
    };

    PatternVisitor.prototype.Property = function Property (property) {
        // Computed property's key is a right hand node.
        if (property.computed) {
            this.rightHandNodes.push(property.key);
        }

        // If it's shorthand, its key is same as its value.
        // If it's shorthand and has its default value, its key is same as its value.left (the value is AssignmentPattern).
        // If it's not shorthand, the name of new variable is its value's.
        this.visit(property.value);
    };

    PatternVisitor.prototype.ArrayPattern = function ArrayPattern (pattern) {
        var this$1 = this;

        var i, iz, element;
        for (i = 0, iz = pattern.elements.length; i < iz; ++i) {
            element = pattern.elements[i];
            this$1.visit(element);
        }
    };

    PatternVisitor.prototype.AssignmentPattern = function AssignmentPattern (pattern) {
        this.assignments.push(pattern);
        this.visit(pattern.left);
        this.rightHandNodes.push(pattern.right);
        this.assignments.pop();
    };

    PatternVisitor.prototype.RestElement = function RestElement (pattern) {
        this.restElements.push(pattern);
        this.visit(pattern.argument);
        this.restElements.pop();
    };

    PatternVisitor.prototype.MemberExpression = function MemberExpression (node) {
        // Computed property's key is a right hand node.
        if (node.computed) {
            this.rightHandNodes.push(node.property);
        }
        // the object is only read, write to its property.
        this.rightHandNodes.push(node.object);
    };

    //
    // ForInStatement.left and AssignmentExpression.left are LeftHandSideExpression.
    // By spec, LeftHandSideExpression is Pattern or MemberExpression.
    //   (see also: https://github.com/estree/estree/pull/20#issuecomment-74584758)
    // But espree 2.0 and esprima 2.0 parse to ArrayExpression, ObjectExpression, etc...
    //

    PatternVisitor.prototype.SpreadElement = function SpreadElement (node) {
        this.visit(node.argument);
    };

    PatternVisitor.prototype.ArrayExpression = function ArrayExpression (node) {
        node.elements.forEach(this.visit, this);
    };

    PatternVisitor.prototype.AssignmentExpression = function AssignmentExpression (node) {
        this.assignments.push(node);
        this.visit(node.left);
        this.rightHandNodes.push(node.right);
        this.assignments.pop();
    };

    PatternVisitor.prototype.CallExpression = function CallExpression (node) {
        var this$1 = this;

        // arguments are right hand nodes.
        node.arguments.forEach(function (a) { this$1.rightHandNodes.push(a); });
        this.visit(node.callee);
    };

  return PatternVisitor;
}(esrecurse.Visitor));

/*
  Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
function traverseIdentifierInPattern(options, rootPattern, referencer, callback) {
    // Call the callback at left hand identifier nodes, and Collect right hand nodes.
    var visitor = new PatternVisitor(options, rootPattern, callback);
    visitor.visit(rootPattern);

    // Process the right hand nodes recursively.
    if (referencer != null) {
        visitor.rightHandNodes.forEach(referencer.visit, referencer);
    }
}

// Importing ImportDeclaration.
// http://people.mozilla.org/~jorendorff/es6-draft.html#sec-moduledeclarationinstantiation
// https://github.com/estree/estree/blob/master/es6.md#importdeclaration
// FIXME: Now, we don't create module environment, because the context is
// implementation dependent.

var Importer = (function (superclass) {
  function Importer(declaration, referencer) {
        superclass.call(this, null, referencer.options);
        this.declaration = declaration;
        this.referencer = referencer;
    }

  if ( superclass ) Importer.__proto__ = superclass;
  Importer.prototype = Object.create( superclass && superclass.prototype );
  Importer.prototype.constructor = Importer;

    Importer.prototype.visitImport = function visitImport (id, specifier) {
        var this$1 = this;

        this.referencer.visitPattern(id, function (pattern) {
            this$1.referencer.currentScope().__define(pattern,
                new Definition(
                    Variable.ImportBinding,
                    pattern,
                    specifier,
                    this$1.declaration,
                    null,
                    null
                    ));
        });
    };

    Importer.prototype.ImportNamespaceSpecifier = function ImportNamespaceSpecifier (node) {
        var local = (node.local || node.id);
        if (local) {
            this.visitImport(local, node);
        }
    };

    Importer.prototype.ImportDefaultSpecifier = function ImportDefaultSpecifier (node) {
        var local = (node.local || node.id);
        this.visitImport(local, node);
    };

    Importer.prototype.ImportSpecifier = function ImportSpecifier (node) {
        var local = (node.local || node.id);
        if (node.name) {
            this.visitImport(node.name, node);
        } else {
            this.visitImport(local, node);
        }
    };

  return Importer;
}(esrecurse.Visitor));

// Referencing variables and creating bindings.
var Referencer = (function (superclass) {
  function Referencer(options, scopeManager) {
        superclass.call(this, null, options);
        this.options = options;
        this.scopeManager = scopeManager;
        this.parent = null;
        this.isInnerMethodDefinition = false;
    }

  if ( superclass ) Referencer.__proto__ = superclass;
  Referencer.prototype = Object.create( superclass && superclass.prototype );
  Referencer.prototype.constructor = Referencer;

    Referencer.prototype.currentScope = function currentScope () {
        return this.scopeManager.__currentScope;
    };

    Referencer.prototype.close = function close (node) {
        var this$1 = this;

        while (this.currentScope() && node === this.currentScope().block) {
            this$1.scopeManager.__currentScope = this$1.currentScope().__close(this$1.scopeManager);
        }
    };

    Referencer.prototype.pushInnerMethodDefinition = function pushInnerMethodDefinition (isInnerMethodDefinition) {
        var previous = this.isInnerMethodDefinition;
        this.isInnerMethodDefinition = isInnerMethodDefinition;
        return previous;
    };

    Referencer.prototype.popInnerMethodDefinition = function popInnerMethodDefinition (isInnerMethodDefinition) {
        this.isInnerMethodDefinition = isInnerMethodDefinition;
    };

    Referencer.prototype.materializeTDZScope = function materializeTDZScope (node, iterationNode) {
        // http://people.mozilla.org/~jorendorff/es6-draft.html#sec-runtime-semantics-forin-div-ofexpressionevaluation-abstract-operation
        // TDZ scope hides the declaration's names.
        this.scopeManager.__nestTDZScope(node, iterationNode);
        this.visitVariableDeclaration(this.currentScope(), Variable.TDZ, iterationNode.left, 0, true);
    };

    Referencer.prototype.materializeIterationScope = function materializeIterationScope (node) {
        var this$1 = this;

        // Generate iteration scope for upper ForIn/ForOf Statements.
        var letOrConstDecl;
        this.scopeManager.__nestForScope(node);
        letOrConstDecl = node.left;
        this.visitVariableDeclaration(this.currentScope(), Variable.Variable, letOrConstDecl, 0);
        this.visitPattern(letOrConstDecl.declarations[0].id, function (pattern) {
            this$1.currentScope().__referencing(pattern, Reference.WRITE, node.right, null, true, true);
        });
    };

    Referencer.prototype.referencingDefaultValue = function referencingDefaultValue (pattern, assignments, maybeImplicitGlobal, init) {
        var scope = this.currentScope();
        assignments.forEach(function (assignment) {
            scope.__referencing(
                pattern,
                Reference.WRITE,
                assignment.right,
                maybeImplicitGlobal,
                pattern !== assignment.left,
                init);
        });
    };

    Referencer.prototype.visitPattern = function visitPattern (node, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {processRightHandNodes: false}
        }
        traverseIdentifierInPattern(
            this.options,
            node,
            options.processRightHandNodes ? this : null,
            callback);
    };

    Referencer.prototype.visitFunction = function visitFunction (node) {
        var this$1 = this;

        var i, iz;
        // FunctionDeclaration name is defined in upper scope
        // NOTE: Not referring variableScope. It is intended.
        // Since
        //  in ES5, FunctionDeclaration should be in FunctionBody.
        //  in ES6, FunctionDeclaration should be block scoped.
        if (node.type === estraverse_estraverse.Syntax.FunctionDeclaration) {
            // id is defined in upper scope
            this.currentScope().__define(node.id,
                    new Definition(
                        Variable.FunctionName,
                        node.id,
                        node,
                        null,
                        null,
                        null
                    ));
        }

        // FunctionExpression with name creates its special scope;
        // FunctionExpressionNameScope.
        if (node.type === estraverse_estraverse.Syntax.FunctionExpression && node.id) {
            this.scopeManager.__nestFunctionExpressionNameScope(node);
        }

        // Consider this function is in the MethodDefinition.
        this.scopeManager.__nestFunctionScope(node, this.isInnerMethodDefinition);

        // Process parameter declarations.
        for (i = 0, iz = node.params.length; i < iz; ++i) {
            this$1.visitPattern(node.params[i], {processRightHandNodes: true}, function (pattern, info) {
                this$1.currentScope().__define(pattern,
                    new ParameterDefinition(
                        pattern,
                        node,
                        i,
                        info.rest
                    ));

                this$1.referencingDefaultValue(pattern, info.assignments, null, true);
            });
        }

        // if there's a rest argument, add that
        if (node.rest) {
            this.visitPattern({
                type: 'RestElement',
                argument: node.rest
            }, function (pattern) {
                this$1.currentScope().__define(pattern,
                    new ParameterDefinition(
                        pattern,
                        node,
                        node.params.length,
                        true
                    ));
            });
        }

        // Skip BlockStatement to prevent creating BlockStatement scope.
        if (node.body.type === estraverse_estraverse.Syntax.BlockStatement) {
            this.visitChildren(node.body);
        } else {
            this.visit(node.body);
        }

        this.close(node);
    };

    Referencer.prototype.visitClass = function visitClass (node) {
        if (node.type === estraverse_estraverse.Syntax.ClassDeclaration) {
            this.currentScope().__define(node.id,
                    new Definition(
                        Variable.ClassName,
                        node.id,
                        node,
                        null,
                        null,
                        null
                    ));
        }

        // FIXME: Maybe consider TDZ.
        this.visit(node.superClass);

        this.scopeManager.__nestClassScope(node);

        if (node.id) {
            this.currentScope().__define(node.id,
                    new Definition(
                        Variable.ClassName,
                        node.id,
                        node
                    ));
        }
        this.visit(node.body);

        this.close(node);
    };

    Referencer.prototype.visitProperty = function visitProperty (node) {
        var previous, isMethodDefinition;
        if (node.computed) {
            this.visit(node.key);
        }

        isMethodDefinition = node.type === estraverse_estraverse.Syntax.MethodDefinition;
        if (isMethodDefinition) {
            previous = this.pushInnerMethodDefinition(true);
        }
        this.visit(node.value);
        if (isMethodDefinition) {
            this.popInnerMethodDefinition(previous);
        }
    };

    Referencer.prototype.visitForIn = function visitForIn (node) {
        var this$1 = this;

        if (node.left.type === estraverse_estraverse.Syntax.VariableDeclaration && node.left.kind !== 'var') {
            this.materializeTDZScope(node.right, node);
            this.visit(node.right);
            this.close(node.right);

            this.materializeIterationScope(node);
            this.visit(node.body);
            this.close(node);
        } else {
            if (node.left.type === estraverse_estraverse.Syntax.VariableDeclaration) {
                this.visit(node.left);
                this.visitPattern(node.left.declarations[0].id, function (pattern) {
                    this$1.currentScope().__referencing(pattern, Reference.WRITE, node.right, null, true, true);
                });
            } else {
                this.visitPattern(node.left, {processRightHandNodes: true}, function (pattern, info) {
                    var maybeImplicitGlobal = null;
                    if (!this$1.currentScope().isStrict) {
                        maybeImplicitGlobal = {
                            pattern: pattern,
                            node: node
                        };
                    }
                    this$1.referencingDefaultValue(pattern, info.assignments, maybeImplicitGlobal, false);
                    this$1.currentScope().__referencing(pattern, Reference.WRITE, node.right, maybeImplicitGlobal, true, false);
                });
            }
            this.visit(node.right);
            this.visit(node.body);
        }
    };

    Referencer.prototype.visitVariableDeclaration = function visitVariableDeclaration (variableTargetScope, type, node, index, fromTDZ) {
        var this$1 = this;

        // If this was called to initialize a TDZ scope, this needs to make definitions, but doesn't make references.
        var decl, init;

        decl = node.declarations[index];
        init = decl.init;
        this.visitPattern(decl.id, {processRightHandNodes: !fromTDZ}, function (pattern, info) {
            variableTargetScope.__define(pattern,
                new Definition(
                    type,
                    pattern,
                    decl,
                    node,
                    index,
                    node.kind
                ));

            if (!fromTDZ) {
                this$1.referencingDefaultValue(pattern, info.assignments, null, true);
            }
            if (init) {
                this$1.currentScope().__referencing(pattern, Reference.WRITE, init, null, !info.topLevel, true);
            }
        });
    };

    Referencer.prototype.AssignmentExpression = function AssignmentExpression (node) {
        var this$1 = this;

        if (PatternVisitor.isPattern(node.left)) {
            if (node.operator === '=') {
                this.visitPattern(node.left, {processRightHandNodes: true}, function (pattern, info) {
                    var maybeImplicitGlobal = null;
                    if (!this$1.currentScope().isStrict) {
                        maybeImplicitGlobal = {
                            pattern: pattern,
                            node: node
                        };
                    }
                    this$1.referencingDefaultValue(pattern, info.assignments, maybeImplicitGlobal, false);
                    this$1.currentScope().__referencing(pattern, Reference.WRITE, node.right, maybeImplicitGlobal, !info.topLevel, false);
                });
            } else {
                this.currentScope().__referencing(node.left, Reference.RW, node.right);
            }
        } else {
            this.visit(node.left);
        }
        this.visit(node.right);
    };

    Referencer.prototype.CatchClause = function CatchClause (node) {
        var this$1 = this;

        this.scopeManager.__nestCatchScope(node);

        this.visitPattern(node.param, {processRightHandNodes: true}, function (pattern, info) {
            this$1.currentScope().__define(pattern,
                new Definition(
                    Variable.CatchClause,
                    node.param,
                    node,
                    null,
                    null,
                    null
                ));
            this$1.referencingDefaultValue(pattern, info.assignments, null, true);
        });
        this.visit(node.body);

        this.close(node);
    };

    Referencer.prototype.Program = function Program (node) {
        this.scopeManager.__nestGlobalScope(node);

        if (this.scopeManager.__isNodejsScope()) {
            // Force strictness of GlobalScope to false when using node.js scope.
            this.currentScope().isStrict = false;
            this.scopeManager.__nestFunctionScope(node, false);
        }

        if (this.scopeManager.__isES6() && this.scopeManager.isModule()) {
            this.scopeManager.__nestModuleScope(node);
        }

        if (this.scopeManager.isStrictModeSupported() && this.scopeManager.isImpliedStrict()) {
            this.currentScope().isStrict = true;
        }

        this.visitChildren(node);
        this.close(node);
    };

    Referencer.prototype.Identifier = function Identifier (node) {
        this.currentScope().__referencing(node);
    };

    Referencer.prototype.UpdateExpression = function UpdateExpression (node) {
        if (PatternVisitor.isPattern(node.argument)) {
            this.currentScope().__referencing(node.argument, Reference.RW, null);
        } else {
            this.visitChildren(node);
        }
    };

    Referencer.prototype.MemberExpression = function MemberExpression (node) {
        this.visit(node.object);
        if (node.computed) {
            this.visit(node.property);
        }
    };

    Referencer.prototype.Property = function Property (node) {
        this.visitProperty(node);
    };

    Referencer.prototype.MethodDefinition = function MethodDefinition (node) {
        this.visitProperty(node);
    };

    Referencer.prototype.BreakStatement = function BreakStatement () {};

    Referencer.prototype.ContinueStatement = function ContinueStatement () {};

    Referencer.prototype.LabeledStatement = function LabeledStatement (node) {
        this.visit(node.body);
    };

    Referencer.prototype.ForStatement = function ForStatement (node) {
        // Create ForStatement declaration.
        // NOTE: In ES6, ForStatement dynamically generates
        // per iteration environment. However, escope is
        // a static analyzer, we only generate one scope for ForStatement.
        if (node.init && node.init.type === estraverse_estraverse.Syntax.VariableDeclaration && node.init.kind !== 'var') {
            this.scopeManager.__nestForScope(node);
        }

        this.visitChildren(node);

        this.close(node);
    };

    Referencer.prototype.ClassExpression = function ClassExpression (node) {
        this.visitClass(node);
    };

    Referencer.prototype.ClassDeclaration = function ClassDeclaration (node) {
        this.visitClass(node);
    };

    Referencer.prototype.CallExpression = function CallExpression (node) {
        // Check this is direct call to eval
        if (!this.scopeManager.__ignoreEval() && node.callee.type === estraverse_estraverse.Syntax.Identifier && node.callee.name === 'eval') {
            // NOTE: This should be `variableScope`. Since direct eval call always creates Lexical environment and
            // let / const should be enclosed into it. Only VariableDeclaration affects on the caller's environment.
            this.currentScope().variableScope.__detectEval();
        }
        this.visitChildren(node);
    };

    Referencer.prototype.BlockStatement = function BlockStatement (node) {
        if (this.scopeManager.__isES6()) {
            this.scopeManager.__nestBlockScope(node);
        }

        this.visitChildren(node);

        this.close(node);
    };

    Referencer.prototype.ThisExpression = function ThisExpression () {
        this.currentScope().variableScope.__detectThis();
    };

    Referencer.prototype.WithStatement = function WithStatement (node) {
        this.visit(node.object);
        // Then nest scope for WithStatement.
        this.scopeManager.__nestWithScope(node);

        this.visit(node.body);

        this.close(node);
    };

    Referencer.prototype.VariableDeclaration = function VariableDeclaration (node) {
        var this$1 = this;

        var variableTargetScope, i, iz, decl;
        variableTargetScope = (node.kind === 'var') ? this.currentScope().variableScope : this.currentScope();
        for (i = 0, iz = node.declarations.length; i < iz; ++i) {
            decl = node.declarations[i];
            this$1.visitVariableDeclaration(variableTargetScope, Variable.Variable, node, i);
            if (decl.init) {
                this$1.visit(decl.init);
            }
        }
    };

    // sec 13.11.8
    Referencer.prototype.SwitchStatement = function SwitchStatement (node) {
        var this$1 = this;

        var i, iz;

        this.visit(node.discriminant);

        if (this.scopeManager.__isES6()) {
            this.scopeManager.__nestSwitchScope(node);
        }

        for (i = 0, iz = node.cases.length; i < iz; ++i) {
            this$1.visit(node.cases[i]);
        }

        this.close(node);
    };

    Referencer.prototype.FunctionDeclaration = function FunctionDeclaration (node) {
        this.visitFunction(node);
    };

    Referencer.prototype.FunctionExpression = function FunctionExpression (node) {
        this.visitFunction(node);
    };

    Referencer.prototype.ForOfStatement = function ForOfStatement (node) {
        this.visitForIn(node);
    };

    Referencer.prototype.ForInStatement = function ForInStatement (node) {
        this.visitForIn(node);
    };

    Referencer.prototype.ArrowFunctionExpression = function ArrowFunctionExpression (node) {
        this.visitFunction(node);
    };

    Referencer.prototype.ImportDeclaration = function ImportDeclaration (node) {
        var importer;
		if(!this.scopeManager.__isES6() || !this.scopeManager.isModule()) {
			// ORION throw new Error('ImportDeclaration should appear when the mode is ES6 and in the module context.');
		}
        importer = new Importer(node, this);
        importer.visit(node);
    };

    Referencer.prototype.visitExportDeclaration = function visitExportDeclaration (node) {
        if (node.source) {
            return;
        }
        if (node.declaration) {
            this.visit(node.declaration);
            return;
        }

        this.visitChildren(node);
    };

    Referencer.prototype.ExportDeclaration = function ExportDeclaration (node) {
        this.visitExportDeclaration(node);
    };

    Referencer.prototype.ExportNamedDeclaration = function ExportNamedDeclaration (node) {
        this.visitExportDeclaration(node);
    };

    Referencer.prototype.ExportSpecifier = function ExportSpecifier (node) {
        var local = (node.id || node.local);
        this.visit(local);
    };

    Referencer.prototype.MetaProperty = function MetaProperty () {
        // do nothing.
    };

  return Referencer;
}(esrecurse.Visitor));

/*
  Copyright (C) 2012-2014 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2013 Alex Seville <hi@alexanderseville.com>
  Copyright (C) 2014 Thiago de Arruda <tpadilha84@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 * Escope (<a href="http://github.com/estools/escope">escope</a>) is an <a
 * href="http://www.ecma-international.org/publications/standards/Ecma-262.htm">ECMAScript</a>
 * scope analyzer extracted from the <a
 * href="http://github.com/estools/esmangle">esmangle project</a/>.
 * <p>
 * <em>escope</em> finds lexical scopes in a source program, i.e. areas of that
 * program where different occurrences of the same identifier refer to the same
 * variable. With each scope the contained variables are collected, and each
 * identifier reference in code is linked to its corresponding variable (if
 * possible).
 * <p>
 * <em>escope</em> works on a syntax tree of the parsed source code which has
 * to adhere to the <a
 * href="https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API">
 * Mozilla Parser API</a>. E.g. <a href="http://esprima.org">esprima</a> is a parser
 * that produces such syntax trees.
 * <p>
 * The main interface is the {@link analyze} function.
 * @module escope
 */

/*jslint bitwise:true */

function defaultOptions() {
    return {
        optimistic: false,
        directive: false,
        nodejsScope: false,
        impliedStrict: false,
        sourceType: 'script',  // one of ['script', 'module']
        ecmaVersion: 5,
        childVisitorKeys: null,
        fallback: 'iteration'
    };
}

function updateDeeply(target, override) {
    var key, val;

    function isHashObject(target) {
        return typeof target === 'object' && target instanceof Object && !(target instanceof Array) && !(target instanceof RegExp);
    }

    for (key in override) {
        if (override.hasOwnProperty(key)) {
            val = override[key];
            if (isHashObject(val)) {
                if (isHashObject(target[key])) {
                    updateDeeply(target[key], val);
                } else {
                    target[key] = updateDeeply({}, val);
                }
            } else {
                target[key] = val;
            }
        }
    }
    return target;
}

/**
 * Main interface function. Takes an Esprima syntax tree and returns the
 * analyzed scopes.
 * @function analyze
 * @param {esprima.Tree} tree
 * @param {Object} providedOptions - Options that tailor the scope analysis
 * @param {boolean} [providedOptions.optimistic=false] - the optimistic flag
 * @param {boolean} [providedOptions.directive=false]- the directive flag
 * @param {boolean} [providedOptions.ignoreEval=false]- whether to check 'eval()' calls
 * @param {boolean} [providedOptions.nodejsScope=false]- whether the whole
 * script is executed under node.js environment. When enabled, escope adds
 * a function scope immediately following the global scope.
 * @param {boolean} [providedOptions.impliedStrict=false]- implied strict mode
 * (if ecmaVersion >= 5).
 * @param {string} [providedOptions.sourceType='script']- the source type of the script. one of 'script' and 'module'
 * @param {number} [providedOptions.ecmaVersion=5]- which ECMAScript version is considered
 * @param {Object} [providedOptions.childVisitorKeys=null] - Additional known visitor keys. See [esrecurse](https://github.com/estools/esrecurse)'s the `childVisitorKeys` option.
 * @param {string} [providedOptions.fallback='iteration'] - A kind of the fallback in order to encounter with unknown node. See [esrecurse](https://github.com/estools/esrecurse)'s the `fallback` option.
 * @return {ScopeManager}
 */
function analyze(tree, providedOptions) {
    var scopeManager, referencer, options;

    options = updateDeeply(defaultOptions(), providedOptions);

    scopeManager = new ScopeManager(options);

    referencer = new Referencer(options, scopeManager);
    referencer.visit(tree);

    if(scopeManager.__currentScope !== null) {
    	throw new Error('currentScope should be null.');
	}
    return scopeManager;
}
var version = "3.6.0";

exports.analyze = analyze;
exports.version = version;
exports.Reference = Reference;
exports.Variable = Variable;
exports.Scope = Scope;
exports.ScopeManager = ScopeManager;

Object.defineProperty(exports, '__esModule', { value: true });

})));