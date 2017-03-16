/*******************************************************************************
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/

'use strict';

var config = require('./config');
var logger = require('./lib/logger');
var AdapterManager = require('./lib/adapterManager');
var http = require('http');
var path = require('path');
var fs = require('fs');

var CONNECTION_TIMEOUT = 10000;

/**
 * Install endpoints
 * 
 * @param {Express} options.app
 * @param {SocketIO.Server} options.io
 * @param {string} [options.listenPath]
 * @param {string} [options.workspaceDir]
 * @return {boolean} success
 */
function install(options) {
    try {
        require('express');
    } catch (ex) {
        return false;
    }
    var app = options.app;
    var io = options.io;
    var workspaceDir = options.workspaceDir;
    var listenPath = options.listenPath ? options.listenPath : '';

    /** @type {Map.<string, DebugAdapter>} */
    var adapterPool = new Map();

    // Streaming files from debug adapters
    app.use(listenPath + '/debug/file', require('./lib/debugFile')(adapterPool));

    // Get workspace path of the Orion user when this debug server runs as a module of Orionode)
    app.get(listenPath + '/debug/workspacePath', function(req, res) {
        if (req.user && workspaceDir) {
            var fullWorkspace;
            if (req.user.workspace) {
                fullWorkspace = path.join(workspaceDir, req.user.workspace);
            } else {
                fullWorkspace = workspaceDir;
            }
            fs.realpath(fullWorkspace, function(err, realWorkspace) {
                if (err) {
                    res.send(fullWorkspace);
                } else {
                    res.send(realWorkspace);
                }
            })
        } else {
            res.sendStatus(204);
        }
    });

    // Get all available adapter types
    app.get(listenPath + '/debug/adapterTypes', function(req, res) {
        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify(AdapterManager.types))
    });

    // Get the list of template of a specific adapter
    app.get(listenPath + '/debug/templates/:type', function(req, res) {
        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify(AdapterManager.getTemplates(req.params.type)));
    });

    // Main logic
    io.of('/debug')
    .on('connection', function(socket) {
        var connectionId;
        do {
            connectionId = Math.floor((Math.random() * 0x1000000)).toString(16);
        } while (adapterPool.has(connectionId));
        var adapter = null;

        socket.emit('idle');

        logger.log('Socket ' + connectionId + ' connected.', logger.MessageType.VERBOSE);

        socket.on('disconnect', function() {
            logger.log('Socket ' + connectionId + ' disconnected.', logger.MessageType.VERBOSE);
            if (adapter) {
                adapter.dispose();
            }
        });

        socket.on('init', function(request, callback) {
            try {
                // Initialize new adapter
                adapter = AdapterManager.createAdapter(request.arguments.adapterID);
                adapterPool.set(connectionId, adapter);
                adapter.on('request', function (request) {
                    socket.emit('request', request, function(response) {
                        adapter.sendResponse(reponse);
                    });
                });

                adapter.on('event', function (event) {
                    socket.emit('event', event);
                });

                adapter.on('disposed', function() {
                    adapter = null;
                    adapterPool.delete(connectionId);
                    socket.emit('idle');
                    logger.log(request.arguments.adapterID + ' adapter ended for ' + connectionId + '.', logger.MessageType.VERBOSE);
                });

                // Send launch command
                adapter.sendRequest(request.command, request.arguments, CONNECTION_TIMEOUT, function(response) {
                    if (response.success) {
                        socket.emit('ready', connectionId);
                    }
                    if (callback) {
                        callback(response);
                    }
                })

                logger.log(request.arguments.adapterID + ' adapter started for ' + connectionId + '.', logger.MessageType.VERBOSE);
            } catch (ex) {
                socket.emit('fail', ex.message);
                adapter = null;
                adapterPool.delete(connectionId);
            }
        });

        socket.on('request', function(request, callback) {
            if (!adapter) {
                socket.emit('fail', 'Not ready yet.');
                return;
            }
            try {
                adapter.sendRequest(request.command, request.arguments, CONNECTION_TIMEOUT, function(response) {
                    if (callback) {
                        callback(response);
                    }
                });
            } catch (ex) {
                socket.emit('fail', ex.message);
            }
        });

        socket.on('event', function(event) {
            adapter.sendEvent(event);
        });
    });

    return true;
}

module.exports.install = install;
