'use babel';

import OrionView from './orion-view';
import { CompositeDisposable } from 'atom';

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
  }

};
