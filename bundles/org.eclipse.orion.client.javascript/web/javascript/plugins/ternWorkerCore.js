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
/*globals importScripts onmessage:true onconnect:true requirejs*/
/*eslint-env node, browser*/
var lang ='en'; //$NON-NLS-1$
var sear = self.location.search;
if(sear) {
	var langs = sear.split('worker-language'); //$NON-NLS-1$
	if(Array.isArray(langs) && langs.length === 2) {
		lang = langs[1].slice(1);
		if(lang){
			lang = lang.toLocaleLowerCase();
		}
	}
}
requirejs.config({locale: lang});
require([
	'tern/lib/tern',
	'javascript/plugins/ternDefaults',
	'orion/Deferred',
	'orion/serialize',
	'i18n!javascript/nls/workermessages',
	'orion/i18nUtil'
],
/* @callback */ function(Tern, defaultOptions, Deferred, Serialize, Messages, i18nUtil) {

    var ternserver = null;
	
    /**
     * @param {Object} jsonOptions The optional map of JSON options to start the server with
     * @param {Function} callback The optional function to callback to 
     * @description Start up the Tern server, send a message after trying
     */
    function startServer(jsonOptions, callback) {
    	if (ternserver){
    		ternserver.reset();
    		ternserver = null;
    	}
        var options = {
                async: true,
                debug: false,
                projectDir: '/', //$NON-NLS-1$
                getFile: _getFile
            };
        var pluginsDir = defaultOptions.pluginsDir;
        var defsDir = defaultOptions.defsDir;
        var defNames = [];
        if (jsonOptions) {
			if (jsonOptions.plugins){
        		options.plugins = jsonOptions.plugins;
        	}
        	if(jsonOptions.pluginDir) {
        		pluginsDir = jsonOptions.pluginsDir;
        	}
        	if (Array.isArray(jsonOptions.libs)){
        		defNames = jsonOptions.libs;
        		defsDir = jsonOptions.defsDir;
        	}
        	if (Array.isArray(jsonOptions.defs)){
        		defNames = jsonOptions.defs;
        		defsDir = jsonOptions.defsDir;
        	}
        	if (typeof jsonOptions.ecmaVersion === 'number'){
        		options.ecmaVersion = jsonOptions.ecmaVersion;
        	}
        	if (typeof jsonOptions.dependencyBudget === 'number'){
        		options.dependencyBudget = jsonOptions.dependencyBudget;
        	}
        }
        function defaultStartUp(err) {
        	options.plugins = defaultOptions.plugins;
        	options.defs = defaultOptions.defs;
			ternserver = new Tern.Server(options);
	        callback({request: 'start_server', state: "server_ready"}); //$NON-NLS-1$ //$NON-NLS-2$
	        if(err) {
	        	post(Serialize.serializeError(err));
	        }
        }
        if(!options.plugins && (!defNames || defNames.length < 1)) {
        	defaultStartUp();
        } else {
        	Deferred.all(loadPlugins(options.plugins, pluginsDir)).then(/* @callback */ function(plugins) {
	        	Deferred.all(loadDefs(defNames, defsDir)).then(function(json) {
	        			options.defs = json;
	        			ternserver = new Tern.Server(options);
				        callback({request: 'start_server', state: "server_ready"}); //$NON-NLS-1$ //$NON-NLS-2$
	        		}, defaultStartUp);
	        }, defaultStartUp);
        }
    }
	post({request: "worker_ready"}); //$NON-NLS-1$ //$NON-NLS-2$

	var handlers = {
		'start_server': function(args, callback){
			startServer(args.options, callback);	
		},
		'addFile': function(args, callback) {
			ternserver.addFile(args.file, args.source);
			callback({request: 'addFile'}); //$NON-NLS-1$
		},
		'completions': function(args, callback) {
			if(ternserver) {
		       ternserver.request({
		           query: {
		           type: "completions",  //$NON-NLS-1$
		           file: args.meta.location,
		           types: true,
		           origins: true,
		           urls: true,
		           docs: true,
		           end: args.params.offset,
		           sort:true,
		           includeKeywords: args.params.keywords,
		           caseInsensitive: true
		           },
		           files: args.files},
		           function(error, comps) {
		               if(error) {
		               		callback({request: 'completions', proposals:[], error: error.message, message: Messages['failedToComputeProposals']}); //$NON-NLS-1$
		               } else if(comps && comps.completions) {
	               			callback({request: 'completions', proposals: comps.completions}); //$NON-NLS-1$
		               } else {
		               		callback({request: 'completions', proposals:[]}); //$NON-NLS-1$
		               }
		           });
	
		   } else {
		       callback({request: 'completions', message: Messages['failedToComputeProposalsNoServer']}); //$NON-NLS-1$
		   }
		},
		'definition': function(args, callback) {
			if(ternserver) {
		       ternserver.request({
		           query: {
			           type: "definition",  //$NON-NLS-1$
			           file: args.meta.location,
			           end: args.params.offset,
			           guess: args.guess
		           },
		           files: args.files},
		           function(error, decl) {
		               if(error) {
		                  callback({request: 'definition', error: error.message, message: Messages['failedToComputeDecl']}); //$NON-NLS-1$
		               }
		               if(decl && typeof(decl.start) === 'number' && typeof(decl.end) === "number") {
		               		callback({request: 'definition', declaration:decl}); //$NON-NLS-1$
	       			   } else {
	       			   		callback({request: 'definition', declaration: null}); //$NON-NLS-1$
	       			   }
		           });
		   } else {
		       callback({request: 'definition', message: Messages['failedToComputeDeclNoServer']}); //$NON-NLS-1$
		   }
		},
		'delFile': function(args, callback) {
			if(ternserver && typeof(args.file) === 'string') {
	            ternserver.delFile(args.file);
	            callback({request: 'delFile'}); //$NON-NLS-1$
	        } else {
	        	callback({request: 'delFile', message: i18nUtil.formatMessage(Messages['failedDeleteRequest'], args.file)}); //$NON-NLS-1$
	        }
		},
		'documentation': function(args, callback) {
			if(ternserver) {
		       ternserver.request({
		           query: {
			           type: "documentation",  //$NON-NLS-1$
			           file: args.meta.location,
			           end: args.params.offset,
			           docFormat: args.params.docFormat
		           },
		           files: args.files},
		           function(error, doc) {
		               if(error) {
		                   callback({request: 'documentation', error: error.message, message: Messages['failedToComputeDoc']}); //$NON-NLS-1$
		               } else if(doc && doc.doc) {
	        			   callback({request: 'documentation', doc:doc}); //$NON-NLS-1$
		               } else {
							callback({request: 'documentation', doc: null}); //$NON-NLS-1$
		               }
		           });
		   } else {
		       callback({request: 'documentation', message: Messages['failedToComputeDocNoServer']}); //$NON-NLS-1$
		   }
	   	},
		/**
		 * @callback
		 */
		'environments': function(args, callback) {
			if(ternserver) {
		       ternserver.request({
		           query: {
			           type: 'environments' //$NON-NLS-1$
		           }}, 
		           function(error, envs) {
		               if(error) {
		                   callback({request: 'environments', error: error.message, message: Messages['failedGetEnvs']}); //$NON-NLS-1$
		               }
		               if(typeof(envs) === 'object') {
		               		callback({request: 'environments', envs:envs}); //$NON-NLS-1$
	       			   } else {
	       			   		callback({request: 'environments', envs: null}); //$NON-NLS-1$
	       			   }
		           });
		   } else {
		       callback({request: 'environments', message: Messages['failedGetEnvsNoServer']}); //$NON-NLS-1$
		   }
		},
		'implementation': function(args, callback) {
			if(ternserver) {
		       ternserver.request({
		           query: {
			           type: "implementation",  //$NON-NLS-1$
			           file: args.meta.location,
			           end: args.params.offset,
			           guess: args.guess
		           },
		           files: args.files},
		           function(error, impl) {
		               if(error) {
		                   callback({request: 'implementation', error: error.message, message: Messages['failedToComputeImpl']}); //$NON-NLS-1$
		               }
		               if(impl && impl.implementation && typeof(impl.implementation.start) === 'number' && typeof(impl.implementation.end) === "number") {
		               		callback({request: 'implementation', implementation:impl.implementation}); //$NON-NLS-1$
	       			   } else {
	       			   		callback({request: 'implementation', implementation: null}); //$NON-NLS-1$
	       			   }
		           });
		   } else {
		       callback({request: 'implementation', message: Messages['failedToComputeImplNoServer']}); //$NON-NLS-1$
		   }
		},
		/**
		 * @callback
		 */
		'install_plugins': function(args, callback) {
			if(ternserver) {
		       ternserver.request({
		           query: {
			           type: 'install_plugins' //$NON-NLS-1$
		           }}, 
		           function(error, res) {
		               if(error) {
		                   callback({request: 'install_plugins', error: error.message, message: Messages['failedInstallPlugins']}); //$NON-NLS-1$
		               }
		               if(typeof(res) === 'object') {
		               		callback({request: 'install_plugins', status:res}); //$NON-NLS-1$
	       			   } else {
	       			   		callback({request: 'install_plugins', status: {state: -1}}); //$NON-NLS-1$
	       			   }
		           });
		   } else {
		       callback({request: 'install_plugins', message: Messages['failedInstallPluginsNoServer']}); //$NON-NLS-1$
		   }
		},
		/**
		 * @callback
		 */
		'installed_plugins': function(args, callback) {
			if(ternserver) {
		       ternserver.request({
		           query: {
			           type: 'installed_plugins' //$NON-NLS-1$
		           }}, 
		           function(error, plugins) {
		               if(error) {
		                   callback({request: 'installed_plugins', error: error.message, message: Messages['failedGetInstalledPlugins']}); //$NON-NLS-1$
		               }
		               if(typeof(plugins) === 'object') {
		               		callback({request: 'installed_plugins', plugins:plugins}); //$NON-NLS-1$
	       			   } else {
	       			   		callback({request: 'installed_plugins', plugins: null}); //$NON-NLS-1$
	       			   }
		           });
		   } else {
		       callback({request: 'installed_plugins', message: Messages['failedGetInstalledPluginsNoServer']}); //$NON-NLS-1$
		   }
		},
		'occurrences': function(args, callback) {
			if(ternserver) {
		       ternserver.request({
		           query: {
			           type: "refs",  //$NON-NLS-1$
			           file: args.meta.location,
			           end: args.params.selection.start
		           }},
		           function(error, refs) {
		               if(error) {
		                   callback({request: 'occurrences', error: error.message, message: Messages['failedToComputeOccurrences']}); //$NON-NLS-1$
		               } else if(refs && Array.isArray(refs)) {
	        			   callback({request: 'occurrences', refs:refs}); //$NON-NLS-1$
		               } else {
		               		callback({request: 'occurrences', refs:[]}); //$NON-NLS-1$
		               }
		           });
		   } else {
		       callback({request: 'occurrences', message: Messages['failedToComputeOccurrencesNoServer']}); //$NON-NLS-1$
		   }
		},
		/**
		 * @callback
		 */
		'plugin_enablement': function(args, callback) {
			if(ternserver) {
		       ternserver.request({
		           query: {
			           type: 'plugin_enablement' //$NON-NLS-1$
		           }}, 
		           function(error, res) {
		               if(error) {
		                   callback({request: 'plugin_enablement', error: error.message, message: Messages['failedEnablementPlugins']}); //$NON-NLS-1$
		               }
		               if(typeof(res) === 'object') {
		               		callback({request: 'plugin_enablement', status:res}); //$NON-NLS-1$
	       			   } else {
	       			   		callback({request: 'plugin_enablement', status: {state: -1}}); //$NON-NLS-1$
	       			   }
		           });
		   } else {
		       callback({request: 'plugin_enablement', message: Messages['failedEnablementPluginsNoServer']}); //$NON-NLS-1$
		   }
		},
		/**
		 * @callback
		 */
		'remove_plugins': function(args, callback) {
			if(ternserver) {
		       ternserver.request({
		           query: {
			           type: 'remove_plugins' //$NON-NLS-1$
		           }}, 
		           function(error, res) {
		               if(error) {
		                   callback({request: 'remove_plugins', error: error.message, message: Messages['failedRemovePlugins']}); //$NON-NLS-1$
		               }
		               if(typeof(res) === 'object') {
		               		callback({request: 'remove_plugins', status:res}); //$NON-NLS-1$
	       			   } else {
	       			   		callback({request: 'remove_plugins', status: {state: -1}}); //$NON-NLS-1$
	       			   }
		           });
		   } else {
		       callback({request: 'remove_plugins', message: Messages['failedRemovePluginsNoServer']}); //$NON-NLS-1$
		   }
		},
		'rename': function(args, callback) {
			if(ternserver) {
		       ternserver.request({
		           query: {
			           type: "rename",  //$NON-NLS-1$
			           file: args.meta.location,
			           end: args.params.offset,
			           newName: args.newname
		           },
		           files: args.files},
		           function(error, changes) {
		               if(error) {
		                   callback({request: 'rename', error: error.message, message: Messages['failedRename']}); //$NON-NLS-1$
		               } else if(changes && Array.isArray(changes.changes)) {
	        			   callback({request: 'rename', changes:changes}); //$NON-NLS-1$
		               } else {
		               		callback({request: 'rename', changes:[]}); //$NON-NLS-1$
		               }
		           });
		   } else {
		       callback({request: 'rename', message: Messages['failedRenameNoServer']}); //$NON-NLS-1$
		   }
		},
		'type': function(args, callback) {
			ternserver.request({
		           query: {
			           type: "type",  //$NON-NLS-1$
			           file: args.meta.location,
			           end: args.params.offset
		           }},
		           function(error, type) {
		               if(error) {
		                   callback({request: 'type', error: typeof(error) === 'string' ? error : error.message, message: Messages['failedType']}); //$NON-NLS-1$
		               } else {
		               	   callback({request: 'type', type: type}); //$NON-NLS-1$
		               }
		           });
		},
		'checkRef': function(args, callback) {
			ternserver.request({
		           query: {
			           type: "checkRef",  //$NON-NLS-1$
			           file: args.meta.location,
			           end: args.params.offset,
			           origin: args.origin
		           },
		           files: args.files},
		           function(error, type) {
		               if(error) {
		                   callback({request: 'checkRef', error: typeof(error) === 'string' ? error : error.message, message: Messages['failedType']}); //$NON-NLS-1$
		               } else {
		               	   callback({request: 'checkRef', type: type}); //$NON-NLS-1$
		               }
		           });
		},
		'lint': function(args, callback) {
			var query =
				{
					type: "lint",  //$NON-NLS-1$
					file: args.meta.location,
					config: {
						rules: args.rules
					}
				};

			if (args.env) {
				query.env = args.env;
			}
			ternserver.request(
				{
					query: query,
					files: args.files
				},
				function(error, problems) {
					if(error) {
						callback({request: 'lint', error: error.message, message: Messages['failedToComputeProblems']}); //$NON-NLS-1$
					} else if(problems && Array.isArray(problems)) {
						callback({request: 'lint', problems: problems}); //$NON-NLS-1$
					} else {
						callback({request: 'lint', problems: []}); //$NON-NLS-1$
					}
				});
		}
	};

	var ternID = 0;
	var reads = Object.create(null);
	var resolverReads = Object.create(null);

    /**
     * @description Worker callback when a message is sent to the worker
     * @callback
     */
    onmessage = function(evnt) {
        if(typeof(evnt.data) === 'object') {
            var _d = evnt.data;
            if (!ternserver && _d.request !== 'start_server'){
            	serverNotReady(_d);
            }
            var _handler = handlers[_d.request];
			if(typeof(_handler) === 'function') {
				_handler(_d.args, function(response) {
					if(typeof(_d.messageID) === 'number') {
						response.messageID = _d.messageID;
					} else if(typeof(_d.ternID) === 'number') {
						response.ternID = _d.ternID;
					}
                	post(response);
                	return;
				});
			} else if(_d.request === 'read') {
            	var _read = reads[_d.ternID];
				if(typeof(_read) === 'function') {
					var text = '';
					if(_d.args && _d.args.contents) {
						text = _d.args.contents;
					}
					_read(_d.args.error, text);//{contents: _d.args.contents ? _d.args.contents : '', file:_d.args.file, logical: _d.args.logical});
					delete reads[_d.ternID];
				}
				_read = resolverReads[_d.ternID];
				if(typeof(_read) === 'function') {
					_read(_d.args.error, {contents: _d.args.contents ? _d.args.contents : '', file:_d.args.file, logical: _d.args.logical});
					delete reads[_d.ternID];
				}
            	return;
            } else {
	            //no one handled the request, report back an error
	            unknownRequest(_d);
	        }
        }
    };

	/**
	 * @description Respond back that the request is unknown
	 * @param {Object} data The original request data
	 */
	function unknownRequest(data) {
		var response = Object.create(null);
		response.request = data.request;
		if(data.messageID) {
			response.messageID = data.messageID;
		} else if(data.ternID) {
			response.ternID = data.ternID;
		}
		response.error = i18nUtil.formatMessage(Messages['unknownRequest'], response.request);
		post(response);
	}
	
	/**
	 * @description Respond back that the tern server has not been started
	 * @param {Object} data The original request data
	 */
	function serverNotReady(data) {
		var response = Object.create(null);
		response.request = data.request;
		if(data.messageID) {
			response.messageID = data.messageID;
		} else if(data.ternID) {
			response.ternID = data.ternID;
		}
		response.error = i18nUtil.formatMessage(Messages['serverNotStarted'], response.request);
		post(response);
	}

    /**
     * @description Worker callback when an error occurs
     * @callback
     */
   	onerror = function(evnt) {
    	post(evnt);
    };

    /**
     * @description Worker callback when a shared worker starts up
     * @callback
     */
    onconnect = function(evnt) {
    	this.port = evnt.ports[0];
    	this.port.onmessage = onmessage;
    	this.port.start();
    };

    /**
     * @description Sends the given message back to the client. If the msg is null, send an Error
     * object with the optional given error message
     * @param {Object} msg The message to send back to the client
     * @param {String} errormsg The optional error message to send back to the client if the main message is null
     */
    function post(msg, errormsg) {
    	if(!msg) {
    		msg = new Error(errormsg ? errormsg : Messages['unknownError']);
    	}
    	if(this.port) {
    		this.port.postMessage(msg);
    	} else {
    		postMessage(msg);
    	}
    }

    /**
     * @description Read a file from the workspace into Tern
     * @private
     * @param {String} file The full path of the file
     * @param {Function} callback The callback once the file has been read or failed to read
     */
    function _getFile(file, callback) {
    	if(ternserver) {
           var request = {request: 'read', ternID: ternID++, args: {file:file}}; //$NON-NLS-1$
           if(file != null && typeof(file) === 'object') {
				resolverReads[request.ternID] = callback;
           } else {
	           reads[request.ternID] = callback;
	       }
           post(request, null);
	    } else {
	       post(i18nUtil.formatMessage(Messages['failedReadRequest'], typeof(file) === 'object' ? file.logical : file)); //$NON-NLS-1$
	    }
    }
    
    /**
     * @description Loads the plugins listed in the given plugins object
     * @param {Object} plugins The object of plugins
     * @param {String} pluginsDir The base directory to load plugins from, if not defined, the default of 'tern/plugin/' is assumed
     * @returns {Promise} The promise to resolve all of the plugin loads
     * @since 11.0
     */
    function loadPlugins(plugins, pluginsDir) {
    	var promises = [];
    	if(plugins) {
	    	Object.keys(plugins).forEach(function(key) {
	    		if(defaultOptions.plugins[key]) {
	    			//default plugins are statically loaded
	    			return;
	    		}
	    		var plugin = plugins[key];
	    		var loc = plugin.location;
	    		if(typeof(loc) !== 'string') {
	    			if(typeof(pluginsDir) === 'string') {
		    			loc = pluginsDir + key;
					} else {
						//assume it is in /tern/plugin/
						loc = 'tern/plugin/' + key; //$NON-NLS-1$
					}
	    		}
	    		var deferred = new Deferred();
	    		try {
					promises.push(deferred);    		
	    			requirejs([loc], function(_) {
		    			deferred.resolve(_);
	    			},
	    			function(err) {
	    				deferred.reject(err);
	    			});
				}
				catch(err) {
					post(err);
					deferred.reject(err);
				}
	    	});
		}
    	return promises;
    }
    
    /**
     * @description Load any defs from the .tern-project file
     * @param {Array.<String>|Object} defs The definitions, either from an array of names or an object of names with additional metadata
     * @param {String} defsDir The optional directory where to find the definitions. If not given the 'tern/defs' directory is assumed
     * @returns {Promise} Returns a promise to resolve all def loads
     * @since 11.0
     */
    function loadDefs(defs, defsDir) {
    	var _defs = [];
    	if(Array.isArray(defs)) {
	    	defs.forEach(function(_def) {
	    		_defs.push(_loadDef(_def, defsDir, _defs));
	    	});
    	} else if(defs && typeof(defs) === 'object') {
	     	Object.keys(defs).forEach(function(key) {
	    		var def = defs[key];
	    		if(typeof(def.location) === 'string') {
		    		_defs.push(_loadDef(def.location, defsDir, _defs));
	    		} else {
	    			_defs.push(_loadDef(key, defsDir, _defs));
	    		}
	     	});
		}
		return _defs;
    }
    
    /**
     * @description Delegate to actually load a definition
     * @private
     * @param {String} def The name of the definition load try and load
     * @param {String} defsDir The optional base directory to load from
     * @param {Array.<Object>} defs The collector array for loaded defs
     * @since 11.0
     */
    function _loadDef(def, defsDir) {
    	var loc = def;
		if(typeof(defsDir) === 'string') {
			loc = defsDir + def;
		} else {
			//assume it is in /tern/defs/
			loc = 'json!tern/defs/' + def; //$NON-NLS-1$
		}
		if(!/^json!/i.test(loc)) {
			loc = 'json!'+loc; //$NON-NLS-1$
		}
		if(!/$.json/i.test(def)) {
			loc = loc + '.json'; //$NON-NLS-1$
		}
		var deferred = new Deferred();
		try {
			requirejs([loc], function(_) {
				deferred.resolve(_);
			},
			function(err) {
				deferred.reject(err);
			});
		}
		catch(err) {
			post(err);
			deferred.reject(err);
		}
		return deferred;
    }
});
