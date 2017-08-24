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

    // HACK hardcoded value: sessionId
    mySocket = io.connect('http://localhost:8082/' + "?sessionId=" + 'jnpO0CBn8n', {
      path: "/socket.io/"
    });

    setTimeout(function() {
      if (!mySocket.connected) {
        console.error('Socket connection failed');
        /* Check:
         *   - if servers are running
         *   - `sessionId` above (attined from Collab Hub server) is correct
         *   - Port number for the Collab Hub server above is correct
         */
      }
    }, 2000);

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

      var msgObj = JSON.parse(data);
      console.log(msgObj);

      if (msgObj.type === 'init-document') {
        console.info('Successfully joined document')
      }

      if (msgObj.type === 'operation') {

        let editor = atom.workspace.getActiveTextEditor();

        let operation = msgObj.operation;
        let startPosition = 0;
        let text = '';

        // First char in empty doc
        if (operation.length === 1) {
          startPosition = 0;
          text = operation[0];
        }

        // First char in non-empty doc
        if (operation.length === 2 && Number.isInteger(operation[1])) {
          startPosition = 0;
          text = operation[0];
        }

        // Char in the middle
        if (operation.length === 3) {
          startPosition = operation[0];
          text = operation[1];
        }

        // Char at the end
        if (operation.length === 2 && Number.isInteger(operation[0])) {
          startPosition = operation[0];
          text = operation[1];
        }

        // ############################################################### demo

        let _demo_basic = true;
        let _demo_insert_at_position = false;

        //

        /*
         * This code will insert text where the cursor is on Atom
         * regardless of where the Orion user is typing
         */
        if (_demo_basic) {
          if (Number.isInteger(text) && text < 0) {
            let backspaceCount = -text;
            for (let count = 0; count < backspaceCount; count++) {
              editor.delete();
              // TODO handle backspace separately
              // editor.backspace();
            }
          } else {
            // Insert received text from Orion
            editor.insertText(text);
          }
        } // end of '_demo_basic'

        //

        /*
         * This code will insert text at a given position in Atom
         * regardless of where the cursor is
         *
         * Currently inserting text on row: 2 and col: 2 for demo.
         * TODO: Send row-col value from Orion and use that data here
         */
        if (_demo_insert_at_position) {
          if (Number.isInteger(text) && text < 0) {
            let backspaceCount = -text;
            for (let count = 0; count < backspaceCount; count++) {
              // Simulating backspace:
              // Replacing from [2,2] to [2,3] (one char) with empty string
              // HACK hardcoded value: range array
              editor.setTextInBufferRange([
                [2, 2],
                [2, 3]
              ], '');
            }
          } else {
            // Insert received text from Orion
            // HACK hardcoded value: range array
            editor.setTextInBufferRange([
              [2, 2],
              [2, 2]
            ], text);
          }
        } // end of '_demo_insert_at_position'

        // ################################################### end of demo code

      }

    });

  },

  join_session() {
    mySocket.emit('message', JSON.stringify({
      'clientId': 'arshi3.12345',
      'token_bypass': 'arshi3'
      // HACK hardcoded values: 'clientId' and 'token_bypass'
    }));
  },

  join_document() {
    mySocket.emit('message', JSON.stringify({
      type: 'join-document',
      doc: '/arshi-OrionContent/Test/demo.txt',
      clientId: 'arshi3.12345'
      // HACK hardcoded values: 'doc' and 'clientId'
    }));

    var request = require('request');
    // Requesting content of 'demo.txt' file
    request('http://localhost:8081/file/arshi-OrionContent/Test/demo.txt', function(error, response, body) {
      // TODO add authentication with this request
      // HACK hardcoded value: URL
      //
      // The authentication to fetch content of the file
      // on 'modules/orionode/index.js' ~ line 90
      // is disabled

      if (error) {
        console.log('error:', error);
        console.log('statusCode:', response && response.statusCode);
      }

      let editor = atom.workspace.getActiveTextEditor();
      // Clear all content of the open Atom file
      editor.selectAll();
      editor.backspace();
      // Insert received content into the open Atom file
      editor.insertText(body);

    });
  },

};
