/*******************************************************************************
 * Copyright (c) 2010,2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

 /*global define window Image */
 
define(['dojo', 'dijit', 'orion/util', 'dijit/Menu', 'dijit/form/DropDownButton' ], function(dojo, dijit, mUtil){

var exports = {};

/**
 * The command service manages the available commands.
 * @class The command service manages the available commands.
 */
exports.CommandService = (function() {
	/**
	 * Constructs a new command service with the given options.
	 * @param {Object} options The command options object which includes the service registry.
	 * @class CommandService can render commands appropriate for a particular scope and DOM element.
	 * @name orion.commands.CommandService
	 */
	function CommandService(options) {
		this._domScope = {};
		this._objectScope = {};
		this._globalScope = {};
<<<<<<< HEAD
<<<<<<< HEAD
		this._namedGroups = {};
		this._activeBindings = {};
=======
		this._namedGroups = {};
		this._activeBindings = {};
>>>>>>> 2bb365a2a0e7549e187c7fbefa846a2b43056ecb
=======
		this._namedGroups = {};
		this._activeBindings = {};
>>>>>>> 2bb365a2a0e7549e187c7fbefa846a2b43056ecb
		this._init(options);
	}
	CommandService.prototype = /** @lends orion.commands.CommandService.prototype */ {
		_init: function(options) {
			this._registry = options.serviceRegistry;
			this._serviceRegistration = this._registry.registerService("orion.page.command", this);
			this._selection = options.selection;
			dojo.connect(window.document, "onkeydown", dojo.hitch(this, function (evt){
				evt = evt || window.event;
				// bindings are always ignored if we are in a text field.
				// TODO are there dojo text fields that wouldn't meet these criteria?
				var tagType = evt.target.nodeName.toLowerCase();
				if ((tagType === 'input' && evt.target.type.toLowerCase() === "text") || tagType === 'textarea') {
					return;
				}
				this._processKey(evt);
			}));
<<<<<<< HEAD
		},
		
		_processKey: function(event) {
			function stop(event) {
				if (window.document.all) { 
					event.keyCode = 0;
				} else { 
					event.preventDefault();
					event.stopPropagation();
				}
			}
			for (var id in this._activeBindings) {
				if (this._activeBindings[id] && this._activeBindings[id].keyBinding && this._activeBindings[id].command) {
					if (this._activeBindings[id].keyBinding.match(event)) {
						var activeBinding = this._activeBindings[id];
						var command = activeBinding.command;
						if (command.hrefCallback) {
							stop(event);
							var href = command.hrefCallback.call(activeBinding.handler || window, activeBinding.items, id, activeBinding.userData);
							if (href.then){
								href.then(function(l){
									window.open(l);
								});
							} else {
								// We assume window open since there's no link gesture to tell us what to do.
								window.open(href);
							}
							return;
						} else if (command.callback) {
							stop(event);
							window.setTimeout(function() {
								command.callback.call(activeBinding.handler || window, activeBinding.items, id, null, activeBinding.userData);
							}, 0);
							return;
						}
					}
				}
			}
		},

		
		/**
		 * Return the selection service that is being used when commands should apply against a selection.
		 */
		getSelectionService: function() {
			return this._selection;
		},
		
		showKeyBindings: function(targetNode) {
			for (var binding in this._activeBindings) {
				if (this._activeBindings[binding] && this._activeBindings[binding].keyBinding && this._activeBindings[binding].command) {
					dojo.place("<br>"+this._activeBindings[binding].keyBinding.userString+" = "+this._activeBindings[binding].command.name, targetNode, "last");
				}
			}
=======
		},
		
		_processKey: function(event) {
			function stop(event) {
				if (window.document.all) { 
					event.keyCode = 0;
				} else { 
					event.preventDefault();
					event.stopPropagation();
				}
			}
			for (var id in this._activeBindings) {
				if (this._activeBindings[id] && this._activeBindings[id].keyBinding && this._activeBindings[id].command) {
					if (this._activeBindings[id].keyBinding.match(event)) {
						var activeBinding = this._activeBindings[id];
						var command = activeBinding.command;
						if (command.hrefCallback) {
							stop(event);
							var href = command.hrefCallback.call(activeBinding.handler || window, activeBinding.items, id, activeBinding.userData);
							if (href.then){
								href.then(function(l){
									window.open(l);
								});
							} else {
								// We assume window open since there's no link gesture to tell us what to do.
								window.open(href);
							}
							return;
						} else if (command.callback) {
							stop(event);
							window.setTimeout(function() {
								command.callback.call(activeBinding.handler || window, activeBinding.items, id, null, activeBinding.userData);
							}, 0);
							return;
						}
					}
				}
			}
		},

		
		/**
		 * Return the selection service that is being used when commands should apply against a selection.
		 */
		getSelectionService: function() {
			return this._selection;
		},
		
		showKeyBindings: function(targetNode) {
			for (var binding in this._activeBindings) {
				if (this._activeBindings[binding] && this._activeBindings[binding].keyBinding && this._activeBindings[binding].command) {
					dojo.place("<span>"+mUtil.getUserKeyString(this._activeBindings[binding].keyBinding)+" = "+this._activeBindings[binding].command.name+"<br></span>", targetNode, "last");
				}
			}
>>>>>>> 2bb365a2a0e7549e187c7fbefa846a2b43056ecb
		},
		
		/** 
		 * Add a command at a particular scope.
		 * @param {Command} the command being added.
		 * @param {String} scope The scope to which the command applies.  "global"
		 *  commands apply across the page, "dom" level commands apply only when the 
		 *  specified dom element is rendering commands, and "object" scope applies 
		 *  to particular objects being displayed in widgets such as lists or trees.
		 */
		addCommand: function(command, scope) {
			switch (scope) {
			case "dom":
				this._domScope[command.id] = command;
				break;
			case "object":
				this._objectScope[command.id] = command;
				break;
			case "global":
				this._globalScope[command.id] = command;
				break;
			default:
				throw "unrecognized command scope " + scope;
			}
		},
		
		/**
		 * Registers a command group and specifies visual information about the group.
		 * @param {String} the id of the group, must be unique.  Also used for dom node id
		 * @param {Number} the relative position of the group within its parent, optional.
		 * @param {String} the title of the group, optional
		 * @param {String} the path of parent groups, separated by '/'.  For example,
		 *  a path of "group1Id/group2Id" indicates that the group belongs as a child of 
		 *  group2Id, which is itself a child of group1Id.  Optional.
		 * @param {String} the id of a DOM element related to the command's scope.  Optional.
		 *  For example, if the scope is "dom" level, the scopeId describes which dom id to which this
		 *  command should be added
		 */	
		 
		addCommandGroup: function(groupId, position, title, parentPath, scopeId) {
			var parentTable = this._namedGroups;
			if (parentPath) {
				parentTable = this._createEntryForPath(parentPath);		
			} 
			if (parentTable[groupId]) {
				// update existing group definition if info has been supplied
				if (title) {
					parentTable[groupId].title = title;
				}
				if (position) {
					parentTable[groupId].position = position;
				}
				if (scopeId) {
					parentTable[groupId].scopeId = scopeId;
				}
			} else {
				// create new group definition
				parentTable[groupId] = {title: title, position: position, children: {}, scopeId: scopeId};
				parentTable.sortedCommands = null;
			}
		},
		
		_createEntryForPath: function(parentPath) {
			var parentTable = this._namedGroups;
			if (parentPath) {
				var segments = parentPath.split("/");
				for (var i = 0; i < segments.length; i++) {
					if (segments[i].length > 1) {
						if (!parentTable[segments[i]]) {
							// empty slot with children
							parentTable[segments[i]] = {position: 0, children: {}};
						} 
						parentTable = parentTable[segments[i]].children;
					}
				}
			}
			return parentTable;	
		},
		
		/**
		 * Register a command contribution, which identifies how a command appears
		 * on a page and how it is invoked.
		 * @param {String} the id of the command
		 * @param {String} scopeId The id related to the scope.  Depending on the scope,
		 *  this might be the id of the page or of a dom element.
		 * @param {String} the path on which the command is located.  Optional.
		 * @param {Number} the relative position of the command within its parent
		 * @param {orion.commands.CommandKeyBinding} a keyBinding for the command.  Optional.
		 * @param {boolean} if true, then the command is never rendered, but the keybinding is hooked.
		 */
		registerCommandContribution: function(commandId, position, scopeId, parentPath, keyBinding, keyOnly) {
			// first ensure the parentPath is represented
			var parentTable = this._createEntryForPath(parentPath);
			
			// store the contribution
			parentTable[commandId] = {scopeId: scopeId, position: position};
			
			// add to the bindings table now
			if (keyBinding) {
				var command = this._domScope[commandId] || this._globalScope[commandId];
				if (command) {
					this._activeBindings[commandId] = {command: command, keyBinding: keyBinding, keyOnly: keyOnly};
				}
			}
			
			// get rid of sort cache because we have a new contribution
			parentTable.sortedCommands = null;
		},
		
		_isLastChildSeparator: function(parent, style) {
			if (style === "image") {
				return parent.childNodes.length > 0 && dojo.hasClass(parent.childNodes[parent.childNodes.length - 1], "commandSeparator");
			}
			if (style === "menu") {
				var menuChildren = parent.getChildren();
				return menuChildren.length > 0 && (menuChildren[menuChildren.length-1] instanceof dijit.MenuSeparator);
			}
			return false;
		},

		/**
		 * Render the commands that are appropriate for the given scope.
		 * @param {DOMElement} parent The element in which commands should be rendered.
		 * @param {String} scope The scope to which the command applies.  "dom" level 
		 *  commands apply only when a specified dom element is rendering commands.
		 *  "object" scope applies to particular objects/items displayed in widgets
		 *  such as list or trees.
		 * @param {Object} items An item or array of items to which the command applies.
		 * @param {Object} handler The object that will perform the command
		 * @param {String} style The style in which the command should be rendered.  Currently
		 *  only "image" is implemented, but this should involve into something like "button,"
		 *  "menu," "link," etc.
		 * @param {Object} userData Optional user data that should be attached to generated command callbacks
		 * @param {Boolean} forceText Always use text and not the icon when showing the command, regardless of style.
		 */	
		renderCommands: function(parent, scope, items, handler, renderType, cssClass, userData, forceText) {
			if (!items) {
				var cmdService = this;
				if (this._selection) {
					this._selection.getSelections(function(selections) {
						cmdService.renderCommands(parent, scope, selections, handler, renderType, cssClass, userData, forceText);
					});
				}
				return;
			} 
			var refCommands;
			if (scope === "object") {
				refCommands = this._objectScope;
			} else if (scope === "dom") {
				refCommands = this._domScope;
			} else if (scope === "global") {
				refCommands = this._globalScope;
			} else {
				throw "Unrecognized command scope " + scope;
			}
			this._render(this._namedGroups, parent, scope, items, handler, renderType, cssClass, userData, refCommands, forceText);
			// If the last thing we rendered was a group, it's possible there is an unnecessary trailing separator.
			if (renderType === "image") {
				if (this._isLastChildSeparator(parent, renderType)) {
					parent.removeChild(parent.childNodes[parent.childNodes.length-1]);
				}
			} else if (renderType=== "menu") {
				if (this._isLastChildSeparator(parent, renderType)) {
					var child = parent.getChildren()[parent.getChildren().length-1];
					parent.removeChild(child);
					child.destroy();
				}
			}
		},
		
		_render: function(commandItems, parent, scope, items, handler, renderType, cssClass, userData, commandList, forceText) {
			// sort the items
			var positionOrder = commandItems.sortedCommands;
			if (!positionOrder) {
				positionOrder = [];
				for (var key in commandItems) {
					var item = commandItems[key];
					if (item && typeof(item.position) === "number") {
						item.id = key;
						positionOrder.push(item);
					}
				}
				positionOrder.sort(function(a,b) {
					return a.position-b.position;
				});
				commandItems.sortedCommands = positionOrder;
			}
			// now traverse the command items and render as we go
			for (var i = 0; i < positionOrder.length; i++) {
				var image, id, menuButton;
				if (positionOrder[i].children) {
					var group = positionOrder[i];
					if (group.scopeId && parent.id !== group.scopeId) {
						continue;
					}
					var children;
					if (renderType === "image") {
						if (group.title) {
							// we need a named menu button, but first let's see if we actually have content
							var newMenu= new dijit.Menu({
								style: "display: none;"
							});
							// if commands are scoped to the dom, we'll need to identify a menu with the dom id of its original parent
							newMenu.eclipseScopeId = parent.eclipseScopeId || parent.id;
							// render the children
							this._render(positionOrder[i].children, newMenu, scope, items, handler, "menu", cssClass, userData, commandList, forceText); 
							// special post-processing when we've created a menu in an image bar.
							// we want to get rid of a trailing separator in the menu first, and then decide if a menu is necessary
							children = newMenu.getChildren();
							if (this._isLastChildSeparator(newMenu, "menu")) {
								var trailingSep = children[children.length-1];
								newMenu.removeChild(trailingSep);
								trailingSep.destroy();
								children = newMenu.getChildren();
							}
							// now decide if we needed the menu or not
							if (children.length > 0) {
								var needMenu = true;
								var menuCommand = children[0].eclipseCommand;
								if (children.length === 1) {
									// we don't want to put a single command in a button menu, just add the image
									needMenu = !(menuCommand && menuCommand.hasImage());
								}
								if (needMenu) {
									menuButton = new dijit.form.DropDownButton({
										label: group.title,
										dropDown: newMenu
								        });
									dojo.addClass(menuButton.domNode, "commandLink");
							        if (cssClass) {
										dojo.addClass(menuButton.domNode, cssClass);
							        } 
									dojo.place(menuButton.domNode, parent, "last");
								} else {
									id = "image" + menuCommand.id + i;  // using the index ensures unique ids within the DOM when a command repeats for each item
									image = menuCommand._asImage(id, items, handler, userData, forceText);
									dojo.place(image, parent, "last");
								}
							}
						} else {
							var sep;
							// Only draw a separator if there is a non-separator preceding it.
							if (parent.childNodes.length > 0 && !this._isLastChildSeparator(parent, renderType)) {
								sep = this.generateSeparatorImage();
								dojo.place(sep, parent, "last");
							}
							this._render(positionOrder[i].children, parent, scope, items, handler, renderType, cssClass, userData, commandList, forceText); 

							// make sure that more than just the separator got rendered before rendering a trailing separator
							if (parent.childNodes.length > 0) {
								var lastRendered = parent.childNodes[parent.childNodes.length - 1];
								if (lastRendered !== sep) {
									sep = this.generateSeparatorImage();
									dojo.place(sep, parent, "last");
								}
							}
						}
					} else {
						// group within a menu
						if (group.title) {
							var subMenu = new dijit.Menu();
							this._render(positionOrder[i].children, subMenu, scope, items, handler, renderType, cssClass, userData, commandList, forceText); 
							if (subMenu.getChildren().length > 0) {
								parent.addChild(new dijit.PopupMenuItem({
									label: group.title,
									popup: subMenu
								}));
							}
						} else {
							// don't render a separator if there is nothing preceding, or if the last thing was a separator
							var menuSep;
							if (parent.getChildren().length > 0 && !this._isLastChildSeparator(parent, renderType)) {
								menuSep = new dijit.MenuSeparator();
								parent.addChild(menuSep);
							}
							this._render(positionOrder[i].children, parent, scope, items, handler, renderType, cssClass, userData, commandList, forceText); 
							// Add a trailing separator if children rendered.
							var menuChildren = parent.getChildren();
							if (menuChildren[menuChildren.length - 1] !== menuSep) {
								menuSep = new dijit.MenuSeparator();
								parent.addChild(menuSep);
							}
						}
					}
				} else {
					// processing atomic commands
					var command = commandList[positionOrder[i].id];
					var render = command ? true : false;
					if (command) {
						if (scope === "dom") {
							if (renderType=== "image") {
								render = parent.id === positionOrder[i].scopeId;
							} else if (renderType=== "menu") {
								render = parent.eclipseScopeId === positionOrder[i].scopeId;
							} else {
								render = false;
							}
						} 
						// ensure that keybindings are bound to the current handler, items, and user data
						if (this._activeBindings[command.id] && this._activeBindings[command.id].keyBinding) {
							var binding = this._activeBindings[command.id];
							binding.items = items;
							binding.userData = userData;
							binding.handler = handler;
							// if the binding is keyOnly, don't render the command.
							if (binding.keyOnly) {
								render = false;
							}
						}
						if (render && command.visibleWhen) {
							render = command.visibleWhen(items);
						}
					}
					if (render) {
						// special case.  The item wants to provide a set of choices
						if (command.choiceCallback) {
							var choicesMenu = new dijit.Menu({
								style: "display: none;"
							});
							if (renderType === "image") {
								menuButton = new dijit.form.DropDownButton({
										label: command.name,
										dropDown: choicesMenu
								        });
								if (command.image) {
									dojo.addClass(menuButton.iconNode, "commandImage");
									if (cssClass) {
										dojo.addClass(menuButton.iconNode, cssClass);
									}
									menuButton.iconNode.src = command.image;
								}
								dojo.place(menuButton.domNode, parent, "last");
								menuButton.eclipseCommand = command;
								menuButton.eclipseChoices = choicesMenu;
								dojo.connect(menuButton, "onClick", menuButton, function(event) {
									this.eclipseCommand.populateChoicesMenu(this.eclipseChoices, items, handler, userData);
								});
							} else if (renderType === "menu") {
								// parent is already a menu
								var popup = new dijit.PopupMenuItem({
									label: command.name,
									popup: choicesMenu
								});
								parent.addChild(popup);
								popup.eclipseCommand = command;
								popup.eclipseChoices = choicesMenu;
								// See https://bugs.eclipse.org/bugs/show_bug.cgi?id=338887
								dojo.connect(parent, "_openPopup", popup, function(event) {
									this.eclipseCommand.populateChoicesMenu(this.eclipseChoices, items, handler, userData);
								});
							}
						} else {
							if (renderType === "image") {
								id = "image" + command.id + i;  // using the index ensures unique ids within the DOM when a command repeats for each item
								image = command._asImage(id, items, handler, userData, cssClass, forceText);
								dojo.place(image, parent, "last");
							} else if (renderType === "menu") {
								command._addMenuItem(parent, items, handler, userData, cssClass);
							}
						}
					}
				}
			}
		},
		generateSeparatorImage: function() {
			var sep = new Image();
			// TODO should get this from CSS
			sep.src = "/images/sep.gif";
			dojo.addClass(sep, "commandImage");
			dojo.addClass(sep, "commandSeparator");
			return sep;
		}

	};  // end prototype
	return CommandService;
}());


exports.Command = (function() {
	/**
	 * Constructs a new command with the given options.
	 * @param {Object} options The command options object
	 * @class A command is an object that describes an action a user can perform, as well as when and
	 *  what it should look like when presented in various contexts.  Commands are identified by a
	 *  unique id.
	 * @name orion.commands.Command
	 */
	function Command (options) {
		this._init(options);
	}
	Command.prototype = /** @lends orion.commands.Command.prototype */ {
		_init: function(options) {
			this.id = options.id;  // unique id
			this.name = options.name || "Empty Command";
			this.tooltip = options.tooltip || options.name;
			this.callback = options.callback; // optional callback that should be called when command is activated (clicked)
			this.hrefCallback = options.hrefCallback; // optional callback that returns an href for a command link
			this.choiceCallback = options.choiceCallback; // optional callback indicating that the command will supply secondary choices.  
														// A choice is an object with a name, callback, and optional image
			this.image = options.image || "/images/none.png";
			this.visibleWhen = options.visibleWhen;
			// when false, affordances for commands are always shown.  When true,
			// they are shown on hover only.
			//how will we know this?
			this._deviceSupportsHover = false;  
		},
		_asImage: function(name, items, handler, userData, cssClass, forceText) {
			handler = handler || this;
			var image = new Image();
			var link = dojo.create("a");
			link.id = this.name+"link";
			image.alt = this.name;
			image.title = this.name;
			image.name = name;
			image.id = name;
			if (forceText || !this.hasImage()) {
				var text = window.document.createTextNode(this.name);
				dojo.place(text, link, "last");
			}
			if (this.hrefCallback) {
				var href = this.hrefCallback.call(handler, items, this.id, userData);
				if(href.then){
					href.then(function(l){
						link.href = l;
					});
				}else{
					link.href = href; 
				}
			} else if (this.callback) {
				if (!forceText && this.hasImage()) {
					dojo.connect(image, "onclick", this, function() {
						this.callback.call(handler, items, this.id, image.id, userData);
					});
				} else {
					dojo.connect(link, "onclick", this, function() {
						this.callback.call(handler, items, this.id, link.id, userData);
					});
				}
			}
			if (!forceText && this.hasImage()) {
				if (this._deviceSupportsHover) {
					image.src = "/images/none.png";
					dojo.connect(image, "onmouseover", this, function() {
						image.src = this.image;
					});
					dojo.connect(image, "onmouseout", this, function() {
						image.src = "/images/none.png";
					});	
				} else {
					image.src = this.image;	
					dojo.style(image, "opacity", "0.7");
					dojo.connect(image, "onmouseover", this, function() {
						dojo.style(image, "opacity", "1");
					});
					dojo.connect(image, "onmouseout", this, function() {
						image.src = this.image;
						dojo.style(image, "opacity", "0.7");
					});
				}
				dojo.addClass(image, 'commandImage');
				if (cssClass) {
					dojo.addClass(image, cssClass);
				}			
				dojo.place(image, link, "last");
			}
			dojo.addClass(link, 'commandLink');
			if (cssClass) {
				dojo.addClass(link, cssClass);
			}
			return link;
		},
		_asLink: function(items, handler, cssClass) {
			handler =  handler || this;
			var anchor = window.document.createElement('a');
			dojo.place(window.document.createTextNode(this.name), anchor, "only");
			anchor.href="";
			anchor.id = this.id+"link";
			if (this.callback) {
				dojo.connect(anchor, "onclick", this, function() {
					this.callback.call(handler, items, this.id, anchor.id);
				});
			} else if (this.hrefCallback) {
				var href = this.hrefCallback.call(handler, items, this.id);
				if (href) {
					if (href.then){
						href.then(function(link){
							anchor.href = link;
						});
					}else{
						anchor.href = href;
					}
				}
			}
			dojo.addClass(anchor, 'commandLink');
			if (cssClass) {
				dojo.addClass(anchor, cssClass);
			} 
			return anchor;
		},
		_addMenuItem: function(parent, items, handler, userData, cssClass) {
			var menuitem = new dijit.MenuItem({
				labelType: this.hrefCallback ? "html" : "text",
				label: this.name,
				tooltip: this.tooltip
			});
			if (this.hrefCallback) {
				var loc = this.hrefCallback.call(handler, items, this.id, parent.id, userData);
				if (loc) {
					if (loc.then) {
						loc.then(dojo.hitch(this, function(l) { 
							menuitem.set("label", "<a href='"+l+"'>"+this.name+"</a>");
							menuitem.onClick = function(event) {mUtil.followLink(l, event);};
						}));
					} else {
						menuitem.set("label", "<a href='"+loc+"'>"+this.name+"</a>");
						menuitem.onClick = function(event) {mUtil.followLink(loc, event);};
					}
				}
			} else if (this.callback) {
				menuitem.onClick = dojo.hitch(this, function() {
					this.callback.call(handler, items, this.id, null, userData);
				});
			}
			
			// we may need to refer back to the command.  
			menuitem.eclipseCommand = this;
			parent.addChild(menuitem);
			if (this.image) {
				dojo.addClass(menuitem.iconNode, 'commandImage');
				if (cssClass) {
					dojo.addClass(menuitem.iconNode, cssClass);
				}
				// reaching...
				menuitem.iconNode.src = this.image;
			}
		},
		populateChoicesMenu: function(menu, items, handler, userData) {
			// see http://bugs.dojotoolkit.org/ticket/10296
			menu.focusedChild = null;
			dojo.forEach(menu.getChildren(), function(child) {
				menu.removeChild(child);
				child.destroy();
			});

			var choices = this.getChoices(items, handler, userData);
			for (var j=0; j<choices.length; j++) {
				var choice = choices[j];
				var menuitem;
				if (choice.name) {
					menuitem = new dijit.MenuItem({
						label: choice.name,
						onClick: this.makeChoiceCallback(choice, items)
					});
					if (choice.image) {
						dojo.addClass(menuitem.iconNode, 'commandImage');
						menuitem.iconNode.src = choice.image;
					}
				} else {  // anything not named is a separator
					menuitem = new dijit.MenuSeparator();
				}
				menu.addChild(menuitem);
			}
		},
		getChoices: function(items, handler, userData) {
			if (this.choiceCallback) {
				return this.choiceCallback.call(handler, items, userData);
			}
			return null;
		},
		
		makeChoiceCallback: function(choice, items) {
			return function(event) {
				if (choice.callback) {
					choice.callback.call(choice, items, event);
				}
			};
		},
		hasImage: function() {
			return this.image !== "/images/none.png";
		}
	};  // end prototype
	return Command;
<<<<<<< HEAD
=======
}());

/**
 * Constructs a new key binding with the given key code and modifiers.
 * 
 * @param {String|Number} keyCode the key code.
 * @param {Boolean} mod1 the primary modifier (usually Command on Mac and Control on other platforms).
 * @param {Boolean} mod2 the secondary modifier (usually Shift).
 * @param {Boolean} mod3 the third modifier (usually Alt).
 * @param {Boolean} mod4 the fourth modifier (usually Control on the Mac).
 * 
 * @class A CommandKeyBinding represents of a key code and a modifier state that can be triggered by the user using the keyboard.
 * @name eclipse.CommandKeyBinding
 * 
 * @property {Object|String|Number} keyCode An eclipse.KeyBinding or key code.
 * @property {Boolean} mod1 The primary modifier (usually Command on Mac and Control on other platforms).
 * @property {Boolean} mod2 The secondary modifier (usually Shift).
 * @property {Boolean} mod3 The third modifier (usually Alt).
 * @property {Boolean} mod4 The fourth modifier (usually Control on the Mac).
 */
eclipse.CommandKeyBinding = (function() {
	var isMac = navigator.platform.indexOf("Mac") !== -1;
	/** @private */
	function CommandKeyBinding (keyCode, mod1, mod2, mod3, mod4) {
		if (typeof(keyCode) === "string") {
			this.keyCode = keyCode.toUpperCase().charCodeAt(0);
		} else {
			this.keyCode = keyCode;
		}
		this.mod1 = mod1 !== undefined && mod1 !== null ? mod1 : false;
		this.mod2 = mod2 !== undefined && mod2 !== null ? mod2 : false;
		this.mod3 = mod3 !== undefined && mod3 !== null ? mod3 : false;
		this.mod4 = mod4 !== undefined && mod4 !== null ? mod4 : false;
	}
	CommandKeyBinding.prototype = /** @lends eclipse.CommandKeyBinding.prototype */ {
		/**
		 * Returns whether this key binding matches the given key event.
		 * 
		 * @param e the key event.
		 * @returns {Boolean} <code>true</code> whether the key binding matches the key event.
		 */
		match: function (e) {
			if (this.keyCode === e.keyCode) {
				var mod1 = isMac ? e.metaKey : e.ctrlKey;
				if (this.mod1 !== mod1) { return false; }
				if (this.mod2 !== e.shiftKey) { return false; }
				if (this.mod3 !== e.altKey) { return false; }
				if (isMac && this.mod4 !== e.ctrlKey) { return false; }
				return true;
			}
			return false;
		},
		/**
		 * Returns whether this key binding is the same as the given parameter.
		 * 
		 * @param {eclipse.CommandKeyBinding} kb the key binding to compare with.
		 * @returns {Boolean} whether or not the parameter and the receiver describe the same key binding.
		 */
		equals: function(kb) {
			if (!kb) { return false; }
			if (this.keyCode !== kb.keyCode) { return false; }
			if (this.mod1 !== kb.mod1) { return false; }
			if (this.mod2 !== kb.mod2) { return false; }
			if (this.mod3 !== kb.mod3) { return false; }
			if (this.mod4 !== kb.mod4) { return false; }
			return true;
		}
	};
	return CommandKeyBinding;
>>>>>>> 2bb365a2a0e7549e187c7fbefa846a2b43056ecb
}());

<<<<<<< HEAD
/**
 * Constructs a new key binding with the given key code and modifiers.
 * 
 * @param {String|Number} keyCode the key code.
 * @param {Boolean} mod1 the primary modifier (usually Command on Mac and Control on other platforms).
 * @param {Boolean} mod2 the secondary modifier (usually Shift).
 * @param {Boolean} mod3 the third modifier (usually Alt).
 * @param {Boolean} mod4 the fourth modifier (usually Control on the Mac).
 * 
 * @class A CommandKeyBinding represents of a key code and a modifier state that can be triggered by the user using the keyboard.
 * @name orion.commands.CommandKeyBinding
 * 
 * @property {String} userString The user representation for the string (to show in key assist dialog)
 * @property {String|Number} keyCode The key code.
 * @property {Boolean} mod1 The primary modifier (usually Command on Mac and Control on other platforms).
 * @property {Boolean} mod2 The secondary modifier (usually Shift).
 * @property {Boolean} mod3 The third modifier (usually Alt).
 * @property {Boolean} mod4 The fourth modifier (usually Control on the Mac).
 */
exports.CommandKeyBinding = (function() {
	var isMac = window.navigator.platform.indexOf("Mac") !== -1;
	/** @private */
	function CommandKeyBinding (userString, keyCode, mod1, mod2, mod3, mod4) {
		if (typeof(keyCode) === "string") {
			this.keyCode = keyCode.toUpperCase().charCodeAt(0);
		} else {
			this.keyCode = keyCode;
		}
		this.userString = userString;
		this.mod1 = mod1 !== undefined && mod1 !== null ? mod1 : false;
		this.mod2 = mod2 !== undefined && mod2 !== null ? mod2 : false;
		this.mod3 = mod3 !== undefined && mod3 !== null ? mod3 : false;
		this.mod4 = mod4 !== undefined && mod4 !== null ? mod4 : false;
	}
	CommandKeyBinding.prototype = /** @lends orion.commands.CommandKeyBinding.prototype */ {
		/**
		 * Returns whether this key binding matches the given key event.
		 * 
		 * @param e the key event.
		 * @returns {Boolean} <code>true</code> whether the key binding matches the key event.
		 */
		match: function (e) {
			if (this.keyCode === e.keyCode) {
				var mod1 = isMac ? e.metaKey : e.ctrlKey;
				if (this.mod1 !== mod1) { return false; }
				if (this.mod2 !== e.shiftKey) { return false; }
				if (this.mod3 !== e.altKey) { return false; }
				if (isMac && this.mod4 !== e.ctrlKey) { return false; }
				return true;
			}
			return false;
		},
		/**
		 * Returns whether this key binding is the same as the given parameter.
		 * 
		 * @param {orion.commands.CommandKeyBinding} kb the key binding to compare with.
		 * @returns {Boolean} whether or not the parameter and the receiver describe the same key binding.
		 */
		equals: function(kb) {
			if (!kb) { return false; }
			if (this.keyCode !== kb.keyCode) { return false; }
			if (this.mod1 !== kb.mod1) { return false; }
			if (this.mod2 !== kb.mod2) { return false; }
			if (this.mod3 !== kb.mod3) { return false; }
			if (this.mod4 !== kb.mod4) { return false; }
			return true;
		}
	};
	return CommandKeyBinding;
}());

return exports;
});
=======
return eclipse;
<<<<<<< HEAD
});
>>>>>>> 2bb365a2a0e7549e187c7fbefa846a2b43056ecb
=======
});
>>>>>>> 2bb365a2a0e7549e187c7fbefa846a2b43056ecb
