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
define([ 'require', 'dojo', 'orion/explorer', 'orion/operationsCommands' ], function(require, dojo,
		mExplorer, mOperationsCommands) {
	var exports = {};

	exports.OperationsExplorer = (function() {
		function OperationsExplorer(registry, selection, parentId, toolbarId, selectionToolsId) {
			this.parentId = parentId;
			this.registry = registry;
			this.selection = selection;
			this.toolbarId = toolbarId;
			this.selectionToolsId = selectionToolsId;
			this.checkbox = true;
			this.renderer = new exports.OperationsRenderer({checkbox: true}, this);
		};

		OperationsExplorer.prototype = new mExplorer.Explorer();
		
		OperationsExplorer.prototype.loadOperations = function(operationsList){
			operationsList.Children.sort(function(op1, op2){return parseInt(op2.Modified) - parseInt(op1.Modified);});
			this.operations = operationsList;
			mOperationsCommands.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, this.operations);
			this.createTree(this.parentId, new mExplorer.ExplorerFlatModel(null, null, operationsList.Children));
		};
		
		OperationsExplorer.prototype.removeCompletedOperations = function(){
			var newOperations = [];
			for(var operationId in this.operations.Children){
				if(this.operations.Children[operationId].Running){
					newOperations.push(this.operations.Children[operationId]);
				}
			}
			this.operations.Children = newOperations;
			this.loadOperations(this.operations);		
		};
		
		OperationsExplorer.prototype.removeOperations = function(operationsToRemove){
			var newOperations = [];
			for(var operationId in this.operations.Children){
				var foundOperation = false;
				for(var i in operationsToRemove){
					if(operationsToRemove[i].Location === this.operations.Children[operationId].Location){
						foundOperation = true;
						break;
					}
				}
				if(!foundOperation)
					newOperations.push(this.operations.Children[operationId]);
			}
			this.operations.Children = newOperations;
			this.loadOperations(this.operations);
		};
		
		OperationsExplorer.prototype.mergeOperations = function(operationsToMerge){
			if(!this.operations){
				this.loadOperations(operationsToMerge);
				return;
			}
			if(!operationsToMerge || !operationsToMerge.Children || operationsToMerge.Children.length===0){
				return;
			}
			var newOperations = [];
			for(var j=0; j<operationsToMerge.Children.length; j++){
				var operationToMerge = operationsToMerge.Children[j];
				var foundOperation = false;
				for(var i=0; i<this.operations.Children.length; i++){
					var operation = this.operations.Children[i];
					if(operation.Location===operationToMerge.Location){
						this.operations.Children[i] = operationToMerge;
						foundOperation = true;
						break;
					}
				}
				if(!foundOperation){
					newOperations.push(operationToMerge);
				}
			}
			for(var i=0; i<newOperations.length; i++)
				this.operations.Children.unshift(newOperations[i]);
			this.loadOperations(this.operations);
			
		};

		return OperationsExplorer;
	}());
	
	exports.OperationsRenderer = (function(){
		function OperationsRenderer (options, explorer) {
			this._init(options);
			this.options = options;
			this.explorer = explorer;
		};
		
		OperationsRenderer.prototype = new mExplorer.SelectionRenderer();
		
		OperationsRenderer.prototype.getCellHeaderElement = function(col_no){
			
			if (this.options['minimal'])
				return;
			
			switch(col_no){
				case 0: 
					return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Name</h2>"});
					break;
				case 1: 
					return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Status</h2>"});
					break;
				case 2:
					return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Actions</h2>"});
					break;
			}
			
		};
		
		OperationsRenderer.prototype.parseProgressResult = function(message){
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
		};
		
		OperationsRenderer.prototype.getCellElement = function(col_no, item, tableRow){
			switch(col_no){
			case 0:
				var col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: item.Name});
				var div = dojo.create("div", null, col, "only");
				link = dojo.create("a", {innerHTML: item.Name, className: "navlinkonpage"}, div, "last");

				dojo.place(document.createTextNode(item.Name), link, "only");
				
				var operationIcon = dojo.create("span", null, div, "first");
				dojo.addClass(operationIcon, "imageSprite");
				
				var result =  this.parseProgressResult(item.Result);
				
				if(result.Severity){
					switch (status.Severity) {
						case "Warning":
							dojo.addClass(operationIcon, "core-sprite-warning");
							return col;
						case "Error":
							dojo.addClass(operationIcon, "core-sprite-error");
							return col;
					}
				}
				
				if(item.Running===true)
					dojo.addClass(operationIcon, "core-sprite-start");
				else if(item.Canceled===true)
					dojo.addClass(operationIcon, "core-sprite-stop");
				else if(item.Failed===true)
					dojo.addClass(operationIcon, "core-sprite-error");
				else
					dojo.addClass(operationIcon, "core-sprite-ok");
				
				return col;
				break;
			case 1:
				var result =  this.parseProgressResult(item.Result);
				return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: result.Message || item.Message});
				break;
			case 2:
				return this.getActionsColumn(item, tableRow);
				break;
			}
		};
		
		return OperationsRenderer;
	}());

	return exports;
});