'use babel';

import OrionView from './orion-view';
import {
  CompositeDisposable
} from 'atom';

export default {

  orionView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.orionView = new OrionView(state.orionViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.orionView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'orion:toggle': () => this.toggle()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'orion:start_collab': () => this.start_collab()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'orion:join_session': () => this.join_session()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'orion:join_document': () => this.join_document()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.orionView.destroy();
  },

  serialize() {
    return {
      orionViewState: this.orionView.serialize()
    };
  },

  toggle() {
    console.log('Orion was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  },

  start_collab() {

    const io = require('socket.io-client');

    mySocket = io.connect('http://localhost:8082/' + "?sessionId=" + 'jnpO0CBn8n', {
      path: "/socket.io/"
    });

    if (!mySocket.connected) {
      console.error('Socket connection failed');
      /*
       * Check:
       *   - Servers are running
       *   - `sessionId` above (attined from Collab Hub server) is correct
       *   - Port number for the Collab Hub server above is correct
       */
    }

    mySocket.on('connect', function() {
      console.info('Socket connection successful');
    });

    mySocket.on('disconnect', function() {
      console.info('Socket disconnected');
    });

    mySocket.on('error', function(e) {
      console.info('Server sent an error message');
    });

    mySocket.on('message', function(data) {
      console.info('Server sent a message');
    });

  },

  join_session() {
    console.info('join_session not implemented');
  },

  join_document() {
    console.info('join_document not implemented');
  },

};
