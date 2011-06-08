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

define(['dojo', 'orion/commands'], function(dojo, mCommands) {

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
	}
	
	CloneDetails.prototype = {
		loadCloneDetails: function(configPath){
			
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
			
			if (cloneDetails != null){
				
				// clone config
				var tr, col1, col2;
				var tbody = dojo.create("tbody", null, cloneMetaTable);
				
				for (i in cloneDetails.Children) {
					tr = dojo.create("tr");
					col1 = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}, tr, "last");
					dojo.place(document.createTextNode(cloneDetails.Children[i].Key), col1, "only");		
					col2 = dojo.create("td", null, tr, "last");
					dojo.place(document.createTextNode(cloneDetails.Children[i].Value), col2, "only");
					dojo.place(tr, tbody, "last");
				}
			}
			
			dojo.place(cloneMetaTable, this._parent, "only");
		}
	};
	return CloneDetails;
})();
return exports;
});