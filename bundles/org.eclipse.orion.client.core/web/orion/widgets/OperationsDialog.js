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

define(['require', 'dojo', 'dijit', 'orion/util', 'dijit/TooltipDialog', 'text!orion/widgets/templates/OperationsDialog.html'], function(require, dojo, dijit, mUtil) {
	
	dojo.declare("orion.widgets.OperationsDialog", [dijit.TooltipDialog], {
		widgetsInTemplate: true,
		closable: true,
		templateString: dojo.cache('orion', 'widgets/templates/OperationsDialog.html'),

		constructor : function() {
			this.inherited(arguments);
			this.options = arguments[0] || {};
			this._operations = [];
			this._myOperations = [];
		},
		postCreate: function(){
			this.inherited(arguments);
			this.allOperationsLink.href = require.toUrl("operations/list.html");
			this._setOperationsVisibility();
		},
		setOperations: function(operations, myOperations){
			this._operations = [];
			myOperations = myOperations || {};
			this._myOperations = [];
			for(var i=0; i<operations.Children.length; i++){
				if(myOperations[operations.Children[i].Id]){
					this._myOperations.push(operations.Children[i]);
				} else {
					this._operations.push(operations.Children[i]);
				}
			}
			this._operations.sort(function(op1, op2){return parseInt(op2.Modified) - parseInt(op1.Modified);});
			this._myOperations.sort(function(op1, op2){return parseInt(op2.Modified) - parseInt(op1.Modified);});
			this._renderOperations();
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
		_renderOperations: function(){
			this._renderOperationsTable(this.myOperationsList, this._myOperations);
			this._renderOperationsTable(this.operationsList, this._operations);
		},
		_renderOperationsTable: function(operationsTable, operations){
			dojo.empty(operationsTable);
			for(var i=0; i<operations.length; i++){
				var operation = operations[i];
				var tr = dojo.create("tr");
				var col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: operation.Name}, tr);
				var div = dojo.create("div", null, col, "only");
				link = dojo.create("span", {innerHTML: operation.Name, className: "primaryColumn"}, div, "last");

				dojo.place(document.createTextNode(operation.Name), link, "only");
				
				var operationIcon = dojo.create("span", null, div, "first");
				dojo.addClass(operationIcon, "imageSprite");
				
				var result =  this.parseProgressResult(operation.Result);
				
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
				
				if(operation.Running===true)
					dojo.addClass(operationIcon, "core-sprite-start");
				else if(operation.Canceled===true)
					dojo.addClass(operationIcon, "core-sprite-stop");
				else if(operation.Failed===true)
					dojo.addClass(operationIcon, "core-sprite-error");
				else
					dojo.addClass(operationIcon, "core-sprite-ok");
				
				if(result.Message || operation.Message){
					dojo.create("br", null, div, "last");
					dojo.create("span", {className: "secondaryColumn", style: "margin-left: 18px;", innerHTML: result.Message || operation.Message}, div, "last");
					
				}
				
				dojo.place(tr, operationsTable, "last");
			}
			this._setOperationsVisibility();
		},
		_setOperationsVisibility: function(){			
			this.operationsList.style.display = this._operations.length > 0 ? "" : "none";
			this.otherOperations.style.display  = this._operations.length > 0 ? "" : "none";
			this.myOperationsList.style.display = this._myOperations.length > 0 ? "" : "none";
			this.myOperationsListEmpty.style.display = this._myOperations.length > 0 ? "none" : "";
			this.operationsDontExist.style.display = this._operations.length + this._myOperations.length > 0 ? "none": "";
			this.operationsExist.style.display = this._operations.length + this._myOperations.length > 0 ? "" : "none";
		},
		_onBlur: function(){
			this.inherited(arguments);
			if(dijit.popup.hide)
				dijit.popup.hide(this); //close doesn't work on FF
			dijit.popup.close(this);
		}
	});
});