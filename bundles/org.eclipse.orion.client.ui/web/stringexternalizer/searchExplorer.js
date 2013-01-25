/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define console window*/
/*jslint regexp:false browser:true forin:true*/

define(['i18n!orion/stringexternalizer/nls/messages', 'require', 'orion/webui/littlelib', 'dojo', 'dijit', 'orion/explorers/explorer', 'orion/explorers/explorerNavHandler', 'orion/fileClient', 'orion/commands', 'orion/searchUtils', 'orion/globalSearch/search-features', 'orion/compare/compare-features', 'orion/compare/compare-container', 'stringexternalizer/nonnlsSearchUtil', 'dijit/TooltipDialog'],

function(messages, require, lib, dojo, dijit, mExplorer, mNavHandler, mFileClient, mCommands, mSearchUtils, mSearchFeatures, mCompareFeatures, mCompareContainer, mNonnlsSearchUtil) {

	/* Internal wrapper functions*/
	function _empty(nodeToEmpty){
		var node = lib.node(nodeToEmpty);
		if(node){
			lib.empty(node);
		}
	}
	
	function _connect(nodeOrId, event, eventHandler){
		var node = lib.node(nodeOrId);
		if(node){
			node.addEventListener(event, eventHandler, false); 
		}
	}
	
	function _place(ndoeToPlace, parent, position){
		var parentNode = lib.node(parent);
		if(parentNode){
			if(position === "only"){
				lib.empty(parentNode);
			}
			parentNode.appendChild(ndoeToPlace);
		}
	}
	
	function _createElement(elementTag, classNames, id, parent){
		var element = document.createElement(elementTag);
		if(classNames){
			if(Array.isArray(classNames)){
				for(var i = 0; i < classNames.length; i++){
					element.classList.add(classNames[i]);
				}
			} else if(typeof classNames === "string"){
				element.className = classNames;
			}
		}
		if(id){
			element.id = id;
		}
		var parentNode = lib.node(parent);
		if(parentNode){
			parentNode.appendChild(element);
		}
		return element;
	}
	
	function _createLink(classNames, id, href, parent, renderName){
		var link = _createElement('a', classNames, id, parent); //$NON-NLS-2$
		link.href = href;
		if(renderName){
			link.appendChild(document.createTextNode(renderName));
		}
		return link;
	}
	
	function _createSpan(classNames, id, parent, spanName){
		var span = _createElement('span', classNames, id, parent); //$NON-NLS-2$
		if(spanName){
			span.appendChild(document.createTextNode(spanName));
		}
		return span;
	}
	
	function SearchResultModel(serviceRegistry, fileClient, root, options) {
		this.registry = serviceRegistry;
		this.fileClient = fileClient;
		this._listRoot = {
			isRoot: true,
			children: root.Children
		};
		this.location2ModelMap = [];
		this._lineDelimiter = "\n"; //$NON-NLS-0$
		this.messageService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
		this.onMatchNumberChanged = options.onMatchNumberChanged;
	}
	SearchResultModel.prototype = new mExplorer.ExplorerModel();

	SearchResultModel.prototype.replaceMode = function() {
		return true;
	};

	SearchResultModel.prototype.sameFile = function(prevSelection, curSelection) {
		if (!prevSelection) {
			return false;
		}
		return (prevSelection.Location || prevSelection.parent.Location) === (curSelection.Location || curSelection.parent.Location);
	};

	SearchResultModel.prototype.fileModel = function(model) {
		if (!model) {
			return null;
		}
		if (model.type === "file") { //$NON-NLS-0$
			return model;
		}
		return this._listRoot.children[model.parentNum];
	};

	SearchResultModel.prototype.getRoot = function(onItem) {
		onItem(this._listRoot);
	};

	SearchResultModel.prototype.getTopIterationNodes = function() {
		return this._listRoot.children;
	};

	SearchResultModel.prototype.buildResultModel = function() {
		for (var i = 0; i < this._listRoot.children.length; i++) {
			this._listRoot.children[i].type = "file"; //$NON-NLS-0$
			this._listRoot.children[i].linkLocation = require.toUrl("edit/edit.html") + "#" + this._listRoot.children[i].Location; //$NON-NLS-1$ //$NON-NLS-0$
			this._listRoot.children[i].fullPathName = mSearchUtils.fullPathNameByMeta(this._listRoot.children[i].Parents);
			this._listRoot.children[i].parentLocation = mSearchUtils.path2FolderName(this._listRoot.children[i].Location, this._listRoot.children[i].Name, true);
			for (var j = 0; j < this._listRoot.children[i].nonnls.length; j++) {
				this._listRoot.children[i].nonnls[j].type = "detail"; //$NON-NLS-0$
				this._listRoot.children[i].nonnls[j].parent = this._listRoot.children[i]; //.parent is reserved for tree visitor
				this._listRoot.children[i].nonnls[j].parentNum = i;
				this._listRoot.children[i].nonnls[j].checked = true;
			}
		}
	};

	SearchResultModel.prototype.matchesReplaced = function(model) {
		var matchesReplaced = 0;
		if (!model.children) {
			return model.checked === false ? 0 : 1;
		}
		if (model.children) {
			for (var j = 0; j < model.children.length; j++) {
				if (model.children[j].checked !== false) {
					matchesReplaced += 1;
				}
			}
		}
		return matchesReplaced;
	};

	SearchResultModel.prototype.getId = function(item) {
		var result;
		if (item === this._listRoot) {
			result = this.rootId;
		} else {
			if (item.Location) {
				result = item.Location;
				// remove all non valid chars to make a dom id. 
				result = result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
			} else {
				result = this.getId(item.parent);
				result += item.lineNum;
				result += item.character;
			}
		}
		return result;
	};

	SearchResultModel.prototype.getFileContent = function(fileItem, onComplete, writing) {
		if (fileItem.contents) {
			onComplete(fileItem);
		} else {
			this.registry.getService("orion.page.progress").progress(this.fileClient.read(fileItem.Location), "Reading file " + fileItem.Location).then(
			function(contents) {
				fileItem.contents = contents;
				onComplete(fileItem);
			}.bind(this),
			function(error) {
				console.error("Error loading file content: " + error.message); //$NON-NLS-0$
				onComplete(null);
			}.bind(this));
		}
	};

	SearchResultModel.prototype.getChildren = function(parentItem, onComplete) {
		if (!parentItem) {
			return;
		}
		if (parentItem.children) {
			onComplete(parentItem.children);
		} else if (parentItem.type === "detail") { //$NON-NLS-0$
			onComplete([]);
		} else if (parentItem.type === "file") { //$NON-NLS-0$
			parentItem.children = parentItem.nonnls; //Tree iterator (visitor) requires .children property. But this will be improved in the future without requiring this property.
			//Addressed in https://bugs.eclipse.org/bugs/show_bug.cgi?id=380687#c2.
			onComplete(parentItem.nonnls);
		} else {
			onComplete([]);
		}
	};

	SearchResultModel.prototype.writeIncrementalNewContent = function(config, i, onFinish) {
		if (!i) { i = 0;}
		if (i >= this._listRoot.children.length) {
			this.messageService.setProgressMessage("");
			if (onFinish) {
				onFinish();
			}
			return;
		}
		var fileItem = this._listRoot.children[i];
		var that = this;
		this.messageService.setProgressMessage(dojo.string.substitute(messages["Writing files ${0} of ${1}"], [i + 1, this._listRoot.children.length]));
		if (fileItem.checked) {
			this.registry.getService("orion.page.progress").progress(this.fileClient.read(fileItem.Location, true), "Reading file metadata " + fileItem.Location).then(function(metadata) {
				if (fileItem.LocalTimeStamp !== metadata.LocalTimeStamp) {
					console.error("File " + metadata.Name + " has been modified."); //$NON-NLS-1$ //$NON-NLS-0$
					dojo.hitch(that, that.writeIncrementalNewContent(config, i + 1), onFinish);
					return;
				}

				function writeNonnls(fileItem) {
					var newContents = mNonnlsSearchUtil.replaceNls(fileItem.contents, fileItem.nonnls, config, true);
					if (config.messages && config.messages !== {}) {
						mNonnlsSearchUtil.writeMessagesFile(that.fileClient, config, config.messages, that.registry.getService("orion.page.progress")).then(function() {
							that.registry.getService("orion.page.progress").progress(that.fileClient.write(fileItem.Location, newContents), "Writing changes to " + fileItem.Location).then(function() {
								dojo.hitch(that, that.writeIncrementalNewContent(config, i + 1), onFinish);
							},

							function(error) {
								console.error(error);
								dojo.hitch(that, that.writeIncrementalNewContent(config, i + 1), onFinish);
							});
						}, function(error) {
							console.error(error);
							dojo.hitch(that, that.writeIncrementalNewContent(config, i + 1), onFinish);
						});
					} else {
						that.registry.getService("orion.page.progress").progress(that.fileClient.write(fileItem.Location, newContents), "Writing changes to " + fileItem.Location).then(function() {
							dojo.hitch(that, that.writeIncrementalNewContent(config, i + 1), onFinish);
						},

						function(error) {
							console.error(error);
							dojo.hitch(that, that.writeIncrementalNewContent(config, i + 1), onFinish);
						});
					}
				}

				if (!fileItem.contents) {
					that.registry.getService("orion.page.progress").progress(that.fileClient.read(fileItem.Location), "Reading file " + fileItem.Location).then(function(contents) {
						fileItem.contents = contents;
						dojo.hitch(that, writeNonnls)(fileItem, config);
					},

					function(error) {
						console.error(error);
						dojo.hitch(that, that.writeIncrementalNewContent(config, i + 1), onFinish);
					});
				} else {
					writeNonnls(fileItem, config);
				}


			}, function(error) {
				console.error(error);
				dojo.hitch(that, that.writeIncrementalNewContent(config, i + 1), onFinish);
			});
		} else {
			dojo.hitch(that, that.writeIncrementalNewContent(config, i + 1), onFinish);
		}
	};

	SearchResultModel.prototype.constructor = SearchResultModel;

	function SearchResultRenderer(options, explorer) {
		this._init(options);
		this.explorer = explorer;
	}
	SearchResultRenderer.prototype = new mExplorer.SelectionRenderer();

	// TODO:  this should be handled outside of here in a common select all command
	// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=339500
	SearchResultRenderer.prototype.initCheckboxColumn = function(tableNode) {
		if (this._useCheckboxSelection) {
			var th = document.createElement('th'); //$NON-NLS-0$
			var check = document.createElement("span", ["selectionCheckmarkSprite", "core-sprite-check"]); //$NON-NLS-0$
			//check.classList.add("selectionCheckmarkSprite core-sprite-check"); //$NON-NLS-0$
			if (this.getCheckedFunc) {
				check.checked = this.getCheckedFunc(this.explorer.model._listRoot);
				dojo.toggleClass(check, "core-sprite-check_on", check.checked); //$NON-NLS-0$
			}
			th.appendChild(check);
			_connect(check, "click",function(evt) { //$NON-NLS-0$
				var newValue = evt.target.checked ? false : true;
				this.onCheck(null, evt.target, newValue);
			}.bind(this));
			return th;
		}
	};

	SearchResultRenderer.prototype.getCellHeaderElement = function(col_no) {
		var col = _createElement("th"); //$NON-NLS-0$
		var h2;
		if (col_no === 1) {
			h2 = _createElement("h2", null, null, col); //$NON-NLS-0$
			h2.textContent = messages["Files to externalize"];
			return col;
		} else if (col_no === 2) {
			h2 = _createElement("h2", null, null, col); //$NON-NLS-0$
			h2.textContent = messages["Location"];
			return col;
		} else if (col_no === 0) {
			return col;
		}
	};


	SearchResultRenderer.prototype.focus = function() {
		var resultParentDiv = document.getElementById(this.explorer.getParentDivId());
		window.setTimeout(function() {
			resultParentDiv.focus();
		}, 10);
	};

	SearchResultRenderer.prototype.renderFileElement = function(item, spanHolder, renderName) {
		var nameSpan = _createLink(
			"primaryColumn", //$NON-NLS-2$
			this.getItemLinkId(item),
			item.linkLocation,
			spanHolder, renderName);
		nameSpan.title = messages["Click to compare"];
	};

	SearchResultRenderer.prototype.generateDetailHighlight = function(nonnls, parentSpan) {
		_place(document.createTextNode(nonnls.line.substring(0, nonnls.character - 1)), parentSpan, "last"); //$NON-NLS-0$
		var matchSegBold = _createElement("b", null, null, parentSpan); //$NON-NLS-1$ //$NON-NLS-0$
		_place(document.createTextNode(nonnls.string), matchSegBold, "only"); //$NON-NLS-0$
		_place(document.createTextNode(nonnls.line.substring(nonnls.end)), parentSpan, "last"); //$NON-NLS-0$
	};

	SearchResultRenderer.prototype.renderDetailElement = function(item, tableRow, spanHolder, renderNumber) {
		var nameSpan = _createElement("span",
			"primaryColumn",
			this.getItemLinkId(item),
		spanHolder); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.generateDetailHighlight(item, nameSpan);
		nameSpan.title = messages["Click to find"];
		var that = this;

		var link = _createElement("span", 
			"navlink",
			this.getItemLinkId(item),
		spanHolder);
		_connect(link, "click", function() { //$NON-NLS-0$
			that.explorer.getNavHandler().cursorOn(item);
		});
		return _createElement("span", null, null, link); //$NON-NLS-1$ //$NON-NLS-0$
	};

	SearchResultRenderer.prototype.renderDetailLineNumber = function(item, spanHolder) {
		_place(document.createTextNode((item.lineNum + 1) + ":"), spanHolder, "last"); //$NON-NLS-1$ //$NON-NLS-0$
	};

	//This is an optional function for explorerNavHandler. It provides the div with the "href" attribute.
	//The explorerNavHandler hooked up by the explorer will check if the href exist as the attribute and react on enter key press.
	SearchResultRenderer.prototype.getRowActionElement = function(tableRowId) {
		return dojo.byId(this.getItemLinkId(tableRowId));
	};

	SearchResultRenderer.prototype.getLocationSpanId = function(item) {
		return this.explorer.model.getId(item) + "_locationSpan"; //$NON-NLS-0$
	};

	SearchResultRenderer.prototype.getFileSpanId = function(item) {
		return this.explorer.model.getId(item) + "_fileSpan"; //$NON-NLS-0$
	};

	SearchResultRenderer.prototype.getFileIconId = function(item) {
		return this.explorer.model.getId(item) + "_fileIcon"; //$NON-NLS-0$
	};

	SearchResultRenderer.prototype.getItemLinkId = function(itemOrId) {
		if (typeof itemOrId === "string") { //$NON-NLS-0$
			return itemOrId + "_itemLink"; //$NON-NLS-0$
		}
		return this.explorer.model.getId(itemOrId) + "_itemLink"; //$NON-NLS-0$
	};

	SearchResultRenderer.prototype.getDetailIconId = function(item) {
		return this.explorer.model.getId(item) + "_detailIcon"; //$NON-NLS-0$
	};

	SearchResultRenderer.prototype.renderLocationElement = function(item, onSpan) {
		var spanHolder = onSpan ? onSpan : dojo.byId(this.getLocationSpanId(item));
		var href = require.toUrl("stringexternalizer/search.html") + "#" + item.parentLocation; //$NON-NLS-1$ //$NON-NLS-0$
		var link = _createLink(
			"navlink", //$NON-NLS-2$
			null,
			href,
			spanHolder, item.fullPathName);
		link.title = dojo.string.substitute(messages["Externalize string from ${0} only"], [item.fullPathName]);
	};

	SearchResultRenderer.prototype.getCellElement = function(col_no, item, tableRow) {
				var col, span;
		switch (col_no) {
			case 0:
				col = document.createElement('td'); //$NON-NLS-0$
				if (item.type === "file") { //$NON-NLS-0$
					col.noWrap = true;
					span = _createElement("span", null,
						this.getFileIconId(item),
					col); //$NON-NLS-1$ //$NON-NLS-0$
					this.getExpandImage(tableRow, span, "core-sprite-file"); //$NON-NLS-0$
				} else {
					span = _createElement("span", null, null, col); //$NON-NLS-1$ //$NON-NLS-0$
					col.noWrap = true;
					col.align = "right"; //$NON-NLS-0$
					this.renderDetailLineNumber(item, span);
				}
				return col;
			case 1:
				col = document.createElement('td'); //$NON-NLS-0$
				span = _createElement("span", null,
					this.getFileSpanId(item),
				col); //$NON-NLS-1$ //$NON-NLS-0$
				if (item.type === "file") { //$NON-NLS-0$
					var renderName = item.nonnls ? dojo.string.substitute(messages["${0} (${1} matches)"], [item.Name, item.nonnls.length]) : item.Name;
					this.renderFileElement(item, span, renderName);
				} else {
					this.renderDetailElement(item, tableRow, span);
					var iconSpan = _createElement("span", null,
						this.getDetailIconId(item),
					span); //$NON-NLS-1$ //$NON-NLS-0$
					var icon = _createElement("span", null, null, iconSpan); //$NON-NLS-1$ //$NON-NLS-0$
					icon.classList.add("imageSprite"); //$NON-NLS-0$
					icon.classList.add("core-sprite-none"); //$NON-NLS-0$
				}
				return col;

			case 2:
				col = document.createElement('td'); //$NON-NLS-0$
				if (item.type === "file") { //$NON-NLS-0$
					span = _createElement("span", {
						id: this.getLocationSpanId(item)
					}, col, "only"); //$NON-NLS-1$ //$NON-NLS-0$
					if (item.fullPathName) {
						this.renderLocationElement(item, span);
					}
				}
				return col;
		}
	};


	/**
	 * Creates a new search result explorer.
	 * @name orion.SearchResultExplorer
	 */
	function SearchResultExplorer(registry, commandService, searchResults) {
		this.registry = registry;
		this._commandService = commandService;
		this._searchResults = searchResults;
		this.fileClient = new mFileClient.FileClient(this.registry);
		this.defaulRows = 40;
		this.declareCommands();
	}

	SearchResultExplorer.prototype = new mExplorer.Explorer();

	/**
	 * Clients can connect to this function to receive notification when the root item changes.
	 * @param {Object} item
	 */
	SearchResultExplorer.prototype.onchange = function(item) {};

	SearchResultExplorer.prototype.setResult = function(parentNode, result) {
		var that = this;
		this.parentNode = parentNode;
		this.totalNumber = result.Children.length;
		this.numberOnPage = result.Children.length;
		this.model = new SearchResultModel(this.registry, this.fileClient, result, {
			onMatchNumberChanged: function(fileItem) {
				that.renderer.replaceFileElement(fileItem);
			}
		});
		this.checkbox = true;
		this.renderer = new SearchResultRenderer({
			checkbox: true,
			highlightSelection: false,
			getCheckedFunc: function(item) {
				return that.getItemChecked(item);
			},
			onCheckedFunc: function(rowId, checked, manually) {
				that.onRowChecked(rowId, checked, manually);
			}
		}, that);

		this._reporting = false;
		this._uiFactory = null;
		this._currentPreviewModel = null;
		this._currentReplacedContents = null;
		this._popUpContext = false;
		this.timerRunning -= false;
		this._timer = null;
		this.twoWayCompareContainer = null;
	};

	/* one-time setup of commands */
	SearchResultExplorer.prototype.declareCommands = function() {
		var that = this;
		// page actions for search


		var replaceAllCommand = new mCommands.Command({
			name: messages["Apply Changes"],
			tooltip: messages["Replace all selected matches"],
			id: "orion.globalSearch.replaceAll", //$NON-NLS-0$
			callback: function(data) {
				that.replaceAll();
			},
			visibleWhen: function(item) {
				return true;
			}
		});

		var hideCompareCommand = new mCommands.Command({
			name: messages["Hide Compare"],
			tooltip: messages["Hide compare view of changes"],
			id: "orion.globalSearch.hideCompare", //$NON-NLS-0$
			callback: function(data) {
				that.toggleCompare(false);
			},
			visibleWhen: function(item) {
				return that._uiFactory;
			}
		});

		var showCompareCommand = new mCommands.Command({
			name: messages["Show Compare"],
			tooltip: messages["Show compare view of changes"],
			id: "orion.globalSearch.showCompare", //$NON-NLS-0$
			callback: function(data) {
				that.toggleCompare(true);
			},
			visibleWhen: function(item) {
				return !that._uiFactory;
			}
		});

		var searchAgainCommand = new mCommands.Command({
			name: messages["Search Again"],
			tooltip: messages["Search again"],
			id: "orion.globalSearch.searchAgain", //$NON-NLS-0$
			callback: function() {
				return that._searchResults.loadResults(that._searchResults.root);
			},
			visibleWhen: function(item) {
				return true;
			}
		});

		this._commandService.addCommand(searchAgainCommand);
		this._commandService.addCommand(hideCompareCommand);
		this._commandService.addCommand(showCompareCommand);
		this._commandService.addCommand(replaceAllCommand);
		this._commandService.addCommandGroup("pageActions", "orion.searchActions.unlabeled", 200); //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageActions", "orion.globalSearch.searchAgain", 3, "orion.searchActions.unlabeled"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageActions", "orion.globalSearch.hideCompare", 4, "orion.searchActions.unlabeled"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageActions", "orion.globalSearch.showCompare", 5, "orion.searchActions.unlabeled"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageActions", "orion.globalSearch.replaceAll", 6, "orion.searchActions.unlabeled"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	};

	SearchResultExplorer.prototype.replaceAll = function() {
		this._reporting = true;
		this.initCommands();
		this.reportStatus(messages["Writing files..."]);
		var that = this;
		this.model.writeIncrementalNewContent(this.config, 0, function() {
			that._searchResults.loadResults(that._searchResults.root);
		});
	};

	SearchResultExplorer.prototype.toggleCompare = function(show) {
		this.replacePreview(false, show);
	};

	SearchResultExplorer.prototype.initCommands = function() {
		var that = this;
		this._commandService.destroy("pageActions"); //$NON-NLS-0$
		this._commandService.renderCommands("pageActions", "pageActions", that, that, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		this._commandService.destroy("pageNavigationActions"); //$NON-NLS-0$
		this._commandService.renderCommands("pageNavigationActions", "pageNavigationActions", that, that, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	};

	SearchResultExplorer.prototype.replacePreview = function(init, comparing) {

		_empty(this.getParentDivId());
		if (comparing) {
			this._uiFactory = new mSearchFeatures.SearchUIFactory({
				parentDivID: this.getParentDivId()
			});
			this._uiFactory.buildUI();
			this.twoWayCompareContainer = null;
			this._currentPreviewModel = null;
		} else {
			if (this._uiFactory) {
				this._uiFactory.destroy();
			}
			this._uiFactory = null;
			this.twoWayCompareContainer = null;
			this._currentPreviewModel = null;
		}
		this.initCommands();
		if (init) {
			this.reportStatus("Preparing preview..."); //$NON-NLS-0$
		}
		var that = this;
		this.createTree(this._uiFactory ? this._uiFactory.getMatchDivID() : this.getParentDivId(), this.model, {
			selectionPolicy: "cursorOnly",
			indent: 20,
			onCollapse: function(model) {
				that.onCollapse(model);
			}
		}); //$NON-NLS-0$

		if (init) {
			this.hookUpNavHandler();
			this.selectFirstFile();
			this.reportStatus("");
		} else {
			this.hookUpNavHandler();
			this.selectFirstFile();
		}
	};

	SearchResultExplorer.prototype.getItemChecked = function(item) {
		if (item.checked === undefined) {
			item.checked = true;
		}
		return item.checked;
	};

	SearchResultExplorer.prototype.onRowChecked = function(rowId, checked, manually) {
		if (!rowId) {
			this.onItemChecked(this.model._listRoot, checked, manually);
			return;
		}
		var row = dojo.byId(rowId);
		if (row && row._item) {
			this.onItemChecked(row._item, checked, manually);
		}
	};

	SearchResultExplorer.prototype.onNewContentChanged = function(fileItem) {
		if (fileItem.Location === this.model.fileModel(this.getNavHandler().currentModel()).Location) {
			this.buildPreview(true);
		}
	};

	SearchResultExplorer.prototype.onItemChecked = function(item, checked, manually) {
	var checkBox;
		item.checked = checked;
		if ((item.type === "file" && manually) || item.isRoot) { //$NON-NLS-0$
			var children = [];
			if (item.children) {
				children = item.children;
			}
			if (item.nonnls) {
				children = item.nonnls;
			}

			for (var i = 0; i < children.length; i++) {
				checkBox = dojo.byId(this.renderer.getCheckBoxId(this.model.getId(children[i])));
				if (checkBox) {
					if (item.isRoot) {
						this.renderer.onCheck(this.getRow(children[i]), checkBox, checked, true);
					} else {
						this.renderer.onCheck(null, checkBox, checked, false);
					}
				} else {
					children[i].checked = checked;
				}
			}
			if (item.type === "file") { //$NON-NLS-0$
				this.onNewContentChanged(item);
			}
		} else if (manually) {
			if (checked) {
				checkBox = dojo.byId(this.renderer.getCheckBoxId(this.model.getId(item.parent)));
				if (checkBox) {
					this.renderer.onCheck(null, checkBox, checked, false);
				}
			}
			this.onNewContentChanged(item.parent);
			this.onReplaceCursorChanged(item.parent, item);
		}
	};

	SearchResultExplorer.prototype._getContentType = function(fileItem) {
		return this.registry.getService("orion.core.contenttypes").getFilenameContentType(fileItem.Name); //$NON-NLS-0$
	};

	SearchResultExplorer.prototype.buildPreview = function(updating) {
		if (!this._uiFactory) {
			return;
		}
		if (this.model.getTopIterationNodes().length === 0) {
			return;
		}
		var uiFactory = this._uiFactory;
		var fileItem = this.model.fileModel(this.getNavHandler().currentModel());
		this._currentPreviewModel = fileItem;
		if (!updating || !this._currentReplacedContents) {
			this._currentReplacedContents = [];
		}
		var that = this;
		this.model.getFileContent(fileItem, function(fileItem) {
			// Diff operations
			var fType = that._getContentType(fileItem);
			dojo.when(fType, function(fType) {
				var options = {
					readonly: true,
					hasConflicts: false,
					newFile: {
						Name: fileItem.Location,
						Type: fType,
						Content: fileItem.contents
					},
					baseFile: {
						Name: fileItem.Location,
						Type: fType,
						Content: fileItem.checked ? mNonnlsSearchUtil.replaceNls(fileItem.contents, fileItem.nonnls, that.config) : fileItem.contents
					}
				};

				if (!that.twoWayCompareContainer) {
					that.uiFactoryCompare = new mCompareFeatures.TwoWayCompareUIFactory({
						parentDivID: uiFactory.getCompareDivID(),
						showTitle: true,
						rightTitle: dojo.string.substitute(messages["Replaced File (${0})"], [fileItem.Name]),
						leftTitle: dojo.string.substitute(messages["Original File (${0})"], [fileItem.Name]),
						showLineStatus: false
					});
					that.uiFactoryCompare.buildUI();
					that.twoWayCompareContainer = new mCompareContainer.TwoWayCompareContainer(that.registry, uiFactory.getCompareDivID(), that.uiFactoryCompare, options);
					that.twoWayCompareContainer.startup();
				} else {
					_empty(that.uiFactoryCompare.getTitleDiv());
					_place(document.createTextNode(dojo.string.substitute(messages['Replaced File (${0})'], [fileItem.Name])), that.uiFactoryCompare.getTitleDiv(), "only"); //$NON-NLS-1$
					_empty(that.uiFactoryCompare.getTitleDiv(true));
					_place(document.createTextNode(dojo.string.substitute(messages['Original File (${0})'], [fileItem.Name])), that.uiFactoryCompare.getTitleDiv(true), "only"); //$NON-NLS-1$
					that.twoWayCompareContainer.setOptions(options);
					that.twoWayCompareContainer.setEditor();
				}
				window.setTimeout(function() {
					that.renderer.focus();
				}, 100);
			});
		});
	};

	SearchResultExplorer.prototype.caculateNextPage = function(currentStart, pageSize, totalNumber) {
		if ((currentStart + pageSize) >= totalNumber) {
			return {
				start: currentStart
			};
		}
		return {
			start: currentStart + pageSize
		};
	};

	SearchResultExplorer.prototype.caculatePrevPage = function(currentStart, pageSize, totalNumber) {
		var start = currentStart - pageSize;
		if (start < 0) {
			start = 0;
		}
		return {
			start: start
		};
	};

	SearchResultExplorer.prototype.reportStatus = function(message) {
		this.registry.getService("orion.page.message").setProgressMessage(message); //$NON-NLS-0$
	};

	SearchResultExplorer.prototype.isExpanded = function(model) {
		return this.myTree.isExpanded(this.model.getId(model));
	};

	SearchResultExplorer.prototype.onCollapse = function(model) {
		var curModel = this.getNavHandler().currentModel();
		if (!curModel) {
			return;
		}
		if (curModel.type === "detail") { //$NON-NLS-0$
			var curFileModel = this.model.fileModel(model);
			if (curFileModel === model) {
				this.getNavHandler().cursorOn(model);
			}
		}
	};

	//Provide the key listening div.If not provided this._myTree._parent will be used.
	SearchResultExplorer.prototype.keyEventListeningDiv = function() {
		return dojo.byId(this.getParentDivId());

	};

	SearchResultExplorer.prototype.onFocus = function(focus) {
		//do nothing on focus
	};

	SearchResultExplorer.prototype.preventDefaultFunc = function(e, model) {
		if (!model) {
			return true;
		}
		if (!this.model.replaceMode() && !e.ctrlKey && model.type === "detail") { //$NON-NLS-0$
			if (e.keyCode === dojo.keys.LEFT_ARROW && this._popUpContext) {
				this.closeContextTip();
				e.preventDefault();
				return true;
			}
			if (e.keyCode === dojo.keys.RIGHT_ARROW && !this._popUpContext) {
				this._popUpContext = true;
				this.popupContext(model);
				e.preventDefault();
				return true;
			}
		}
		return false;
	};

	SearchResultExplorer.prototype.onReplaceCursorChanged = function(prevModel, currentModel) {
		var that = this;
		if (!this.model.sameFile(this._currentPreviewModel, currentModel)) {
			this.buildPreview();
		}
		if (currentModel.type === "detail") { //$NON-NLS-0$
			if (!currentModel.line) {
				that.renderer.focus();
				return;
			}
			this.twoWayCompareContainer.gotoMatch(currentModel.lineNum, {
				startIndex: currentModel.character,
				length: currentModel.string.length
			}, {
				startIndex: currentModel.newcharacter ? currentModel.newcharacter : currentModel.character,
				length: currentModel.replace ? currentModel.replace.length : currentModel.string.length
			}, currentModel.string.length,

			function() {
				window.setTimeout(function() {
					that.renderer.focus();
				}, 200);
			});
			window.setTimeout(function() {
				that.renderer.focus();
			}, 0);
		}
	};

	SearchResultExplorer.prototype.onCursorChanged = function(prevModel, currentModel) {
		var that = this;
		if (this.model.replaceMode()) {
			if (!this._uiFactory) {
				return;
			}
			if (!this._timer) {
				this._timer = window.setTimeout(function() {
					that.onReplaceCursorChanged(prevModel, currentModel);
					that.timerRunning = false;
					that._timer = null;
				}, 500);
			} else if (this.timerRunning) {
				window.clearTimeOut(this._timer);
				this._timer = window.setTimeout(function() {
					that.onReplaceCursorChanged(prevModel, currentModel);
					that.timerRunning = false;
					that._timer = null;
				}, 500);
			}
		} else if (currentModel.type === "detail") { //$NON-NLS-0$
			if (this._popUpContext) {
				this.popupContext(currentModel);
			}
		} else {
			if (this._popUpContext) {
				this.closeContextTip(true);
			}
		}
	};

	SearchResultExplorer.prototype.hookUpNavHandler = function() {
		if (!this.getNavHandler()) {
			var options = {
				preventDefaultFunc: function(event, model) {
					return this.preventDefaultFunc(event, model);
				}.bind(this),
				onCursorChanged: function(prevModel, currentModel) {
					this.onCursorChanged(prevModel, currentModel);
				}.bind(this)
			};
			var selModel = this.getSelectionModel();
			selModel.navHandler = new mNavHandler.ExplorerNavHandler(this, this.selectionModel.navDict, options);
		} else {
			this.getNavHandler().focus();
		}
		this.getNavHandler().refreshModel(this.getNavDict(), this.model, this.model._listRoot);
	};

	SearchResultExplorer.prototype.startUp = function() {
		//TODO setup title
		//var pageTitle = dojo.byId("pageTitle"); //$NON-NLS-0$
		this.model.buildResultModel();
		this.replacePreview(true, true);
	};

	SearchResultExplorer.prototype.setConfig = function(config) {
		this.config = config;
		this.buildPreview(true);
	};

	SearchResultExplorer.prototype.getParentDivId = function(secondLevel) {
		if (!this.model.replaceMode() || !secondLevel) {
			return this.parentNode.id;
		} else {
			return this._uiFactory ? this._uiFactory.getMatchDivID() : this.parentNode.id;
		}
	};

	SearchResultExplorer.prototype.selectFirstFile = function() {
		if (this.model.getTopIterationNodes().length > 0) {
			this.getNavHandler().cursorOn(this.model.getTopIterationNodes()[0], true);
		}
	};

	SearchResultExplorer.prototype.constructor = SearchResultExplorer;

	//return module exports
	return {
		SearchResultExplorer: SearchResultExplorer
	};
});