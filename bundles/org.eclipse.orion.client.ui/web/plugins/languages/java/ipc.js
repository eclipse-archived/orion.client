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
	
	var errorTypes = {
		1: 'error',
		2: 'warn',
		3: 'info'
	};
	/**
	 * The map of error types
	 */
	IPC.prototype.ERROR_TYPES = errorTypes; //TODO should be a clone not a live copy
	
	var messageTypes = {
		/**
		 * @description The initialize request is sent as the first request from the client to the server.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#initialize-request
		 */
		initialize: 'initialize',
		/**
		 * @description The shutdown request is sent from the client to the server. 
		 * It asks the server to shut down, but to not exit (otherwise the response might not be delivered correctly to the client). 
		 * There is a separate exit notification that asks the server to exit.
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
		 * @description The show message request is sent from a server to a client to ask the client to display a particular message in the user interface. 
		 * In addition to the show message notification the request allows to pass actions and to wait for an answer from the client.
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
		 * @description The workspace symbol request is sent from the client to the server to list project-wide symbols matching the query string.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#workspace-symbols
		 */
		workspaceSymbol: 'workspace/symbol',
		/**
		 * @description The code action request is sent from the client to the server to compute commands for a given text document and range. 
		 * The request is triggered when the user moves the cursor into a problem marker in the editor or presses the lightbulb associated with a marker.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#code-action
		 */
		codeAction: 'textDocument/codeAction',
		/**
		 * @description The code lens request is sent from the client to the server to compute code lenses for a given text document.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#code-lens
		 */
		codeLens: 'textDocument/codeLens',
		/**
		 * @description The Completion request is sent from the client to the server to compute completion items at a given cursor position. 
		 * Completion items are presented in the IntelliSense user interface. If computing full completion items is expensive, 
		 * servers can additionally provide a handler for the completion item resolve request. This request is sent when a completion item is selected in the user interface.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#completion-request
		 */
		completion: 'textDocument/completion',
		/**
		 * @description The goto definition request is sent from the client to the server to resolve the definition location of a symbol at a given text document position.
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
		 * @description The document highlight request is sent from the client to the server to resolve a document highlights for a given text document position.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#document-highlights
		 */
		documentHighlight: 'textDocument/documentHighlight',
		/**
		 * @description The document symbol request is sent from the client to the server to list all symbols found in a given text document.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#document-symbols
		 */
		documentSymbol: 'textDocument/documentSymbol',
		/**
		 * @description The document formatting request is sent from the server to the client to format a whole document.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#document-formatting
		 */
		formatting: 'textDocument/formatting',
		/**
		 * @description The hover request is sent from the client to the server to request hover information at a given text document position.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#hover
		 */
		hover: 'textDocument/hover',
		/**
		 * @description The document on type formatting request is sent from the client to the server to format parts of the document during typing.
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
		 * @description The document range formatting request is sent from the client to the server to format a given range in a document.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#document-range-formatting
		 */
		rangeFormatting: 'textDocument/rangeFormatting',
		/**
		 * @description The references request is sent from the client to the server to resolve project-wide references for the symbol denoted by the given text document position.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#find-references
		 */
		references: 'textDocument/references',
		/**
		 * @description The rename request is sent from the client to the server to perform a workspace-wide rename of a symbol.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#rename
		 */
		rename: 'textDocument/rename',
		/**
		 * @description The signature help request is sent from the client to the server to request signature information at a given cursor position.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#signature-help
		 */
		signatureHelp: 'textDocument/signatureHelp',
		/**
		 * @description The request is sent from the client to the server to resolve additional information for a given completion item.
		 * @kind request
		 * @see https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md#completion-item-resolve-request
		 */
		completionItemResolve: 'completionItem/resolve',
		/**
		 * @description The code lens resolve request is sent from the client to the server to resolve the command for a given code lens item.
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
	IPC.prototype.MESSAGE_TYPES = messageTypes; //TODO should be a clone, not a live copy
	
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
				var json  = JSON.parse(data);
				this.workspaceDir = json.workspaceDir;
				pid = json.processId;
			} catch(err) {
				_notifyListeners(this.listeners, messageTypes.logMessage, err.toString());
			}
			this.initialize(pid, this.workspaceDir).then(/* @callback */ function initializeCallback(result) {
				this.initialized = true;
				this.capabilities = result.capabilities;
				this.queue.forEach(function queueFlushCallback(item) {
					this.socket.emit('data', item);
					_notifyListeners(this.listeners, messageTypes.logMessage, JSON.stringify(item));
				}.bind(this));
				this.queue = [];
			}.bind(this));
		}.bind(this));
	};
	
	/**
	 * @name IPC.prototype.initialize
	 * @description The initialize request is sent as the first request from the client to the server.
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
	 * @description The document open notification is sent from the client to the server to signal newly opened text documents. 
	 * The document's truth is now managed by the client and the server must not try to read the document's truth using the document's uri.
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
	 * @description The document close notification is sent from the client to the server when the document got closed in the client. 
	 * The document's truth now exists where the document's uri points to (e.g. if the document's uri is a file uri the truth now exists on disk).
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
	 * @description The document save notification is sent from the client to the server when the document was saved in the client.
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
	 * @description The document change notification is sent from the client to the server to signal changes to a text document. 
	 * In 2.0 the shape of the params has changed to include proper version numbers and language ids.
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
	 * @description The document highlight request is sent from the client to the server to resolve a document highlights for a given text document position.
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
	 * @description The Completion request is sent from the client to the server to compute completion items at a given cursor position. 
	 * Completion items are presented in the IntelliSense user interface. If computing full completion items is expensive, servers can additionally provide a handler for the completion item resolve request. 
	 * This request is sent when a completion item is selected in the user interface.
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
	
	/**
	 * @name IPC.prototype.hover
	 * @description The hover request is sent from the client to the server to request hover information at a given text document position.
	 * @function
	 * @param {String} uri The URI of the file
	 * @param {{line: number, character: number}} offset The offset into the file to hover at
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.hover = function hover(uri, position) {
		return this.sendMessage(this.id++, messageTypes.hover, {
				position: position, 
				textDocument: {
					uri: uri,
				}
		});
	};
	
	/**
	 * @name IPC.prototype.documentSymbol
	 * @description The document symbol request is sent from the client to the server to list all symbols found in a given text document.
	 * @function
	 * @param {String} uri The URI for the file to find symbols in
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.documentSymbol = function documentSymbol(uri) {
		return this.sendMessage(this.id++, messageTypes.documentSymbol, {
				textDocument: {
					uri: uri,
				}
		});
	};
	
	/**
	 * @name IPC.prototype.formatDocument
	 * @description The document formatting request is sent from the server to the client to format a whole document.
	 * @function
	 * @param {String} uri The URI for the file to find symbols in
	 * @param {FormattingOptions} options the formatting options
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.formatDocument = function formatDocument(uri, options) {
		return this.sendMessage(this.id++, messageTypes.formatting, {
				textDocument: {
					uri: uri,
				},
				options: options
		});
	};
	
	/**
	 * @name IPC.prototype.codeLens
	 * @description The code lens request is sent from the client to the server to compute code lenses for a given text document.
	 * @function
	 * @param {String} uri The URI to request the lens within
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.codeLens = function codeLens(uri) {
		return this.sendMessage(this.id++, messageTypes.codeLens, {
				textDocument: {
					uri: uri
				}
		});
	};
	
	/**
	 * @name IPC.prototype.references
	 * @description The references request is sent from the client to the server to resolve project-wide references for the symbol denoted by the given text document position.
	 * @function
	 * @param {String} uri The URI to request the references from
	 * @param {{line: number, character: number}} offset The offset into the file to compute references for
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.references = function references(uri, position) {
		return this.sendMessage(this.id++, messageTypes.references, {
				position: position,
				textDocument: {
					uri: uri
				}
		});
	};
	
	/**
	 * @name IPC.prototype.references
	 * @description The goto definition request is sent from the client to the server to resolve the definition location of a symbol at a given text document position.
	 * @function
	 * @param {String} uri The URI to request the definition from
	 * @param {{line: number, character: number}} offset The offset into the file to compute the definition for
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.definition = function definition(uri, position) {
		return this.sendMessage(this.id++, messageTypes.definition, {
				position: position,
				textDocument: {
					uri: uri
				}
		});
	};
	
	/**
	 * @name IPC.prototype.shutdown
	 * @description The shutdown request is sent from the client to the server. It asks the server to shut down, but to not exit (otherwise the response might not be delivered correctly to the client). 
	 * There is a separate exit notification that asks the server to exit.
	 * @function
	 * @returns {Deferred} The deferred to return the results of the request. In this case the result is always undefined.
	 */
	IPC.prototype.shutdown = function shutdown() {
		return this.sendMessage(this.id++, messageTypes.shutdown, {
		});
	};
	
	/**
	 * @name IPC.prototype.showMessageRequest
	 * @description The show message request is sent from a server to a client to ask the client to display a particular message in the user interface. 
	 * In addition to the show message notification the request allows to pass actions and to wait for an answer from the client.
	 * @function
	 * @param {number} type The type of the message {@see #messageTypes}
	 * @param {String} message The message to send
	 * @param {Array.<String>} actions Ant command actions to be processed
	 * @returns {Deferred} The deferred to return the results of the request. In this case the result is always undefined.
	 */
	IPC.prototype.showMessageRequest = function showMessageRequest(type, message, actions) {
		return this.sendMessage(this.id++, messageTypes.showMessageRequest, {
				type: type,
				message: message,
				actions: actions
		});
	};
	
	/**
	 * @name IPC.prototype.workspaceSymbol
	 * @description The workspace symbol request is sent from the client to the server to list project-wide symbols matching the query string.
	 * @function
	 * @param {String} query The string query
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.workspaceSymbol = function workspaceSymbol(query) {
		return this.sendMessage(this.id++, messageTypes.workspaceSymbol, {
				query: query
		});
	};
	
	/**
	 * @name IPC.prototype.codeAction
	 * @description The code action request is sent from the client to the server to compute commands for a given text document and range. 
	 * The request is triggered when the user moves the cursor into a problem marker in the editor or presses the lightbulb associated with a marker.
	 * @function
	 * @param {String} uri The URI of the file
	 * @param {{line:number, character:number}} start The start position
	 * @param {{line:number, character:number}} end The end position
	 * @param {Array.<{}>} diagnostics The array of diagnostic objects
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.codeAction = function codeAction(uri, start, end, diagnostics) {
		return this.sendMessage(this.id++, messageTypes.workspaceSymbol, {
				textDocument: {
					uri: uri
				},
				range: {
					start: start,
					end: end
				},
				context: {
					diagnostics: diagnostics
				}
		});
	};
	
	/**
	 * @name IPC.prototype.onTypeFormatting
	 * @description The document on type formatting request is sent from the client to the server to format parts of the document during typing.
	 * @function
	 * @param {String} uri The URI of the file
	 * @param {{line:number, character:number}} position The position of the edit
	 * @param {string} char The character typed
	 * @param {?} options The formatting options
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.onTypeFormatting = function onTypeFormatting(uri, position, char, options) {
		return this.sendMessage(this.id++, messageTypes.onTypeFormatting, {
					textDocument: {
						uri: uri
					},
					position: position,
					char: char,
					options: options
		});
	};
	
	/**
	 * @name IPC.prototype.rangeFormatting
	 * @description The document range formatting request is sent from the client to the server to format a given range in a document.
	 * @function
	 * @param {String} uri The URI of the file
	 * @param {{line:number, character:number}} start The start position
	 * @param {{line:number, character:number}} end The end position
	 * @param {?} options The formatting options
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.rangeFormatting = function rangeFormatting(uri, start, end, options) {
		return this.sendMessage(this.id++, messageTypes.rangeFormatting, {
				textDocument: {
					uri: uri
				},
				range: {
					start: start,
					end: end
				},
				options: options
		});
	};
	
	/**
	 * @name IPC.prototype.codLensResolve
	 * @description he code lens resolve request is sent from the client to the server to resolve the command for a given code lens item.
	 * @function
	 * @param {?} codeLens The result froma codeLens request
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.codLensResolve = function codeLensResolve(codeLens) {
		return this.sendMessage(this.id++, messageTypes.codeLensResolve, {
				codeLens: codeLens
		});
	};
	
	/**
	 * @name IPC.prototype.rename
	 * @description The rename request is sent from the client to the server to perform a workspace-wide rename of a symbol.
	 * @function
	 * @param {String} uri The URI of the file
	 * @param {{line:number, character:number}} position The position in the editor to invoke the rename from
	 * @param {String} newName The new name to set
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.rename = function rename(uri, position, newName) {
		return this.sendMessage(this.id++, messageTypes.rename, {
				textDocument: {
					uri: uri
				},
				position: position,
				newName: newName
		});
	};
	
	/**
	 * @name IPC.prototype.signatureHelp
	 * @description The signature help request is sent from the client to the server to request signature information at a given cursor position.
	 * @function
	 * @param {String} uri The URI of the file
	 * @param {{line:number, character:number}} position The position in the editor
	 * @param {Array.<String>} signatures
	 * @param {String} activeSignature
	 * @param {String} activeParameter
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.signatureHelp = function signatureHelp(uri, position, signatures, activeSignature, activeParameter) {
		return this.sendMessage(this.id++, messageTypes.signatureHelp, {
				textDocument: {
					uri: uri,
					position: position
				},
				signatures: signatures,
				activeSignature: activeSignature,
				activeParameter: activeParameter
		});
	};
	
	/**
	 * @name IPC.prototype.completionItemResolve
	 * @description The request is sent from the client to the server to resolve additional information for a given completion item.
	 * @function
	 * @param {?} completionItem A completion item response from a completion request
	 * @returns {Deferred} The deferred to return the results of the request
	 */
	IPC.prototype.completionItemResolve = function completionItemResolve(completionItem) {
		this.sendMessage(this.id++, messageTypes.completionItemResolve, {
				completionItem: completionItem
		});
	};
	return IPC;
});