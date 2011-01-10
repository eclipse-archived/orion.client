/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global eclipse:true*/
/*jslint*/

var eclipse = eclipse || {};

eclipse.NewItemDialogProvider = (function() {
	/**
	 * @name eclipse.NewItemDialogProvider
	 * @class Code to drive the "new item" dialog.
	 *  FIXME: Replace this class by a real Widget, which will allow reuse of the
	 *  dialog's HTML code
	 */
	function NewItemDialogProvider(
			/**HTMLDivElement*/ itemAdvancedInfo, /**HTMLInputElement*/ itemName, 
			/**HTMLLabelElement*/ itemNameLabel, /**HTMLInputElement*/ itemURL,
			/**dijit.Dialog*/ newItemDialog, /**dijit.form.Textbox*/ protocol,
			/**HTMLInputElement*/ module) {
		this.itemAdvancedInfo = itemAdvancedInfo;
		this.itemName = itemName;
		this.itemNameLabel = itemNameLabel;
		this.itemURL = itemURL;
		this.newItemDialog = newItemDialog;
		this.protocol = protocol;
		this.module = module;
	}
	NewItemDialogProvider.prototype = {
		show: function(title, label, func, advanced) {
			if (this.itemAdvancedInfo) {
				this.itemURL.value = "";
				if (advanced) {
					this.itemAdvancedInfo.style.display = "table-row";
					this.protocol.attr('value', 'file');
					dojo.connect(this.protocol, "onChange", this.onModuleChange);
				} else {
					this.itemAdvancedInfo.style.display = "none";
				}
			}
			this.itemName.value="";		
			var itemName = this.itemName;
			var itemURL = this.itemURL;
			this.itemNameLabel.textContent=label;
			this.newItemDialog.attr('title', title);
			// need to replace the execute handler each time since we reuse this dialog
			this.newItemDialog.execute = dojo.hitch(this, function(){
				var url;
				if(advanced){
					var protocol = this.protocol.attr("value");
					url = (protocol != 'file' ? url = this.protocol.attr("value") + ":/" : "");
					url = url + itemURL.value.replace(/^\s+|\s+$/g, '');
					if(this.module.style.display !== "none"){
						url = url + "?/" + this.module.value.replace(/^\s+|\s+$/g, '');
					}
				}
				func(itemName.value, (url && url !== "") ? url : undefined);
			});
			this.newItemDialog.show();
		},
		onModuleChange : function(evt) {
			if (dijit.byId("protocol").attr("value") === 'gitfs') {
				dojo.byId('moduleLabel').style.display = 'inline-block';
				dojo.byId('module').style.display = 'inline-block';
				dojo.byId('itemURL').style.width = '50%';
			} else {
				dojo.byId('moduleLabel').style.display = 'none';
				dojo.byId('module').style.display = 'none';
				dojo.byId('itemURL').style.width = '86%';
			}
		}
	};
	return NewItemDialogProvider;
}());