/*******************************************************************************
 * @license
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/

define ([
	'orion/lsp/utils'
], function(Utils) {
	
	function GotoDefinition(serviceRegistry, inputManager, editor, languageServerRegistry) {
		this.serviceRegistry = serviceRegistry;
		this.inputManager = inputManager;
		this.editor = editor;
		this.languageServerRegistry = languageServerRegistry;
	}

	GotoDefinition.prototype = {
		getLspGotoDefinition : function() {
			// check lsp extensions
			var inputManagerContentType = this.inputManager.getContentType();
			return this.languageServerRegistry.getServerByContentType(inputManagerContentType);
		},

		isVisible: function() {
			var languageServer = this.getLspGotoDefinition();
			if (languageServer) {
				return languageServer.isDefinitionEnabled();
			}
			return false;
		},
		
		execute: function() {
			var selection = this.editor.getSelection();
			var lspGotoDefinition = this.getLspGotoDefinition();
			if (lspGotoDefinition) {
				var start = Utils.getPosition(this.editor, selection.start);
				return lspGotoDefinition.definition(this.inputManager.getFileMetadata().Location, start).then(function(loc) {
					if (!loc) {
						return;
					}
					var currentLoc = loc;
					if (Array.isArray(currentLoc) && currentLoc.length !== 0) {
						currentLoc = currentLoc[0];
					} else {
						return;
					}
					if (typeof currentLoc.range.start === 'undefined') {
						return;
					}
					if (currentLoc.range.start.line === currentLoc.range.end.line) {
						var sel = {
							line: currentLoc.range.start.line + 1,
							offset: currentLoc.range.start.character,
							length: currentLoc.range.end.character - currentLoc.range.start.character
						};
						return this.editor.getEditorContext().openEditor(currentLoc.uri, sel);
					}
					return this.editor.getEditorContext().openEditor(currentLoc, Utils.convertRange(this.editor, currentLoc.range));
				}.bind(this));
			}
		}
	};
	return {GotoDefinition: GotoDefinition};
});


