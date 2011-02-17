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
		this._domScope = {sorted: false, commands:[]};
		this._objectScope = {sorted: false, commands:[]};
		this._namedGroups = {};
		this._init(options);
	}
	CommandService.prototype = /** @lends eclipse.CommandService.prototype */ {
		_init: function(options) {
			this._registry = options.serviceRegistry;
			this._serviceRegistration = this._registry.registerService("ICommandService", this);
		},
		
		/**
		 * Registers a new command and specifies the scope of the command.  Note this
		 * is not yet fully implemented. 
		 * @param {Command} command The command being added
		 * @param {String} scope The scope to which the command applies.  "global"
		 *  commands apply everywhere, "page" level commands apply to a particular
		 *  page, "dom" level commands apply only when the specified dom element is
		 *  rendering commands, and "object" scope applies to particular objects 
		 *  being displayed in widgets such as lists or trees.
		 * @param {String} scopeId The id related to the scope.  Depending on the scope,
		 *  this might be the id of the page or of a dom element.
		 */	
		 
		addCommand: function(command, scope, scopeId) {
			switch (scope) {
			case "dom":
				this._domScope.commands.push({scopeId: scopeId, command: command});
				this._domScope.sorted = false;
				break;
				
			case "object":
				this._objectScope.commands.push({scopeId: scopeId, command: command});
				this._objectScope.sorted = false;
				break;
			}
		},
		
		/**
		 * Registers a command group and specifies visual information about the group.
		 * @param {String} the id of the group, must be unique
		 * @param {Number} the relative position of the group
		 * @param {String} the title of the group, optional
		 */	
		 
		addCommandGroup: function(groupId, position, title) {
			this._namedGroups[groupId] = {title: title, position: position};
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
			var i, command, isNewGroup, currentGroup, currentParent, renderedParent, groupId;
			switch (scope) {
			case "dom":
				if (this._domScope.commands.length < 1) {
					return;
				}
				this._sortCommands(this._domScope);
				currentParent = parent;
				// determine if a grouping will need to be created
				groupId = this._domScope.commands[0].command.groupId;
				if (!(groupId && this._namedGroups[groupId] && this._namedGroups[groupId].title)) {
					// ensures we don't render a separator first
					currentGroup = groupId;
				}
				for (i = 0; i < this._domScope.commands.length; i++) { 
					command = this._domScope.commands[i].command;
					isNewGroup = currentGroup !== command.groupId;
					if (isNewGroup) { // a new group is starting
						currentParent = parent;
					}
					if (parent.id === this._domScope.commands[i].scopeId) {
						renderedParent = this._render(currentParent, command, items, handler, style, isNewGroup, userData, i);
						if (renderedParent) {
							currentParent = renderedParent;
							currentGroup = command.groupId;
						}		
					}
				}				
				break;
				
			case "object":
				if (this._objectScope.commands.length < 1) {
					return;
				}
				this._sortCommands(this._objectScope);
				currentParent = parent;
				// determine if a grouping will need to be created
				groupId = this._domScope.commands[0].command.groupId;
				if (!(groupId && this._namedGroups[groupId] && this._namedGroups[groupId].title)) {
					// ensures we don't render a separator first
					currentGroup = groupId;
				}
				for (i = 0; i < this._objectScope.commands.length; i++) { 
					command = this._objectScope.commands[i].command;
					isNewGroup = currentGroup !== command.groupId;
					if (isNewGroup) { // a new group is starting, reset parent to original
						currentParent = parent;
					}
					if (!items) {
						var cmdService = this;
						this._registry.getService("ISelectionService").then(function(service) {
							service.getSelection(function(selection) {
								renderedParent = this._render(currentParent, command, selection, handler, style, isNewGroup, userData, i);
								if (renderedParent) {
									currentParent = renderedParent;
									currentGroup = command.groupId;
								}		
							});
						});
					} else {
						renderedParent = this._render(currentParent, command, items, handler, style, isNewGroup, userData, i);
						if (renderedParent) {
							currentParent = renderedParent;
							currentGroup = command.groupId;
						}		
					}
				}				
				break;
			}
		},
		
		_sortCommands: function(scope) {
			scope.commands.sort(dojo.hitch(this, function(a,b) {
				var aPos, bPos, group;
				if (a.command.groupId) {
					group = this._namedGroups[a.command.groupId];
					aPos = group ? group.position + a.command.position : a.command.position;
				} else {
					aPos = a.command.position;
				}
				if (b.command.groupId) {
					group = this._namedGroups[b.command.groupId];
					bPos = group ? group.position + b.command.position : b.command.position;
				} else {
					bPos = b.command.position;
				}
				return aPos - bPos;
			}));
			scope.sorted = true;
		},
				
		_render: function(parent, command, items, handler, style, newGroup, userData, i) {
			var render = true;
			if (command.visibleWhen) {
				render = command.visibleWhen(items);
			}
			if (!render) {
				return false;
			}
			if (style === "image") {
				if (newGroup) {
					// create an image separator.  need to use an image class or something easy to override
				}
				var id = "image" + command.id + i;  // using the index ensures unique ids within the DOM when a command repeats for each item
				var image = command._asImage(id, items, handler, userData);
				dojo.place(image, parent, "last");	
			} else if (style === "menu") {
				if (newGroup) {
					var groupInfo = this._namedGroups[command.groupId];
					var subMenuText = groupInfo ? groupInfo.title : null;
					if (subMenuText) {
						var subMenu = new dijit.Menu();
						parent.addChild(new dijit.PopupMenuItem({
							label: subMenuText,
							popup: subMenu
						}));
						parent = subMenu;
					} else {
						// render a separator if appropriate.
						var children = parent.getChildren();
						if (children.length > 0 && !(children[children.length-1] instanceof dijit.MenuSeparator)) {
							parent.addChild(new dijit.MenuSeparator());
						}
					}
				}
				var menuItem = command._asMenuItem(parent, items, handler, userData);
			}
			return parent;
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
		_init: function(options) {
			this.id = options.id;  // unique id
			this.name = options.name || "Empty Command";
			this.tooltip = options.tooltip || options.name;
			this.key = options.key; // an array of values to pass to eclipse.KeyBinding constructor
			this._callback = options.callback; // optional callback that should be called when command is activated (clicked)
			this._hrefCallback = options.hrefCallback; // optional callback that returns an href for a command link
			this.image = options.image || "/images/none.png";
			this.visibleWhen = options.visibleWhen;
			this.position = options.position || 0;  // numeric position used to sort commands in a presentation
			this.groupId = options.groupId; // optional group id which signifies the need for a separator
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
			if (this._hrefCallback) {
				link = dojo.create("a");
				link.href = this._hrefCallback.call(handler, items, this.id, userData);
			} else if (this._callback) {
				dojo.connect(image, "onclick", this, function() {
					this._callback.call(handler, items, this.id, image.id, userData);
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
			if (this._callback) {
				dojo.connect(anchor, "onclick", this, function() {
					this._callback.call(handler, items);
				});
			} else if (this._hrefCallback) {
				anchor.href = this._hrefCallback.call(handler, items, this.id);
			}
			dojo.addClass(anchor, 'commandLink');
			return anchor;
		},
		_asMenuItem: function(parent, items, handler, userData) {
			var menuitem = new dijit.MenuItem({
				label: this.name,
				tooltip: this.tooltip,
				onClick: dojo.hitch(this, function() {
					if (this._callback) {
						this._callback.call(handler, items, this.id, parent.id, userData);
					} else if (this._hrefCallback) {
						var href = this._hrefCallback.call(handler, items, this.id, parent.id, userData);
						if (href) {
							window.location = href;
						}
					}
				})
			});
			parent.addChild(menuitem);
		}
		
	};  // end prototype
	return Command;
}());

