/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - Allow original requirejs plugin to find files in Orion workspace
 *******************************************************************************/
/* eslint-disable missing-nls */
/*eslint-env node, amd*/
/*globals tern tern*/
define([
	"../lib/infer", 
	"../lib/tern", 
	"./resolver", 
	"javascript/finder"
], function(infer, tern, resolver, Finder) {

	var tags = {
		"abstract": {
			"name": "@abstract",
			"url": "http://usejsdoc.org/tags-abstract.html",
			"desc": "This member must be implemented (or overridden) by the inheritor."
		},
		"access": {
			"name": "@access",
			"url": "http://usejsdoc.org/tags-access.html",
			"desc": "Specify the access level of this member (private, public, or protected)."
		},
		"alias": {
			"name": "@alias",
			"url": "http://usejsdoc.org/tags-alias.html",
			"desc": "Treat a member as if it had a different name."
		},
		"augments": {
			"name": "@augments",
			"url": "http://usejsdoc.org/tags-augments.html",
			"desc": "Indicate that a symbol inherits from, ands adds to, a parent symbol."
		},
		"author": {
			"name": "@author",
			"url": "http://usejsdoc.org/tags-author.html",
			"desc": "Identify the author of an item."
		},
		"borrows": {
			"name": "@borrows",
			"url": "http://usejsdoc.org/tags-borrows.html",
			"desc": "This object uses something from another object."
		},
		"callback": {
			"name": "@callback",
			"url": "http://usejsdoc.org/tags-callback.html",
			"desc": "Document a callback function."
		},
		"class": {
			"name": "@class",
			"url": "http://usejsdoc.org/tags-class.html",
			"desc": "This function is intended to be called with the \"new\" keyword."
		},
		"classdesc": {
			"name": "@classdesc",
			"url": "http://usejsdoc.org/tags-classdesc.html",
			"desc": "Use the following text to describe the entire class."
		},
		"constant": {
			"name": "@constant",
			"url": "http://usejsdoc.org/tags-constant.html",
			"desc": "Document an object as a constant."
		},
		"constructs": {
			"name": "@constructs",
			"url": "http://usejsdoc.org/tags-constructs.html",
			"desc": "This function member will be the constructor for the previous class."
		},
		"copyright": {
			"name": "@copyright",
			"url": "http://usejsdoc.org/tags-copyright.html",
			"desc": "Document some copyright information."
		},
		"default": {
			"name": "@default",
			"url": "http://usejsdoc.org/tags-default.html",
			"desc": "Document the default value."
		},
		"deprecated": {
			"name": "@deprecated",
			"url": "http://usejsdoc.org/tags-deprecated.html",
			"desc": "Document that this is no longer the preferred way."
		},
		"description": {
			"name": "@description",
			"url": "http://usejsdoc.org/tags-description.html",
			"desc": "Describe a symbol."
		},
		"enum": {
			"name": "@enum",
			"url": "http://usejsdoc.org/tags-enum.html",
			"desc": "Document a collection of related properties."
		},
		"event": {
			"name": "@event",
			"url": "http://usejsdoc.org/tags-event.html",
			"desc": "Document an event."
		},
		"example": {
			"name": "@example",
			"url": "http://usejsdoc.org/tags-example.html",
			"desc": "Provide an example of how to use a documented item."
		},
		"exports": {
			"name": "@exports",
			"url": "http://usejsdoc.org/tags-exports.html",
			"desc": "Identify the member that is exported by a JavaScript module."
		},
		"external": {
			"name": "@external",
			"url": "http://usejsdoc.org/tags-external.html",
			"desc": "Identifies an external class, namespace, or module."
		},
		"file": {
			"name": "@file",
			"url": "http://usejsdoc.org/tags-file.html",
			"desc": "Describe a file."
		},
		"fires": {
			"name": "@fires",
			"url": "http://usejsdoc.org/tags-fires.html",
			"desc": "Describe the events this method may fire."
		},
		"function": {
			"name": "@function",
			"url": "http://usejsdoc.org/tags-function.html",
			"desc": "Describe a function or method."
		},
		"global": {
			"name": "@global",
			"url": "http://usejsdoc.org/tags-global.html",
			"desc": "Document a global object."
		},
		"ignore": {
			"name": "@ignore",
			"url": "http://usejsdoc.org/tags-ignore.html",
			"desc": "Omit a symbol from the documentation."
		},
		"implements": {
			"name": "@implements",
			"url": "http://usejsdoc.org/tags-implements.html",
			"desc": "This symbol implements an interface."
		},
		"inheritdoc": {
			"name": "@inheritdoc",
			"url": "http://usejsdoc.org/tags-inheritdoc.html",
			"desc": "Indicate that a symbol should inherit its parent's documentation."
		},
		"inner": {
			"name": "@inner",
			"url": "http://usejsdoc.org/tags-inner.html",
			"desc": "Document an inner object."
		},
		"instance": {
			"name": "@instance",
			"url": "http://usejsdoc.org/tags-instance.html",
			"desc": "Document an instance member."
		},
		"interface": {
			"name": "@interface",
			"url": "http://usejsdoc.org/tags-interface.html",
			"desc": "This symbol is an interface that others can implement."
		},
		"kind": {
			"name": "@kind",
			"url": "http://usejsdoc.org/tags-kind.html",
			"desc": "What kind of symbol is this?"
		},
		"lends": {
			"name": "@lends",
			"url": "http://usejsdoc.org/tags-lends.html",
			"desc": "Document properties on an object literal as if they belonged to a symbol with a given name."
		},
		"license": {
			"name": "@license",
			"url": "http://usejsdoc.org/tags-license.html",
			"desc": "Identify the license that applies to this code."
		},
		"listens": {
			"name": "@listens",
			"url": "http://usejsdoc.org/tags-listens.html",
			"desc": "List the events that a symbol listens for."
		},
		"member": {
			"name": "@member",
			"url": "http://usejsdoc.org/tags-member.html",
			"desc": "Document a member."
		},
		"memberof": {
			"name": "@memberof",
			"url": "http://usejsdoc.org/tags-memberof.html",
			"desc": "This symbol belongs to a parent symbol."
		},
		"mixes": {
			"name": "@mixes",
			"url": "http://usejsdoc.org/tags-mixes.html",
			"desc": "This object mixes in all the members from another object."
		},
		"mixin": {
			"name": "@mixin",
			"url": "http://usejsdoc.org/tags-mixin.html",
			"desc": "Document a mixin object."
		},
		"module": {
			"name": "@module",
			"url": "http://usejsdoc.org/tags-module.html",
			"desc": "Document a JavaScript module."
		},
		"name": {
			"name": "@name",
			"url": "http://usejsdoc.org/tags-name.html",
			"desc": "Document the name of an object."
		},
		"namespace": {
			"name": "@namespace",
			"url": "http://usejsdoc.org/tags-namespace.html",
			"desc": "Document a namespace object."
		},
		"override": {
			"name": "@override",
			"url": "http://usejsdoc.org/tags-override.html",
			"desc": "Indicate that a symbol overrides its parent."
		},
		"param": {
			"name": "@param",
			"url": "http://usejsdoc.org/tags-param.html",
			"desc": "Document the parameter to a function."
		},
		"private": {
			"name": "@private",
			"url": "http://usejsdoc.org/tags-private.html",
			"desc": "This symbol is meant to be private."
		},
		"property": {
			"name": "@property",
			"url": "http://usejsdoc.org/tags-property.html",
			"desc": "Document a property of an object."
		},
		"protected": {
			"name": "@protected",
			"url": "http://usejsdoc.org/tags-protected.html",
			"desc": "This symbol is meant to be protected."
		},
		"public": {
			"name": "@public",
			"url": "http://usejsdoc.org/tags-public.html",
			"desc": "This symbol is meant to be public."
		},
		"readonly": {
			"name": "@readonly",
			"url": "http://usejsdoc.org/tags-readonly.html",
			"desc": "This symbol is meant to be read-only."
		},
		"requires": {
			"name": "@requires",
			"url": "http://usejsdoc.org/tags-requires.html",
			"desc": "This file requires a JavaScript module."
		},
		"returns": {
			"name": "@returns",
			"url": "http://usejsdoc.org/tags-returns.html",
			"desc": "Document the return value of a function."
		},
		"see": {
			"name": "@see",
			"url": "http://usejsdoc.org/tags-see.html",
			"desc": "Refer to some other documentation for more information."
		},
		"since": {
			"name": "@since",
			"url": "http://usejsdoc.org/tags-since.html",
			"desc": "When was this feature added?"
		},
		"static": {
			"name": "@static",
			"url": "http://usejsdoc.org/tags-static.html",
			"desc": "Document a static member."
		},
		"summary": {
			"name": "@summary",
			"url": "http://usejsdoc.org/tags-summary.html",
			"desc": "A shorter version of the full description."
		},
		"this": {
			"name": "@this",
			"url": "http://usejsdoc.org/tags-this.html",
			"desc": "What does the 'this' keyword refer to here?"
		},
		"throws": {
			"name": "@throws",
			"url": "http://usejsdoc.org/tags-throws.html",
			"desc": "Describe what errors could be thrown."
		},
		"todo": {
			"name": "@todo",
			"url": "http://usejsdoc.org/tags-todo.html",
			"desc": "Document tasks to be completed."
		},
		"tutorial": {
			"name": "@tutorial",
			"url": "http://usejsdoc.org/tags-tutorial.html",
			"desc": "Insert a link to an included tutorial file."
		},
		"type": {
			"name": "@type",
			"url": "http://usejsdoc.org/tags-type.html",
			"desc": "Document the type of an object."
		},
		"typedef": {
			"name": "@typedef",
			"url": "http://usejsdoc.org/tags-typedef.html",
			"desc": "Document a custom type."
		},
		"variation": {
			"name": "@variation",
			"url": "http://usejsdoc.org/tags-variation.html",
			"desc": "Distinguish different objects with the same name."
		},
		"version": {
			"name": "@version",
			"url": "http://usejsdoc.org/tags-version.html",
			"desc": "Documents the version number of an item."
		},
		"link": {
			"name": "{@link}",
			"url": "http://usejsdoc.org/tags-inline-link.html",
			"desc": "Link to another item in the documentation."
		},
		"inline-tutorial": {
			"name": "{@tutorial}",
			"url": "http://usejsdoc.org/tags-inline-tutorial.html",
			"desc": "Link to a tutorial."
		}
	};

	
	var templates = {
	
	}
	
	tern.registerPlugin("jsdoc", function(server, options) {
		return {
     		passes: {
		     /* 	typeAt: function(file, query) {
		      		console.log(JSON.stringify(query));
		      		return null;
		      	},
		      	completion: function(file, pos, expr, type) {
		      		console.log(pos);
		      		return null;
		      	} */
      		}
    	};
	});
	
	
});