/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global console define URL*/
/*jslint browser:true sub:true*/
define([
	'orion/objects',
	'orion/webui/littlelib'
], function(objects, lib) {

	/**
	 * @name orion.widgets.browse.CommitInfoRenderer
	 * @class Comit Info renderer.
	 * @description Renders a DIV with commit information.
	 * @name orion.browse.CommitInfoOptions
	 *
	 * @property {String|DOMElement} parent the parent element for the commit information, it can be either a DOM element or an ID for a DOM element.
	 * @property {Object} commitInfo the information object of a commit information.
	 *	{
	 *	   Author: {Name: "string", Email: "email@addre.ss", Date: milliseconds(integer) },
	 *	   Committer: {Name: "string", Email: "email@addre.ss", Date: milliseconds(integer) },
	 *	   Message: "string",
	 * 	   URL: "string"
	 *	}
	 */

	function CommitInfoRenderer(params) {
		this._parentDomNode = lib.node(params.parent);//Required
		this._commitInfo = params.commitInfo;//Required
	}
	objects.mixin(CommitInfoRenderer.prototype, /** @lends orion.widgets.Filesystem.CommitInfoRenderer */ {
		destroy: function() {
		},
		renderSimple: function(maxWidth) {
			var message = this._commitInfo.Message ? this._commitInfo.Message : "";
			var authorName = this._commitInfo.Author && this._commitInfo.Author.Name ? this._commitInfo.Author.Name : "";
			if((authorName.length +  message.length + 2) > maxWidth) {
				var trimmedLength = maxWidth - authorName.length - 5;
				if(trimmedLength > 0) {
					message = message.substring(0, trimmedLength) + "...";
				} else {
					message = "";
				}
			}
			var fragment = document.createDocumentFragment();
			fragment.textContent = "${0} " + message;
			var nameLabel = document.createElement("span"); //$NON-NLS-0$
			nameLabel.appendChild(document.createTextNode(authorName + ":")); //$NON-NLS-0$
			nameLabel.classList.add("navColumnBold"); //$NON-NLS-0$
			lib.processDOMNodes(fragment, [nameLabel]);
			this._parentDomNode.appendChild(fragment);
		},
		render: function() {
			var commitDate = this._commitInfo.Author && this._commitInfo.Author.Date ? new Date(this._commitInfo.Author.Date).toLocaleString() : "";
			var message = this._commitInfo.Message ? this._commitInfo.Message : "";
			var authorName = this._commitInfo.Author && this._commitInfo.Author.Name ? this._commitInfo.Author.Name : "";
			var messageContainer = document.createElement("div"), messageNode;
			messageContainer.classList.add("commitInfoMessageContainer"); //$NON-NLS-0$
			if(this._commitInfo.URL) {
				messageNode = document.createElement("a"); //$NON-NLS-0$
				messageNode.href = this._commitInfo.URL;
				messageNode.classList.add("commitInfolink"); //$NON-NLS-0$
				messageNode.appendChild(document.createTextNode(message));
			} else {
				messageNode = document.createElement("span"); //$NON-NLS-0$
				messageNode.appendChild(document.createTextNode(message));
			}
			messageContainer.appendChild(messageNode);
			this._parentDomNode.appendChild(messageContainer);

			var fragment = document.createDocumentFragment();
			fragment.textContent = commitDate ? "by ${0} on " + commitDate +"." : "by ${0}.";
			var nameLabel = document.createElement("span"); //$NON-NLS-0$
			nameLabel.appendChild(document.createTextNode(authorName)); //$NON-NLS-0$
			nameLabel.classList.add("navColumnBold"); //$NON-NLS-0$
			lib.processDOMNodes(fragment, [nameLabel]);
			this._parentDomNode.appendChild(fragment);
		}
	});

	return {CommitInfoRenderer: CommitInfoRenderer};
});
