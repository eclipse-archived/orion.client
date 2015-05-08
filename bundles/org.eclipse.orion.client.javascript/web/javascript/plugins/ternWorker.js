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
importScripts('../../requirejs/require.js'); // synchronous //$NON-NLS-1$
require({
	baseUrl: "../../", //$NON-NLS-1$
	paths: {
		text: "requirejs/text", //$NON-NLS-1$
		esprima: "esprima/esprima", //$NON-NLS-1$
		estraverse: "estraverse/estraverse", //$NON-NLS-1$
		escope: "escope/escope", //$NON-NLS-1$
		logger: "javascript/logger", //$NON-NLS-1$
		doctrine: 'doctrine/doctrine' //$NON-NLS-1$
	},
	packages: [
		{
			name: "eslint/conf", //$NON-NLS-1$
			location: "eslint/conf" //$NON-NLS-1$
		},
		{
			name: "eslint", //$NON-NLS-1$
			location: "eslint/lib", //$NON-NLS-1$
			main: "eslint" //$NON-NLS-1$
		},
	]
},
[
	'tern/lib/tern', //$NON-NLS-1$
	'tern/plugin/doc_comment', //$NON-NLS-1$
	//'tern/plugin/dependencies', //$NON-NLS-1$
	//TODO Load these on the fly
	//'tern/plugin/requirejs',
	//'tern/plugin/mongodb2_0_27',
	//'tern/plugin/node',
	'tern/defs/ecma5', //$NON-NLS-1$
	'tern/defs/browser', //$NON-NLS-1$
	'javascript/handlers/ternAssistHandler', //$NON-NLS-1$
	'javascript/handlers/ternDeclarationHandler', //$NON-NLS-1$
	'javascript/handlers/ternHoverHandler', //$NON-NLS-1$
	'javascript/handlers/ternOccurrencesHandler', //$NON-NLS-1$
	'javascript/handlers/ternRenameHandler', //$NON-NLS-1$
	'doctrine'  //stays last - exports into global //$NON-NLS-1$
],
/* @callback */ function(Tern, docPlugin, /*dependenciesPlugin, requirePlugin, mongodbPlugin, nodePlugin,*/ ecma5, browser, 
							AssistHandler, DeclarationHandler, HoverHandler, OccurrencesHandler, RenameHandler) {
    
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
                        fullDocs: true
                    }
                   // dependencies: {
                    	//depth: 1
                    //}
                    //mongodb2_0_27:{},
                    //node: {}
                },
                getFile: _getFile
            };
        
        ternserver = new Tern.Server(options);
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
                    case 'completions': { //$NON-NLS-1$
                        AssistHandler.computeProposals(ternserver, _d.args, post);
                        break;
                    }
                    case 'occurrences': { //$NON-NLS-1$
                        OccurrencesHandler.computeOccurrences(ternserver, _d.args, post);
                        break;
                    }
                    case 'definition': { //$NON-NLS-1$
                        DeclarationHandler.computeDeclaration(ternserver, _d.args, post);
                        break;
                    }
                    case 'documentation': { //$NON-NLS-1$
                        HoverHandler.computeHover(ternserver, _d.args, post);
                        break;
                    }
                    case 'rename': { //$NON-NLS-1$
                        RenameHandler.computeRename(ternserver, _d.args, post);
                        break;
                    }
                    case 'addFile': { //$NON-NLS-1$
                    	ternserver.addFile(_d.args.file, _d.args.source);
                    	break;
                    }
                    case 'delfile': { //$NON-NLS-1$
                        _deleteFile(_d.args);
                        break;
                    }
                    case 'read': { //$NON-NLS-1$
                        _contents(_d.args);
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
    
    post('server_ready'); //$NON-NLS-1$
    
    /**
     * @description Sends the given message back to the client. If the msg is null, send an Error
     * object with the optional given error message
     * @param {Object} msg The message to send back to the client
     * @param {String} errormsg The optional error message to send back to the client if the main message is null
     */
    function post(msg, errormsg) {
    	if(!msg) {
    		msg = new Error(errormsg ? errormsg : 'An unknown error occurred.'); //$NON-NLS-1$
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
        }
        read = pendingReads[args.logical];
        if(typeof(read) === 'function') {
            read(err, {contents: contents, file:file, logical:args.logical});
        }
        delete pendingReads[file];
    }
    
    /**
     * @description Removes a file from Tern
     * @param {Object} args the request args
     */
    function _deleteFile(args) {
        if(ternserver && typeof(args.file) === 'string') {
            ternserver.delFile(args.file);
        } else {
            post('Failed to delete file from Tern: '+args.file); //$NON-NLS-1$
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
	       post('Failed to read file into Tern: '+_f); //$NON-NLS-1$
	    }
    }
});