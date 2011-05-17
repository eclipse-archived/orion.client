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
			commandService.addCommand(doSomething2, "object");	
			//commandService.addCommand(doSomething1, "dom");		
			// declare the contribution to the ui
			commandService.registerCommandContribution("eclipse.doSomething2", 1);	
			//commandService.registerCommandContribution("eclipse.doSomething1", 1, "commitDetailsCommands");		
		});
	}
	CommitDetails.prototype = {
		loadCommitDetails: function(commitDetails){
			this.render(commitDetails);
		},

		render: function(commitDetails) {
						
			// commit details table
			var commitDetailsTable = dojo.create("table", {id: "commitDetailsTable"});
			dojo.addClass(commitDetailsTable, "commitDetailsTable");
			
			// heading and commands
			var thead = dojo.create("thead", null, commitDetailsTable);
			var row = dojo.create("tr", null, thead);
			var headCol = dojo.create("td", null, row);
			dojo.addClass(headCol, "paneHeadingContainer");
			dojo.place("<span class='paneHeading'>Commit details</span>", headCol, "only");
			var commandCol = dojo.create("td", null, row);
			dojo.style(commandCol, "textAlign", "right");
			dojo.addClass(commandCol, "paneHeadingContainer");
			dojo.place("<span id='commitDetailsCommands' class='paneHeadingToolbar'></span>", commandCol, "only");
			
			// commit details
			var tr, col1, col2;
			var tbody = dojo.create("tbody", null, commitDetailsTable);
			
			var tr = dojo.create("tr");
			var col1 = dojo.create("td", null, tr, "last");
			dojo.place(document.createTextNode("Author"), col1, "only");		
			var col2 = dojo.create("td", null, tr, "last");
			dojo.place(document.createTextNode(commitDetails.AuthorName + " (" + commitDetails.AuthorEmail + ")"), col2, "only");
			dojo.place(tr, tbody, "last");
			var col3 = dojo.create("td", {id: tr.id+"actions"}, tr, "last");
			dojo.style(col3, "whiteSpace", "nowrap");
			dojo.style(col3, "textAlign", "right");
			
			tr = dojo.create("tr");
			col1 = dojo.create("td", null, tr, "last");
			dojo.place(document.createTextNode("Committer"), col1, "only");		
			col2 = dojo.create("td", null, tr, "last");
			dojo.place(document.createTextNode(commitDetails.CommitterName + " (" + commitDetails.CommitterEmail + ")"), col2, "only");
			dojo.place(tr, tbody, "last");
			col3 = dojo.create("td", {id: tr.id+"actions"}, tr, "last");
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
			
//			var actionsWrapper = dojo.create("span", {id: tr.id+"actionsWrapper"}, col3, "only");
//			// we must hide/show the span rather than the column.  IE and Chrome will not consider
//			// the mouse as being over the table row if it's in a hidden column
//			dojo.style(actionsWrapper, "visibility", "hidden");
//			this._registry.getService("ICommandService").then(function(service) {
//				service.renderCommands(actionsWrapper, "object", commitDetails, this, "image", null, 0);
//			});
//			
//			dojo.connect(tr, "onmouseover", tr, function() {
//				var wrapper = dojo.byId(this.id+"actionsWrapper");
//				dojo.style(wrapper, "visibility", "visible");
//			});
//			
//			dojo.connect(tr, "onmouseout", tr, function() {
//				var wrapper = dojo.byId(this.id+"actionsWrapper");
//				dojo.style(wrapper, "visibility", "hidden");
//			});

			dojo.place(commitDetailsTable, this._parent, "only");
			// Now that the table is added to the dom, generate commands
			var commands = dojo.byId("commitDetailsCommands");
			this._registry.getService("ICommandService").then(function(service) {
				service.renderCommands(commands, "dom", this, this, "image");
			});
			
			// commit diffs table
			var commitDiffsTable = dojo.create("table", {id: "commitDiffsTable"});
			dojo.addClass(commitDiffsTable, "commitDiffsTable");
			
			// heading and commands
			thead = dojo.create("thead", null, commitDiffsTable);
			row = dojo.create("tr", null, thead);
			headCol = dojo.create("td", null, row);
			dojo.addClass(headCol, "paneHeadingContainer");
			dojo.place("<span class='paneHeading'>Commit diffs</span>", headCol, "only");
			commandCol = dojo.create("td", null, row);
			dojo.style(commandCol, "textAlign", "right");
			dojo.addClass(commandCol, "paneHeadingContainer");
			dojo.place("<span id='commitDiffsCommands' class='paneHeadingToolbar'></span>", commandCol, "only");
			
			// commit details
			tbody = dojo.create("tbody", null, commitDiffsTable);
			
			if (commitDetails.Diffs != null)
				for (var j=0; j < commitDetails.Diffs.length; j++) {
					var diff = commitDetails.Diffs[j];
					
					var id = "commitDiff" + j;
					
					tr = dojo.create("tr");
					tr.id = "row"+id;
					
					col1 = dojo.create("td", null, tr, "last");
					
					if (diff.ChangeType === "ADD")
						img = dojo.create("img", {src: "/images/git/git-added.gif"}, col1);
					else if (diff.ChangeType === "DELETE")
						img = dojo.create("img", {src: "/images/git/git-removed.gif"}, col1);
					else if (diff.ChangeType === "MODIFY")
						img = dojo.create("img", {src: "/images/git/git-modify.gif"}, col1);
					
					col2 = dojo.create("td", null, tr, "last");
					dojo.place(document.createTextNode(diff.ChangeType === "DELETE" ? diff.OldPath : diff.NewPath), col2, "only");		
	
					col3 = dojo.create("td", {id: tr.id+"actions"}, tr, "last");
					dojo.style(col3, "whiteSpace", "nowrap");
					dojo.style(col3, "textAlign", "right");
					
//					var actionsWrapper = dojo.create("span", {id: tr.id+"actionsWrapper"}, col3, "only");
//					// we must hide/show the span rather than the column.  IE and Chrome will not consider
//					// the mouse as being over the table row if it's in a hidden column
//					dojo.style(actionsWrapper, "visibility", "hidden");
//					this._registry.getService("ICommandService").then(function(service) {
//						service.renderCommands(actionsWrapper, "object", commitDetails.Diffs[j], this, "image", null, j);
//					});
//					
//					dojo.connect(tr, "onmouseover", tr, function() {
//						var wrapper = dojo.byId(this.id+"actionsWrapper");
//						dojo.style(wrapper, "visibility", "visible");
//					});
//					
//					dojo.connect(tr, "onmouseout", tr, function() {
//						var wrapper = dojo.byId(this.id+"actionsWrapper");
//						dojo.style(wrapper, "visibility", "hidden");
//					});
					
					dojo.place(tr, tbody, "last");
				}
			
			dojo.place(commitDiffsTable, this._parent);
			
			// Now that the table is added to the dom, generate commands
			var commands = dojo.byId("commitDiffsCommands");
			this._registry.getService("ICommandService").then(function(service) {
				service.renderCommands(commands, "dom", this, this, "image");
			});
		}
	};
	return CommitDetails;
})();
