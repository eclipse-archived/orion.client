/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets*/
/*jslint browser:true*/

define(['require', 'dojo', 'dijit', 'orion/util', 'dijit/TooltipDialog'], function(require, dojo, dijit, mUtil) {
	
	dojo.declare("orion.git.widgets.CommitTooltipDialog", [dijit.TooltipDialog], {
		widgetsInTemplate: false,
		closable: true,

		constructor : function() {
			this.inherited(arguments);
			this.options = arguments[0] || {};
		},
		postCreate: function(){
			this.inherited(arguments);
			this.displayCommit(this.options.commit);
		},
		
		displayCommit: function(commit){
			
			var tableNode = dojo.create( "div", {"style":"padding:10px; max-width:480px"}, this.containerNode);
			
			var commitMessage0 = commit.Message.split(/(\r?\n|$)/)[0];
			link = dojo.create("a", {"class": "gitCommitMessage", href: "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1"}, tableNode);
			dojo.place(document.createTextNode(commitMessage0), link);

			dojo.create( "div", {"style":"padding-top:15px"}, tableNode );
			dojo.create( "span", {"class": "gitCommitDescription", innerHTML: " commit: " + commit.Name}, tableNode );
			if (commit.Parents && commit.Parents.length > 0){
				dojo.create( "div", null, tableNode );
				
				dojo.place(document.createTextNode("parent: "), tableNode);
				link = dojo.create("a", {"class": "gitCommitDescription", href: "/git/git-commit.html#" + commit.Parents[0].Location + "?page=1&pageSize=1"}, tableNode);
				dojo.place(document.createTextNode(commit.Parents[0].Name), link);
			}

			dojo.create( "div", {"style":"padding-top:15px"}, tableNode );
			
			if (commit.AuthorImage) {
				var authorImage = dojo.create("div", {"class":"git-author-icon-small", "style":"margin-bottom:30px"}, tableNode);
				var image = new Image();
				image.src = commit.AuthorImage;
				image.name = commit.AuthorName;
				image.width = 35;
				image.height = 35;
				dojo.place(image, authorImage, "first");
			}
			
			dojo.create( "span", { "class":"plugin-description", 
				innerHTML: " authored by " + commit.AuthorName + " (" + commit.AuthorEmail
				+ ") on " + dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})}, tableNode );
			dojo.create( "div", null, tableNode );
			dojo.create( "span", { "class":"plugin-description", 
				innerHTML: "committed by " + commit.CommitterName  + " (" + commit.CommitterEmail + ")"}, tableNode );
		},
		
		_onBlur: function(){
			this.inherited(arguments);
			if(dijit.popup.hide)
				dijit.popup.hide(this); //close doesn't work on FF
			dijit.popup.close(this);
		}
	});
});