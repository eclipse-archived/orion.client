/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
/*global dijit dojo window document eclipse:true setTimeout */
/*jslint forin:true*/

define(['dojo', 'orion/commands',  'orion/util'], function(dojo, mCommands, mUtil) {

var exports = {};

exports.CloneDetails = (function() {
	function CloneDetails(options) {
		var parent = options.parent;
		if (typeof(parent) === "string") {
			parent = dojo.byId(parent);
		}
		if (!parent) { throw "no parent"; }
		if (!options.serviceRegistry) {throw "no service registry"; }
		this._parent = parent;
		this._registry = options.serviceRegistry;
		this._detailsPane = options.detailsPane;
		
		var addPropertyCommand = new mCommands.Command({
			name: "Add Configuration Item",
			image: "/images/add.gif",
			id: "eclipse.git.addProperty",
			callback: dojo.hitch(this, function(item, commandId, domId) {
				this.newProperty(item, commandId, domId);
			})
		});
		
		var editPropertyCommand = new mCommands.Command({
			name: "Edit",
			image: "/images/edit.gif",
			id: "eclipse.git.editProperty",
			visibleWhen: function(item) {
				return (item.Key && item.Value && item.Location);
				},
			callback: dojo.hitch(this, function(item, commandId, domId, propertyIndex) {
				this.editProperty(item, commandId, domId, propertyIndex);
			})
		});
		
		var deletePropertyCommand = new mCommands.Command({
			name: "Delete",
			image: "/images/delete.gif",
			id: "eclipse.git.deleteProperty",
			visibleWhen: function(item) {
				return (item.Key && item.Value && item.Location);
				},
			callback: dojo.hitch(this, function(item, commandId, domId, propertyIndex) {
				this.deleteProperty(item, commandId, domId, propertyIndex);
			})
		});
		
		this._registry.getService("orion.page.command").then(function(commandService) {
			// register commands with object scope
			commandService.addCommand(editPropertyCommand, "object");
			commandService.addCommand(deletePropertyCommand, "object");
			commandService.addCommand(addPropertyCommand, "dom");
			// declare the contribution to the ui
			commandService.registerCommandContribution("eclipse.git.editProperty", 1);
			commandService.registerCommandContribution("eclipse.git.deleteProperty", 2);
			commandService.registerCommandContribution("eclipse.git.addProperty", 1, "configurationCommands");
		});
		

	}
	
	CloneDetails.prototype = {
		loadCloneDetails: function(configPath){
		
			this.configPath = configPath;
			
			if(this._detailsPane){ //open details pane each time loading new details
				if(!this._detailsPane.isRightPaneOpen()){
					this._detailsPane.toggle();
				}
				this._detailsPane.style.overflow = "hidden";
			}
			
			var self = this;
			this._registry.getService("orion.git.provider").then(function(service) {
				service.getGitCloneConfig(configPath).then(function(item) { 
					self.render(item); 
				});
			});
		},
		
		reportError: function(errorJson){
			this._registry.getService("orion.page.message").then(function(progressService){
					var display = [];
					display.Severity = "Error";
					var resp = JSON.parse( errorJson.responseText );
					display.Message = resp.Message ? resp.Message : errorJson.responseText;
					progressService.setProgressResult(display);
			});
		},
		
		newProperty: function(item, commandId, domId){
			var newPropertyKey = dojo.byId("propertyKeyNew");
			var newPropertyVal = dojo.byId("propertyValueNew");
			var self = this;
			
			mUtil.getUserText("propertyKeyNewEditBox", newPropertyKey, true, "", 
				function(newKeyText) {
					var tempSpan = dojo.create("span", {id: "newKeyNode"}, newPropertyKey.parentNode, "last");
					dojo.place(document.createTextNode(newKeyText), tempSpan, "only");					
					mUtil.getUserText("propertyValueNewEditBox", newPropertyVal, true, "", 
						function(newValueText) {
							self._registry.getService("orion.git.provider").then(function(gitService) {
								gitService.addCloneConfigurationProperty(self.configPath, newKeyText, newValueText).then(function(jsonData){
									dojo.hitch(self, self.loadCloneDetails)(self.configPath);
								},
								function(errorJson){dojo.hitch(self, self.reportError)(errorJson);});
							});
						}, 
						function() {
							newPropertyKey.parentNode.removeChild(tempSpan);
						});

				}, 
				function() {
				});
		},
		
		editProperty: function(item, commandId, imageId, propertyIndex){
			var propertySpan = dojo.byId("propertyValue"+propertyIndex);
			var registry = this._registry;
			var self = this;
			
			// hide command buttons while editor is up
			var commandParent = propertySpan.parentNode;
			dojo.style(propertySpan, "display", "none");
			
			mUtil.getUserText("propertyValue"+propertyIndex+"EditBox", propertySpan, true, item.Value, 
				function(newText) {
					registry.getService("orion.git.provider").then(function(gitService) {
						gitService.editCloneConfigurationProperty(item.Location, newText).then(function(jsonData){
							propertySpan.innerHTML = newText;
						},
						function(errorJson){dojo.hitch(self, self.reportError)(errorJson);});
					});
				}, 
				function() {
					// re-show
					dojo.style(propertySpan, "display", "inline");
				});
			
		},
		
		deleteProperty: function(item, commandId, imageId, propertyIndex){
			var propertyRow = dojo.byId("property"+propertyIndex);
			var self = this;
			
			if(confirm("Do you really want to delete " + item.Key + "?")){
					this._registry.getService("orion.git.provider").then(function(gitService) {
						gitService.deleteCloneConfigurationProperty(item.Location).then(function(jsonData){
							dojo.style(propertyRow, "display", "none");
						},
						function(errorJson){dojo.hitch(self, self.reportError)(errorJson);});
					});
			}
			
		},

		render: function(cloneDetails) {
						
			// clone details table
			var cloneMetaTable = dojo.create("table", {id: "cloneMetaTable"});
			dojo.addClass(cloneMetaTable, "cloneMetaTable");
			
			// heading
			var thead = dojo.create("thead", null, cloneMetaTable);
			var row = dojo.create("tr", null, thead);
			var headCol = dojo.create("td",  {colspan: 2}, row);
			dojo.addClass(headCol, "paneHeadingContainer");
			dojo.place("<span class='paneHeading'>Repository configuration</span>", headCol, "only");

			var commandCol = dojo.create("td", null, row);
			dojo.style(commandCol, "textAlign", "right");
			dojo.addClass(commandCol, "paneHeadingContainer");
			dojo.place("<span id='configurationCommands' class='paneHeadingToolbar'></span>", commandCol, "only");
			
			if (cloneDetails != null){
				
				// clone config
				var tr, col1, col2, col3;
				var tbody = dojo.create("tbody", null, cloneMetaTable);
				
				for (i in cloneDetails.Children) {
					tr = dojo.create("tr");
					tr.id = "property"+i;
					col1 = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}, tr, "last");
					dojo.place(document.createTextNode(cloneDetails.Children[i].Key), col1, "only");		
					col2 = dojo.create("td", null, tr, "last");
					var propertyValueSpan = dojo.create("span", {id: "propertyValue"+i}, col2, "only");
					dojo.place(document.createTextNode(cloneDetails.Children[i].Value), propertyValueSpan, "only");
					dojo.place(tr, tbody, "last");
					
					col3 = dojo.create("td", null, tr, "last");
					var actionsWrapper = dojo.create("span", {id: tr.id+"actionsWrapper"}, col3, "only");
					// we must hide/show the span rather than the column.  IE and Chrome will not consider
					// the mouse as being over the table row if it's in a hidden column
					dojo.style(actionsWrapper, "visibility", "hidden");
					this._registry.getService("orion.page.command").then(function(service) {
						service.renderCommands(actionsWrapper, "object", cloneDetails.Children[i], this, "image", null, i);
					});
					
					dojo.connect(tr, "onmouseover", tr, function() {
						var wrapper = dojo.byId(this.id+"actionsWrapper");
						dojo.style(wrapper, "visibility", "visible");
					});
					
					dojo.connect(tr, "onmouseout", tr, function() {
						var wrapper = dojo.byId(this.id+"actionsWrapper");
						dojo.style(wrapper, "visibility", "hidden");
					});
					
					dojo.place(tr, tbody, "last");
					
				}
				
				tr = dojo.create("tr", {id: "propertyNew"});
				col1 = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}, tr, "last");
				dojo.create("span", {id: "propertyKeyNew", innerHTML: "&nbsp;"}, col1, "last");
				col2 = dojo.create("td", null, tr, "last");
				dojo.create("span", {id: "propertyValueNew", innerHTML: "&nbsp;"}, col2, "last");
				col3 = dojo.create("td", {innerHTML: "&nbsp;"}, tr, "last");
				dojo.place(tr, tbody, "last");
				
			}
			
			dojo.place(cloneMetaTable, this._parent, "only");
			
			var commands = dojo.byId("configurationCommands");
				this._registry.getService("orion.page.command").then(function(service) {
					service.renderCommands(commands, "dom", this, this, "image");
				});
		}
	};
	return CloneDetails;
})();
return exports;
});