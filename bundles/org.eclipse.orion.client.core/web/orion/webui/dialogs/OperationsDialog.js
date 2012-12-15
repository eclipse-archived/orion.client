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
/*global define*/
/*jslint browser:true*/

define(['i18n!orion/operations/nls/messages', 'require', 'orion/webui/littlelib', 'orion/webui/popupdialog'],
function(messages, require, lib, popupdialog) {
	
	/**
	 * Usage: <code>new OperationsDialog(options).show();</code>
	 * 
	 * @name orion.webui.dialogs.OperationsDialog
	 * @class A dialog that shows running operations.
	 * @param {DOMNode} [options.triggerNode] The node that triggers the dialog.
	 */
	function OperationsDialog(options) {
		this._init(options);
	}
	
	OperationsDialog.prototype = new popupdialog.PopupDialog();

	OperationsDialog.prototype.TEMPLATE = 
		'<table style="width: 360px;"><tr>' + //$NON-NLS-0$
			'<td><h2>Recent operations</h2></td>' + //$NON-NLS-0$
			'<td style="text-align: right;"><a id="allOperationsLink">All Operations</a></td>' + //$NON-NLS-0$
		'</tr></table>' + //$NON-NLS-0$
		'<span id="operationsExist">' + //$NON-NLS-0$
			'<span class="secondaryColumn" id="myOperationsListEmpty">No operations running on this page.</span>' + //$NON-NLS-0$
			'<table id="myOperationsList" style="display: none;"></table>' + //$NON-NLS-0$
		'</span>' + //$NON-NLS-0$
		'<span class="secondaryColumn" id="operationsDontExist">No operations running.</span>'; //$NON-NLS-0$


	OperationsDialog.prototype._init = function(options) {
		this._myOperations = [];
		this._initialize(options.triggerNode);
	};
	
	OperationsDialog.prototype._bindToDom = function(parent) {
		this.$allOperationsLink.href = require.toUrl("operations/list.html"); //$NON-NLS-0$
		this._setOperationsVisibility();
	};

	OperationsDialog.prototype.setOperations = function(operations){
		this._myOperations = [];
		if(operations.Children) {
			for (var i=0; i<operations.Children.length; i++){
				this._myOperations.push(operations.Children[i]);
			}
		}
		this._myOperations.sort(function(op1, op2){return parseInt(op2.Modified) - parseInt(op1.Modified);});
		this._renderOperations();
	};
	
	OperationsDialog.prototype.parseProgressResult = function(message){
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
	
	OperationsDialog.prototype._renderOperations = function(){
		this._renderOperationsTable(this.$myOperationsList, this._myOperations);
	};
	
	OperationsDialog.prototype._renderOperationsTable = function(operationsTable, operations){
		lib.empty(operationsTable);
		for(var i=0; i<operations.length; i++){
			var operation = operations[i];
			var tr = document.createElement("tr"); //$NON-NLS-0$
			var col = document.createElement("td"); //$NON-NLS-0$
			col.style.paddingLeft = "5px;"; //$NON-NLS-0$
			col.style.paddingRight = "5px;"; //$NON-NLS-0$
			col.textContent = operation.Name;
			tr.appendChild(col);
			var div = document.createElement("div"); //$NON-NLS-0$
			col.appendChild(div);
			
			var operationIcon = document.createElement("span"); //$NON-NLS-0$
			div.appendChild(operationIcon);
			operationIcon.classList.add("imageSprite"); //$NON-NLS-0$

			var link = document.createElement("span"); //$NON-NLS-0$
			link.classList.add("primaryColumn"); //$NON-NLS-0$
			div.appendChild(link);
			link.textContent = operation.Name;
			link.appendChild(document.createTextNode(operation.Name));
			
			var result =  this.parseProgressResult(operation.Result);
			switch (result.Severity) {
				case "Warning": //$NON-NLS-0$
					operationIcon.classList.add("core-sprite-warning"); //$NON-NLS-0$
					operationIcon.setAttribute("aria-label", messages["Operation resulted in a warning."]); //$NON-NLS-0$
					break;
				case "Error": //$NON-NLS-0$
					operationIcon.classList.add("core-sprite-error"); //$NON-NLS-0$
					operationIcon.setAttribute("aria-label", messages["Operation resulted in an error."]); //$NON-NLS-0$
					break;
				default:
					if(operation.Running===true) {
						operationIcon.classList.add("core-sprite-start"); //$NON-NLS-0$
						operationIcon.setAttribute("aria-label", messages["Operation is running."]); //$NON-NLS-0$
					}
					else if(operation.Canceled===true) {
						operationIcon.classList.add("core-sprite-stop"); //$NON-NLS-0$
						operationIcon.setAttribute("aria-label", messages["Operation is canceled."]); //$NON-NLS-0$
					}
					else if(operation.Failed===true) {
						operationIcon.classList.add("core-sprite-error"); //$NON-NLS-0$
						operationIcon.setAttribute("aria-label", messages["Operation failed."]); //$NON-NLS-0$
					}
					else {
						operationIcon.classList.add("core-sprite-ok"); //$NON-NLS-0$
						operationIcon.setAttribute("aria-label", "Operation ok."); //$NON-NLS-1$ //$NON-NLS-0$
					}
			}
			
			if(result.Message || operation.Message){
				var message = result.Message || operation.Message;
				if(result.DetailedMessage && result.DetailedMessage!=="") {
					message += ": " + result.DetailedMessage; //$NON-NLS-0$
				}
				div.appendChild(document.createElement("br")); //$NON-NLS-0$
				var span = document.createElement("span"); //$NON-NLS-0$
				span.classList.add("secondaryColumn"); //$NON-NLS-0$
				span.style.marginLeft = "18px;"; //$NON-NLS-0$
				div.appendChild(span);
				span.textContent = message;
			}
			
			operationsTable.appendChild(tr);
		}
		this._setOperationsVisibility();
	};
	
	OperationsDialog.prototype._setOperationsVisibility = function(){			
		this.$myOperationsList.style.display = this._myOperations.length > 0 ? "" : "none"; //$NON-NLS-0$
		this.$myOperationsListEmpty.style.display = this._myOperations.length > 0 ? "none" : ""; //$NON-NLS-0$
		this.$operationsDontExist.style.display = this._myOperations.length > 0 ? "none": ""; //$NON-NLS-0$
		this.$operationsExist.style.display = this._myOperations.length > 0 ? "" : "none"; //$NON-NLS-0$
	};
	
	OperationsDialog.prototype.constructor = OperationsDialog;
	//return the module exports
	return {OperationsDialog: OperationsDialog};

});