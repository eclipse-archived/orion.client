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
define(["require", "i18n!orion/shell/nls/messages", "orion/bootstrap", "orion/commandRegistry", "orion/fileClient", "orion/searchClient", "orion/globalCommands",
		"orion/webui/treetable", "orion/i18nUtil", "orion/PageUtil", "orion/URITemplate", "orion/Deferred",
		"orion/status", "orion/progress", "orion/operationsClient", "orion/webui/splitter", "marked/marked"],
	function(require, messages, mBootstrap, mCommandRegistry, mFileClient, mSearchClient, mGlobalCommands, mTreeTable, i18nUtil, PageUtil, URITemplate, Deferred, mStatus, mProgress, mOperationsClient, mSplitter, marked) {

	var fileClient, progress;
	var tableTree;
	var helpModel;
	var selectedItem, selectedNode;
	var anchorElement;
	var itemsCache = {};
	var output;

	var FILENAME_README = "toc.xml"; //$NON-NLS-0$
	var ROOT_FOLDER = "/file/ggayed-OrionContent/helpProject3/"; //$NON-NLS-0$
	var TAG_END_REGEX = /(?=>$)/;
	var LINK_START_REGEX = /<a/;
	var EXTENSION_REGEX = /\.([0-9a-z]+)(?:[\?#]|$)/i;
	var PREFETCH_FULL_TOC = true;
	var SEPARATOR = "/";
	
	var template = new URITemplate(require.toUrl("help/help.html") + "#{,resource}"); //$NON-NLS-0$
	var imgCount = 0;

	function cacheItem(id, item) {
		itemsCache[id] = item;
	}

	function getItem(id) {
		if (!id.indexOf("#")) {
			id = id.substring(1);
		}
		return itemsCache[decodeURIComponent(id)];
	}

	function normalize(path, base) {
		var index;
		if (base) {
			index = base.lastIndexOf(SEPARATOR);
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
		if (href.indexOf(":") === -1) { //$NON-NLS-0$
			try {
				if (fileClient.readBlob) {
					var id = "_md_img_" + imgCount++; //$NON-NLS-0$
					var location = normalize(href, selectedNode.Location);
					(function(id, href) {
						fileClient.readBlob(href).then(function(bytes) {
							var extensionMatch = href.match(EXTENSION_REGEX);
							var mimeType = extensionMatch ? "image/" + extensionMatch[1] : "image/png"; //$NON-NLS-1$ //$NON-NLS-0$
							var imageElement = output.contentDocument.getElementById(id);
							var newImage = new Image();
							var objectURL = URL.createObjectURL(new Blob([bytes], {type: mimeType}));
							newImage.src = objectURL;
							newImage.onload = function() {
								newImage.onload = null;
								imageElement.parentElement.replaceChild(newImage, imageElement);
								URL.revokeObjectURL(objectURL);
								if (anchorElement && imageElement.offsetTop < anchorElement.offsetTop) {
									output.contentDocument.body.scrollTop += newImage.height;
								}
							};
						});
					})(id, location);
					href = "";
				}
			} catch(e) {
				console.log(e); // best effort
			}
		}
		var result = marked.Renderer.prototype.image.call(this, href, title, altText);
		if (id) {
			result = result.replace(TAG_END_REGEX, " id='" + id + "'"); //$NON-NLS-1$ //$NON-NLS-0$
		}
		return result;
	};
	customRenderer.link = function(href, title, text) {
		var target = "_blank"; /* assuming external link by default */ //$NON-NLS-0$
		if (href.indexOf(":") === -1) { //$NON-NLS-0$
			try {
				href = normalize(href, selectedNode.Location);
				target = "_top"; //$NON-NLS-0$
			} catch(e) {
				console.log(e); // best effort
			}				
		}
		var result = marked.Renderer.prototype.link.call(this, href, title, text);
		result = result.replace(LINK_START_REGEX, '<a target="' + target + '"'); //$NON-NLS-1$ //$NON-NLS-0$
		return result;
	};

	var markedOptions = marked.parse.defaults;
	markedOptions.sanitize = true;
	markedOptions.tables = true;
	markedOptions.renderer = customRenderer;

	/* define tabletree model and renderer for displaying help items */

	var HelpModel = (function() {
		function HelpModel() {
		}
		HelpModel.prototype = {
			getRoot: function(onItem) {
				if (this._root) {
					onItem(this._root);
					return;
				}

				var location = ROOT_FOLDER + FILENAME_README;
				this._getObject(location).then(
					function(result) {
						this._root = result;
						this._root.isRoot = true;
						onItem(this._root);
					},
					function(error) {
						window.alert(error); // TODO
					}
				);
			},
			getChildren: function(parentItem, onComplete) {
				if (parentItem.children) {
					if (onComplete) {
						onComplete(parentItem.children);
					}
					return;
				}

				this._resolveChildren(parentItem.fileNode, parentItem.element).then(
					function(children) {
						children.forEach(function(current) {
							current.parent = parentItem;
						});
						parentItem.children = children;
						if (onComplete) {
							onComplete(children);
						}
					},
					function(/*error*/) {
						if (onComplete) {
							onComplete([]);
						}
					}
				);
			},
			getId: function(item) {
				return item.id;
			},
			_createItem: function(node, element) {
				var id = element.getAttribute("href") || element.getAttribute("label") || "Row" + this._itemCounter++;
				/* use a URL to compute the id to ensure that it's url-friendly */
				var result = {fileNode: node, element: element, id: id};
				cacheItem(id, result);
				if (PREFETCH_FULL_TOC) {
					this.getChildren(result); /* asynchronous */
				}
				return result;
			},
			_getObject: function(location) {
				var result = new Deferred();
				(progress ? progress.progress(fileClient.read(location, true), "Retrieving " + location) : fileClient.read(location, true)).then( //$NON-NLS-0$
					function(node) {
						(progress ? progress.progress(fileClient.read(location, false), "Retrieving " + location) : fileClient.read(location, false)).then( //$NON-NLS-0$
							function(content) {
								if (window.DOMParser) {
									var parser = new DOMParser();
									var element = parser.parseFromString(content, "text/xml"); //$NON-NLS-0$
								} else {
									// code for IE // TODO still needed?
									var xmlDoc = new ActiveXObject("Microsoft.XMLDOM"); //$NON-NLS-0$
									xmlDoc.async = false;
									xmlDoc.loadXML(content); 
								}
								result.resolve(this._createItem(node, element.children[0]));
							}.bind(this),
							result.reject
						);
					}.bind(this),
					result.reject
				);
				return result;
			},
			_resolveChildren: function(node, element) {
				var result = new Deferred();
				var children = [];
				var childCount = element.children.length;
				if (!childCount) {
					result.resolve(children);
					return result;
				}

				function childResolved() {
					if (!--childCount) {
						children = children.reduce(function(a, b) { /* flatten children */
						    return b ? a.concat(b) : a;
						}, []);
						result.resolve(children);
					}
				}
				for (var i = 0; i < element.children.length; i++) {
					(function(node, index) {
						var child = element.children[i];
						this._resolveElement(node, child).then(
							function(object) {
								children[index] = object;
								childResolved();
							},
							childResolved
						);
					}.bind(this))(node, i);
				}
				return result;
			},
			_resolveElement: function(node, element) {
				var result = new Deferred();
				if (element.nodeName === "topic") { //$NON-NLS-0$
					result.resolve(this._createItem(node, element));
				} else if (element.nodeName === "link") { //$NON-NLS-0$
					var location = element.getAttribute("toc"); //$NON-NLS-0$
					if (!location) {
						result.reject();
					} else {
						var folder = node.Location;
						var separatorIndex = folder.lastIndexOf("/"); //$NON-NLS-0$
						folder = folder.substring(0, separatorIndex + 1);
						(function(location) {
							this._getObject(location).then(
								function(object) {
									this._resolveElement(object.fileNode, object.element).then(result.resolve, result.reject);
								}.bind(this),
								result.reject
							);
						}.bind(this))(folder + location); // TODO use url/file resolver thingy, especially b/c location may be absolute or relative
					}
				} else {
					/* TODO assuming it's a toc (is this valid?) */
					this._resolveChildren(node, element).then(result.resolve, result.reject);
				}
				return result;
			},
			_itemCounter: 0
		};
		return HelpModel;
	}());

	function getItemParent(item, failCount) {
		var result = new Deferred();
		if (item.parent) {
			result.resolve(item.parent);
			return result;
		}
		if (item.isRoot) {
			result.resolve(null);
			return result;
		}

		/*
		 * The item's ancestor has not loaded yet, but is expected to,
		 * so try again after a short delay.
		 */
		if (failCount === undefined) {
			failCount = 0;
		}
		if (failCount++ === 10) {
			/* give up */
			result.reject();
			return result;
		}

		window.setTimeout(
			function() {
				getItemParent(item, failCount).then(result.resolve, result.reject);
			},
			1000
		);

		return result;
	}
	function selectItem(item) {
		function ensureExposed(item) {
			var result = new Deferred();
			if (item.isRoot) {
				tableTree.expand(item, result.resolve);
				return result;
			}
			getItemParent(item).then(
				function(parent) {
					ensureExposed(parent).then(function() {
						tableTree.expand(item, result.resolve);
					});
				},
				function(error) {
					/* ancestor tree was not fully loadable for some reason */
				}
			);
			return result;
		}
		function doit() {
			if (item === selectedItem) {
				return;
			}

			if (selectedItem) {
				selectedItem.selected = false;
				var element = document.getElementById(selectedItem.id);
				if (element) {
					element.classList.remove("selected"); //$NON-NLS-0$
				}
			}
			selectedItem = item;
			selectedItem.selected = true;
			element = document.getElementById(item.id);
			if (element) {
				element.classList.add("selected"); //$NON-NLS-0$
			}
		}

		if (item.children && tableTree.isExpanded(item)) {
			tableTree.collapse(item);
			doit(item);
		} else {
			ensureExposed(item).then(doit);
		}
	}

	function selectItemForHref(href, failCount) {
		var result = new Deferred();
		var item = getItem(href);
		if (item) {
			result.resolve(item);
			return result;
		}

		if (failCount === undefined) {
			failCount = 0;
		}
		if (failCount++ === 10) {
			/* give up */
			result.reject();
			return;
		}
		
		window.setTimeout(
			function() {
				selectItemForHref(href, failCount).then(result.resolve, result.reject);
			},
			1000
		);

		return result;
	}

	function clickListener(event) {
		var itemId = new URL(event.target.href).hash;
		var pageHash = window.location.hash;
		if (itemId !== pageHash) {
			/* selection will be updated in the subsequent hashchange event */
			return;
		}
		selectItem(getItem(itemId));
	}

	function createLink(item, id, document) {
		var result = document.createElement("a"); //$NON-NLS-0$
		result.className = "navlink targetSelector"; //$NON-NLS-0$
		var label = item.element.getAttribute("label") || "don't know!"; //$NON-NLS-1$ //$NON-NLS-0$ // TODO
		result.appendChild(document.createTextNode(label));
		result.href = template.expand({resource: id});
		result.target = "_top"; //$NON-NLS-0$
		return result;
	}

	var HelpRenderer = (function() {
		function HelpRenderer() {
		}
		HelpRenderer.prototype = {
			getTwistieElementId: function(rowId) {
				return rowId + "__expand"; //$NON-NLS-0$
			},
			initTable: function(tableNode) {
			},
			labelColumnIndex: function() {
				return 0;
			},
			render: function(item, tr) {
				tr.classList.add("treeTableRow"); //$NON-NLS-0$
				tr.classList.add("helpItem"); //$NON-NLS-0$
				if (item.selected) {
					tr.classList.add("selected"); //$NON-NLS-0$
				}
				var td = document.createElement("td"); //$NON-NLS-0$
				tr.appendChild(td);

				if (item.element.children.length) {
					var span = document.createElement("span"); //$NON-NLS-0$
					td.appendChild(span);
					var twistieElement = document.createElement("span"); //$NON-NLS-0$
					twistieElement.id = this.getTwistieElementId(tr.id);
					span.appendChild(twistieElement);
					twistieElement.classList.add("modelDecorationSprite"); //$NON-NLS-0$
					twistieElement.classList.add("core-sprite-closedarrow"); //$NON-NLS-0$
					twistieElement.onclick = function(/*event*/) {
						this.tableTree.toggle(tr.id);
					}.bind(this);
				}

				var link = createLink(item, tr.id, document);
				tr.appendChild(link);
				link.addEventListener("click", clickListener); //$NON-NLS-0$
			},
			updateExpandVisuals: function(row, isExpanded) {
				var twistieElement = document.getElementById(this.getTwistieElementId(row.id));
				if (twistieElement) {
					var classList = twistieElement.classList;
					if (isExpanded) {
						classList.add("core-sprite-openarrow"); //$NON-NLS-0$
						classList.remove("core-sprite-closedarrow"); //$NON-NLS-0$
					} else {
						classList.add("core-sprite-closedarrow"); //$NON-NLS-0$
						classList.remove("core-sprite-openarrow"); //$NON-NLS-0$
					}
				}
			}
		};
		return HelpRenderer;
	}());

	function hashChanged(hash) {
		var item = getItem(hash);
		if (item) {
			/* the hash corresponds to a page in the TOC */
			var href = item.element.getAttribute("href"); //$NON-NLS-0$
			if (href) {
				setOutput(href).then(
					function() {
						selectItem(item);
					},
					function(error) {
						// TODO
					}
				);
			} else {
				setTOC(item);
			}
			return;
		} else {
			/*
			 * The hash does not have a TOC entry, so it either is not intended to be reachable directly
			 * from the TOC, or its TOC entry has not loaded yet (typically the case if the help page is
			 * seeded with the hash at load time).
			 */
			setOutput(hash).then(
				function() {
					selectItemForHref(hash).then(
						function(item) {
							selectItem(item);
						},
						function(error) {
							/* do nothing, page is likely not intended to have a TOC entry */
						}
					);
				},
				function(error) {
					// TODO
				}
			);
		}
	}

	function setOutput(href) {
		if (!href.indexOf("#")) {
			href = href.substring(1);
		}
		var result = new Deferred();
		var url = new URL(href);
		var location = ROOT_FOLDER + href;
		(progress ? progress.progress(fileClient.read(location, true), "Retrieving " + location) : fileClient.read(location, true)).then( //$NON-NLS-0$
			function(node) {
				(progress ? progress.progress(fileClient.read(location, false), "Retrieving " + location) : fileClient.read(location, false)).then( //$NON-NLS-0$
					function(rawContent) {
						selectedNode = node;
						var hash = url.hash;
						var path = url.pathname;
						anchorElement = null;
						var extensionMatch = /*href*/path.match(EXTENSION_REGEX);
						if (extensionMatch[1] === "md") {
							output.contentDocument.body.innerHTML = "";
							output.contentDocument.body.scrollTop = 0;
							output.contentDocument.body.innerHTML = marked(rawContent, markedOptions);
						} else {
							// TODO use data: url, I think
						}
						if (hash) {
							anchorElement = output.contentDocument.getElementById(hash.substring(1)); /* remove the leading '#' */
							if (anchorElement) {
								anchorElement.scrollIntoView(true);
							}
						}
						result.resolve();
					},
					result.reject
				);
			},
			result.reject
		);
		return result;
	}

	function setTOC(item) {
		function createTOCPage(children) {
			output.contentDocument.body.innerHTML = "";
			var h1 = output.contentDocument.createElement("h1");
			h1.textContent = (item.element.getAttribute("label") || "don't know!"); //$NON-NLS-1$ //$NON-NLS-0$ // TODO
			output.contentDocument.body.appendChild(h1);
			var h3 = output.contentDocument.createElement("h3");
			h3.textContent = /*messages[*/"Contents"/*]*/;
			output.contentDocument.body.appendChild(h3);
			var ul = output.contentDocument.createElement("ul");
			output.contentDocument.body.appendChild(ul);
			
			children.forEach(function(current) {
				var li = output.contentDocument.createElement("li");
				ul.appendChild(li);
				var link = createLink(current, current.id, output.contentDocument);
				li.appendChild(link);
				li.setAttribute("itemId", current.id);
				li.setAttribute("parentId", item.id);
			});
		}

		if (!item.children) {
			helpModel.getChildren(item, createTOCPage);
		} else {
			createTOCPage(item.children);
		}
	}

	mBootstrap.startup().then(function(core) {
		var serviceRegistry = core.serviceRegistry;
		fileClient = new mFileClient.FileClient(serviceRegistry);
		progress = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
		var commandRegistry = new mCommandRegistry.CommandRegistry({});
		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandRegistry, fileService: fileClient});
//		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
//		new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//		new mProgress.ProgressService(serviceRegistry, operationsClient, commandRegistry);
		mGlobalCommands.generateBanner("orion-helpPage", serviceRegistry, commandRegistry, core.preferences, searcher); //$NON-NLS-0$
		mGlobalCommands.setPageTarget({task: "Help", /*messages.Shell,*/ serviceRegistry: serviceRegistry, commandService: commandRegistry}); // TODO

//		var parent = document.getElementById("mainNode");
//		var rootDiv = document.createElement("div"); //$NON-NLS-0$
var rootDiv = document.getElementById("rootDiv");
//		rootDiv.style.position = "absolute"; //$NON-NLS-0$
		rootDiv.style.width = "100%"; //$NON-NLS-0$
		rootDiv.style.height = "100%"; //$NON-NLS-0$
		rootDiv.style.overflow = "hidden";
//		parent.appendChild(rootDiv);

		var treeDiv = document.createElement("div"); //$NON-NLS-0$
		treeDiv.style.overflow = "auto";
		rootDiv.appendChild(treeDiv);

		var splitterDiv = document.createElement("div"); //$NON-NLS-0$
		splitterDiv.id = "orion.help.splitter";
		rootDiv.appendChild(splitterDiv);			

//		var outputWrapperDiv = document.createElement("div"); //$NON-NLS-0$
//		outputWrapperDiv.style.overflowX = "hidden"; //$NON-NLS-0$
//		outputWrapperDiv.style.overflowY = "hidden"; //$NON-NLS-0$
//		rootDiv.appendChild(outputWrapperDiv);

		output = document.createElement("iframe"); //$NON-NLS-0$
		output.classList.add("orionMarkdown"); //$NON-NLS-0$
		output.style.width = "100%"; //$NON-NLS-0$
		output.style.height = "100%"; //$NON-NLS-0$
//		output.style.overflow = "auto";
		/*outputWrapperDiv*/rootDiv.appendChild(output);

		new mSplitter.Splitter({
			node: splitterDiv,
			sidePanel: treeDiv,
			mainPanel: /*outputWrapperDiv*/output,
			toggle: true
		});

		helpModel = new HelpModel(fileClient, serviceRegistry);
		var helpRenderer = new HelpRenderer();
		tableTree = new mTreeTable.TableTree({
			model: helpModel,
			showRoot: true,
			parent: treeDiv,
			renderer: helpRenderer
		});
		helpRenderer.tableTree = tableTree;

		window.addEventListener("hashchange", function(event) { //$NON-NLS-0$
			var hash = event.newURL;
			hashChanged(hash);
		});

		var hash = PageUtil.hash();
		if (hash) {
			hashChanged(hash);
		}
	});
});
