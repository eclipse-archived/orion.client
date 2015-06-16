/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node, amd*/
/*globals infer tern resolver*/
/**
 * Tern type index and templates for ExpressJS node support
 */
(function(mod) {
  if (typeof exports === "object" && typeof module === "object") // CommonJS
    return mod(require("../lib/infer"), require("../lib/tern"), require);
  if (typeof define === "function" && define.amd) // AMD
    return define(["../lib/infer", "../lib/tern", './resolver'], mod);
  mod(infer, tern, resolver);
})(/* @callback */ function(infer, tern, resolver) {

	var templates = [
		{
			prefix: "express", //$NON-NLS-0$
			name: "express", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - Node.js require statement for Express", //$NON-NLS-0$
			template: "var ${name} = require('express');" //$NON-NLS-0$
		},
		{
			prefix: "express", //$NON-NLS-0$
			name: "express app", //$NON-NLS-0$
			description: " - create a new Express app", //$NON-NLS-0$
			template: "var express = require('express');\n" + //$NON-NLS-0$
					  "var ${app} = express();\n" +  //$NON-NLS-0$
					  "${cursor}\n"+  //$NON-NLS-0$
					  "app.listen(${timeout});\n"  //$NON-NLS-0$
		},
		{
			prefix: "express", //$NON-NLS-0$
			name: "express configure", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create an Express app configure statement", //$NON-NLS-0$
			template: "app.configure(function() {\n" +  //$NON-NLS-0$
  					  "\tapp.set(${id}, ${value});\n" +  //$NON-NLS-0$
					  "});"  //$NON-NLS-0$
		},
		{
			prefix: "express", //$NON-NLS-0$
			name: "express specific configure", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a specific Express app configure statement", //$NON-NLS-0$
			template: "app.configure(${name}, function() {\n" +  //$NON-NLS-0$
  					  "\tapp.set(${id}, ${value});\n" +  //$NON-NLS-0$
					  "});"  //$NON-NLS-0$
		},
		{
			prefix: "express", //$NON-NLS-0$
			name: "express app get", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Express app.get call", //$NON-NLS-0$
			template: "var value = app.get(${id}, function(request, result){\n" + //$NON-NLS-0$
					  "\t${cursor}\n});\n"  //$NON-NLS-0$
		},
		{
			prefix: "express", //$NON-NLS-0$
			name: "express app set", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Express app set call", //$NON-NLS-0$
			template: "app.set(${id}, ${value});\n"  //$NON-NLS-0$
		},
		{
			prefix: "express", //$NON-NLS-0$
			name: "express app use", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Express app use statement", //$NON-NLS-0$
			template: "app.use(${fnOrObject});\n" //$NON-NLS-0$
		},
		{
			prefix: "express", //$NON-NLS-0$
			name: "express app engine", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Express app engine statement", //$NON-NLS-0$
			template: "app.engine(${fnOrObject});\n" //$NON-NLS-0$
		},
		{
		    prefix: "express", //$NON-NLS-0$
			name: "express app param", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Express app param statement", //$NON-NLS-0$
			template: "app.param(${id}, ${value});\n" //$NON-NLS-0$
		},
		{
			prefix: "express", //$NON-NLS-0$
			name: "express app error use", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Express app error handling use statement", //$NON-NLS-0$
			template: "app.use(function(error, request, result, next) {\n" +  //$NON-NLS-0$
  					  "\tresult.send(${code}, ${message});\n" +  //$NON-NLS-0$
					  "});\n" //$NON-NLS-0$
		}
	];
	
	/**
	 * @description Gets the templates that apply to given context
	 * @since 9.0
	 * @callback
	 */
	function getTemplates(file, query, completions) {
		var wordEnd = tern.resolvePos(file, query.end);
		var expr = infer.findExpressionAround(file.ast, null, wordEnd, file.scope);
		var tmps = resolver.getTemplatesForNode(templates, expr);
		if(tmps && tmps.length > 0) {
			for (var i = 0; i < tmps.length; i++) {
				var _t = tmps[i];
				_t.origin = 'express'; //$NON-NLS-1$
				_t.type = 'template'; //$NON-NLS-1$
				completions.push(_t);
			}
	    }
	}
	
	/* eslint-enable missing-nls */
	tern.registerPlugin("orionExpress", /* @callback */ function(server, options) { //$NON-NLS-1$
	    return {
	      defs : defs,
	      passes: {
	      	completion: getTemplates
	      }
	    };
	});
	
	/* eslint-disable missing-nls */
	var defs = {
	  "express": {
	    "IRoute": {
	      "path": "string",
	      "stack": "?",
	      "all": "fn(handler: [RequestHandler]) -> IRoute",
	      "get": "fn(handler: [RequestHandler]) -> IRoute",
	      "post": "fn(handler: [RequestHandler]) -> IRoute",
	      "put": "fn(handler: [RequestHandler]) -> IRoute",
	      "delete": "fn(handler: [RequestHandler]) -> IRoute",
	      "patch": "fn(handler: [RequestHandler]) -> IRoute",
	      "options": "fn(handler: [RequestHandler]) -> IRoute"
	    },
	    "Router": {
	      "!type": "fn(options?: ?) -> Router",
	      "prototype": {
		      "param": "fn(name: string, handler: RequestParamHandler) -> T",
		      "all": "?",
		      "get": "?",
		      "post": "?",
		      "put": "?",
		      "delete": "?",
		      "patch": "?",
		      "options": "?",
		      "route": "fn(path: string) -> IRoute",
		      "use": "fn(handler: [RequestHandler]) -> T"
		    }
	    },
	    "CookieOptions": {
	      "maxAge": "number",
	      "signed": "bool",
	      "expires": "Date",
	      "httpOnly": "bool",
	      "path": "string",
	      "domain": "string",
	      "secure": "bool"
	    },
	    "Errback": {},
	    "Request": {
	      "get": "fn(name: string) -> string",
	      "header": "fn(name: string) -> string",
	      "headers": {},
	      "accepts": "fn(type: string) -> string",
	      "acceptsCharset": "fn(charset: string) -> bool",
	      "acceptsLanguage": "fn(lang: string) -> bool",
	      "range": "fn(size: number) -> [?]",
	      "accepted": "[MediaType]",
	      "acceptedLanguages": "[?]",
	      "acceptedCharsets": "[?]",
	      "param": "fn(name: string, defaultValue?: ?) -> string",
	      "is": "fn(type: string) -> bool",
	      "protocol": "string",
	      "secure": "bool",
	      "ip": "string",
	      "ips": "[string]",
	      "subdomains": "[string]",
	      "path": "string",
	      "hostname": "string",
	      "host": "string",
	      "fresh": "bool",
	      "stale": "bool",
	      "xhr": "bool",
	      "body": "?",
	      "cookies": "?",
	      "method": "string",
	      "params": "?",
	      "user": "?",
	      "authenticatedUser": "?",
	      "files": "?",
	      "clearCookie": "fn(name: string, options?: ?) -> Response",
	      "query": "?",
	      "route": "?",
	      "signedCookies": "?",
	      "originalUrl": "string",
	      "url": "string"
	    },
	    "MediaType": {
	      "value": "string",
	      "quality": "number",
	      "type": "string",
	      "subtype": "string"
	    },
	    "Send": {},
	    "Response": {
	      "status": "fn(code: number) -> Response",
	      "sendStatus": "fn(code: number) -> Response",
	      "links": "fn(links: ?) -> Response",
	      "send": "Send",
	      "json": "Send",
	      "jsonp": "Send",
	      "sendFile": "fn(path: string)",
	      "sendfile": "fn(path: string)",
	      "download": "fn(path: string)",
	      "contentType": "fn(type: string) -> Response",
	      "type": "fn(type: string) -> Response",
	      "format": "fn(obj: ?) -> Response",
	      "attachment": "fn(filename?: string) -> Response",
	      "set": "fn(field: ?) -> Response",
	      "header": "fn(field: ?) -> Response",
	      "headersSent": "bool",
	      "get": "fn(field: string) -> string",
	      "clearCookie": "fn(name: string, options?: ?) -> Response",
	      "cookie": "fn(name: string, val: string, options: CookieOptions) -> Response",
	      "location": "fn(url: string) -> Response",
	      "redirect": "fn(url: string)",
	      "render": "fn(view: string, options?: Object, callback?: fn(err: Error, html: string))",
	      "locals": "?",
	      "charset": "string"
	    },
	    "ErrorRequestHandler": {},
	    "RequestHandler": {},
	    "Handler": {},
	    "RequestParamHandler": {},
	    "Application": {
	      "init": "fn()",
	      "defaultConfiguration": "fn()",
	      "engine": "fn(ext: string, fn: Function) -> Application",
	      "set": "fn(setting: string, val: ?) -> Application",
	      "get": {},
	      "path": "fn() -> string",
	      "enabled": "fn(setting: string) -> bool",
	      "disabled": "fn(setting: string) -> bool",
	      "enable": "fn(setting: string) -> Application",
	      "disable": "fn(setting: string) -> Application",
	      "configure": "fn(fn: Function) -> Application",
	      "render": "fn(name: string, options?: Object, callback?: fn(err: Error, html: string))",
	      "listen": "fn(port: number, hostname: string, backlog: number, callback?: Function) -> http.Server",
	      "route": "fn(path: string) -> IRoute",
	      "router": "string",
	      "settings": "?",
	      "resource": "?",
	      "map": "?",
	      "locals": "?",
	      "routes": "?"
	    },
	    "Express": {
	      "version": "string",
	      "mime": "string",
	      "createApplication": "fn() -> Application",
	      "createServer": "fn() -> Application",
	      "application": "?",
	      "request": "Request",
	      "response": "Response"
	    },
	    "static": "fn(root: string, options?: ?) -> RequestHandler"
	  },
	  "!name": "express",
	  "!define": {
	  	"!node": {
	        express: {
	          "!type": "fn() -> express.Application",
	          "!url": "http://expressjs.com",
	          "!doc": "Creates an express application.",
	          Router: {
	            "!type": "fn(options?: express.RouterOptions) -> +express.Router"
	          }
	        }
	      }
	  }
	};
});