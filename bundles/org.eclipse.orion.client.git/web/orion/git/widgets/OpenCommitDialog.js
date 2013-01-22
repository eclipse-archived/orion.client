/*******************************************************************************
 * @license Copyright (c) 2012 IBM Corporation and others. All rights reserved.
 *          This program and the accompanying materials are made available under
 *          the terms of the Eclipse Public License v1.0
 *          (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse
 *          Distribution License v1.0
 *          (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define([ 'i18n!git/nls/gitmessages', 'orion/i18nUtil', 'orion/Deferred', 'orion/webui/dialog', 'orion/webui/littlelib' ], function(
		messages, i18nUtil, Deferred, dialog, lib) {

	/**
	 * Usage:
	 * <code>new orion.git.widgets.OpenCommitDialog(options).show();</code>
	 * 
	 * @name orion.git.widgets.OpenCommitDialog
	 * @class A dialog that searches for commits by name.
	 */
	function OpenCommitDialog(options) {
		this._init(options);
	}

	OpenCommitDialog.prototype = new dialog.Dialog();

	OpenCommitDialog.prototype.TEMPLATE = '<div><label for="resourceName">${Type the commit name (sha1):}</label></div>'
			+ '<div><input type="text" id="resourceName"></div>' + '<div id="results" style="max-height:400px; height:auto; overflow-y:auto;"></div>';

	OpenCommitDialog.prototype._init = function(options) {
		var that = this;

		this.title = options.title || messages["Find Commit"];
		this.modal = true;
		this.messages = messages;

		this.SEARCH_DELAY = 500;
		this.timeoutId = null;
		this.time = 0;

		this.serviceRegistry = options.serviceRegistry;
		if (!this.serviceRegistry) {
			throw new Error("Missing required argument: serviceRegistry"); //$NON-NLS-0$
		}

		this.repositories = options.repositories;
		if (!this.repositories) {
			throw new Error("Missing required argument: repositories"); //$NON-NLS-0$
		}

		this.commitName = options.commitName;

		this.buttons = [];

		this.buttons.push({ callback : function() {
			that.destroy();
			that._execute();
		},
		text : 'OK'
		});

		// Start the dialog initialization.
		this._initialize();
	};

	OpenCommitDialog.prototype._bindToDom = function(parent) {
		var that = this;

		this.$resourceName.addEventListener("input", function(evt) { //$NON-NLS-0$
			that.time = +new Date();
			if (that.timeoutId) {
				clearTimeout(that.timeoutId);
			}
			that.timeoutId = setTimeout(that._checkSearch.bind(that), 0);
		}, false);

		this.$resourceName.addEventListener("keydown", function(evt) { //$NON-NLS-0$
			if (evt.keyCode === lib.KEY.ENTER) {
				var link = lib.$("a", that.$results); //$NON-NLS-0$
				if (link) {
					lib.stop(evt);
					window.open(link.href);
					that.hide();
				}
			}
		}, false);

		this.$resourceName.value = this.commitName;
	};

	OpenCommitDialog.prototype._checkSearch = function() {
		var that = this;

		clearTimeout(this.timeoutId);
		var now = new Date().getTime();
		if ((now - this.time) > this.SEARCH_DELAY) {
			this.time = now;
			this._doSearch();
		} else {
			this.timeoutId = setTimeout(that._checkSearch.bind(that), 50);
		}
	};

	OpenCommitDialog.prototype._findCommitLocation = function(repositories, commitName, deferred) {
		var that = this;
		if (deferred == null)
			deferred = new Deferred();

		if (repositories.length > 0) {
			serviceRegistry.getService("orion.page.progress").progress(
					that.serviceRegistry.getService("orion.git.provider").doGitLog(
							"/gitapi/commit/" + commitName + repositories[0].ContentLocation + "?page=1&pageSize=1"), "Getting commit details " + commitName)
					.then(function(resp) {
						deferred.resolve(resp.Children[0]);
					}, function(error) {
						that._findCommitLocation(repositories.slice(1), commitName, deferred);
					});
		} else {
			deferred.reject();
		}

		return deferred;
	};

	/** @private */
	OpenCommitDialog.prototype._doSearch = function() {
		var that = this;
		var text = this.$resourceName && this.$resourceName.value;

		// don't do a server-side query for an empty text box
		if (text) {
			var div = document.createElement("div");
			div.appendChild(document.createTextNode(messages['Searching...']));
			lib.empty(this.$results);
			this.$results.appendChild(div);

			this.serviceRegistry.getService("orion.page.message").setProgressMessage(messages["Looking for the commit"]); //$NON-NLS-0$
			this._findCommitLocation(this.repositories, text).then(function(resp) {
				var commit = resp;
				lib.empty(that.$results);
				that._displayCommit(commit, that.$results);
				that.serviceRegistry.getService("orion.page.message").setProgressMessage(""); //$NON-NLS-0$
			}, function(error) {
				var div = document.createElement("div");
				div.appendChild(document.createTextNode("No commits found"));
				lib.empty(that.$results);
				that.$results.appendChild(div);
				that.serviceRegistry.getService("orion.page.message").setProgressMessage(""); //$NON-NLS-0$
			});
		}
	};

	OpenCommitDialog.prototype._displayCommit = function(commit, parentNode) {
		var that = this;

		var div = document.createElement("div"); //$NON-NLS-0$
		div.style.padding = "10px";
		div.style.maxWidth = "480px";
		lib.empty(parentNode);
		parentNode.appendChild(div);

		var commitMessage0 = commit.Message.split(/(\r?\n|$)/)[0];
		var link = document.createElement("a"); //$NON-NLS-0$
		link.href = "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1";
		link.appendChild(document.createTextNode(commitMessage0));
		div.appendChild(link);

		link.addEventListener("mouseup", function(evt) { //$NON-NLS-0$
			if (evt.button === 0 && !evt.ctrlKey && !evt.metaKey) {
				that.hide();
			}
		}, false);
		
		link.addEventListener("keyup", function(evt) { //$NON-NLS-0$
			if (evt.keyCode === lib.KEY.ENTER) {
				that.hide();
			}
		}, false);

		var commitDiv = document.createElement("div"); //$NON-NLS-0$
		commitDiv.style.padding = "4px 0 0 4px";
		commitDiv.appendChild(document.createTextNode(messages['commit:'] + commit.Name));
		div.appendChild(commitDiv);

		if (commit.Parents && commit.Parents.length > 0) {
			var parentDiv = document.createElement("div"); //$NON-NLS-0$
			parentDiv.style.padding = "4px 0 0 4px";
			
			var link = document.createElement("a"); //$NON-NLS-0$
			link.href = "/git/git-commit.html#" + commit.Parents[0].Location + "?page=1&pageSize=1";
			link.appendChild(document.createTextNode(messages['parent:'] + commit.Parents[0].Name));
			parentDiv.appendChild(link);
			div.appendChild(parentDiv);

			link.addEventListener("mouseup", function(evt) { //$NON-NLS-0$
				if (evt.button === 0 && !evt.ctrlKey && !evt.metaKey) {
					that.hide();
				}
			}, false);
			
			link.addEventListener("keyup", function(evt) { //$NON-NLS-0$
				if (evt.keyCode === lib.KEY.ENTER) {
					that.hide();
				}
			}, false);
		}

		// dojo.create("div", { "style" : "padding-top:15px"
		// }, tableNode);
		// //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		//
		// if (commit.AuthorImage) {
		// var authorImage = dojo.create("span", { "class" :
		// "git-author-icon-small",
		// "style" : "margin-bottom:30px"}, tableNode); //$NON-NLS-4$
		// //$NON-NLS-3$
		// //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		// var image = new Image();
		// image.src = commit.AuthorImage;
		// image.name = commit.AuthorName;
		// image.width = 35;
		// image.height = 35;
		// dojo.place(image, authorImage, "first"); //$NON-NLS-0$
		// }
		//
		// var authoredBySpan = dojo.create("span", { "class" :
		// "gitSecondaryDescription"}, tableNode); //$NON-NLS-2$
		// //$NON-NLS-1$ //$NON-NLS-0$
		// authoredBySpan.textContent =
		// dojo.string.substitute(messages["authored by ${0} (${1})) on ${2}"],
		// [ commit.AuthorName, commit.AuthorEmail,
		// dojo.date.locale.format(new Date(commit.Time), { formatLength :
		// "short"}) ]); //$NON-NLS-0$
		// dojo.create("div", null, tableNode); //$NON-NLS-0$
		// var committedBySpan = dojo.create("span", { "class" :
		// "gitSecondaryDescription"}, tableNode); //$NON-NLS-2$
		// //$NON-NLS-1$ //$NON-NLS-0$
		// committedBySpan.textContent =
		// dojo.string.substitute(messages['committed by 0 (1)'], [
		// commit.CommitterName, commit.CommitterEmail ]);
	};

	OpenCommitDialog.prototype._beforeHiding = function() {
		clearTimeout(this._timeoutId);
	};

	OpenCommitDialog.prototype.constructor = OpenCommitDialog;

	// return the module exports
	return { OpenCommitDialog : OpenCommitDialog
	};

});
