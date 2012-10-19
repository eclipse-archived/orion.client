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

define(['i18n!git/nls/gitmessages', 'require', 'dojo', 'dijit', 'dijit/TooltipDialog', 'dojo/date/locale'], function(messages, require, dojo, dijit) {
	
	dojo.declare("orion.git.widgets.CommitTooltipDialog", [dijit.TooltipDialog], { //$NON-NLS-0$
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
			var tableNode = dojo.create( "div", {"style":"padding:10px; max-width:520px"}, this.containerNode); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			var commitMessage0 = commit.Message.split(/(\r?\n|$)/)[0];
			var link = dojo.create("a", {"class": "gitMainDescription", href: "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1"}, tableNode); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.place(document.createTextNode(commitMessage0), link);

			dojo.create( "div", {"style":"padding-top:15px"}, tableNode ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var imageDiv = dojo.create("div", {"style":"display: inline-block; vertical-align:text-top;"}, tableNode);
			var textDiv = dojo.create("div", {"style":"display: inline-block; vertical-align:text-top;"}, tableNode);

			if (commit.AuthorImage) {
				var authorImage = dojo.create("div", {"class":"git-author-icon-small"}, imageDiv); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				var image = new Image();
				image.src = commit.AuthorImage;
				image.name = commit.AuthorName;
				image.width = 35;
				image.height = 35;
				dojo.place(image, authorImage, "first"); //$NON-NLS-0$
			}

			var authoredBySpan = dojo.create( "span", { "class":"gitSecondaryDescription" }, textDiv ); //$NON-NLS-1$ //$NON-NLS-0$
			authoredBySpan.textContent = dojo.string.substitute(messages[" authored by ${0} {${1}) on ${2}"], [commit.AuthorName, commit.AuthorEmail,
				 dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})]);  //$NON-NLS-0$
			dojo.create( "div", null, textDiv ); //$NON-NLS-0$
			var committedBySpan = dojo.create( "span", { "class":"gitSecondaryDescription" }, textDiv );  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			committedBySpan.textContent = dojo.string.substitute(messages['committed by 0 (1)'], [commit.CommitterName, commit.CommitterEmail]);

			dojo.create( "div", {"style":"padding-top:15px"}, textDiv ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			var commitNameSpan = dojo.create( "span", {"class": "gitSecondaryDescription"}, textDiv ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commitNameSpan.textContent = messages[" commit: "] + commit.Name;
			if (commit.Parents && commit.Parents.length > 0){
				dojo.create( "div", null, textDiv ); //$NON-NLS-0$
				
				link = dojo.create("a", {"class": "gitSecondaryDescription", href: "/git/git-commit.html#" + commit.Parents[0].Location + "?page=1&pageSize=1"}, textDiv); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.place(document.createTextNode(commit.Parents[0].Name), link);
				
				var parentNode = dojo.create( "span", { "class":"gitSecondaryDescription" }, textDiv ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				parentNode.textContent = messages["parent: "];
				
				dojo.place(link, parentNode, "last");
			}
			
			var displayBranches = commit.Branches && commit.Branches.length > 0;
			var displayTags = commit.Tags && commit.Tags.length > 0;
						
			if(displayBranches){
				dojo.create( "div", {"style":"padding-top:15px"}, textDiv );
				var branchesSection = dojo.create("section", {"style" : "display: inline-block; vertical-align:text-top;"}, textDiv);
				var branchesNode = dojo.create( "span", { "class":"gitSecondaryDescription" }, branchesSection );  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				branchesNode.textContent = messages["branches: "];

				var branchesList = dojo.create( "list", null, branchesSection);
				
				for(var i=0; i<commit.Branches.length; ++i){
					var branchNameSpan = dojo.create("span", {"class":"gitSecondaryDescription", "style" : "padding-left:10px;"}, branchesList);
					branchNameSpan.textContent = commit.Branches[i].FullName;
				}
			}
			
			if(displayTags){
				dojo.create( "div", {"style":"padding-top:15px"}, textDiv );
				var tagsSection = dojo.create("section", {"style" : "display: inline-block; vertical-align:text-top;"}, textDiv);
				var tagsNode = dojo.create( "span", { "class":"gitSecondaryDescription" }, tagsSection );  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				tagsNode.textContent = messages["tags: "];
				
				var tagsList = dojo.create( "list", null, tagsSection);
				
				for(var i=0; i<commit.Tags.length; ++i){
					var tagNameSpan = dojo.create("span", {"class":"gitSecondaryDescription", "style" : "padding-left:10px;"}, tagsList);
					tagNameSpan.textContent = commit.Tags[i].Name;
				}
			}
		},
		
		_onBlur: function(){
			this.inherited(arguments);
			if(dijit.popup.hide)
				dijit.popup.hide(this); //close doesn't work on FF
			dijit.popup.close(this);
		}
	});
});