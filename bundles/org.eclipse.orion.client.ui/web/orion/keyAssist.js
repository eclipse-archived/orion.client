/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
define([
	'i18n!orion/nls/messages',
	'orion/webui/littlelib',
	'orion/keyBinding',
	'orion/commands',
	'orion/metrics',
	'orion/uiUtils',
	'orion/util'
], function (messages, lib, keyBinding, mCommands, metrics, UIUtil, util) {

	function KeyAssistPanel(options) {
		this.commandRegistry = options.commandRegistry;
		this.create();
		this._filterString = "";
		this._providers = [];
	}
	KeyAssistPanel.prototype = {
		addProvider: function(provider) {
			if (this._providers.indexOf(provider) === -1) {
				this._providers.push(provider);
			}
		},
		create: function () {
			var keyAssistDiv = this._keyAssistDiv = document.createElement("div"); //$NON-NLS-1$
			keyAssistDiv.id = "keyAssist"; //$NON-NLS-1$
			keyAssistDiv.style.display = "none"; //$NON-NLS-1$
			keyAssistDiv.classList.add("keyAssistFloat"); //$NON-NLS-1$
			keyAssistDiv.setAttribute("role", "menu"); //$NON-NLS-2$ //$NON-NLS-1$
			var keyAssistInput = this._keyAssistInput = document.createElement("input"); //$NON-NLS-1$
			keyAssistInput.classList.add("keyAssistInput"); //$NON-NLS-1$
			keyAssistInput.type = "text"; //$NON-NLS-1$
			keyAssistInput.placeholder = messages["Filter bindings"]; //$NON-NLS-1$
			keyAssistInput.setAttribute("aria-autocomplete", "list"); //$NON-NLS-1$ //$NON-NLS-0$
			keyAssistDiv.appendChild(keyAssistInput);

			var keyAssistContents = this._keyAssistContents = document.createElement("div"); //$NON-NLS-1$
			keyAssistContents.classList.add("keyAssistContents"); //$NON-NLS-1$
			if (util.isIOS || util.isAndroid) {
				keyAssistContents.style.overflowY = "auto"; //$NON-NLS-1$
			}
			keyAssistDiv.appendChild(keyAssistContents);
			var keyAssistTable = this._keyAssistTable = document.createElement('table'); //$NON-NLS-1$
			keyAssistTable.tabIndex = 0;
			keyAssistTable.classList.add("keyAssistList"); //$NON-NLS-1$
			keyAssistContents.appendChild(keyAssistTable);
			document.body.appendChild(keyAssistDiv);
			
			keyAssistInput.addEventListener("keydown", function (e) { //$NON-NLS-1$
				this._keyDown(e);
			}.bind(this));
			keyAssistTable.addEventListener("keydown", function (e) { //$NON-NLS-1$
				this._keyDown(e);
			}.bind(this));
			keyAssistInput.addEventListener("input", function (e) { //$NON-NLS-1$
				this.filterChanged();
			}.bind(this));
			keyAssistContents.addEventListener(util.isFirefox ? "DOMMouseScroll" : "mousewheel", function (e) { //$NON-NLS-2$ //$NON-NLS-1$
				this._scrollWheel(e);
			}.bind(this));
			document.addEventListener("keydown", function (e) { //$NON-NLS-1$
				if (e.keyCode === lib.KEY.ESCAPE) {
					this.hide();
				}
			}.bind(this));
			lib.addAutoDismiss([keyAssistDiv], function () {
				this.hide();
			}.bind(this));
			
			if (this.commandRegistry) {
				this.commandRegistry.addEventListener("bindingChanged", function(args) {
					this.handleBindingChange(args);
				}.bind(this));
			}
		},
		handleBindingChange: function(args) {
			if (!this.isVisible()) {
				return;
			}
			
			var rows = this._keyAssistTable.querySelectorAll(".keyAssistItem"), row; //$NON-NLS-1$
			for (var i=0; i<rows.length; i++) {
				var row = rows[i];
				if (row.cmdID !== args.id)
					continue;
					
				// ensure we're finding the correct row
				if (JSON.stringify(args.prevBinding) === JSON.stringify(row.curBinding)) {
					// Update the binding showm in the table
					var bindingStr = args.newBinding ? UIUtil.getUserKeyString(args.newBinding) : "---"; //$NON-NLS-1$
					row.childNodes[2].firstChild.textContent = bindingStr;
					row.curBinding = args.newBinding;							
				}
			}
		},
		createContents: function () {
			var table = this._keyAssistTable;
			lib.empty(table);
			this._selectedIndex = -1;
			this._selectedRow = null;
			this._keyAssistContents.scrollTop = 0;
			this._idCount = 0;
			for (var i=0; i<this._providers.length; i++) {
				this._providers[i].showKeyBindings(this);
			}
			this.createHeader(messages["Global"]);
			this.commandRegistry.showKeyBindings(this);
		},
		createItem: function (binding, name, cmdID, execute) {
			var bindingString = binding ? UIUtil.getUserKeyString(binding) : messages["NoBinding"];
			if (this._filterString) {
				var s = this._filterString.toLowerCase(),
					insensitive;
				if (s !== this._filterString) {
					s = this._filterString;
					insensitive = function (str) {
						return str;
					};
				} else {
					insensitive = function (str) {
						return str.toLowerCase();
					};
				}
				if (insensitive(name).indexOf(s) === -1 && insensitive(bindingString).indexOf(s) === -1 && insensitive(this._lastHeader).indexOf(s) === -1) {
					return;
				}
			}
			var row = this._keyAssistTable.insertRow(-1);
			row.id = "keyAssist-keyBinding-" + this._idCount++; //$NON-NLS-1$
			row.setAttribute("role", "menuitem"); //$NON-NLS-2$ //$NON-NLS-1$
			row.cmdID = cmdID;
			row._execute = execute;
			row.curBinding = binding;
			row.classList.add("keyAssistItem"); //$NON-NLS-1$
			row.addEventListener("click", function (e) { //$NON-NLS-1$
				this._selectedRow = row;
				this.execute();
				e.preventDefault();
			}.bind(this));
			
			var column = row.insertCell(-1);
			column.classList.add("keyAssistSpacer"); //$NON-NLS-1$
			column.appendChild(document.createElement("div")); //$NON-NLS-1$
			
			var column = row.insertCell(-1);
			column.classList.add("keyAssistName"); //$NON-NLS-1$
			column.appendChild(document.createTextNode(name));
			
			column = row.insertCell(-1);
			column.classList.add("keyAssistAccel"); //$NON-NLS-1$
			var bindingSpan = document.createElement("span"); //$NON-NLS-1$
			bindingSpan.textContent = bindingString;
			column.appendChild(bindingSpan);
			
			column = row.insertCell(-1);
			column.classList.add("keyAssistActions"); //$NON-NLS-1$
			var eb = document.createElement("button"); //$NON-NLS-1$
			eb.classList.add("keyAssistEditButton"); //$NON-NLS-1$
			eb.classList.add("core-sprite-edit"); //$NON-NLS-1$
			eb.setAttribute("aria-label", messages["Edit"]); //$NON-NLS-1$
			//eb.textContent = "E"; //$NON-NLS-1$
			eb.addEventListener("click", function(evt) {
				lib.stop(evt);
				this.editBinding(row);
			}.bind(this));
			column.appendChild(eb);
		},
		editBinding: function(row) {
			var formatKBEdit = function(e) {
				this._keyCode = e.keyCode;
				this._altDown = e.altKey;
				this._ctrlDown = util.isMac ? e.metaKey : e.ctrlKey;
				this._shiftDown = e.shiftKey;
				this._commandDown = util.isMac ? e.ctrlKey : e.metaKey;
				
				var testBinding = new keyBinding.KeyStroke(this._keyCode, this._ctrlDown, this._shiftDown, this._altDown, this._commandDown);
				var bindingString = UIUtil.getUserKeyString(testBinding);
				this.keyAssistKBEdit.value = bindingString;
			}.bind(this);

			var clear = function() {
				this.keyAssistKBEdit.value = "";
				this.bindingField.removeChild(this.keyAssistKBEdit);
				this.bindingField.firstChild.style.display = "block"; //$NON-NLS-1$
				
				// Delete transient state vars
				delete this.keyAssistKBEdit;
				delete this.bindingField;
				delete this._keyCode;
				
				this._editingABinding = false;
			}.bind(this);
			
			// Clear any existing binding edit
			if (this._editingABinding) {
				clear();
			}
			
			// Move the focus to this row
			var rows = this._keyAssistTable.querySelectorAll(".keyAssistItem"); //$NON-NLS-1$
			for(var i = 0; i < rows.length; i++) {
				if (rows[i] === row) {
					this.selectRow(i, rows);
					break;
				}
			}
			
			// Create the edit control
			var keyAssistKBEdit = this.keyAssistKBEdit = document.createElement("input"); //$NON-NLS-1$
			keyAssistKBEdit.id = "keyAssistInput"; //$NON-NLS-1$
			keyAssistKBEdit.type = "text"; //$NON-NLS-1$
			keyAssistKBEdit.placeholder = messages["BindingPrompt"];
			keyAssistKBEdit.classList.add("keyAssistBindingInput"); //$NON-NLS-1$

			keyAssistKBEdit.addEventListener("click", function(e) {
				e.stopPropagation();
			}.bind(this));
			keyAssistKBEdit.addEventListener("keydown", function (e) { //$NON-NLS-1$
				// Skip modifiers...
				if (e.keyCode === lib.KEY.ALT || e.keyCode === lib.KEY.SHIFT || e.keyCode === lib.KEY.CONTROL || e.keyCode === lib.KEY.COMMAND) {
					// Intentional NO-OP
				}
				else if (e.keyCode === lib.KEY.ENTER) {
					if (this._keyCode) {
						// First see if this is a valid binding...at least one modifier and a keyCode
						if (this._keyCode && (this._altDown || this._ctrlDown || this._shiftDown || this._commandDown)) {
							// remember the override
							var newBinding = new keyBinding.KeyStroke(this._keyCode, this._ctrlDown, this._shiftDown, this._altDown, this._commandDown);
							this.commandRegistry.createBindingOverride(row.cmdID, newBinding, row.curBinding);
							metrics.logEvent("KeyBinding", "Changed", row.cmdID, JSON.stringify(newBinding)); //$NON-NLS-1$ //$NON-NLS-2$
								
							clear();
							this._keyAssistTable.focus();
						}
						
					}
				} else if (e.keyCode === lib.KEY.ESCAPE) {
					clear();
					this._keyAssistInput.focus();
				} else {
					formatKBEdit(e);
				}
				lib.stop(e);
			}.bind(this));
			
			var bindingField = this.bindingField = row.childNodes[2];
			bindingField.firstChild.style.display = "none"; //$NON-NLS-1$

			// Make the edit control the correct width to avoid resizing the panel
			var pl = lib.pixelValueOf(bindingField, "padding-left"); //$NON-NLS-1$
			var pr = lib.pixelValueOf(bindingField, "padding-right"); //$NON-NLS-1$
			var bl = lib.pixelValueOf(bindingField, "border-left"); //$NON-NLS-1$
			var br = lib.pixelValueOf(bindingField, "border-right"); //$NON-NLS-1$
			var rect = lib.bounds(bindingField);
			var calculatedWidth = rect.width - (pl + pr + bl + br);
			
			// Ensure there's enough space to show the new binding
			calculatedWidth = calculatedWidth < 135 ? 135 : calculatedWidth;
			
			keyAssistKBEdit.style.width = calculatedWidth + "px"; //$NON-NLS-1$
			bindingField.appendChild(keyAssistKBEdit);
			keyAssistKBEdit.focus();
			this._editingABinding = true;
		},
		createHeader: function (name) {
			this._lastHeader = name;
			var row = this._keyAssistTable.insertRow(-1);
			row.classList.add("keyAssistSection"); //$NON-NLS-1$
			var column = row.insertCell(-1);
			column.colSpan = 4;
			var heading = document.createElement("h2"); //$NON-NLS-1$
			heading.appendChild(document.createTextNode(name));
			column.appendChild(heading);
		},
		execute: function () {
			window.setTimeout(function () {
				this.hide();
				var row = this._selectedRow;
				this._selectedRow = null;
				if (row && row._execute) {
					row._execute();
				}
			}.bind(this), 0);
		},
		filterChanged: function () {
			if (this._timeout) {
				window.clearTimeout(this._timeout);
			}
			this._timeout = window.setTimeout(function () {
				this._timeout = null;
				var value = this._keyAssistInput.value;
				if (this._filterString !== value) {
					this._filterString = value;
					this.createContents();
				}
			}.bind(this), 100);
		},
		hide: function () {
			if (!this.isVisible()) {
				return;
			}
			var activeElement = document.activeElement;
			var keyAssistDiv = this._keyAssistDiv;
			var hasFocus = keyAssistDiv === activeElement || (keyAssistDiv.compareDocumentPosition(activeElement) & 16) !== 0;
			keyAssistDiv.style.display = "none"; //$NON-NLS-1$
			if (hasFocus && document.compareDocumentPosition(this._previousActiveElement) !== 1) {
				this._previousActiveElement.focus();
			}
			this._previousActiveElement = null;
		},
		isVisible: function () {
			return this._keyAssistDiv.style.display === "block"; //$NON-NLS-1$
		},
		removeProvider: function(provider) {
			var index = this._providers.indexOf(provider);
			if (index !== -1) {
				this._providers.splice(index, 1);
			}
		},
		select: function (forward) {
			var rows = this._keyAssistTable.querySelectorAll(".keyAssistItem"), row; //$NON-NLS-1$
			if (rows.length === 0) {
				this._selectedIndex = -1;
				return;
			}
			var selectedIndex = this._selectedIndex;
			selectedIndex += forward ? 1 : -1;
			selectedIndex %= rows.length;
			if (selectedIndex < 0) {
				selectedIndex = rows.length - 1;
			}
			
			// Select the row (if any)
			this.selectRow(selectedIndex, rows);
		},
		selectRow: function(index, rows) {
			if (this._selectedIndex !== -1) {
				row = rows[this._selectedIndex];
				row.classList.remove("selected"); //$NON-NLS-1$
				row.childNodes[3].firstChild.classList.remove("keyAssistEditButtonVisible"); //$NON-NLS-1$
				this._selectedRow = null;
			}
			
			if (index >= 0 && index < rows.length) {
				this._selectedIndex = index;
				this._selectedRow = rows[this._selectedIndex];
				var row = this._selectedRow;
				row.classList.add("selected"); //$NON-NLS-1$
				row.childNodes[3].firstChild.classList.add("keyAssistEditButtonVisible"); //$NON-NLS-1$
				this._keyAssistTable.setAttribute("aria-activedescendant", row.id); //$NON-NLS-1$
				this._keyAssistTable.focus();
				var rowRect = row.getBoundingClientRect();
				var parent = this._keyAssistContents;
				var rect = parent.getBoundingClientRect();
				if (row.offsetTop < parent.scrollTop) {
					if (this._selectedIndex === 0) {
						parent.scrollTop = 0;
					} else {
						row.scrollIntoView(true);
					}
				} else if (rowRect.bottom > rect.bottom) {
					row.scrollIntoView(false);
				}
			}
		},
		show: function () {
			if (this.isVisible()) {
				return;
			}
			this._previousActiveElement = document.activeElement;
			this.createContents();
			this._keyAssistContents.style.height = Math.floor(this._keyAssistDiv.parentNode.clientHeight * 0.75) + "px"; //$NON-NLS-1$
			this._keyAssistDiv.style.display = "block"; //$NON-NLS-1$
			this._keyAssistInput.value = this._filterString;
			this._keyAssistInput.focus();
			this._keyAssistInput.select();
			
			metrics.logEvent("KeyBinding", "Panel", "Opened"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
		},
		_keyDown: function (e) {
			if (e.keyCode === 40) {
				this.select(true);
			} else if (e.keyCode === 38) {
				this.select(false);
			} else if (e.keyCode === 13) {
				this.execute();
			} else if (e.keyCode === lib.KEY.SPACE) {
				if (!this._editingABinding) {
					this.editBinding(this._selectedRow);
				}

			} else {
				return;
			}
			e.preventDefault();
		},
		_scrollWheel: function (e) {
			var pixelY = 0;
			if (util.isIE || util.isOpera) {
				pixelY = -e.wheelDelta;
			} else if (util.isFirefox) {
				pixelY = e.detail * 40;
			} else {
				pixelY = -e.wheelDeltaY;
			}
			var parent = this._keyAssistContents;
			var scrollTop = parent.scrollTop;
			parent.scrollTop += pixelY;
			if (scrollTop !== parent.scrollTop) {
				if (e.preventDefault) {
					e.preventDefault();
				}
				return false;
			}
		}
	};

	function createCommand(keyAssist, scopeId, commandRegistry) {
		var keyAssistCommand = new mCommands.Command({
			name: messages["Show Keys"],
			tooltip: messages["ShowAllKeyBindings"],
			id: "orion.keyAssist", //$NON-NLS-0$
			callback: function () {
				if (keyAssist.isVisible()) {
					keyAssist.hide();
				} else {
					keyAssist.show();
				}
				return true;
			}
		});
		commandRegistry.addCommand(keyAssistCommand);
		commandRegistry.registerCommandContribution(scopeId, "orion.keyAssist", 100, null, true, new keyBinding.KeyBinding(191, false, true)); //$NON-NLS-1$ //$NON-NLS-0$
		
		return keyAssistCommand;
	}
	return {
		KeyAssistPanel: KeyAssistPanel,
		createCommand: createCommand
	};
});