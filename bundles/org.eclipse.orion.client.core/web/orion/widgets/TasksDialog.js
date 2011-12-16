/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets*/
/*jslint browser:true*/

define(['require', 'dojo', 'dijit', 'orion/util', 'dijit/TooltipDialog', 'text!orion/widgets/templates/TasksDialog.html'], function(require, dojo, dijit, mUtil) {
	
	dojo.declare("orion.widgets.TasksDialog", [dijit.TooltipDialog], {
		widgetsInTemplate: true,
		templateString: dojo.cache('orion', 'widgets/templates/TasksDialog.html'),

		constructor : function() {
			this.inherited(arguments);
			this.options = arguments[0] || {};
			this._tasks = [];
		},
		postCreate: function(){
			this.inherited(arguments);
			this.allTasksLink.href = require.toUrl("tasks/list.html");
			this._setTasksVisibility();
		},
		setTasks: function(tasks){
			this._tasks = tasks.Children ? tasks.Children : [];
			this._tasks.sort(function(task1, task2){return parseInt(task2.Modified) - parseInt(task1.Modified);});
			this._renderTasks();
		},
		parseProgressResult: function(message){
			if(!message){
				return {};
			}
			//could either be responseText from xhrGet or just a string
			var status = message.responseText || message;
			//accept either a string or a JSON representation of an IStatus
			try {
				status = JSON.parse(status);
			} catch(error) {
				//it is not JSON, just continue;
			}
			return {Message: status.Message || status, Severity: status.Severity};
		},
		_renderTasks: function(){
			dojo.empty(this.tasksList);
			for(var i=0; i<this._tasks.length; i++){
				var task = this._tasks[i];
				var tr = dojo.create("tr");
				var col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: task.Name}, tr);
				var div = dojo.create("div", null, col, "only");
				link = dojo.create("a", {innerHTML: task.Name, className: "navlinkonpage"}, div, "last");

				dojo.place(document.createTextNode(task.Name), link, "only");
				
				var taskIcon = dojo.create("span", null, div, "first");
				dojo.addClass(taskIcon, "imageSprite");
				
				var result =  this.parseProgressResult(task.Result);
				
				if(result.Severity){
					switch (status.Severity) {
						case "Warning":
							dojo.addClass(taskIcon, "core-sprite-warning");
							return col;
						case "Error":
							dojo.addClass(taskIcon, "core-sprite-error");
							return col;
					}
				}
				
				if(task.Running===true)
					dojo.addClass(taskIcon, "core-sprite-start");
				else if(task.Canceled===true)
					dojo.addClass(taskIcon, "core-sprite-stop");
				else if(task.Failed===true)
					dojo.addClass(taskIcon, "core-sprite-error");
				else
					dojo.addClass(taskIcon, "core-sprite-ok");
				
				dojo.place(tr, this.tasksList, "last");
			}
			this._setTasksVisibility();
		},
		_setTasksVisibility: function(){			
			this.tasksList.style.display = this._tasks.length > 0 ? "" : "none";
			this.noTasks.style.display = this._tasks.length > 0 ? "none": "";
		},
		_onBlur: function(){
			this.inherited(arguments);
			dijit.popup.close(this);
		}
	
	});
});