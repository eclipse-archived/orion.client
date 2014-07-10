/*******************************************************************************
 * @license Copyright (c) 2014 IBM Corporation and others. All rights
 *          reserved. This program and the accompanying materials are made
 *          available under the terms of the Eclipse Public License v1.0
 *          (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse
 *          Distribution License v1.0
 *          (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define document window Image*/

define([
	'require',
	'i18n!git/nls/gitmessages',
	'orion/URITemplate',
	'orion/i18nUtil',
	'orion/git/util',
	'orion/objects'
], function(require, messages, URITemplate, i18nUtil, util, objects) {
	
	var commitTemplate = new URITemplate("git/git-commit.html#{,resource,params*}?page=1&pageSize=1"); //$NON-NLS-0$	
	
	/**
	 * @class orion.git.GitCommitInfo
	 */
	function GitCommitInfo(options) {
		this.parent = options.parent;
		this.commit = options.commit;
		this.showTags = options.showTags;
		this.commitLink = options.commitLink;
		this.showMessage = options.showMessage;
		this.showImage = options.showImage;
		this.showAuthor = options.showAuthor;
		this.showCommitter = options.showCommitter;
		this.showParentLink = options.showParentLink;
		this.fullMessage = options.fullMessage;
	}
	
	objects.mixin(GitCommitInfo.prototype, {
		display: function(){
		
			function createInfo(parent, keys, values) {
				keys = Array.isArray(keys) ? keys : [keys];
				values = Array.isArray(values) ? values : [values];
				var div = document.createElement("div"); //$NON-NLS-0$
				for (var i = 0; i < keys.length; i++) {
					div.appendChild(document.createTextNode(messages[keys[i]]));
					var span = document.createElement("span"); //$NON-NLS-0$
					span.className = "gitCommitInfoValue"; //$NON-NLS-0$
					span.appendChild(document.createTextNode(values[i])); //$NON-NLS-0$  //$NON-NLS-1$
					div.appendChild(span);
				}
				parent.appendChild(div);
				return div;
			}
			
			var commit = this.commit;
			var tableNode = this.parent;
			var fullMessage = this.fullMessage;
			
			var headerMessage;
			var additionalOffset = 0;
			
			if(fullMessage){
				headerMessage = commit.Message.split(/(\r?\n|$)/)[0].trim();
				if (headerMessage.length > 100) {
					var cutPoint = headerMessage.indexOf(" ", 90); //$NON-NLS-0$
					headerMessage = headerMessage.substring(0, (cutPoint !== -1 ? cutPoint : 100)) + "...";
					additionalOffset = 3;
				}
			} else {
				headerMessage = util.trimCommitMessage(commit.Message);
			}
	
			if (this.showMessage === undefined || this.showMessage) {
				var link;
				if (this.commitLink) {
					link = document.createElement("a"); //$NON-NLS-0$
					link.className = "navlinkonpage"; //$NON-NLS-0$
					link.href = require.toUrl(commitTemplate.expand({resource: commit.Location}));
				} else {
					link = document.createElement("span"); //$NON-NLS-0$
					link.className = "gitCommitTitle"; //$NON-NLS-0$
				}
				link.appendChild(document.createTextNode(headerMessage));
				tableNode.appendChild(link);

				var secondaryMessageLength = commit.Message.length - (headerMessage.length + additionalOffset);
				if(fullMessage && secondaryMessageLength > 0){
					var secondaryMessagePre = document.createElement("pre");
					secondaryMessagePre.style.paddingBottom = "15px";
					secondaryMessagePre.style.marginTop = "0px";
					
					var secondaryMessage = (additionalOffset > 0) ? "..." : "";
					secondaryMessage += commit.Message.substring(headerMessage.length - additionalOffset);
					secondaryMessagePre.appendChild(document.createTextNode(secondaryMessage));
					tableNode.appendChild(secondaryMessagePre);
				}
			}
			
			var textDiv = document.createElement("div"); //$NON-NLS-0$
			textDiv.style.paddingTop = "15px"; //$NON-NLS-0$
			tableNode.appendChild(textDiv);
			
			if (this.showImage === undefined || this.showImage) {
				if (commit.AuthorImage) {
					var image = new Image();
					image.src = commit.AuthorImage;
					image.name = commit.AuthorName;
					image.className = "git-author-icon"; //$NON-NLS-0$
					textDiv.appendChild(image);
				}
				
			}
			
			if (this.showAuthor === undefined || this.showAuthor) {
				createInfo(textDiv, ["authoredby", "on"], [i18nUtil.formatMessage(messages["nameEmail"], commit.AuthorName,  commit.AuthorEmail), new Date(commit.Time).toLocaleString()]);
			}
			
			if (this.showCommitter === undefined || this.showCommitter) {
				createInfo(textDiv, "committedby", i18nUtil.formatMessage(messages["nameEmail"], commit.CommitterName, commit.CommitterEmail));
			}
			
			if (this.showCommit === undefined || this.showCommit) {
				var commitNameDiv = createInfo(textDiv, "commit:", commit.Name);  //$NON-NLS-0$
				commitNameDiv.style.paddingTop = "15px"; //$NON-NLS-0$
			}
			
			if (this.showGerrit === undefined || this.showGerrit) {
				var gerritFooter = util.getGerritFooter(commit.Message);
		
				if (gerritFooter.changeId) {
					var changeIdDiv = createInfo(textDiv, "Change-Id: ", gerritFooter.changeId);  //$NON-NLS-0$
					changeIdDiv.style.paddingTop = "15px"; //$NON-NLS-0$
				}
				
				if (gerritFooter.signedOffBy) {
					createInfo(textDiv, "Signed-off-by: ", gerritFooter.signedOffBy);
				}
			}
			
			if (this.showParentLink === undefined || this.showParentLink) {
				if (commit.Parents && commit.Parents.length > 0) {
					var parentNode = document.createElement("div"); //$NON-NLS-0$
					parentNode.textContent = messages["parent:"]; //$NON-NLS-0$
					if (gerritFooter.signedOffBy || gerritFooter.changeId) parentNode.style.paddingTop = "15px"; //$NON-NLS-0$
					var parentLink = document.createElement("a"); //$NON-NLS-0$
					parentLink.className = "navlinkonpage"; //$NON-NLS-0$
					parentLink.href = require.toUrl(commitTemplate.expand({resource: commit.Parents[0].Location}));
					parentLink.textContent = commit.Parents[0].Name;
					parentNode.appendChild(parentLink);
					textDiv.appendChild(parentNode);
				}
			}
	
			var displayBranches = (this.showBranches === undefined || this.showBranches) && commit.Branches && commit.Branches.length > 0;
			var displayTags = this.showTags && commit.Tags && commit.Tags.length > 0;
	
			if (displayBranches) {
				
				var branchesSection = document.createElement("section"); //$NON-NLS-0$
				branchesSection.style.paddingTop = "15px"; //$NON-NLS-0$
				branchesSection.textContent = messages["branches: "]; //$NON-NLS-0$
				textDiv.appendChild(branchesSection);
				
				var branchesList = document.createElement("div"); //$NON-NLS-0$
				branchesSection.appendChild(branchesList);
	
				for (var i = 0; i < commit.Branches.length; ++i) {
					var branchNameSpan = document.createElement("span"); //$NON-NLS-0$
					branchNameSpan.style.paddingLeft = "10px"; //$NON-NLS-0$
					branchNameSpan.textContent = commit.Branches[i].FullName;
					branchNameSpan.className = "gitCommitInfoValue"; //$NON-NLS-0$
					branchesList.appendChild(branchNameSpan);
				}
			}
	
			if (displayTags) {
				var div = document.createElement("div"); //$NON-NLS-0$
				div.style.paddingTop = "15px"; //$NON-NLS-0$
				textDiv.appendChild(div);
				
				var tagsSection = document.createElement("section"); //$NON-NLS-0$
				textDiv.appendChild(tagsSection);
				
				var tagsNode = document.createElement("span"); //$NON-NLS-0$
				tagsNode.textContent = messages["tags: "]; //$NON-NLS-0$
				tagsSection.appendChild(tagsNode);
				
				var tagsList = document.createElement("div"); //$NON-NLS-0$
				tagsSection.appendChild(tagsList);
	
				for (i = 0; i < commit.Tags.length; ++i) {
					var tagNameSpan = document.createElement("span"); //$NON-NLS-0$
					tagNameSpan.style.paddingLeft = "10px"; //$NON-NLS-0$
					tagNameSpan.textContent = commit.Tags[i].Name;
					tagNameSpan.className = "gitCommitInfoValue";
					tagsList.appendChild(tagNameSpan);
				}
			}
		}
	});
	
	return {
		GitCommitInfo: GitCommitInfo
	};

});
