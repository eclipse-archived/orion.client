/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets define*/
/*jslint browser:true*/

define(['i18n!orion/operations/nls/messages', 'require', 'dojo', 'dijit', 'dijit/TooltipDialog', 'text!orion/widgets/templates/OperationsDialog.html'], function(messages, require, dojo, dijit) {
	
	dojo.declare("orion.widgets.OperationsDialog", [dijit.TooltipDialog], { //$NON-NLS-0$
		widgetsInTemplate: true,
		closable: true,
		templateString: dojo.cache('orion', 'widgets/templates/OperationsDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$

		constructor : function() {
			this.inherited(arguments);
			this.options = arguments[0] || {};
			this._myOperations = [];
		},
		postCreate: function(){
			this.inherited(arguments);
			this.allOperationsLink.href = require.toUrl("operations/list.html"); //$NON-NLS-0$
			this._setOperationsVisibility();
		},
		setOperations: function(operations){
			this._myOperations = [];
			if(operations.Children)
				for(var i=0; i<operations.Children.length; i++){
					this._myOperations.push(operations.Children[i]);
				}
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
			var ret = {Message: status.Message || status, Severity: status.Severity};
			if(status.DetailedMessage && status.DetailedMessage !== ret.Message){
				ret.DetailedMessage = status.DetailedMessage;
			}
			return ret;
		},
		_renderOperations: function(){
			this._renderOperationsTable(this.myOperationsList, this._myOperations);
		},
		_renderOperationsTable: function(operationsTable, operations){
			dojo.empty(operationsTable);
			for(var i=0; i<operations.length; i++){
				var operation = operations[i];
				var tr = dojo.create("tr"); //$NON-NLS-0$
				var col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}, tr); //$NON-NLS-1$ //$NON-NLS-0$
				col.textContent = operation.Name;
				var div = dojo.create("div", null, col, "only"); //$NON-NLS-1$ //$NON-NLS-0$
				var link = dojo.create("span", {className: "primaryColumn"}, div, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				link.textContent = operation.Name;

				dojo.place(document.createTextNode(operation.Name), link, "only"); //$NON-NLS-0$
				
				var operationIcon = dojo.create("span", null, div, "first"); //$NON-NLS-1$ //$NON-NLS-0$
				dojo.addClass(operationIcon, "imageSprite"); //$NON-NLS-0$
				
				var result =  this.parseProgressResult(operation.Result);
				
				
				switch (result.Severity) {
					case "Warning": //$NON-NLS-0$
						dojo.addClass(operationIcon, "core-sprite-warning"); //$NON-NLS-0$
						dojo.attr(operationIcon, "aria-label", messages["Operation resulted in a warning."]); //$NON-NLS-0$
						break;
					case "Error": //$NON-NLS-0$
						dojo.addClass(operationIcon, "core-sprite-error"); //$NON-NLS-0$
						dojo.attr(operationIcon, "aria-label", messages["Operation resulted in an error."]); //$NON-NLS-0$
						break;
					default:
						if(operation.Running===true) {
							dojo.addClass(operationIcon, "core-sprite-start"); //$NON-NLS-0$
							dojo.attr(operationIcon, "aria-label", messages["Operation is running."]); //$NON-NLS-0$
						}
						else if(operation.Canceled===true) {
							dojo.addClass(operationIcon, "core-sprite-stop"); //$NON-NLS-0$
							dojo.attr(operationIcon, "aria-label", messages["Operation is canceled."]); //$NON-NLS-0$
						}
						else if(operation.Failed===true) {
							dojo.addClass(operationIcon, "core-sprite-error"); //$NON-NLS-0$
							dojo.attr(operationIcon, "aria-label", messages["Operation failed."]); //$NON-NLS-0$
						}
						else {
							dojo.addClass(operationIcon, "core-sprite-ok"); //$NON-NLS-0$
							dojo.attr(operationIcon, "aria-label", "Operation ok."); //$NON-NLS-1$ //$NON-NLS-0$
						}
				}
				
				if(result.Message || operation.Message){
					var message = result.Message || operation.Message;
					if(result.DetailedMessage && result.DetailedMessage!=="")
						message += ": " + result.DetailedMessage; //$NON-NLS-0$
					dojo.create("br", null, div, "last"); //$NON-NLS-1$ //$NON-NLS-0$
					var span = dojo.create("span", {className: "secondaryColumn", style: "margin-left: 18px;"}, div, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					span.textContent = message;
				}
				
				dojo.place(tr, operationsTable, "last"); //$NON-NLS-0$
			}
			this._setOperationsVisibility();
		},
		_setOperationsVisibility: function(){			
			this.myOperationsList.style.display = this._myOperations.length > 0 ? "" : "none"; //$NON-NLS-0$
			this.myOperationsListEmpty.style.display = this._myOperations.length > 0 ? "none" : ""; //$NON-NLS-0$
			this.operationsDontExist.style.display = this._myOperations.length > 0 ? "none": ""; //$NON-NLS-0$
			this.operationsExist.style.display = this._myOperations.length > 0 ? "" : "none"; //$NON-NLS-0$
		},
		_onBlur: function(){
			this.inherited(arguments);
			if(dijit.popup.hide)
				dijit.popup.hide(this); //close doesn't work on FF
			dijit.popup.close(this);
		}
	});
});