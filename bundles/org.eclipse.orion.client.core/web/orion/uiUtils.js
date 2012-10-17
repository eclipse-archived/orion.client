/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define window document navigator*/

define(['i18n!orion/nls/messages', 'dojo', 'dijit', 'dojo/hash', 'dijit/form/ValidationTextBox'], function(messages, dojo, dijit) {
                
	/**
	 * This class contains static utility methods. It is not intended to be instantiated.
	 * @class This class contains static utility methods.
	 * @name orion.uiUtils
	 */

	function getUserKeyString(binding) {
		var userString = "";
		var isMac = navigator.platform.indexOf("Mac") !== -1; //$NON-NLS-0$
	
		if (binding.mod1) {
			if (isMac) {
				userString+="Cmd+"; //$NON-NLS-0$
			} else {
				userString+="Ctrl+"; //$NON-NLS-0$
			}
		}
		if (binding.mod2) {
			userString += "Shift+"; //$NON-NLS-0$
		}
		if (binding.mod3) {
			userString += "Alt+"; //$NON-NLS-0$
		}
		if (binding.mod4 && isMac) {
			userString += "Ctrl+"; //$NON-NLS-0$
		}
		if (binding.alphaKey) {
			return userString+binding.alphaKey;
		}
		for (var keyName in dojo.keys) {
			if (typeof(dojo.keys[keyName] === "number")) { //$NON-NLS-0$
				if (dojo.keys[keyName] === binding.keyCode) {
					return userString+keyName;
				}
			}
		}
		var character;
		switch (binding.keyCode) {
			case 59:
				character = binding.mod2 ? ":" : ";"; //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 61:
				character = binding.mod2 ? "+" : "="; //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 188:
				character = binding.mod2 ? "<" : ","; //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 190:
				character = binding.mod2 ? ">" : "."; //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 191:
				character = binding.mod2 ? "?" : "/"; //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 192:
				character = binding.mod2 ? "~" : "`"; //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 219:
				character = binding.mod2 ? "{" : "["; //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 220:
				character = binding.mod2 ? "|" : "\\"; //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 221:
				character = binding.mod2 ? "}" : "]"; //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 222:
				character = binding.mod2 ? '"' : "'"; //$NON-NLS-1$ //$NON-NLS-0$
				break;
			}
		if (character) {
			return userString+character;
		}
		return userString+String.fromCharCode(binding.keyCode);
	}

	function getUserText(id, refNode, shouldHideRefNode, initialText, onComplete, onEditDestroy, promptMessage, selectTo, isInitialValid) {
		/** @return function(event) */
		var handler = function(isKeyEvent) {
			return function(event) {
				var editBox = dijit.byId(id),
					newValue = editBox.get("value"); //$NON-NLS-0$
				if (isKeyEvent && event.keyCode === dojo.keys.ESCAPE) {
					if (shouldHideRefNode) {
						dojo.style(refNode, "display", "inline"); //$NON-NLS-1$ //$NON-NLS-0$
					}
					// editBox.getPromptMessage(false);  // to get rid of prompting tooltip
					editBox.destroyRecursive();
					if (onEditDestroy) {
						onEditDestroy();
					}
					return;
				}
				if (isKeyEvent && event.keyCode !== dojo.keys.ENTER) {
					return;
				} else if (!editBox.isValid() || (!isInitialValid && newValue === initialText)) {
					// No change; restore the old refnode
					if (shouldHideRefNode) {
						dojo.style(refNode, "display", "inline"); //$NON-NLS-1$ //$NON-NLS-0$
					}
				} else {
					onComplete(newValue);
				}
				// editBox.getPromptMessage(false); // to get rid of prompting tooltip
				editBox.destroyRecursive();
				if (onEditDestroy) {
					onEditDestroy();
				}
			};
		};
	
		// Swap in an editable text field
		var editBox = new dijit.form.ValidationTextBox({
			id: id,
			required: true, // disallows empty string
			value: initialText || ""
			// promptMessage: promptMessage  // ignore until we can reliably dismiss this on destroy
		});
		dojo.place(editBox.domNode, refNode, "after"); //$NON-NLS-0$
		dojo.addClass(editBox.domNode, "userEditBoxPrompt"); //$NON-NLS-0$
		if (shouldHideRefNode) {
			dojo.style(refNode, "display", "none"); //$NON-NLS-1$ //$NON-NLS-0$
		}				
		dojo.connect(editBox, "onKeyDown", handler(true)); //$NON-NLS-0$
		dojo.connect(editBox, "onBlur", handler(false)); //$NON-NLS-0$
		window.setTimeout(function() { 
			editBox.focus(); 
			if (initialText) {
				var box = dojo.byId(id);
				var end = selectTo ? initialText.indexOf(selectTo) : -1;
				if (end > 0) {
					dijit.selectInputText(box, 0, end);
				} else {
					box.select();
				}
			}
		}, 0);
	}
	
	/**
	 * Returns whether the given event should cause a reference
	 * to open in a new window or not.
	 * @param {Object} event The key event
	 * @name orion.util#openInNewWindow
	 * @function
	 */
	function openInNewWindow(event) {
		var isMac = window.navigator.platform.indexOf("Mac") !== -1; //$NON-NLS-0$
		return (isMac && event.metaKey) || (!isMac && event.ctrlKey);
	}
	
	/**
	 * Opens a link in response to some event. Whether the link
	 * is opened in the same window or a new window depends on the event
	 * @param {String} href The link location
	 * @name orion.util#followLink
	 * @function
	 */
	function followLink(href, event) {
		if (event && openInNewWindow(event)) {
			window.open(href);
		} else {
			window.location = href;
		}
	}

	//return module exports
	return {
		getUserKeyString: getUserKeyString,
		getUserText: getUserText,
		openInNewWindow: openInNewWindow,
		followLink: followLink
	};
});
