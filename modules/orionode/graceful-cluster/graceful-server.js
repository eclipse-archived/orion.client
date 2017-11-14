var EventEmitter = require('events').EventEmitter;

var GracefulServer = function(options) {

    this.server = options.server;

    if (!this.server) {
        throw new Error('Graceful shutdown: `options.server` required.');
    }

    this.log = options.log || console.log;
    this.shutdownTimeout = options.shutdownTimeout || 5000;
    this._shutdownTimer = null;
    this._exitFunction = options.exitFunction || (function gracefulClusterExit (code) { process.exit(code || 0); });

    // Solution got from: https://github.com/nodejs/node-v0.x-archive/issues/9066#issuecomment-124210576

    var state = this.state = new EventEmitter;
    state.setMaxListeners(0);
    state.shutdown = false;

    this.REQUESTS_COUNT = 0;

    var that = this;

    this.server.on('connection', function (socket) {
        function destroy() {
            if (socket._GS_HAS_OPEN_REQUESTS === 0) socket.destroy();
        }
        socket._GS_HAS_OPEN_REQUESTS = 0;
        state.once('shutdown', destroy);
        socket.once('close', function () {
            state.removeListener('shutdown', destroy);
        });
    });

    this.server.on('request', function (req, res) {
        var socket = req.connection;
        socket._GS_HAS_OPEN_REQUESTS++;
        that.REQUESTS_COUNT++;
        res.on('finish', function () {
            that.REQUESTS_COUNT--;
            if (state.shutdown) that.logShutdown();
            socket._GS_HAS_OPEN_REQUESTS--;
            if (state.shutdown && socket._GS_HAS_OPEN_REQUESTS === 0) socket.destroy();
        });
    });

    function shutdown() {
        that.shutdown();
    }
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
};

GracefulServer.prototype.logShutdown = function() {
    this.log('pid:' + process.pid + ' graceful shutdown: ' + (this.REQUESTS_COUNT ? 'wait ' + this.REQUESTS_COUNT + ' request' + (this.REQUESTS_COUNT > 1 ? 's': '') + ' to finish.' : 'no active connections.'));
};

GracefulServer.prototype.shutdown = function() {

    this.logShutdown();

    if (this.state.shutdown) {
        // Prevent repeat shutdown.
        return;
    }

    var that = this;

    this._shutdownTimer = setTimeout(function() {
        that.log('pid:' + process.pid + ' graceful shutdown: timeout, force exit.');
        that._exitFunction(1);
    }, this.shutdownTimeout);

    this.server.close(function() {
        that.log('pid:' + process.pid + ' graceful shutdown: done.');
        if (that._shutdownTimer) clearTimeout(that._shutdownTimer);
        that._exitFunction(0);
    });

    this.state.shutdown = true;
    this.state.emit('shutdown');
};

module.exports = GracefulServer;