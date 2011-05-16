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

var eclipse = eclipse || {};

eclipse.CommitDetails = (function() {
	function CommitDetails(options) {
		var parent = options.parent;
		if (typeof(parent) === "string") {
			parent = dojo.byId(parent);
		}
		if (!parent) { throw "no parent"; }
		if (!options.serviceRegistry) {throw "no service registry"; }
		this._parent = parent;
		this._registry = options.serviceRegistry;
		var commitDetails = this;
	
		var doSomething1 = new eclipse.Command({
			name: "Do Something 1",
			tooltip: "Do Something 1",
			image: "images/add_obj.gif",
			id: "eclipse.doSomething1",
			callback: function(item) {console.info("clicked");}
		});		
		var doSomething2 = new eclipse.Command({
			name: "Do Something 2",
			tooltip: "Do Something 2",
			image: "images/add_obj.gif",
			id: "eclipse.doSomething2",
			callback: function(item) {console.info("clicked");}
		});		

		this._registry.getService("ICommandService").then(function(commandService) {
			// register commands with object scope
//			commandService.addCommand(doSomething2, "object");	
//			commandService.addCommand(doSomething1, "dom");		
			// declare the contribution to the ui
//			commandService.registerCommandContribution("eclipse.doSomething2", 1);	
//			commandService.registerCommandContribution("eclipse.doSomething1", 1, "commitDetailsCommands");		

		});

		//commitDetails.render();
	}
	CommitDetails.prototype = {
		loadCommitDetails: function(commitDetails){
			this.render(commitDetails);
		},

		render: function(commitDetails) {
						
			// favorites table
			var faveTable = dojo.create("table", {id: "faveTable"});
			dojo.addClass(faveTable, "favoritesTable");
			
			// heading and commands
			var thead = dojo.create("thead", null, faveTable);
			var row = dojo.create("tr", null, thead);
			var headCol = dojo.create("td", null, row);
			dojo.addClass(headCol, "paneHeadingContainer");
			dojo.place("<span class='paneHeading'>Commit details</span>", headCol, "only");
			var commandCol = dojo.create("td", null, row);
			dojo.style(commandCol, "textAlign", "right");
			dojo.addClass(commandCol, "paneHeadingContainer");
			dojo.place("<span id='commitDetailsCommands' class='paneHeadingToolbar'></span>", commandCol, "only");
			
			// favorites
			var tr, col1, col2;
			var tbody = dojo.create("tbody", null, faveTable);
			
			var tr = dojo.create("tr");
			var col1 = dojo.create("td", null, tr, "last");
			dojo.place(document.createTextNode("Author"), col1, "only");		
			var col2 = dojo.create("td", null, tr, "last");
			dojo.place(document.createTextNode(commitDetails.AuthorName), col2, "only");
			dojo.place(tr, tbody, "last");
			var col3 = dojo.create("td", {id: tr.id+"actions"}, tr, "last");
			dojo.style(col3, "whiteSpace", "nowrap");
			dojo.style(col3, "textAlign", "right");
			
			tr = dojo.create("tr");
			col1 = dojo.create("td", null, tr, "last");
			dojo.place(document.createTextNode("Message"), col1, "only");		
			col2 = dojo.create("td", null, tr, "last");
			dojo.place(document.createTextNode(commitDetails.Message), col2, "only");
			dojo.place(tr, tbody, "last");
			col3 = dojo.create("td", {id: tr.id+"actions"}, tr, "last");
			dojo.style(col3, "whiteSpace", "nowrap");
			dojo.style(col3, "textAlign", "right");
			
			tr = dojo.create("tr");
			col1 = dojo.create("td", null, tr, "last");
			dojo.place(document.createTextNode("Name"), col1, "only");		
			col2 = dojo.create("td", null, tr, "last");
			dojo.place(document.createTextNode(commitDetails.Name), col2, "only");
			dojo.place(tr, tbody, "last");
			col3 = dojo.create("td", {id: tr.id+"actions"}, tr, "last");
			dojo.style(col3, "whiteSpace", "nowrap");
			dojo.style(col3, "textAlign", "right");
			
			var actionsWrapper = dojo.create("span", {id: tr.id+"actionsWrapper"}, col3, "only");
			// we must hide/show the span rather than the column.  IE and Chrome will not consider
			// the mouse as being over the table row if it's in a hidden column
			dojo.style(actionsWrapper, "visibility", "hidden");
//			this._registry.getService("ICommandService").then(function(service) {
//				service.renderCommands(actionsWrapper, "object", commitDetails, this, "image", null, 0);
//			});
			
			dojo.connect(tr, "onmouseover", tr, function() {
				var wrapper = dojo.byId(this.id+"actionsWrapper");
				dojo.style(wrapper, "visibility", "visible");
			});
			
			dojo.connect(tr, "onmouseout", tr, function() {
				var wrapper = dojo.byId(this.id+"actionsWrapper");
				dojo.style(wrapper, "visibility", "hidden");
			});

			dojo.place(faveTable, this._parent, "only");
			// Now that the table is added to the dom, generate commands
			var commands = dojo.byId("commitDetailsCommands");
			this._registry.getService("ICommandService").then(function(service) {
				service.renderCommands(commands, "dom", this, this, "image");
			});
		}
	};
	return CommitDetails;
})();
