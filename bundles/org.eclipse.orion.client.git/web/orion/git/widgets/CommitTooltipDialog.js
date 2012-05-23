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

define(['i18n!git/nls/gitmessages', 'require', 'dojo', 'dijit', 'orion/util', 'dijit/TooltipDialog'], function(messages, require, dojo, dijit, mUtil) {
	
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
			
			var tableNode = dojo.create( "div", {"style":"padding:10px; max-width:480px"}, this.containerNode); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			var commitMessage0 = commit.Message.split(/(\r?\n|$)/)[0];
			link = dojo.create("a", {"class": "gitMainDescription", href: "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1"}, tableNode); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.place(document.createTextNode(commitMessage0), link);

			dojo.create( "div", {"style":"padding-top:15px"}, tableNode ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.create( "span", {"class": "gitSecondaryDescription", innerHTML: messages[" commit: "] + commit.Name}, tableNode ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			if (commit.Parents && commit.Parents.length > 0){
				dojo.create( "div", null, tableNode ); //$NON-NLS-0$
				
				dojo.place(document.createTextNode(messages["parent: "]), tableNode);
				link = dojo.create("a", {"class": "gitSecondaryDescription", href: "/git/git-commit.html#" + commit.Parents[0].Location + "?page=1&pageSize=1"}, tableNode); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.place(document.createTextNode(commit.Parents[0].Name), link);
			}

			dojo.create( "div", {"style":"padding-top:15px"}, tableNode ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			if (commit.AuthorImage) {
				var authorImage = dojo.create("div", {"class":"git-author-icon-small", "style":"margin-bottom:30px"}, tableNode); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				var image = new Image();
				image.src = commit.AuthorImage;
				image.name = commit.AuthorName;
				image.width = 35;
				image.height = 35;
				dojo.place(image, authorImage, "first"); //$NON-NLS-0$
			}
			
			dojo.create( "span", { "class":"gitSecondaryDescription",  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				innerHTML: dojo.string.substitute(messages[" authored by ${0} {${1}) on ${2}"], [commit.AuthorName, commit.AuthorEmail,
				 dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})])}, tableNode ); //$NON-NLS-0$
			dojo.create( "div", null, tableNode ); //$NON-NLS-0$
			dojo.create( "span", { "class":"gitSecondaryDescription",  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				innerHTML: dojo.string.substitute(messages['committed by 0 (1)'], [commit.CommitterName, commit.CommitterEmail])}, tableNode );
		},
		
		_onBlur: function(){
			this.inherited(arguments);
			if(dijit.popup.hide)
				dijit.popup.hide(this); //close doesn't work on FF
			dijit.popup.close(this);
		}
	});
});