/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*jslint browser:true*/
/*global define orion window dojo dijit*/

define(['require', 'dojo', 'dijit', "orion/util", 'dijit/Dialog', 'dijit/form/TextBox', 
		'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/OpenCommitDialog.html'], function(require, dojo, dijit, mUtil) {

/**
 * Usage: <code>new orion.git.widgets.OpenCommitDialog(options).show();</code>
 * 
 * @name orion.git.widgets.OpenCommitDialog
 * @class A dialog that searches for commits by name.
 */
var OpenCommitDialog = dojo.declare("orion.git.widgets.OpenCommitDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin],
		/** @lends orion.git.widgets.OpenCommitDialog.prototype */ {
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'git/widgets/templates/OpenCommitDialog.html'),
	
	SEARCH_DELAY: 500,
	timeoutId: null,
	time: null,
	options: null,
	
	/** @private */
	constructor : function() {
		this.inherited(arguments);
		this.timeoutId = null;
		this.time = 0;
		this.options = arguments[0];

		this.serviceRegistry = this.options.serviceRegistry;
		if (!this.serviceRegistry) {
			throw new Error("Missing required argument: serviceRegistry");
		}
		
		this.repository = this.options.repository;
		if (!this.repository) {
			throw new Error("Missing required argument: repository");
		}
	},
	
	/** @private */
	postMixInProperties : function() {
		this.options.title = this.options.title || "Find Commit";
		this.selectFile = "Type the commit name (sha1):";
		this.searchPlaceHolder = "Search";
		this.inherited(arguments);
	},
	
	/** @private */
	postCreate: function() {
		this.inherited(arguments);
		dojo.connect(this.resourceName, "onChange", this, function(evt) {
			this.time = +new Date();
			clearTimeout(this.timeoutId);
			this.timeoutId = setTimeout(dojo.hitch(this, this.checkSearch), 0);
		});
		dojo.connect(this.resourceName, "onKeyPress", this, function(evt) {
			if (evt.keyCode === dojo.keys.ENTER && this.results) {
				var links = dojo.query("a", this.results);
				if (links.length > 0) {
					window.open(links[0].href);
					this.hide();
				}
			}
		});
		dojo.connect(this, "onMouseUp", function(e) {
			// WebKit focuses <body> after link is clicked; override that
			e.target.focus();
		});
	},
	
	/** @private */
	checkSearch: function() {
		clearTimeout(this.timeoutId);
		var now = new Date().getTime();
		if ((now - this.time) > this.SEARCH_DELAY) {
			this.time = now;
			this.doSearch();
		} else {
			this.timeoutId = setTimeout(dojo.hitch(this, "checkSearch"), 50);
		}
	},
	
	/** @private */
	doSearch: function() {
		var text = this.resourceName && this.resourceName.get("value");

		// don't do a server-side query for an empty text box
		if (text) {
			dojo.place("<div>Searching&#x2026;</div>", this.results, "only");
			var that = this;
			
			this.serviceRegistry.getService("orion.git.provider").doGitLog(
				"/gitapi/commit/" + text + this.repository.ContentLocation + "?page=1&pageSize=1").then(
				function(resp){
					var commit = resp.Children[0];
					dojo.empty(that.results);
					that.displayCommit(commit, that.results);
				},
				function(error) {
					dojo.place("<div>No matches found</div>", that.results, "only");
				}
			);
		}
	},
	
	displayCommit: function(commit, parentNode){	
		var tableNode = dojo.create( "div", {"style":"padding:10px; max-width:480px"}, parentNode);
		
		var commitMessage0 = commit.Message.split(/(\r?\n|$)/)[0];
		var link = dojo.create("a", {"class": "gitMainDescription", href: "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1"}, tableNode);
		dojo.place(document.createTextNode(commitMessage0), link);
		
		dojo.connect(link, "onclick", link, dojo.hitch(this, function() {
			this.hide();
		}));

		dojo.create( "div", {"style":"padding-top:15px"}, tableNode );
		dojo.create( "span", {"class": "gitSecondaryDescription", innerHTML: " commit: " + commit.Name}, tableNode );
		if (commit.Parents && commit.Parents.length > 0){
			dojo.create( "div", null, tableNode );
			
			dojo.place(document.createTextNode("parent: "), tableNode);
			var parentLink = dojo.create("a", {"class": "gitSecondaryDescription", href: "/git/git-commit.html#" + commit.Parents[0].Location + "?page=1&pageSize=1"}, tableNode);
			dojo.place(document.createTextNode(commit.Parents[0].Name), parentLink);
			
			dojo.connect(parentLink, "onclick", parentLink, dojo.hitch(this, function() {
				this.hide();
			}));
		}

		dojo.create( "div", {"style":"padding-top:15px"}, tableNode );
		
		if (commit.AuthorImage) {
			var authorImage = dojo.create("span", {"class":"git-author-icon-small", "style":"margin-bottom:30px"}, tableNode);
			var image = new Image();
			image.src = commit.AuthorImage;
			image.name = commit.AuthorName;
			image.width = 35;
			image.height = 35;
			dojo.place(image, authorImage, "first");
		}
		
		dojo.create( "span", { "class":"gitSecondaryDescription", 
			innerHTML: " authored by " + commit.AuthorName + " (" + commit.AuthorEmail
			+ ") on " + dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})}, tableNode );
		dojo.create( "div", null, tableNode );
		dojo.create( "span", { "class":"gitSecondaryDescription", 
			innerHTML: "committed by " + commit.CommitterName  + " (" + commit.CommitterEmail + ")"}, tableNode );
	},
	
	/**
	 * Displays the dialog.
	 */
	show: function() {
		this.inherited(arguments);
		this.resourceName.focus();
	},
	
	/** @private */
	onHide: function() {
		clearTimeout(this.timeoutId);
		this.inherited(arguments);
	}
	
});
return OpenCommitDialog;
});
