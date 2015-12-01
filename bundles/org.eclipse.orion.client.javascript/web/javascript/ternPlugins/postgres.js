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
 * Tern type index and templates for PostgreSQL node support
 */
define([
	"tern/lib/infer", 
	"tern/lib/tern", 
	"./resolver"
], /* @callback */ function(infer, tern, resolver) {

	var templates = [
	/* eslint-disable missing-nls */
		{
			prefix: "postgres", 
			name: "postgres", 
			nodes: {top:true, member:false, prop:false},
			description: " - Node.js require statement for Postgres DB", 
			template: "var pg = require('pg');\n"
		},
		{
			prefix: "postgres", 
			name: "postgres client", 
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Postgres DB client", 
			template: "var pg = require('pg');\n" + 
					  "var url = \"postgres://postgres:${port}@${host}/${database}\";\n" +  
					  "var ${client} = new pg.Client(url);\n"
		},
		{
			prefix: "postgres", 
			name: "postgres connect", 
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Postgres DB client and connect", 
			template: "var pg = require('pg');\n" + 
					  "var url = \"postgres://postgres:${port}@${host}/${database}\";\n" +  
					  "var ${client} = new pg.Client(url);\n" + 
					  "${client}.connect(function(error) {\n" +  
					  "\t${cursor}\n" +  
					  "});\n"
		},
		{
			prefix: "postgres", 
			name: "postgres query", 
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Postgres DB query statement", 
			template: "${client}.query(${sql}, function(error, result) {\n" + 
					  "\t${cursor}\n" +  
					  "});\n"
		}
		/* eslint-enable missing-nls */
	];
	
	/**
	 * @description Gets the templates that apply to given context
	 * @param {tern.File} file The backing file object from Tern
	 * @param {Number} wordStart The start of the word to complete
	 * @param {Number} wordEnd The end of the word to complete
	 * @param {Function} gather The collector function to call when wanting to add a proposal
	 * @since 9.0
	 * @callback
	 */
	function getTemplates(file, wordStart, wordEnd, gather) {  //file, start, end, completions) {
		var expr = infer.findExpressionAround(file.ast, wordStart, wordEnd, file.scope);
		var tmps = resolver.getTemplatesForNode(templates, expr);
		if(tmps) {
			tmps.forEach(function(template) {
				gather(template.name, null, 0, function(c) {
					c.prefix = template.prefix;
					c.description = template.description;
					c.template = template.template;
					c.segments = template.segments;
					c.origin = 'postgres'; //$NON-NLS-1$
					c.type = 'template'; //$NON-NLS-1$
				});
			});
	    }
	} 
	
	/* eslint-enable missing-nls */
	tern.registerPlugin("postgres", /* @callback */ function(server, options) { //$NON-NLS-1$
	    return {
	      defs : defs,
	      passes: {
	      	variableCompletion: getTemplates
	      }
	    };
	});
	
	/* eslint-disable missing-nls */
	var defs = {
	  "pg": {
	    "connect": "fn(connection: string, callback: fn(err: Error, client: Client, done: fn()))",
	    "end": "fn()",
	    "ConnectionConfig": {
	      "user": "string",
	      "database": "string",
	      "password": "string",
	      "port": "number",
	      "host": "string"
	    },
	    "Defaults": {
	      "poolSize": "number",
	      "poolIdleTimeout": "number",
	      "reapIntervalMillis": "number",
	      "binary": "bool",
	      "parseInt8": "bool"
	    },
	    "ClientConfig": {
	      "ssl": "bool"
	    },
	    "QueryConfig": {
	      "name": "string",
	      "text": "string",
	      "values": "[?]"
	    },
	    "QueryResult": {
	      "rows": "[?]"
	    },
	    "ResultBuilder": {
	      "command": "string",
	      "rowCount": "number",
	      "oid": "number",
	      "addRow": "fn(row: ?)"
	    },
	    "Client": {
	      "!type": "fn(connection: string)",
	      "prototype": {
	        "connect": "fn(callback?: fn(err: Error))",
	        "end": "fn()",
	        "query": "fn(queryText: string, callback?: fn(err: Error, result: QueryResult)) -> Query",
	        "copyFrom": "fn(queryText: string) -> stream.Writable",
	        "copyTo": "fn(queryText: string) -> stream.Readable",
	        "pauseDrain": "fn()",
	        "resumeDrain": "fn()",
	        "on": "fn(event: string, listener: fn()) -> Client"
	      }
	    },
	    "Query": {
	      "prototype": {
	        "on": "fn(event: string, listener: fn(row: ?, result?: ResultBuilder)) -> Query"
	      }
	    },
	    "Events": {
	      "prototype": {
	        "on": "fn(event: string, listener: fn(err: Error, client: Client)) -> Events"
	      }
	    }
	  },
	  "!name": "pg",
	  "!define": {
	  	"!node": {
	  		"pg": {
	  			"connect": "fn(connection: string, callback: fn(err: Error, client: Client, done: fn()))",
	    		"end": "fn()",
	    		"Client": "pg.Client"
	  		}
	  	}
	  }
	};
});