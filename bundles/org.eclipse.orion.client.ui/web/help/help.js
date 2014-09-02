/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

/*eslint-env browser, amd*/
/*global URL*/
define(["require", "i18n!orion/help/nls/messages", "orion/bootstrap", "orion/commandRegistry", "orion/fileClient", "orion/searchClient",
		"orion/globalCommands", "orion/URITemplate", "orion/Deferred", "marked/marked", "orion/webui/littlelib","orion/objects",
		"orion/explorers/explorer", "orion/contentTypes", "orion/status", "orion/operationsClient", "orion/commands", "orion/widgets/input/ComboTextInput", "orion/inlineSearchResultExplorer"],
	function(require, messages, mBootstrap, mCommandRegistry, mFileClient, mSearchClient, mGlobalCommands, URITemplate, Deferred, marked,
				lib, objects, mExplorer, mContentTypes, mStatus, mOperationsClient, mCommands, ComboTextInput, InlineSearchResultExplorer) {

	var fileClient, progress, contentTypeService, statusService;
	var helpModel;
	var output, tableTree;
	var selectedItem;
	var anchorElement;
	var linkCounter = 0;
	var imageCounter = 0;
	var outputCSSloaded = false;

	var searchResultExplorer, searchResultsTitle, searchWrapper, searchResultsWrapper, searchBox;

	var itemCache = {};
	var imageCache = {};
	var rootCreationListeners = [];

	var ATTRIBUTE_ORIGINAL_HREF = "orionHref"; //$NON-NLS-0$
	var PREFIX_RELATIVE_IMAGE = "_help_img_"; //$NON-NLS-0$
	var PREFIX_RELATIVE_LINK = "_help_a_"; //$NON-NLS-0$
	var RELATIVE_IMAGE_REGEX = new RegExp("^" + PREFIX_RELATIVE_IMAGE); //$NON-NLS-0$
	var RELATIVE_LINK_REGEX = new RegExp("^" + PREFIX_RELATIVE_LINK); //$NON-NLS-0$
	var FILENAME_REGEX = /^(.*)\.(\w+)(?:[\?#]|$)/i;
	var LINK_START_REGEX = /<a/;
	var TAG_END_REGEX = /(?=>$)/;
	var ABOUT_BLANK = "about:blank"; //$NON-NLS-0$
	var HASH = "#"; //$NON-NLS-0$
	var HIDDEN = "_"; //$NON-NLS-0$
	var SEPARATOR = "/"; //$NON-NLS-0$

	var MINIMUM_HEADER_LEVEL = 2, MAXIMUM_HEADER_LEVEL = 4;
	var HEADER_REGEX = new RegExp("^H([" + MINIMUM_HEADER_LEVEL + "-" + MAXIMUM_HEADER_LEVEL + "])$"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	var ROOT_FOLDER = "/help/Documentation"; //$NON-NLS-0$
	var TEMPLATE = new URITemplate(require.toUrl("help/help.html") + "#{,resource}"); //$NON-NLS-1$ //$NON-NLS-0$

	function displayErrorStatus(error) {
		if (!error.responseText) {
			error.Severity = "Error"; //$NON-NLS-0$
			if (error.status === 0) {
				error.Message = messages.noResponse;
			} else {
				try {
					error.Message = JSON.stringify(error);
				} catch (e) {
					error.Message = messages.unknownError;
				}
			}
		}
		statusService.setProgressResult(error);
	}

	function createItem(node, content, anchor, dontCache) {
		var id = node.Location + (anchor ? HASH + anchor : "");
		if (id.charAt(id.length - 1) === SEPARATOR) {
			/* remove trailing '/', if there is one, to ensure consistency for id lookups */
			id = id.substring(0, id.length - 1);
		}

		if (anchor) {
			var element = content.getElementById(anchor);
			var title = element.textContent;
		} else {
			var match = FILENAME_REGEX.exec(node.Name);
			title = match ? match[1] : node.Name;
		}

		var result = itemCache[id] || {};
		result.id = id;
		result.fileNode = node;
		result.title = title;
		result.content = content;
		result.anchor = anchor;

		if (!dontCache) {
			itemCache[id] = result;
		}
		return result;
	}

	function getItem(id) {
		return itemCache[id];
	}

	function normalize(path, base) {
		if (base) {
			var index = base.lastIndexOf(SEPARATOR);
			path = base.substring(0, index + 1) + path;
		}

		var pathSegments = path.split(SEPARATOR);
		index = 0;
		while (index < pathSegments.length) {
			var segment = pathSegments[index];
			if (segment === ".") { //$NON-NLS-0$
				pathSegments.splice(index, 1);
			} else if (segment === "..") { //$NON-NLS-0$
				if (index === 0) {
					/* invalid, attempting to go further back than root */
					return "";
				}
				pathSegments.splice(index-- - 1, 2);
			} else {
				index++;
			}
		}

		return pathSegments.join(SEPARATOR);
	}

	/* create instance of marked with a custom renderer for handling relative urls and images */

	var customRenderer = new marked.Renderer();
	customRenderer.image = function(href, title, altText) {
		if (href.indexOf(":") === -1 && fileClient.readBlob) { //$NON-NLS-0$
			var targetURL = href;
			href = "";
			/*
			 * Assign an id that's easily recognizable and consistent to images with relative
			 * locations that will be loaded and set at render time.
			 */
			var id = PREFIX_RELATIVE_IMAGE + imageCounter++;
		}
		var result = marked.Renderer.prototype.image.call(this, href, title, altText);
		if (id) {
			result = result.replace(TAG_END_REGEX, ' id="' + id + '" ' + ATTRIBUTE_ORIGINAL_HREF + '="' + targetURL + '"'); //$NON-NLS-1$ //$NON-NLS-0$			
		}
		return result;
	};
	customRenderer.link = function(href, title, text) {
		var result = marked.Renderer.prototype.link.call(this, href, title, text);
		if (href.indexOf(":") === -1) { //$NON-NLS-0$
			/*
			 * Assign an id that's easily recognizable and consistent to links with relative
			 * locations that will have their targetted URL re-assigned at render time.
			 */
			var target = "_top"; //$NON-NLS-0$
			var id = PREFIX_RELATIVE_LINK + linkCounter++;
			result = result.replace(LINK_START_REGEX, '<a id="' + id + '"'); //$NON-NLS-1$ //$NON-NLS-0$
		} else {
			target = "_blank"; //$NON-NLS-0$
		}
		result = result.replace(LINK_START_REGEX, '<a target="' + target + '"'); //$NON-NLS-1$ //$NON-NLS-0$
		return result;
	};

	var markedOptions = marked.parse.defaults;
	markedOptions.sanitize = true;
	markedOptions.tables = true;
	markedOptions.renderer = customRenderer;

	/* define explorer model and renderer for displaying help items */

	var HelpModel = (function() {
		function HelpModel() {
		}
		HelpModel.prototype = {
			getRoot: function(onItem) {
				if (this._root) {
					onItem(this._root);
					return;
				}

				rootCreationListeners.push(onItem);
				if (rootCreationListeners.length > 1) {
					/* root item is already being retrieved */
					return;
				}

				(progress ? progress.progress(fileClient.read(ROOT_FOLDER, true), "Retrieving " + ROOT_FOLDER) : fileClient.read(ROOT_FOLDER, true)).then( //$NON-NLS-0$
					function(node) {
						this._root = createItem(node);
						rootCreationListeners.forEach(function(fn) {
							fn(this._root);							
						}.bind(this));
						rootCreationListeners = [];
					}.bind(this),
					displayErrorStatus
				);
			},
			getChildren: function(parentItem, onComplete) {
				if (parentItem.children) {
					onComplete(parentItem.children);
					return;
				}

				var location = parentItem.fileNode.Location;
				if (parentItem.fileNode.Directory) {
					(progress ? progress.progress(fileClient.fetchChildren(location), "Retrieving children " + location) : fileClient.fetchChildren(location)).then( //$NON-NLS-0$
						function(childNodes) {
							var children = [];
							childNodes.forEach(function(node) {
								if (node.Name.charAt(0) !== HIDDEN) {
									var item = createItem(node);
									item.parent = parentItem;
									children.push(item);
								}
							}.bind(this));
							children.sort(function(a,b) {
//								if (a.fileNode.Directory !== b.fileNode.Directory) {
//									return a.fileNode.Directory ? -1 : 1;
//								}
								var name1 = a.title && a.title.toLowerCase();
								var name2 = b.title && b.title.toLowerCase();
								if (name1 < name2) {
									return -1;
								}
								return name1 > name2 ? 1 : 0;
							});
							parentItem.children = children;
							onComplete(children);
						}.bind(this),
						function(error) {
							displayErrorStatus(error);
							onComplete([]);
						}
					);
					return;
				}

				var computeAnchorChildren = function(parentItem) {
					var document = parentItem.content;
					var children = [];
					var lastHeaderItems = [];
					var lastLevel = 1;
					var currentElement = document.body.children[0];
					while (currentElement) {
						var tagName = currentElement.tagName;
						var match = HEADER_REGEX.exec(tagName);
						if (match) {
							var level = parseInt(match[1]);
							if (level <= lastLevel + 1) {
								var item = createItem(parentItem.fileNode, document, currentElement.id);
								item.children = [];
								if (level === MINIMUM_HEADER_LEVEL) {
									var parent = parentItem;
									children.push(item);
								} else {
									parent = lastHeaderItems[level - 1];
									parent.children.push(item);
								}
								item.parent = parent;
								lastHeaderItems[level] = item;
								for (var i = level + 1; i <= MAXIMUM_HEADER_LEVEL; i++) {
									lastHeaderItems[i] = null;
								}
								lastLevel = level;
							}
						}
						currentElement = currentElement.nextElementSibling;
					}
					return children;
				}.bind(this);

				var computeChildren = function(parentItem) {
					/* only displayed html documents have their contents parsed for TOC entries */
					if (parentItem.content.nodeName === "#document") { //$NON-NLS-0$
						var children = computeAnchorChildren(parentItem);
					} else {
						children = [];
					}
					parentItem.children = children;
					return children;
				};

				if (parentItem.content) {
					onComplete(computeChildren(parentItem));
				} else {
					retrieveContent(parentItem.fileNode).then(
						function(content) {
							parentItem.content = content;
							onComplete(computeChildren(parentItem));
						},
						function(error) {
							displayErrorStatus(error);
							onComplete([]);
						}
					);
				}
			},
			getId: function(item) {
				return item.id;
			}
		};
		return HelpModel;
	}());

	helpModel = new HelpModel();

	function selectItem(item) {
		function ensureExposed(item) {
			var result = new Deferred();
			if (!item.parent) {
				result.resolve();
			} else {
				ensureExposed(item.parent).then(function() {
					tableTree.expand(item, result.resolve);
				});
			}
			return result;
		}
		function doit() {
			if (item === selectedItem) {
				return;
			}

			if (selectedItem) {
				selectedItem.selected = false;
				var element = lib.node(selectedItem.id);
				if (element) {
					element.classList.remove("selected"); //$NON-NLS-0$
				}
			}
			selectedItem = item;
			selectedItem.selected = true;
			element = lib.node(item.id);
			if (element) {
				element.classList.add("selected"); //$NON-NLS-0$
			}
		}

		if (tableTree.isExpanded(item)) {
			if (item === selectedItem) {
				tableTree.collapse(item);
			}
			doit();
		} else {
			ensureExposed(item).then(doit);
		}
	}

	function clickListener(event) {
		var pageHash = window.location.hash;
		var itemId = new URL(event.target.href).hash;

		/*
		 * The following manual check for a navigate within the same page is done
		 * to workaround an IE behaviour that causes a page reload on every TOC
		 * item selection otherwise.  This workaround is not needed on Chrome or
		 * Firefox, but still runs on them to maintain consistency.
		 */
		if (window.location.origin === event.target.origin) {
			event.preventDefault();
			window.location.hash = itemId;
			return;
		}

		if (itemId !== pageHash) {
			/* selection will be updated in the subsequent hashchange event */
			return;
		}

		if (!itemId.indexOf(HASH)) {
			itemId = itemId.substring(1); /* remove leading '#' */
		}
		itemId = decodeURIComponent(itemId);
		var item = getItem(itemId);
		if (item) {
			selectItem(item);
		}
	}

	function createLink(item, id, document) {
		var result = document.createElement("a"); //$NON-NLS-0$
		result.className = "navlink targetSelector"; //$NON-NLS-0$
		result.appendChild(document.createTextNode(item.title));
		result.href = TEMPLATE.expand({resource: id});
		result.target = "_top"; //$NON-NLS-0$
		return result;
	}
	
	function HelpExplorer(options) {
		var renderer = new HelpRenderer({
			registry: options.registry,
			commandService: options.commandService,
			singleSelection: true,
			checkbox: false
		}, this);
		mExplorer.Explorer.call(this, options.registry, null, renderer, options.commandService);
		this.parentId = options.parentId;
	}

	HelpExplorer.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(HelpExplorer.prototype, {
		display: function() {
			var deferred = new Deferred();
			var model = helpModel;
			this.createTree(
				this.parentId,
				model,
				{
					setFocus: false, /* don't steal focus on load */
					onComplete: function() {
						deferred.resolve();
					}
				}
			);
			tableTree = this.myTree;
			return deferred;
		},
	});

	function HelpRenderer(options) {
		options.cachePrefix = null; /* don't persist table state */
		options.noRowHighlighting = true;
		mExplorer.SelectionRenderer.apply(this, arguments);
	}
	HelpRenderer.prototype = Object.create(mExplorer.SelectionRenderer.prototype);
	objects.mixin(HelpRenderer.prototype, {
		getCellElement: function(col_no, item, tableRow) {
			if (col_no !== 0) {
				return null;
			}

			var td = document.createElement("td"); //$NON-NLS-0$
			var div = document.createElement("div"); //$NON-NLS-0$
			td.appendChild(div);
			if (item.children) {
				if (item.children.length) {
					this.getExpandImage(tableRow, div);
				}
			} else {
				helpModel.getChildren(item, function(children) {
					if (children.length) {
						var temp = document.createElement("div"); //$NON-NLS-0$
						this.getExpandImage(tableRow, temp);
						div.insertBefore(temp.lastElementChild, div.firstElementChild);
					}
				}.bind(this));
			}

			var link = createLink(item, tableRow.id, document);
			div.appendChild(link);
			link.addEventListener("click", clickListener); //$NON-NLS-0$

			td.classList.add("treeTableRow"); //$NON-NLS-0$
			td.classList.add("helpItem"); //$NON-NLS-0$
			if (item.selected) {
				tableRow.classList.add("selected"); //$NON-NLS-0$
			}

			return td;
		}
	});

	function hashChanged(hash) {
		hash = decodeURIComponent(hash);
		var index = hash.indexOf(HASH);
		if (!index) {
			hash = hash.substring(1); /* remove leading '#' */
			index = hash.indexOf(HASH);
		}
		var location = index === -1 ? hash : hash.substring(0, index);
		var anchor = index === -1 ? null : hash.substring(index + 1);
		var item = getItem(hash);
		if (item) {
			/* the hash corresponds to a page in the TOC */
			setOutput(item).then(
				function() {
					selectItem(item);
				}
			);
			return;
		}

		/*
		 * The hash does not have a TOC entry, so it either is not intended to appear there or
		 * has not loaded yet (the latter is often the case if the help page is seeded with the
		 * hash at load time).  If the hash is resolved to point at a valid resource then create
		 * the item for it and select it in the TOC if it should have an entry there.
		 */
		(progress ? progress.progress(fileClient.read(location, true), "Retrieving " + location) : fileClient.read(location, true)).then( //$NON-NLS-0$
			function(node) {
				if (node.Directory) {
					item = createItem(node, undefined, undefined, true);
					helpModel.getChildren(item, function() {
						setOutput(item).then(
							function() {
								selectInTOC(item);
							}
						);
					});
				} else {
					/*
					 * The hash points at a valid resource, so display it and select its item in
					 * the TOC if appropriate.
					 */
					retrieveContent(node).then(
						function(content) {
							item = createItem(node, content, anchor, true);
							setOutput(item).then(
								function() {
									selectInTOC(item);
								}
							);
						},
						displayErrorStatus
					);
				}
			}.bind(this),
			displayErrorStatus
		);
	}

	function outputData(item) {
		output.src = item.content || "";
	}

	function outputHTML(item) {
		var outputDocument = output.contentDocument;
		if (!selectedItem || selectedItem.fileNode.Location !== item.fileNode.Location) {

			/*
			 * The output is being cleared, so revoke existing data URLs that were allocated
			 * for displaying its images since they are no longer valid.
			 */
			var keys = Object.keys(imageCache);
			keys.forEach(function(current) {
				URL.revokeObjectURL(imageCache[current]);
			});
			imageCache = {};

			outputDocument.body.scrollTop = 0;
			outputDocument.body.style = "";
			outputDocument.childNodes[0].innerHTML = item.content.documentElement.innerHTML;

			var adjustScrollTop = false;
			var link = outputDocument.createElement("link"); //$NON-NLS-0$
			link.href = require.toUrl("help/help.css"); //$NON-NLS-0$
			link.rel = "stylesheet"; //$NON-NLS-0$
			link.type = "text/css"; //$NON-NLS-0$
			if (item.anchor) {
				anchorElement = outputDocument.getElementById(item.anchor);
			}
			if (anchorElement) {
				link.onload = function() {
					link.onload = null;
					adjustScrollTop = true;
					anchorElement.scrollIntoView(true);
				};
			}
			outputDocument.head.appendChild(link);
			outputDocument.body.classList.add("orionMarkdown"); //$NON-NLS-0$

			var elements = outputDocument.getElementsByTagName("IMG"); //$NON-NLS-0$
			for (var i = 0; i < elements.length; i++) {
				var current = elements[i];
				if (RELATIVE_IMAGE_REGEX.test(current.id)) {
					var dataURL = imageCache[current.id];
					if (dataURL) {
						current.src = dataURL;
					} else {
						(function(element) {
							var href = normalize(element.getAttribute(ATTRIBUTE_ORIGINAL_HREF), item.fileNode.Location);
							fileClient.readBlob(href).then(
								function(bytes) {
									var match = href.match(FILENAME_REGEX);
									var mimeType = match ? "image/" + match[2] : "image/png"; //$NON-NLS-1$ //$NON-NLS-0$
									dataURL = URL.createObjectURL(new Blob([bytes], {type: mimeType}));
									imageCache[element.id] = dataURL;

									if (!adjustScrollTop || !anchorElement || anchorElement.offsetTop < element.offsetTop) {
										/* do not need to treat the image load specially */
										element.src = dataURL;
									} else {
										/*
										 * Image is above the anchor element and the final page styling has been applied,
										 * so must adjust the scrollTop to keep the viewport steady.
										 */
										var newImage = new Image();
										newImage.src = dataURL;
										newImage.onload = function() {
											newImage.onload = null;
											if (!element.parentElement) {
												return; /* page has likely been unloaded */
											}
											element.parentElement.replaceChild(newImage, element);
											outputDocument.body.scrollTop = anchorElement.offsetTop;
										};
									}
								},
								function(/*error*/) {
									/* image load failed, don't display error text, image will be missing in output */
								}
							);
						})(current);
					}
				}
			}

			/* update the targeted URLs for links with relative locations */
			elements = outputDocument.getElementsByTagName("A"); //$NON-NLS-0$
			for (i = 0; i < elements.length; i++) {
				current = elements[i];
				if (RELATIVE_LINK_REGEX.test(current.id)) {
					var hash = normalize(current.getAttribute("href"), item.fileNode.Location); //$NON-NLS-0$
					current.href = TEMPLATE.expand({resource: hash});
				}
			}
		} else {
			/* just relocating within the current output content */
			if (item.anchor) {
				anchorElement = outputDocument.getElementById(item.anchor);
			}
			if (anchorElement) {
				anchorElement.scrollIntoView(true);
			} else {
				outputDocument.body.scrollTop = 0;
			}
		}
	}
	
	function outputTOC(item) {
		var outputDocument = output.contentDocument;
		var outputBody = outputDocument.body;
		outputBody.scrollTop = 0;
		outputBody.style = "";
		lib.empty(outputBody);

		/* the following attributes and style are left with invalid values after viewing a .pdf */
		outputBody.removeAttribute("marginwidth"); //$NON-NLS-0$
		outputBody.removeAttribute("marginheight"); //$NON-NLS-0$
		outputBody.style.backgroundColor = "initial"; //$NON-NLS-0$

		/* iframes do not inherit container stylesheets, must explicitly link on content document */
		var link = outputDocument.createElement("link"); //$NON-NLS-0$
		link.href = require.toUrl("help/help.css"); //$NON-NLS-0$
		link.rel = "stylesheet"; //$NON-NLS-0$
		link.type = "text/css"; //$NON-NLS-0$
		link.onload = function() {
			link.onload = null;
			var h1 = outputDocument.createElement("h1"); //$NON-NLS-0$
			h1.textContent = item.title;
			outputBody.appendChild(h1);
			var h3 = outputDocument.createElement("h3"); //$NON-NLS-0$
			h3.textContent = messages.Contents;
			outputBody.appendChild(h3);
			var ul = outputDocument.createElement("ul"); //$NON-NLS-0$
			outputBody.appendChild(ul);

			var displayChildren = function(children) {
				children.forEach(function(current) {
					var li = outputDocument.createElement("li"); //$NON-NLS-0$
					ul.appendChild(li);
					var link = createLink(current, current.id, outputDocument);
					li.appendChild(link);
				});
			};
	
			if (item.children) {
				displayChildren(item.children);
			} else {
				helpModel.getChildren(item, displayChildren);
			}
		};
		outputDocument.head.appendChild(link);
		outputBody.classList.add("orionMarkdown"); //$NON-NLS-0$
	}

	function retrieveContent(node) {
		var location = node.Location;
		var result = new Deferred();
		var match = location.match(FILENAME_REGEX);
		if (match) {
			if (match[2] === "html" || match[2] === "md" || !fileClient.readBlob) {
				(progress ? progress.progress(fileClient.read(location, false), "Retrieving " + location) : fileClient.read(location, false)).then( //$NON-NLS-0$
					function(content) {
						if (match[2] === "html") {
							var html = content;
						} else if (match[2] === "md") {
							html = "<html><body>" + marked(content, markedOptions) + "</body></html>";
						}

						if (html) {
				            content = document.implementation.createHTMLDocument("");
				            content.documentElement.innerHTML = html;
						}
						result.resolve(content);
					}.bind(this),
					result.reject
				);
			} else {
				(progress ? progress.progress(fileClient.readBlob(location), "Retrieving " + location) : fileClient.readBlob(location)).then( //$NON-NLS-0$
					function(bytes) {
						Deferred.when(contentTypeService.getFileContentType(node), function(contentType) {
							var mimeType = contentType ? contentType.id : "text/plain"; //$NON-NLS-0$
							var content = URL.createObjectURL(new Blob([bytes], {type: mimeType}));
							result.resolve(content);
						});
					},
					result.reject
				);
			}
		}
		return result;
	}

	function selectInTOC(item) {
		var segments = item.fileNode.Location.substring(ROOT_FOLDER.length + 1).split(SEPARATOR);
		for (var i = 0; i < segments.length; i++) {
			if (!segments[i].length) {
				segments.splice(i--, 1); /* remove empty segment, adjust i accordingly */
			} else if (segments[i].charAt(0) === HIDDEN) {
				/* an ancestor of item's path is hidden, do not attempt to show/select it */
				return;
			}
		}
		if (item.anchor) {
			segments.push(HASH + item.anchor);
		}

		/* find the item that's closest to the targeted item */
		var foundItem;
		var idString = ROOT_FOLDER;
		for (i = 0; i < segments.length; i++) {
			if (segments[i].indexOf(HASH)) {
				idString += SEPARATOR + segments[i]; /* typical case */
			} else {
				idString += segments[i]; /* anchor segment */
			}
			var test = getItem(idString);
			if (test && test.parent) {
				foundItem = test;
			} else {
				break;
			}
		}
		if (i === segments.length) {
			/* full item ancestory is already created, so just select the item */
			selectItem(foundItem);
			return;
		}

		var loadItem = function(parentItem, remainingSegments) {
			helpModel.getChildren(parentItem, function() {
				var id = parentItem.id + (remainingSegments[0].indexOf(HASH) ? SEPARATOR + remainingSegments[0] : remainingSegments[0]);
				var item = getItem(id);
				if (item) {
					if (remainingSegments.length === 1) {
						selectItem(item);
					} else {
						loadItem(item, remainingSegments.slice(1));
					}
				}
			});
		};

		if (!foundItem) {
			/* root item has not been created yet */
			helpModel.getRoot(function(rootItem) {
				loadItem(rootItem, segments);
			});
		} else {
			loadItem(foundItem, segments.slice(i));
		}
	}

	function setOutput(item) {
		var result = new Deferred();

		if (item.fileNode.Directory) {
			var outputFunction = outputTOC;
		} else if (item.content && item.content.nodeName === "#document") { //$NON-NLS-0$
			outputFunction = outputHTML;
		} else {
			outputFunction = outputData;
		}
		anchorElement = null;
		var outputDocument = output.contentDocument;

		var doit = function() {
			if (!outputCSSloaded) {
				var link = outputDocument.createElement("link"); //$NON-NLS-0$
				link.href = require.toUrl("help/help.css"); //$NON-NLS-0$
				link.rel = "stylesheet"; //$NON-NLS-0$
				link.type = "text/css"; //$NON-NLS-0$
				link.onload = function() {
					link.onload = null;
					outputCSSloaded = true;
					outputFunction(item);
					result.resolve();
				};
				outputDocument.head.appendChild(link);
			} else {
				outputFunction(item);
				result.resolve();
			}
		};

		if (outputFunction !== outputData && (!outputDocument || output.src !== ABOUT_BLANK)) {
			output.onload = function() {
				output.onload = null;
				outputDocument = output.contentDocument;
				doit();
			};
			output.src = ABOUT_BLANK;
		} else {
			doit();
		}

		return result;
	}

	function searchButtonListener() {
		helpModel.getRoot(function(root) {
			var searchParams = {
				resource: root.fileNode.Location,
				keyword: searchBox.getTextInputValue(),
				sort: "Path asc",
				rows: 100,
				start: 0
			};

			searchWrapper.classList.add("searchWrapperActive"); //$NON-NLS-0$
			searchResultExplorer.runSearch(searchParams, searchResultsWrapper);
		});
	}

	mBootstrap.startup().then(function(core) {
		var serviceRegistry = core.serviceRegistry;
		fileClient = new mFileClient.FileClient(serviceRegistry);
		progress = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
		var commandRegistry = new mCommandRegistry.CommandRegistry({});
		contentTypeService = new mContentTypes.ContentTypeRegistry(serviceRegistry);
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandRegistry, fileService: fileClient});
		mGlobalCommands.generateBanner("orion-helpPage", serviceRegistry, commandRegistry, core.preferences, searcher); //$NON-NLS-0$
		mGlobalCommands.setPageTarget({task: messages.Help, serviceRegistry: serviceRegistry, commandService: commandRegistry});

		var sideBar = lib.node("sidebar"); //$NON-NLS-0$
		var outputDiv = lib.node("output"); //$NON-NLS-0$

		var treeDiv = document.createElement("div"); //$NON-NLS-0$
		treeDiv.style.overflow = "auto"; //$NON-NLS-0$
		sideBar.appendChild(treeDiv);

		output = document.createElement("iframe"); //$NON-NLS-0$
		output.frameBorder = 0;
		output.style.width = "100%"; //$NON-NLS-0$
		output.style.height = "100%"; //$NON-NLS-0$
		outputDiv.appendChild(output);

//		var label = document.createElement("div"); //$NON-NLS-0$
//		label.className = "searchSectionLabel"; //$NON-NLS-0$
//		label.textContent = "Search:";
//		parent.appendChild(label);
//		var text = document.createElement("input"); //$NON-NLS-0$
//		text.className = "searchSectionText"; //$NON-NLS-0$
//		parent.appendChild(text);
//		var button = document.createElement("button"); //$NON-NLS-0$
//		button.textContent = "Go";//$NON-NLS-0$
//		button.className = "searchSectionButton"; //$NON-NLS-0$
//		parent.appendChild(text);

		if (false) {
			searchResultExplorer = new InlineSearchResultExplorer(
				serviceRegistry,
				commandRegistry,
				{
					getSearchResultsTitleDiv: function() {
						return searchResultsTitle;
					}
				});
			
			searchWrapper = document.createElement("div"); //$NON-NLS-0$
			searchWrapper.classList.add("searchWrapper"); //$NON-NLS-0$
			sideBar.appendChild(searchWrapper);
			
			var dismissButton = document.createElement("button"); //$NON-NLS-0$
			dismissButton.classList.add("imageSprite"); //$NON-NLS-0$
			dismissButton.classList.add("core-sprite-close"); //$NON-NLS-0$
			dismissButton.classList.add("dismissButton"); //$NON-NLS-0$
			dismissButton.classList.add("searchDismissButton"); //$NON-NLS-0$
			dismissButton.addEventListener("click", function(/*e*/) {
				searchWrapper.classList.remove("searchWrapperActive"); //$NON-NLS-0$
			});
			searchWrapper.appendChild(dismissButton);
			
			searchResultsTitle = document.createElement("div"); //$NON-NLS-0$
			searchResultsTitle.classList.add("searchResultsTitle"); //$NON-NLS-0$
			searchWrapper.appendChild(searchResultsTitle);

			searchResultsWrapper = document.createElement("div"); //$NON-NLS-0$
			searchResultsWrapper.id = "helpSearchResultsWrapper"; //$NON-NLS-0$
			searchResultsWrapper.classList.add("searchResultsWrapperDiv"); //$NON-NLS-0$
			searchResultsWrapper.classList.add("selectionModelContainer"); //$NON-NLS-0$
			searchWrapper.appendChild(searchResultsWrapper);

			var parent = lib.node('pageToolbar'); //$NON-NLS-0$
			searchBox = new ComboTextInput({
				id: "helpSearchInput", //$NON-NLS-0$
				parentNode: parent,
				hasButton: true,
				buttonClickListener: searchButtonListener,
				serviceRegistry: serviceRegistry
			});
	
			var searchButtonSpan = document.createElement("span"); //$NON-NLS-0$
			searchButtonSpan.classList.add("core-sprite-search"); //$NON-NLS-0$
			var searchButton = searchBox.getButton();
			searchButton.classList.add("searchButton"); //$NON-NLS-0$
			searchButton.appendChild(searchButtonSpan);
			var searchTextInputBox = searchBox.getTextInputNode();
			searchTextInputBox.placeholder = /*messages[*/"Search"/*])*/; //$NON-NLS-0$
	
			var resultsButton = document.createElement("button"); //$NON-NLS-0$
			resultsButton.classList.add("core-sprite-rightarrow"); //$NON-NLS-0$
			parent.appendChild(resultsButton);
			resultsButton.title = /*messages[*/"Show Search Results"/*])*/; //$NON-NLS-0$
			resultsButton.addEventListener("click", function(/*e*/) { //$NON-NLS-0$
				searchWrapper.classList.add("searchWrapperActive"); //$NON-NLS-0$
			});
		}

		var ID_PRINT = "orion.help.print"; //$NON-NLS-0$
		var printCommand = new mCommands.Command({
			imageClass: "core-sprite-stop", //$NON-NLS-0$
			tooltip: messages.Print,
			id: ID_PRINT,
			callback: function(/*data*/) {
				output.contentWindow.print();
			}
		});
		commandRegistry.addCommand(printCommand);
		commandRegistry.registerCommandContribution("pageNavigationActions", ID_PRINT, 1, null, false); //$NON-NLS-0$
		commandRegistry.renderCommands("pageNavigationActions", lib.node("pageNavigationActions"), {}, {}, "tool"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		new HelpExplorer({
			parentId: treeDiv,
			registry: serviceRegistry,
			commandService: commandRegistry
		}).display();
		
		window.addEventListener("hashchange", function(/*event*/) { //$NON-NLS-0$
			hashChanged(window.location.hash);
		});

		var hash = window.location.hash;
		if (hash) {
			hashChanged(hash);
		}
	});
});
