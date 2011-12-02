/*******************************************************************************
 * @license Copyright (c) 2011 IBM Corporation and others. All rights reserved.
 *          This program and the accompanying materials are made available under
 *          the terms of the Eclipse Public License v1.0
 *          (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse
 *          Distribution License v1.0
 *          (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
define([ 'require', 'dojo', 'orion/explorer' ], function(require, dojo,
		mExplorer) {
	var exports = {};

	exports.TasksExplorer = (function() {
		function TasksExplorer(registry, selection, parentId, toolbarId, selectionToolsId) {
			this.parentId = parentId;
			this.registry = registry;
			this.selection = selection;
			this.toolbarId = toolbarId;
			this.selectionToolsId = selectionToolsId;
			this.checkbox = true;
			this.renderer = new exports.TasksRenderer({checkbox: true}, this);
		};

		TasksExplorer.prototype = new mExplorer.Explorer();
		
		TasksExplorer.prototype.loadTasks = function(taskList){
			this.tasks = taskList;
			this.createTree(this.parentId, new mExplorer.ExplorerFlatModel(null, null, taskList.Children));
		};
		
		TasksExplorer.prototype.mergeTasks = function(tasksToMerge){
			if(!this.tasks){
				this.loadTasks(tasksToMerge);
				return;
			}
			if(!tasksToMerge || !tasksToMerge.Children || tasksToMerge.Children.length===0){
				return;
			}
			var newTasks = [];
			for(var j=0; j<tasksToMerge.Children.length; j++){
				var taskToMerge = tasksToMerge.Children[j];
				var foundTask = false;
				for(var i=0; i<this.tasks.Children.length; i++){
					var task = this.tasks.Children[i];
					if(task.Location===taskToMerge.Location){
						this.tasks.Children[i] = taskToMerge;
						foundTask = true;
						break;
					}
				}
				if(!foundTask){
					newTasks.push(taskToMerge);
				}
			}
			for(var i=0; i<newTasks.length; i++)
				this.tasks.Children.unshift(newTasks[i]);
			this.loadTasks(this.tasks);
			
		};

		return TasksExplorer;
	}());
	
	exports.TasksRenderer = (function(){
		function TasksRenderer (options, explorer) {
			this._init(options);
			this.options = options;
			this.explorer = explorer;
		};
		
		TasksRenderer.prototype = new mExplorer.SelectionRenderer();
		
		TasksRenderer.prototype.getCellHeaderElement = function(col_no){
			
			if (this.options['minimal'])
				return;
			
			switch(col_no){
				case 0: 
					return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Name</h2>"});
					break;
				case 1: 
					return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Message</h2>"});
					break;
				case 2:
					return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Status</h2>"});
					break;
			}
			
		};
		
		TasksRenderer.prototype.getCellElement = function(col_no, item, tableRow){
			switch(col_no){
			case 0:
				var col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: item.Name});
				var div = dojo.create("div", null, col, "only");
				link = dojo.create("a", {innerHTML: item.Name, className: "navlinkonpage"}, div, "last");
				dojo.place(document.createTextNode(item.Name), link, "only");
				return col;
				break;
			case 1:
				return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: item.Message});
				break;
			case 2:
				return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: item.Running ? "running" : "completed"});
				break;
			}
		};
		
		return TasksRenderer;
	}());

	return exports;
});