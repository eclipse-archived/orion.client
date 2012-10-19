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

define(['i18n!git/nls/gitmessages', 'require', 'dojo', 'dijit', 'dijit/Dialog', 'dijit/form/TextBox', 
		'orion/widgets/_OrionDialogMixin', 'text!orion/git/widgets/templates/OpenCommitDialog.html', 'dojo/date/locale'], function(messages, require, dojo, dijit) {

/**
 * Usage: <code>new orion.git.widgets.OpenCommitDialog(options).show();</code>
 * 
 * @name orion.git.widgets.OpenCommitDialog
 * @class A dialog that searches for commits by name.
 */
var OpenCommitDialog = dojo.declare("orion.git.widgets.OpenCommitDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], //$NON-NLS-0$
		/** @lends orion.git.widgets.OpenCommitDialog.prototype */ {
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'git/widgets/templates/OpenCommitDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
	
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
			throw new Error("Missing required argument: serviceRegistry"); //$NON-NLS-0$
		}
		
		this.repositories = this.options.repositories;
		if (!this.repositories) {
			throw new Error("Missing required argument: repositories"); //$NON-NLS-0$
		}
		
		this.commitName = this.options.commitName;
	},
	
	/** @private */
	postMixInProperties : function() {
		this.options.title = this.options.title || messages["Find Commit"];
		this.selectFile = messages["Type the commit name (sha1):"];
		this.searchPlaceHolder = messages["Search"];
		this.inherited(arguments);
	},
	
	/** @private */
	postCreate: function() {
		this.inherited(arguments);
		dojo.connect(this.resourceName, "onChange", this, function(evt) { //$NON-NLS-0$
			this.time = +new Date();
			clearTimeout(this.timeoutId);
			this.timeoutId = setTimeout(dojo.hitch(this, this.checkSearch), 0);
		});
		dojo.connect(this.resourceName, "onKeyPress", this, function(evt) { //$NON-NLS-0$
			if (evt.keyCode === dojo.keys.ENTER && this.results) {
				var links = dojo.query("a", this.results); //$NON-NLS-0$
				if (links.length > 0) {
					window.open(links[0].href);
					this.hide();
				}
			}
		});
		dojo.connect(this, "onMouseUp", function(e) { //$NON-NLS-0$
			// WebKit focuses <body> after link is clicked; override that
			e.target.focus();
		});
		
		this.resourceName.set("value", this.commitName); //$NON-NLS-0$
	},
	
	/** @private */
	checkSearch: function() {
		clearTimeout(this.timeoutId);
		var now = new Date().getTime();
		if ((now - this.time) > this.SEARCH_DELAY) {
			this.time = now;
			this.doSearch();
		} else {
			this.timeoutId = setTimeout(dojo.hitch(this, "checkSearch"), 50); //$NON-NLS-0$
		}
	},
	
	_findCommitLocation: function(repositories, commitName, deferred) {
		var that = this;
		if (deferred == null)
			deferred = new dojo.Deferred();
		
		if (repositories.length > 0) {
			that.serviceRegistry.getService("orion.git.provider").doGitLog( //$NON-NLS-0$
				"/gitapi/commit/" + commitName + repositories[0].ContentLocation + "?page=1&pageSize=1").then( //$NON-NLS-1$ //$NON-NLS-0$
				function(resp){
					deferred.callback(resp.Children[0]);
				},
				function(error) {
					that._findCommitLocation(repositories.slice(1), commitName, deferred);
				}
			);
		} else {
			deferred.errback();
		}
		
		return deferred;
	},
	
	/** @private */
	doSearch: function() {
		var text = this.resourceName && this.resourceName.get("value"); //$NON-NLS-0$

		// don't do a server-side query for an empty text box
		if (text) {
			dojo.place("<div>"+messages["Searching&#x2026;"]+"</div>", this.results, "only"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
			var that = this;
			
			this.serviceRegistry.getService("orion.page.message").setProgressMessage(messages["Looking for the commit"]); //$NON-NLS-0$
			this._findCommitLocation(this.repositories, text).then(
				function(resp){
					var commit = resp;
					dojo.empty(that.results);
					that.displayCommit(commit, that.results);
				},
				function(error) {
					dojo.place("<div>"+"No commits found"+"</div>", that.results, "only"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					that.serviceRegistry.getService("orion.page.message").setProgressMessage(""); //$NON-NLS-0$
				}
			);
		}
	},
	
	displayCommit: function(commit, parentNode){	
		var tableNode = dojo.create( "div", {"style":"padding:10px; max-width:480px"}, parentNode); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		var commitMessage0 = commit.Message.split(/(\r?\n|$)/)[0];
		var link = dojo.create("a", {"class": "gitMainDescription", href: "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1"}, tableNode); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		dojo.place(document.createTextNode(commitMessage0), link);
		
		dojo.connect(link, "onclick", link, dojo.hitch(this, function() { //$NON-NLS-0$
			this.hide();
		}));

		dojo.create( "div", {"style":"padding-top:15px"}, tableNode ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var commitSpan = dojo.create( "span", {"class": "gitSecondaryDescription"}, tableNode ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		commitSpan.textContent = messages[' commit: '] + commit.Name;
		if (commit.Parents && commit.Parents.length > 0){
			dojo.create( "div", null, tableNode ); //$NON-NLS-0$
			
			dojo.place(document.createTextNode(messages['parent: ']), tableNode);
			var parentLink = dojo.create("a", {"class": "gitSecondaryDescription", href: "/git/git-commit.html#" + commit.Parents[0].Location + "?page=1&pageSize=1"}, tableNode); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.place(document.createTextNode(commit.Parents[0].Name), parentLink);
			
			dojo.connect(parentLink, "onclick", parentLink, dojo.hitch(this, function() { //$NON-NLS-0$
				this.hide();
			}));
		}

		dojo.create( "div", {"style":"padding-top:15px"}, tableNode ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		if (commit.AuthorImage) {
			var authorImage = dojo.create("span", {"class":"git-author-icon-small", "style":"margin-bottom:30px"}, tableNode); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var image = new Image();
			image.src = commit.AuthorImage;
			image.name = commit.AuthorName;
			image.width = 35;
			image.height = 35;
			dojo.place(image, authorImage, "first"); //$NON-NLS-0$
		}
		
		var authoredBySpan = dojo.create( "span", { "class":"gitSecondaryDescription" }, tableNode ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		authoredBySpan.textContent = dojo.string.substitute(messages[" authored by ${0} (${1})) on ${2}"], [commit.AuthorName , commit.AuthorEmail,
			dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})]); //$NON-NLS-0$
		dojo.create( "div", null, tableNode ); //$NON-NLS-0$
		var committedBySpan = dojo.create( "span", { "class":"gitSecondaryDescription" }, tableNode );  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		committedBySpan.textContent = dojo.string.substitute(messages['committed by 0 (1)'], [commit.CommitterName, commit.CommitterEmail]);
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
