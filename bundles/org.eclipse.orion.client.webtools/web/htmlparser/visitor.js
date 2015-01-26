/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
/* global doctrine */
define([
], function() {

    function visitNode(callback, node, last) {
        node.parent = last;
        var ret = callback.visitNode(node);
        if(ret === Visitor.BREAK || ret === Visitor.SKIP) {
            return ret;
        } 
        if(node.attributes) {
            var attrs = node.attributes;
            var keys = Object.keys(attrs);
            var attr;
            for(var i = 0; i < keys.length; i++) {
                attr = attrs[keys[i]];
                attr.parent = node;
                attr.kind = keys[i];
                ret = callback.visitNode(attr);
                if(ret === Visitor.SKIP) {
                    break;
                } else if(ret === Visitor.BREAK) {
                    return ret;
                }
            }
        }
        var kids = node.children;
        if(kids) {
            for(i = 0; i < kids.length; i++) {
                ret = visitNode(callback, kids[i], node);
                if(ret === Visitor.BREAK) {
                    return ret;
                } else if(ret === Visitor.SKIP) {
                    continue;
                }
            }
        }
    }

    var Visitor = {
        
        BREAK: 1,
        SKIP: 2,
        
        visit: function visit(dom, callback) {
            if(Array.isArray(dom) && callback && typeof(callback.visitNode) === 'function') {
                this.callback = callback;
                for(var i = 0; i < dom.length; i++) {
                    var ret = visitNode(this.callback, dom[i], null);
                    if(ret === this.BREAK) {
                        return;
                    }
                }    
            }
        },
        
        
    };

    return Visitor;    
});