/*eslint-env amd, browser*/
define([
	"orion/Deferred",
	"/socket.io/socket.io.js",
], function(Deferred, io) {
	
	var handlers = Object.create(null);
	
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
		this.listeners = [];
	}
	
	IPC.prototype.sendMessage = function sendMessage(id, message, params) {
		var json = {
            "jsonrpc": "2.0",
            "method": message, 
            "params": params
        };
        if (id) {
        	json.id = id;
        }
        if(!this.initialized && message !== 'initialize') {
			this.queue.push(json);
		} else {
	        this.socket.emit('data', json);
	    }
	    if (id) {
	        return this.requests[id] = new Deferred();
	    }
	};
	
	IPC.prototype.addListener = function addListener(listener) {
		this.listeners.push(listener);
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
				if(typeof data === 'object' && data !== null) {
					console.log(JSON.stringify(data));
				} else if(typeof data === 'string') {
					console.log(data);
				}

				if (data.id) {
					var deferred = this.requests[data.id];
					if(deferred) {
						deferred.resolve(data.result);
						delete this.requests[data.id];
					}
				} else {
					this.listeners.forEach(function(l) {
						l.handleNotification(data);
					});
				}
			} catch(err) {
				console.log(err);
				//TODO call handler for errors					
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
				console.log(err);
			}
			this.initialize(pid, this.workspaceDir).then(function(result) {
				this.initialized = true;
				this.queue.forEach(function(item) {
					console.log(JSON.stringify(item));
					this.socket.emit('data', item);
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};
	
	/**
	 * @name handlers.initialize
	 * @description Sends an initialize request
	 * @param {String} processId The id of the process
	 * @param {String} workspaceDir The root of the current workspace 
	 * @function
	 * @returns {Deferred} The deferred that resolves to the result of the request
	 */
	IPC.prototype.initialize = function initialize(processId, workspaceDir) {
		return this.sendMessage(this.id++, 'initialize', {
			rootPath: workspaceDir,
			processId: processId
		});
	};
	
	/**
	 * @name IPC.prototype.didOpen
	 * @description Sends a didOpen request
	 * @function
	 * @param {String} uri The URI of the file
	 * @param {String} languageId The content type of the source
	 * @param {String} text The optional current source code
	 * @returns {Deferred} The deferred that resolves to the result of the request
	 */
	IPC.prototype.didOpen = function didOpen(uri, languageId, text) {
		return this.sendMessage(0, 'textDocument/didOpen', {
			textDocument: {
				uri: uri,
				languageId: languageId,
				version: 1,
				text: text
			}
		});
	};
	
	return IPC;
});