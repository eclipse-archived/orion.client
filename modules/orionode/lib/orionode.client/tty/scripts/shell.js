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
	"/socket.io/socket.io.js",
	"/requirejs/domReady.js",
	'orion/widgets/input/DropDownMenu',
	'orion/widgets/input/SettingsSelect',
	'orion/commands',
	"orion/PageUtil",
	"/term.js"
], function(io, onReady, DropDownMenu, SettingsSelect, mCommands, PageUtil/*, Terminal*/) {

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

		socket = io.connect('/tty');
		socket.on('connect', function() {
			socket.emit('start', getCWD());
		});
		socket.on('fail', function(error) {
			console.log(error);
		});
	
		socket.on('ready', function() {
			term = new Terminal({
				cols: cols,
				rows: rows,
				useStyle: true,
				screenKeys: true,
			});
			
			term.on('data', function(data) {
				socket.emit('data', data);
			});

			term.on('title', function(title) {
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

	function changeScheme(schemeName) {
		var t;
		if (term !== null) {
			t = document.querySelector('.terminal');
			switch(schemeName) {
			case 'Dark': 
				t.style.backgroundColor = t.style.borderColor = "#000000";
				t.style.color = "#fdf6e3";
				term.colors[0] = '#000000';
				term.colors[1] = '#dc322f';
				term.colors[2] = '#859900';
				term.colors[3] = '#b58900';
				term.colors[4] = '#268bd2';
				term.colors[5] = '#d33682';
				term.colors[6] = '#2aa198';
				term.colors[7] = '#eee8d5';
				term.colors[8] = '#002b36';
				term.colors[9] = '#cb4b16';
				term.colors[10] = '#8AE234'; //Linux Tango - user@machine, shell scripts
				term.colors[11] = '#FCE94F'; //Linux Tango - ~/location/
				term.colors[12] = '#729FCF'; //Linux Tango - (git-branch)
				term.colors[13] = '#AD7FA8'; //Linux Tango - images
				term.colors[14] = '#3465A4'; //Linux Tango - javascript comments
				term.colors[15] = '#fdf6e3';
				term.colors[256] = '#000000';
				term.colors[257] = '#fdf6e3';
				break;
			case 'Light':
				t.style.backgroundColor = t.style.borderColor = "#ffffff";
				t.style.color = "#000000";
				term.colors[0] = '#ffffff';
				term.colors[1] = '#dc322f';
				term.colors[2] = '#859900';
				term.colors[3] = '#b58900';
				term.colors[4] = '#268bd2';
				term.colors[5] = '#d33682';
				term.colors[6] = '#2aa198';
				term.colors[7] = '#000000';
				term.colors[8] = '#002b36';
				term.colors[9] = '#cb4b16';
				term.colors[10] = '#8AE234'; //Linux Tango - user@machine, shell scripts
				term.colors[11] = '#FCE94F'; //Linux Tango - ~/location/
				term.colors[12] = '#729FCF'; //Linux Tango - (git-branch)
				term.colors[13] = '#AD7FA8'; //Linux Tango - images
				term.colors[14] = '#3465A4'; //Linux Tango - javascript comments
				term.colors[15] = '#000000';
				term.colors[256] = '#ffffff';
				term.colors[257] = '#000000';
				break;
			case 'Solarized':
				t.style.backgroundColor = t.style.borderColor = "#002b36";
				t.style.color = "#839496";
				term.colors[0] = '#073642';
				term.colors[1] = '#dc322f'; //git - changes not staged for commit
				term.colors[2] = '#268bd2'; //git - changes staged for commit
				term.colors[3] = '#b58900';
				term.colors[4] = '#268bd2';
				term.colors[5] = '#d33682';
				term.colors[6] = '#2aa198';
				term.colors[7] = '#eee8d5';
				term.colors[8] = '#002b36';
				term.colors[9] = '#cb4b16';
				term.colors[10] = '#d33682'; //magenta user@machine
				term.colors[11] = '#268bd2';
				term.colors[12] = '#859900'; //green location
				term.colors[13] = '#6c71c4';
				term.colors[14] = '#2aa198';
				term.colors[15] = '#fdf6e3';
				break;
			}
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
						selectionClass: 'dropdownSelection', //$NON-NLS-0$
						onShow: function() {
							dropDown.focus();
						},
						onHide: function() {
							that.editor.focus();
						}
					});
					var menu = dropDown.getContentNode();
					var select = new SettingsSelect({
						options: ["Dark", "Light", "Solarized"].map(function(l) {
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
