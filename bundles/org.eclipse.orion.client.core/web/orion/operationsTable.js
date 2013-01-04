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
		function OperationsExplorer(registry, selection, operationsClient, parentId, toolbarId, selectionToolsId, actionScopeId) {
			this.parentId = parentId;
			this.registry = registry;
			this.selection = selection;
			this.toolbarId = toolbarId;
			this.selectionToolsId = selectionToolsId;
			this.operationsClient = operationsClient;
			this.actionScopeId = actionScopeId;
			this.renderer = new exports.OperationsRenderer({actionScopeId: this.actionScopeId}, this);
		};

		OperationsExplorer.prototype = new mExplorer.Explorer();
		
		OperationsExplorer.prototype.loadOperations = function(){
			var that = this;
			function displayError(error){
				var display = [];
				display.Severity = "Error"; //$NON-NLS-0$
				display.HTML = false;
				
				try {
					var jsonData = JSON.parse(error);
					display.Message = jsonData.DetailedMessage ? jsonData.DetailedMessage : jsonData.Message;
				} catch (Exception) {
					display.Message = error;
				}
				
				that.serviceRegistry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
			}
			this.operationsClient.getOperations().then(function(operations){
				for(var operationLocation in operations){
					var operation = operations[operationLocation];
					if(operation.expires && new Date().getTime()>operation.expires){
						//operations expired
						operations.remove(operationLocation);
						continue;
					}
					operations[operationLocation].deferred = that.operationsClient.getOperation(operationLocation);
					operations[operationLocation].deferred.then(dojo.hitch(this, function(operationLocation, result){
						operations[operationLocation].operation = operations.operation || {};
						operations[operationLocation].operation.type = "loadend";
						dojo.hitch(that, that.changedItem)(operationLocation);
						}, operationLocation), dojo.hitch(this, function(operationLocation, error){
							operations[operationLocation].operation = operations.operation || {};
							operations[operationLocation].operation.type = "error";
							operations[operationLocation].operation.error = error;
							dojo.hitch(that, that.changedItem)(operationLocation);
						}, operationLocation),  dojo.hitch(this, function(operationLocation, operation){
							operations[operationLocation].operation = operation;
							dojo.hitch(that, that.changedItem)(operationLocation);
						}, operationLocation));
				}
				dojo.hitch(that, that._loadOperationsList)(operations);
			}, displayError);
			
		};
		
		OperationsExplorer.prototype._loadOperationsList = function(operationsList){
			this.operations = operationsList;
			mOperationsCommands.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, this.operations);
			this.model = new exports.OperationsModel(operationsList);
			this.createTree(this.parentId, this.model);
		};
		
		OperationsExplorer.prototype.changedItem = function(location){
			var item = dojo.hitch(this.model, this.model.getItem)(location);
			var row = this.getRow(item);
			dojo.empty(row);
			this.renderer.renderRow(item, row);
		};
		
		return OperationsExplorer;
	}());
	
	exports.OperationsModel = (function(){
		
		function OperationsModel(operations){
			this.operations = operations;
			this.rootId = "operations";
			this.root = {type: "operations"};
		}
		
		OperationsModel.prototype = new mExplorer.ExplorerModel();
		
		OperationsModel.prototype.getRoot = function(onItem){
			onItem(this.root);
		};
		
		OperationsModel.prototype.getItem = function(location){
			var operationInfo = this.operations[location];
			return {Location: location,
				Name: operationInfo.Name,
				deferred: operationInfo.deferred,
				operation: operationInfo.operation};	
		};
		
		OperationsModel.prototype.getChildren = function(parentItem, onComplete){
			if(!parentItem || !parentItem.type==="operations"){
				onComplete([]);
				return;
			}
			var ret = [];
			for(var location in this.operations){
				ret.push(this.getItem(location));
			}
			onComplete(ret);
		};
		
		return OperationsModel;
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
					col = dojo.create("th", {style: "height: 8px;"}); //$NON-NLS-1$ //$NON-NLS-0$
					h2 = dojo.create("h2", null, col); //$NON-NLS-0$
					h2.textContent = messages["Name"];
					return col;
					break;
				case 1:
					col = dojo.create("th", {style: "height: 8px;"}); //$NON-NLS-1$ //$NON-NLS-0$
					h2 = dojo.create("h2", null, col); //$NON-NLS-0$
					h2.textContent = messages["Actions"];
					return col;
					break;
				case 2: 
					col = dojo.create("th", {style: "height: 8px;"}); //$NON-NLS-1$ //$NON-NLS-0$
					h2 = dojo.create("h2", null, col); //$NON-NLS-0$
					h2.textContent = messages["Status"];
					return col;
					break;
				case 3: 
					col = dojo.create("th", {style: "height: 8px;"}); //$NON-NLS-1$ //$NON-NLS-0$
					h2 = dojo.create("h2", null, col); //$NON-NLS-0$
					h2.textContent = messages["Scheduled"];
					return col;
					break;

			}
			
		};
		
		OperationsRenderer.prototype.getCellElement = function(col_no, item, tableRow){
			var col;
			switch(col_no){
			case 0:
				col = dojo.create("td"); //$NON-NLS-1$ //$NON-NLS-0$
				col.textContent = item.Name;
				var div = dojo.create("div", null, col, "only"); //$NON-NLS-1$ //$NON-NLS-0$
				var span = dojo.create("span", null, div, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.addClass(span, "mainNavColumn");
				dojo.place(document.createTextNode(item.Name), span, "only"); //$NON-NLS-0$
				
				var operationIcon = dojo.create("span", null, div, "first"); //$NON-NLS-1$ //$NON-NLS-0$
				dojo.addClass(operationIcon, "imageSprite"); //$NON-NLS-0$
				
				if(item.operation)
					switch(item.operation.type){
					case "Warning": //$NON-NLS-0$ //TODO no warning status
						dojo.addClass(operationIcon, "core-sprite-warning"); //$NON-NLS-0$
						break;
					case "error": //$NON-NLS-0$
						dojo.addClass(operationIcon, "core-sprite-error"); //$NON-NLS-0$
						break;
					case "loadstart":
					case "progress":
						dojo.addClass(operationIcon, "core-sprite-start"); //$NON-NLS-0$
						break;
					case "abort":
						dojo.addClass(operationIcon, "core-sprite-stop"); //$NON-NLS-0$
						break;
					case "load":
					case "loadend":
						dojo.addClass(operationIcon, "core-sprite-ok"); //$NON-NLS-0$
					}
				
				return col;
				break;
			case 1:
				return this.getActionsColumn(item, tableRow);
				break;
			case 2:
				var message = "";
				if(item.operation && item.operation.error && item.operation.error){
					message = item.operation.error.Message || item.operation.error;
					if(item.operation.error.DetailedMessage && item.operation.error.DetailedMessage!=="")
						message += ": " + item.operation.error.DetailedMessage; //$NON-NLS-0$
				}
				col = dojo.create("td"); //$NON-NLS-1$ //$NON-NLS-0$
				col.textContent = message;
				return col;
				break;
			case 3:
				if(item.operation && item.operation.timestamp && parseInt(item.operation.timestamp)>0){
					col = dojo.create("td"); //$NON-NLS-1$ //$NON-NLS-0$
					col.textContent = dojo.date.locale.format( 
							new Date(parseInt(item.operation.timestamp)),
							{selector: "datetime", formatLength: "medium"}); //$NON-NLS-1$ //$NON-NLS-0$
					return col;
				}
				return dojo.create("td"); //$NON-NLS-1$ //$NON-NLS-0$
			}
		};
		
		return OperationsRenderer;
	}());

	return exports;
});