/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global URL*/
/*jslint amd:true browser:true*/

define(['orion/webui/littlelib', 'orion/URL-shim'], function(lib) {
	var LOCAL_STORAGE_NAME = "sideMenuNavigation";
	var OPEN_STATE = "open";
	var CLOSED_STATE = "closed";
	var DEFAULT_STATE = OPEN_STATE;
	var SIDE_MENU_OPEN_WIDTH = "40px";
	var TRANSITION_DURATION_MS = 301; /* this should always be greater than the duration of the left transition of .content-fixedHeight */

	function SideMenu(parentNode, contentNode) {
		this.parentNode = lib.node(parentNode);
		if (!this.parentNode) {
			throw new Error("Missing parentNode"); //$NON-NLS-0$
		}
		this.contentNode = lib.node(contentNode);

		this.categoryInfos = [];
		this.categorizedPageLinks = {};
		this.categorizedRelatedLinks = {};

		this.categorizedAnchors = null;
		this.state = localStorage.getItem(LOCAL_STORAGE_NAME) || DEFAULT_STATE;
		this.currentCategory = "";
	}

	SideMenu.prototype = {
		constructor: SideMenu.prototype.constructor,
		// Should only be called once
		setCategories: function(categories) {
			this.categoryInfos = categories.getCategoryIDs().map(function(catId) {
				return categories.getCategory(catId);
			}).sort(function(c1, c2) {
				var o1 = c1.order || 100;
				var o2 = c2.order || 100;
				if (o1 < o2) {
					return -1;
				} else if (o2 < o1) {
					return 1;
				}
				return 0; //c1.textContent.localeCompare(c2.textContent);
			});
		},
		// Should only be called once
		setPageLinks: function(pageLinks) {
			this.categorizedPageLinks = {};
			pageLinks.getAllLinks().forEach(function(link) {
				var category = link.category;
				this.categorizedPageLinks[category] = this.categorizedPageLinks[category] || [];
				this.categorizedPageLinks[category].push({
					title: link.textContent,
					order: link.order || 100,
					href: link.href
				});
			}, this);
		},
		/**
		 * Called whenever the page target changes.
		 * @param {Object} relatedLinks
		 * @param {String[]} exclusions List of related link IDs that the page has requested to not be shown.
		 */
		setRelatedLinks: function(relatedLinks, exclusions) {
			this.categorizedRelatedLinks = {};
			relatedLinks.forEach(function(info) {
				var relatedLink = info.relatedLink;
				var command = info.command;
				var invocation = info.invocation;
				if (!exclusions || exclusions.indexOf(relatedLink.id) === -1) {
					var category = relatedLink.category;
					this.categorizedRelatedLinks[category] = this.categorizedRelatedLinks[category] || [];
					this.categorizedRelatedLinks[category].push({
						title: command.name,
						order: relatedLink.order || 100,
						href: command.hrefCallback.call(invocation.handler, invocation)
					});
				}
			}, this);
			this._updateCategoryAnchors();
		},
		// Should only be called once
		render: function() {
			if (this.categorizedAnchors === null) {
				this.categorizedAnchors = {};
				var pageURL = new URL(window.location.href);
				pageURL.hash = "";

				this.currentCategory = "";
				Object.keys(this.categorizedPageLinks).some(function(category) {
					var links = this.categorizedPageLinks[category];
					if (links.some(function(link) {
						var linkURL = new URL(link.href);
						link.hash = "";
						return pageURL.href === linkURL.href;
					})) {
						this.currentCategory = category;
						return true;
					}
				}, this);

				var sideMenuList = document.createElement("ul"); //$NON-NLS-0$
				sideMenuList.classList.add("sideMenuList"); //$NON-NLS-0$

				this.categoryInfos.forEach(function(categoryInfo) {
					var listItem = document.createElement('li'); //$NON-NLS-0$
					listItem.classList.add("sideMenuItem"); //$NON-NLS-0$
					if (this.currentCategory === categoryInfo.id) {
						listItem.classList.add("sideMenuItemActive");
					}
					listItem.categoryId = categoryInfo.id;
					listItem.categoryName = categoryInfo.textContent || categoryInfo.id;
					var anchor = document.createElement("a"); //$NON-NLS-0$
					anchor.classList.add("submenu-trigger"); // styling
					if (typeof categoryInfo.imageDataURI === "string" && categoryInfo.imageDataURI.indexOf("data:image") === 0) {
						var img = document.createElement("img");
						img.width = "16";
						img.height = "16";
						img.src = categoryInfo.imageDataURI;
						anchor.appendChild(img);
					} else {
						var imageClass = categoryInfo.imageClass || "core-sprite-blank-menu-item";
						anchor.classList.add(imageClass);
					}
					listItem.appendChild(anchor);
					sideMenuList.appendChild(listItem);
					this.categorizedAnchors[categoryInfo.id] = anchor;
				}, this);

				this._updateCategoryAnchors();
				this.parentNode.appendChild(sideMenuList);
			}

			if (this.state === CLOSED_STATE) {
				this.contentNode.style.left = "0"; //$NON-NLS-0$
				if (this._timeout) {
					window.clearTimeout(this._timeout);
					this._timeout = null;
				}
				this._timeout = window.setTimeout(function() {
					this.parentNode.style.display = 'none'; //$NON-NLS-0$
					this._timeout = null;
				}.bind(this), TRANSITION_DURATION_MS);
				this.parentNode.classList.add("animating"); //$NON-NLS-0$
			} else {
				if (this._timeout) {
					window.clearTimeout(this._timeout);
					this._timeout = null;
				}
				this.parentNode.classList.remove("animating"); //$NON-NLS-0$
				this.parentNode.style.display = 'block'; //$NON-NLS-0$
				this.parentNode.style.width = SIDE_MENU_OPEN_WIDTH;
				this.contentNode.style.left = SIDE_MENU_OPEN_WIDTH;
			}
		},
		hide: function() {
			localStorage.setItem(LOCAL_STORAGE_NAME, CLOSED_STATE);
			this.contentNode.style.left = "0"; //$NON-NLS-0$
		},
		toggle: function() {
			// add animation if necessary
			var pageContent = this.contentNode;
			if (pageContent) {
				pageContent.classList.add("content-fixedHeight-animation"); //$NON-NLS-0$
			}

			if (this.state === OPEN_STATE) {
				this.state = CLOSED_STATE;
			} else {
				this.state = OPEN_STATE;
			}

			if (this.state === DEFAULT_STATE) {
				localStorage.removeItem(LOCAL_STORAGE_NAME);
			} else {
				localStorage.setItem(LOCAL_STORAGE_NAME, this.state);
			}
			this.render();
		},
		_updateCategoryAnchors: function() {
			Object.keys(this.categorizedAnchors).forEach(function(category) {
				var anchor = this.categorizedAnchors[category];
				var links = [];
				if (category === this.currentCategory) {
					anchor.href = "";
					anchor.onclick = function(){return false;};
					anchor.title = anchor.parentElement.categoryName;
					return;
				}

				if (this.categorizedPageLinks[category]) {
					links.push.apply(links, this.categorizedPageLinks[category]);
				}
				if (this.categorizedRelatedLinks[category]) {
					links.push.apply(links, this.categorizedRelatedLinks[category]);
				}
				if (links.length === 0) {
					anchor.href = "";
					anchor.title = anchor.parentElement.categoryName;
				} else {
					links.sort(function compareLinks(link1, link2) {
						if (link1.order < link2.order) {
							return -1;
						} else if (link2.order < link1.order) {
							return 1;
						}
						return link1.title.localeCompare(link2.title);
					});
					var bestLink = links.shift();
					anchor.href = bestLink.href;
					anchor.title = bestLink.title;
				}
			}, this);
		}
	};
	return SideMenu;
});