/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
/*global Terminal*/
define([
	"socket.io/socket.io",
	"requirejs/domReady",
	'orion/widgets/input/DropDownMenu',
	'orion/widgets/input/SettingsSelect',
	'orion/commands',
	"orion/PageUtil",
	"xterm/xterm"
], function(io, onReady, DropDownMenu, SettingsSelect, mCommands, PageUtil, xterm) {

	var term, serviceRegistry;
	var colorScheme = "Dark";

	onReady(function() {
		var socket, charWidth, charHeight, rows = 24, cols = 80;
		var fitToDiv = function(term) {
			if (socket === null) return;
			var termContainer = document.getElementById("terminalBox"),
				newWidth = termContainer.clientWidth,
				newHeight = termContainer.clientHeight;
			if (charWidth === undefined) {
				var span = document.createElement("span");
				span.textContent = "X";
				termContainer.appendChild(span);
				var rect = span.getBoundingClientRect();
				charWidth = rect.right - rect.left;
				charHeight = rect.bottom - rect.top + 2;
				termContainer.removeChild(span);
			}
			var newRows = (newHeight - 10) / (charHeight || 12);
			var newCols = Math.max(80, (newWidth - 10) / (charWidth || 12));
			if (newRows === rows && newCols !== cols) return;
			rows = newRows;
			cols = newCols;
			term.resize(Math.floor(newCols), Math.floor(newRows));
			socket.emit('resize', Math.floor(newCols), Math.floor(newRows));
		};

		var socketioPath = location.pathname.substr(0, location.pathname.indexOf('tty')) + 'socket.io/';
		socket = io.connect('/tty', { path: socketioPath });
		socket.on('connect', function() {
			socket.emit('start', getCWD());
		});
		socket.on('fail', function(error) {
			console.log(error);
		});
	
		socket.on('ready', function() {
			term = new xterm.Terminal({
				cols: cols,
				rows: rows,
				cursorBlink: true
			});
			
			term.onData(function(data) {
				socket.emit('data', data);
			});

			term.onTitleChange(function(title) {
				document.title = title;
			});
			var termContainer = document.getElementById("terminalBox");
			term.open(termContainer);
			
			fitToDiv(term);

			var timeout;
			window.addEventListener("resize", function() {
				if (timeout) clearTimeout(timeout);
				timeout = setTimeout(function() {
					fitToDiv(term);
					timeout = null;
				}, 500);
			});
			socket.on('data', function(data) {
				term.write(data);
			});
			socket.on('disconnect', function() {
				term.destroy();
			});
			
			changeScheme(colorScheme);
		});
		
	});
	
	function getCWD() {
		var result = PageUtil.matchResourceParameters(window.location.href).resource;
		return result.length > 0 ? result : null;
	}

	var schemes = {
		"Light": {
			cursor: "#000",
			cursorAccent: "#000",
			selection: "#3C71B3",
			background: "#FFF",
			foreground: "#000"
		},
		"Dark": {
			cursor: "#FFF",
			cursorAccent: "#FFF",
			selection: "dardkgray",
			background: "#000",
			foreground: "#FFF"
		},
		"Solarized": {
			cursor: "#839496",
			cursorAccent: "#839496",
			selection: "dardkgray",
			background: "#002b36",
			foreground: "#839496"
		},
		"Sky": {
			cursor: "lightgray",
			cursorAccent: "lightgray",
			selection: "lightgray",
			background: "#2c67c7",
			foreground: "white"
		},
		"Sand": {
			cursor: "lightgray",
			cursorAccent: "lightgray",
			selection: "lightgray",
			background: "#fef59b",
			foreground: "black"
		}
	};

	function changeScheme(schemeName) {
		if (term !== null) {
			term.setOption("theme", schemes[schemeName]);
		}
		if (serviceRegistry) {
			serviceRegistry.getService("orion.core.preference").put("/orion/console", {"colorScheme": schemeName});
		}
	}

	function createCommands(registry, commandRegistry) {
		serviceRegistry = registry;
		serviceRegistry.getService("orion.core.preference").get("/orion/console").then(function(prefs) {
			colorScheme = prefs.colorScheme || colorScheme;
			changeScheme(colorScheme);
		});
		
		var that = this;
		var settingsCommand = new mCommands.Command({
			imageClass: "core-sprite-wrench", //$NON-NLS-0$
			tooltip: "Settings",
			id: "orion.term.settings", //$NON-NLS-0$
			visibleWhen: /** @callback */ function(items, data) {
				return true;
			},
			callback: function(data) {
				var dropDown = settingsCommand.settingsDropDown;
				if (!dropDown || dropDown.isDestroyed()) {
					dropDown = settingsCommand.settingsDropDown = new DropDownMenu(data.domNode.parentNode, data.domNode, {
						noClick: true,
						selectionClass: 'dropdownSelection' //$NON-NLS-0$
					});
					var menu = dropDown.getContentNode();
					var select = new SettingsSelect({
						options: Object.keys(schemes).map(function(l) {
							return {label: l, value: l, selected: colorScheme === l};
						}),
						fieldlabel: "Color Scheme:",
						local: true
					});
					menu.appendChild(select.node);
					select.postChange = changeScheme;
					select.show();
					menu.tabIndex = menu.style.marginTop = 0;
				}
				dropDown.click();
			}
		});
		commandRegistry.addCommand(settingsCommand);
		commandRegistry.registerCommandContribution("settingsActions", "orion.term.settings", 1, null, false, null, null, this); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	}

	return {
		createCommands: createCommands
	};
});
