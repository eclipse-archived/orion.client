/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define window document navigator*/

define(['dojo', 'dijit', 'dojo/hash', 'dijit/form/ValidationTextBox'], function(dojo, dijit) {
                
/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * Utility methods
 * @namespace eclipse.util holds stateless utility methods.
 */
eclipse.util = eclipse.util || {};

eclipse.util.getUserKeyString = function(binding) {
	var userString = "";
	var isMac = navigator.platform.indexOf("Mac") !== -1;

	if (binding.mod1) {
		if (isMac) {
			userString+="Cmd+";
		} else {
			userString+="Ctrl+";
		}
	}
	if (binding.mod2) {
		userString += "Shift+";
	}
	if (binding.mod3) {
		userString += "Alt+";
	}
	if (binding.alphaKey) {
		return userString+binding.alphaKey;
	}
	for (var keyName in dojo.keys) {
		if (typeof(dojo.keys[keyName] === "number")) {
			if (dojo.keys[keyName] === binding.keyCode) {
				return userString+keyName;
			}
		}
	}
	var character;
	switch (binding.keyCode) {
		case 59:
			character = binding.mod2 ? ":" : ";";
			break;
		case 61:
			character = binding.mod2 ? "+" : "=";
			break;
		case 188:
			character = binding.mod2 ? "<" : ",";
			break;
		case 190:
			character = binding.mod2 ? ">" : ".";
			break;
		case 191:
			character = binding.mod2 ? "?" : "/";
			break;
		case 192:
			character = binding.mod2 ? "~" : "`";
			break;
		case 219:
			character = binding.mod2 ? "{" : "[";
			break;
		case 220:
			character = binding.mod2 ? "|" : "\\";
			break;
		case 221:
			character = binding.mod2 ? "}" : "]";
			break;
		case 222:
			character = binding.mod2 ? '"' : "'";
			break;
		}
	if (character) {
		return userString+character;
	}
	return userString+String.fromCharCode(binding.keyCode);
};

eclipse.util.openDialog = function(dialog, refNode) {
	dialog.startup();
	if (typeof refNode === "string") {
		var node = dojo.byId(refNode);
		if (!node) {
			node = dijit.byId(refNode);
			if (node) {
				node = node.domNode;
			}
		}
		if (node) {
			refNode = node;
		} else {
			refNode = null;
		}
	}
	if (refNode) {
		var pos= dojo.position(refNode); 
		// reaching into internal methods.  It seems there is not a public way.
		dialog._setStyleAttr("left:" + (pos.x + 16) + "px !important;");
		dialog._setStyleAttr("top:" + (pos.y + 16) + "px !important;");
	}
	dialog.show();
};

eclipse.util.getUserText = function(id, refNode, shouldHideRefNode, initialText, onComplete, onEditDestroy, promptMessage, selectTo) {
	/** @return function(event) */
	var handler = function(isKeyEvent) {
		return function(event) {
			var editBox = dijit.byId(id),
				newValue = editBox.get("value");
			if (isKeyEvent && event.keyCode === dojo.keys.ESCAPE) {
				if (shouldHideRefNode) {
					dojo.style(refNode, "display", "inline");
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
			} else if (!editBox.isValid() || newValue === initialText) {
				// No change; restore the old refnode
				if (shouldHideRefNode) {
					dojo.style(refNode, "display", "inline");
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
	dojo.place(editBox.domNode, refNode, "after");
	dojo.addClass(editBox.domNode, "userEditBoxPrompt");
	if (shouldHideRefNode) {
		dojo.style(refNode, "display", "none");
	}				
	dojo.connect(editBox, "onKeyDown", handler(true));
	dojo.connect(editBox, "onBlur", handler(false));
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
};

eclipse.util.openInNewWindow = function(event) {
	var isMac = window.navigator.platform.indexOf("Mac") !== -1;
	return (isMac && event.metaKey) || (!isMac && event.ctrlKey);
};

eclipse.util.followLink = function(href, event) {
	if (event && eclipse.util.openInNewWindow(event)) {
		window.open(href);
	} else {
		window.location = href;
	}
};

eclipse.util.getPositionInfo = 
	function(fileString) {
		var filePath, start, end, line, offset, length;
		// most likely this is just the hash portion of a URL.  In case not...
		var hashSegments = fileString.split('#');
		var postHash = hashSegments[hashSegments.length - 1];
		// Split on "?" but only if it's part of "?line" or "?char"
		var queryRegex = /\?(?=(?:line|char))/;
		var querySegments = postHash.split(queryRegex);
		filePath = eclipse.util.makeRelative(querySegments[0]);
		if (querySegments.length > 1) {
			// Split on "&" but only if it's part of "&line" or "&char"
			var segmentsRegex = /\&(?=(?:line|char))/;
			var segments = querySegments[1].split(segmentsRegex);
			for (var i = 0; i < segments.length; i++) {
				var subsegments = segments[i].split('=');
				if (subsegments.length > 1) {
					var positions;
					switch (subsegments[0]) {
					case 'char':
						positions = subsegments[1].split(',');
						if (line === undefined) {
							start = parseInt(positions[0]);
							if (positions.length > 1) {
								end = parseInt(positions[1]);
							}
						} else {
							offset = positions[0];
							if (positions.length > 1) {
								length = parseInt(positions[1] - offset);
							}
						}
						break;
					case 'line':
						positions = subsegments[1].split(',');
						line = parseInt(positions[0]);
						break;
					default:
						// ignore anything unrecognized
						break;
					}
				}  // ignore any unrecognized segments without '='
			}
		}
		return {"filePath": filePath, "start": start, "end": end, "line": line, "offset": offset, "length": length};
	};
	
/**
 * Construct a URL hash that represents the given file path at the given position,
 * with the specified selection range. 
 * @param {String} path of the file on the server
 * @param {Number} starting position within the content of the file
 * @param {Number} ending position of selection within the content of the file
 * @param {Number} line number within the content of the file, used only when no start is specified
 * @param {Number} offset within the line number, used only when line is specified
 * @param {Number} length of the selection, used to compute the ending point from a start or line offset
 */
eclipse.util.hashFromPosition = function(filePath, start, end, line, offset, length) {
	var hash;
	if (typeof(start) === "number") {
		hash = '#' + filePath + "?char=" + start;
		if (typeof(end) === "number") {
			hash = hash + "," + end;
		} else if (typeof(length) === "number") {
			hash = hash +  "," + (start + length);
		}
		return hash;
	}
	if (typeof(line) === "number") {
		hash = '#' + filePath + "?line=" + line;
		if (typeof(offset) === "number") {
			hash = hash + "&char=" + offset;
			if (typeof(length) === "number") {
				hash = hash + "," + (offset + length);
			}
		}
		return hash;
	}
	return "#"+filePath;
};
	
eclipse.util.makeRelative = function(location) {
	if (!location) {
		return location;
	}
	var nonHash = window.location.href.split('#')[0];
	var hostName = nonHash.substring(0, nonHash.length - window.location.pathname.length);
	if (location.indexOf(hostName) === 0) {
		return location.substring(hostName.length);
	}
	return location;
};

eclipse.util.makeFullPath = function(location) {
	if (!location) {
		return location;
	}
	var nonHash = window.location.href.split('#')[0];
	var hostName = nonHash.substring(0, nonHash.length - window.location.pathname.length);
	return (hostName + location);
};

/**
 * Determines if the path represents the workspace root
 */
eclipse.util.isAtRoot = function(path) {
	var relative = this.makeRelative(path);
	// TODO better way?
	// I thought it should be the line below but is actually the root of all workspaces
	//  return relative == '/file/';
	return relative.indexOf('/workspace') === 0;
};


eclipse.util.processNavigatorParent = function(parent, children) {
	//link the parent and children together
	parent.children = children;
	for (var e in children) {
		var child = children[e];
		child.parent=parent;
	}
	// not ideal, but for now, sort here so it's done in one place.
	// this should really be something pluggable that the UI defines
	parent.children.sort(function(a, b) {
		var isDir1 = a.Directory;
		var isDir2 = b.Directory;
		if (isDir1 !== isDir2) {
			return isDir1 ? -1 : 1;
		}
		var n1 = a.Name && a.Name.toLowerCase();
		var n2 = b.Name && b.Name.toLowerCase();
		if (n1 < n2) { return -1; }
		if (n1 > n2) { return 1; }
		return 0;
	}); 
};

eclipse.util.rememberSuccessfulTraversal = function(item, registry) {
	if (item.Parents && item.Parents.length === 0) {
		registry.getService("orion.core.preference").then(function(service) {
			return service.getPreferences("/window/recent");
		}).then(function(prefs){
			var projects = prefs.get("projects");
			if (typeof projects === "string") {
				projects = JSON.parse(projects);
			}
			var storedProjects = [];
			if (projects && projects.length && projects.length > 0) {
				for (var k=0; k<projects.length; k++) {
					if (projects[k].location !== item.ChildrenLocation && projects[k].name !== item.Name) {
						storedProjects.push(projects[k]);
					}
				}
				storedProjects.push({name: item.Name, location: item.ChildrenLocation});
			} else {
				storedProjects.push({name: item.Name, location: item.ChildrenLocation});
			}
			if (storedProjects.length > 5) {
				storedProjects= storedProjects.slice(-5, storedProjects.length);
			}
			prefs.put("projects", storedProjects);
		});
	}
};

/**
 * @param {DomNode} node
 * @returns {String} The text contained by node. Note that treatment of whitespace 
 * and child nodes is not consistent across browsers.
 */
eclipse.util.getText = function(node) {
	return typeof(node.textContent) !== "undefined" ? node.textContent : node.innerText;
};

/**
 * Escapes HTML in string. Use this to sanitize user input that is destined for innerHTML.
 * @param {String} string
 * @returns {String} The string with HTML safely escaped.
 */
eclipse.util.safeText = function(string) {
	return eclipse.util.getText(document.createTextNode(string));
};

/**
 * Removes all children of node and replaces them with a single text node containing text.
 * HTML is safely escaped.
 * @param {DomNode} node
 * @param {String} text
 */
eclipse.util.setText = function(node, text) {
	if (typeof(node.textContent) !== "undefined") {
		node.textContent = text;
	} else {
		node.innerText = text;
	}
};

return eclipse.util;
});