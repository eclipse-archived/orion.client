/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
/*global console prompt */

define([
	'i18n!orion/edit/nls/messages',
	'orion/i18nUtil',
	'orion/webui/littlelib',
	'orion/webui/dialogs/OpenResourceDialog',
	'orion/widgets/input/DropDownMenu',
	'orion/Deferred',
	'orion/URITemplate',
	'orion/commands',
	'orion/keyBinding',
	'orion/commandRegistry',
	'orion/extensionCommands',
	'orion/contentTypes',
	'orion/searchUtils',
	'orion/objects',
	'orion/PageUtil',
	'orion/PageLinks',
	'orion/editor/annotations',
	'orion/regex',
	'orion/uiUtils',
	'orion/util'
], function(messages, i18nUtil, lib, openResource, DropDownMenu, Deferred, URITemplate, mCommands, mKeyBinding, mCommandRegistry, mExtensionCommands, mContentTypes, mSearchUtils, objects, mPageUtil, PageLinks, mAnnotations, regex, mUIUtils, util) {

	var exports = {};

	var contentTypesCache = null;

	function createDelegatedUI(options) {
		var uriTemplate = new URITemplate(options.uriTemplate);
		var params = options.params || {};
		params.OrionHome = params.OrionHome || PageLinks.getOrionHome();
		var href = uriTemplate.expand(params);
		var delegatedParent = document.createElement("div"); //$NON-NLS-0$
		var iframe = document.createElement("iframe"); //$NON-NLS-0$
		iframe.id = options.id;
		iframe.name = options.id;
		iframe.type = "text/html"; //$NON-NLS-0$
		iframe.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups"; //$NON-NLS-0$
		iframe.frameborder = options.border !== undefined ? options.border : 1;
		iframe.src = href;
		iframe.className = "delegatedUI"; //$NON-NLS-0$
		if (options.width) {
			delegatedParent.style.width = options.width;
			iframe.style.width = options.width;
		}
		if (options.height) {
			delegatedParent.style.height = options.height;
			iframe.style.height = options.height;
		}
		iframe.style.visibility = 'hidden'; //$NON-NLS-0$
		if (options.parent !== null) {
			(options.parent || window.document.body).appendChild(delegatedParent);
		}
		delegatedParent.appendChild(iframe);
		iframe.style.left = options.left || (window.innerWidth - parseInt(iframe.clientWidth, 10))/2 + "px"; //$NON-NLS-0$
		iframe.style.top = options.top || (window.innerHeight - parseInt(iframe.clientHeight, 10))/2 + "px"; //$NON-NLS-0$
		iframe.style.visibility = '';
		// Listen for notification from the iframe.  We expect either a "result" or a "cancelled" property.
		window.addEventListener("message", function _messageHandler(event) { //$NON-NLS-0$
			if (event.source !== iframe.contentWindow) {
				return;
			}
			if (typeof event.data === "string") { //$NON-NLS-0$
				var data = JSON.parse(event.data);
				if (data.pageService === "orion.page.delegatedUI" && data.source === options.id) { //$NON-NLS-0$
					if (data.cancelled) {
						// console.log("Delegated UI Cancelled");
						if (options.cancelled) {
							options.cancelled();
						}
					} else if (data.result) {
						if (options.done) {
							options.done(data.result);
						}
					} else if (data.Status || data.status) {
						if (options.status) {
							options.status(data.Status || data.status);
						}
					}
					window.removeEventListener("message", _messageHandler, false); //$NON-NLS-0$
					if (delegatedParent.parentNode) {
						delegatedParent.parentNode.removeChild(delegatedParent);
					}
				}
			}
		}, false);

		return delegatedParent;
	}
	exports.createDelegatedUI = createDelegatedUI;

	/**
	 * Handles a status message from a service by forwarding to the <tt>orion.page.message</tt> service
	 * and stripping HTML.
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 * @param {Object|string} status
	 * @returns {orion.Promise}
	 */
	function handleStatusMessage(serviceRegistry, status) {
		if (status && typeof status.HTML !== "undefined") { //$NON-NLS-0$
			delete status.HTML;
		}
		var statusService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
		if (statusService) {
			return statusService.setProgressResult(status).then(null, function(e) {
				console.log(e);
				throw e; // reject
			});
		} else {
			console.log(status);
			return new Deferred().resolve(status);
		}
	}

	function errorTransformer(error) {
		return {_error: error};
	}

	function EditorCommandFactory (options) {
		this.serviceRegistry = options.serviceRegistry;
		this.commandService = options.commandRegistry;
		this.fileClient = options.fileClient;
		this.inputManager = options.inputManager;
		this.renderToolbars = options.renderToolbars;
		this.toolbarId = options.toolbarId;
		this.saveToolbarId = options.saveToolbarId;
		this.editToolbarId = options.editToolbarId;
		this.pageNavId = options.navToolbarId;
		this.editorContextMenuId = options.editorContextMenuId;
		this.isReadOnly = options.readonly;
		this.textSearcher = options.textSearcher;
		this.searcher = options.searcher;
		this.localSettings = options.localSettings;
		this.editorPreferences = options.editorPreferences;
		this.differ = options.differ;
		this.blamer = options.blamer;
		var that = this;
		this.listener = {
			onServiceAdded: function(event) {
				that._onServiceAdded(event.serviceReference);
			},
			onServiceRemoved: function(event) {
				that._onServiceRemoved(event.serviceReference);
			}
		};
		this.serviceRegistry.addEventListener("registered", this.listener.onServiceAdded); //$NON-NLS-0$
		this.serviceRegistry.addEventListener("unregistering", this.listener.onServiceRemoved); //$NON-NLS-0$
	}
	EditorCommandFactory.prototype = {
		/**
		 * Creates the common text editing commands. Also generates commands for any installed plug-ins that
		 * contribute editor actions.
		 */
		createCommands: function() {
			this._createSettingsCommand();
			this._createSearchFilesCommand();
			this._createGotoLineCommnand();
			this._createFindCommnand();
			this._createBlameCommand();
			this._createDiffCommand();
			this._createShowTooltipCommand();
			this._createUndoStackCommands();
			this._createClipboardCommands();
			this._createSaveCommand();
			return this._createEditCommands();
		},
		getEditCommands: function() {
			var commands = [];
			var commandRegistry = this.commandService;
			for (var commandId in commandRegistry._commandList) {
				var command = commandRegistry._commandList[commandId];
				if (command.editInfo) {
					commands.push(command);
				}
			}
			return commands;
		},
		updateCommands: function(target) {
			target = target || {};
			this.editor = target.editor;
			this.inputManager = target.inputManager;
			this.localSettings = target.localSettings;
			this.differ = target.differ;
			this.blamer = target.blamer;
			this.textSearcher = target.textSearcher;
			
			if (this._recreateEditCommands) {
				this._createEditCommands().then(function() {
					this.registerCommands();
					this.registerContextMenuCommands();
					if (this.renderToolbars) {
						this.renderToolbars();
					}
				}.bind(this));
			}
		},
		registerCommands: function() {
			var commandRegistry = this.commandService;
			
			commandRegistry.registerCommandContribution("settingsActions", "orion.edit.settings", 1, null, false, new mKeyBinding.KeyBinding("s", true, true), null, this); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(this.editToolbarId || this.toolbarId, "orion.edit.undo", 400, this.editToolbarId ? "orion.menuBarEditGroup/orion.edit.undoGroup" : null, !this.editToolbarId, new mKeyBinding.KeyBinding('z', true), null, this); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-3$
			commandRegistry.registerCommandContribution(this.editToolbarId || this.toolbarId, "orion.edit.redo", 401, this.editToolbarId ? "orion.menuBarEditGroup/orion.edit.undoGroup" : null, !this.editToolbarId, util.isMac ? new mKeyBinding.KeyBinding('z', true, true) : new mKeyBinding.KeyBinding('y', true), null, this); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-4$
			commandRegistry.registerCommandContribution(this.editToolbarId || this.pageNavId, "orion.edit.searchFiles", 1, this.editToolbarId ? "orion.menuBarEditGroup/orion.findGroup" : null, !this.editToolbarId, new mKeyBinding.KeyBinding("h", true), null, this); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-3$
			commandRegistry.registerCommandContribution(this.saveToolbarId || this.toolbarId, "orion.openResource", 1, this.saveToolbarId ? "orion.menuBarFileGroup/orion.edit.saveGroup" : null, false, new mKeyBinding.KeyBinding('f', true, true)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(this.saveToolbarId || this.toolbarId, "orion.edit.save", 2, this.saveToolbarId ? "orion.menuBarFileGroup/orion.edit.saveGroup" : null, false, new mKeyBinding.KeyBinding('s', true), null, this); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-3$
			commandRegistry.registerCommandContribution(this.editToolbarId || this.pageNavId, "orion.edit.gotoLine", 3, this.editToolbarId ? "orion.menuBarEditGroup/orion.findGroup" : null, !this.editToolbarId, new mKeyBinding.KeyBinding('l', !util.isMac, false, false, util.isMac), new mCommandRegistry.URLBinding("gotoLine", "line"), this); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
			commandRegistry.registerCommandContribution(this.editToolbarId || this.pageNavId, "orion.edit.find", 0, this.editToolbarId ? "orion.menuBarEditGroup/orion.findGroup" : null, !this.editToolbarId, new mKeyBinding.KeyBinding('f', true), new mCommandRegistry.URLBinding("find", "find"), this); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
			commandRegistry.registerCommandContribution(this.toolbarId , "orion.edit.blame", 1, "orion.menuBarToolsGroup", false, new mKeyBinding.KeyBinding('b', true, true), new mCommandRegistry.URLBinding("blame", "blame"), this); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
			commandRegistry.registerCommandContribution(this.toolbarId , "orion.edit.diff", 2, "orion.menuBarToolsGroup", false, new mKeyBinding.KeyBinding('d', true, true), new mCommandRegistry.URLBinding("diff", "diff"), this); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
			commandRegistry.registerCommandContribution(this.toolbarId , "orion.edit.showTooltip", 3, "orion.menuBarToolsGroup", false, new mKeyBinding.KeyBinding(113), null, this);//$NON-NLS-1$ //$NON-NLS-2$ 

			// KB exists so that we can pass an array (from info.key) rather than actual arguments
			function createKeyBinding(args) {
				if (!args) { return null; }
				var keyBinding = new mKeyBinding.KeyBinding();
				mKeyBinding.KeyBinding.apply(keyBinding, args);
				return keyBinding;
			}
			var commands = this.getEditCommands();
			for (var i = 0, position = 100; i < commands.length; i++, position++) {
				var command = commands[i], info = command.editInfo;
				
				// Handle quick fixes
				if (info.scopeId) {
					commandRegistry.registerCommandContribution(info.scopeId, command.id, position, info.scopeId + "Group", info.bindingOnly, createKeyBinding(info.key), null, this); //$NON-NLS-0$
				} else {
					commandRegistry.registerCommandContribution(this.toolbarId, command.id, position, "orion.menuBarToolsGroup", info.bindingOnly, createKeyBinding(info.key), null, this); //$NON-NLS-0$
				}
			}
		},
		registerContextMenuCommands: function() {
			var commandRegistry = this.commandService;
			// main context menu
			commandRegistry.addCommandGroup(this.editorContextMenuId, "orion.editorContextMenuGroup", 100, null, null, null, null, null, "dropdownSelection"); //$NON-NLS-1$ //$NON-NLS-2$
			
			var index = 1;
			//TODO - non-nls is wrong, check accelerator conflicts etc.
			commandRegistry.registerCommandContribution(this.editorContextMenuId, "orion.edit.copy", index++, "orion.editorContextMenuGroup/orion.edit.copyGroup", false, new mKeyBinding.KeyBinding('c', true)); //$NON-NLS-1$ //$NON-NLS-2$
			commandRegistry.registerCommandContribution(this.editorContextMenuId, "orion.edit.cut", index++, "orion.editorContextMenuGroup/orion.edit.copyGroup", false, new mKeyBinding.KeyBinding('x', true)); //$NON-NLS-1$ //$NON-NLS-2$
			commandRegistry.registerCommandContribution(this.editorContextMenuId, "orion.edit.paste", index++, "orion.editorContextMenuGroup/orion.edit.copyGroup", false, new mKeyBinding.KeyBinding('v', true)); //$NON-NLS-1$ //$NON-NLS-2$
			commandRegistry.registerCommandContribution(this.editorContextMenuId, "orion.edit.undo", index++, "orion.editorContextMenuGroup/orion.edit.undoGroup", false); //$NON-NLS-1$ //$NON-NLS-2$
			commandRegistry.registerCommandContribution(this.editorContextMenuId, "orion.edit.redo", index++, "orion.editorContextMenuGroup/orion.edit.undoGroup", false); //$NON-NLS-1$ //$NON-NLS-2$
			commandRegistry.registerCommandContribution(this.editorContextMenuId, "orion.edit.find", index++,"orion.editorContextMenuGroup/orion.findGroup", false); //$NON-NLS-1$ //$NON-NLS-2$
			commandRegistry.registerCommandContribution(this.editorContextMenuId, "orion.edit.searchFiles", index++, "orion.editorContextMenuGroup/orion.findGroup", false); //$NON-NLS-1$ //$NON-NLS-2$
			commandRegistry.registerCommandContribution(this.editorContextMenuId, "orion.edit.gotoLine", index++, "orion.editorContextMenuGroup/orion.findGroup", false); //$NON-NLS-1$ //$NON-NLS-2$

			// 'Tools' cascade
			commandRegistry.addCommandGroup(this.editorContextMenuId, "orion.editorContextMenuToolsGroup", 400, messages["Tools"], "orion.editorContextMenuGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(this.editorContextMenuId , "orion.edit.blame", 1, "orion.editorContextMenuGroup/orion.editorContextMenuToolsGroup", false); //$NON-NLS-1$ //$NON-NLS-2$
			commandRegistry.registerCommandContribution(this.editorContextMenuId , "orion.edit.diff", 2, "orion.editorContextMenuGroup/orion.editorContextMenuToolsGroup", false); //$NON-NLS-1$ //$NON-NLS-2$

			// Register extra tools commands
			var commands = this.getEditCommands();
			for (var i = 0, position = 100; i < commands.length; i++, position++) {
				var command = commands[i], info = command.editInfo;
				this.commandService.registerCommandContribution(this.editorContextMenuId, command.id, position, "orion.editorContextMenuGroup/orion.editorContextMenuToolsGroup"); //$NON-NLS-1$
			}
		},
		overwriteKeyBindings: function(editor) {
			var that = this;
			this.editor = editor;
			if (editor.getTextView && editor.getTextView()) {
				var textView = editor.getTextView();
				textView.setKeyBinding(new mKeyBinding.KeyBinding('s', true), "save"); //$NON-NLS-1$ //$NON-NLS-0$
				var saveCommand = that.commandService.findCommand("orion.edit.save"); //$NON-NLS-0$
				textView.setAction("save", function() { //$NON-NLS-0$
					saveCommand.callback.call({inputManager: that.inputManager});
					return true;
				}, saveCommand); //$NON-NLS-0$
			
				textView.setAction("gotoLine", function (data) { //$NON-NLS-0$
					if (data) {
						editor.onGotoLine(data.line - 1, 0, undefined, data.callback);
						return true;
					}
					that.commandService.runCommand("orion.edit.gotoLine"); //$NON-NLS-0$
					return true;
				}, that.commandService.findCommand("orion.edit.gotoLine")); //$NON-NLS-0$
				
				if(this.textSearcher) {
					textView.setAction("find", function (data) { //$NON-NLS-0$
						if (data) {
							that.textSearcher.show(data);
							return true;
						}
						that.commandService.runCommand("orion.edit.find", null, null, new mCommandRegistry.ParametersDescription( //$NON-NLS-0$
							[new mCommandRegistry.CommandParameter('useEditorSelection', 'text', '', "true")], //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							{clientCollect: true}));
						return true;
					}, that.commandService.findCommand("orion.edit.find")); //$NON-NLS-0$
				}
			}
		},
		showKeyBindings: function(keyAssist) {
			var editor = this.editor;
			if (editor && editor.getTextView && editor.getTextView()) {
				var textView = editor.getTextView();
				// Remove actions without descriptions
				var editorActions = textView.getActions(true).filter(function (element) {
					var desc = textView.getActionDescription(element);
					return desc && desc.name;
				});
				editorActions.sort(function (a, b) {
					return textView.getActionDescription(a).name.localeCompare(textView.getActionDescription(b).name);
				});
				keyAssist.createHeader(messages["Editor"]);
				var execute = function (actionID) {
					return function () {
						textView.focus();
						return textView.invokeAction(actionID);
					};
				};
				var scopes = {}, binding;
				for (var i = 0; i < editorActions.length; i++) {
					var actionID = editorActions[i];
					var actionDescription = textView.getActionDescription(actionID);
					var bindings = textView.getKeyBindings(actionID);
					for (var j = 0; j < bindings.length; j++) {
						binding = bindings[j];
						var bindingString = mUIUtils.getUserKeyString(binding);
						if (binding.scopeName) {
							if (!scopes[binding.scopeName]) {
								scopes[binding.scopeName] = [];
							}
							scopes[binding.scopeName].push({bindingString: bindingString, name: actionDescription.name, execute: execute(actionID)});
						} else {
							keyAssist.createItem(bindingString, actionDescription.name, execute(actionID));
						}
					}
				}
				for (var scopedBinding in scopes) {
					if (scopes[scopedBinding].length) {
						keyAssist.createHeader(scopedBinding);
						for (var k = 0; k < scopes[scopedBinding].length; k++) {
							binding = scopes[scopedBinding][k];
							keyAssist.createItem(binding.bindingString, binding.name, binding.execute);
						}
					}
				}
			}
		},
		_createSettingsCommand: function() {
			var that = this;
			var settingsCommand = new mCommands.Command({
				imageClass: "core-sprite-wrench", //$NON-NLS-0$
				tooltip: messages.LocalEditorSettings,
				id: "orion.edit.settings", //$NON-NLS-0$
				visibleWhen: /** @callback */ function(items, data) {
					var editor = data.handler.editor || that.editor;
					return editor && editor.installed && data.handler.localSettings;
				},
				callback: function(data) {
					var localSettings = this.localSettings || that.localSettings;
					var dropDown = settingsCommand.settingsDropDown;
					if (!dropDown || dropDown.isDestroyed()) {
						dropDown = settingsCommand.settingsDropDown = new DropDownMenu(data.domNode.parentNode, data.domNode, {
							noClick: true,
							selectionClass: 'dropdownSelection', //$NON-NLS-0$
							onShow: function() {
								dropDown.focus();
							},
							onHide: function() {
								that.editor.focus();
							}
						});
						dropDown.updateContent = localSettings.show.bind(localSettings);
						var menu = dropDown.getContentNode();
						menu.tabIndex = menu.style.marginTop = 0;
					}
					dropDown.click();
				}
			});
			this.commandService.addCommand(settingsCommand);
		},
		_createClipboardCommands: function() {
			
			//TODO - test to see whether copy/cut/paste is supported instead of IE
			if (util.isIE) {
				var that = this;
				
				var copyCommand = new mCommands.Command({
					name: messages.Copy,
					id: "orion.edit.copy", //$NON-NLS-0$
					visibleWhen: /** @callback */ function(items, data) {
						var editor = data.handler.editor || that.editor;
						return editor && editor.installed;
					},
					callback: function() {
						var editor = this.editor || that.editor;
						if (editor && editor.getTextView && editor.getTextView()) {
							var textView = editor.getTextView();
							textView.copy();
							editor.focus();
						}
					}
				});
				this.commandService.addCommand(copyCommand);
				
				var cutCommand = new mCommands.Command({
					name: messages.Cut,
					id: "orion.edit.cut", //$NON-NLS-0$
					visibleWhen: /** @callback */ function(items, data) {
						var editor = data.handler.editor || that.editor;
						return editor && editor.installed;
					},
					callback: function() {
						var editor = this.editor || that.editor;
						if (editor && editor.getTextView && editor.getTextView()) {
							var textView = editor.getTextView();
							textView.cut();
							editor.focus();
						}
					}
				});
				this.commandService.addCommand(cutCommand);
				
				var pasteCommand = new mCommands.Command({
					name: messages.Paste,
					id: "orion.edit.paste", //$NON-NLS-0$
					visibleWhen: /** @callback */ function(items, data) {
						var editor = data.handler.editor || that.editor;
						return editor && editor.installed;
					},
					callback: function() {
						var editor = this.editor || that.editor;
						if (editor && editor.getTextView && editor.getTextView()) {
							var textView = editor.getTextView();
							textView.paste();
							editor.focus();
						}
					}
				});
				this.commandService.addCommand(pasteCommand);
			}
		},
		_createUndoStackCommands: function() {
			var that = this;
			var undoCommand = new mCommands.Command({
				name: messages.Undo,
				id: "orion.edit.undo", //$NON-NLS-0$
				visibleWhen: /** @callback */ function(items, data) {
					var editor = data.handler.editor || that.editor;
					return editor && editor.installed;
				},
				callback: function() {
					var editor = this.editor || that.editor;
					editor.getUndoStack().undo();
				}
			});
			this.commandService.addCommand(undoCommand);

			var redoCommand = new mCommands.Command({
				name: messages.Redo,
				id: "orion.edit.redo", //$NON-NLS-0$
				visibleWhen: /** @callback */ function(items, data) {
					var editor = data.handler.editor || that.editor;
					return editor && editor.installed;
				},
				callback: function() {
					var editor = this.editor || that.editor;
					editor.getUndoStack().redo();
				}
			});
			this.commandService.addCommand(redoCommand);
		},
		_createSearchFilesCommand: function() {
			var that = this;

			// global search
			var showingSearchDialog = false;
			var searchCommand =  new mCommands.Command({
				name: messages.searchFiles,
				tooltip: messages.searchFiles,
				id: "orion.edit.searchFiles", //$NON-NLS-0$
				visibleWhen: /** @callback */ function(items, data) {
					var editor = data.handler.editor || that.editor;
					var searcher = data.handler.searcher || that.searcher;
					return editor && editor.installed && searcher;
				},
				callback: function() {
					var editor = this.editor || that.editor;
					if (showingSearchDialog) {
						return;
					}
					var selection = editor.getSelection();
					var searchTerm = editor.getText(selection.start, selection.end);
					var serviceRegistry = that.serviceRegistry;
					var progress = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
					var dialog = new openResource.OpenResourceDialog({
						searcher: that.searcher,
						progress: progress,
						searchRenderer: that.searcher.defaultRenderer,
						nameSearch: false,
						title: messages.searchFiles,
						message: messages.searchTerm,
						initialText: searchTerm,
						onHide: function () {
							showingSearchDialog = false;
							editor.focus();
						}
					});
					window.setTimeout(function () {
						showingSearchDialog = true;
						dialog.show(lib.node(that.toolbarId));
					}, 0);
				}
			});
			this.commandService.addCommand(searchCommand);
		},
		_createSaveCommand: function() {
			var that = this;
			var saveCommand = new mCommands.Command({
				name: messages.Save,
				tooltip: messages.saveFile,
				imageClass : "core-sprite-save", //$NON-NLS-0$
				id: "orion.edit.save", //$NON-NLS-0$
				visibleWhen: /** @callback */ function(items, data) {
					var inputManager = data.handler.inputManager || that.inputManager;
					var editor = data.handler.editor || that.editor || (inputManager && inputManager.getEditor());
					if (!editor || !editor.installed || !inputManager || !inputManager.isSaveEnabled()) {
						return false;
					}
					return true;
				},
				callback: function() {
					var inputManager = this.inputManager || that.inputManager;
					inputManager.save();
				}
			});
			this.commandService.addCommand(saveCommand);
		},
		_createGotoLineCommnand: function() {
			var that = this;

			// page navigation commands (go to line)
			var lineParameter = new mCommandRegistry.ParametersDescription(
				[new mCommandRegistry.CommandParameter('line', 'number', messages.gotoLinePrompt)], //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				{hasOptionalParameters: false},
				function(data) {
					var editor = data.handler.editor || that.editor;
					var line = editor.getModel().getLineAtOffset(editor.getCaretOffset()) + 1;
					return [new mCommandRegistry.CommandParameter('line', 'number', messages.gotoLinePrompt, line.toString())]; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				}
			);

			var gotoLineCommand =  new mCommands.Command({
				name: messages.gotoLine,
				tooltip: messages.gotoLineTooltip,
				id: "orion.edit.gotoLine", //$NON-NLS-0$
				visibleWhen: /** @callback */ function(items, data) {
					var editor = data.handler.editor || that.editor;
					return editor && editor.installed;
				},
				parameters: lineParameter,
				callback: function(data) {
					var line;
					var editor = this.editor || that.editor;
					var model = editor.getModel();
					if (data.parameters && data.parameters.valueFor('line')) { //$NON-NLS-0$
						line = data.parameters.valueFor('line'); //$NON-NLS-0$
					} else {
						line = model.getLineAtOffset(editor.getCaretOffset());
						line = prompt(messages.gotoLinePrompt, line + 1);
						if (line) {
							line = parseInt(line, 10);
						}
					}
					if (line) {
						editor.onGotoLine(line - 1, 0);
					}
				}
			});
			this.commandService.addCommand(gotoLineCommand);
		},
		_createFindCommnand: function() {
			var that = this;

			// find&&replace commands (find)
			var findParameter = new mCommandRegistry.ParametersDescription(
				[new mCommandRegistry.CommandParameter('find', 'text', 'Find:')], //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				{clientCollect: true},
				function(data) {
					var editor = data.handler.editor || that.editor;
					var textSearcher = data.handler.textSearcher || that.textSearcher;
					var selection = editor.getSelection();
					var searchString = "";
					if (selection.end > selection.start) {
						var model = editor.getModel();
						searchString = model.getText(selection.start, selection.end);
						if (textSearcher && textSearcher.getOptions().regex) {
							searchString = regex.escape(searchString);
						}
					}
					return [new mCommandRegistry.CommandParameter('find', 'text', 'Find:', searchString)]; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				}
			);
			var findCommand =  new mCommands.Command({
				name: messages.Find,
				tooltip: messages.Find,
				id: "orion.edit.find", //$NON-NLS-0$
				visibleWhen: /** @callback */ function(items, data) {
					var editor = data.handler.editor || that.editor;
					var textSearcher = data.handler.textSearcher || that.textSearcher;
					return editor && editor.installed && textSearcher;
				},
				parameters: findParameter,
				callback: function(data) {
					var node = lib.node("replaceCompareDiv"); //$NON-NLS-0$
					if (node && node.classList.contains("replaceCompareDivVisible")) { //$NON-NLS-0$
						return false; //TODO is there a better way of preventing the command from being executed?
					}
					var editor = this.editor || that.editor;
					var textSearcher = this.textSearcher || that.textSearcher;
					if (findCommand.textSearcher && findCommand.textSearcher !== textSearcher) {
						findCommand.textSearcher.hide();
					}
					findCommand.textSearcher = textSearcher;
					var searchString = "";
					var parsedParam = null;
					var selection = editor.getSelection();
					if (selection.end > selection.start && data.parameters.valueFor('useEditorSelection')) {//$NON-NLS-0$ If there is selection from editor, we want to use it as the default keyword
						var model = editor.getModel();
						searchString = model.getText(selection.start, selection.end);
						if (textSearcher.getOptions().regex) {
							searchString = regex.escape(searchString);
						}
					} else {//If there is no selection from editor, we want to parse the parameter from URL binding
						if (data.parameters && data.parameters.valueFor('find')) { //$NON-NLS-0$
							searchString = data.parameters.valueFor('find'); //$NON-NLS-0$
							parsedParam = mPageUtil.matchResourceParameters();
							mSearchUtils.convertFindURLBinding(parsedParam);
						}
					}
					if(parsedParam){
						textSearcher.setOptions({regex: parsedParam.regEx, caseInsensitive: !parsedParam.caseSensitive});
						var tempOptions = {};
						if(parsedParam.atLine){
							tempOptions.start = editor.getModel().getLineStart(parsedParam.atLine-1);
						}
						textSearcher.show({findString: searchString, replaceString: parsedParam.replaceWith});
						textSearcher.find(true, tempOptions);
						that.commandService.closeParameterCollector(); //TODO is there a better way of hiding the parameter collector?
					} else {
						textSearcher.show({findString: searchString});
					}
				}
			});
			this.commandService.addCommand(findCommand);
		},

		_createBlameCommand: function(){
			var that = this;
			var blameCommand = new mCommands.Command({
				name: messages.Blame,
				tooltip: messages.BlameTooltip,
				id: "orion.edit.blame", //$NON-NLS-0$
				parameters: new mCommandRegistry.ParametersDescription([new mCommandRegistry.CommandParameter('blame', 'boolean')], {clientCollect: true}), //$NON-NLS-1$ //$NON-NLS-0$
				visibleWhen: /** @callback */ function(items, data) {
					var editor = data.handler.editor || that.editor;
					var blamer = data.handler.blamer || that.blamer;
					return editor && editor.installed && blamer && blamer.isVisible();
				},
				callback: function(data) {
					var visible = false;
					var editor = this.editor || that.editor;
					var blamer = this.blamer || that.blamer;
					var annotations = editor.getAnnotationModel().getAnnotations();
					while (annotations.hasNext()) {
						var annotation = annotations.next();
						if (annotation.type === mAnnotations.AnnotationType.ANNOTATION_BLAME) {
							visible = true;
							break;
						}
					}
					visible = !visible;
					if (data.parameters && data.parameters.valueFor('blame')) { //$NON-NLS-0$
						visible = data.parameters.valueFor('blame') === "true"; //$NON-NLS-1$ //$NON-NLS-0$
					}
					if (visible) {
						blamer.doBlame();
					} else{
						editor.showBlame([]);
					}
					editor.focus();
				}
			});
			this.commandService.addCommand(blameCommand);
		},

		_createDiffCommand: function(){
			var that = this;
			var diffCommand = new mCommands.Command({
				name: messages.Diff,
				tooltip: messages.DiffTooltip,
				id: "orion.edit.diff", //$NON-NLS-0$
				visibleWhen: /** @callback */ function(items, data) {
					var editor = data.handler.editor || that.editor;
					var differ = data.handler.differ || that.differ;
					return editor && editor.installed && differ && differ.isVisible();
				},
				callback: function() {
					var editor = this.editor || that.editor;
					var differ = this.differ || that.differ;
					differ.toggleEnabled();
					var editorPreferences = this.editorPreferences;
					editorPreferences.getPrefs(function(pref){
						pref.diffService = differ.isEnabled();
						editorPreferences.setPrefs(pref);
					});
					editor.focus();
				}
			});
			this.commandService.addCommand(diffCommand);
		},

		_createShowTooltipCommand: function(){
			var that = this;
			var showTooltipCommand = new mCommands.Command({
				name: messages.showTooltip,
				tooltip: messages.showTooltipTooltip,
				id: "orion.edit.showTooltip", //$NON-NLS-0$
				visibleWhen: /** @callback */ function(items, data) {
					var editor = data.handler.editor || that.editor;
					return editor && editor.installed;
				},
				callback: function() {
					var editor = this.editor || that.editor;
					var tooltip = editor.getTooltip();
					var tv = editor.getTextView();
					var offset = tv.getCaretOffset();
					var pos = tv.getLocationAtOffset(offset);
					tooltip.show({
						x: pos.x,
						y: pos.y,
						getTooltipInfo: function() {
							return editor._getTooltipInfo(this.x, this.y);
						}
					}, false, true);
				}
			});
			this.commandService.addCommand(showTooltipCommand);
		},
		_onServiceRemoved: function(serviceReference) {
			if (serviceReference.getProperty("objectClass").indexOf("orion.edit.command") !== -1) { //$NON-NLS-1$ //$NON-NLS-2$
				this._recreateEditCommands = true;
			}
		},
		_onServiceAdded: function(serviceReference) {
			if (serviceReference.getProperty("objectClass").indexOf("orion.edit.command") !== -1) { //$NON-NLS-1$ //$NON-NLS-2$
				this._recreateEditCommands = true;
			}
		},
		_createEditCommands: function() {
			var that = this;
			this._recreateEditCommands = false;

			function getContentTypes(serviceRegistry) {
				if (contentTypesCache) {
					return contentTypesCache;
				}
				var contentTypeService = serviceRegistry.getService("orion.core.contentTypeRegistry"); //$NON-NLS-0$
				//TODO Shouldn't really be making service selection decisions at this level. See bug 337740
				if (!contentTypeService) {
					contentTypeService = new mContentTypes.ContentTypeRegistry(serviceRegistry);
					contentTypeService = serviceRegistry.getService("orion.core.contentTypeRegistry"); //$NON-NLS-0$
				}
				return contentTypeService.getContentTypes().then(function(ct) {
					contentTypesCache = ct;
					return contentTypesCache;
				});
			}

			// add the commands generated by plug-ins who implement the "orion.edit.command" extension.
			//
			// Note that the shape of the "orion.edit.command" extension is not in any shape or form that could be considered final.
			// We've included it to enable experimentation. Please provide feedback in the following bug:
			// https://bugs.eclipse.org/bugs/show_bug.cgi?id=337766
			//
			// iterate through the extension points and generate commands for each one.
			var serviceRegistry = this.serviceRegistry;
			var commandRegistry = this.commandService;
			var actionReferences = serviceRegistry.getServiceReferences("orion.edit.command"); //$NON-NLS-0$
			var progress = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
			var handleStatus = handleStatusMessage.bind(null, serviceRegistry);
			var makeCommand = function(info, service, options) {
				var commandVisibleWhen = options.visibleWhen;
				options.visibleWhen = function(items, data) {
					var editor = data.handler.editor || that.editor;
					var inputManager = data.handler.inputManager || that.inputManager;
					if (!editor || !editor.installed || !inputManager) {
						return false;
					}
					if (info.editor && editor.id && info.editor !== editor.id) {
						return false;
					}
					if (that.inputManager.getReadOnly()) {
						return false;
					}
					return !commandVisibleWhen || commandVisibleWhen(items);
				};
				options.callback = function(data) {
					var editor = this.editor || that.editor;
					var inputManager = this.inputManager || that.inputManager;
					//TODO should all text editors have selection?
					var selection = editor.getSelection ? editor.getSelection() : {start: 0, end: 0};
					var model = editor.getModel();

					/*
					 * Processes the result object from old run() API.
					 * @deprecated: command services should implement execute() instead.
					 */
					var processEditorResult = function(result) {
						if (typeof result === "object" && result) { //$NON-NLS-0$
							if (result.text) {
								editor.setText(result.text);
							}
							if (result.selection) {
								if (editor.setSelection) {
									editor.setSelection(result.selection.start, result.selection.end, true /*scroll to*/);
								}
								editor.focus();
							}
						} else if (typeof result === 'string') { //$NON-NLS-0$
							editor.setText(result, selection.start, selection.end, true /*scroll to*/);
							if (editor.setSelection) {
								editor.setSelection(selection.start, selection.start + result.length);
							}
							editor.focus();
						}
					};

					var serviceCall, handleResult;
					if (service.execute) {
						var context = {
							contentType: inputManager.getContentType(),
							input: inputManager.getInput(),
							offset: editor.getCaretOffset()
						};
						
						// TODO: Make this more generic
						if (info.scopeId === "orion.edit.quickfix") { //$NON-NLS-0$
							context.annotation = {
								start: data.userData.start,
								end: data.userData.end,
								title: data.userData.title,
								id: data.userData.id,
								data: data.userData.data
							};
						}
						var editorContext = editor.getEditorContext();
						// Hook up delegated UI and Status handling
						editorContext.openDelegatedUI = function(/*options, ..*/) {
							var options1 = arguments[0];
							options1 = options1 || {};
							options1.done = processEditorResult;
							options1.status = handleStatus;
							options1.params = options1.params || {};
							objects.mixin(options1.params, inputManager.getFileMetadata());
							createDelegatedUI.apply(null, Array.prototype.slice.call(arguments));
						};
						editorContext.setStatus = handleStatus;
						
						editor.focus();
						serviceCall = service.execute(editorContext, context);
						handleResult = null; // execute() returns nothing
					} else {
						serviceCall = service.run(model.getText(selection.start,selection.end), model.getText(), selection, inputManager.getInput());
						handleResult = function(result){
							if (result && result.uriTemplate) {
								var options1 = {};
								options1.uriTemplate = result.uriTemplate;
								options1.params = inputManager.getFileMetadata();
								options1.id = info.id;
								options1.width = result.width;
								options1.height = result.height;
								options1.done = processEditorResult;
								options1.status = handleStatus;
								createDelegatedUI(options1);
							} else if (result && (result.Status || result.status)) {
								handleStatus(result.Status || result.status);
							} else {
								processEditorResult(result);
							}
						};
					}
					progress.showWhile(serviceCall, i18nUtil.formatMessage(messages.running, options.name)).then(handleResult);
					return true;
				};
				return new mCommands.Command(options);
			};
			return Deferred.when(getContentTypes(this.serviceRegistry), function() {
				// Create Commands
				var commandPromises = [];
				actionReferences.forEach(function(serviceReference) {
					var service = that.serviceRegistry.getService(serviceReference);
					var info = {};
					var propertyNames = serviceReference.getPropertyKeys();
					for (var j = 0; j < propertyNames.length; j++) {
						info[propertyNames[j]] = serviceReference.getProperty(propertyNames[j]);
					}
					info.forceSingleItem = true;  // for compatibility with mExtensionCommands._createCommandOptions

					var deferred = mExtensionCommands._createCommandOptions(info, serviceReference, that.serviceRegistry, contentTypesCache, false, /* @callback */ function(items) {
						// items is the editor and we care about the file metadata for validation
						return that.inputManager.getFileMetadata();
					}).then(function(commandOptions){
						var command = makeCommand(info, service, commandOptions);
						command.editInfo = info;
						commandRegistry.addCommand(command);
						return command;
					});
					commandPromises.push(deferred);
				});
				return Deferred.all(commandPromises, errorTransformer);
			});
		}
	};
	exports.EditorCommandFactory = EditorCommandFactory;
	exports.handleStatusMessage = handleStatusMessage;

	return exports;
});
