/*eslint-env amd, browser*/
define([
	"orion/Deferred",
	"/socket.io/socket.io.js",
], function(Deferred, io) {
	
	var handlers = Object.create(null),
		headerRegex = /([^:]*):\s?([^\r]*)/gi;
	
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
		this.id = 0;
		this.requests = {};
		this.initialized = false;
		this.queue = [];
	}
	
	IPC.prototype.sendMessage = function sendMessage(message, params) {
		var _id = this.id++;
		var json = JSON.stringify({
            "jsonrpc": "2.0",
            "id": _id,
            "method": message, 
            "params": params
        });
        if(!this.initialized && message !== 'initialize') {
			this.queue.push("Content-Length: " + json.length + "\r\n\r\n" + json);
		} else {
	        this.socket.emit('data', "Content-Length: " + json.length + "\r\n\r\n" + json);
	    }
        return this.requests[_id] = new Deferred();
	};
	
	IPC.prototype.addListener = function addListener(listener) {
		
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
			var c = parseMessage(data);
			if(c) {
				try {
					var json  = JSON.parse(c.content);
					var deferred = this.requests[json.id];
					if(deferred) {
						deferred.resolve(json.result);
						delete this.requests[json.id];
					}
				} catch(err) {
					console.log(err);
					//TODO call handler for errors					
				}
			}
		}.bind(this));
		this.socket.on('ready', function(data) {
			var pid;
			try {
				var json  = JSON.parse(data);
				this.workspaceDir = json.workspaceDir;
				pid = json.processId;
			} catch(err) {
				console.log(err);
			}
			this.initialize(pid, this.workspaceDir).then(function(result) {
				this.initialized = true;
				this.queue.forEach(function(item) {
					this.socket.emit('data', item);
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};
	
	function parseMessage(arr) {
		try {
			var message = Object.create(null);
			message.headers = Object.create(null);
			var a = new Uint8Array(arr);
			for(var i = 0, len = a.length; i < len; i++) {
				if(a[i] === 13) {
					if(i+3 < len && a[i+1] === 10 && a[i+2] === 13 && a[i+3] === 10) {
						var dv = new DataView(arr, 0, i+2);
						var s = new TextDecoder('utf8').decode(dv);
						var heads;
						while((heads = headerRegex.exec(s)) !== null) {
							message.headers[heads[1]] = heads[2];
						}
						break;
					}
				}			
			}
			if(i+3 < a.length && message.headers['Content-Length']) {
				var c = new DataView(arr, i+4, Number(message.headers['Content-Length']));
				message.content = new TextDecoder('utf8').decode(c);
			}
				console.log("BAD=" + new TextDecoder('utf8').decode(new DataView(arr)));
			if (!Object.keys(message.headers).length) {
				
				return null;
			}
			return message;
		}
		catch(err) {
			console.log(err);
		}
		return null;
	}

	/**
	 * @name handlers.initialize
	 * @description Sends an initialize request
	 * @param {String} processId The id of the process
	 * @param {String} workspaceDir The root of the current workspace 
	 * @function
	 * @returns {Deferred} The deferred that resolves to the result of the request
	 */
	IPC.prototype.initialize = function initialize(processId, workspaceDir) {
		return this.sendMessage('initialize', {
			rootPath: workspaceDir,
			processId: processId
		});
	};
	
	function getUri(workspaceDir, loc) {
		return "file:///" + workspaceDir.replace(/\\/g, "/") + loc.replace(/^\/file/, '');
	}
	
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
		return this.sendMessage('textDocument/didOpen', {
			textDocument: {
				uri: getUri(this.workspaceDir, uri),
				languageId: languageId,
				version: 1,
				text: text
			}
		});
	};
	
	return IPC;
});