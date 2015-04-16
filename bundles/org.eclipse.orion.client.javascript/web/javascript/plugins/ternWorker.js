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
    'javascript/signatures',
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
	'javascript/handlers/ternFindDeclarationHandler',
	'javascript/handlers/ternHoverHandler',
	'javascript/handlers/ternOccurrencesHandler',
	'javascript/handlers/ternRenameHandler',
	'doctrine'  //stays last - exports into global
],
/* @callback */ function(Signatures, Tern, docPlugin, /*requirePlugin, orionRequirePlugin, mongodbPlugin, nodePlugin,*/ ecma5, browser, AssistHandler, DeclHandler, 
						HoverHandler, OccurrencesHandler, RenameHandler) {
    
    var ternserver, pendingReads = Object.create(null);
    
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
        if(ternserver) {
            postMessage("ternstarted");
        } else {
            postMessage("ternfailed");
        }
    }
    startServer();
    onmessage = function(event) {
        if(typeof(event.data) === 'object') {
            var _d = event.data;
            if(typeof(_d.request) === 'string') {
                switch(_d.request) {
                    case 'completions': {
                        AssistHandler.computeProposals(ternserver, getPostMessage(), _d.args);
                        break;
                    }
                    case 'occurrences': {
                        OccurrencesHandler.computeOccurrences(ternserver, getPostMessage(), _d.args);
                        break;
                    }
                    case 'decl': {
                        DeclHandler.computeDeclaration(ternserver, getPostMessage(), _d.args);
                        break;
                    }
                    case 'hover': {
                        HoverHandler.computeHover(ternserver, getPostMessage(), _d.args);
                        break;
                    }
                    case 'rename': {
                        RenameHandler.computeRename(ternserver, getPostMessage(), _d.args);
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
    
    onconnect = function(event) {
    	this.port = event.ports[0];
    	this.port.onmessage = onmessage;
    	this.port.start();
    };
    
    function getPostMessage() {
    	if(this.port) {
    		return this.port.postMessage;
    	}
    	return postMessage;
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
            postMessage('Failed to delete file from Tern: '+args.file);
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
        	var _f = file;
           if(typeof(file) === 'object') {
           		_f = file.logical;
           }
           pendingReads[_f] = callback;
           postMessage({request: 'read', args: {file:file}});
	    } else {
	       postMessage('Failed to read file into Tern: '+_f);
	    }
    }
});