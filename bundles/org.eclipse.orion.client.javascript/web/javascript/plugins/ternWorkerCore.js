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
/*globals importScripts onmessage:true doctrine onconnect:true*/
/*eslint-env node, browser*/
require({
	baseUrl: "../../", //$NON-NLS-1$
	paths: {
		i18n: 'requirejs/i18n', //$NON-NLS-1$
		esprima: "esprima/esprima" //$NON-NLS-1$
	}
},
[
	'tern/lib/tern',
	'tern/plugin/doc_comment',
	'tern/plugin/orionRequire',
	'tern/plugin/orionNode',
	'tern/plugin/orionAngular',
	'tern/plugin/orionComponent',
	'tern/plugin/ternPlugins',
	'tern/defs/ecma5',
	'tern/defs/browser',
	'javascript/handlers/ternAssistHandler',
	'javascript/handlers/ternDeclarationHandler',
	'javascript/handlers/ternHoverHandler',
	'javascript/handlers/ternOccurrencesHandler',
	'javascript/handlers/ternRenameHandler',
	'javascript/handlers/ternPluginsHandler',
	'i18n!javascript/nls/workermessages',
	'orion/i18nUtil'
],
/* @callback */ function(Tern, docPlugin, orionRequirePlugin, orionNodePlugin, orionAngularPlugin, orionComponentPlugin, ternPluginsPlugin, 
							ecma5, browser, AssistHandler, DeclarationHandler, HoverHandler, OccurrencesHandler, RenameHandler, PluginsHandler, 
							Messages, i18nUtil) {
    
    var ternserver, pendingReads = Object.create(null);
    
    /**
     * @description Start up the Tern server, send a message after trying
     */
    function startServer() {
        var options = {
                async: true,
                debug:true,
                defs: [ecma5, browser],
                projectDir: '/', //$NON-NLS-1$
                plugins: {
                    doc_comment: {
                    	name: Messages['ternDocPluginName'],
                    	description: Messages['ternDocPluginDescription'],
                        fullDocs: true,
                        removable: false
                    },
                    orionRequire: {
                    	name: Messages['orionRequirePluginName'],
                    	description: Messages['orionRequirePluginDescription'],
                    	removable: true
                    	//depth: 1
                    },
                   /* orionNode: {
                    	name: Messages['orionNodePluginName'],
                    	description: Messages['orionNodePluginDescription'],
                    	removable: true
                    },
                    orionAngular: {
                    	name: Messages['orionAngularPluginName'],
                    	description: Messages['orionAngularPluginDescription'],
                    	removable: true
                    },
                    orionComponent: {
                    	name: Messages['orionComponentPluginName'],
                    	description: Messages['orionComponentPluginDescription'],
                    	removable: true
                    },*/
                    plugins: {
                    	name: Messages['ternPluginsPluginName'],
                    	description: Messages['ternPluginsPluginDescription'],
                    	removable: false
                    }
                },
                getFile: _getFile
            };
        
        ternserver = new Tern.Server(options);
        post('server_ready'); //$NON-NLS-1$
    }
    startServer();
    
    /**
     * @description Worker callback when a message is sent to the worker
     * @callback
     */
    onmessage = function(evnt) {
        if(typeof(evnt.data) === 'object') {
            var _d = evnt.data;
            if(typeof(_d.request) === 'string') {
                switch(_d.request) {
                    case 'completions': {
                        AssistHandler.computeProposals(ternserver, _d.args, post);
                        break;
                    }
                    case 'occurrences': {
                        OccurrencesHandler.computeOccurrences(ternserver, _d.args, post);
                        break;
                    }
                    case 'definition': {
                        DeclarationHandler.computeDeclaration(ternserver, _d.args, post);
                        break;
                    }
                    case 'documentation': {
                        HoverHandler.computeHover(ternserver, _d.args, post);
                        break;
                    }
                    case 'rename': {
                        RenameHandler.computeRename(ternserver, _d.args, post);
                        break;
                    }
                    case 'addFile': {
                    	ternserver.addFile(_d.args.file, _d.args.source);
                    	break;
                    }
                    case 'delfile': {
                        _deleteFile(_d.args);
                        break;
                    }
                    case 'read': {
                        _contents(_d.args);
                        break;
                    }
                    case 'installed_plugins': {
                    	PluginsHandler.getInstalledPlugins(ternserver, _d.args, post);
                    	break;
                    }
                    case 'install_plugins': {
                    	PluginsHandler.installPlugins(ternserver, _d.args, post);
                    	break;
                    }
                    case 'remove_plugins': {
                    	PluginsHandler.removePlugins(ternserver, _d.args, post);
                    	break;
                    }
                    case 'plugin_enablement': {
                    	PluginsHandler.setPluginEnablement(ternserver, _d.args, post);
                    	break;
                    }
                }
            }
        }
    };
    
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
     * @description Notifies the Tern server that file contents are ready
     * @param {Object} args The args from the message
     */
    function _contents(args) {
        var err = args.error;
        var contents = args.contents;
        var file = args.file;
        var read = pendingReads[file];
        if(typeof(read) === 'function') {
            read(err, contents);
             delete pendingReads[file];
        }
        read = pendingReads[args.logical];
        if(typeof(read) === 'function') {
            read(err, {contents: contents, file:file, logical:args.logical});
            delete pendingReads[args.logical];
        }
    }
    
    /**
     * @description Removes a file from Tern
     * @param {Object} args the request args
     */
    function _deleteFile(args) {
        if(ternserver && typeof(args.file) === 'string') {
            ternserver.delFile(args.file);
        } else {
            post(i18nUtil.formatMessage(Messages['failedDeleteRequest'], args.file)); 
        }
    }
    
    /**
     * @description Read a file from the workspace into Tern
     * @private
     * @param {String} file The full path of the file
     * @param {Function} callback The callback once the file has been read or failed to read
     */
    function _getFile(file, callback) {
    	if(file === 'warmup') {
    		callback(null, null);
    	} else if(ternserver) {
        	var _f = file;
           if(typeof(file) === 'object') {
           		_f = file.logical;
           }
           pendingReads[_f] = callback;
           post({request: 'read', args: {file:file}}); //$NON-NLS-1$
	    } else {
	       post(i18nUtil.formatMessage(Messages['failedReadRequest'], _f)); //$NON-NLS-1$
	    }
    }
});