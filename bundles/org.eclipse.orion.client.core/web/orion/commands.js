/*******************************************************************************
 * @license
 * Copyright (c) 2010,2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

 /*global define window Image */
 
define(['require', 'dojo', 'dijit', 'orion/util', 'dijit/Menu', 'dijit/form/DropDownButton', 'dijit/MenuItem', 'dijit/PopupMenuItem', 'dijit/MenuSeparator', 'dijit/Tooltip' ], function(require, dojo, dijit, mUtil){


	/**
	 * Override the dijit MenuItem so that the inherited click behavior is not used.
	 * This is done when the command is defined with a link, so that the normal browser
	 * link behavior (and interpretations of various mouse clicks) is used.
	 * 
	 * See https://bugs.eclipse.org/bugs/show_bug.cgi?id=350584
	 */
	var CommandMenuItem = dojo.declare(dijit.MenuItem, {
		_onClick: function(evt) {
			if (!this.hrefCallback) {
				this.inherited(arguments);
			}
		}
	});

	/**
	 * Constructs a new command service with the given options.
	 * @param {Object} options The command options object which includes the service registry and optional selection service.
	 * @class CommandService can render commands appropriate for a particular scope and DOM element.
	 * @name orion.commands.CommandService
	 */
	function CommandService(options) {
		this._domScope = {};
		this._objectScope = {};
		this._globalScope = {};
		this._namedGroups = {};
		this._activeBindings = {};
		this._activeModalCommandNode = null;
		this._init(options);
	}
	CommandService.prototype = /** @lends orion.commands.CommandService.prototype */ {
		_init: function(options) {
			this._registry = options.serviceRegistry;
			this._serviceRegistration = this._registry.registerService("orion.page.command", this);
			this._selection = options.selection;
			dojo.connect(window.document, "onkeydown", dojo.hitch(this, function (evt){
				evt = evt || window.event;
				// bindings are ignored if we are in a text field.
				var tagType = evt.target.nodeName.toLowerCase();
				if (tagType === 'input') {
					var inputType = evt.target.type.toLowerCase();
					// Any HTML5 input type that involves typing text should be ignored
					switch (inputType) {
						case "text":
						case "password":
						case "search":
						case "color":
						case "date":
						case "datetime":
						case "datetime-local":
						case "email":
						case "month":
						case "number":
						case "range":
						case "tel":
						case "time":
						case "url":
						case "week":
							return;
					}
				} else if (tagType === 'textarea') {
					return;
				}
				this._processKey(evt);
			}));
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
		
		/**
		 * Provide an object that can collect parameters for a given command.  
		 */
		setParameterCollector: function(parameterCollector) {
			this._parameterCollector = parameterCollector;
		},
		
		openParameterCollector: function(commandNode, id, fillFunction) {
			if (this._parameterCollector) {
				if (this._activeModalCommandNode) {
					this._parameterCollector.close(this._activeModalCommandNode);
				}
				this._activeModalCommandNode = commandNode;
				this._parameterCollector.open(commandNode, id, fillFunction);
			}
		},
		
		closeParameterCollector: function(commandNode) {
			this._activeModalCommandNode = null;
			if (this._parameterCollector) {
				this._parameterCollector.close(commandNode);
			}
		},
		
		_collectParameters: function(command, handler, parentNode, commandNode, callbackParameters) {
			if (this._parameterCollector) {
				this._parameterCollector.close(this._activeModalCommandNode);
				this._activeModalCommandNode = commandNode;
				this._parameterCollector.collectParameters(command, handler, parentNode, commandNode, callbackParameters);
			}
		},
		
		/**
		 * Show the keybindings that are registered with the command service inside the specified domNode.
		 * @param {DOMElement} the dom node where the key bindings should be shown.
		 */
		showKeyBindings: function(targetNode) {
			for (var binding in this._activeBindings) {
				if (this._activeBindings[binding] && this._activeBindings[binding].keyBinding && this._activeBindings[binding].command) {
					dojo.place("<span>"+mUtil.getUserKeyString(this._activeBindings[binding].keyBinding)+" = "+this._activeBindings[binding].command.name+"<br></span>", targetNode, "last");
				}
			}
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
		 * @param {String} groupId The id of the group, must be unique.  Also used for dom node id
		 * @param {Number} position The relative position of the group within its parent, optional.
		 * @param {String} title The title of the group, optional
		 * @param {String} parentPath The path of parent groups, separated by '/'.  For example,
		 *  a path of "group1Id/group2Id" indicates that the group belongs as a child of 
		 *  group2Id, which is itself a child of group1Id.  Optional.
		 * @param {String} scopeId The id of a DOM element related to the command's scope.  Optional.
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
		 * @param {String} commandId the id of the command
		 * @param {Number} position the relative position of the command within its parent
		 * @param {String} scopeId The id related to the scope.  Depending on the scope,
		 *  this might be the id of the page or of a dom element.
		 * @param {String} parentPath the path of any parent groups, separated by '/'.  For example,
		 *  a path of "group1Id/group2Id/command" indicates that the command belongs as a child of 
		 *  group2Id, which is itself a child of group1Id.  Optional.
		 * @param {orion.commands.CommandKeyBinding} keyBinding a keyBinding for the command.  Optional.
		 * @param {boolean} keyOnly if true, then the command is never rendered, but the keybinding is hooked.
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
		 *  such as list or trees.  "global" commands always apply.
		 * @param {Object} items An item or array of items to which the command applies.  Optional.  If not
		 *  items are specified and a selection service was specified at creation time, then the selection
		 *  service will be used to determine which items are involved. 
		 * @param {Object} handler The object that should perform the command
		 * @param {String} renderType The style in which the command should be rendered.  "image" will render
		 *  a button-like image element in the dom.  "menu" will render a push button menu containing
		 *  the commands.
		 * @param {String} cssClass Optional name of a CSS class that should be added to any rendered commands.
		 * @param {Object} userData Optional user data that should be attached to generated command callbacks
		 * @param {Boolean} forceText When true, always use text and not the icon when showing the command, regardless of the
		 *  specified renderType.  
		 */	
		renderCommands: function(parent, scope, items, handler, renderType, cssClass, userData, forceText, cssClassCmdOver, cssClassCmdLink) {
			if (typeof(parent) === "string") {
				parent = dojo.byId(parent);
			}
			if (!items) {
				var cmdService = this;
				if (this._selection) {
					this._selection.getSelections(function(selections) {
						cmdService.renderCommands(parent, scope, selections, handler, renderType, cssClass, userData, forceText, cssClassCmdOver, cssClassCmdLink);
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
			this._render(this._namedGroups, parent, scope, items, handler, renderType, cssClass, userData, refCommands, forceText, cssClassCmdOver, cssClassCmdLink);
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
		
		_render: function(commandItems, parent, scope, items, handler, renderType, cssClass, userData, commandList, forceText, cssClassCmdOver, cssClassCmdLink) {
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
							this._render(positionOrder[i].children, newMenu, scope, items, handler, "menu", cssClass, userData, commandList, forceText, cssClassCmdOver, cssClassCmdLink); 
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
								// we don't need a menu to contain the command if there is only one item.
								var needMenu = children.length > 1;
								var menuCommand = children[0].eclipseCommand;
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
									menuCommand._addImage(parent, id, items, handler, userData, cssClass, forceText, cssClassCmdOver, cssClassCmdLink, this);
								}
							}
						} else {
							var sep;
							// Only draw a separator if there is a non-separator preceding it.
							if (parent.childNodes.length > 0 && !this._isLastChildSeparator(parent, renderType)) {
								sep = this.generateSeparatorImage(parent);
							}
							this._render(positionOrder[i].children, parent, scope, items, handler, renderType, cssClass, userData, commandList, forceText, cssClassCmdOver, cssClassCmdLink); 

							// make sure that more than just the separator got rendered before rendering a trailing separator
							if (parent.childNodes.length > 0) {
								var lastRendered = parent.childNodes[parent.childNodes.length - 1];
								if (lastRendered !== sep) {
									sep = this.generateSeparatorImage(parent);
								}
							}
						}
					} else {
						// group within a menu
						if (group.title) {
							var subMenu = new dijit.Menu();
							this._render(positionOrder[i].children, subMenu, scope, items, handler, renderType, cssClass, userData, commandList, forceText, cssClassCmdOver, cssClassCmdLink); 
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
							this._render(positionOrder[i].children, parent, scope, items, handler, renderType, cssClass, userData, commandList, forceText, cssClassCmdOver, cssClassCmdLink); 
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
								command._addImage(parent, id, items, handler, userData, cssClass, forceText, cssClassCmdOver, cssClassCmdLink, this);
							} else if (renderType === "menu") {
								command._addMenuItem(parent, items, handler, userData, cssClass);
							}
						}
					}
				}
			}
		},
		
		/**
		 * Add a dom node appropriate for using a separator between different groups
		 * of commands.  This function is useful when a page is precisely arranging groups of commands
		 * (in a table or contiguous spans) and needs to use the same separator that the command service
		 * would use when rendering different groups of commands.
		 */
		generateSeparatorImage: function(parent) {
			var sep = dojo.create("span", null, parent, "last");
			dojo.addClass(sep, "core-sprite-sep");  // location in sprite
			dojo.addClass(sep, "commandImage");   // expected spacing
			dojo.addClass(sep, "commandSprite");  // sets sprite background
			dojo.addClass(sep, "commandSeparator");
			return sep;
		}

	};  // end command service prototype
	CommandService.prototype.constructor = CommandService;

	/**
	 * Constructs a new command with the given options.
	 * @param {Object} options The command options object.
	 * @param {String} options.id the unique id to be used when referring to the command in the command service.
	 * @param {String} options.name the name to be used when showing the command as text.
	 * @param {String} options.tooltip the tooltip description to use when explaining the purpose of the command.
	 * @param {Function} options.callback the callback to call when the command is activated.  The callback should either 
	 *  perform the command or return a deferred that represents the asynchronous performance of the command.  Optional.
	 * @param {Function} options.hrefcallback when options.callback is not specfied, this callback is used to retrieve
	 *  a URL that can be used as the location for a command represented as a hyperlink.  The callback should return 
	 *  the URL.  In this release, the callback may also return a deferred that will eventually return the URL, but this 
	 *  functionality may not be supported in the future.  See https://bugs.eclipse.org/bugs/show_bug.cgi?id=341540.
	 *  Optional.
	 * @param {Function} options.choicecallback a callback which retrieves choices that should be shown in a secondary
	 *  menu from the command itself.  Returns a list of choices that supply the name and image to show, and the callback
	 *  to call when the choice is made.  Optional.
	 * @param {Image} options.image the image that may be used to represent the callback.  A text link will be shown in lieu
	 *  of an image if no image is supplied.  Optional.
	 * @param {Function} options.visibleWhen A callback that returns a boolean to indicate whether the command should be visible
	 *  given a particular set of items that are selected.
	 *
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
			this.image = options.image || require.toUrl("images/none.png");
			this.imageClass = options.imageClass;   // points to the location in a sprite
			this.spriteClass = options.spriteClass || "commandSprite"; // defines the background image containing sprites
			this.visibleWhen = options.visibleWhen;
			this.parameters = options.parameters;
			// when false, affordances for commands are always shown.  When true,
			// they are shown on hover only.
			//how will we know this?
			this._deviceSupportsHover = false;  
		},
		_addImage: function(parent, name, items, handler, userData, cssClass, forceText, cssClassCmdOver, cssClassCmdLink, commandService) {
			handler = handler || this;
			var link = dojo.create("a");
			link.id = this.name+"link";
			var image = null;
			if (this.tooltip) {
				link.title = this.tooltip;
			}
			if (forceText || !this.hasImage()) {
				var text = window.document.createTextNode(this.name);
				dojo.place(text, link, "last");
			} else {
				image = new Image();
				image.alt = this.name;
				image.title = this.tooltip || this.name;
				image.name = name;
				image.id = name;
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
			} else {
				if (image) {
					dojo.connect(image, "onclick", this, function() {
						// collect parameters in advance if specified
						if (this.parameters && commandService._parameterCollector) {
							// should the handler be bound to this, or something else?
							commandService._collectParameters(this, parent, handler, image.id, [items, this.id, image.id, userData, this.parameters]);
						} else if (this.callback) {
							this.callback.call(handler, items, this.id, image.id, userData, this.parameters);
						}
					});
				} else {
					dojo.connect(link, "onclick", this, function() {
						// collect parameters in advance if specified
						if (this.parameters && commandService._parameterCollector) {
							commandService._collectParameters(this, handler, parent, link.id, [items, this.id, link.id, userData, this.parameters]);
						} else if (this.callback) {
							this.callback.call(handler, items, this.id, link.id, userData, this.parameters);
						}
					});
				}
			}
			if (image) {
				if (this._deviceSupportsHover) {
					image.src = require.toUrl("images/none.png");
					dojo.connect(image, "onmouseover", this, function() {
						image.src = this.image;
					});
					dojo.connect(image, "onmouseout", this, function() {
						image.src = require.toUrl("images/none.png");
					});	
				} else {
					image.src = this.image;	
					dojo.connect(image, "onmouseover", this, function() {
						if(cssClassCmdOver) {
							dojo.addClass(image, cssClassCmdOver);
						} else {
							dojo.addClass(image, "commandOver");
						}
					});
					dojo.connect(image, "onmouseout", this, function() {
						image.src = this.image;
						if(cssClassCmdOver) {
							dojo.removeClass(image, cssClassCmdOver);
						} else {
							dojo.removeClass(image, "commandOver");
						}
					});
				}
				dojo.addClass(image, 'commandImage');
				if (cssClass) {
					dojo.addClass(image, cssClass);
				}	
				if (this.imageClass) {
					dojo.addClass(image, this.spriteClass);
					dojo.addClass(image, this.imageClass);
				} 
				dojo.place(image, link, "last");
			} 
			
			if(cssClassCmdLink) {
				dojo.addClass(link, cssClassCmdLink);
			} else {
				dojo.addClass(link, 'commandLink');
			}
			if (cssClass) {
				dojo.addClass(link, cssClass);
			}
			dojo.place(link, parent, "last");
		},
		
		_asLink: function(items, handler, cssClass) {
			handler =  handler || this;
			var anchor = window.document.createElement('a');
			if (this.tooltip) {
				anchor.title = this.tooltip;
			}
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
			var menuitem = new CommandMenuItem({
				labelType: this.hrefCallback ? "html" : "text",
				label: this.name,
				iconClass: this.imageClass,
				hrefCallback: !!this.hrefCallback
			});
			if (this.tooltip) {
				new dijit.Tooltip({
					connectId: [menuitem.domNode],
					label: this.tooltip
				});
			}
			if (this.hrefCallback) {
				var loc = this.hrefCallback.call(handler, items, this.id, parent.id, userData);
				if (loc) {
					if (loc.then) {
						loc.then(dojo.hitch(this, function(l) { 
							menuitem.set("label", "<a href='"+l+"'>"+this.name+"</a>");
						}));
					} else {
						menuitem.set("label", "<a href='"+loc+"'>"+this.name+"</a>");
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
			if (this.imageClass) {
				dojo.addClass(menuitem.iconNode, this.spriteClass);
			} else if (this.image) {
				dojo.addClass(menuitem.iconNode, 'commandImage');
				if (cssClass) {
					dojo.addClass(menuitem.iconNode, cssClass);
				}
				// reaching...
				menuitem.iconNode.src = this.image;
			}
		},
		/**
		 * Populate the specified menu with choices using the choiceCallback.
		 * Used internally by the command service.  Not intended to be overridden or called
		 * externally.
		 */
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
						iconClass: choice.imageClass,
						onClick: this.makeChoiceCallback(choice, items)
					});
					if (choice.imageClass) {
						dojo.addClass(menuitem.iconNode, choice.spriteClass || 'commandSprite');
					} else if (choice.image) {
						dojo.addClass(menuitem.iconNode, 'commandImage');
						menuitem.iconNode.src = choice.image;
					}			
				} else {  // anything not named is a separator
					menuitem = new dijit.MenuSeparator();
				}
				menu.addChild(menuitem);
			}
		},
		
		/**
		 * Get the appropriate choices using the choiceCallback.
		 * Used internally by the command service.  Not intended to be overridden or called
		 * externally.
		 */
		getChoices: function(items, handler, userData) {
			if (this.choiceCallback) {
				return this.choiceCallback.call(handler, items, userData);
			}
			return null;
		},
		
		/**
		 * Make a choice callback appropriate for the given choice and items.
		 * Used internally by the command service.  Not intended to be overridden or called
		 * externally.
		 */
		makeChoiceCallback: function(choice, items) {
			return function(event) {
				if (choice.callback) {
					choice.callback.call(choice, items, event);
				}
			};
		},
		
		/**
		 * Return a boolean indicating whether this command has a specific image associated
		 * with it. Used internally by the command service.  Not intended to be overridden or called
		 * externally.
		 */
		hasImage: function() {
			return this.imageClass || this.image !== require.toUrl("images/none.png");
		}
	};  // end Command prototype
	Command.prototype.constructor = Command;

	var isMac = window.navigator.platform.indexOf("Mac") !== -1;
	/**
	 * Temporary copy of editor key binding.  Will be removed in the next released.
	 * @param {String|Number} keyCode the key code.
	 * @param {Boolean} mod1 the primary modifier (usually Command on Mac and Control on other platforms).
	 * @param {Boolean} mod2 the secondary modifier (usually Shift).
	 * @param {Boolean} mod3 the third modifier (usually Alt).
	 * @param {Boolean} mod4 the fourth modifier (usually Control on the Mac).
	 * 
	 * @name orion.commands.CommandKeyBinding
	 * 
	 */
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
	CommandKeyBinding.prototype.constructor = CommandKeyBinding;

	//return the module exports
	return {
		CommandService: CommandService,
		CommandKeyBinding: CommandKeyBinding,
		Command: Command,
		CommandMenuItem: CommandMenuItem
	};
});
