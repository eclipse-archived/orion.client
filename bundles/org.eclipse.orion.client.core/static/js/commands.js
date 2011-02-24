/*******************************************************************************
 * Copyright (c) 2010,2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

 /*global dojo, dijit, document, window, eclipse:true, alert, Image */
 
dojo.require("dijit.Menu");
dojo.require("dijit.form.DropDownButton");

/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * The command service manages the available commands.
 * @class The command service manages the available commands.
 */
eclipse.CommandService = (function() {
	/**
	 * Constructs a new command service with the given options.
	 * @param {Object} options The command options object which includes the service registry.
	 * @class CommandService can render commands appropriate for a particular scope and DOM element.
	 * @name eclipse.CommandService
	 */
	function CommandService(options) {
		this._domScope = {};
		this._objectScope = {};
		this._globalScope = {};
		this._namedGroups = {};
		this._init(options);
	}
	CommandService.prototype = /** @lends eclipse.CommandService.prototype */ {
		_init: function(options) {
			this._registry = options.serviceRegistry;
			this._serviceRegistration = this._registry.registerService("ICommandService", this);
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
		 * @param {String} the path of parent groups, separated by '/'.  For example,
		 *  a path of "group1Id/group2Id" indicates that the group belongs as a child of 
		 *  group2Id, which is itself a child of group1Id.  Optional.
		 * @param {Number} the relative position of the group within its parent
		 * @param {String} the title of the group, optional
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
		 * @param {Array} an array of values to pass to eclipse.KeyBinding constructor.  Optional.

		 */
		registerCommandContribution: function(commandId, position, scopeId, parentPath, keys) {
			// first ensure the parentPath is represented
			var parentTable = this._createEntryForPath(parentPath);
			parentTable[commandId] = {scopeId: scopeId, position: position, keys: keys};
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
		 */	
		
		renderCommands: function(parent, scope, items, handler, style, userData) {
			if (!items) {
				var cmdService = this;
				this._registry.getService("ISelectionService").then(function(service) {
					service.getSelection(function(selection) {
						if (!selection) {
							return;
						}
						this.renderCommands(parent, scope, selection, handler, style, userData);
					});
				});
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
			this._render(this._namedGroups, parent, scope, items, handler, style, userData, refCommands);
			// If the last thing we rendered was a group, it's possible there is an unnecessary trailing separator.
			if (style === "image") {
				if (this._isLastChildSeparator(parent, style)) {
					parent.removeChild(parent.childNodes[parent.childNodes.length-1]);
				}
			} else if (style === "menu") {
				if (this._isLastChildSeparator(parent, style)) {
					var child = parent.getChildren()[parent.getChildren().length-1];
					parent.removeChild(child);
					child.destroy();
				}
			}
		},
		
		_render: function(commandItems, parent, scope, items, handler, style, userData, commandList) {
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
				var image, id;
				if (positionOrder[i].children) {
					var group = positionOrder[i];
					if (group.scopeId && parent.id !== group.scopeId) {
						break;
					}
					var children;
					if (style === "image") {
						if (group.title) {
							// we need a named menu button, but first let's see if we actually have content
							var newMenu= new dijit.Menu({
								style: "display: none;"
							});
							// if commands are scoped to the dom, we'll need to identify a menu with the dom id of its original parent
							newMenu.eclipseScopeId = parent.eclipseScopeId || parent.id;
							// render the children
							this._render(positionOrder[i].children, newMenu, scope, items, handler, "menu", userData, commandList); 
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
									var menuButton = new dijit.form.DropDownButton({
										label: group.title,
										dropDown: newMenu
								        });
								        dojo.addClass(menuButton.domNode, "commandImage");
									dojo.place(menuButton.domNode, parent, "last");
								} else {
									id = "image" + menuCommand.id + i;  // using the index ensures unique ids within the DOM when a command repeats for each item
									image = menuCommand._asImage(id, items, handler, userData);
									dojo.place(image, parent, "last");
								}
							}
						} else {
							var sep;
							// Only draw a separator if there is a non-separator preceding it.
							if (parent.childNodes.length > 0 && !this._isLastChildSeparator(parent, style)) {
								sep = this.generateSeparatorImage();
								dojo.place(sep, parent, "last");
							}
							this._render(positionOrder[i].children, parent, scope, items, handler, style, userData, commandList); 

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
							this._render(positionOrder[i].children, subMenu, scope, items, handler, style, userData, commandList); 
							if (subMenu.getChildren().length > 0) {
								parent.addChild(new dijit.PopupMenuItem({
									label: group.title,
									popup: subMenu
								}));
							}
						} else {
							// don't render a separator if there is nothing preceding, or if the last thing was a separator
							var menuSep;
							if (parent.getChildren().length > 0 && !this._isLastChildSeparator(parent, style)) {
								menuSep = new dijit.MenuSeparator();
								parent.addChild(menuSep);
							}
							this._render(positionOrder[i].children, parent, scope, items, handler, style, userData, commandList); 
							// Add a trailing separator if children rendered.
							var menuChildren = parent.getChildren();
							if (menuChildren[menuChildren.length - 1] !== menuSep) {
								menuSep = new dijit.MenuSeparator();
								parent.addChild(menuSep);
							}
						}
					}
				} else {
					var command = commandList[positionOrder[i].id];
					var render = command ? true : false;
					if (command) {
						if (scope === "dom") {
							if (style === "image") {
								render = parent.id === positionOrder[i].scopeId;
							} else if (style === "menu") {
								render = parent.eclipseScopeId === positionOrder[i].scopeId;
							} else {
								render = false;
							}
						} 
						if (render && command.visibleWhen) {
							render = command.visibleWhen(items);
						}
					}
					if (render) {
						if (style === "image") {
							id = "image" + command.id + i;  // using the index ensures unique ids within the DOM when a command repeats for each item
							image = command._asImage(id, items, handler, userData);
							dojo.place(image, parent, "last");
						} else if (style === "menu") {
							command._addMenuItem(parent, items, handler, userData);
						}
					}
				}
			}
		},
		generateSeparatorImage: function() {
			sep = new Image();
			// TODO should get this from CSS
			sep.src = "images/sep.gif";
			dojo.addClass(sep, "commandImage");
			dojo.addClass(sep, "commandSeparator");
			return sep;
		}

	};  // end prototype
	return CommandService;
}());


eclipse.Command = (function() {
	/**
	 * Constructs a new command with the given options.
	 * @param {Object} options The command options object
	 * @class A command is an object that describes an action a user can perform, as well as when and
	 *  what it should look like when presented in various contexts.  Commands are identified by a
	 *  unique id.
	 * @name eclipse.Command
	 */
	function Command (options) {
		this._init(options);
	}
	Command.prototype = /** @lends eclipse.Command.prototype */ {
		hasImage: function() {
			return this.image !== "/images/none.png";
		},
		_init: function(options) {
			this.id = options.id;  // unique id
			this.name = options.name || "Empty Command";
			this.tooltip = options.tooltip || options.name;
			this.callback = options.callback; // optional callback that should be called when command is activated (clicked)
			this.hrefCallback = options.hrefCallback; // optional callback that returns an href for a command link
			this.image = options.image || "/images/none.png";
			this.visibleWhen = options.visibleWhen;
			// when false, affordances for commands are always shown.  When true,
			// they are shown on hover only.
			//how will we know this?
			this._deviceSupportsHover = false;  
		},
		_asImage: function(name, items, handler, userData) {
			handler = handler || this;
			var image = new Image();
			var link;
			image.alt = this.name;
			image.title = this.name;
			image.name = name;
			image.id = name;
			if (this.hrefCallback) {
				link = dojo.create("a");
				link.href = this.hrefCallback.call(handler, items, this.id, userData);
			} else if (this.callback) {
				dojo.connect(image, "onclick", this, function() {
					this.callback.call(handler, items, this.id, image.id, userData);
				});
			}
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
				dojo.style(image, "opacity", "0.4");
				dojo.connect(image, "onmouseover", this, function() {
					dojo.style(image, "opacity", "1");
				});
				dojo.connect(image, "onmouseout", this, function() {
					image.src = this.image;
					dojo.style(image, "opacity", "0.4");
				});
			}
			dojo.addClass(image, 'commandImage');
			if (link) {
				dojo.place(image, link, "last");
				return link;
			}
			return image;
		},
		_asLink: function(items, handler) {
			handler =  handler || this;
			var anchor = document.createElement('a');
			dojo.place(document.createTextNode(this.name), anchor, "only");
			anchor.href="";
			if (this.callback) {
				dojo.connect(anchor, "onclick", this, function() {
					this.callback.call(handler, items);
				});
			} else if (this.hrefCallback) {
				anchor.href = this.hrefCallback.call(handler, items, this.id);
			}
			dojo.addClass(anchor, 'commandLink');
			return anchor;
		},
		_addMenuItem: function(parent, items, handler, userData) {
			var menuitem = new dijit.MenuItem({
				label: this.name,
				tooltip: this.tooltip,
				onClick: dojo.hitch(this, function() {
					if (this.callback) {
						this.callback.call(handler, items, this.id, parent.id, userData);
					} else if (this.hrefCallback) {
						var href = this.hrefCallback.call(handler, items, this.id, parent.id, userData);
						if (href) {
							window.location = href;
						}
					}
				})
			});
			// we may need to refer back to the command.  
			menuitem.eclipseCommand = this;
			parent.addChild(menuitem);
			if (this.image) {
				dojo.addClass(menuitem.iconNode, 'commandImage');
				// reaching...
				menuitem.iconNode.src = this.image;
			}

		}
		
	};  // end prototype
	return Command;
}());

