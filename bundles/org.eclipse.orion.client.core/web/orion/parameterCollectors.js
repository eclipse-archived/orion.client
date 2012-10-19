/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window document define login logout localStorage orion */
/*browser:true*/

define(['i18n!orion/nls/messages', 'require', 'dojo', 'dijit', 'dijit/Menu', 'dijit/MenuItem', 'dijit/form/DropDownButton'], 
        function(messages, require, dojo, dijit) {

	
	/**
	 * Constructs a new command parameter collector
	 * @class CommandParameterCollector can collect parameters in a way that is integrated with the 
	 * common header elements of pages or sections.
	 * @name orion.parameterCollectors.CommandParameterCollector
	 * @param toolbarLayout  
	 */	
	function CommandParameterCollector (getElementsFunction, toolbarLayoutFunction) {
		this._activeContainer = null;
		this._getElementsFunction = getElementsFunction;
		this._toolbarLayoutFunction = toolbarLayoutFunction;
	}
	
	CommandParameterCollector.prototype =  {
	
		/**
		 * Closes any active parameter collectors
		 */
		close: function () {
			if (this._activeElements) {
				if (this._activeElements.parameterArea) {
					dojo.empty(this._activeElements.parameterArea);
				}
				if (this._activeElements.slideContainer) {
					dojo.removeClass(this._activeElements.slideContainer, "slideContainerActive"); //$NON-NLS-0$
				}
				if (this._activeElements.dismissArea) {
					 dojo.empty(this._activeElements.dismissArea);
				}
				if (this._activeElements.commandNode) {
					dojo.removeClass(this._activeElements.commandNode, "activeCommand"); //$NON-NLS-0$
				}
				this._toolbarLayoutFunction(this._activeElements);
				if (this._activeElements.onClose) {
					this._activeElements.onClose();
				}
				if (this._oldFocusNode) {
					this._oldFocusNode.focus();
					this._oldFocusNode = null;
				}
			}
			this._activeElements = null;
		},
		
		
		/**
		 * Open a parameter collector and return the dom node where parameter 
		 * information should be inserted
		 *
		 * @param {String|DOMElement} commandNode the node containing the triggering command
		 * @param {Function} fillFunction a function that will fill the parameter area
		 * @param {Function} onClose a function that will be called when the parameter area is closed
		 */
		open: function(commandNode, fillFunction, onClose) {
			if (typeof commandNode === "string") { //$NON-NLS-0$
				commandNode = dojo.byId(commandNode);
			}
			if (this._activeElements && this._activeElements.commandNode === commandNode) {
				// already open.  Just return focus where it needs to be.
				if (this._activeElements.focusNode) {
					this._activeElements.focusNode.focus();
				}
				return true;
			}
			this.close();
			this._activeElements = null;
			// determine the closest parameter container to the command.
			this._activeElements = this._getElementsFunction(commandNode);
			if (this._activeElements && this._activeElements.parameterArea && this._activeElements.slideContainer) {
				this._activeElements.onClose = onClose;
				var focusNode = fillFunction(this._activeElements.parameterArea, this._activeElements.dismissArea);
				if (!focusNode) {
					// no parameters were generated.  
					return false;
				}
				this._activeElements.focusNode = focusNode;
				var close = dojo.query("#closebox", this._activeElements.dismissArea || this._activeElements.parameterArea); //$NON-NLS-0$
				if (close.length === 0) {
					// add the close button if the fill function did not.
					var dismiss = this._activeElements.dismissArea || this._activeElements.parameterArea;
					close = dojo.create("span", {id: "closebox", role: "button", tabindex: "0"}, dismiss, "last"); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					dojo.addClass(close, "imageSprite"); //$NON-NLS-0$
					dojo.addClass(close, "core-sprite-close"); //$NON-NLS-0$
					dojo.addClass(close, "dismiss"); //$NON-NLS-0$
					close.title = messages['Close'];
					dojo.connect(close, "onclick", dojo.hitch(this, function(event) { //$NON-NLS-0$
						this.close();
					}));
					// onClick events do not register for spans when using the keyboard without a screen reader
					dojo.connect(close, "onkeypress", dojo.hitch(this, function (e) { //$NON-NLS-0$
						if(e.keyCode === dojo.keys.ENTER || e.charCode === dojo.keys.SPACE) {
							this.close();
						}
					}));
				}
				// all parameters have been generated.  Activate the area.
				dojo.addClass(this._activeElements.slideContainer, "slideContainerActive"); //$NON-NLS-0$
				this._toolbarLayoutFunction(this._activeElements);

				if (focusNode) {
					this._oldFocusNode = window.document.activeElement;
					window.setTimeout(function() {
						focusNode.focus();
						focusNode.select();
					}, 0);
				}
				if (this._activeElements.commandNode) {
					dojo.addClass(this._activeElements.commandNode, "activeCommand"); //$NON-NLS-0$
				}
				return true;
			}
			return false;
		},
		
		_collectAndCall: function(commandInvocation, parent) {
			dojo.query("input", parent).forEach(function(field) { //$NON-NLS-0$
				if (field.type === "checkbox") { //$NON-NLS-0$
					commandInvocation.parameters.setValue(field.parameterName, field.checked);
				} else if (field.type !== "button") { //$NON-NLS-0$
					commandInvocation.parameters.setValue(field.parameterName, field.value.trim());
				}
			});
			dojo.query("textArea", parent).forEach(function(field) { //$NON-NLS-0$
				commandInvocation.parameters.setValue(field.parameterName, field.value.trim());
			});
			if (commandInvocation.command.callback) {
				commandInvocation.command.callback.call(commandInvocation.handler, commandInvocation);
			}

		},
		
		/**
		 * Collect parameters for the given command.
		 * 
		 * @param {orion.commands.CommandInvocation} the command invocation
		 * @returns {Boolean} whether or not required parameters were collected.
		 */
		collectParameters: function(commandInvocation) {
			if (commandInvocation.parameters) {
				if (commandInvocation.domNode) {
					dojo.addClass(commandInvocation.domNode, "commandMarker"); //$NON-NLS-0$
				}
				return this.open(commandInvocation.domNode || commandInvocation.domParent, this.getFillFunction(commandInvocation));
			}
			return false;
		},
		
		/**
		 * Returns a function that can be used to fill a specified parent node with parameter information.
		 *
		 * @param {orion.commands.CommandInvocation} the command invocation used when gathering parameters
		 * @param {Function} an optional function called when the area must be closed. 
		 * @returns {Function} a function that can fill the specified dom node with parameter collection behavior
		 */
		 getFillFunction: function(commandInvocation, closeFunction) {
			return dojo.hitch(this, function(parameterArea, dismissArea) {
				var first = null;
				var localClose = dojo.hitch(this, function() {
					if (closeFunction) {
						closeFunction();
					} 
					this.close();
				});
				var keyHandler = dojo.hitch(this, function(event) {
					if (event.keyCode === dojo.keys.ENTER) {
						this._collectAndCall(commandInvocation, parameterArea);
					}
					if (event.keyCode === dojo.keys.ESCAPE || event.keyCode === dojo.keys.ENTER) {
						localClose();
						dojo.stopEvent(event);
					}
				});
				commandInvocation.parameters.forEach(function(parm) {
					if (parm.label) {
						var label = dojo.create("label", {"class": "parameterInput", "for": parm.name + "parameterCollector"}, parameterArea, "last"); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						label.textContent = parm.label;
					} 
					var options = {type: parm.type, id: parm.name + "parameterCollector"}; //$NON-NLS-0$
					var field;
					if (parm.type === "text" && typeof(parm.lines) === "number" && parm.lines > 1) { //$NON-NLS-1$ //$NON-NLS-0$
						options.rows = parm.lines;
						options.type = "textarea"; //$NON-NLS-0$
						field = dojo.create("textarea", options, parameterArea, "last"); //$NON-NLS-1$ //$NON-NLS-0$
						// esc only
						keyHandler = dojo.hitch(this, function(event) {
							if (event.keyCode === dojo.keys.ESCAPE) {
								localClose();
								dojo.stopEvent(event);
							}
						});
					} else if (parm.type === "boolean") { //$NON-NLS-0$
						options.type = "checkbox"; //$NON-NLS-0$
						if (parm.value) {
							options.checked = true;
						}
					} else {
						if (parm.value) {
							options.value = parm.value;
						}
					}
					if (!field) {
						field = dojo.create("input", options, parameterArea, "last"); //$NON-NLS-1$ //$NON-NLS-0$
					}
					// we define special classes for some parameter types
					dojo.addClass(field, "parameterInput parameterInput"+options.type); //$NON-NLS-0$
					// for fun
					field.setAttribute("speech", "speech"); //$NON-NLS-1$ //$NON-NLS-0$
					field.setAttribute("x-webkit-speech", "x-webkit-speech"); //$NON-NLS-1$ //$NON-NLS-0$
					field.parameterName = parm.name;
					if (!first) {
						first = field;
					}
					dojo.connect(field, "onkeypress", keyHandler); //$NON-NLS-0$
				});
				var parentDismiss = dismissArea || parameterArea;
				var finish = function (collector) {
					collector._collectAndCall(commandInvocation, parameterArea);
					localClose();
				};

				if (commandInvocation.parameters.hasOptionalParameters()) {
					commandInvocation.parameters.optionsRequested = false;
					
					var options = dojo.create("span", {role: "button", tabindex: "0"}, parentDismiss, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					dojo.place(window.document.createTextNode(messages["More"]), options, "last"); //$NON-NLS-1$ //$NON-NLS-0$
					dojo.addClass(options, "dismiss"); //$NON-NLS-0$
					dojo.connect(options, "onclick", dojo.hitch(this, function() { //$NON-NLS-0$
						commandInvocation.parameters.optionsRequested = true;
						finish(this);
					}));
					// onClick events do not register for spans when using the keyboard without a screen reader
					dojo.connect(options, "onkeypress", dojo.hitch(this, function (e) { //$NON-NLS-0$
						if(e.keyCode === dojo.keys.ENTER  || e.charCode === dojo.keys.SPACE) {			
							commandInvocation.parameters.optionsRequested = true;
							finish(this);
						}
					}));
				}
				// OK and cancel buttons
				var ok = dojo.create("span", {role: "button", tabindex: "0"}, parentDismiss, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.place(window.document.createTextNode(messages["Submit"]), ok, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				dojo.addClass(ok, "dismiss"); //$NON-NLS-0$
				dojo.connect(ok, "onclick", dojo.hitch(this, function() { //$NON-NLS-0$
					finish(this);
				}));
				// onClick events do not register for spans when using the keyboard without a screen reader
				dojo.connect(ok, "onkeypress", dojo.hitch(this, function (e) { //$NON-NLS-0$
					if(e.keyCode === dojo.keys.ENTER  || e.charCode === dojo.keys.SPACE) {
						finish(this);
					}
				}));
				
				var close = dojo.create("span", {id: "closebox", role: "button", tabindex: "0"}, parentDismiss, "last"); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.addClass(close, "imageSprite"); //$NON-NLS-0$
				dojo.addClass(close, "core-sprite-close"); //$NON-NLS-0$
				dojo.addClass(close, "dismiss"); //$NON-NLS-0$
				close.title = messages['Close'];
				dojo.connect(close, "onclick", dojo.hitch(this, function(event) { //$NON-NLS-0$
					localClose();
				}));
				// onClick events do not register for spans when using the keyboard without a screen reader
				dojo.connect(close, "onkeypress", dojo.hitch(this, function (e) { //$NON-NLS-0$
					if(e.keyCode === dojo.keys.ENTER  || e.charCode === dojo.keys.SPACE) {
						localClose();
					}
				}));
				return first;
			});
		 }
	};
	CommandParameterCollector.prototype.constructor = CommandParameterCollector;
	
	//return the module exports
	return {
		CommandParameterCollector: CommandParameterCollector
	};
});
