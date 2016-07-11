/*eslint-env amd, browser*/
define([
	"orion/Deferred",
	"/socket.io/socket.io.js",
], function(Deferred, io) {
	
	/**
	 * The object of error codes
	 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#response-message
	 */
	var errorCodes = {
    	ParseError: -32700,
    	InvalidRequest: -32600,
    	MethodNotFound: -32601,
    	InvalidParams: -32602,
    	InternalError: -32603,
    	ServerErrorStart: -32099,
    	ServerErrorEnd: -32000,
	};
	
	var messageTypes = {
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#initialize-request
		 */
		initialize: 'initialize',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#shutdown-request
		 */
		shutdown: 'shutdown',
		/**
		 * @kind notification
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#exit-notification
		 */
		exit: 'exit',
		/**
		 * @kind notification
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#showmessage-notification
		 */
		showMessage: 'window/showMessage',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#showmessage-request
		 */
		showMessageRequest: 'winow/showMessageRequest',
		/**
		 * @kind notification
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#logmessage-notification
		 */
		logMessage: 'window/logMessage',
		/**
		 * @kind notification
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#telemetry-notification
		 */
		telemetryEvent: 'telemetry/event',
		/**
		 * @kind notification
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#didchangeconfiguration-notification
		 */
		didChangeConfiguration: 'workspace/didChangeConfiguration',
		/**
		 * @kind notification
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#didchangewatchedfiles-notification
		 */
		didChangeWatchedFiles: 'workspace/didChangeWatchedFiles',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#workspace-symbols
		 */
		workspaceSymbol: 'workspace/symbol',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#code-action
		 */
		codeAction: 'textDocument/codeAction',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#code-lens
		 */
		codeLens: 'textDocument/codeLens',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#completion-request
		 */
		completion: 'textDocument/completion',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#goto-definition
		 */
		definition: 'textDocument/definition',
		/**
		 * @kind notification
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#didopentextdocument-notification
		 */
		didOpen: 'textDocument/didOpen',
		/**
		 * @kind notification
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#didchangetextdocument-notification
		 */
		didChange: 'textDocument/didChange',
		/**
		 * @kind notification
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#didclosetextdocument-notification
		 */
		didClose: 'textDocument/didClose',
		/**
		 * @kind notification
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#didsavetextdocument-notification
		 */
		didSave: 'textDocument/didSave',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#document-highlights
		 */
		documentHighlight: 'textDocument/documentHighlight',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#document-symbols
		 */
		documentSymbol: 'textDocument/documentSymbol',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#document-formatting
		 */
		formatting: 'textDocument/formatting',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#hover
		 */
		hover: 'textDocument/hover',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#document-on-type-formatting
		 */
		onTypeFormatting: 'textDocument/onTypeFormatting',
		/**
		 * @kind notification
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#publishdiagnostics-notification
		 */
		publishDiagnostics: 'textDocument/publishDiagnostics',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#document-range-formatting
		 */
		rangeFormatting: 'textDocument/rangeFormatting',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#find-references
		 */
		references: 'textDocument/references',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#rename
		 */
		rename: 'textDocument/rename',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#signature-help
		 */
		signatureHelp: 'textDocument/signatureHelp',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#completion-item-resolve-request
		 */
		completionItemResolve: 'completionItem/resolve',
		/**
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#code-lens-resolve
		 */
		codeLensResolve: 'codeLens/resolve'
	};
	
	/**
	 * @name IPC
	 * @description Creates a new IPC class
	 * @param {String} channel
	 * @returns {IPC} A new class
	 * @ since 13.0
	 */
	function IPC(channel) {
		this.socket = null;
		this.channel = channel;
		this.id = 1;
		this.requests = {};
		this.initialized = false;
		this.queue = [];
		this.listeners = Object.create(null);
	}
	
	/**
	 * The collection of message types corresponding to the launguage server protocol
	 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md
	 */
	IPC.prototype.MESSAGE_TYPES = messageTypes;
	
	/**
	 * @name _notifyListeners
	 * @description Notify the given list of listeners with the given data. If no type is given, 'data.method' will be queried. If there is no
	 * 'data.method' property, no work is done
	 * @private
	 * @param {Array.<{}>} listeners The list of listeners to notify
	 * @param {String} type The type of listener to notify 
	 * @param {?} data The data to tell the listeneres about
	 */
	function _notifyListeners(listeners, type, data) {
		var t = type ? type : data.method;
		if(t) {
			var l = listeners[t];
			if(Array.isArray(l) && l.length > 0) {
				l.forEach(function(listener) {
					listener.handleNotification(data);
				});
			}
		}
	}
	/**
	 * @name IPC.prototype.sendMessage
	 * @description Send a message over the socket
	 * @function
	 * @param {number} id The id of the message
	 * @param {String} message The name of the message to send
	 * @param {?} params The object of parameters for the message
	 */
	IPC.prototype.sendMessage = function sendMessage(id, message, params) {
		var json = {
            "jsonrpc": "2.0",
            "method": message, 
            "params": params
        };
        if (id) {
        	json.id = id;
        }
        if(!this.initialized && message !== messageTypes.initialize) {
			this.queue.push(json);
		} else {
	        this.socket.emit('data', json);
	    }
	    if (id) {
	        return this.requests[id] = new Deferred();
	    }
	};
	
	/**
	 * @name IPC.prototype.addListener
	 * @description Adds a listener for a given type. A type can be 'log' for logging, 'error' for only errors or the name of one of the message kinds
	 * @function
	 * @param {String} type The type of the listener
	 * @param {?} listener The listener object
	 */
	IPC.prototype.addListener = function addListener(type, listener) {
		if(!Array.isArray(this.listeners[type])) {
			this.listeners[type] = [];
		}
		this.listeners[type].push(listener);
	};
	
	/**
	 * @name IPC.prototype.connect
	 * @description Connects to the class channel name 
	 * @function
	 */
	IPC.prototype.connect = function connect() {
		this.socket = io.connect(this.channel);
		this.socket.on('connect', function() {
			this.socket.emit('start');
		}.bind(this));
		this.socket.on('fail', function(error) {
			console.log(error);
		}.bind(this));
		this.socket.on('error', function(error) {
			console.log(error);
		}.bind(this));
		this.socket.on('data', function(data) {
			try {
				if(!data) {
					_notifyListeners(this.listeners, messageTypes.logMessage, "Dropped response with null data.");
					return;
				}
				if (data && data.id) {
					var deferred = this.requests[data.id];
					if(deferred) {
						if(data.error) {
							deferred.reject(data.error);
						} else {
							deferred.resolve(data.result);
						}
						delete this.requests[data.id];
					}
				}
				_notifyListeners(this.listeners, data.method, data);
			} catch(err) {
				_notifyListeners(this.listeners, messageTypes.logMessage, err.toString());
			}
		}.bind(this));
		this.socket.on('ready', function(data) {
			var pid;
			try {
				console.log(data);
				var json  = JSON.parse(data);
				this.workspaceDir = json.workspaceDir;
				pid = json.processId;
			} catch(err) {
				_notifyListeners(this.listeners, messageTypes.logMessage, err.toString());
			}
			this.initialize(pid, this.workspaceDir).then(/* @callback */ function initializeCallback(result) {
				this.initialized = true;
				this.queue.forEach(function queueFlushCallback(item) {
					this.socket.emit('data', item);
					_notifyListeners(this.listeners, messageTypes.logMessage, JSON.stringify(item));
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};
	
	/**
	 * @name IPC.prototype.initialize
	 * @description Sends an initialize request
	 * @param {String} processId The id of the process
	 * @param {String} workspaceDir The root of the current workspace 
	 * @function
	 * @returns {Deferred} The deferred that resolves to the result of the request
	 */
	IPC.prototype.initialize = function initialize(processId, workspaceDir) {
		return this.sendMessage(this.id++, messageTypes.initialize, {
			rootPath: workspaceDir,
			processId: processId
		});
	};
	
	/**
	 * @name IPC.prototype.didOpen
	 * @description Sends a didOpen notification
	 * @function
	 * @param {String} uri The URI of the file
	 * @param {String} languageId The content type of the source
	 * @param {String} text The optional current source code
	 */
	IPC.prototype.didOpen = function didOpen(uri, languageId, version, text) {
		return this.sendMessage(0, messageTypes.didOpen, {
			textDocument: {
				uri: uri,
				languageId: languageId,
				version: version,
				text: text
			}
		});
	};
	
	/**
	 * @name IPC.prototype.didClose
	 * @description Sends a didClose notification
	 * @function
	 * @param {String} uri The URI of the file
	 */
	IPC.prototype.didClose = function didClose(uri) {
		return this.sendMessage(0, messageTypes.didClose, {
			textDocument: {
				uri: uri,
			}
		});
	};
	
	/**
	 * @name IPC.prototype.didSave
	 * @description Sends a didSave notification
	 * @function
	 * @param {String} uri The URI of the file
	 */
	IPC.prototype.didSave = function didSave(uri) {
		return this.sendMessage(0, messageTypes.didSave, {
			textDocument: {
				uri: uri,
			}
		});
	};
	
	/**
	 * @name IPC.prototype.didChange
	 * @description Sends a didChange notification
	 * @function
	 * @param {String} uri The URI of the file
	 * @param {Number} version the version of the document
	 * @param Array<TextDocumentContentChangeEvent> changes the changes in the document
	 */
	IPC.prototype.didChange = function didChange(uri, version, changes) {
		return this.sendMessage(0, messageTypes.didChange, {
			textDocument: {
				uri: uri,
				version: version
			},
			contentChanges: changes
		});
	};
	
	/**
	 * @name IPC.prototype.documentHighlight
	 * @description Sends a document highlight request
	 * @function
	 * @param {String} uri The URI of the file
	 * @param {{line: number, character: number}} offset The offset into the file to compute the highlight for
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.documentHighlight = function documentHighlight(uri, position) {
		return this.sendMessage(this.id++, messageTypes.documentHighlight, {
				position: position, 
				textDocument: {
					uri: uri,
				}
		});
	};
	
	/**
	 * @name IPC.prototype.completion
	 * @description Sends a code completion request
	 * @function
	 * @param {String} uri The URI of the file
	 * @param {{line: number, character: number}} offset The offset into the file to compute completions at
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.completion = function completion(uri, position) {
		return this.sendMessage(this.id++, messageTypes.completion, {
				position: position, 
				textDocument: {
					uri: uri,
				}
		});
	};
	
	return IPC;
});