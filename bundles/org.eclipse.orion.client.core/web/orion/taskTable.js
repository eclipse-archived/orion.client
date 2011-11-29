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
			this.renderer = new exports.TasksRenderer({}, this);
		};

		TasksExplorer.prototype = new mExplorer.Explorer();
		
		TasksExplorer.prototype.loadTasks = function(taskList){
			this.createTree(this.parentId, new mExplorer.ExplorerFlatModel(null, null, taskList.Children));
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
					return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Message</h2>"});
					break;
				case 1:
					return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Status</h2>"});
					break;
			}
			
		};
		
		TasksRenderer.prototype.getCellElement = function(col_no, item, tableRow){
			switch(col_no){
			case 0:
				return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: item.Message});
				break;
			case 1:
				return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: item.Running ? "running" : "completed"});
				break;
			}
		};
		
		return TasksRenderer;
	}());

	return exports;
});