/*******************************************************************************
 * @license
 * Copyright (c) 2012 VMWare and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     Kris De Volder (VMWare) - initial API and implementation
 *******************************************************************************/
/*global define require setTimeout*/
define(['gcli/types', 'gcli/types/basic', 'gcli/ui/field', 'gcli/argument', 'gcli/util', 'dojo', 'gcli/cli', 
'gcli/ui/menu', 'console/current-directory'], function() {

	var dojo = require('dojo');
	var registerType = require('gcli/types').registerType;
	var StringType = require('gcli/types/basic').StringType;
	var Conversion = require('gcli/types').Conversion;
	var Status = require('gcli/types').Status;
	var Field = require('gcli/ui/field').Field;
	var Argument = require('gcli/argument').Argument;
	var addField = require('gcli/ui/field').addField;
	var dom = require('gcli/util').dom;
	var createEvent = require('gcli/util').createEvent;
//	var Assignment = require('gcli/cli').Assignment;
	var Menu = require('gcli/ui/menu').Menu;
	var withCurrentChildren = require('console/current-directory').withCurrentChildren;
	
	var cache = {};
	
	/**
	 * Returns true if string is a string that starts with the given prefix.
	 */
	function startsWith(string, prefix) {
		if (typeof(string)==='string' && typeof(prefix)==='string') {
			return string.indexOf(prefix)===0;
		}
		return false;
	}

	function withValidDirs(k) {
		withCurrentChildren(function (nodes) {
			var names = ['..'];
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				if (node.Directory) {
					names.push(node.Name);
				}
			}
			k(names);
		});
	}

	function computeCompletions(text, validDirs) {
		var completions = [];
		for (var i = 0; i < validDirs.length; i++) {
			var candidate = validDirs[i];
			if (startsWith(candidate, text)) {
				completions.push({
					name: candidate,
					description: candidate,
					value: candidate
				});
			}
		}
		return completions;
	}
	
	/**
	 * Gets list of completions, may return null if the list can't be computed
	 * synchronously.
	 */
	function getCompletions(text) {
		if (cache.completions && cache.text===text) {
			return cache.completions;
		}
		if (cache.validDirs) {
			//Do a quick computation from the list of dirs
			cache.completions = computeCompletions(text, cache.validDirs);
			cache.text = text;
			return cache.completions;
		}
		//Values will be cached in future... but we have no completions at this time.
		//We couldn't get the list just from cached values... 
		//try to prefetch cache for future use. 
		withValidDirs(function (validDirs) {
			cache.validDirs = validDirs;
		});
		return null;
	}
	
	/**
	 * Gets list of completions passing the result to callback function k.
	 * Will asynchronously fetch needed data if required.
	 */
	function withCompletions(text, k) {
		var completions = getCompletions(text);
		if (completions) {
			k(completions);
		} else {
			withValidDirs(function (validDirs) {
				cache.validDirs = validDirs;
				k(getCompletions(text));
			});
		}
	}
	
	function find(array, pred) {
		for (var i = 0; i < array.length; i++) {
			if (pred(array[i])) {
				return array[i];
			}
		}
		return null;
	}
	
	/**
	 * called to create a Conversion with a known list of predictions.
	 */
	function createConversion(str, arg, completions) {
		var exactMatch = find(completions, function(el) {
			return el.name === str;
		});
		var message;
		var status = Status.COMPLETE; //Default in case we forgte to set it.
		if (exactMatch) {
			status = Status.COMPLETE;
		} else if (completions!==null && completions.length>0) {
			status = Status.INCOMPLETE;
		} else {
			status = Status.ERROR;
			message = "'"+str+"'"+" is not a valid directory";
		}
		return new Conversion(
			//value, 
			str,
			//arg, 
			arg,
			//status, 
			status,
			//message, 
			message,
			//predictions
			completions
		);
	}
	
	function DirectoryType(typeSpec) {
		if (Object.keys(typeSpec).length > 0) {
			throw new Error('DirectoryType can not be customized');
		}
	}
	
	DirectoryType.prototype = Object.create(StringType.prototype);
	DirectoryType.prototype.name = 'directory';
	
	DirectoryType.prototype.parse = function (arg) {
		var str = arg.text || "";
		//var prefix = arg.prefix || "";
		var completions = getCompletions(str);
		if (completions!==null) {
			return createConversion(str, arg, completions);
		} else {
			//The completions aren't available yet. We should try to return a Conversion that
			//still allows user to edit, but without predictions.
			//Also we add a 'then' method allowing access to the actual conversion via a callback.
			var deferredConversion = new Conversion(
				//value, 
				str,
				//arg, 
				arg,
				//status, 
				Status.INCOMPLETE,
				//message, 
				undefined,
				//predictions
				completions
			);
			deferredConversion.then = function(callback) {
				withCompletions(str, function (completions) {
					callback(createConversion(str, arg, completions));
				});
			};
			return deferredConversion;
		}
	};
	registerType(DirectoryType);
	
		/**
		 * A field that allows editing of directories. Basically, this is a 
		 * String field with a menu attached to show the predictions.
		 */
		function DirectoryField(type, options) {
			Field.call(this, type, options);
			
			this.onInputChange = this.onInputChange.bind(this);
			this.arg = new Argument();
			
			this.element = dom.createElement(this.document, 'div');
			
			this.input = dom.createElement(this.document, 'input');
			this.input.type = 'text';
			this.input.addEventListener('keyup', this.onInputChange, false);
			this.input.classList.add('gcli-field');
			this.input.classList.add('gcli-field-directory');
			this.element.appendChild(this.input);

			this.menu = new Menu({ document: this.document, field: true });
			this.element.appendChild(this.menu.element);
		
			this.input.addEventListener('keyup', this.onInputChange, false);
			this.fieldChanged = createEvent('DirectoryField.fieldChanged');
			
			// i.e. Register this.onItemClick as the default action for a menu click
			this.menu.onItemClick = this.onItemClick.bind(this);
		}
		
		DirectoryField.prototype = Object.create(Field.prototype);
		
		DirectoryField.prototype.destroy = function() {
		  Field.prototype.destroy.call(this);
		  this.input.removeEventListener('keyup', this.onInputChange, false);
		  this.menu.destroy();
		  delete this.element;
		  delete this.input;
		  delete this.menu;
		  delete this.document;
		  delete this.onInputChange;
		};
		
		DirectoryField.prototype.setConversion = function(conversion) {
		  this.arg = conversion.arg;
		  this.input.value = conversion.arg.text;
		  this.setMessage(conversion.message);

		  var items = [];
		  var predictions = conversion.getPredictions();
		  predictions.forEach(function(item) {
		    // Commands can be hidden
		    if (!item.hidden) {
		      items.push({
		        name: item.name,
		        complete: item.name,
		        description: ''//item.description || ''
		      });
		    }
		  }, this);
		  this.menu.show(items);
		  
		  if (conversion.then) { // We only got a 'provisional' conversion. When caches are filled we'll get
		  						 // a callback and should try again.
			var that = this;
			conversion.then(function () {
				if (that.element) { //if there's no UI yet => ignore.
					that.setConversion(that.getConversion());
				}
			});
		  }
		};
		
		DirectoryField.prototype.onItemClick = function(ev) {
		  this.item = ev.currentTarget.item;
		  this.arg = this.arg.beget(this.item.complete, { normalize: true });
		  var conversion = this.type.parse(this.arg);
		  this.fieldChanged({ conversion: conversion });
		  this.setMessage(conversion.message);
		};
		
		DirectoryField.prototype.getConversion = function() {
		  // This tweaks the prefix/suffix of the argument to fit
		  this.arg = this.arg.beget(this.input.value, { prefixSpace: true });
		  return this.type.parse(this.arg);
		};
		
		DirectoryField.claim = function(type) {
		  return type instanceof DirectoryType ? (Field.MATCH+1) : Field.NO_MATCH;
		};
		
		addField(DirectoryField);
		
	dojo.subscribe("/dojo/hashchange", function (newHash) {
		cache = {};
	});
	
	//Not exporting anything. This module just contributes stuff to gcli by calling gcli API.
	return {}; 
});



