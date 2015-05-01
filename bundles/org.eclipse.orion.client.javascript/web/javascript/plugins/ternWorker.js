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
importScripts('../../requirejs/require.js'); // synchronous
require({
	baseUrl: "../../",
	paths: {
		text: "requirejs/text",
		esprima: "esprima/esprima",
		estraverse: "estraverse/estraverse",
		escope: "escope/escope",
		logger: "javascript/logger",
		doctrine: 'doctrine/doctrine'
	},
	packages: [
		{
			name: "eslint/conf",
			location: "eslint/conf"
		},
		{
			name: "eslint",
			location: "eslint/lib",
			main: "eslint"
		},
	]
},
[
	'tern/lib/tern',
	'tern/plugin/doc_comment',
	//TODO Load these on the fly
	//'tern/plugin/requirejs',
	//'tern/plugin/orion_requirejs',
	//'tern/plugin/mongodb2_0_27',
	//'tern/plugin/node',
	'tern/defs/ecma5',
	'tern/defs/browser',
	'javascript/handlers/ternAssistHandler',
	'javascript/handlers/ternDeclarationHandler',
	'javascript/handlers/ternHoverHandler',
	'javascript/handlers/ternOccurrencesHandler',
	'javascript/handlers/ternRenameHandler',
	'doctrine'  //stays last - exports into global
],
/* @callback */ function(Tern, docPlugin, /*requirePlugin, orionRequirePlugin, mongodbPlugin, nodePlugin,*/ ecma5, browser, 
							AssistHandler, DeclarationHandler, HoverHandler, OccurrencesHandler, RenameHandler) {
    
    var ternserver, pendingReads = Object.create(null);
    
    function warmUp() {
    	if(ternserver) {
    		ternserver.request({
	           query: {
	           type: "completions", 
	           file: 'warmup',
	           types: true, 
	           origins: true,
	           urls: true,
	           docs: true,
	           end: 0,
	           sort:true
	           },
	           files: [{type:'full', name: 'warmup', text: ''}]}, 
	           /* @callback */ function(error, comps) {
	               //do nothing
	           });
	      }
	      ternserver.delFile('warmup'); //don't leave it in there
    }
    
    /**
     * @description Start up the Tern server, send a message after trying
     */
    function startServer() {
        var options = {
                async: true,
                debug:true,
                defs: [ecma5, browser],
                projectDir: '/',
                plugins: {
                    doc_comment: {
                        fullDocs: true
                    }
                    //mongodb2_0_27:{},
                    //node: {}
                    //orion_requirejs: {}
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
    
    post('server_ready');
    //Warm up after we have finished attaching all our listeners
    //warmUp();
    
    /**
     * @description Sends the given message back to the client. If the msg is null, send an Error
     * object with the optional given error message
     * @param {Object} msg The message to send back to the client
     * @param {String} errormsg The optional error message to send back to the client if the main message is null
     */
    function post(msg, errormsg) {
    	if(!msg) {
    		msg = new Error(errormsg ? errormsg : 'An unknown error occurred.');
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
        file = args.logical;
        read = pendingReads[file];
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
            post('Failed to delete file from Tern: '+args.file);
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
           post({request: 'read', args: {file:file}});
	    } else {
	       post('Failed to read file into Tern: '+_f);
	    }
    }
});