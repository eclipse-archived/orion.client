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
		function OperationsExplorer(registry, selection, parentId, toolbarId, selectionToolsId, actionScopeId) {
			this.parentId = parentId;
			this.registry = registry;
			this.selection = selection;
			this.toolbarId = toolbarId;
			this.selectionToolsId = selectionToolsId;
			this.checkbox = true;
			this.actionScopeId = actionScopeId;
			this.renderer = new exports.OperationsRenderer({actionScopeId: this.actionScopeId, checkbox: true}, this);
		};

		OperationsExplorer.prototype = new mExplorer.Explorer();
		
		OperationsExplorer.prototype.loadOperations = function(operationsList){
			operationsList.Children.sort(function(op1, op2){return parseInt(op2.Modified) - parseInt(op1.Modified);});
			this.operations = operationsList;
			mOperationsCommands.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, this.operations);
			this.createTree(this.parentId, new mExplorer.ExplorerFlatModel(null, null, operationsList.Children));
		};
		
		OperationsExplorer.prototype.mergeOperations = function(operationsToMerge){
			if(!this.operations){
				this.loadOperations(operationsToMerge);
				return;
			}
			if(!operationsToMerge || (!operationsToMerge.Children && !operationsToMerge.DeletedChildren) || (operationsToMerge.Children.length===0 && operationsToMerge.DeletedChildren.length===0)){
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
			
			if(operationsToMerge.DeletedChildren){
				for(var j=0; j<operationsToMerge.DeletedChildren.length; j++){
					var operationToDelete = operationsToMerge.DeletedChildren[j]; 
					for(var i=0; i<this.operations.Children.length; i++){
						var operation = this.operations.Children[i];
						if(operationToDelete === operation.Id){
							this.operations.Children.splice(i, 1);
							break;
						}
					}
				}
			}

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
					return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Actions</h2>"});
					break;
				case 2: 
					return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Status</h2>"});
					break;
				case 3: 
					return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Scheduled</h2>"});
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
			var ret = {Message: status.Message || status, Severity: status.Severity};
			if(status.DetailedMessage && status.DetailedMessage !== ret.Message){
				ret.DetailedMessage = status.DetailedMessage;
			}
			return ret;
		};
		
		OperationsRenderer.prototype.getCellElement = function(col_no, item, tableRow){
			switch(col_no){
			case 0:
				var col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: item.Name});
				var div = dojo.create("div", null, col, "only");
				var span = dojo.create("span", {innerHTML: item.Name, className: "primaryColumn"}, div, "last");

				dojo.place(document.createTextNode(item.Name), span, "only");
				
				var operationIcon = dojo.create("span", null, div, "first");
				dojo.addClass(operationIcon, "imageSprite");
				
				var result =  this.parseProgressResult(item.Result);
				
				if(result.Severity){
					switch (result.Severity) {
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
				return this.getActionsColumn(item, tableRow);
				break;
			case 2:
				var result =  this.parseProgressResult(item.Result);
				var message = result.Message || item.Message;
				if(result.DetailedMessage && result.DetailedMessage!=="")
					message += ": " + result.DetailedMessage;
				return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: message});
				break;
			case 3:
				if(item.Created && parseInt(item.Created)>0){
					return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML:  dojo.date.locale.format(
							new Date(parseInt(item.Created)),
							{selector: "datetime", formatLength: "medium"})});
				}
				return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"});
			}
		};
		
		return OperationsRenderer;
	}());

	return exports;
});