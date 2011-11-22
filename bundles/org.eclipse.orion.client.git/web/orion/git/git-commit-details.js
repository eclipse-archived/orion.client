/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
/*global define window document Image */
/*jslint forin:true*/

define(['require', 'dojo', 'orion/commands'], function(require, dojo, mCommands) {

var exports = {};

exports.CommitDetails = (function() {
	function CommitDetails(options) {
		var parent = options.parent;
		if (typeof(parent) === "string") {
			parent = dojo.byId(parent);
		}
		if (!parent) { throw "no parent"; }
		if (!options.commandService) {throw "no command service"; }
		this.commandService = options.commandService;
		this.linkService = options.linkService;
		this._parent = parent;
		this._detailsPane = options.detailsPane;
		var commitDetails = this;

		var showDiffCommand = new mCommands.Command({
			name: "Show diff",
			tooltip: "Show the diff",
			imageClass: "git-sprite-open_compare",
			spriteClass: "gitCommandSprite",
			id: "eclipse.showDiff",
			hrefCallback: function(item) {
				return require.toUrl("compare/compare.html") +"?readonly#" + item.DiffLocation;
			},
			visibleWhen: function(item) {
				return item.Type === "Diff";
			}
		});		

		// register commands with object scope
		this.commandService.addCommand(showDiffCommand, "object");	
		//commandService.addCommand(doSomething1, "dom");		
		// declare the contribution to the ui
		this.commandService.registerCommandContribution("eclipse.showDiff", 1);	
		//commandService.registerCommandContribution("eclipse.doSomething1", 1, "commitMetaCommands");		
	}
	CommitDetails.prototype = {
		loadCommitDetails: function(commitDetails){
		
			if(this._detailsPane){ //open details pane each time loading new details
				if(!this._detailsPane.isRightPaneOpen()){
					this._detailsPane.toggle();
				}
				this._detailsPane.style.overflow = "hidden";
			}
			this.render(commitDetails);
		},

		render: function(commitDetails) {
						
			// commit details table
			var commitMetaTable = dojo.create("table", {id: "commitMetaTable"});
			dojo.addClass(commitMetaTable, "commitMetaTable");
			
			// heading and commands
			var thead = dojo.create("thead", null, commitMetaTable);
			var row = dojo.create("tr", null, thead);
			var headCol = dojo.create("td",  {colspan: 3}, row);
			dojo.addClass(headCol, "paneHeadingContainer");
			dojo.place("<span class='paneHeading'>Commit details</span>", headCol, "only");
			var commandCol = dojo.create("td", null, row);
			dojo.style(commandCol, "textAlign", "right");
			dojo.addClass(commandCol, "paneHeadingContainer");
			dojo.place("<span id='commitMetaCommands' class='paneHeadingToolbar'></span>", commandCol, "only");
			
			var tr, col1, col2, col3;
			if (commitDetails != null){

				// commit details
				var tbody = dojo.create("tbody", null, commitMetaTable);
				
				tr = dojo.create("tr");
				col1 = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}, tr, "last");
				dojo.place(document.createTextNode("Author"), col1, "only");	
				dojo.place(tr, tbody, "last");
				
				tr = dojo.create("tr");
				if (commitDetails.AuthorImage) {
					col1 = dojo.create("td", {style: "padding: 2px; text-align: right"}, tr, "last");
					var image = new Image();
					image.src = commitDetails.AuthorImage;
					image.name = commitDetails.AuthorName;
					image.width = 40;
					image.height = 40;
					dojo.addClass(image, "gitAuthorImage");
					dojo.place(image, col1, "first");
				}
				
				col2 = dojo.create("td", {style: "padding-left: 5px"}, tr, "last");
				var span = dojo.create("span", null, col2, "last");
				dojo.place(document.createTextNode(commitDetails.AuthorName), span, "only");
				dojo.create("br", null, col2, "last");
				span = dojo.create("span", null, col2, "last");
				dojo.place(document.createTextNode(commitDetails.AuthorEmail), span, "only");
				dojo.place(tr, tbody, "last");
				
				tr = dojo.create("tr");
				col1 = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}, tr, "last");
				dojo.place(document.createTextNode("Committer"), col1, "only");		
				col2 = dojo.create("td", null, tr, "last");
				dojo.place(document.createTextNode(commitDetails.CommitterName + " (" + commitDetails.CommitterEmail + ")"), col2, "only");
				dojo.place(tr, tbody, "last");
				
				tr = dojo.create("tr");
				col1 = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}, tr, "last");
				dojo.place(document.createTextNode("Message"), col1, "only");		
				col2 = dojo.create("td", null, tr, "last");
				var messageNode;
				if (this.linkService) {
					messageNode = this.linkService.addLinks(commitDetails.Message);
				} else {
					messageNode = document.createTextNode(commitDetails.Message);
				}
				dojo.place(messageNode, col2, "only");
				dojo.place(tr, tbody, "last");
				
				tr = dojo.create("tr");
				col1 = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}, tr, "last");
				dojo.place(document.createTextNode("Name"), col1, "only");		
				col2 = dojo.create("td", null, tr, "last");
				dojo.place(document.createTextNode(commitDetails.Name), col2, "only");
				dojo.place(tr, tbody, "last");
			
//			var actionsWrapper = dojo.create("span", {id: tr.id+"actionsWrapper"}, col3, "only");
//			// we must hide/show the span rather than the column.  IE and Chrome will not consider
//			// the mouse as being over the table row if it's in a hidden column
//			dojo.style(actionsWrapper, "visibility", "hidden");
//			commandService.renderCommands(actionsWrapper, "object", commitDetails, this, "tool", false, 0);
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
			}
			
			dojo.place(commitMetaTable, this._parent, "only");
			
			if (commitDetails == null)
				return;
			
			// Now that the table is added to the dom, generate commands
			var commands = dojo.byId("commitMetaCommands");
			this.commandService.renderCommands(commands, "dom", this, this, "tool");
			
			// commit diffs table
			var commitDiffsTable = dojo.create("table", {id: "commitDiffsTable"});
			dojo.addClass(commitDiffsTable, "commitDiffsTable");
			
			// heading and commands
			thead = dojo.create("thead", null, commitDiffsTable);
			row = dojo.create("tr", null, thead);
			headCol = dojo.create("td", {colspan: 3}, row);
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
					
					col1 = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}, tr, "last");
					
					var image = dojo.create("span", null, col1);
					dojo.addClass(image, "gitImageSprite");
					if (diff.ChangeType === "ADD") {
						dojo.addClass(image, "git-sprite-addition");
					} else if (diff.ChangeType === "DELETE") {
						dojo.addClass(image, "git-sprite-removal");
					} else { // "MODIFY"
						dojo.addClass(image, "git-sprite-modification");
					}
					
					col2 = dojo.create("td", null, tr, "last");
					dojo.place(document.createTextNode(diff.ChangeType === "DELETE" ? diff.OldPath : diff.NewPath), col2, "only");		
	
					col3 = dojo.create("td", {id: tr.id+"actions", style: "padding-left: 5px; padding-right: 5px"}, tr, "last");
					dojo.style(col3, "whiteSpace", "nowrap");
					dojo.style(col3, "textAlign", "right");
					
					var actionsWrapper = dojo.create("span", {id: tr.id+"actionsWrapper"}, col3, "only");
					// we must hide/show the span rather than the column.  IE and Chrome will not consider
					// the mouse as being over the table row if it's in a hidden column
					dojo.style(actionsWrapper, "visibility", "hidden");
					this.commandService.renderCommands(actionsWrapper, "object", commitDetails.Diffs[j], this, "tool", false, j);
					
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
			
			dojo.place(commitDiffsTable, this._parent);
			
			// Now that the table is added to the dom, generate commands
			commands = dojo.byId("commitDiffsCommands");
			this.commandService.renderCommands(commands, "dom", this, this, "tool");
		}
	};
	return CommitDetails;
}());
return exports;
});