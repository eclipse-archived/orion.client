/*******************************************************************************
 * @license
 * Copyright (c) 2016, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd */
define(['orion/editor/annotations', 'orion/collab/ot', 'orion/webui/treetable',
	'orion/collab/collabFileAnnotation', 'orion/collab/otAdapters', 'orion/collab/collabPeer',
	'orion/collab/collabSocket'],
	function(mAnnotations, ot, mTreeTable, mCollabFileAnnotation, mOtAdapters, mCollabPeer, mCollabSocket) {

    'use strict';

	var CollabFileAnnotation = mCollabFileAnnotation.CollabFileAnnotation;
	var OrionCollabSocketAdapter = mOtAdapters.OrionCollabSocketAdapter;
	var OrionTogetherJSAdapter = mOtAdapters.OrionTogetherJSAdapter;
	var OrionTogetherJSDelayAdapter = mOtAdapters.OrionTogetherJSDelayAdapter;
	var OrionEditorAdapter = mOtAdapters.OrionEditorAdapter;
	var CollabPeer = mCollabPeer.CollabPeer;

	var AT = mAnnotations.AnnotationType;
	
	// ms to delay updating collaborator annotation.
	// We need this delay because the annotation is updated asynchronizedly and is transferd in multiple
	// packages. We don't want the UI to refresh too frequently.
	var COLLABORATOR_ANNOTATION_UPDATE_DELAY = 200;

	/**
	 * Creates a new collaboration client.
	 * @class 
	 * @name orion.collabClient.CollabClient
	 */
	function CollabClient(editor, inputManager, fileClient, serviceRegistry) {
		this.editor = editor;
		this.inputManager = inputManager;
		this.fileClient = fileClient;
		this.textView = null;
		var self = this;
		this.collabMode = false;
		this.clientId = '';
		this.clientDisplayedName = '';
		this.fileClient.addEventListener('Changed', self.sendFileOperation.bind(self));
		this.serviceRegistry = serviceRegistry;
		this.editor.addEventListener('ModelLoaded', function(event) {self.viewInstalled.call(self, event);});
		this.editor.addEventListener('TextViewUninstalled', function(event) {self.viewUninstalled.call(self, event);});
		this.projectSessionID = '';
		this.inputManager.addEventListener('InputChanged', function(e) {
			if (e.metadata.Attributes) {
				var projectSessionID = e.metadata.Attributes.hubID;
				if (self.projectSessionID !== projectSessionID) {
					self.projectSessionID = projectSessionID;
					self.projectChanged(projectSessionID);
				}
			}
		});
		this.ot = null;
		this.otOrionAdapter = null;
		this.otSocketAdapter = null;
		window.addEventListener('hashchange', function() { self.onLocationChanged(); });
		this.awaitingClients = false;
		this.collabFileAnnotations = {};
		// Timeout id to indicate whether a delayed update has already been assigned
		this.collabFileAnnotationsUpdateTimeoutId = 0;
		/**
		 * A map of clientid -> peer
		 * @type {Object.<string, CollabPeer>}
		 */
		this.peers = {};
	}

	CollabClient.prototype = {

		/**
		 * getter of clientId
		 * @return {string}
		 */
		getClientId: function() {
			return this.clientId;
		},

		/**
		 * getter of clientDisplayedName
		 * @return {string}
		 */
		getClientDisplayedName: function() {
			return this.clientDisplayedName;
		},

		/**
		 * Initialize client name and id
		 * @param {function} callback
		 */
		initClientInfo: function(callback) {
			var self = this;
			var userService = this.serviceRegistry.getService("orion.core.user"); 
			var authServices = this.serviceRegistry.getServiceReferences("orion.core.auth");
			var authService = this.serviceRegistry.getService(authServices[0]);
			authService.getUser().then(function(jsonData) {
				userService.getUserInfo(jsonData.Location).then(function(accountData) {
					var username = accountData.UserName;
					self.clientDisplayedName = accountData.FullName || username;
					var MASK = 0xFFFFFF + 1;
					var MAGIC = 161803398 / 2 % MASK;
					self.clientId = username + '.' + (Date.now() % MASK * MAGIC % MASK).toString(16);
					callback();
				}).catch(function(err) {
					console.error(err);
				});
			});
		},

		/**
		 * Hash changed handler
		 */
		onLocationChanged: function() {
			this.updateSelfFileAnnotation();
			this.destroyOT();
			if (this.otSocketAdapter && this.otSocketAdapter.authenticated) {
				this.otSocketAdapter.sendLocation(this.currentDoc());
			}
		},

		/**
		 * Reset the record of collaborator file annotation and request to update UI
		 */
		resetCollabFileAnnotation: function() {
			this.collabFileAnnotations = {};
			this._requestFileAnnotationUpdate();
		},

		/**
		 * Add or update a record of collaborator file annotation and request to update UI
		 * 
		 * @param {string} clientId -
		 * @param {string} url -
		 */
		addOrUpdateCollabFileAnnotation: function(clientId, url) {
			url = this.maybeTransformLocation(url);
			var peer = this.getPeer(clientId);
			// Peer might be loading. Once it is loaded, this annotation will be automatically updated,
			// so we can safely leave it blank.
			var name = (peer && peer.name) ? peer.name : 'Unknown';
			var color = (peer && peer.color) ? peer.color : '#000000';
			this.collabFileAnnotations[clientId] = new CollabFileAnnotation(name, color, url, this.projectRelativeLocation(url));
			this._requestFileAnnotationUpdate();
		},

		/**
		 * Remove a collaborator's file annotation by id and request to update UI
		 * 
		 * @param {string} clientId -
		 */
		removeCollabFileAnnotation: function(clientId) {
			if (this.collabFileAnnotations.hasOwnProperty(clientId)) {
				delete this.collabFileAnnotations[clientId];
				this._requestFileAnnotationUpdate();
			}
		},

		/**
		 * Request a file annotation UI update
		 */
		_requestFileAnnotationUpdate: function() {
			var self = this;
			if (!this.collabFileAnnotationsUpdateTimeoutId) {
				// No delayed update is assigned. Assign one.
				// This is necessary because we don't want duplicate UI action within a short period.
				this.collabFileAnnotationsUpdateTimeoutId = setTimeout(function() {
					self.collabFileAnnotationsUpdateTimeoutId = 0;
					var annotations = [];
					for (var key in self.collabFileAnnotations) {
						if (self.collabFileAnnotations.hasOwnProperty(key)) {
							annotations.push(self.collabFileAnnotations[key]);
						}
					}
					self.fileClient.dispatchEvent({
						type: 'CollabChanged',
						annotations: annotations
					});
				}, COLLABORATOR_ANNOTATION_UPDATE_DELAY);
			}
		},

		/**
		 * Determine whether a client has a file annotation
		 * 
		 * @return {boolean} -
		 */
		collabHasFileAnnotation: function(clientId) {
			return !!this.collabFileAnnotations[clientId];
		},

		/**
		 * Get the client's file annotation
		 * 
		 * @return {CollabFileAnnotation} -
		 */
		getCollabFileAnnotation: function(clientId) {
			return this.collabFileAnnotations[clientId];
		},

		/**
		 * Update the current client's file annotation
		 */
		updateSelfFileAnnotation: function() {
			if (this.collabMode) {
				this.addOrUpdateCollabFileAnnotation(this.getClientId(), this.maybeTransformLocation('/file/' + this.currentDoc()));
			}
		},

		/**
		 * Add or update peer record
		 * 
		 * @param {CollabPeer} peer -
		 */
		addOrUpdatePeer: function(peer) {
			if (this.peers[peer.id]) {
				// Update
				this.peers[peer.id] = peer;
				if (this.collabHasFileAnnotation(peer.id)) {
					var annotation = this.getCollabFileAnnotation(peer.id);
					this.addOrUpdateCollabFileAnnotation(peer.id, annotation.location);
				}
				if (this.otOrionAdapter && this.textView) {
					// Make sure we have view installed
					this.otOrionAdapter.updateLineAnnotationStyle(peer.id);
				}
			} else {
				// Add
				this.peers[peer.id] = peer;
			}
		},

		/**
		 * Get peer by id
		 * 
		 * @return {CollabPeer} -
		 */
		getPeer: function(clientId) {
			return this.peers[clientId];
		},

		/**
		 * Get all peers
		 */
		getAllPeers: function(clientId) {
			return this.peers;
		},

		/**
		 * Remove a peer by its ID if it exists
		 * This method also removes all the removing client's annotation
		 */
		removePeer: function(clientId) {
			if (this.peers.hasOwnProperty(clientId)) {
				delete this.peers[clientId];
				this.removeCollabFileAnnotation(clientId);
			}
		},

		/**
		 * Remove all peers
		 */
		clearPeers: function() {
			this.peers = {};
		},

		startOT: function(revision, operation, clients) {
			if (this.ot) {
				this.otOrionAdapter.detach();
			}
			this.textView.getModel().setText(operation[0], 0);
			this.otOrionAdapter = new OrionEditorAdapter(this.editor, this, AT);
			this.ot = new ot.EditorClient(revision, clients, this.otSocketAdapter, this.otOrionAdapter, this.getClientId());
			// Give initial cursor position
			this.otOrionAdapter.onFocus();
			this.editor.markClean();
		},

		destroyOT: function() {
			if (this.ot && this.otOrionAdapter) {
				this.otOrionAdapter.detach();
				//reset to regular undo/redo behaviour
				this.editor.getTextActions().init();
				this.ot = null;
				if (this.otSocketAdapter) {
					var msg = {
				      'type': 'leave-document',
				      'clientId': this.getClientId()
				    };
					this.otSocketAdapter.send(JSON.stringify(msg));
				}
			}
		},

		currentDoc: function() {
			var workspace = this.getFileSystemPrefix();
			if (workspace !== '/file/') {
		        //get everything after 'workspace name'
		        return location.hash.substring(location.hash.indexOf(workspace) + workspace.length).split('/').slice(3).join('/');
			} else {
		        return location.hash.substring(location.hash.indexOf(workspace) + workspace.length, location.hash.length);
			}
		},

		getFileSystemPrefix: function() {
			return location.hash.indexOf('/sharedWorkspace') === 1 ? '/sharedWorkspace/tree/file/' : '/file/';
		},

		viewInstalled: function(event) {
			var self = this;
			var ruler = this.editor._annotationRuler;
			ruler.addAnnotationType(AT.ANNOTATION_COLLAB_LINE_CHANGED, 1);
			ruler = this.editor._overviewRuler;
			ruler.addAnnotationType(AT.ANNOTATION_COLLAB_LINE_CHANGED, 1);
			this.textView = this.editor.getTextView();
			if (this.otSocketAdapter) {
				this.otSocketAdapter.sendInit();
			}
		},

		viewUninstalled: function(event) {
			this.textView = null;
		},

		socketConnected: function() {
			var self = this;
			this.otSocketAdapter = new OrionCollabSocketAdapter(this, this.socket);
			//this.otSocketAdapter = new OrionTogetherJSDelayAdapter(this, session.channel, 2500);
			if (!this.clientId) {
				this.initClientInfo(function() {
					self.otSocketAdapter.authenticate();
				});
			} else {
				this.otSocketAdapter.authenticate();
			}
			this.inputManager.collabRunning = true;
		},

		socketDisconnected: function() {
			this.socket = null;
			this.otSocketAdapter = null;
			this.inputManager.collabRunning = false;
			this.destroyOT();
			this.resetCollabFileAnnotation();
		},

		projectChanged: function(projectSessionID) {
			var self = this;
			if (this.socket) {
				// Close the current session
				this.socket.close();
				setTimeout(function() {
					// Polling until 'close' event is triggered
					// 'close' event won't wait for any IO operations thus
					// this.socket should be null in the next event loop 
					self.projectChanged(projectSessionID);
				}, 0);
				return;
			}
			// Initialize collab socket
			if (projectSessionID) {
				this.socket = new mCollabSocket.CollabSocket(projectSessionID);
				this.socket.addEventListener('ready', function onReady() {
					self.socket.removeEventListener('ready', onReady);
					self.socketConnected();
				});
				this.socket.addEventListener('close', function onClose() {
					self.socket.removeEventListener('close', onClose);
					self.socketDisconnected();
				});
				this.collabMode = true;
			} else {
				this.collabMode = false;
			}
			this.clearPeers();
			this.resetCollabFileAnnotation();
		},

		sendFileOperation: function(evt) {
			if (!this.otSocketAdapter) return;
			if (!this.ignoreNextFileOperation) {
				var operation = evt.created ? 'created' : evt.moved ? 'moved' : evt.deleted ? 'deleted' : evt.copied ? 'copied' : '';
				if (operation) {
				    var msg = {
						'type': 'file-operation',
						'operation': operation,
						'data': evt[operation],
						'clientId': this.getClientId()
				    };
					this.otSocketAdapter.send(JSON.stringify(msg));
				}
			}
			this.ignoreNextFileOperation = false;
		},

		handleFileOperation: function(msg) {
			if (!this.ignoreNextFileOperation) {
				var evt = this.makeFileClientEvent(msg.operation, msg.data);
				this.dispatchFileClientEvent(evt);
			}
			this.ignoreNextFileOperation = false;
		},

		makeFileClientEvent: function(operation, data) {
			/**
			** we can't trigger the event directly since the user might be on a seperate file system.
			*/
			data = data[0];
			var evt = {
				type: "Changed"
			};

			var evtData = {'select': false};

			switch (operation) {
				case 'created':
					var parentLocation = this.maybeTransformLocation(data.parent);
					var result = data.result;
					if (result) {
						result.Parents = []; //is parents even needed for this operation?
						result.Location = this.maybeTransformLocation(result.Location);
					}
					evt.created = [{'parent': parentLocation, 'result': result, 'eventData': evtData}];
					break;
				case 'deleted':
					var deleteLocation = this.maybeTransformLocation(data.deleteLocation);
					evt.deleted = [{'deleteLocation': deleteLocation, 'eventData': evtData}];
					break;
				case 'moved':
					var sourceLocation = this.maybeTransformLocation(data.source);
					var targetLocation = this.maybeTransformLocation(data.target);
					var result = data.result;
					result.Parents = []; //is parents even needed for this operation?
					result.Location = this.maybeTransformLocation(result.Location);
					evt.moved = [{'source': sourceLocation, 'target': targetLocation, 'result': result, 'eventData': evtData}];
					break;
				case 'copied':
					var sourceLocation = this.maybeTransformLocation(data.source);
					var targetLocation = this.maybeTransformLocation(data.target);
					var result = data.result;
					result.Parents = []; //is parents even needed for this operation?
					result.Location = this.maybeTransformLocation(result.Location);
					evt.copied = [{'source': sourceLocation, 'target': targetLocation, 'result': result, 'eventData': evtData}];
					break;
			}

			return evt;
		},

		/**
		 * For example we potentially need to convert a '/file/web/potato.js' to '/sharedWorkspace/tree/file/web/potato.js'
		 * and vice-versa, depending on our file system and the sender's filesystem.
		 */
		maybeTransformLocation: function(Location) {
			var loc = this.getFileSystemPrefix();
			// if in same workspace
			if (Location.indexOf(loc) === 0) {
				return Location;
			} else {
				var oppositeLoc = loc == '/file/' ? '/sharedWorkspace/tree/file/' : '/file/';
				// we need to replace sharedWorkspace... with /file and vice versa.
				// we also need to replace workspace info for shared workspace or add it when its not the case.
				var file = Location.substring(oppositeLoc.length);
				if (loc == '/file/') {
					// since the received location includes workspace info, swap that out.
					file = file.split('/').slice(3).join('/');
				} else {
					// since you need to workspace info, add that in.
					var projectLoc = location.hash.substring(location.hash.indexOf(loc) + loc.length);
					projectLoc = projectLoc.split('/').slice(0,3).join('/') + '/';
					file = projectLoc + file;
				}
				Location = loc + file;
				return Location;
			}
		},

		projectRelativeLocation: function(location) {
			if (location.indexOf('/file/') === 0) {
				// Local workspace
				return location.substr(6);
			} else {
				// Shared workspace
				return location.split('/').slice(7).join('/');
			}
		},

		dispatchFileClientEvent: function(evt) {
			this.ignoreNextFileOperation = true;
			this.fileClient.dispatchEvent(evt);
		}
	};

	CollabClient.prototype.constructor = CollabClient;

	return {
		CollabClient: CollabClient
	};
});
