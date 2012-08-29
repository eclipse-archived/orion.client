/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     Kris De Volder (VMWare) - initial API and implementation
 *******************************************************************************/

/*global define Range*/
/*jslint browser:true*/

define(['i18n!orion/widgets/nls/messages', 'gcli/index', 'gcli/types', 'gcli/types/basic', 'gcli/argument', 'gcli/ui/fields',
		'gcli/ui/fields/menu', 'gcli/util', 'gcli/settings', 'gcli/canon', 'gcli/cli', 'gcli/commands/help'],
	function(messages, mGCLI, mTypes, mBasicTypes, mArgument, mFields, mMenu, mUtil, mSettings, mCanon, mCli, mHelp) {

	function CustomType(typeSpec) {}
	CustomType.prototype = Object.create(mBasicTypes.DeferredType.prototype);
	CustomType.prototype.defer = function() {
		return mBasicTypes.BlankType;
	};
	CustomType.prototype.getBlank = function() {
		return new mTypes.Conversion(undefined, new mArgument.BlankArgument(), mTypes.Status.VALID);
	};

	var orion = {};
	orion.console = {};
	orion.console.CompletionStatus = {
		MATCH: 0,
		PARTIAL: 1,
		ERROR: 2
	};

	/**
	 * Constructs a new console.
	 * 
	 * @param parent the parent element for the console, it can be either a DOM element or an ID for a DOM element.
	 * 
	 * @class A Console is a user interface that accepts input command lines and displays output.
	 * @name orion.console.Console
	 */
	orion.console.Console = (function() {
		function Console(input, output) {
			this._init(input, output);
		}
		Console.prototype = /** @lends orion.console.Console.prototype */{			
			/** @private */
			_init: function(input, output) {
				if (!input) { throw messages["no input"]; }
				if (!output) { throw messages["no output"]; }

				var outputDiv = document.createElement("div"); //$NON-NLS-0$
				outputDiv.id = "gcli-display"; //$NON-NLS-0$
				outputDiv.style.height = "100%"; //$NON-NLS-0$
				outputDiv.style.width = "100%"; //$NON-NLS-0$
				output.appendChild(outputDiv);

				var inputText = document.createElement("input"); //$NON-NLS-0$
				inputText.type = "text"; //$NON-NLS-0$
				inputText.id = "gcli-input"; //$NON-NLS-0$
				inputText.style.width = "100%"; //$NON-NLS-0$
				inputText.style.height = "100%"; //$NON-NLS-0$
				input.appendChild(inputText);

				mSettings.getSetting('hideIntro').value = true; //$NON-NLS-0$
				mSettings.getSetting('eagerHelper').value = 2; //$NON-NLS-0$

				/*
				 * Create the console asynchronously to ensure that the client finishes its
				 * layout before GCLI computes the locations for its created widgets.
				 */
				var self = this;
				setTimeout(function() {
					mGCLI.createDisplay();
					self.output("For a list of available commands type 'help'.");
				});
				mHelp.startup();
				mHelp.helpListHtml = mHelp.helpListHtml.replace("\"${includeIntro}\"","${false}"); //$NON-NLS-1$ //$NON-NLS-0$

				function CustomField(type, options) {
					mFields.Field.call(this, type, options);
					this.isImportant = true;
					this.element = mUtil.createElement(this.document, 'div'); //$NON-NLS-0$
					this.element.className = 'orion'; //$NON-NLS-0$
					this.menu = new mMenu.Menu({document: this.document, field: true, type: type});
					this.menu.onItemClick = this.onItemClick.bind(this);
					this.element.appendChild(this.menu.element);
					this.onFieldChange = mUtil.createEvent('CustomField.fieldChanged'); //$NON-NLS-0$
					this.onInputChange = this.onInputChange.bind(this);
				}

				CustomField.prototype = Object.create(mFields.Field.prototype);
				CustomField.prototype.destroy = function() {
					mFields.Field.prototype.destroy.call(this);
					this.menu.destroy();
					delete this.element;
					delete this.menu;
					delete this.document;
					delete this.onInputChange;
				};
				CustomField.prototype.setConversion = function(conversion) {
					this.setMessage(conversion.message);
					var items = [];
					var predictions = conversion.getPredictions();
					predictions.forEach(function(item) {
						if (!item.hidden) {
							items.push({
								name: item.name,
								complete: item.name,
								description: item.description || ''
							});
						}
					}, this);
					this.menu.show(items);

					if (conversion.then) {
						/*
						 * We only got a 'provisional' conversion. When caches are filled
						 * we'll get a callback and should try again.
						 */
						var that = this;
						conversion.then(function () {
							if (that.element) { //if there's no UI yet => ignore.
								that.setConversion(that.getConversion());
							}
						});
					}
				};
				CustomField.prototype.onItemClick = function(ev) {
					var conversion = ev.conversion;
					this.onFieldChange({ conversion: conversion });
					this.setMessage(conversion.message);
				};
				CustomField.claim = function(type) {
					return type instanceof CustomType ? mFields.Field.MATCH + 1 : mFields.Field.NO_MATCH;
				};

				mFields.addField(CustomField);
			},
			addCommand: function(command) {
				if (!command.exec) {
					command.exec = command.callback;
				}
				if (!command.params) {
					command.params = command.parameters;
				}
				mGCLI.addCommand(command);
			},
			addField: function(field) {
				// TODO
			},
			addType: function(type) {
				function NewType(typeSpec) {}

				NewType.prototype = Object.create(CustomType.prototype);
				NewType.prototype.name = type.name;
				NewType.prototype.parse = function (arg) {
					var completion = type.parse(arg.toString().trim());
					var status = mTypes.Status.VALID;
					if (completion.status) {
						switch (completion.status) {
							case orion.console.CompletionStatus.ERROR:
								status = mTypes.Status.ERROR;
								break;
							case orion.console.CompletionStatus.PARTIAL:
								status = mTypes.Status.INCOMPLETE;
								break;
						}
					}							
					return new mTypes.Conversion(completion.value, arg, status, completion.message, completion.predictions);
				};
				if (type.stringify) {
					NewType.prototype.stringify = function (arg) {
						return type.stringify(arg);
					};
				}
				if (type.increment) {
					NewType.prototype.increment = function (arg) {
						return type.increment(arg);
					};
				}
				if (type.decrement) {
					NewType.prototype.decrement = function (arg) {
						return type.decrement(arg);
					};
				}
				mTypes.registerType(NewType);
			},
			output: function(content) {
				var output = new mCli.Output();
				var commandOutputManager = mCanon.commandOutputManager;
				commandOutputManager.onOutput({output: output});
				output.complete(content);
			}
		};
		return Console;
	}());

	return orion.console;
});
