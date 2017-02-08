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

/*eslint-env browser, amd */
/* Initializes websocket connection */

define(['orion/EventTarget'], function(EventTarget) {
    'use strict;'

    var HUB_URL = "ws://localhost:8082/";
    var DEBUG = false;

    /**
     * Collab socket client
     * 
     * @class
     * @constructor
     * 
     * @param {string} sessionId
     */
	function CollabSocket(sessionId) {
        var self = this;

        this.socket = new WebSocket(HUB_URL + sessionId);

        this.socket.onopen = function() {
            self.dispatchEvent({
                type: 'ready'
            });
        };

        this.socket.onclose = function() {
            self.dispatchEvent({
                type: 'close'
            });
        };

        this.socket.onerror = function(e) {
            self.dispatchEvent({
                type: 'error',
                error: e
            });
            console.error(e);
        };

        this.socket.onmessage = function(e) {
            self.dispatchEvent({
                type: 'message',
                data: e.data
            });
            if (DEBUG) {
                var msgObj = JSON.parse(e.data);
                console.log('CollabSocket In: ' + msgObj.type, msgObj);
            }
        };

        EventTarget.attach(this);
	}

	CollabSocket.prototype.constructor = CollabSocket;

    /**
     * Send message
     * 
     * @param {string} message
     */
    CollabSocket.prototype.send = function(message) {
        this.socket.send(message);
        if (DEBUG) {
            var msgObj = JSON.parse(message);
            console.log('CollabSocket Out: ' + msgObj.type, msgObj);
        }
    };

    /**
     * Close this socket
     */
    CollabSocket.prototype.close = function() {
        this.socket.close();
    };

	return {
        CollabSocket: CollabSocket
    };
});
