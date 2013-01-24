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
/*jslint sub:true*/
 /*global define document window Image */
 
define(['i18n!orion/nls/messages', 'require', 'orion/uiUtils', 'orion/PageUtil', 'orion/webui/littlelib', 'orion/webui/dropdown', 'orion/webui/tooltip', 'orion/explorers/navigationUtils'], function(messages, require, UIUtil, PageUtil, lib, mDropdown, mTooltip, mNavUtils) {

	var isMac = window.navigator.platform.indexOf("Mac") !== -1; //$NON-NLS-0$

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
		 * @param {orion.commands.ParametersDescription} parameters A description of parameters to be used in the copy.  Optional.
		 * If not specified, then the existing parameters should be copied.
		 */
		makeCopy: function(parameters) {
			var copy =  new CommandInvocation(this.commandService, this.handler, this.items, this.userData, this.command);
			copy.domNode = this.domNode;
			copy.domParent = this.domParent;
			if (parameters) {
				copy.parameters = parameters.makeCopy();
			} else if (this.parameters) {
				copy.parameters = this.parameters.makeCopy();
			}
			return copy;
		}

	};
	CommandInvocation.prototype.constructor = CommandInvocation;

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
			var self = this;
			window.document.addEventListener("keydown", function (evt){ //$NON-NLS-0$
				function isContentKey(e) {
					// adapted from handleKey in http://git.eclipse.org/c/platform/eclipse.platform.swt.git/plain/bundles/org.eclipse.swt/Eclipse%20SWT%20Custom%20Widgets/common/org/eclipse/swt/custom/StyledText.java
					if (isMac) {
						// COMMAND+ALT combinations produce characters on the mac, but COMMAND or COMMAND+SHIFT do not.
						if (e.metaKey && !e.altKey) {  //command without alt
							// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=390341
							// special case for select all, cut, copy, paste, and undo.  A slippery slope...
							if (!e.shiftKey && !e.ctrlKey && (e.keyCode === 65 || e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88 || e.keyCode === 90)) {
								return true;
							}
							return false;
						}
					} else {
						// CTRL or ALT combinations are not characters, however both of them together (CTRL+ALT)
						// are the Alt Gr key on some keyboards.  See Eclipse bug 20953. If together, they might
						// be a character.
						if (e.ctrlKey && !e.altKey) {
							// special case for select all, cut, copy, paste, and undo.  
							if (!e.shiftKey && (e.keyCode === 65 || e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88 || e.keyCode === 90)) {
								return true;
							}
							return false;
						}
						if (e.altKey && !e.ctrlKey) {
							return false;
						}
					}
					if (e['char']) { //$NON-NLS-0$
						return e['char'].length > 0;  // empty string for non characters //$NON-NLS-0$
					} else if (e.charCode || e.keyCode) {
						var keyCode= e.charCode || e.keyCode;
						// anything below SPACE is not a character except for line delimiter keys, tab, and delete.
						switch (keyCode) {
							case 8:  // backspace
							case 9:  // tab
							case 13: // enter
							case 46: // delete
								return true;
							default:
								return (keyCode >= 32 && keyCode < 112) || // space key and above until function keys
									keyCode > 123; // above function keys  
						}
					}
					// If we can't identify as a character, assume it's not
					return false;
				}
				
				evt = evt || window.event;
				if (isContentKey(evt)) {
					// bindings that are text content keys are ignored if we are in a text field or editor
					// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=375058
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
				}
				self._processKey(evt);
			}, false);
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
								var self = this;
								window.setTimeout(function() {	
									self._invoke(invocation);
								}, 0);
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
							var self = this;
							window.setTimeout(function() {
								self._invoke(invocation);
							}, 0);
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
		 * @param {orion.commands.ParametersDescription} parameters used on this invocation.  Optional.
		 *
		 * Note:  The current implementation will only run the command if a URL binding has been
		 * specified, or if an item to run the command against has been specified.  
		 */
		runCommand: function(commandId, item, handler, parameters) {
			var self = this;
			if (item) {
				var command = this._commandList[commandId];
				var enabled = command && (command.visibleWhen ? command.visibleWhen(item) : true);
				if (enabled && command.callback) {
					self._invoke(new CommandInvocation(self, handler, item, null, command), parameters);
				}
			} else {
				//TODO should we be keeping invocation context for commands without bindings? 
				var binding = this._urlBindings[commandId];
				if (binding && binding.command) {
					if (binding.command.callback) {
						self._invoke(binding.invocation, parameters);
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
		 * when the user invokes a command. If parameters are specified, then these parameters should be used
		 * in lieu of the invocation's parameters.
		 *
		 */
		_invoke: function(commandInvocation, parameters) {
			return this._collectAndInvoke(commandInvocation.makeCopy(parameters), false);
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
				
					// The parameter collector cannot collect.  We will do a default implementation using a popup.
					if (!collecting) {
						var tooltip = new mTooltip.Tooltip({
							node: commandInvocation.domNode,
							trigger: "click", //$NON-NLS-0$
							position: ["below", "right", "above", "left"] //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						});
						var parameterArea = tooltip.contentContainer();
						parameterArea.classList.add("parameterPopup"); //$NON-NLS-0$
						var originalFocusNode = window.document.activeElement;
						var focusNode = this._parameterCollector.getFillFunction(commandInvocation, function() {
							if (originalFocusNode) {
								originalFocusNode.focus();
							}
							tooltip.destroy();
						})(parameterArea);
						tooltip.show();
						window.setTimeout(function() {
							focusNode.focus();
							focusNode.select();
						}, 0);
						collecting = true;
					}
					if (!collecting) {
						// Just call the callback with the information we had.
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
			var bindingString, binding, span;
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
						bindingString = UIUtil.getUserKeyString(binding.keyBinding);
						span = document.createElement("span"); //$NON-NLS-0$
						span.role = "listitem"; //$NON-NLS-0$
						span.appendChild(document.createTextNode(bindingString+ " = " + binding.command.name)); //$NON-NLS-0$
						span.appendChild(document.createElement("br")); //$NON-NLS-0$
						targetNode.appendChild(span);
					}
				}
			}
			for (var scopedBinding in scopes) {
				if (scopes[scopedBinding].length && scopes[scopedBinding].length > 0) {
					var heading = document.createElement("h2"); //$NON-NLS-0$
					targetNode.appendChild(heading);
					heading.appendChild(document.createTextNode(scopedBinding));
					for (var i=0; i<scopes[scopedBinding].length; i++) {
						binding = scopes[scopedBinding][i];
						bindingString = UIUtil.getUserKeyString(binding.keyBinding);
						span = document.createElement("span"); //$NON-NLS-0$
						span.role = "listitem"; //$NON-NLS-0$
						span.appendChild(document.createTextNode(bindingString+ " = " + binding.command.name)); //$NON-NLS-0$
						span.appendChild(document.createElement("br")); //$NON-NLS-0$
						targetNode.appendChild(span);
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
		 * @param {String} [title] The title of the group, optional
		 * @param {String} [parentPath] The path of parent groups, separated by '/'.  For example,
		 *  a path of "group1Id/group2Id" indicates that the group belongs as a child of 
		 *  group2Id, which is itself a child of group1Id.  Optional.
		 * @param {String} [emptyGroupMessage] A message to show if the group is empty and the user activates the UI element
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
		 * @param {String} [parentPath=null] the path of any parent groups, separated by '/'.  For example,
		 *  a path of "group1Id/group2Id/command" indicates that the command belongs as a child of 
		 *  group2Id, which is itself a child of group1Id.  Optional.
		 * @param {boolean} [bindingOnly=false] if true, then the command is never rendered, but the key or URL binding is hooked.
		 * @param {orion.commands.CommandKeyBinding} [keyBinding] a keyBinding for the command.  Optional.
		 * @param {orion.commands.URLBinding} [urlBinding] a url binding for the command.  Optional.
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
		
		_checkForTrailingSeparator: function(parent, style, autoRemove) {
			var last;
			if (style === "tool" || style === "button") { //$NON-NLS-1$ //$NON-NLS-0$
				last = parent.childNodes.length > 0 ? parent.childNodes[parent.childNodes.length-1] : null;
				if (last && last.classList.contains("commandSeparator")) { //$NON-NLS-0$
					if (autoRemove) {
						parent.removeChild(last);
						return false;
					} 
					return true;
				}
			}
			if (style === "menu") { //$NON-NLS-0$
				var items = lib.$$array("li > *", parent); //$NON-NLS-0$
				if (items.length > 0 && items[items.length - 1].classList.contains("dropdownSeparator")) { //$NON-NLS-0$
					last = items[items.length - 1];
					if (autoRemove) {
						// reachy reachy.  Remove the anchor's li parent
						last.parentNode.parentNode.removeChild(last.parentNode);
						return false;
					} else {
						return true;
					}
				}
			}
			return false;
		},

		/**
		 * Render the commands that are appropriate for the given scope.
		 * @param {String} scopeId The id describing the scope for which we are rendering commands.  Required.
		 *  Only contributions made to this scope will be rendered.
		 * @param {DOMElement} parent The element in which commands should be rendered.  If commands have been
		 *  previously rendered into this element, it is up to the caller to empty any previously generated content.
		 * @param {Object} [items] An item or array of items to which the command applies.  Optional.  If not
		 *  items are specified and a selection service was specified at creation time, then the selection
		 *  service will be used to determine which items are involved. 
		 * @param {Object} handler The object that should perform the command
		 * @param {String} renderType The style in which the command should be rendered.  "tool" will render
		 *  a tool image in the dom.  "button" will render a text button.  "menu" will render menu items.  
		 * @param {Object} [userData] Optional user data that should be attached to generated command callbacks
		 * @param {Array} [domNodeWrapperList] Optional an array used to record any DOM nodes that are rendered during this call.
		 *  If an array is provided, then as commands are rendered, an object will be created to represent the command's node.  
		 *  The object will always have the property "domNode" which contains the node created for the command.  If the command is
		 *  rendered using other means (toolkit widget) then the optional property "widget" should contain the toolkit
		 *  object that represents the specified dom node.
		 */	
		renderCommands: function(scopeId, parent, items, handler, renderType, userData, domNodeWrapperList) {
			if (typeof(scopeId) !== "string") { //$NON-NLS-0$
				throw "a scope id for rendering must be specified"; //$NON-NLS-0$
			}
			parent = lib.node(parent);
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
				this._render(this._contributionsByScopeId[scopeId], parent, items, handler, renderType || "button", userData, domNodeWrapperList); //$NON-NLS-0$
				// If the last thing we rendered was a group, it's possible there is an unnecessary trailing separator.
				this._checkForTrailingSeparator(parent, renderType, true);
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
			parent = lib.node(parent);
			if (!parent) { 
				throw "no parent";  //$NON-NLS-0$
			}
			while (parent.hasChildNodes()) {
				var node = parent.firstChild;
				if (node.commandTooltip) {
					node.commandTooltip.destroy();
				}
				if (node.emptyGroupTooltip) {
					node.emptyGroupTooltip.destroy();
				}
				this.destroy(node);
				parent.removeChild(node);
			}
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
				var id, invocation;
				if (sortedByPosition[i].children && Object.getOwnPropertyNames(sortedByPosition[i].children).length > 0) {
					var group = sortedByPosition[i];
					var childContributions = sortedByPosition[i].children;
					var commandService = this;
					var created;
					if (renderType === "tool" || renderType === "button") { //$NON-NLS-1$ //$NON-NLS-0$
						if (group.title) {
							// We need a named menu button.  We used to first render into the menu and only 
							// add a menu button in the dom when we knew items were actually rendered.
							// For performance, though, we need to be asynchronous in traversing children, so we will 
							// add the menu button always and then remove it if we don't need it.  
							// If we wait until the end of asynch processing to add the menu button, the layout will have 
							// to be redone. The down side to always adding the menu button is that we may find out we didn't
							// need it after all, which could cause layout to change.
							created = this._createDropdownMenu(parent, group.title); 
							if(domNodeWrapperList){
								mNavUtils.generateNavGrid(domNodeWrapperList, created.menuButton);
							}

							// render the children asynchronously
							var context = {contributions: childContributions, group: group, parent: parent};
							window.setTimeout(function() {
								commandService._render(context.contributions, created.menu, items, handler, "menu", userData, domNodeWrapperList);  //$NON-NLS-0$
								// special post-processing when we've created a menu in an image bar.  We want to get rid 
								// of a trailing separator in the menu first, and then decide if our menu is necessary
								commandService._checkForTrailingSeparator(created.menu, "menu", true);  //$NON-NLS-0$
								// now determine if we actually needed the menu or not
								if (created.menu.childNodes.length === 0) {
									if (context.group.emptyGroupMessage) {
										if (!created.menuButton.emptyGroupTooltip) {
											created.menuButton.emptyGroupTooltip = new mTooltip.Tooltip({
												node: created.menuButton,
												text: context.group.emptyGroupMessage,
												trigger: "click", //$NON-NLS-0$
												position: ["below", "right", "above", "left"] //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
											});
										}
									} else {
										if(domNodeWrapperList){
											mNavUtils.removeNavGrid(domNodeWrapperList, created.menuButton);
										}
										if (created.menu.parentNode) {
											created.menu.parentNode.removeChild(created.menu);
										}
										if (created.destroyButton && created.destroyButton.parentNode) {
											created.destroyButton.parentNode.removeChild(created.destroyButton);
										}
									}
								} else {
									created.menuButton.style.visibility = "visible";  //$NON-NLS-0$
								}
							}, 0);
						} else {  
							// rendering a group using a separator on each end. We do it synchronously because order matters with
							// non grouped items.
							var sep;
							// Only draw a separator if there is a non-separator preceding it.
							if (parent.childNodes.length > 0 && !this._checkForTrailingSeparator(parent, renderType)) {
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
							var trigger = document.createElement("li"); //$NON-NLS-0$
							parent.appendChild(trigger);
							var subMenu = this._createDropdownMenu(trigger, group.title, true);
							commandService._render(childContributions, subMenu.menu, items, handler, "menu", userData, domNodeWrapperList);  //$NON-NLS-0$
							if (subMenu.menu.childNodes.length === 0) {
								parent.removeChild(trigger);
							}
						} else {  
							// menu items with leading and trailing separators
							// don't render a separator if there is nothing preceding
							if (parent.childNodes.length > 0) {
								this._generateMenuSeparator(parent);
							}
							// synchronously render the children since order matters
							commandService._render(childContributions, parent, items, handler, renderType, userData, domNodeWrapperList); 
							// Add a trailing separator if children rendered.
							this._generateMenuSeparator(parent);
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
							var menuParent;
							var nodeClass;
							var nested;
							if (renderType === "tool" || renderType === "button") { //$NON-NLS-1$ //$NON-NLS-0$
								menuParent = parent;
								nested = false;
								if (parent.nodeName.toLowerCase() === "ul") { //$NON-NLS-0$
									menuParent = document.createElement("li"); //$NON-NLS-0$
									parent.appendChild(menuParent);
								} else {
									nodeClass = "commandMargins"; //$NON-NLS-0$
								}
							} else {
								menuParent = parent;
								nested = true;
							}
							// dropdown button
							var self = this;
							var populateFunction = function(menu) {
								this.populateChoicesMenu(menu, items, handler, userData, self);
							};
							this._createDropdownMenu(menuParent, command.name, nested, populateFunction.bind(command));
						} else {
							if (renderType === "tool") { //$NON-NLS-0$
								id = "tool" + command.id + i;  //$NON-NLS-0$ // using the index ensures unique ids within the DOM when a command repeats for each item
								command._addTool(parent, id, invocation, domNodeWrapperList);	
							} else if (renderType === "button") { //$NON-NLS-0$
								id = "button" + command.id + i;  //$NON-NLS-0$ // using the index ensures unique ids within the DOM when a command repeats for each item 
								command._addButton(parent, id, invocation, domNodeWrapperList);	
							} else if (renderType === "menu") { //$NON-NLS-0$
								command._addMenuItem(parent, invocation, domNodeWrapperList);
							}
						}
					} 
				}
			}
		},
		
		_createDropdownMenu: function(parent, name, nested, populateFunction) {
			parent = lib.node(parent);
			var destroyButton, arrowClass, extraClass;
			var menuButton = document.createElement("span"); //$NON-NLS-0$
			menuButton.classList.add("dropdownTrigger"); //$NON-NLS-0$
			if (nested) {
				menuButton.classList.add("dropdownMenuItem"); //$NON-NLS-0$
				extraClass = "dropdownSubMenu"; //$NON-NLS-0$
				arrowClass = "dropdownArrowRight"; //$NON-NLS-0$
				menuButton.tabIndex = 0;
				menuButton.role = "menuitem"; //$NON-NLS-0$
			} else {
				menuButton.classList.add("commandButton"); //$NON-NLS-0$
				arrowClass = "dropdownArrowDown"; //$NON-NLS-0$
				menuButton.tabIndex = 0; 
				menuButton.role = "button"; //$NON-NLS-0$
			}
			var title = document.createTextNode(name);
			menuButton.appendChild(title);
			var arrow = document.createElement("span"); //$NON-NLS-0$
			arrow.classList.add(arrowClass); //$NON-NLS-0$
			menuButton.appendChild(arrow);
			var menuParent = parent;
			if (parent.nodeName.toLowerCase() === "ul") { //$NON-NLS-0$
				menuParent = document.createElement("li"); //$NON-NLS-0$
				parent.appendChild(menuParent);
				destroyButton = menuParent;
			} else {
				menuButton.classList.add("commandMargins"); //$NON-NLS-0$
				destroyButton = menuButton;
			}
			menuParent.appendChild(menuButton);
			if (extraClass) {
				menuParent.classList.add(extraClass);
			}
			var newMenu = document.createElement("ul"); //$NON-NLS-0$
			menuParent.appendChild(newMenu);
			newMenu.classList.add("dropdownMenu"); //$NON-NLS-0$
			menuButton.dropdown = new mDropdown.Dropdown({dropdown: newMenu, populate: populateFunction});
			newMenu.dropdown = menuButton.dropdown;
			return {menuButton: menuButton, menu: newMenu, dropdown: menuButton.dropdown, destroyButton: destroyButton};
		},
		
		_generateCheckedMenuItem: function(dropdown, name, checked, onChange) {
			var itemNode = document.createElement("li"); //$NON-NLS-0$
			dropdown.appendChild(itemNode);
			var label = document.createElement("label"); //$NON-NLS-0$
			label.classList.add("dropdownMenuItem"); //$NON-NLS-0$
			var node = document.createElement("input"); //$NON-NLS-0$
			node.type = "checkbox";//$NON-NLS-0$
			node.role = "menuitem"; //$NON-NLS-0$
			node.checked = checked;
			node.classList.add("checkedMenuItem"); //$NON-NLS-0$
			label.appendChild(node);
			var text = document.createTextNode(name); //$NON-NLS-0$
			label.appendChild(text);
			itemNode.appendChild(label);
			node.addEventListener("change", onChange, false); //$NON-NLS-0$
		},
		
		_generateMenuSeparator: function(dropdown) {
			if (!this._checkForTrailingSeparator(dropdown, "menu")) { //$NON-NLS-0$
				var item = document.createElement("li"); //$NON-NLS-0$
				item.classList.add("dropdownSeparator"); //$NON-NLS-0$
				var sep = document.createElement("span"); //$NON-NLS-0$
				sep.classList.add("dropdownSeparator"); //$NON-NLS-0$
				item.appendChild(sep);
				dropdown.appendChild(item);
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
				sep = document.createElement("li"); //$NON-NLS-0$
				parent.appendChild(sep);
			} else {
				sep = document.createElement("span"); //$NON-NLS-0$
				parent.appendChild(sep);
			}
			sep.classList.add("core-sprite-sep");  // location in sprite //$NON-NLS-0$
			sep.classList.add("imageSprite");  // sets sprite background //$NON-NLS-0$
			sep.classList.add("commandSeparator"); //$NON-NLS-0$
			return sep;
		}

	};  // end command service prototype
	CommandService.prototype.constructor = CommandService;
	
	function addImageToElement(command, element, name) {
		element.classList.add("commandImage"); //$NON-NLS-0$
		var node;
		if (command.imageClass) {
			node = document.createElement("span"); //$NON-NLS-0$
			element.appendChild(node);
			node.classList.add(command.spriteClass);
			node.classList.add(command.imageClass);
		} else {
			node = new Image();
			node.alt = command.name;
			node.name = name;
			node.id = name;
			node.src = command.image;	
			element.appendChild(node);
		}
		return node;
	}

	/**
	 * Constructs a new command with the given options.
	 * @param {Object} options The command options object.
	 * @param {String} options.id the unique id to be used when referring to the command in the command service.
	 * @param {String} options.name the name to be used when showing the command as text.
	 * @param {String} options.tooltip the tooltip description to use when explaining the purpose of the command.
	 * @param {Function} [options.callback] the callback to call when the command is activated.  The callback should either 
	 *  perform the command or return a deferred that represents the asynchronous performance of the command.  Optional.
	 * @param {Function} [options.hrefcallback] if specified, this callback is used to retrieve
	 *  a URL that can be used as the location for a command represented as a hyperlink.  The callback should return 
	 *  the URL.  In this release, the callback may also return a deferred that will eventually return the URL, but this 
	 *  functionality may not be supported in the future.  See https://bugs.eclipse.org/bugs/show_bug.cgi?id=341540.
	 *  Optional.
	 * @param {Function} [options.choicecallback] a callback which retrieves choices that should be shown in a secondary
	 *  menu from the command itself.  Returns a list of choices that supply the name and image to show, and the callback
	 *  to call when the choice is made.  Optional.
	 * @param {String} [options.imageClass] a CSS class name suitable for showing a background image.  Optional.
	 * @param {String} [options.spriteClass] an additional CSS class name that can be used to specify a sprite background image.  This
	 *  useful with some sprite generation tools, where imageClass specifies the location in a sprite, and spriteClass describes the
	 *  sprite itself.  Optional.
	 * @param {Function} [options.visibleWhen] A callback that returns a boolean to indicate whether the command should be visible
	 *  given a particular set of items that are selected.  Optional, defaults to always visible.
	 * @param {orion.commands.ParametersDescription} [options.parameters] A description of parameters that should be collected before invoking
	 *  the command.
	 * @param {Image} [options.image] the image that may be used to represent the callback.  A text link will be shown in lieu
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
				element = this._makeLink(parent, context, "commandLink"); //$NON-NLS-0$
				if (!element) {
					return;
				}
			} else {
				element = document.createElement("span"); //$NON-NLS-0$
				element.tabIndex = domNodeWrapperList ? -1 : 0;
				element.role = "button";  //$NON-NLS-0$ 
				if (!this.hasImage()) {
					var text = window.document.createTextNode(this.name);
					element.appendChild(text);
					element.classList.add("commandMissingImageButton"); //$NON-NLS-0$
					element.classList.add("commandButton"); //$NON-NLS-0$
				} else {
					image = addImageToElement(this, element, name);
					// ensure there is accessible text describing this image
					if (this.name) {
						element.setAttribute("aria-label", this.name); //$NON-NLS-0$
					}
				}
				this._hookCallback(element, context);
			}
			context.domNode = element;
			context.domParent = parent;
			if (this.tooltip) {
				element.commandTooltip = new mTooltip.Tooltip({
					node: element,
					text: this.tooltip,
					position: ["above", "below", "right", "left"] //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				});
			}
			if (parent.nodeName.toLowerCase() === "ul") { //$NON-NLS-0$
				var li = document.createElement("li"); //$NON-NLS-0$
				parent.appendChild(li);
				parent = li;
			} else {
				element.classList.add("commandMargins"); //$NON-NLS-0$
			}
			parent.appendChild(element);
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
				element = this._makeLink(parent, context, "commandLink"); //$NON-NLS-0$
			} else if (!this.name && this.hasImage()) {
				// rare case but can happen for some icons we force with text
				element = document.createElement("span"); //$NON-NLS-0$
				element.tabIndex = 0;
				element.role = "button"; //$NON-NLS-0$ 
				addImageToElement(this, element, name);
				// ensure there is accessible text describing this image if we have any
				if (this.tooltip) {
					element.setAttribute("aria-label", this.tooltip); //$NON-NLS-0$
				}
				this._hookCallback(element, context);
				if (this.tooltip) {
					element.commandTooltip = new mTooltip.Tooltip({
						node: element,
						text: this.tooltip,
						position: ["above", "below", "right", "left"] //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					});
				}
			} else {
				element = this._makeButton(parent, context, "commandButton"); //$NON-NLS-0$
				this._hookCallback(element, context);
			}
			context.domParent = parent;
			if (parent.nodeName.toLowerCase() === "ul") { //$NON-NLS-0$
				var li = document.createElement("li"); //$NON-NLS-0$
				parent.appendChild(li);
				parent = li;
			} else {
				element.classList.add("commandMargins"); //$NON-NLS-0$
			}
			parent.appendChild(element);
			mNavUtils.generateNavGrid(domNodeWrapperList, context.domNode);
		},
		
		_addMenuItem: function(parent, context, domNodeWrapperList) {
			context.domParent = parent;
			var element;
			var dropdown = parent.dropdown;
			if (this.hrefCallback) {
				element = this._makeLink(parent, context, "dropdownMenuItem", ["right", "left", "above", "below"]); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			} else {
				element = this._makeButton(parent, context, "dropdownMenuItem", ["right", "left", "above", "below"]); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				if (this.callback) {
					this._hookCallback(element, context, function() {dropdown.close(true);});
				}
			}
			element.role = "menuitem";  //$NON-NLS-0$
			
			mNavUtils.generateNavGrid(domNodeWrapperList, context.domNode);
			if (parent.nodeName.toLowerCase() === "ul") { //$NON-NLS-0$
				var li = document.createElement("li"); //$NON-NLS-0$
				parent.appendChild(li);
				parent = li;
			} else {
				element.classList.add("commandMargins"); //$NON-NLS-0$
			}
			parent.appendChild(element); //$NON-NLS-0$

		},
		
		/*
		 * stateless helper
		 */
		_makeButton: function(parent, context, aClass, position) {
			var element = document.createElement("span"); //$NON-NLS-0$
			element.role = "button"; //$NON-NLS-0$
			element.tabIndex = 0; 
			element.id = this.name;
			var text = document.createTextNode(this.name);
			element.appendChild(text);
			if (aClass) {
				element.classList.add(aClass); //$NON-NLS-0$
			}
			if (this.tooltip) {
				element.commandTooltip = new mTooltip.Tooltip({
					node: element,
					text: this.tooltip,
					position: position || ["above", "below", "right", "left"] //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				});
			}
			context.domNode = element;
			return element;
		 },
		
		/*
		 * stateless helper
		 */
		 _makeLink: function(parent, context, aClass, position) {
			var element = document.createElement("a"); //$NON-NLS-0$
			element.id = this.name;
			if (aClass) {
				element.classList.add(aClass); //$NON-NLS-0$
			}
			element.appendChild(document.createTextNode(this.name));
			if (this.hrefCallback) {
				var href = this.hrefCallback.call(context.handler, context);
				if (href.then){
					href.then(function(l){
						element.href = l;
					});
				} else if (href) {
					element.href = href; 
				} else {  // no href
					element.href = "#"; //$NON-NLS-0$
				}
			}
			if (this.tooltip) {
				element.commandTooltip = new mTooltip.Tooltip({
					node: element,
					text: this.tooltip,
					position: position || ["above", "below", "right", "left"] //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				});
			}
			context.domNode = element;
			return element;
		 },
		
		/*
		 * stateless helper
		 */
		_hookCallback: function(domNode, context, before, after) {
			domNode.addEventListener("click", function(e) { //$NON-NLS-0$
				if (before) { before(); }
				context.commandService._invoke(context);
				if (after) { after(); }
				lib.stop(e);
			}, false);
			domNode.addEventListener("keydown", function(e) { //$NON-NLS-0$
				if (e.keyCode === lib.KEY.ENTER || e.keyCode === lib.KEY.SPACE) {						
					if (before) { before(); }
					context.commandService._invoke(context);					
					if (after) { after(); }
					lib.stop(e);
				}				
			}, false);
		},
		
		/**
		 * Populate the specified menu with choices using the choiceCallback.
		 * Used internally by the command service.  Not intended to be overridden or called
		 * externally.
		 */
		 populateChoicesMenu: function(parent, items, handler, userData, commandService) {
			var choices = this.getChoices(items, handler, userData);
			for (var j=0; j<choices.length; j++) {
				var choice = choices[j];
				if (choice.name) {
					var itemNode = document.createElement("li"); //$NON-NLS-0$
					parent.appendChild(itemNode);
					var node = document.createElement("span"); //$NON-NLS-0$
					node.tabIndex = 0; 
					node.role = "menuitem"; //$NON-NLS-0$
					node.classList.add("dropdownMenuItem"); //$NON-NLS-0$
					var text = document.createTextNode(choice.name); //$NON-NLS-0$
					node.appendChild(text);
					itemNode.appendChild(node);
					node.choice = choice;
					node.addEventListener("click", function(event) { //$NON-NLS-0$
						if (event.target.choice) {
							event.target.choice.callback.call(event.target.choice, items);
						}
					}, false); 
					node.addEventListener("keydown", function(event) { //$NON-NLS-0$
						if (event.keyCode === lib.KEY.ENTER || event.keyCode === lib.KEY.SPACE) {
							if (event.target.choice) {
								event.target.choice.callback.call(event.target.choice, items);
							}
						}
					}, false);
				} else {  // anything not named is a separator
					commandService._generateMenuSeparator(parent);
				}
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
		this.domScope = lib.node(domScope);
		this.scopeName = scopeName || (domScope ? domScope.id : null);
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
		this._options = options;  // saved for making a copy
		this.optionsRequested = false;
		this.getParameters = getParameters;
		this.clientCollect = options && options.clientCollect;

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
			return !this.clientCollect && this.hasParameters();
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
			var copy = new ParametersDescription(parameters, this._options, this.getParameters);
			// this value may have changed since the options
			copy.clientCollect = this.clientCollect;
			return copy;
			
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
		URLBinding: URLBinding,
		ParametersDescription: ParametersDescription,
		CommandParameter: CommandParameter
	};
});
