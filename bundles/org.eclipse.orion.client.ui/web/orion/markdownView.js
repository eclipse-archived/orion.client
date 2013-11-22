/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define document window URL console*/
define(['marked/marked', 'orion/webui/littlelib', 'orion/URITemplate', 'orion/PageUtil', 'orion/section', 'orion/URL-shim'], function(marked, lib, URITemplate, PageUtil, mSection) { //$NON-NLS-0$

	var uriTemplate = new URITemplate("#{,resource,params*}");

	function filterOutputLink(outputLink, resourceURL, isRelative) {
		return function(cap, link) {
			if (link.href.indexOf(":") === -1) {
				
				try {
					var linkURL;
					if (resourceURL.protocol === "filesystem:") {
						linkURL = {
							href: "filesystem:" + (new URL(link.href, resourceURL.pathname)).href
						};
					} else {
						linkURL = new URL(link.href, resourceURL);
						if (isRelative) {
							linkURL.protocol = "";
							linkURL.host = "";
						}
					}
					if (cap[0][0] !== '!') {
						link.href = uriTemplate.expand({
							resource: linkURL.href
						});
					} else {
						link.href = linkURL.href;
					}
				} catch(e) {
					console.log(e); // best effort
				}				
			}
			return outputLink.call(this, cap, link);
		};
	}


	function MarkdownView(options) {
		this.fileClient = options.fileClient;
		this.progress = options.progress;
		this._node = null;
	}
	MarkdownView.prototype = {
		display: function(node, markdown) {
			node.className = "orionMarkdown";

			// relativizing marked's outputLink
			var outputLink = marked.InlineLexer.prototype.outputLink;
			var resource = PageUtil.matchResourceParameters().resource;
			var resourceURL = new URL(resource, window.location.href);
			marked.InlineLexer.prototype.outputLink = filterOutputLink(outputLink, resourceURL, resource.indexOf(":") === -1);
			node.innerHTML = marked(markdown, {
				sanitize: true
			});
			marked.InlineLexer.prototype.outputLink = outputLink;
		},
		displayContents: function(node, file) {
			var location = file.Location || file;
			lib.empty(node);
			var div = document.createElement("div");
			this.progress.progress(this.fileClient.read(location), "Reading file " + (file.Name || location)).then(function(markdown) {
				this.display.bind(this)(div, markdown);
			}.bind(this));
			node.appendChild(div);
		},
		displayInFrame: function(node, file) {
			var markdownSection = new mSection.Section(node, {id: "markdownSection", title: file.Name || "readme"});
			this.displayContents.call(this, markdownSection.getContentElement(), file);
		}
	};

	return {
		MarkdownView: MarkdownView
	};
});