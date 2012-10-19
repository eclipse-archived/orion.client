/*******************************************************************************
 * @license Copyright (c) 2011, 2012 IBM Corporation and others. All rights reserved.
 *          This program and the accompanying materials are made available under
 *          the terms of the Eclipse Public License v1.0
 *          (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse
 *          Distribution License v1.0
 *          (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
define(['i18n!orion/operations/nls/messages',  'require', 'dojo', 'orion/explorers/explorer', 'orion/operationsCommands', 'dojo/date/locale'], function(messages, require, dojo,
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
			
			if (this.options['minimal']) //$NON-NLS-0$
				return;

			var col, h2;
			switch(col_no){
				case 0: 
					col = dojo.create("th", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
					h2 = dojo.create("h2", null, col); //$NON-NLS-0$
					h2.textContent = messages["Name"];
					return col;
					break;
				case 1:
					col = dojo.create("th", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
					h2 = dojo.create("h2", null, col); //$NON-NLS-0$
					h2.textContent = messages["Actions"];
					return col;
					break;
				case 2: 
					col = dojo.create("th", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
					h2 = dojo.create("h2", null, col); //$NON-NLS-0$
					h2.textContent = messages["Status"];
					return col;
					break;
				case 3: 
					col = dojo.create("th", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
					h2 = dojo.create("h2", null, col); //$NON-NLS-0$
					h2.textContent = messages["Scheduled"];
					return col;
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
			var col;
			switch(col_no){
			case 0:
				col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
				col.textContent = item.Name;
				var div = dojo.create("div", null, col, "only"); //$NON-NLS-1$ //$NON-NLS-0$
				var span = dojo.create("span", {className: "primaryColumn"}, div, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.place(document.createTextNode(item.Name), span, "only"); //$NON-NLS-0$
				
				var operationIcon = dojo.create("span", null, div, "first"); //$NON-NLS-1$ //$NON-NLS-0$
				dojo.addClass(operationIcon, "imageSprite"); //$NON-NLS-0$
				
				var result =  this.parseProgressResult(item.Result);
				
				if(result.Severity){
					switch (result.Severity) {
						case "Warning": //$NON-NLS-0$
							dojo.addClass(operationIcon, "core-sprite-warning"); //$NON-NLS-0$
							return col;
						case "Error": //$NON-NLS-0$
							dojo.addClass(operationIcon, "core-sprite-error"); //$NON-NLS-0$
							return col;
					}
				}
				
				if(item.Running===true)
					dojo.addClass(operationIcon, "core-sprite-start"); //$NON-NLS-0$
				else if(item.Canceled===true)
					dojo.addClass(operationIcon, "core-sprite-stop"); //$NON-NLS-0$
				else if(item.Failed===true)
					dojo.addClass(operationIcon, "core-sprite-error"); //$NON-NLS-0$
				else
					dojo.addClass(operationIcon, "core-sprite-ok"); //$NON-NLS-0$
				
				return col;
				break;
			case 1:
				return this.getActionsColumn(item, tableRow);
				break;
			case 2:
				var result =  this.parseProgressResult(item.Result);
				var message = result.Message || item.Message;
				if(result.DetailedMessage && result.DetailedMessage!=="")
					message += ": " + result.DetailedMessage; //$NON-NLS-0$
				col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
				col.textContent = message;
				return col;
				break;
			case 3:
				if(item.Created && parseInt(item.Created)>0){
					col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
					col.textContent = dojo.date.locale.format( 
							new Date(parseInt(item.Created)),
							{selector: "datetime", formatLength: "medium"}); //$NON-NLS-1$ //$NON-NLS-0$
					return col;
				}
				return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
			}
		};
		
		return OperationsRenderer;
	}());

	return exports;
});