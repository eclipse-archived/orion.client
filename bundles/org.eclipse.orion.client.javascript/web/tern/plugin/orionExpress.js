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
	
	/* eslint-disable missing-nls */
	var defs = {
	  "!name": "express",
	  "!define": {
	    "View.prototype": {
	      "lookup": {
	        "!type": "fn(name: string) -> string",
	        "!doc": "* Lookup view by the given `name` * @param {String} name @return {String} @api private"
	      },
	      "render": {
	        "!type": "fn(options: ?, fn: +Function)",
	        "!doc": "* Render with the given `options` and callback `fn(err, str)`."
	      },
	      "resolve": {
	        "!type": "fn(dir: string, file: string)",
	        "!doc": "* Resolve the file within the given directory."
	      }
	    },
	    "View.prototype.lookup.!0": "string",
	    "View.prototype.lookup.!ret": "string",
	    "View.prototype.resolve.!0": "string",
	    "View.prototype.resolve.!1": "string",
	    "View.!0": "string",
	    "slice.!0": "number",
	    "slice.!1": "number",
	    "app.use.!0": "string",
	    "app.engine.!0": "string",
	    "app.set.!0": "string",
	    "app.path.!ret": "string",
	    "app.enabled.!0": "string",
	    "app.enabled.!ret": "bool",
	    "app.disabled.!0": "string",
	    "app.disabled.!ret": "bool",
	    "app.enable.!0": "string",
	    "app.disable.!0": "string",
	    "app.all.!0": "string",
	    "app.render.!0": "string",
	    "app.etag.!ret": "string",
	    "app.wetag.!ret": "string",
	    "app.isAbsolute.!0": "string",
	    "app.isAbsolute.!ret": "bool",
	    "app.flatten.!0": "[?]",
	    "app.flatten.!1": "[?]",
	    "app.flatten.!ret": "[?]",
	    "app.normalizeType.!0": "string",
	    "app.normalizeType.!ret": {
	      "value": "string",
	      "quality": "number",
	      "params": {
	        "<i>": "string"
	      }
	    },
	    "app.normalizeTypes.!0": "[?]",
	    "app.normalizeTypes.!ret": "[acceptParams.!ret]",
	    "app.compileTrust.!0": "[?]",
	    "app.setCharset.!0": "string",
	    "app.setCharset.!1": "string",
	    "app.setCharset.!ret": "string",
	    "app.application.param.!0": "string",
	    "app.application.use.!0": "string",
	    "app.application.route.!0": "string",
	    "app.request.acceptsEncodings.!ret": "bool",
	    "app.request.acceptsCharsets.!ret": "bool",
	    "app.request.acceptsLanguages.!ret": "bool",
	    "app.request.range.!0": "number",
	    "app.request.param.!0": "string",
	    "app.request.param.!1": "string",
	    "app.request.param.!ret": "string",
	    "app.request.response.status.!0": "number",
	    "app.request.response.send.!0": "string",
	    "app.request.response.sendStatus.!0": "number",
	    "app.request.response.attachment.!0": "string",
	    "app.request.response.append.!0": "string",
	    "app.request.response.header.!1": "string",
	    "app.request.response.get.!0": "string",
	    "app.request.response.get.!ret": "string",
	    "app.request.response.clearCookie.!0": "string",
	    "app.request.response.cookie.!0": "string",
	    "app.request.response.cookie.!1": "string",
	    "app.request.response.location.!0": "string",
	    "app.request.Route.prototype._handles_method.!0": "string",
	    "app.request.Route.prototype._handles_method.!ret": "bool",
	    "app.request.Route.!0": "string",
	    "app.response.status.!0": "number",
	    "app.response.send.!0": "string",
	    "app.response.sendStatus.!0": "number",
	    "app.response.attachment.!0": "string",
	    "app.response.append.!0": "string",
	    "app.response.header.!1": "string",
	    "app.response.get.!0": "string",
	    "app.response.get.!ret": "string",
	    "app.response.clearCookie.!0": "string",
	    "app.response.cookie.!0": "string",
	    "app.response.cookie.!1": "string",
	    "app.response.location.!0": "string",
	    "app.Route.prototype._handles_method.!0": "string",
	    "app.Route.prototype._handles_method.!ret": "bool",
	    "app.Route.!0": "string",
	    "req.acceptsEncodings.!ret": "bool",
	    "req.acceptsCharsets.!ret": "bool",
	    "req.acceptsLanguages.!ret": "bool",
	    "req.range.!0": "number",
	    "req.range.!ret": "[?]",
	    "req.param.!0": "string",
	    "req.param.!1": "string",
	    "req.param.!ret": "string",
	    "req.is.!0": "[?]",
	    "defineGetter.!1": "string",
	    "res.status.!0": "number",
	    "res.send.!0": "string",
	    "res.sendStatus.!0": "number",
	    "res.attachment.!0": "string",
	    "res.append.!0": "string",
	    "res.append.!1": {
	      "!type": "[?]",
	      "!doc": "concat the new and prev vals"
	    },
	    "res.header.!1": "string",
	    "res.get.!0": "string",
	    "res.get.!ret": "string",
	    "res.clearCookie.!0": "string",
	    "res.cookie.!0": "string",
	    "res.cookie.!1": "string",
	    "res.location.!0": "string",
	    "res.render.!1": {},
	    "sendfile.!3": "fn(err: +Error)",
	    "acceptParams.!0": "string",
	    "acceptParams.!ret": {
	      "value": "string",
	      "quality": "number",
	      "params": {
	        "<i>": "string"
	      }
	    },
	    "tryStat.!0": "string",
	    "proto.param": {
	      "!type": "fn(name: string, fn: +Function) -> !this",
	      "!doc": "* Map the given param placeholder `name`(s) to the given callback."
	    },
	    "proto.param.!0": "string",
	    "proto.handle": {
	      "!type": "fn(req: ?, res: ?, done: fn(err: ?))",
	      "!doc": "* Dispatch a req, res into the router."
	    },
	    "proto.process_params": {
	      "!type": "fn(layer: ?, called: ?, req: ?, res: ?, done: ?)",
	      "!doc": "* Process any parameters for the layer."
	    },
	    "proto.use": {
	      "!type": "fn(fn: ?) -> !this",
	      "!doc": "* Use the given middleware function, with optional path, defaulting to \"/\"."
	    },
	    "proto.use.!0": "string",
	    "proto.route": {
	      "!type": "fn(path: string) -> proto.route.!ret",
	      "!doc": "* Create a new Route for the given path."
	    },
	    "proto.route.!0": "string",
	    "proto.route.!ret": {
	      "path": "string",
	      "stack": "Route.stack"
	    },
	    "proto.<i>": "fn(path: ?) -> !this",
	    "proto.!ret": "fn(req: ?, res: ?, next: ?)",
	    "proto.!ret._params": "[?]",
	    "proto.!ret.stack": "[?]",
	    "Route.prototype": {
	      "_handles_method": {
	        "!type": "fn(method: string) -> bool",
	        "!doc": "* @api private"
	      },
	      "_options": {
	        "!type": "fn() -> [string]",
	        "!doc": "* @return {Array} supported HTTP methods @api private"
	      },
	      "dispatch": {
	        "!type": "fn(req: ?, res: ?, done: ?)",
	        "!doc": "* dispatch req, res into this route * @api private"
	      },
	      "all": {
	        "!type": "fn() -> !this",
	        "!doc": "* Add a handler for all HTTP verbs to this route."
	      },
	      "<i>": "fn() -> !this"
	    },
	    "Route.prototype._handles_method.!0": "string",
	    "Route.prototype._handles_method.!ret": "bool",
	    "Route.!0": "string",
	    "Layer.prototype": {
	      "handle_error": {
	        "!type": "fn(error: +Error, req: ?, res: ?, next: ?)",
	        "!doc": "* Handle the error for the layer."
	      },
	      "handle_request": {
	        "!type": "fn(req: ?, res: ?, next: ?)",
	        "!doc": "* Handle the request for the layer."
	      },
	      "match": {
	        "!type": "fn(path: string) -> bool",
	        "!doc": "* Check if this route matches `path`, if so populate `.params`."
	      }
	    },
	    "Layer.prototype.match.!0": "string",
	    "Layer.prototype.match.!ret": "bool",
	    "Layer.!0": "string",
	    "Layer.!ret": "+Layer",
	    "toString.!ret": "string",
	    "appendMethods.!0": {
	      "!type": "[?]",
	      "!doc": "store options for OPTIONS request only used if OPTIONS request"
	    },
	    "gettype.!ret": "string",
	    "matchLayer.!0": {
	      "name": "string",
	      "route": "+Route",
	      "handle": "Layer.handle",
	      "keys": "Layer.keys"
	    },
	    "matchLayer.!1": "string",
	    "restore.!0": "fn(err: ?)",
	    "wrap.!1": "fn(old: ?, err: ?)",
	    "wrap.!ret": "fn()",
	    "hasOwnProperty.!0": "string",
	    "hasOwnProperty.!ret": "bool",
	    "decode_param.!0": "string",
	    "decode_param.!ret": "string",
	    "Route.path": "string",
	    "Route.stack": "[?]",
	    "Layer.handle": "fn(req: ?, res: ?, done: ?)",
	    "Layer.name": "string",
	    "Layer.params": {
	      "!doc": "store values"
	    },
	    "Layer.path": "string",
	    "Layer.keys": "[?]",
	    "Layer.route": "+Route",
	    "app.application.!ret": {
	      "_params": "proto.!ret._params",
	      "stack": "proto.!ret.stack"
	    }
	  },
	  "View": {
	    "!type": "fn(name: string, options: ?)",
	    "!doc": "* Initialize a new `View` with the given `name`."
	  },
	  "slice": "fn(from: number, to?: number) -> !this",
	  "app": {
	    "init": {
	      "!type": "fn(app: +Function)",
	      "!doc": "* Initialize the server."
	    },
	    "defaultConfiguration": {
	      "!type": "fn()",
	      "!doc": "* Initialize application configuration."
	    },
	    "lazyrouter": {
	      "!type": "fn()",
	      "!doc": "* lazily adds the base router if it has not yet been added."
	    },
	    "handle": {
	      "!type": "fn(req: ?, res: ?, done: ?)",
	      "!doc": "* Dispatch a req, res pair into the application."
	    },
	    "use": {
	      "!type": "fn(fn: ?) -> !this",
	      "!doc": "* Proxy `Router#use()` to add middleware to the app router."
	    },
	    "route": {
	      "!type": "fn(path: ?)",
	      "!doc": "* Proxy to the app `Router#route()` Returns a new `Route` instance for the _path_."
	    },
	    "engine": {
	      "!type": "fn(ext: string, fn: +Function) -> !this",
	      "!doc": "* Register the given template engine callback `fn` as `ext`."
	    },
	    "param": {
	      "!type": "fn(name: ?, fn: +Function) -> !this",
	      "!doc": "* Proxy to `Router#param()` with one added api feature."
	    },
	    "set": {
	      "!type": "fn(setting: string, val: ?) -> !this.settings.<i>",
	      "!doc": "* Assign `setting` to `val`, or return `setting`'s value."
	    },
	    "path": {
	      "!type": "fn() -> string",
	      "!doc": "* Return the app's absolute pathname based on the parent(s) that have mounted it."
	    },
	    "enabled": {
	      "!type": "fn(setting: string) -> bool",
	      "!doc": "* Check if `setting` is enabled (truthy)."
	    },
	    "disabled": {
	      "!type": "fn(setting: string) -> bool",
	      "!doc": "* Check if `setting` is disabled."
	    },
	    "enable": {
	      "!type": "fn(setting: string) -> app",
	      "!doc": "* Enable `setting`."
	    },
	    "disable": {
	      "!type": "fn(setting: string) -> app",
	      "!doc": "* Disable `setting`."
	    },
	    "<i>": "fn(path: ?) -> !this",
	    "all": {
	      "!type": "fn(path: string) -> !this",
	      "!doc": "* Special-cased \"all\" method, applying the given route `path`, middleware, and callback to _every_ HTTP method."
	    },
	    "render": {
	      "!type": "fn(name: string, options: ?, fn: +Function)",
	      "!doc": "* Render the given view `name` name with `options` and a callback accepting an error and the rendered template string."
	    },
	    "listen": {
	      "!type": "fn()",
	      "!doc": "* Listen for connections."
	    },
	    "etag": "fn(body: ?, encoding: ?) -> string",
	    "wetag": "fn(body: ?, encoding: ?) -> string",
	    "isAbsolute": "fn(path: string) -> bool",
	    "flatten": "fn(arr: [?], ret: [?]) -> [!0.<i>]",
	    "normalizeType": "fn(type: string) -> acceptParams.!ret",
	    "normalizeTypes": "fn(types: [?]) -> [acceptParams.!ret]",
	    "compileETag": "fn(val: ?) -> !0",
	    "compileQueryParser": "fn(val: ?) -> !0",
	    "compileTrust": "fn(val: ?) -> !0",
	    "setCharset": "fn(type: string, charset: string) -> !0",
	    "application": {
	      "param": {},
	      "use": {},
	      "route": {},
	      "handle": "proto.handle",
	      "process_params": "proto.process_params",
	      "<i>": "proto.<i>"
	    },
	    "request": {
	      "acceptsEncodings": {},
	      "acceptsCharsets": {},
	      "acceptsLanguages": {},
	      "range": {},
	      "param": {},
	      "response": {
	        "status": {},
	        "send": {},
	        "sendStatus": {},
	        "attachment": {},
	        "append": {},
	        "header": {},
	        "get": {},
	        "clearCookie": {},
	        "cookie": {},
	        "location": {},
	        "contentType": "res.type",
	        "set": "res.header",
	        "links": "res.links",
	        "json": "res.json",
	        "jsonp": "res.jsonp",
	        "sendFile": "res.sendFile",
	        "sendfile": "res.sendfile",
	        "download": "res.download",
	        "type": "res.type",
	        "format": "res.format",
	        "redirect": "res.redirect",
	        "vary": "res.vary",
	        "render": "res.render"
	      },
	      "Route": {
	        "prototype": {
	          "_handles_method": {},
	          "_options": "Route.prototype._options",
	          "dispatch": "Route.prototype.dispatch",
	          "all": "Route.prototype.all",
	          "<i>": "Route.prototype.<i>"
	        }
	      },
	      "init": "app.init",
	      "get": "req.header",
	      "etag": "app.etag",
	      "wetag": "app.wetag",
	      "isAbsolute": "app.isAbsolute",
	      "flatten": "app.flatten",
	      "normalizeType": "app.normalizeType",
	      "normalizeTypes": "app.normalizeTypes",
	      "compileETag": "app.compileETag",
	      "compileQueryParser": "app.compileQueryParser",
	      "compileTrust": "app.compileTrust",
	      "setCharset": "app.setCharset",
	      "application": "proto",
	      "request": "req",
	      "header": "req.header",
	      "accepts": "req.accepts",
	      "is": "req.is"
	    },
	    "response": {
	      "status": {},
	      "send": {},
	      "sendStatus": {},
	      "attachment": {},
	      "append": {},
	      "header": {},
	      "get": {},
	      "clearCookie": {},
	      "cookie": {},
	      "location": {},
	      "contentType": "res.type",
	      "set": "res.header",
	      "links": "res.links",
	      "json": "res.json",
	      "jsonp": "res.jsonp",
	      "sendFile": "res.sendFile",
	      "sendfile": "res.sendfile",
	      "download": "res.download",
	      "type": "res.type",
	      "format": "res.format",
	      "redirect": "res.redirect",
	      "vary": "res.vary",
	      "render": "res.render"
	    },
	    "Route": {
	      "prototype": {
	        "_handles_method": {},
	        "_options": "Route.prototype._options",
	        "dispatch": "Route.prototype.dispatch",
	        "all": "Route.prototype.all",
	        "<i>": "Route.prototype.<i>"
	      }
	    },
	    "!doc": "* Application prototype."
	  },
	  "trustProxyDefaultSymbol": {
	    "!type": "string",
	    "!doc": "* Variable for trust proxy inheritance back-compat @api private"
	  },
	  "logerror": {
	    "!type": "fn(err: +Error)",
	    "!doc": "* Log error using console.error."
	  },
	  "req": {
	    "header": "fn(name: ?) -> !this.headers.referrer",
	    "accepts": "fn()",
	    "acceptsEncodings": {
	      "!type": "fn() -> bool",
	      "!doc": "* Check if the given `encoding`s are accepted."
	    },
	    "acceptsCharsets": {
	      "!type": "fn() -> bool",
	      "!doc": "* Check if the given `charset`s are acceptable, otherwise you should respond with 406 \"Not Acceptable\"."
	    },
	    "acceptsLanguages": {
	      "!type": "fn() -> bool",
	      "!doc": "* Check if the given `lang`s are acceptable, otherwise you should respond with 406 \"Not Acceptable\"."
	    },
	    "range": {
	      "!type": "fn(size: number) -> [?]",
	      "!doc": "* Parse Range header field, capping to the given `size`."
	    },
	    "param": {
	      "!type": "fn(name: string, defaultValue: ?) -> !this.params.<i>",
	      "!doc": "* Return the value of param `name` when present or `defaultValue`."
	    },
	    "is": "fn(types: [?])",
	    "!doc": "* Request prototype.",
	    "init": "app.init",
	    "get": "req.header",
	    "etag": "app.etag",
	    "wetag": "app.wetag",
	    "isAbsolute": "app.isAbsolute",
	    "flatten": "app.flatten",
	    "normalizeType": "app.normalizeType",
	    "normalizeTypes": "app.normalizeTypes",
	    "compileETag": "app.compileETag",
	    "compileQueryParser": "app.compileQueryParser",
	    "compileTrust": "app.compileTrust",
	    "setCharset": "app.setCharset",
	    "application": "proto",
	    "request": "req",
	    "response": "res",
	    "Route": "Route"
	  },
	  "defineGetter": {
	    "!type": "fn(obj: req, name: string, getter: ?)",
	    "!doc": "* Helper function for creating a getter on an object."
	  },
	  "res": {
	    "status": {
	      "!type": "fn(code: number) -> !this",
	      "!doc": "* Set status `code`."
	    },
	    "links": {
	      "!type": "fn(links: ?)",
	      "!doc": "* Set Link header field with the given `links`."
	    },
	    "send": {
	      "!type": "fn(body: ?) -> !this",
	      "!doc": "* Send a response."
	    },
	    "json": {
	      "!type": "fn(obj: ?)",
	      "!doc": "* Send JSON response."
	    },
	    "jsonp": {
	      "!type": "fn(obj: ?)",
	      "!doc": "* Send JSON response with JSONP callback support."
	    },
	    "sendStatus": {
	      "!type": "fn(statusCode: number)",
	      "!doc": "* Send given HTTP status code."
	    },
	    "sendFile": {
	      "!type": "fn(path: ?, options: ?, fn: ?)",
	      "!doc": "* Transfer the file at the given `path`."
	    },
	    "sendfile": {
	      "!type": "fn(path: ?, options: ?, fn: ?)",
	      "!doc": "* Transfer the file at the given `path`."
	    },
	    "download": {
	      "!type": "fn(path: ?, filename: ?, fn: ?)",
	      "!doc": "* Transfer the file at the given `path` as an attachment."
	    },
	    "type": "fn(type: ?)",
	    "format": {
	      "!type": "fn(obj: ?) -> !this",
	      "!doc": "* Respond to the Acceptable formats using an `obj` of mime-type callbacks."
	    },
	    "attachment": {
	      "!type": "fn(filename: string) -> !this",
	      "!doc": "* Set _Content-Disposition_ header to _attachment_ with optional `filename`."
	    },
	    "append": {
	      "!type": "fn(field: string, val: ?)",
	      "!doc": "* Append additional header `field` with value `val`."
	    },
	    "header": "fn(field: ?, val: string) -> !this",
	    "get": {
	      "!type": "fn(field: string) -> string",
	      "!doc": "* Get value for header `field`."
	    },
	    "clearCookie": {
	      "!type": "fn(name: string, options: ?)",
	      "!doc": "* Clear cookie `name`."
	    },
	    "cookie": {
	      "!type": "fn(name: string, val: string, options: ?) -> !this",
	      "!doc": "* Set cookie `name` to `val`, with the given `options`."
	    },
	    "location": {
	      "!type": "fn(url: string) -> !this",
	      "!doc": "* Set the location header to `url`."
	    },
	    "redirect": {
	      "!type": "fn(url: ?)",
	      "!doc": "* Redirect to the given `url` with optional response `status` defaulting to 302."
	    },
	    "vary": {
	      "!type": "fn(field: ?) -> !this",
	      "!doc": "* Add `field` to Vary."
	    },
	    "render": {
	      "!type": "fn(view: ?, options: res.render.!1, fn: ?)",
	      "!doc": "* Render `view` with the given `options` and optional callback `fn`."
	    },
	    "!doc": "* Response prototype.",
	    "contentType": "res.type",
	    "set": "res.header"
	  },
	  "sendfile": {
	    "!type": "fn(res: ?, file: ?, options: ?, callback: fn(err: +Error))",
	    "!doc": "pipe the send file stream"
	  },
	  "acceptParams": {
	    "!type": "fn(str: string, index: ?) -> acceptParams.!ret",
	    "!doc": "* Parse accept params `str` returning an object with `.value`, `.quality` and `.params`."
	  },
	  "newObject": {
	    "!type": "fn() -> ?",
	    "!doc": "* Return new empty object."
	  },
	  "tryStat": {
	    "!type": "fn(path: string)",
	    "!doc": "* Return a stat, maybe."
	  },
	  "proto": {
	    "!type": "fn(options: ?) -> fn(req: ?, res: ?, next: ?)",
	    "!doc": "* Initialize a new `Router` with the given `options`."
	  },
	  "Route": {
	    "!type": "fn(path: string)",
	    "!doc": "* Initialize `Route` with the given `path`, * @param {String} path @api private"
	  },
	  "createApplication": {
	    "!type": "fn()",
	    "!doc": "* Create an express application."
	  },
	  "Layer": "fn(path: string, options: ?, fn: fn(req: ?, res: ?, done: ?)) -> +Layer",
	  "objectRegExp": {
	    "!type": "+RegExp",
	    "!doc": "* Module variables."
	  },
	  "toString": "fn() -> string",
	  "appendMethods": {
	    "!type": "fn(list: [?], addition: ?)",
	    "!doc": "append methods to a list of methods"
	  },
	  "getPathname": {
	    "!type": "fn(req: ?)",
	    "!doc": "get pathname of request"
	  },
	  "gettype": {
	    "!type": "fn(obj: ?) -> string",
	    "!doc": "get type for error message"
	  },
	  "matchLayer": {
	    "!type": "fn(layer: matchLayer.!0, path: string) -> +Error",
	    "!doc": "* Match path to a layer."
	  },
	  "mergeParams": {
	    "!type": "fn(params: ?, parent: ?) -> !0",
	    "!doc": "merge params with parent params"
	  },
	  "restore": {
	    "!type": "fn(fn: fn(err: ?), obj: ?) -> fn(err: ?)",
	    "!doc": "restore obj props after function"
	  },
	  "sendOptionsResponse": {
	    "!type": "fn(res: ?, options: [?], next: ?)",
	    "!doc": "send an OPTIONS response"
	  },
	  "wrap": {
	    "!type": "fn(old: fn(err: ?), fn: fn(old: ?, err: ?)) -> fn()",
	    "!doc": "wrap a function"
	  },
	  "hasOwnProperty": {
	    "!type": "fn(prop: string) -> bool",
	    "!doc": "* Module variables."
	  },
	  "decode_param": {
	    "!type": "fn(val: string) -> !0",
	    "!doc": "* Decode param value."
	  },
	  "Error": {
	    "status": "number",
	    "code": "string"
	  }
	};
	
	/* eslint-enable missing-nls */
	tern.registerPlugin("orionExpress", /* @callback */ function(server, options) { //$NON-NLS-1$
	    return {
	      defs : defs,
	      passes: {
	      	completion: getTemplates
	      }
	    };
	});
});