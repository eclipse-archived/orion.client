/*******************************************************************************
 * @license
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

'use strict';

var config = require('./config');
var express = require('express');
var http = require('http');
var jwt = require('jsonwebtoken');
var SessionManager = require('./session_manager');
var url = require('url');
var ws = require('ws');

var JWT_SECRET = config.jwt_secret;

var app = express();
var server = http.createServer(app);
var wss = new ws.Server({
    server: server
});
var sessions = new SessionManager();

wss.on('connection', function(ws) {
    // Get session ID
    var sessionId = url.parse(ws.upgradeReq.url).pathname.substr(1);

    /**
     * Handle the initial message (authentication)
     * Once this client is authenticated, assign it to a session.
     */
    ws.on('message', function initMsgHandler(msg) {
        try {
            var msgObj = JSON.parse(msg);
            if (msgObj.type !== 'authenticate') {
                throw new Error('Not authenticated.');
            }

            // Authenticate
            if (!msgObj.token) {
                throw new Error('No token is specified.');
            }
            var user = jwt.verify(msgObj.token, JWT_SECRET);

            // Give the control to a session
            sessions.addConnection(sessionId, ws, msgObj.clientId, user.username).then(function() {
                ws.removeListener('message', initMsgHandler);
                ws.send(JSON.stringify({ type: 'authenticated' }));
            }).catch(function(err) {
                ws.send(JSON.stringify({ type: 'error', error: err }));
            });
        } catch (ex) {
            ws.send(JSON.stringify({
                type: 'error',
                message: ex.message
            }));
        }
    });
});

app.get('/', function(req, res, next) {
    res.statusCode = 200;
    res.write('OK');
    res.end();
});

app.use(function(req, res, next) {
    res.statusCode = 404;
    res.write('Not found');
    res.end();
});

app.use(function(err, req, res, next) {
    res.statusCode = 500;
    res.write('Internal error');
    console.error(err);
    res.end();
});

var host = process.env.HOST || '0.0.0.0';
var port = process.env.PORT || 8082;

server.listen(port, host, function () {
    console.log('Collab Socket server is running on ' + host + ':' + port + '.');
});
