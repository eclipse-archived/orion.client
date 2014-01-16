/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - Initial API and implementation
 ******************************************************************************/
 /*global define */
define('javascript/contentAssist/indexFiles/expressIndex', [], 
function () {
	return {
  		"!name": "express",
  			"!define": {
      		"express": {
        		"createServer": "fn() -> Application",
		        "application": "Object",
		        "request": "Object",
		        "response": "Object",
		        "Route": "fn(method: String, path: String, callbacks: [fn()], options: Object)",
		        "Router": "fn(options: Object)",
		        "!type": "fn()"
      		},
      		"Route": {
  				"prototype": {
    				"match": {
      					"!type": "fn(path: String) -> Boolean"
			    	}
  				},
  				"!proto" : "Object",
  				"!type": "fn(method: String, path: String, callbacks: [fn()], options: Object)"
			},
			"Router": {
  				"prototype": {
    				"param": {
				     	"!type": "fn(name: String, fn: fn()) -> Object"
					},
				    "matchRequest": {
				      "!type": "fn(req: IncomingMessage, i: number, head: String) -> Route"
				    },
				    "match": {
				      "!type": "fn(method: String, url: String, i: number, head: String) -> Route"
				    },
				    "route": {
				      "!type": "fn(method: String, path: String, callbacks: fn()) -> Router"
				    },
				    "all": {
				      "!type": "fn(path: String) -> Router"
				    }
			  	},
			  	"!proto" : "Object",
			  	"!type": "fn(options: Object)"
			},
      		"application": {
      			"!proto" : "Object",
		        "init": {
		          "!type": "fn()"
		        },
		        "defaultConfiguration": {
		          "!type": "fn()"
		        },
		        "use": {
		          "!type": "fn(route: String, fn: fn()) -> Object"
		        },
		        "engine": {
		          "!type": "fn(ext: String, fn: fn()) -> Object"
		        },
		        "param": {
		          "!type": "fn(name: String, fn: fn() -> Object"
		        },
		        "set": {
		          "!type": "fn(setting: String, val: String) -> Object"
		        },
		        "path": {
		          "!type": "fn() -> String"
		        },
		        "enabled": {
		          "!type": "fn(setting: String) -> Boolean"
		        },
		        "disabled": {
		          "!type": "fn(setting: String) -> Boolean"
		        },
		        "enable": {
		          "!type": "fn(setting: String) -> Object"
		        },
		        "disable": {
		          "!type": "fn(setting: String) -> Object"
		        },
		        "configure": {
		          "!type": "fn(env: String, fn: fn()) -> Object"
		        },
		        "all": {
		          "!type": "fn(path: String) -> Object"
		        },
		        "render": {
		          "!type": "fn(name: String, options: Object, fn: fn())"
		        },
		        "listen": {
		          "!type": "fn()"
		        }
			},
      		"request": {
      			"!proto" : "Object",
        		"header": {
		          "!type": "fn(name: String) -> Object"
		         },
		        "accepts": {
		          "!type": "fn(type: Object)"
		         },
		        "acceptsEncoding": {
		          "!type": "fn(encoding: String) -> Boolean"
		        },
		        "acceptsCharset": {
		          "!type": "fn(charset: String) -> Boolean"
		        },
		        "acceptsLanguage": {
		          "!type": "fn(lang: String) -> Boolean"
		        },
		        "range": {
		          "!type": "fn(size: number)"
		        },
		        "param": {
		          "!type": "fn(name: String, defaultValue: Object) -> String"
		        },
		        "is": {
		          "!type": "fn(type: String) -> Boolean"
		         },
		        "get": {
		          "!type": "fn(name: String) -> Object"
		         }
      		},
      		"response": {
      			"!proto" : "Object",
        		"status": {
		          "!type": "fn(code: number) -> ServerResponse"
		        },
		        "links": {
		          "!type": "fn(links: Object) -> ServerResponse"
		        },
		        "send": {
		          "!type": "fn(body: String) -> ServerResponse"
		        },
		        "json": {
		          "!type": "fn(obj: Object) -> ServerResponse"
		        },
		        "jsonp": {
		          "!type": "fn(obj: Object) -> ServerResponse"
		        },
		        "sendfile": {
		          "!type": "fn(path: String, options: Object, fn: fn())"
		        },
		        "download": {
		          "!type": "fn(path: String, filename: String, fn: fn())"
		        },
		        "type": {
		        	"!type" : "fn(type: String)"
		        },
		        "format": {
		          "!type": "fn(obj: Object) -> ServerResponse"
		        },
		        "attachment": {
		          "!type": "fn(filename: String) -> ServerResponse"
		        },
		        "header": {
		        	"!type" : "fn(field: Object, val: String) -> ServerResponse"
		        },
		        "get": {
		          "!type": "fn(field: String) -> String"
		        },
		        "clearCookie": {
		          "!type": "fn(name: String, options: Object) -> ServerResponse"
		        },
		        "cookie": {
		          "!type": "fn(name: String, val: Object, options: Object) -> ServerResponse"
		        },
		        "location": {
		          "!type": "fn(url: String) -> ServerResponse"
		        },
		        "redirect": {
		          "!type": "fn(url: String)",
		        },
		        "vary": {
		          "!type": "fn(field: Object) -> ServerResponse"
		        },
		        "render": {
		          "!type": "fn(view: String, options: Object, fn: fn())"
		        },
		        "contentType":  {
		        	"!type" : "fn(type: String)"
		        },
		        "set":  {
		        	"!type" : "fn(field: Object, val: String) -> ServerResponse"
		        }
      		},
      		"middleware": {
      			"!proto" : "Object",
  				"init": {
    				"!type": "fn(app: fn())"
  				}
			}
        }
}});