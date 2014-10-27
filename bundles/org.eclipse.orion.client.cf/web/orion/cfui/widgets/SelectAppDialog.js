/*******************************************************************************
 * @license
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2011, 2014. All Rights Reserved. 
 * 
 * Note to U.S. Government Users Restricted Rights:  Use, 
 * duplication or disclosure restricted by GSA ADP Schedule 
 * Contract with IBM Corp.
 *******************************************************************************/
/*global dojo dijit eclipse widgets define */
/*eslint-env browser*/

define(['i18n!cfui/nls/messages', 'orion/uiUtils', 'orion/explorers/explorer', 'orion/webui/dialog', 'orion/selection', 'orion/commands', 'orion/commandRegistry'], 
        function(messages, mUtil, mExplorer, dialog, mSelection, mCommands, mCommandRegistry) {

	function SelectAppDialogRenderer (options, explorer) {
		this.explorer = explorer;
		this._init(options);
	}
	SelectAppDialogRenderer.prototype = new mExplorer.SelectionRenderer(); 
	SelectAppDialogRenderer.prototype.constructor = SelectAppDialogRenderer;
	SelectAppDialogRenderer.prototype.getLabelColumnIndex = function() {
		return 0;
	};
	SelectAppDialogRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		var col = document.createElement("td"); //$NON-NLS-0$
		tableRow.appendChild(col);
		var span = document.createElement("span"); //$NON-NLS-0$
		span.id = tableRow.id+"navSpan"; //$NON-NLS-0$
		col.appendChild(span);
		span.className = "mainNavColumn singleNavColumn"; //$NON-NLS-0$
		if (item instanceof Array){
			this.getExpandImage(tableRow, span);
			span.appendChild(document.createTextNode(messages["root"]));
		} else {
			span.appendChild(document.createTextNode(item.Name)); 
		}
	};


	/**
	* @param options {{
			func : function(item) Function to be called with the selected item
			title : String (Optional) Dialog title
			apps: Applications
			serviceRegistry: Service Registry
		}}
	 */
 
 	function SelectAppDialog(options) {
		this._init(options);
	}
	
	SelectAppDialog.prototype = new dialog.Dialog();

	SelectAppDialog.prototype.TEMPLATE = 
		'<div id="message" style="width: 25em; padding-bottom: 5px;"></div>' + //$NON-NLS-0$
		'<div id="createArea" style="width: 25em; padding-bottom: 5px;"></div>' + //$NON-NLS-0$
		'<div id="appsTree" class="explorerTreeClass" style="width:30em; min-height: 25em; max-height:30em; height: auto; overflow-y: auto;"></div>'; //$NON-NLS-0$
	
	SelectAppDialog.prototype._init = function(options) {
		this.title = options.title || messages["selectProjectToAdd"];
		this._serviceRegistry = options.serviceRegistry;
		this.cfClient = options.cfClient;
		this.commandService = options.commandRegistry;
		this.modal = true;
		this.buttons = [{id: "okbutton", text: messages["oK"], callback: this.done.bind(this)}];
		this._func = options.func;
		this.apps = options.apps;
		this._initialize();
	};
	
	SelectAppDialog.prototype._bindToDom = function(parent) {
		this.loadApps(this.apps);	// workspace root
		if (this._message) {
			this.$message.appendChild(document.createTextNode(this._message));
		} else {
			this.$message.style.display = "none"; //$NON-NLS-0$
		}
		this.$appsTree.focus();
	};
	
	
	SelectAppDialog.prototype.loadApps = function(item) {
		var progressService = this._serviceRegistry.getService("orion.page.progress");
		var myTreeModel = new mExplorer.ExplorerModel();
		
		myTreeModel.cfClient = this.cfClient;
		myTreeModel.root = item;
		
		myTreeModel.getRoot = function(onItem){
			onItem(this.root);
		};
		
		myTreeModel.getId = function(/* item */ item){
			if (item.Guid) {
				var result = item.Guid;
				// remove all non valid chars to make a dom id. 
				return result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
			}

			return "root";
		};
		
		myTreeModel.mayHaveChildren = function(/* dojo.data.Item */ parentItem){
			return false;
		};
		
		myTreeModel.getChildren = function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
			if (parentItem instanceof Array) {
				onComplete(parentItem);
			} else {
				onComplete([]);
			}
		};
		
		this.createExplorer(myTreeModel);
	};
	
	SelectAppDialog.prototype.createExplorer = function(myTreeModel){
		var self = this;
		if(this.canCreate){
			this.commandService.renderCommands(this.$createArea.id, this.$createArea, {}, this, "tool");
		}
		
		this.selection = new mSelection.Selection(this._serviceRegistry, "orion.cf.SelectApp.selection"); //$NON-NLS-0$
		
		this.selection.addEventListener("selectionChanged", self.validate.bind(self));

		this.explorer = new mExplorer.Explorer(this._serviceRegistry, this.selection); //$NON-NLS-0$
		this.explorer.renderer = new SelectAppDialogRenderer({checkbox: false, singleSelection: true, treeTableClass: "directoryPrompter" }, this.explorer);
		
		this.explorer.createTree(this.$appsTree.id, myTreeModel, {setFocus: true, selectionPolicy: this.explorer.renderer.selectionPolicy, onCollapse: function(model){if(self.getNavHandler()){self.getNavHandler().onCollapse(model);}}});
	};
	
	SelectAppDialog.prototype.validate = function(){
		var self = this;
		this.selection.getSelection(function(selection) {
			if(selection===null){
				self.$okbutton.classList.add(this.DISABLED);
				return;
			}
			self.$okbutton.classList.remove(this.DISABLED);
		});
	};
	
	SelectAppDialog.prototype.done = function() {
		this.selection.getSelection(function(selection) {
			this.hide();
			this._func(selection);
		}.bind(this));
	};
	
	SelectAppDialog.prototype.constructor = SelectAppDialog;
	
	//return the module exports
	return {SelectAppDialog: SelectAppDialog};

});