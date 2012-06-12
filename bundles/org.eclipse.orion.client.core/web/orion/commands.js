/*******************************************************************************
 * @license
 * Copyright (c) 2010,2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

 /*global define window Image */
 
define(['i18n!orion/nls/messages', 'require', 'dojo', 'dijit', 'orion/util', 'orion/PageUtil', 'orion/navigationUtils', 'dijit/Menu', 'dijit/form/DropDownButton', 'dijit/MenuItem', 'dijit/PopupMenuItem', 'dijit/MenuSeparator', 'dijit/Tooltip', 'dijit/TooltipDialog' ], function(messages, require, dojo, dijit, mUtil, PageUtil, mNavUtils){

	/*
	 * stateless helper function
	 */
	function _setupActivateVisuals(domNode, focusNode, overClass) {
		var makeActive = function() {
			if (overClass) {
				dojo.addClass(this, overClass);
			}
		};
		var makeInactive = function() {
			if (overClass) {
				dojo.removeClass(this, overClass);
			}
		};
		dojo.connect(domNode, "onmouseover", domNode, makeActive); //$NON-NLS-0$
		dojo.connect(focusNode, "onfocus", domNode, makeActive); //$NON-NLS-0$
		dojo.connect(domNode, "onmouseout", domNode, makeInactive); //$NON-NLS-0$
		dojo.connect(focusNode, "onblur", domNode, makeInactive); //$NON-NLS-0$
	}

	/**
	 * CommandInvocation is a data structure that carries all relevant information about a command invocation.
	 * It represents a unique invocation of a command by the user.  Each time a user invokes a command (by click, keystroke, URL),
	 * a new invocation is passed to the client.
	 * Note:  When retrieving parameters from a command invocation, clients should always use <code>commandInvocation.parameters</code>
	 * rather than obtaining the parameter object originally specified for the command (<code>commandInvocation.command.parameters</code>).
	 * This ensures that the parameter values for a unique invocation are used vs. any default parameters that may have been
	 * specified originally.  Similarly, if a client wishes to store data that will preserved across multiple invocations of a command,
	 * that data can be stored in the original parameters description and a reference maintained by the client.
	 * 
	 * @name orion.commands.CommandInvocation
	 * 
	 */
	function CommandInvocation (commandService, handler, items, userData, command) {
		this.commandService = commandService;
		this.handler = handler;
		this.items = items;
		this.userData = userData;
		this.command = command;
		if (command.parameters) {
			this.parameters = command.parameters.makeCopy(); // so that we aren't retaining old values from previous invocations
		}
		this.id = command.id;
	}
	CommandInvocation.prototype = /** @lends orion.commands.CommandInvocation.prototype */ {
		/**
		 * Returns whether this command invocation can collect parameters.
		 * 
		 * @returns {Boolean} whether parameters can be collected
		 */
		collectsParameters: function() {
			return this.commandService && this.commandService.collectsParameters();
		},
	
		/**
		 * Makes and returns a (shallow) copy of this command invocation.
		 */
		makeCopy: function() {
			var copy =  new CommandInvocation(this.commandService, this.handler, this.items, this.userData, this.command);
			copy.domNode = this.domNode;
			copy.domParent = this.domParent;
			// we want a copy of our parameters, not the original command parameters.
			if (this.parameters) {
				copy.parameters = this.parameters.makeCopy();
			}
			return copy;
		}

	};
	CommandInvocation.prototype.constructor = CommandInvocation;

	/**
	 * Override the dijit MenuItem so that the inherited click behavior is not used.
	 * This is done when the command is defined with a link, so that the normal browser
	 * link behavior (and interpretations of various mouse clicks) is used.  We also style
	 * link specially (padding, etc.) to help reduce the difference in perceived
	 * responsive area (the menu item) with the actual area (the link)
	 * 
	 * See https://bugs.eclipse.org/bugs/show_bug.cgi?id=350584
	 * See https://bugs.eclipse.org/bugs/show_bug.cgi?id=371265
	 */
	var CommandMenuItem = dojo.declare(dijit.MenuItem, {
		constructor: function() {
			var options = arguments[0] || {};
			options.onKeyDown = dojo.hitch(this, function(evt) {
				if (evt.keyCode === dojo.keys.ENTER || evt.keyCode === dojo.keys.SPACE) {
					if(this._anchorLocation) { 
						if(evt.ctrlKey) {
							window.open(this._anchorLocation);
						} else {
							window.location=this._anchorLocation;
						}
					}
				}
			});
			this.inherited(arguments || [options]);
		},
	
		// if it has a link and the anchor is already in the dom, style it with some padding.
		postCreate: function() {
			var anchor = dojo.query("a", this.domNode)[0]; //$NON-NLS-0$
			if (anchor) {
				dojo.addClass(anchor, "commandMenuItemAnchor"); //$NON-NLS-0$
				this._anchorLocation = anchor.href;
			}
		},
		
		setLink: function(href, name) {
			this.set("label", "<a class='commandMenuItemAnchor' href='"+href+"'>"+name+"</a>"); //$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			this._anchorLocation = href;
		},
		
		_onClick: function(evt) {
			if (!this.hasLink) {
				this.inherited(arguments);
			}
		}
	});
	
	/**
	 * Override the dijit Tooltip to handle cases where the tooltip is not dismissing
	 * when expected.
	 * Case 1:  the tooltip should close when the command dom node that generated it is hidden.
	 * Case 2:  the tooltip should always disappear when unhovered, regardless of who has the 
	 * focus.  This allows the tooltip to properly disappear when we hit Esc to close the menu.  
	 * We may have to revisit this when we do an accessibility pass.
	 * 
	 * See https://bugs.eclipse.org/bugs/show_bug.cgi?id=360687
	 */
	var CommandTooltip = dojo.declare(dijit.Tooltip, {
		constructor : function() {
			this.inherited(arguments);
			this.options = arguments[0] || {};
		},
		
		_onUnHover: function(evt){
			// comment out line below from dijit implementation
			// if(this._focus){ return; }
			// this is the rest of it
			if(this._showTimer){
				window.clearTimeout(this._showTimer);
				delete this._showTimer;
			}
			// added this flag
			this.polling = false;
			this.close();
			
		}, 
		
		_onHover: function(/*DomNode*/ target){
			// Override to register for notification when parent node disappears
			// See https://bugs.eclipse.org/bugs/show_bug.cgi?id=369923
			this.inherited(arguments);
			this.polling = true;
			this.pollForMissingTarget();
			
			// Override the dijit default ARIA role of alert, which causes undesirable behaviour.
			window.setTimeout(function() {
				if(dijit._masterTT) {
					dojo.removeAttr(dijit._masterTT.containerNode, "role"); //$NON-NLS-0$
				}
			}, this.showDelay + 1);
		},
		
		pollForMissingTarget: function() {
			if (!this.polling) {
				return;
			}
			window.setTimeout(dojo.hitch(this, function() {
				// see if our target node is still in the document
				// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=369923
				if (this._stillInDocument(this._connectNode)) {
					this.pollForMissingTarget();
				} else {
					this.polling = false;
					this.close();
				}
			}), 1000);
		},
		
		_stillInDocument: function(node) {
			// we can't check dojo.byId(node.id) because we could have another node by the same id, common when
			// emptying a command parent and rerendering commands.  You'll end up with the same id.  This is precisely
			// the case we are trying to correct in	https://bugs.eclipse.org/bugs/show_bug.cgi?id=369923
			// parent nodes are also still hooked up.  So we have to walk up all the way the parent chain to see if
			// indeed our parent node is the document.
			while (node) {
		        if (node === window.document) {
		            return true;
		        }
		        node = node.parentNode;
			}
			// parent chain stopped before getting to document.
			return false;
		},
				
		postMixInProperties: function() {
			this.inherited(arguments);
			if (this.options.commandParent) {
				if (dijit.byId(this.options.commandParent.id)) {
					// this is a menu
					dojo.connect(this.options.commandParent, "onClose", dojo.hitch(this, function() {this.close();})); //$NON-NLS-0$
				}				
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
		this._commandList = {};
		this._contributionsByScopeId = {};
		this._activeBindings = {};
		this._urlBindings = {};
		this._init(options);
		this._parameterCollector = null;
	}
	CommandService.prototype = /** @lends orion.commands.CommandService.prototype */ {
		_init: function(options) {
			this._registry = options.serviceRegistry;
			this._serviceRegistration = this._registry.registerService("orion.page.command", this); //$NON-NLS-0$
			this._defaultSelectionService = options.selection;
			dojo.connect(window.document, "onkeydown", dojo.hitch(this, function (evt){ //$NON-NLS-0$
				evt = evt || window.event;
				// bindings are ignored if we are in a text field or editor
				if (evt.target.contentEditable === "true") { //$NON-NLS-0$
					return;
				}
				var tagType = evt.target.nodeName.toLowerCase();
				if (tagType === 'input') { //$NON-NLS-0$
					var inputType = evt.target.type.toLowerCase();
					// Any HTML5 input type that involves typing text should be ignored
					switch (inputType) {
						case "text": //$NON-NLS-0$
						case "password": //$NON-NLS-0$
						case "search": //$NON-NLS-0$
						case "color": //$NON-NLS-0$
						case "date": //$NON-NLS-0$
						case "datetime": //$NON-NLS-0$
						case "datetime-local": //$NON-NLS-0$
						case "email": //$NON-NLS-0$
						case "month": //$NON-NLS-0$
						case "number": //$NON-NLS-0$
						case "range": //$NON-NLS-0$
						case "tel": //$NON-NLS-0$
						case "time": //$NON-NLS-0$
						case "url": //$NON-NLS-0$
						case "week": //$NON-NLS-0$
							return;
					}
				} else if (tagType === 'textarea') { //$NON-NLS-0$
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
						var invocation = activeBinding.invocation;
						// an invocation should be there if the command has rendered.
						if (invocation) {
							var command = activeBinding.command;
							if (command.hrefCallback) {
								stop(event);
								var href = command.hrefCallback.call(invocation.handler || window, invocation);
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
								window.setTimeout(dojo.hitch(this, function() {	
									this._invoke(invocation);
								}), 0);
								return;
							}
						}
					}
				}
			}
		},
		/**
		 * Process the provided URL to determine whether any commands should be invoked.  Note that we never
		 * invoke a command callback by URL, only its parameter collector.  If a parameter collector is not
		 * specified, commands in the URL will be ignored.
		 *
		 * @param {String} url a url that may contain URL bindings.
		 */
		processURL: function(url) {
			for (var id in this._urlBindings) {
				if (this._urlBindings[id] && this._urlBindings[id].urlBinding && this._urlBindings[id].command) {
					var match = this._urlBindings[id].urlBinding.match(url);
					if (match) {
						var urlBinding = this._urlBindings[id];
						var command = urlBinding.command;
						var invocation = urlBinding.invocation;
						// If the command has not rendered (visibleWhen=false, etc.) we don't have an invocation.
						if (invocation && invocation.parameters && command.callback) {
							invocation.parameters.setValue(match.parameterName, match.parameterValue);
							window.setTimeout(dojo.hitch(this, function() {
								this._invoke(invocation);
							}), 0);
							return;
						}
					}
				}
			}
		},
		
		findCommand: function(commandId) {
			return this._commandList[commandId];
		}, 
		
		/**
		 * Run the command with the specified commandId.
		 *
		 * @param {String} commandId the id of the command to run.
		 * @param {Object} the item on which the command should run.
		 * @param {Object} the handler for the command.
		 *
		 * Note:  The current implementation will only run the command if a URL binding has been
		 * specified, or if an item to run the command against has been specified.  
		 */
		runCommand: function(commandId, item, handler) {
			if (item) {
				var command = this._commandList[commandId];
				var enabled = command.visibleWhen ? command.visibleWhen(item) : true;
				if (enabled && command.callback) {
					window.setTimeout(dojo.hitch(this, function() {
						this._invoke(new CommandInvocation(this, handler, item, null, command));
					}), 0);
				}
			} else {
				//TODO should we be keeping invocation context for commands without bindings? 
				var binding = this._urlBindings[commandId];
				if (binding && binding.command) {
					if (binding.command.callback) {
						window.setTimeout(dojo.hitch(this, function() {
							this._invoke(binding.invocation);
						}), 0);
					}
				}
			}
		},
		
		/**
		 * Return the default selection service that is being used when commands should apply against a selection.
		 */
		getSelectionService: function() {
			return this._defaultSelectionService;
		},
		
		/**
		 * Provide an object that can collect parameters for a given "tool" command.  When a command that
		 * describes its required parameters is shown in a toolbar (as an image, button, or link), clicking
		 * the command will invoke any registered parameterCollector before calling the command's callback.
		 * This hook allows a page to define a standard way for collecting required parameters that is 
		 * appropriate for the page architecture.  If no parameterCollector is specified, then the command callback
		 * will be responsible for collecting parameters.
		 *
		 * @param {Object} parameterCollector a collector which implements <code>open(commandNode, id, fillFunction)</code>,
		 *  <code>close(commandNode)</code>, <code>getFillFunction(commandInvocation)</code>, and <code>collectParameters(commandInvocation)</code>.
		 *
		 */
		setParameterCollector: function(parameterCollector) {
			this._parameterCollector = parameterCollector;
		},
				
		/**
		 * Open a parameter collector suitable for collecting information about a command.
		 * Once a collector is created, the specified function is used to fill it with
		 * information needed by the command.  This method is used for commands that cannot
		 * rely on a simple parameter description to collect parameters.  Commands that describe
		 * their required parameters do not need to use this method because the command framework
		 * will open and close parameter collectors as needed and call the command callback with
		 * the values of those parameters.
		 *
		 * @param {DOMElement} node the dom node that is displaying the command, or a node in the parameter collector area
		 * @param {Function} fillFunction a function that will fill the parameter area
		 * @param {Function} onClose a function that will be called when the user closes the collector
		 */
		openParameterCollector: function(node, fillFunction, onClose) {
			if (this._parameterCollector) {
				this._parameterCollector.close();
				this._parameterCollector.open(node, fillFunction, onClose);
			}
		},
		
		/**
		 * Close any active parameter collector.  This method should be used to deactivate a
		 * parameter collector that was opened with <code>openParameterCollector</code>.
		 * Commands that describe their required parameters do not need to use this method 
		 * because the command framework will open and close parameter collectors as needed and 
		 * call the command callback with the values of those parameters.
		 */

		closeParameterCollector: function() {
			if (this._parameterCollector) {
				this._parameterCollector.close();
			}
		},
		
		/**
		 * Returns whether this service has been configured to collect command parameters
		 *
		 * @returns whether or not this service is configured to collect parameters.
		 */
		collectsParameters: function() {
			return this._parameterCollector;
		},
		
		/*
		 * Invoke the specified command, collecting parameters if necessary.  This is used inside the framework
		 * when the user invokes a command.
		 */
		_invoke: function(commandInvocation) {
			return this._collectAndInvoke(commandInvocation.makeCopy(), false);
		},
		
	
		/*
		 * This method is the actual implementation for collecting parameters and invoking a callback.
		 * "forceCollect" specifies whether we should always collect parameters or consult the parameters description to see if we should.
		 */
		_collectAndInvoke: function(commandInvocation, forceCollect) {
			if (commandInvocation) {
				// Establish whether we should be trying to collect parameters. 
				if (this._parameterCollector && commandInvocation.parameters && commandInvocation.parameters.hasParameters() && 
					(forceCollect || commandInvocation.parameters.shouldCollectParameters())) {
					var collecting = false;
					commandInvocation.parameters.updateParameters(commandInvocation);
					collecting = this._parameterCollector.collectParameters(commandInvocation);
				
					// The parameter collector cannot collect.  We will do a default implementation using a tooltip dialog.
					if (!collecting) {
						var tooltipDialog = new dijit.TooltipDialog({
							onBlur: function() {dijit.popup.close(tooltipDialog);}
						});		
						var parameterArea = dojo.create("div"); //$NON-NLS-0$
						var originalFocusNode = window.document.activeElement;
						var focusNode = this._parameterCollector.getFillFunction(commandInvocation, function() {
							dijit.popup.close(tooltipDialog);
							tooltipDialog.destroyRecursive();
							if (originalFocusNode) {
								originalFocusNode.focus();
							}
						})(parameterArea);
						tooltipDialog.set("content", parameterArea); //$NON-NLS-0$
						var menu = dijit.byId(commandInvocation.domParent.id);
						var pos;
						if (menu) {
							pos = dojo.position(menu.eclipseScopeId, true);
						} else {
							pos = dojo.position(commandInvocation.domNode, true);
						}
						if (pos.x && pos.y && pos.w) {
							dijit.popup.open({popup: tooltipDialog, x: pos.x + pos.w - 8, y: pos.y + 8});
							window.setTimeout(function() {
								focusNode.focus();
								focusNode.select();
							}, 0);
							collecting = true;
						}
					}
					if (!collecting) {
						// We have failed, so let's get rid of the parameters and just call the callback
						commandInvocation.parameters = null;
						commandInvocation.command.callback.call(commandInvocation.handler || window, commandInvocation);
					}
				} else {
					// We should not be trying to collect parameters, just call the callback.
					commandInvocation.command.callback.call(commandInvocation.handler || window, commandInvocation);
				}
			} else {
				window.console.log("Client attempted to invoke command without an available (rendered) command invocation"); //$NON-NLS-0$
			}
		},
		
		/**
		 * Collect the parameters specified in the given command invocation.  If parameters are
		 * collected successfully, invoke the command's callback. This method is used by clients who want to 
		 * control the timing of parameter collection.  For example, if a command must be executed before it can
		 * be determined what parameters are known, the client can try the command in the callback and then call
		 * this function if parameters are needed.  In this case, clients typically configure the parameters description
		 * options with "options.clientWillCollect" set to true.
		 *
		 * {@link orion.commands.ParametersDescription}
		 *
		 * @param {orion.commands.CommandInvocation} the current invocation of the command 
		 */
		collectParameters: function(commandInvocation) {
			this._collectAndInvoke(commandInvocation, true); 
		},
		
		/**
		 * Show the keybindings that are registered with the command service inside the specified domNode.
		 * @param targetNode {DOMElement} the dom node where the key bindings should be shown.
		 */
		showKeyBindings: function(targetNode) {
			var scopes = {};
			var bindingString, binding;
			for (var aBinding in this._activeBindings) {
				binding = this._activeBindings[aBinding];
				if (binding && binding.keyBinding && binding.command) {
					// skip scopes and process at end
					if (binding.keyBinding.scopeName) {
						if (!scopes[binding.keyBinding.scopeName]) {
							scopes[binding.keyBinding.scopeName] = [];
						}
						scopes[binding.keyBinding.scopeName].push(binding);
					} else {
						bindingString = mUtil.getUserKeyString(binding.keyBinding);
						dojo.place("<span role='listitem'>"+bindingString+" = "+binding.command.name+"<br></span>", targetNode, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					}
				}
			}
			for (var scopedBinding in scopes) {
				if (scopes[scopedBinding].length && scopes[scopedBinding].length > 0) {
					dojo.place("<h2>"+scopedBinding+"</h2>", targetNode, "last"); //$NON-NLS-1$ //$NON-NLS-0$ //$NON-NLS-3$ 
					for (var i=0; i<scopes[scopedBinding].length; i++) {
						binding = scopes[scopedBinding][i];
						bindingString = mUtil.getUserKeyString(binding.keyBinding);
						dojo.place("<span role='listitem'>"+bindingString+" = "+binding.command.name+"<br></span>", targetNode, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					}
				}	
			}
		},
		
		/** 
		 * Add a command to the command service.  Nothing will be shown in the UI
		 * until this command is referenced in a contribution.
		 * @param command {Command} the command being added.
		 */
		addCommand: function(command) {
			this._commandList[command.id] = command;
		},
		
		/**
		 * Registers a command group and specifies visual information about the group.
		 * @param {String} scopeId The id of a DOM element in which the group should be visible.  Required.
		 *  When commands are rendered for a particular element, the group will be shown only if its scopeId
		 *  matches the id being rendered.
		 * @param {String} groupId The id of the group, must be unique.  May be used for a dom node id of
		 *  the element representing the group
		 * @param {Number} position The relative position of the group within its parent.  Required.
		 * @param {String} title The title of the group, optional
		 * @param {String} parentPath The path of parent groups, separated by '/'.  For example,
		 *  a path of "group1Id/group2Id" indicates that the group belongs as a child of 
		 *  group2Id, which is itself a child of group1Id.  Optional.
		 * @param {String} emptyGroupMessage A message to show if the group is empty and the user activates the UI element
		 *  representing the group.  Optional.  If not specified, then the group UI element won't be shown when it is empty.
		 */	
		 
		addCommandGroup: function(scopeId, groupId, position, title, parentPath, emptyGroupMessage) {
			if (!this._contributionsByScopeId[scopeId]) {
				this._contributionsByScopeId[scopeId] = {};
			}
			var parentTable = this._contributionsByScopeId[scopeId];
			if (parentPath) {
				parentTable = this._createEntryForPath(parentTable, parentPath);		
			} 
			if (parentTable[groupId]) {
				// update existing group definition if info has been supplied
				if (title) {
					parentTable[groupId].title = title;
				}
				if (position) {
					parentTable[groupId].position = position;
				}
				parentTable[groupId].emptyGroupMessage = emptyGroupMessage;
			} else {
				// create new group definition
				parentTable[groupId] = {title: title, position: position, emptyGroupMessage: emptyGroupMessage, children: {}};
				parentTable.sortedContributions = null;
			}
		},
		
		_createEntryForPath: function(parentTable, parentPath) {
			if (parentPath) {
				var segments = parentPath.split("/"); //$NON-NLS-0$
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
		 * Register a selection service that should be used for certain command scopes.
		 * @param {String} scopeId The id describing the scope for which this selection service applies.  Required.
		 *  Only contributions made to this scope will use the selection service.
		 * @param {orion.selection.Selection} selectionService the selection service for the scope.
		 */
		registerSelectionService: function(scopeId, selectionService) {
			if (!this._contributionsByScopeId[scopeId]) {
				this._contributionsByScopeId[scopeId] = {};
			}
			this._contributionsByScopeId[scopeId].localSelectionService = selectionService;
		},
		
		/**
		 * Register a command contribution, which identifies how a command appears
		 * on a page and how it is invoked.
		 * @param {String} scopeId The id describing the scope of the command.  Required.
		 *  This scope id is used when rendering commands.
		 * @param {String} commandId the id of the command.  Required.
		 * @param {Number} position the relative position of the command within its parent.  Required.
		 * @param {String} parentPath the path of any parent groups, separated by '/'.  For example,
		 *  a path of "group1Id/group2Id/command" indicates that the command belongs as a child of 
		 *  group2Id, which is itself a child of group1Id.  Optional.
		 * @param {boolean} bindingOnly if true, then the command is never rendered, but the key or URL binding is hooked.
		 * @param {orion.commands.CommandKeyBinding} keyBinding a keyBinding for the command.  Optional.
		 * @param {orion.commands.URLBinding} urlBinding a url binding for the command.  Optional.
		 */
		registerCommandContribution: function(scopeId, commandId, position, parentPath, bindingOnly, keyBinding, urlBinding) {
			if (!this._contributionsByScopeId[scopeId]) {
				this._contributionsByScopeId[scopeId] = {};
			}
			var parentTable = this._contributionsByScopeId[scopeId];
			if (parentPath) {
				parentTable = this._createEntryForPath(parentTable, parentPath);		
			} 
			
			// store the contribution
			parentTable[commandId] = {position: position};
			
			var command;
			// add to the bindings table now
			if (keyBinding) {
				command = this._commandList[commandId];
				if (command) {
					this._activeBindings[commandId] = {command: command, keyBinding: keyBinding, bindingOnly: bindingOnly};
				}
			}
			
			// add to the url key table
			if (urlBinding) {
				command = this._commandList[commandId];
				if (command) {
					this._urlBindings[commandId] = {command: command, urlBinding: urlBinding, bindingOnly: bindingOnly};
				}
			}
			// get rid of sort cache because we have a new contribution
			parentTable.sortedContributions = null;
		},
		
		_isLastChildSeparator: function(parent, style) {
			if (style === "tool" || style === "button") { //$NON-NLS-1$ //$NON-NLS-0$
				return parent.childNodes.length > 0 && dojo.hasClass(parent.childNodes[parent.childNodes.length - 1], "commandSeparator"); //$NON-NLS-0$
			}
			if (style === "menu") { //$NON-NLS-0$
				var menuChildren = parent.getChildren();
				return menuChildren.length > 0 && (menuChildren[menuChildren.length-1] instanceof dijit.MenuSeparator);
			}
			return false;
		},

		/**
		 * Render the commands that are appropriate for the given scope.
		 * @param {String} scopeId The id describing the scope for which we are rendering commands.  Required.
		 *  Only contributions made to this scope will be rendered.
		 * @param {DOMElement} parent The element in which commands should be rendered.  If commands have been
		 *  previously rendered into this element, it is up to the caller to empty any previously generated content.
		 * @param {Object} items An item or array of items to which the command applies.  Optional.  If not
		 *  items are specified and a selection service was specified at creation time, then the selection
		 *  service will be used to determine which items are involved. 
		 * @param {Object} handler The object that should perform the command
		 * @param {String} renderType The style in which the command should be rendered.  "tool" will render
		 *  a tool image in the dom.  "button" will render a text button.  "menu" will render menu items.  The caller
		 *  must supply the parent menu.
		 * @param {Object} userData Optional user data that should be attached to generated command callbacks
		 * @param {Array} domNodeWrapperList Optional an array used to record any DOM nodes that are rendered during this call.
		 *  If an array is provided, then as commands are rendered, an object will be created to represent the command's node.  
		 *  The object will always have the property "domNode" which contains the node created for the command.  If the command is
		 *  rendered using other means (toolkit widget) then the optional property "widget" should contain the toolkit
		 *  object that represents the specified dom node.
		 */	
		renderCommands: function(scopeId, parent, items, handler, renderType, userData, domNodeWrapperList) {
			if (typeof(scopeId) !== "string") { //$NON-NLS-0$
				throw "a scope id for rendering must be specified"; //$NON-NLS-0$
			}
			if (typeof(parent) === "string") { //$NON-NLS-0$
				parent = dojo.byId(parent);
			}
			if (!parent) { 
				throw "no parent";  //$NON-NLS-0$
			}

			var contributions = this._contributionsByScopeId[scopeId];

			if (!items && contributions) {
				var selectionService = contributions.localSelectionService || this._defaultSelectionService;
				var cmdService = this;
				if (selectionService) {
					selectionService.getSelections(function(selections) {
						cmdService.renderCommands(scopeId, parent, selections, handler, renderType, userData);
					});
				}
				return;
			} 
			if (contributions) {
				this._render(this._contributionsByScopeId[scopeId], parent, items, handler, renderType, userData, domNodeWrapperList);
				// If the last thing we rendered was a group, it's possible there is an unnecessary trailing separator.
				if (renderType === "tool" || renderType === "button") { //$NON-NLS-1$ //$NON-NLS-0$
					if (this._isLastChildSeparator(parent, renderType)) {
						parent.removeChild(parent.childNodes[parent.childNodes.length-1]);
					}
				} else if (renderType=== "menu") { //$NON-NLS-0$
					if (this._isLastChildSeparator(parent, renderType)) {
						var child = parent.getChildren()[parent.getChildren().length-1];
						parent.removeChild(child);
						child.destroy();
					}
				}
				// TODO should the caller have to do this?
				mUtil.forceLayout(parent);
			}
		},
		
		/**
		 * Destroy all DOM nodes and any other resources used by rendered commands.
		 * This call does not remove the commands from the command registry.  Clients typically call this
		 * function to empty a command area when a client wants to render the commands again due to some 
		 * change in state.  
		 * @param {String|DOMElement} parent The id or DOM node that should be emptied.
		 */
		destroy: function(parent) {
			if (typeof(parent) === "string") { //$NON-NLS-0$
				parent = dojo.byId(parent);
			}
			if (!parent) { 
				throw "no parent";  //$NON-NLS-0$
			}
			var widgets = dijit.findWidgets(parent);
			dojo.forEach(widgets, function(w) {
				w.destroyRecursive();
			});
			dojo.empty(parent);
		},
		
		_render: function(contributions, parent, items, handler, renderType, userData, domNodeWrapperList) {
			// sort the items
			var sortedByPosition = contributions.sortedContributions;
			if (!sortedByPosition) {
				sortedByPosition = [];
				var pushedItem = false;
				for (var key in contributions) {
				    if (!contributions.hasOwnProperty || contributions.hasOwnProperty(key)) {
						var item = contributions[key];
						if (item && typeof(item.position) === "number") { //$NON-NLS-0$
							item.id = key;
							sortedByPosition.push(item);
							pushedItem = true;
						}
					}
				}
				if (pushedItem) {
					sortedByPosition.sort(function(a,b) {
						return a.position-b.position;
					});
					contributions.sortedContributions = sortedByPosition;
				}
			}
			// now traverse the sorted contributions and render as we go
			for (var i = 0; i < sortedByPosition.length; i++) {
				var id, menuButton, invocation;
				if (sortedByPosition[i].children && Object.getOwnPropertyNames(sortedByPosition[i].children).length > 0) {
					var group = sortedByPosition[i];
					var children;
					var childContributions = sortedByPosition[i].children;
					var commandService = this;
					if (renderType === "tool" || renderType === "button") { //$NON-NLS-1$ //$NON-NLS-0$
						if (group.title) {
							// We need a named menu button.  We used to first render into the menu and only 
							// add a menu button in the dom when we knew it was needed.  For performance, though, we need
							// to be asynchronous in traversing children, so we will add the menu and only remove it
							// if it turns out we didn't need it.  
							// If we wait until the end of asynch processing to add the menu button, the order will
							// not be right, and we could have css ripple.  The down side to this approach is that a dropdown
							// could appear and then not be needed.  It would be dangerous to assume that null items or an empty
							// item array always mean "don't render" since some commands ignore the items.  It seems the best we
							// can do is add it as not visible (thus reserving space) and make it visible when needed.   This could
							// still cause ripple but helps with cases like the "More" menu which is always last.
							
							var newMenu= new dijit.Menu({
								style: "display: none;" //$NON-NLS-0$
							});
							menuButton = new dijit.form.DropDownButton({
								label: group.title === "*" ? messages["Actions"] : group.title, //TODO undocumented hack, even mode dangerous when we have globalization //$NON-NLS-0$
								showLabel:  group.title !== "*", //$NON-NLS-0$
								style: "visibility: hidden;", //$NON-NLS-0$
								dropDown: newMenu
						        });
							dojo.addClass(menuButton.domNode, "commandMenu"); //$NON-NLS-0$
							if(domNodeWrapperList){
								//we need to add the menuButton as the optional widget param
								mNavUtils.generateNavGrid(domNodeWrapperList, menuButton.domNode, menuButton);
							}
							var menuParent = parent;
							if (parent.nodeName.toLowerCase() === "ul") { //$NON-NLS-0$
								menuParent = dojo.create("li", {}, parent); //$NON-NLS-0$
							} else {
								dojo.addClass(menuButton.domNode, "commandMargins"); //$NON-NLS-0$
							}
							dojo.removeAttr(menuButton.titleNode, "title"); // there is no need for a native browser tooltip //$NON-NLS-0$
							dojo.destroy(menuButton.valueNode); // the valueNode gets picked up by screen readers; since it's not used, we can get rid of it
							_setupActivateVisuals(menuButton.domNode, menuButton.focusNode);
							dojo.place(menuButton.domNode, menuParent, "last"); //$NON-NLS-0$
							// we'll need to identify a menu with the dom id of its original parent
							newMenu.eclipseScopeId = parent.eclipseScopeId || parent.id;
							// render the children asynchronously
							window.setTimeout(dojo.hitch({contributions: childContributions, emptyGroupMessage: group.emptyGroupMessage}, function() {
								// it is possible that commands were destroyed by the time we get here.  Bail out if
								// the parent menu has been destroyed.  We are reaching into the widget to make this
								// determination.
								// See https://bugs.eclipse.org/bugs/show_bug.cgi?id=382394
								if (newMenu._destroyed) {
									return;
								}
								commandService._render(this.contributions, newMenu, items, handler, "menu", userData, domNodeWrapperList);  //$NON-NLS-0$
								// special post-processing when we've created a menu in an image bar.  We want to get rid 
								// of a trailing separator in the menu first, and then decide if our menu is necessary
								children = newMenu.getChildren();
								if (commandService._isLastChildSeparator(newMenu, "menu")) { //$NON-NLS-0$
									var trailingSep = children[children.length-1];
									newMenu.removeChild(trailingSep);
									trailingSep.destroy();
									children = newMenu.getChildren();
								}
								// now determine if we actually needed the menu or not
								if (children.length === 0) {
									if (this.emptyGroupMessage) {
										dojo.connect(menuButton.focusNode, "onclick", this, function() { //$NON-NLS-0$
											//Show the empty group message.
											var tooltipDialog = new dijit.TooltipDialog({
												content: "<p>"+this.emptyGroupMessage+"</p>",
												onMouseLeave: function() {
													dijit.popup.close(tooltipDialog);
													tooltipDialog.destroyRecursive();
												}
											});		
											dijit.popup.open({popup: tooltipDialog, around: menuButton.domNode});
											// in case the user's mouse never entered this popup and thus couldn't leave
											window.setTimeout(function() {
												dijit.popup.close(tooltipDialog);
												tooltipDialog.destroyRecursive();
											}, 15000);
										});
										dojo.style(menuButton.domNode, "visibility", "visible"); //$NON-NLS-1$ //$NON-NLS-0$
									} else {
										if(domNodeWrapperList){
											mNavUtils.removeNavGrid(domNodeWrapperList, menuButton.domNode);
										}
										menuButton.destroyRecursive();
									}
								} else {
									dojo.style(menuButton.domNode, "visibility", "visible"); //$NON-NLS-1$ //$NON-NLS-0$
								}
							}), 0);
						} else {  
							// rendering a group using a separator on each end. We do it synchronously because order matters with
							// non grouped items.
							var sep;
							// Only draw a separator if there is a non-separator preceding it.
							if (parent.childNodes.length > 0 && !this._isLastChildSeparator(parent, renderType)) {
								sep = this.generateSeparatorImage(parent);
							}
							commandService._render(childContributions, parent, items, handler, renderType, userData, domNodeWrapperList); 
	
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
							// popup menu placeholder must be added synchronously to respect order.
							// We will remove it if it ends up empty
							var groupPopup = new dijit.PopupMenuItem({
								label: group.title,
								popup: subMenu
							});
							parent.addChild(groupPopup);
							commandService._render(childContributions, subMenu, items, handler, renderType, userData, domNodeWrapperList); 
							if (subMenu.getChildren().length === 0) {
								groupPopup.set("label", "removeme"); //$NON-NLS-1$ //$NON-NLS-0$
								parent.removeChild(groupPopup);
								groupPopup.destroyRecursive();
							}
						} else {  
							// menu items with leading and trailing separators
							// don't render a separator if there is nothing preceding, or if the last thing was a separator
							var menuSep;
							if (parent.getChildren().length > 0 && !this._isLastChildSeparator(parent, renderType)) {
								menuSep = new dijit.MenuSeparator();
								parent.addChild(menuSep);
							}
							// synchronously render the children since order matters
							commandService._render(childContributions, parent, items, handler, renderType, userData, domNodeWrapperList); 
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
					var command = this._commandList[sortedByPosition[i].id];
					var render = command ? true : false;
					var keyBinding = null;
					var urlBinding = null;
					if (command) {
						invocation = new CommandInvocation(this, handler, items, userData, command);
						invocation.domParent = parent;
						var enabled = render && (command.visibleWhen ? command.visibleWhen(items) : true);
						// ensure that keybindings are bound to the current handler, items, and user data
						if (this._activeBindings[command.id] && this._activeBindings[command.id].keyBinding) {
							keyBinding = this._activeBindings[command.id];
							if (enabled) {
								keyBinding.invocation = invocation;
							} else {
								keyBinding.invocation = null;
							}
							// if it is a binding only, don't render the command.
							if (keyBinding.bindingOnly) {
								render = false;
							}
						}
						
						// same for url bindings
						if (this._urlBindings[command.id] && this._urlBindings[command.id].urlBinding) {
							urlBinding = this._urlBindings[command.id];
							if (enabled) {
								urlBinding.invocation = invocation;
							} else {
								urlBinding.invocation = null;
							}
							if (urlBinding.bindingOnly) {
								render = false;
							}
						}
						render = render && enabled;
					}
					if (render) {
						// special case.  The item wants to provide a set of choices
						if (command.choiceCallback) {
							var choicesMenu = new dijit.Menu({
								style: "display: none;" //$NON-NLS-0$
							});
							if (renderType === "tool" || renderType === "button") { //$NON-NLS-1$ //$NON-NLS-0$
								menuButton = new dijit.form.DropDownButton({
										label: command.name,
										dropDown: choicesMenu
								        });
								dojo.addClass(menuButton.domNode, "commandMenu"); //$NON-NLS-0$
								dojo.removeAttr(menuButton.titleNode, "title"); // there is no need for a native browser tooltip //$NON-NLS-0$
								dojo.destroy(menuButton.valueNode); // the valueNode gets picked up by screen readers; since it's not used, we can get rid of it
								if (command.image) {
									dojo.addClass(menuButton.iconNode, "commandImage"); //$NON-NLS-0$
									menuButton.iconNode.src = command.image;
								}
								dojo.place(menuButton.domNode, parent, "last"); //$NON-NLS-0$
								menuButton.eclipseCommand = command;
								menuButton.eclipseChoices = choicesMenu;
								dojo.connect(menuButton, "onClick", menuButton, function(event) { //$NON-NLS-0$
									this.eclipseCommand.populateChoicesMenu(this.eclipseChoices, items, handler, userData);
								});
							} else if (renderType === "menu") { //$NON-NLS-0$
								// parent is already a menu
								var popup = new dijit.PopupMenuItem({
									label: command.name,
									popup: choicesMenu
								});
								parent.addChild(popup);
								popup.eclipseCommand = command;
								popup.eclipseChoices = choicesMenu;
								// See https://bugs.eclipse.org/bugs/show_bug.cgi?id=338887
								dojo.connect(parent, "_openPopup", popup, function(event) { //$NON-NLS-0$
									this.eclipseCommand.populateChoicesMenu(this.eclipseChoices, items, handler, userData);
								});
							}
						} else {
							if (renderType === "tool") { //$NON-NLS-0$
								id = "tool" + command.id + i;  // using the index ensures unique ids within the DOM when a command repeats for each item //$NON-NLS-0$
								command._addTool(parent, id, invocation, domNodeWrapperList);	
							} else if (renderType === "button") { //$NON-NLS-0$
								id = "button" + command.id + i;  // using the index ensures unique ids within the DOM when a command repeats for each item //$NON-NLS-0$
								command._addButton(parent, id, invocation, domNodeWrapperList);	
							} else if (renderType === "menu") { //$NON-NLS-0$
								command._addMenuItem(parent, invocation, domNodeWrapperList);
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
			var sep;
			if (parent.nodeName.toLowerCase() === "ul") { //$NON-NLS-0$
				sep = dojo.create("li", null, parent, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			} else {
				sep = dojo.create("span", null, parent, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			}
			dojo.addClass(sep, "core-sprite-sep");  // location in sprite //$NON-NLS-0$
			dojo.addClass(sep, "imageSprite");  // sets sprite background //$NON-NLS-0$
			dojo.addClass(sep, "commandSeparator"); //$NON-NLS-0$
			return sep;
		}

	};  // end command service prototype
	CommandService.prototype.constructor = CommandService;
	
	function addImageToElement(command, element, name) {
		dojo.addClass(element, "commandImage"); //$NON-NLS-0$
		var node;
		if (command.imageClass) {
			node = dojo.create("span", {}, element, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(node, command.spriteClass);
			dojo.addClass(node, command.imageClass);
		} else {
			node = new Image();
			node.alt = command.name;
			node.name = name;
			node.id = name;
			node.src = command.image;	
			dojo.place(node, element, "last"); //$NON-NLS-0$
		}
		return node;
	}

	/**
	 * Constructs a new command with the given options.
	 * @param {Object} options The command options object.
	 * @param {String} options.id the unique id to be used when referring to the command in the command service.
	 * @param {String} options.name the name to be used when showing the command as text.
	 * @param {String} options.tooltip the tooltip description to use when explaining the purpose of the command.
	 * @param {Function} options.callback the callback to call when the command is activated.  The callback should either 
	 *  perform the command or return a deferred that represents the asynchronous performance of the command.  Optional.
	 * @param {Function} options.hrefcallback if specified, this callback is used to retrieve
	 *  a URL that can be used as the location for a command represented as a hyperlink.  The callback should return 
	 *  the URL.  In this release, the callback may also return a deferred that will eventually return the URL, but this 
	 *  functionality may not be supported in the future.  See https://bugs.eclipse.org/bugs/show_bug.cgi?id=341540.
	 *  Optional.
	 * @param {Function} options.choicecallback a callback which retrieves choices that should be shown in a secondary
	 *  menu from the command itself.  Returns a list of choices that supply the name and image to show, and the callback
	 *  to call when the choice is made.  Optional.
	 * @param {String} options.imageClass a CSS class name suitable for showing a background image.  Optional.
	 * @param {String} options.spriteClass an additional CSS class name that can be used to specify a sprite background image.  This
	 *  useful with some sprite generation tools, where imageClass specifies the location in a sprite, and spriteClass describes the
	 *  sprite itself.  Optional.
	 * @param {Function} options.visibleWhen A callback that returns a boolean to indicate whether the command should be visible
	 *  given a particular set of items that are selected.  Optional, defaults to always visible.
	 * @param {orion.commands.ParametersDescription} options.parameters A description of parameters that should be collected before invoking
	 *  the command.
	 * @param {Image} options.image the image that may be used to represent the callback.  A text link will be shown in lieu
	 *  of an image if no image is supplied.  Optional.
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
			this.name = options.name;
			this.tooltip = options.tooltip || options.name;
			this.callback = options.callback; // optional callback that should be called when command is activated (clicked)
			this.hrefCallback = options.hrefCallback; // optional callback that returns an href for a command link
			this.choiceCallback = options.choiceCallback; // optional callback indicating that the command will supply secondary choices.  
														// A choice is an object with a name, callback, and optional image
			this.image = options.image || require.toUrl("images/none.png"); //$NON-NLS-0$
			this.imageClass = options.imageClass;   // points to the location in a sprite
			this.spriteClass = options.spriteClass || "commandSprite"; // defines the background image containing sprites //$NON-NLS-0$
			this.visibleWhen = options.visibleWhen;
			this.parameters = options.parameters;
			this.description = options.description;
		},
		/*
		 *  Adds a "tool" representation for the command.  
		 *  For href commands, this is just a link.
		 *  For non-href commands, this is an image button.  If there is no image button, use bolded text button.
		 */
		_addTool: function(parent, name, context, domNodeWrapperList) {
			context.handler = context.handler || this;
			var element, image;
			if (this.hrefCallback) {
				element = this._makeLink(context);
				if (!element) {
					return;
				}
			} else {
				element = dojo.create("span", {tabindex: domNodeWrapperList ? "-1" : "0", role: "button"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				if (!this.hasImage()) {
					var text = window.document.createTextNode(this.name);
					dojo.place(text, element, "last"); //$NON-NLS-0$
					dojo.addClass(element, "commandMissingImageButton commandButton"); //$NON-NLS-0$
				} else {
					image = addImageToElement(this, element, name);
					// ensure there is accessible text describing this image
					this._addAccessibleLabel(element);
				}
				this._hookCallback(element, context);
				_setupActivateVisuals(element, element, image ? "commandImageOver" : "commandButtonOver");			 //$NON-NLS-1$ //$NON-NLS-0$

			}
			context.domNode = element;
			context.domParent = parent;
			if (this.tooltip) {
				new CommandTooltip({
					connectId: [element],
					label: this.tooltip,
					position: ["above", "left", "right", "below"], // otherwise defaults to right and obscures adjacent commands //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					commandParent: parent,
					commandService: context.commandService
				});
			}
			if (parent.nodeName.toLowerCase() === "ul") { //$NON-NLS-0$
				parent = dojo.create("li", {}, parent); //$NON-NLS-0$
			} else {
				dojo.addClass(element, "commandMargins"); //$NON-NLS-0$
			}
			dojo.place(element, parent, "last"); //$NON-NLS-0$
			mNavUtils.generateNavGrid(domNodeWrapperList, context.domNode);
		},
	
		/*
		 *  Adds a "button" representation for the command.  
		 *  For href commands, this is just a link.
		 *  For non-href commands, this is a text button.  If there is no name, use an image.
		 */
		_addButton: function(parent, name, context, domNodeWrapperList) {
			context.handler = context.handler || this;
			var element;
			if (this.hrefCallback) {
				element = this._makeLink(context);
				if (!element) {
					return;
				}
			} else {
				element = dojo.create("span", {tabindex: "0", role: "button"}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				this._hookCallback(element, context);
				var overClass;
				if (this.name) {
					dojo.place(window.document.createTextNode(this.name), element, "last"); //$NON-NLS-0$
					dojo.addClass(element, "commandButton"); //$NON-NLS-0$
					overClass = "commandButtonOver"; //$NON-NLS-0$
				} else {
					// TODO we need a way to force a button contribution to look like a tool.  This is a very rare case.
					addImageToElement(this, element, name);
					overClass = "commandImageOver"; //$NON-NLS-0$
					// ensure there is accessible text describing this image
					this._addAccessibleLabel(element);
				}
				_setupActivateVisuals(element, element, overClass);			
			}
			element.id = name;
			if (this.tooltip) {
				new CommandTooltip({
					connectId: [element],
					label: this.tooltip,
					position: ["above", "left", "right", "below"], // otherwise defaults to right and obscures adjacent commands //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					commandParent: parent,
					commandService: context.commandService
				});
			}
			context.domParent = parent;
			context.domNode = element;
			if (parent.nodeName.toLowerCase() === "ul") { //$NON-NLS-0$
				parent = dojo.create("li", {}, parent); //$NON-NLS-0$
			} else {
				dojo.addClass(element, "commandMargins"); //$NON-NLS-0$
			}
			dojo.place(element, parent, "last"); //$NON-NLS-0$
			mNavUtils.generateNavGrid(domNodeWrapperList, context.domNode);
		},
		_addMenuItem: function(parent, context, domNodeWrapperList) {
			context.domParent = parent.domNode;
			var menuitem = new CommandMenuItem({
				labelType: this.hrefCallback ? "html" : "text", //$NON-NLS-1$ //$NON-NLS-0$
				label: this.name,
				iconClass: this.imageClass,
				hasLink: !!this.hrefCallback
			});
			if (this.tooltip) {
				new CommandTooltip({
					connectId: [menuitem.domNode],
					label: this.tooltip,
					commandParent: parent,
					commandService: context.commandService
				});
			}
			if (this.hrefCallback) {
				var loc = this.hrefCallback.call(context.handler, context);
				if (loc) {
					if (loc.then) {
						loc.then(dojo.hitch(this, function(l) { 
							menuitem.setLink(l, this.name); 
						}));
					} else if (loc) {
						menuitem.setLink(loc, this.name);
					} else {
						return;
					}
				}
			} else if (this.callback) {
				menuitem.onClick = dojo.hitch(this, function() {
					context.commandService._invoke(context);
				});
			}
			
			// we may need to refer back to the command.  
			menuitem.eclipseCommand = this;
			parent.addChild(menuitem);
			if (this.imageClass) {
				dojo.addClass(menuitem.iconNode, this.spriteClass);
			} else if (this.image) {
				dojo.addClass(menuitem.iconNode, "commandMenuItem"); //$NON-NLS-0$
				// reaching...
				menuitem.iconNode.src = this.image;
			}
			context.domNode = menuitem.domNode;
			mNavUtils.generateNavGrid(domNodeWrapperList, context.domNode);
		},
		
		/*
		 * stateless helper
		 */
		 _makeLink: function(context) {
			var element = dojo.create("a", {tabindex: "0"}); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(element, "commandLink"); //$NON-NLS-0$
			dojo.place(window.document.createTextNode(this.name), element, "last"); //$NON-NLS-0$
			var href = this.hrefCallback.call(context.handler, context);
			if (href.then){
				href.then(function(l){
					element.href = l;
				});
			} else if (href) {
				element.href = href; 
			} else {  // no href, we don't want the link
				return null;
			}
			return element;
		 },
		
		/*
		 * stateless helper
		 */
		_hookCallback: function(domNode, context) {
			dojo.connect(domNode, "onclick", this, function() { //$NON-NLS-0$
				context.commandService._invoke(context);
			});
			// onClick events do not register for spans when using the keyboard
			dojo.connect(domNode, "onkeypress", this, function(e) { //$NON-NLS-0$
				if (e.keyCode === dojo.keys.ENTER || e.charCode === dojo.keys.SPACE) {						
					context.commandService._invoke(context);					
				}				
			});
		},
		
		/*
		 * stateless helper
		 */
		_addAccessibleLabel: function(element) {
			var label = this.name || this.tooltip;
			if (label) {
				dojo.attr(element, "aria-label", label); //$NON-NLS-0$
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
						dojo.addClass(menuitem.iconNode, choice.spriteClass || "commandSprite"); //$NON-NLS-0$
					} else if (choice.image) {
						dojo.addClass(menuitem.iconNode, "commandImage"); //$NON-NLS-0$
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
			return this.imageClass || this.image !== require.toUrl("images/none.png"); //$NON-NLS-0$
		}
	};  // end Command prototype
	Command.prototype.constructor = Command;

	var isMac = window.navigator.platform.indexOf("Mac") !== -1; //$NON-NLS-0$
	/**
	 * Temporary copy of editor key binding.  Will be removed in the next released.
	 * @param {String|Number} keyCode the key code.
	 * @param {Boolean} mod1 the primary modifier (usually Command on Mac and Control on other platforms).
	 * @param {Boolean} mod2 the secondary modifier (usually Shift).
	 * @param {Boolean} mod3 the third modifier (usually Alt).
	 * @param {Boolean} mod4 the fourth modifier (usually Control on the Mac).
	 * @param {String|DomElement} domScope the element for which this key binding is active.  If not specified, the key
	 *       binding is considered to be global.
	 * @param {String} scopeName the name of the scope to be used when listing key bindings.  Must be specified if a domScope
	 *       is specified.
	 * 
	 * @name orion.commands.CommandKeyBinding
	 * @class
	 */
	function CommandKeyBinding (keyCode, mod1, mod2, mod3, mod4, domScope, scopeName) {
		if (typeof(keyCode) === "string") { //$NON-NLS-0$
			this.keyCode = keyCode.toUpperCase().charCodeAt(0);
		} else {
			this.keyCode = keyCode;
		}
		this.mod1 = mod1 !== undefined && mod1 !== null ? mod1 : false;
		this.mod2 = mod2 !== undefined && mod2 !== null ? mod2 : false;
		this.mod3 = mod3 !== undefined && mod3 !== null ? mod3 : false;
		this.mod4 = mod4 !== undefined && mod4 !== null ? mod4 : false;
		if (typeof(domScope) === "string") { //$NON-NLS-0$
			this.domScope = dojo.byId(domScope);
			this.scopeName = scopeName || domScope;
		} else {
			this.domScope = domScope;
			this.scopeName = scopeName || domScope ? domScope.id : null;
		}
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
				// if no scope specified, a match has been found
				if (!this.domScope) {
					return true;
				}
				// check that the keybinding is in the right scope
				var node = e.target;
				while (node) {
			        if (node === window.document) {
			            return false;
			        }
			        if (node === this.domScope) {
						return true;
			        }
			        node = node.parentNode;
				}
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
			if (this.domScope !== kb.domScope) { return false; }
			return true;
		}
	};
	CommandKeyBinding.prototype.constructor = CommandKeyBinding;

	/**
	 * A URL binding defines how a URL token is bound to a command, and what parameter
	 * is provided
	 * @param {String} token the token in a URL query parameter that identifies the command
	 * @param {String} parameterName the name of the parameter being specified in the value of the query 
	 * 
	 * @name orion.commands.URLBinding
	 * @class
	 */
	function URLBinding (token, parameterName) {
		this.token = token;
		this.parameterName = parameterName;
	}
	URLBinding.prototype = /** @lends orion.commands.URLBinding.prototype */ {
		/**
		 * Returns whether this URL binding matches the given URL
		 * 
		 * @param url the URL.
		 * @returns {Boolean} whether this URL binding matches
		 */
		match: function (url) {
			//ensure this is only the hash portion
			var params = PageUtil.matchResourceParameters(url);
			if (typeof params[this.token] !== "undefined") { //$NON-NLS-0$
				this.parameterValue = params[this.token];
				return this;
			}
			return null;
		}
	};
	URLBinding.prototype.constructor = URLBinding;

	/**
	 * A CommandParameter defines a parameter that is required by a command.
	 *
	 * @param {String} name the name of the parameter
	 * @param {String} type the type of the parameter, one of the HTML5 input types, or "boolean"
	 * @param {String} [label] the (optional) label that should be used when showing the parameter
	 * @param {String} [value] the (optional) default value for the parameter
	 * @param {Number} [lines] the (optional) number of lines that should be shown when collecting the value.  Valid for type "text" only.
	 *
	 * 
	 * @name orion.commands.CommandParameter
	 * @class
	 */
	function CommandParameter (name, type, label, value, lines) {
		this.name = name;
		this.type = type;
		this.label = label;
		this.value = value;
		this.lines = lines || 1;
	}
	CommandParameter.prototype = /** @lends orion.commands.CommandParameter.prototype */ {
		/**
		 * Returns whether the user has requested to assign values to optional parameters
		 * 
		 * @returns {Boolean} whether the user has requested optional parameters
		 */
		optionsRequested: function () {
			return this.optionsRequested;
		}
	};
	CommandParameter.prototype.constructor = CommandParameter;
	
	/**
	 * A ParametersDescription defines the parameters required by a command, and whether there are additional
	 * optional parameters that can be specified.  The command service will attempt to collect required parameters
	 * before calling a command callback.  The command is expected to provide UI for optional parameter, when the user has
	 * signalled a desire to provide optional information.
	 *
	 * @param {orion.commands.CommandParameter[]} parameters an array of CommandParameters that are required
	 * @param {Object} options The parameters description options object.
	 * @param {Boolean} options.hasOptionalParameters specifies whether there are additional optional parameters
	 *			that could be collected.  If true, then the collector will show an affordance for invoking an 
	 *			additional options collector and the client can use the optionsRequested flag to determine whether
	 *			additional parameters should be shown.  Default is false.
	 * @param {Boolean} options.clientCollect specifies whether the client will collect the parameters in its
	 *			callback.  Default is false, which means the callback will not be called until an attempt has
	 *			been made to collect parameters.
	 * @param {Function} [getParameters] a function used to define the parameters just before the command is invoked.  This is used
	 *			when a particular invocation of the command will change the parameters.  Any stored parameters will be ignored, and
	 *          replaced with those returned by this function.  If no parameters (empty array or null) are returned, then it is assumed
	 *          that the command should not try to obtain parameters before invoking the command's callback.  The function will be passed
	 *          the CommandInvocation as a parameter.
	 * @name orion.commands.ParametersDescription
	 * @class
	 */
	function ParametersDescription (parameters, options, getParameters) {
		this._storeParameters(parameters);
		this._hasOptionalParameters = options && options.hasOptionalParameters;
		this._clientCollect = options && options.clientCollect;
		this._options = options;  // saved for making a copy
		this.optionsRequested = false;
		this.getParameters = getParameters;
	}
	ParametersDescription.prototype = /** @lends orion.commands.ParametersDescription.prototype */ {	
	
		_storeParameters: function(parameterArray) {
			this.parameterTable = null;
			if (parameterArray) {
				this.parameterTable = {};
				for (var i=0; i<parameterArray.length; i++) {
					this.parameterTable[parameterArray[i].name] = parameterArray[i];
				}
			}
		},
		
		/**
		 * Update the stored parameters by running the stored function if one has been supplied.
		 */
		updateParameters: function(commandInvocation) {
			if (typeof this.getParameters === "function") { //$NON-NLS-0$
				this._storeParameters(this.getParameters(commandInvocation));
			}
		},
		
		/**
		 * Returns a boolean indicating whether any parameters have been specified.
		 *
		 * @returns {Boolean} whether there are parameters to collect.
		 */
		hasParameters: function() {
			return this.parameterTable !== null;
		},
		
		/**
		 * Returns a boolean indicating whether a collector should try to collect parameters.  If there
		 * are no parameters specified, or the client is expecting to collect them, this will return
		 * <code>false</code>.
		 *
		 * @returns {Boolean} indicating whether the caller should attempt to collect the parameters.
		 */
		shouldCollectParameters: function() {
			return !this._clientCollect && this.hasParameters();
		},
				
		/**
		 * Returns the CommandParameter with the given name, or <code>null</code> if there is no parameter
		 * by that name.
		 *
		 * @param {String} name the name of the parameter
		 * @returns {orion.command.CommandParameter} the parameter with the given name
		*/
		parameterNamed: function(name) {
			return this.parameterTable[name];
		},
		
		/**
		 * Returns the value of the parameter with the given name, or <code>null</code> if there is no parameter
		 * by that name, or no value for that parameter.
		 *
		 * @param {String} name the name of the parameter
		 * @returns {String} the value of the parameter with the given name
		 */
		valueFor: function(name) {
			var parm = this.parameterTable[name];
			if (parm) {
				return parm.value;
			}
			return null;
		},
		
		/**
		 * Sets the value of the parameter with the given name.
		 *
		 * @param {String} name the name of the parameter
		 * @param {String} value the value of the parameter with the given name
		 */
		setValue: function(name, value) {
			var parm = this.parameterTable[name];
			if (parm) {
				parm.value = value;
			}
		},
		 
		/**
		 * Evaluate the specified function for each parameter.
		 *
		 * @param {Function} func a function which operates on a provided command parameter
		 *
		 */
		forEach: function(func) {
			for (var key in this.parameterTable) {
				if (this.parameterTable[key].type && this.parameterTable[key].name) {
					func(this.parameterTable[key]);
				}
			}
		},
		
		/**
		 * Make a copy of this description.  Used for collecting values when a client doesn't want
		 * the values to be persisted across different objects.
		 *
		 */
		 makeCopy: function() {
			var parameters = [];
			this.forEach(function(parm) {
				var newParm = new CommandParameter(parm.name, parm.type, parm.label, parm.value, parm.lines);
				parameters.push(newParm);
			});
			return new ParametersDescription(parameters, this._options, this.getParameters);
		 },
		 /**
		  * Return a boolean indicating whether additional optional parameters are available.
		  */
		 hasOptionalParameters: function() {
			return this._hasOptionalParameters;
		 }
	};
	ParametersDescription.prototype.constructor = ParametersDescription;
	
	//return the module exports
	return {
		CommandService: CommandService,
		CommandKeyBinding: CommandKeyBinding,
		Command: Command,
		CommandInvocation: CommandInvocation,
		CommandMenuItem: CommandMenuItem,
		URLBinding: URLBinding,
		ParametersDescription: ParametersDescription,
		CommandParameter: CommandParameter,
		CommandTooltip: CommandTooltip
	};
});
