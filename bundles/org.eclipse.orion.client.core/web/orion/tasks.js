/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
/*global window document define setTimeout */
/*jslint forin:true*/

define(['require', 'dojo', 'orion/section', 'orion/commands'], function(require, dojo, mSection, mCommands){

	/**
	 * Creates a new user interface element showing a list of tasks
	 *
	 * @name orion.tasks.TaskList
	 * @class A user interface element showing a list of various user tasks.
	 * @param {Object} options The service options
	 * @param {Object} options.parent The parent of this task list
	 * @param {String} options.tasks The array of tasks this list should display
	 * @param {String} options.title The title of the task list
	 * @param {String} options.description A description of the task list shown the user
	 * @param {orion.serviceregistry.ServiceRegistry} options.serviceRegistry The service registry
	 */
	function TaskList(options) {
		var parent = options.parent;
		if (typeof(parent) === "string") {
			parent = dojo.byId(parent);
		}
		if (!parent) { throw "no parent"; }
		if (!options.serviceRegistry) {throw "no service registry"; }
		this._parent = parent;
		this._registry = options.serviceRegistry;	
		this._description = options.description;
		this._tasks = options.tasks;
		this._title = options.title || "Tasks";
		this._collapsed = options.collapsed;
		this._id = options.id || this._parent.id + "taskList";
		this._contentId = this._parent.id + "taskContent";
		this._item = options.item;
		this._handler = options.handler;
		this._commandService = options.commandService;
		
		var commandService = this._commandService;
		var taskList = this;
		this.renderTasks();
	}
	TaskList.prototype = /** @lends orion.tasks.TaskList.prototype */ {
		
		renderTasks: function() {
			// first time setup
			if (!this._taskSection) {
				var contentId = "taskListContent"+this._title;
				this.fileSystemsSection = new mSection.Section(this._parent, {
					id: "taskListSection"+this._title,
					title: this._title,
					content: '<div id="'+contentId+'"></div>',
					preferenceService: this._registry.getService("orion.core.preference"),
					canHide: true,
					hidden: this._collapsed
				});
				if (this._description) {
					dojo.place("<p>"+this._description+"</p>", contentId, "only");
				}
				var taskTable = dojo.create("table", { role: "presentation" }, contentId, "last");
				for (var i=0; i<this._tasks.length; i++) {
					var row = dojo.create("tr", null, taskTable, "last");
					var col = dojo.create("td", null, row, "last");
					this._commandService.registerCommandContribution("task"+i, this._tasks[i].commandId, 1);
					this._commandService.renderCommands("task"+i, col, this._item, this._handler, "button");
					dojo.addClass(col, "taskTitle");
					if (col.childNodes.length > 0) {
						// I know I have only one command if I have any at all
						dojo.addClass(col.childNodes[0], "taskTitle");
					}
					col = dojo.create("td", null, row, "last");
					dojo.addClass(col, "taskDescription");
					var command = this._commandService.findCommand(this._tasks[i].commandId);
					if (command) {
						dojo.place(document.createTextNode(command.description || command.tooltip), col, "last");
					}
				}
			}
		}
	};//end navigation outliner prototype
	TaskList.prototype.constructor = TaskList;

	//return module exports
	return {
		TaskList: TaskList
	};
});
