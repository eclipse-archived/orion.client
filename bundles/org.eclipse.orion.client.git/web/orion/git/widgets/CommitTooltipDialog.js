/*******************************************************************************
 * @license Copyright (c) 2012, 2013 IBM Corporation and others. All rights reserved.
 *          This program and the accompanying materials are made available under
 *          the terms of the Eclipse Public License v1.0
 *          (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse
 *          Distribution License v1.0
 *          (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
 /*globals define window document Image*/

define([ 'i18n!git/nls/gitmessages', 'require', 'orion/webui/littlelib', 'orion/i18nUtil', 'orion/webui/popupdialog'], 
	function(messages, require, lib, i18nUtil, popupdialog) {

	function CommitTooltipDialog(options) {
		this._init(options);
	}

	CommitTooltipDialog.prototype = new popupdialog.PopupDialog();

	CommitTooltipDialog.prototype.TEMPLATE = '<div id="parentPane" style="padding:10px; width:520px"></div>';

	CommitTooltipDialog.prototype._init = function(options) {
		this.commit = options.commit;

		// Start the dialog initialization.
		this._initialize(options.triggerNode, null, null, "mouseover", 1000);
	};

	CommitTooltipDialog.prototype._bindToDom = function(parent) {
		this._displayCommit(this.commit);
	};

	CommitTooltipDialog.prototype._displayCommit = function(commit) {
		var tableNode = this.$parentPane;

		var commitMessage0 = commit.Message.split(/(\r?\n|$)/)[0];
		var link = document.createElement("a");
		link.className = "navlinkonpage";
		link.href = "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1";
		link.textContent = commitMessage0;
		tableNode.appendChild(link);
		
		var div = document.createElement("div");
		div.style.paddingTop = "15px";
		tableNode.appendChild(div);
		
		var imageDiv = document.createElement("div");
		tableNode.appendChild(imageDiv);
		
		var textDiv = document.createElement("div");
		tableNode.appendChild(textDiv);

		if (commit.AuthorImage) {
			var authorImage = document.createElement("div");
			authorImage.style['float'] = "left";
			var image = new Image();
			image.src = commit.AuthorImage;
			image.name = commit.AuthorName;
			image.className = "git-author-icon";
			authorImage.appendChild(image);
			imageDiv.appendChild(authorImage);
		}

		var authoredBySpan = document.createElement("span");
		authoredBySpan.textContent = i18nUtil.formatMessage(messages[" authored by ${0} {${1}) on ${2}"], //$NON-NLS-0$
			commit.AuthorName, commit.AuthorEmail, new Date(commit.Time).toLocaleString()); 
		textDiv.appendChild(authoredBySpan);
		
		var div = document.createElement("div");
		textDiv.appendChild(div);
		
		var committedBySpan = document.createElement("span");
		committedBySpan.textContent = i18nUtil.formatMessage(messages['committed by 0 (1)'], commit.CommitterName, commit.CommitterEmail);
		textDiv.appendChild(committedBySpan);

		var div = document.createElement("div");
		div.style.paddingTop = "15px";
		textDiv.appendChild(div);
		
		var commitNameSpan = document.createElement("span");
		commitNameSpan.textContent = messages["commit:"] + commit.Name;
		textDiv.appendChild(commitNameSpan);


		if (commit.Parents && commit.Parents.length > 0) {
			var div = document.createElement("div");
			textDiv.appendChild(div);

			var parentNode = document.createElement("span");
			parentNode.textContent = messages["parent:"];
			
			var parentLink = document.createElement("a");
			parentLink.className = "navlinkonpage";
			parentLink.href = "/git/git-commit.html#" + commit.Parents[0].Location + "?page=1&pageSize=1";
			parentLink.textContent = commit.Parents[0].Name;
			parentNode.appendChild(parentLink);
			
			textDiv.appendChild(parentNode);
		}

		var displayBranches = commit.Branches && commit.Branches.length > 0;
		var displayTags = commit.Tags && commit.Tags.length > 0;

		if (displayBranches) {
			var div = document.createElement("div");
			div.style.paddingTop = "15px";
			textDiv.appendChild(div);
			
			var branchesSection = document.createElement("section");
			textDiv.appendChild(branchesSection);
			
			var branchesNode = document.createElement("span");
			branchesNode.textContent = messages["branches: "];
			branchesSection.appendChild(branchesNode);

			var branchesList = document.createElement("div");
			branchesSection.appendChild(branchesList);

			for ( var i = 0; i < commit.Branches.length; ++i) {
				var branchNameSpan = document.createElement("span");
				branchNameSpan.style.paddingLeft = "10px";
				branchNameSpan.textContent = commit.Branches[i].FullName;
				branchesList.appendChild(branchNameSpan);
			}
		}

		if (displayTags) {
			var div = document.createElement("div");
			div.style.paddingTop = "15px";
			textDiv.appendChild(div);
			
			var tagsSection = document.createElement("section");
			textDiv.appendChild(tagsSection);
			
			var tagsNode = document.createElement("span");
			tagsNode.textContent = messages["tags: "];
			tagsSection.appendChild(tagsNode);
			
			var tagsList = document.createElement("div");
			tagsSection.appendChild(tagsList);

			for ( var i = 0; i < commit.Tags.length; ++i) {
				var tagNameSpan = document.createElement("span");
				tagNameSpan.style.paddingLeft = "10px";
				tagNameSpan.textContent = commit.Tags[i].Name;
				tagsList.appendChild(tagNameSpan);
			}
		}
	};
	
	CommitTooltipDialog.prototype.constructor = CommitTooltipDialog;
	
	//return the module exports
	return {CommitTooltipDialog: CommitTooltipDialog};
});