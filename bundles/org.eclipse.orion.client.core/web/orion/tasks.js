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

define(['require', 'dojo', 'orion/util', 'orion/commands'], function(require, dojo, mUtil, mCommands){

	/**
	 * Creates a new user interface element showing a list of tasks
	 *
	 * @name orion.tasks.TaskList
	 * @class A user interface element showing a list of various user tasks.
	 * @param {Object} options The service options
	 * @param {Object} options.parent The parent of this task list
	 * @param {String} options.tasks The array of tasks this list should display
	 * @param {String} options.title The title of the task list
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
		this._tasks = options.tasks;
		this._title = options.title || "Tasks";
		this._collapsed = options.collapsed;
		this._contentId = this._parent.id + "taskContent";
		this._item = options.item;
		this._handler = options.handler;
		this._commandService = options.commandService;
		
		var commandService = this._commandService;
		var taskList = this;
		// toggle command		
		var hideCommand = new mCommands.Command({
			name: "Hide",
			tooltip: "Hide pane content",
			id: "orion.hidePane",
			visibleWhen: function(item) {
				return !taskList._collapsed;},
			callback: function(data) {
				dojo.style(data.items, "display", "none");
				taskList._collapsed = true;
				dojo.empty("taskCommands");
				commandService.renderCommands("taskCommands", "taskCommands", taskList._contentId, taskList, "button");
				taskList.storeToggleState(false);}
			});
		this._commandService.addCommand(hideCommand);
		this._commandService.registerCommandContribution("taskCommands", "orion.hidePane", 1);
		var showFunction = function(id, store) {
			dojo.style(id, "display", "block");
			taskList._collapsed = false;
			dojo.empty("taskCommands");
			commandService.renderCommands("taskCommands", "taskCommands", taskList._contentId, taskList, "button");
			if (store) {
				taskList.storeToggleState(true);
			}
		};
		var showCommand = new mCommands.Command({
			name: "Show",
			tooltip: "Show pane content",
			id: "orion.showPane",
			visibleWhen: function(id) {
				return taskList._collapsed;},
			callback: function(data) {
				showFunction(data.items, true);}
			});
		this._commandService.addCommand(showCommand);
		this._commandService.registerCommandContribution("taskCommands", "orion.showPane", 2);

		this.renderTasks();
		
		// if options should be collapsed, we double check the preferences in case the user left them open.
		if (this._collapsed) {
			this._registry.getService("orion.core.preference").getPreferences("/window/views").then(function(prefs) { 
				if (prefs.get(this._title)) {
					showFunction(taskList._contentId, true);
				}
			});
		}
	}
	TaskList.prototype = /** @lends orion.tasks.TaskList.prototype */ {
		
		renderTasks: function(favorites, searches, serviceRegistry) {
			dojo.empty(this._parent);
			// Heading
			mUtil.createPaneHeading(this._parent, "tasksHeading", this._title, true, null, "taskCommands", this._registry.getService("orion.page.command"), this, this._contentId);

			var taskTable = dojo.create("table", { id: this._contentId, role: "presentation" }, this._parent, "last");
			if (this._collapsed) {
				dojo.style(taskTable, "display", "none");
			}
			for (var i=0; i<this._tasks.length; i++) {
				var row = dojo.create("tr", null, taskTable, "last");
				var col = dojo.create("td", null, row, "last");
				this._commandService.registerCommandContribution("task"+i, this._tasks[i].commandId, 1);
				this._commandService.renderCommands("task"+i, col, this._item, this._handler, "button");
				// reachy...but I know I have only one command
				dojo.addClass(col.childNodes[0], "taskTitle");
				dojo.addClass(col, "taskTitle");
				col = dojo.create("td", null, row, "last");
				dojo.addClass(col, "taskDescription");
				var command = this._commandService.findCommand(this._tasks[i].commandId);
				if (command) {
					dojo.place(document.createTextNode(command.description || command.tooltip), col, "last");
				}
			}
		},
		
		storeToggleState: function(value) {
			this._registry.getService("orion.core.preference").getPreferences("/window/views").then(function(prefs){
				prefs.put(this._title, value);
			}); 
		}
	};//end navigation outliner prototype
	TaskList.prototype.constructor = TaskList;

	//return module exports
	return {
		TaskList: TaskList
	};
});
