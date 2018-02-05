var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var GracefulCluster = module.exports;

/*

 Starts node.js cluster with graceful restart/shutdown.

 Params:

 - options.serverFunction        - required, function with worker logic.
 - options.log                   - function, custom log function, console.log used by default.
 - options.shutdownTimeout       - ms, force worker shutdown on SIGTERM timeout.
 - options.disableGraceful       - disable graceful shutdown for faster debug.
 - options.restartOnMemory       - bytes, restart worker on memory usage.
 - options.restartOnTimeout      - ms, restart worker by timer.
 - options.workersCount          - workers count, if not specified `os.cpus().length` will be used.

 Graceful restart performed by USR2 signal:

 pkill -USR2 <cluster_process_name>

 or

 kill -s SIGUSR2 <cluster_pid>

 */
GracefulCluster.start = function(options) {

    var serverFunction = options.serverFunction;

    if (!serverFunction) {
        throw new Error('Graceful cluster: `options.serverFunction` required.');
    }

    var exitFunction = options.exitFunction || (function gracefulClusterExit () { process.exit(0); });
    var log = options.log || console.log;
    var shutdownTimeout = options.shutdownTimeout || 5000;
    var disableGraceful = options.disableGraceful;
    var workersCount = options.workersCount || numCPUs;

    if (cluster.isMaster) {

        var currentRestartingPid = null;
        var currentWorkersCount = 0;
        var listeningWorkersCount = 0;
        var restartQueue = [];
        var shutdownTimer = null;
        var sigkill = false;

        // Prevent killing all workers at same time when restarting.
        function checkRestartQueue() {
            // Kill one worker only if maximum count are working.
            if (restartQueue.length > 0 && listeningWorkersCount === workersCount && !currentRestartingPid) {
                var pid = restartQueue.shift();
                try {
                    // Store process id to wait for its finish.
                    currentRestartingPid = pid;
                    // Send SIGTERM signal to worker. SIGTERM starts graceful shutdown of worker inside it.
                    process.kill(pid);

                } catch(ex) {

                    // Reset current pid.
                    currentRestartingPid = null;

                    // If no process killed, try next in queue.
                    process.nextTick(checkRestartQueue);

                    // Fail silent on 'No such process'. May occur when kill message received after kill initiated but not finished.
                    if (ex.code !== 'ESRCH') {
                        throw ex;
                    }
                }
            }
        }

        // Create fork with 'on restart' message event listener.
        function fork() {
            cluster.fork().on('message', function(message) {
                if (message.cmd === 'restart' && message.pid && restartQueue.indexOf(message.pid) === -1) {
                    // When worker asks to restart gracefully in cluster, then add it to restart queue.
                    log('Cluster graceful shutdown: queued. pid=' + message.pid);
                    restartQueue.push(message.pid);
                    checkRestartQueue();
                }
            });
        }

        // Fork workers.
        for (var i = 0; i < workersCount; i++) {
            fork();
        }

        // Check if has alive workers and exit.
        function checkIfNoWorkersAndExit() {
            if (!currentWorkersCount) {
                log('Cluster graceful shutdown: done.');
                if (shutdownTimer) clearTimeout(shutdownTimer);
                exitFunction();
            } else {
                log('Cluster graceful shutdown: wait ' + currentWorkersCount + ' worker' + (currentWorkersCount > 1 ? 's' : '') + '.');
            }
        }

        function startShutdown() {

            if (disableGraceful) {
                if (shutdownTimer) clearTimeout(shutdownTimer);
                exitFunction();
                return;
            }

            // Log how many workers alive.
            checkIfNoWorkersAndExit();

            if (sigkill) {
                process.exit(130);
                return;
            }

            // Shutdown timeout.
            shutdownTimer = setTimeout(function() {
                log('Cluster graceful shutdown: timeout, force exit.');
                exitFunction();
            }, shutdownTimeout);

            // Shutdown mode.
            sigkill = true;

            for (var id in cluster.workers) {
                // Send SIGTERM signal to all workers. SIGTERM starts graceful shutdown of worker inside it.
                process.kill(cluster.workers[id].process.pid);
            }
        }
        process.on('SIGTERM',startShutdown);
        process.on('SIGINT',startShutdown);

        // Gracefuly restart with 'kill -s SIGUSR2 <pid>'.
        process.on('SIGUSR2',function() {
            for (var id in cluster.workers) {
                // Push all workers to restart queue.
                var pid = cluster.workers[id].process.pid;
                if (restartQueue.indexOf(pid) === -1) {
                    restartQueue.push(pid);
                }
            }
            checkRestartQueue();
        });

        cluster.on('fork', function(worker) {
            currentWorkersCount++;
            worker.on('listening', function() {
                listeningWorkersCount++;
                // New worker online, maybe all online, try restart other.
                checkRestartQueue();
            });
            log('Cluster: worker ' + worker.process.pid + ' started.');
        });

        cluster.on('exit', function(worker, code, signal) {

            // Mark process finished.
            if (currentRestartingPid === worker.process.pid) {
                currentRestartingPid = null;
            }

            currentWorkersCount--;
            listeningWorkersCount--;
            if (sigkill) {
                checkIfNoWorkersAndExit();
                return;
            }
            log('Cluster: worker ' + worker.process.pid + ' died (code: ' + code + '), restarting...');
            fork();
        });

        process.on('uncaughtException', function(err) {
            if (disableGraceful) {
                log('Cluster error:', err.stack);
            } else {
                log('Cluster error:', err.message);
            }
        });

    } else {

        // Start worker.
        serverFunction();

        // Self restart logic.

        if (options.restartOnMemory) {
            setInterval(function() {
                var mem = process.memoryUsage().rss;
                if (mem > options.restartOnMemory) {
                    log('Cluster: worker ' + process.pid + ' used too much memory (' + Math.round(mem / (1024*1024)) + ' MB), restarting...');
                    GracefulCluster.gracefullyRestartCurrentWorker();
                }

            }, 1000);
        }

        if (options.restartOnTimeout) {

            setInterval(function() {

                log('Cluster: worker ' + process.pid + ' restarting by timer...');
                GracefulCluster.gracefullyRestartCurrentWorker();

            }, options.restartOnTimeout);
        }
    }
};

GracefulCluster.gracefullyRestartCurrentWorker = function() {
    // Perform restart by cluster to prevent all workers offline.
    process.send({
        cmd: 'restart',
        pid: process.pid
    });
};
