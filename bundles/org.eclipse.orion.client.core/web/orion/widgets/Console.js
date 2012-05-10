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

/*global define*/
/*jslint browser:true*/

define(['gcli/index', 'gcli/types', 'gcli/types/basic', 'gcli/ui/field', 'gcli/argument', 'gcli/util', 'gcli/ui/menu'],
	function(mGCLI, mTypes, mBasicTypes, mField, mArgument, mUtil, mMenu) {

	function CustomType(typeSpec) {}
	CustomType.prototype = Object.create(mBasicTypes.DeferredType.prototype);

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
				if (!input) { throw "no input"; }
				if (!output) { throw "no output"; }

				var outputDiv = document.createElement("div");
				outputDiv.id = "gcli-display";
				outputDiv.style.height = "100%";
				outputDiv.style.width = "100%";
				output.appendChild(outputDiv);

				var inputDiv = document.createElement("div");
				inputDiv.id = "gcli-input-area";
				inputDiv.style.height = "100%";
				inputDiv.style.width = "100%";
				input.appendChild(inputDiv);

				var inputText = document.createElement("input");
				inputText.id = "gcli-input";
				inputDiv.appendChild(inputText);

				var rowCompleteDiv = document.createElement("div");
				rowCompleteDiv.id = "gcli-row-complete";
				inputDiv.appendChild(rowCompleteDiv);

				mGCLI.createView();

				function CustomField(type, options) {
					mField.Field.call(this, type, options);
					this.onInputChange = this.onInputChange.bind(this);
					this.arg = new mArgument.Argument();
					this.element = mUtil.dom.createElement(this.document, 'div');
					this.input = mUtil.dom.createElement(this.document, 'input');
					this.input.type = 'text';
					this.input.addEventListener('keyup', this.onInputChange, false);
					this.input.classList.add('gcli-field');
					this.input.classList.add('gcli-field-directory');
					this.element.appendChild(this.input);
					this.menu = new mMenu.Menu({ document: this.document, field: true });
					this.element.appendChild(this.menu.element);
					this.input.addEventListener('keyup', this.onInputChange, false);
					this.fieldChanged = mUtil.createEvent('DirectoryField.fieldChanged');
					// i.e. Register this.onItemClick as the default action for a menu click
					this.menu.onItemClick = this.onItemClick.bind(this);
				}

				CustomField.prototype = Object.create(mField.Field.prototype);
				CustomField.prototype.destroy = function() {
					mField.Field.prototype.destroy.call(this);
					this.input.removeEventListener('keyup', this.onInputChange, false);
					this.menu.destroy();
					delete this.element;
					delete this.input;
					delete this.menu;
					delete this.document;
					delete this.onInputChange;
				};
				CustomField.prototype.setConversion = function(conversion) {
					this.arg = conversion.arg;
					this.input.value = conversion.arg.text;
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
					// TODO
					this.item = ev.currentTarget.item;
				//	this.arg = this.arg.beget(this.item.complete, { normalize: true });
					var conversion = this.type.parse(this.arg);
					this.fieldChanged({ conversion: conversion });
					this.setMessage(conversion.message);
				};
				CustomField.prototype.getConversion = function() {
					// This tweaks the prefix/suffix of the argument to fit
					this.arg = this.arg.beget(this.input.value, { prefixSpace: true });
					return this.type.parse(this.arg);
				};
				CustomField.claim = function(type) {
					return type instanceof CustomType ? mField.Field.MATCH + 1 : mField.Field.NO_MATCH;
				};

				mField.addField(CustomField);
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
			}
		};
		return Console;
	}());

	return orion.console;
});
