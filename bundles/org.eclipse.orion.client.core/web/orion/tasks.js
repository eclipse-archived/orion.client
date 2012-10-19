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

define(['i18n!orion/nls/messages', 'require', 'dojo', 'orion/section', 'orion/commands'], function(messages, require, dojo, mSection, mCommands){

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
	 * @param {Boolean} options.collapsed Whether the list should be initially collapsed
	 * @param {Object} options.item  The item used as the target when running a task command
	 * @param {Object} options.handler The handler when running a task command
	 * @param {orion.commands.CommandService} The command service used for running commands
	 * @param {String} options.descriptionProperty The name of the property on the command that will provide the description.  Optional.  
	 * 	The command tooltip will be used as the description if no descriptionProperty is provided.
	 */
	function TaskList(options) {
		var parent = options.parent;
		if (typeof(parent) === "string") { //$NON-NLS-0$
			parent = dojo.byId(parent);
		}
		if (!parent) { throw messages['no parent']; }
		if (!options.serviceRegistry) {throw messages["no service registry"]; }
		this._parent = parent;
		this._registry = options.serviceRegistry;	
		this._description = options.description;
		this._tasks = options.tasks;
		this._title = options.title || messages["Tasks"];
		this._collapsed = options.collapsed;
		this._id = options.id || this._parent.id + "taskList"; //$NON-NLS-0$
		this._contentId = this._parent.id + "taskContent"; //$NON-NLS-0$
		this._item = options.item;
		this._handler = options.handler;
		this._commandService = options.commandService;
		this._descriptionProperty = options.descriptionProperty;
		
		var commandService = this._commandService;
		var taskList = this;
		this.renderTasks();
	}
	TaskList.prototype = /** @lends orion.tasks.TaskList.prototype */ {
		
		renderTasks: function() {
			// first time setup
			if (!this._taskSection) {
				var contentId = "taskListContent"+this._title; //$NON-NLS-0$
				var contentDiv = dojo.create("div", {id: contentId}); //$NON-NLS-0$
				this.fileSystemsSection = new mSection.Section(this._parent, {
					id: "taskListSection"+this._title, //$NON-NLS-0$
					title: this._title,
					content: contentDiv,
					preferenceService: this._registry.getService("orion.core.preference"), //$NON-NLS-0$
					canHide: true,
					hidden: this._collapsed,
					useAuxStyle: true
				});
				if (this._description) {
					dojo.place("<p>"+this._description+"</p>", contentId, "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				}
				var taskTable = dojo.create("table", { role: "presentation" }, contentId, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				for (var i=0; i<this._tasks.length; i++) {
					var row = dojo.create("tr", null, taskTable, "last"); //$NON-NLS-1$ //$NON-NLS-0$
					var col = dojo.create("td", null, row, "last"); //$NON-NLS-1$ //$NON-NLS-0$
					this._commandService.registerCommandContribution("task"+i, this._tasks[i].commandId, 1); //$NON-NLS-0$
					this._commandService.renderCommands("task"+i, col, this._item, this._handler, "button"); //$NON-NLS-1$ //$NON-NLS-0$
					if (col.childNodes.length > 0) {
						// I know I have only one command if I have any at all
						dojo.addClass(col.childNodes[0], "taskTitle"); //$NON-NLS-0$
					}					
					col = dojo.create("td", null, row, "last"); //$NON-NLS-1$ //$NON-NLS-0$
					dojo.addClass(col, "taskDescription"); //$NON-NLS-0$
					var command = this._commandService.findCommand(this._tasks[i].commandId);
					if (command) {
						var description = this._descriptionProperty ? command[this._descriptionProperty] : command.tooltip;
						dojo.place(document.createTextNode(description), col, "last"); //$NON-NLS-0$
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
