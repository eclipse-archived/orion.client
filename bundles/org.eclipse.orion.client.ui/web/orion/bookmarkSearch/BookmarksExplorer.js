/*******************************************************************************
 * @license Copyright (c) 2016 IBM Corporation and others. All rights
 *          reserved. This program and the accompanying materials are made
 *          available under the terms of the Eclipse Public License v1.0
 *          (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse
 *          Distribution License v1.0
 *          (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
/*global URL*/
define([
	'i18n!orion/problems/nls/messages',
	'i18n!orion/search/nls/messages',
	'orion/Deferred',
	'orion/explorers/explorer',
	'orion/webui/littlelib',
	'orion/crawler/searchCrawler',
	'orion/extensionCommands',
	'orion/commands',
	'orion/explorers/navigatorRenderer',
	'orion/objects',
	'orion/syntaxchecker',
	'orion/editor/textModel',
	'orion/explorers/fileDetailRenderer',
	'orion/uiUtils',
	'orion/i18nUtil',
	'orion/URL-shim'
], function(messages, sharedMessages, Deferred, mExplorer, lib, mSearchCrawler, extensionCommands, mCommands, navigatorRenderer, objects, mSyntaxchecker, 
			mTextModel, mFileDetailRenderer, mUiUtils, i18nUtil) {
    
    /**
     * @description Adds the given node to the parent at the given position
     * @private
     * @param {Element} nodeToPlace The node to add to the given parent
     * @param {Element} nodeParent The parent to add to
     * @param {String} position If the node should be placed as the only child
     */
    function _place(nodeToPlace, nodeParent, position) {
        var parentNode = lib.node(nodeParent);
        if (parentNode) {
            if (position === "only") {
                lib.empty(parentNode);
            }
            parentNode.appendChild(nodeToPlace);
        }
    }

	/**
	 * @description Create a new problem link 
	 * @param {BookmarksExplorer} explorer The backing explorer
	 * @param {Object} item The problem item
	 * @param {String} showName The name to display
	 * @returns {Object} The new link object
	 */
	function generateBookmarksLink(explorer, item, showName) {
		var params = {start: item.start, end: item.end};
		var desc = item.description;
		var fileLocation = item.fileLocation;
		var link = navigatorRenderer.createLink(null, 
			{Location: fileLocation, Name: showName ? desc : null}, 
			explorer.commandService, 
			explorer.contentTypeRegistry,
			explorer._openWithCommands, 
			{id:item.location + "_linkId"}, //$NON-NLS-1$
			params, 
			{});
		return link;
	}
	/**
	 * @description Set the file information on the Bookmarks in the bookmarksInFile array, and then add the problem to the problem collector, totalProblems
	 * @param {Object} fileItem The file metadata object
	 * @param {Array.<Object>} bookmarksInFile The array of bookmarks in a given file
	 * @param {Array.<Object>} totalBookmarks The collector for the bookmarks
	 */
	function processTotalBookmarks(fileItem, bookmarksInFile, totalBookmarks) {
		bookmarksInFile.forEach(function(child) {
			child.type = "problem"; //$NON-NLS-1$
			child.fileName = fileItem.name;
			child.filePath = fileItem.path;
			child.fileLocation = fileItem.location;
			child.location = fileItem.location + child.description + child.start + child.end;
			totalBookmarks.push(child);
		});
	}
	/**
	 * @description Separate the errors fro the warnings
	 * @param {Array.<Object>} totalBookmarks The complete raw list of bookmarks
	 * @returns {Array.<Array>} The array of problem arrays. Index 0 contains the errors array and index 1 contains the warnings array
	 */
	function processBookmarksByName(totalBookmarks) {
		var errorsParent = {children: [], type: "category", location: "category_errors_id", name: messages["Errors"]},  //$NON-NLS-1$ //$NON-NLS-2$
		warningsParent = {children: [], type: "category", location: "category_warnings_id", name: messages["Warnings"]}; //$NON-NLS-1$ //$NON-NLS-2$
		totalBookmarks.forEach(function(child) {
			if(child.severity === "warning") {
				child.parent = warningsParent;
				warningsParent.children.push(child);
			} else {
				child.parent = errorsParent;
				errorsParent.children.push(child);
			}
		});
		return [errorsParent, warningsParent];
	}
	/**
	 * @description Set the file to problem relationships for the given bookmarks and files
	 * @param {Array.<Object>} totalFiles The list of file objects
	 * @param {Array.<Object>} totalBookmarks The complete list of problem objects
	 * @returns {Array.<Object>} The mapped bookmarkss, by file
	 */
	function processBookmarksByFiles(totalFiles, totalBookmarks) {
		var bookmarksByFile = [];
		totalFiles.forEach(function(file) {
			var newBookmarks = totalBookmarks.filter(function(problem){
				return problem.fileLocation === file.location;
			});
			if(newBookmarks && newBookmarks.length > 0) {
				bookmarksByFile.push(file);
				file.children = newBookmarks;
				newBookmarks.forEach(function(problem) {
					problem.parent = file;
				});
			}
		});
		return bookmarksByFile;
	}
	/**
	 * @description Fixes up the offsets for the given bookmarks
	 * @param {String} textContent The text to recalculate against
	 * @param {Array.<Object>} bookmarks The bookmarks to fix up
	 */
	function recalculateOffset(textContent, bookmarks) {
		var textModel = null;
		bookmarks.forEach(function(problem) {
			//TODO: We may want to ask the validator always return line number later
			if(!textModel) {//lazy creation of textModel
				textModel = new mTextModel.TextModel(textContent);
			}
			if(typeof problem.line === "number") {
				var lineIndex = problem.line - 1;
				var lineStart = textModel.getLineStart(lineIndex);
				problem.start = lineStart + problem.start - 1;
				problem.end = lineStart + problem.end - 1;
			} else {
				problem.line = textModel.getLineAtOffset(problem.start) + 1;
			}
		});
	}
	/**
	 * @name BookmarkssModel
	 * @description Create a new BookmarksModel
	 * @param {Object} options The options for the new model
	 * @returns {BookmarksModel} The new instance
	 */
	function BookmarksModel(options) {
		this.bookmarks = options.bookmarks;
		this.registry = options.registry;
		this.progressService = options.progressService;
	}
	BookmarksModel.prototype = Object.create(mExplorer.ExplorerModel.prototype);
	objects.mixin(BookmarksModel.prototype, /** @lends orion.propertyPanel.BookmarksModel.prototype */ {
		/** @callback */
		destroy: function(){
		},
		/** @callback */
		getListRoot: function() {
			return false;
		},
		/** @callback */
		getRoot: function(onItem){
			onItem(this.bookmarks || (this.root || (this.root = {Type: "Root"}))); //$NON-NLS-1$
		},
		/** @callback */
		getChildren: function(parentItem, onComplete){
			if (parentItem.children) {
				onComplete(parentItem.children);
			} else {
				onComplete(parentItem);
			}
		},
		/** @callback */
		getId: function(/* item */ item){
	        var result;
	        if (item === this.getListRoot()) {
	            result = this.rootId;
	        } else {
	            result = item.location;
	            // remove all non valid chars to make a dom id. 
	            result = result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
	        }
	        return result;
		}
	});
	
	/**
	 * @name BookmarksFileModel
	 * @description Creates a new BookmarksFileModel
	 * @param {Object} options The options for the new model
	 * @returns {BookmarksFileModel} the new instance
	 */
	function BookmarksFileModel(options) {
		BookmarksModel.call(this, options);
	}
	BookmarksFileModel.prototype = Object.create(BookmarksModel.prototype);
	objects.mixin(BookmarksFileModel.prototype, /** @lends orion.propertyPanel.BookmarksFileModel.prototype */ {
		/** @callback */
		getFileName: function(item) {
			return item.name;
		},
		/** @callback */
	    getScopingParams: function(item) {
	        return {
	            name: mUiUtils.path2FolderName(item.path, item.name)
	        };
	    },
	    /** @callback */
	    getDetailInfo: function(item) {
			return {lineString: item.description, lineNumber: item.line - 1, matches:[], matchNumber: 0};
	    }
	});
	/**
	 * @name BookmarksExplorer
	 * @description Create a new instance
	 * @param {Object} options The options for the new explorer
	 * @returns {BookmarksExplorer} The new instance
	 */
	function BookmarksExplorer(options) {
		this.totalBookmarks = [];
		this.totalFiles = [];
		this._BookmarksRendererByType = new BookmarksRenderer({
			registry: options.serviceRegistry,
			commandService: options.commandRegistry,
			actionScopeId: options.actionScopeId,
			checkbox: false}, this);
		this._BookmarksRendererByFile = new BookmarksFileRenderer({
			registry: options.serviceRegistry,
			commandService: options.commandRegistry,
			actionScopeId: options.actionScopeId,
			checkbox: false}, this);
		mExplorer.Explorer.call(this, options.serviceRegistry, options.selection, this._BookmarksRendererByType, options.commandRegistry);
		this.syntaxchecker = new mSyntaxchecker.SyntaxChecker(options.serviceRegistry);
		this.fileClient = options.fileClient,
		this.contentTypeRegistry = options.contentTypeRegistry;
		this.preferences = options.preferences;
		this.parentId = options.parentId;
		this.actionScopeId = options.actionScopeId;
		this.location = options.location;
		this.progressService = options.progressService;
    	mFileDetailRenderer.getPrefs(this.preferences, "/bookmarksView", ["showFullPath", "viewByFile"]).then(function(properties){ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-3$
    		this._shouldShowFullPath = properties ? properties[0] : false;
    		this._viewByFile = properties ? properties[1] : false;
    		this.declareCommands();
     	}.bind(this));
	}
	BookmarksExplorer.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(BookmarksExplorer.prototype, /** @lends orion.propertyPanel.BookmarksExplorer.prototype */ {
	    /* one-time setup of commands */
	    declareCommands: function() {
	        // actions for the renderer
			var switchViewCommand = new mCommands.Command({
				tooltip : messages["viewByTypesTooltip"],
				name: messages["viewByTypes"],
				imageClass : "bookmarks-sprite-view-mode", //$NON-NLS-1$
	            id: "orion.bookmarksView.switchView", //$NON-NLS-1$
	            groupId: "orion.bookmarksViewGroup", //$NON-NLS-1$
				type: "switch", //$NON-NLS-1$
				checked: this._viewByFile,
				visibleWhen: function(/*item*/) {
					switchViewCommand.checked = this._viewByFile;
					switchViewCommand.name = this._viewByFile ? messages["viewByTypes"] : messages["viewByFiles"];
					switchViewCommand.tooltip = this._viewByFile ? messages["viewByTypesTooltip"] : messages["viewByFilesTooltip"];
					return this.getItemCount() > 0;
				}.bind(this),
				callback : /* @callback */ function(data) {
					this.switchViewMode();
			}.bind(this)});
	        var nextResultCommand = new mCommands.Command({
	            tooltip: sharedMessages["Next result"],
	            imageClass: "core-sprite-move-down", //$NON-NLS-1$
	            id: "orion.bookmarksView.nextResult", //$NON-NLS-1$
	            groupId: "orion.bookmarksViewGroup", //$NON-NLS-1$
	            visibleWhen: function(/*item*/) {
	                return this.getItemCount() > 0;
	            }.bind(this),
	            callback: function() {
	                this.gotoNext(true, true);
	            }.bind(this)
	        });
	        var prevResultCommand = new mCommands.Command({
	            tooltip: sharedMessages["Previous result"],
	            imageClass: "core-sprite-move-up", //$NON-NLS-1$
	            id: "orion.bookmarksView.prevResult", //$NON-NLS-1$
	            groupId: "orion.bookmarksViewGroup", //$NON-NLS-1$
	            visibleWhen: function(/*item*/) {
	                return this.getItemCount() > 0;
	            }.bind(this),
	            callback: function() {
	                this.gotoNext(false, true);
	            }.bind(this)
	        });
	        
	        var switchFullPathCommand = new mCommands.Command({
	        	name: sharedMessages["fullPath"],
	            tooltip: sharedMessages["switchFullPath"],
	            imageClass : "sprite-switch-full-path", //$NON-NLS-1$
	            id: "orion.bookmarksView.switchFullPath", //$NON-NLS-1$
	            groupId: "orion.bookmarksViewGroup", //$NON-NLS-1$
	            type: "switch", //$NON-NLS-1$
	            checked: this._shouldShowFullPath,
	            visibleWhen: function(/*item*/) {
	                return this._viewByFile && this.getItemCount() > 0;
	            }.bind(this),
	            callback: function() {
	                this.switchFullPath();
	            }.bind(this)
	        });
	        
	        var refreshCommand = new mCommands.Command({
	        	name: messages["Refresh"],
	            tooltip: messages["RefreshTooltip"],
	            id: "orion.bookmarksView.refresh", //$NON-NLS-1$
	            groupId: "orion.bookmarksViewGroup", //$NON-NLS-1$
	            visibleWhen: function(/*item*/) {
	                return true;
	            }.bind(this),
	            callback: function() {
	                this.validate();
	            }.bind(this)
	        });
	        
	        this.commandService.addCommand(switchViewCommand);
	        this.commandService.addCommand(nextResultCommand);
	        this.commandService.addCommand(prevResultCommand);
	        this.commandService.addCommand(switchFullPathCommand);
	        this.commandService.addCommand(refreshCommand);
	        
	        this.commandService.addCommandGroup("bookmarksViewActions", "orion.bookmarksViewActions.unlabeled", 200); //$NON-NLS-1$ //$NON-NLS-2$
	        
	        mExplorer.createExplorerCommands(this.commandService, function(/*item*/) {
	        	return this.getItemCount() > 0;
	        }.bind(this), "orion.explorer.bookmarks.expandAll", "orion.explorer.bookmarks.collapseAll"); //$NON-NLS-1$ //$NON-NLS-2$
	        
	        this.commandService.registerCommandContribution("bookmarksViewActions", "orion.bookmarksView.switchView", 1); //$NON-NLS-1$ //$NON-NLS-2$
	        this.commandService.registerCommandContribution("bookmarksViewActions", "orion.explorer.bookmarks.expandAll", 2); //$NON-NLS-1$ //$NON-NLS-2$
	        this.commandService.registerCommandContribution("bookmarksViewActions", "orion.explorer.bookmarks.collapseAll", 3); //$NON-NLS-1$ //$NON-NLS-2$
	        this.commandService.registerCommandContribution("bookmarksViewActions", "orion.bookmarksView.nextResult", 4); //$NON-NLS-1$ //$NON-NLS-2$
	        this.commandService.registerCommandContribution("bookmarksViewActions", "orion.bookmarksView.prevResult", 5); //$NON-NLS-1$ //$NON-NLS-2$
	        this.commandService.registerCommandContribution("bookmarksViewActions", "orion.bookmarksView.switchFullPath", 6); //$NON-NLS-1$ //$NON-NLS-2$
	        this.commandService.registerCommandContribution("bookmarksViewActionsRight", "orion.bookmarksView.refresh", 7); //$NON-NLS-1$ //$NON-NLS-2$
	    },
	    /** @callback */
	    refreshCommands:function() {
	        this.commandService.destroy("bookmarksViewActionsContainerLeft"); //$NON-NLS-1$
	        this.commandService.renderCommands("bookmarksViewActions", "bookmarksViewActionsContainerLeft", this, this, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-3$
	        this.commandService.destroy("bookmarksViewActionsContainerRight"); //$NON-NLS-1$
	        this.commandService.renderCommands("bookmarksViewActionsRight", "bookmarksViewActionsContainerRight", this, this, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-3$
	    },
	    /** @callback */
	    getItemCount: function() {
			return this.totalbookmarks.length;
	    },
	    /** @callback */
	    gotoNext: function(next, forceExpand) {
	        this.getNavHandler().iterate(next, forceExpand, true);
	    },
	    /** @callback */
	    switchViewMode: function() {
	    	mFileDetailRenderer.togglePrefs(this.preferences, "/bookmarksView", ["viewByFile"]).then(function(properties){ //$NON-NLS-1$ //$NON-NLS-2$
	    		this._viewByFile = properties ? properties[0] : false;
				this._generateBookmarksModel(this.currentFlatBookmarks);
				this.incrementalRender(true);
	     	}.bind(this));
	    },
	    /** @callback */
	    switchFullPath: function() {
	    	mFileDetailRenderer.togglePrefs(this.preferences, "/bookmarksView", ["showFullPath"]).then(function(properties){ //$NON-NLS-1$ //$NON-NLS-2$
	    		this._shouldShowFullPath = properties ? properties[0] : false;
	       		mFileDetailRenderer.showFullPath(lib.node(this.parentId), this._shouldShowFullPath);
	     	}.bind(this));
	    },
		/**
		 * @description Validate all the files from the given location
		 * @function
		 * @param {String} locationParam The location to validate
		 * @param {Function} postValidate The function to call after validation is complete
		 */
		validate: function(locationParam, postValidate) {
			this.syntaxchecker.initialize(locationParam);
			if(postValidate) {
				this._postValidate = postValidate;
			}
			if(locationParam) {
				this._location = locationParam;
			}
			this._initSpinner();
			var crawler = new mSearchCrawler.SearchCrawler(this.registry, this.fileClient, null, 
				{location: this._location,
				cancelMessage: messages["computeCancelled"],
				visitSingleFile: this._visitFile.bind(this)});
			crawler.search(function(jsonData, incremental) {
				this._renderBookmarks(jsonData, incremental);
			}.bind(this));
			
		},
		/**
		 * @description Create a new problem model
		 * @function
		 * @private
		 * @param {Array.<Object>} totalBookmarks The raw list of Bookmarks
		 */
		_generateBookmarksModel: function(totalBookmarks) {
			this.currentFlatBookmarks = totalBookmarks;
			if(this._viewByFile) {
				this.filteredBookmarks = processBookmarksByFiles(this.totalFiles, totalBookmarks);
			} else {
				this.filteredBookmarks = processBookmarksByType(totalBookmarks);
			}
		},
		/**
		 * @description Initialize the view progress spinner
		 * @function
		 * @private
		 */
		_initSpinner: function() {
			var parentNode = lib.node(this.parentId);
			lib.empty(parentNode);
			var spinner = document.createElement("span");
			spinner.classList.add("modelDecorationSprite"); //$NON-NLS-1$
			spinner.classList.add("core-sprite-progress"); //$NON-NLS-1$
			parentNode.appendChild(spinner);
			var span = document.createElement("span");
			span.appendChild(document.createTextNode(messages["computingBookmarks"]));
			span.classList.add("bookmarksProgressSpan"); //$NON-NLS-1$
			parentNode.appendChild(span);
		},
		/**
		 * @description Filter all the bookmarks found and generate the model
		 * @function
		 * @param {String} filterStr The filter string
		 */
		filterBookmarks: function (filterStr) {
			var modifiedFilter = null;
			
			if (filterStr) {
				var filterFlags = "i"; // case insensitive by default //$NON-NLS-1$
				modifiedFilter = filterStr.replace(/([.+^=!:${}()|\[\]\/\\])/g, "\\$1"); //add start of line character and escape all special characters except * and ? //$NON-NLS-1$
				modifiedFilter = modifiedFilter.replace(/([*?])/g, ".$1");	//convert user input * and ? to .* and .? //$NON-NLS-1$
				
				if (/[A-Z]/.test(modifiedFilter)) {
					//filter contains uppercase letters, perform case sensitive search
					filterFlags = "";	
				}
				modifiedFilter = new RegExp(modifiedFilter, filterFlags);
				this._filterOn(modifiedFilter);
			} else {
				//filter was emptied, expand all
				this._generateBookmarksModel(this.totalBookmarks);
			}
			this.incrementalRender(true);
		},
		/**
		 * @description description
		 * @function
		 * @private
		 * @param {Object} item The file item to check
		 * @param {Object} modifiedFilter The filter to test
		 * @returns {Boolean} If the item should be filtered
		 */
		_filterSingle: function(item, modifiedFilter) { 
			return -1 !== item.description.search(modifiedFilter) || 
					-1 !== item.fileName.search(modifiedFilter) || 
					this._viewByFile && this._shouldShowFullPath && 
					-1 !== item.filePath.search(modifiedFilter);
		},
		/**
		 * @description Filter the Bookmarks using the given filter. Works on the class-level <tt>this.totalBookmarks</tt>
		 * @function
		 * @private
		 * @param {Object} modifiedFilter The filter to use
		 */
		_filterOn: function(modifiedFilter) {
			var newBookmarks = this.totalBookmarks.filter(function(problem){
				return this._filterSingle(problem, modifiedFilter);
			}.bind(this));
			this._generateBookmarksModel(newBookmarks);
		},
		/**
		 * @description Check the given file and content type
		 * @function
		 * @private
		 * @param {SearchCrawler} crawler The backing search crawler
		 * @param {Object} fileObj The file object metadata
		 * @param {String} contentType The content type id
		 * @returns {Array.<Object>} The Bookmarks array
		 */
		_visitFile: function(crawler, fileObj, contentType) {
			crawler.addTotalCounter();
			if(crawler.isCancelled()){
				return new Deferred().cancel();
			}
			return this.syntaxchecker.getValidators(fileObj.Location, contentType).then(function(validators) {
				if(Array.isArray(validators) && validators.length > 0) {
					return (this.progressService ? this.progressService.progress(this.fileClient.read(fileObj.Location), "Reading file " + fileObj.Location) : this.fileClient.read(fileObj.Location)).then(function(jsonData) { //$NON-NLS-1$
						return this._findBookmarks(jsonData, fileObj, contentType).then(function(bookmarks) {
							if( Array.isArray(bookmarks) && bookmarks.length > 0) {
								fileObj.bookmarks = bookmarks;
								recalculateOffset(jsonData, bookmarks);
								crawler.incrementalReport(fileObj);
							}
						},
						/* @callback */ function(err) {
							fileObj.bookmarks = [];
							crawler.incrementalReport(fileObj);
						});
					}.bind(this),
					function(error) {
						if(error && error.message && error.message.toLowerCase() !== "cancel") {
							console.error("Error loading file content: " + error.message); //$NON-NLS-1$
						}
					});
				}
			}.bind(this));
		},
	
		/**
		 * @description Find all of the bookmarks for the given context, file and content type
		 * @function
		 * @private
		 * @param {String} fileContentText The file contents
		 * @param {Object} fileObj The file metadata object
		 * @param {String} cType The content type id
		 * @returns {Deferred} A deferred that will resolve to the bookmarks array
		 */
		_findBookmarks: function(fileContentText, fileObj, cType){
			var editorContextObj = {
				/** @callback */
				getFileMetadata: function(){
					return {
						contentType: cType,
						location: fileObj.Location,
						name: fileObj.Name
					};
				},
				/** @callback */
				getText: function(){return fileContentText;}
			};
			this.syntaxchecker.setTextModel(new mTextModel.TextModel(fileContentText));
			return this.syntaxchecker.checkSyntax(cType, fileObj.Location, null, fileContentText, editorContextObj);
		},
		/**
		 * @description Render the bookmarks
		 * @function
		 * @private
		 * @param {Object} jsonData The problem data
		 * @param {Boolean} incremental If it should rendered incrementally
		 */
		_renderBookmarks: function(jsonData, incremental) {
			if(incremental) {
				return;
			}
			var resultLocation = [];
			lib.empty(lib.node(this.parentId));
			this.totalBookmarks = [];
			this.totalFiles = [];
			
			if (jsonData.response.numFound > 0) {
				jsonData.response.docs.forEach(function(hit) {
					if (!hit.Directory) {
						var loc = hit.Location;
						var path = hit.Path;
						if (!path) {
							var rootURL = this.fileClient.fileServiceRootURL(loc);
							path = loc.substring(rootURL.length); //remove file service root from path
						}
						var fileItem = {location: loc, path: path, type: "file", name: hit.Name, lastModified: hit.LastModified}; //$NON-NLS-1$
						if(incremental) {
							resultLocation.push(fileItem);
						} else {
							this.totalFiles.push(fileItem);
							processTotalBookmarks(fileItem, hit.bookmarks, this.totalBookmarks);
						}
					}
				}.bind(this));
			}
        	mFileDetailRenderer.showFullPath(lib.node(this.parentId), this._shouldShowFullPath);
			if(incremental) {
				this.filteredBookmarks = resultLocation;
			} else {
				this._generateBookmarksModel(this.totalBookmarks);
			}
			if(incremental){
				this.incrementalRender();
			} else {
				this.incrementalRender(true);
        		this.registry.getService("orion.page.message").setProgressMessage(""); //$NON-NLS-1$
        		if(typeof this._postValidate === "function") {
        			this._postValidate();
        		}
			}
		},
		/** @callback */
		getParent: function() {
			return lib.node(this.parentId);
		},
		/** @callback */
		destroy: function() {
			if (this._selectionListener) {
				this.selection.removeEventListener("selectionChanged", this._selectionListener);
				this._selectionListener = null;
			}
			mExplorer.Explorer.prototype.destroy.call(this);
		},
		/** @callback */
	    _incrementalRender: function(expandAll) {
			this.refreshCommands();
	    	var model;
	    	if(this._viewByFile) {
				model =  new BookmarksFileModel({
					registry: this.registry,
					bookmarks: this.filteredBookmarks,
					progressService: this.progressService,
				});
				this.setRenderer(this._BookmarksRendererByFile);
	    	} else {
				model =  new BookmarksModel({
					registry: this.registry,
					bookmarks: this.filteredBookmarks,
					progressService: this.progressService,
				});
				this.setRenderer(this._BookmarksRendererByType);
	    	}
	        this.createTree(this.parentId, model, {
	            selectionPolicy: "singleSelection", //$NON-NLS-1$
	            gridClickSelectionPolicy: "true", //$NON-NLS-1$
	            indent: 18,
	            setFocus: false
	        });
	        if(expandAll) {
	        	this.expandAll();
	        }
	        if(this.filteredBookmarks.length > 0) {
        		this.getNavHandler().cursorOn(this.filteredBookmarks[0], true, null, true);
        	}
	    },
	    /** @callback */
	    incrementalRender: function(expandAll) {
	        if(this._openWithCommands){
				this._incrementalRender(expandAll);
	        } else {
				var openWithCommandsDeferred =  extensionCommands.createOpenWithCommands(this.registry, this.contentTypeRegistry, this.commandService);
				Deferred.when(openWithCommandsDeferred, function(openWithCommands) {
						this._openWithCommands = openWithCommands;
						this._incrementalRender(expandAll);
					}.bind(this));
	        }
	    },
	    /** @callback */
		isRowSelectable: function(/*modelItem*/) {
			return true;
		}
	});
	
	/**
	 * @name BookmarksRenderer
	 * @description Create a new instance of the ProblemRenderer
	 * @param {Object} options The options for the renderer
	 * @param {BookmarksExplorer} explorer The backing explorer
	 * @returns {BookmarksRenderer} A new instance
	 */
	function BookmarksRenderer(options, explorer) {
		mExplorer.SelectionRenderer.call(this, options, explorer);
	}
	BookmarksRenderer.prototype = Object.create(mExplorer.SelectionRenderer.prototype);
	objects.mixin(BookmarksRenderer.prototype, {
		/** @callback */
	    renderBookmarksElement: function(item, spanHolder) {
			var link = generateBookmarksLink(this.explorer, item, true);
			mFileDetailRenderer.wrapDetailElement(item, spanHolder, link, this.explorer);
	    },
	    /** @callback */
	    renderDetailLineNumber: function(item, spanHolder) {
	        _place(document.createTextNode(item.line + ":"), spanHolder, "last"); //$NON-NLS-1$
	    },
	    /** @callback */
		getCellElement: function(col_no, item, tableRow){
			var div, td, itemLabel;
			switch (col_no) {
				case 0:
					td = document.createElement("td");
					div = document.createElement("div");
					td.appendChild(div);
					if (item.type === "category") {
						td.classList.add("bookmarksDecoratorTDTitle"); //$NON-NLS-1$
						this.getExpandImage(tableRow, div);
					} else if (item.type === "problem") {
 						td.classList.add("bookmarksDecoratorTD"); //$NON-NLS-1$
 					}
					return td;
				case 1:
					td = document.createElement("td");
					if (item.type === "category") {
						div = document.createElement("div");
						td.appendChild(div);
						itemLabel = document.createElement("span");
						itemLabel.textContent = item.name + i18nUtil.formatMessage(messages["items"], item.children.length);
						itemLabel.id = item.name + "CategoryItemId"; //$NON-NLS-1$
						div.appendChild(itemLabel);
					}else if (item.type === "file") {
						div = document.createElement("div");
						td.appendChild(div);
						itemLabel = document.createElement("span");
						itemLabel.textContent = item.name;
						itemLabel.id = item.location + "FileItemId"; //$NON-NLS-1$
						div.appendChild(itemLabel);
					} else if (item.type === "problem") {
                    	this.renderBookmarksElement(item, td);
 					}
					return td;
				case 2:
					td = document.createElement("td");
					if (item.type === "problem") {
						div = document.createElement("div");
						td.appendChild(div);
						itemLabel = document.createElement("span");
						itemLabel.textContent = item.fileName + "@" + item.line;
						div.appendChild(itemLabel);
					} 
					return td;
			}
		}
	});
	
    /**
     * @name BookmarksFileRenderer
     * @description Create a new BookmarksFileRenderer
     * @param {Object} options The options for the renderer
     * @param {BookmarksExplorer} explorer The backing explorer
     * @returns {BookmarksFileRenderer} A new instance 
     */
    function BookmarksFileRenderer(options, explorer) {
		mFileDetailRenderer.FileDetailRenderer.call(this, options, explorer);
    }
	BookmarksFileRenderer.prototype = Object.create(mFileDetailRenderer.FileDetailRenderer.prototype);
    
    /*
     * APIs that the subclass of fileDetailRenderer has to override
     */
	objects.mixin(BookmarksFileRenderer.prototype, {
	    /**
    	 * @description Create a new file link 
    	 * @function
    	 * @param {BookmarksModel} resultModel The result model
    	 * @param {Object} item The file item to create a link to
    	 * @public 
    	 * @returns {Object} A new link object
    	 */
    	generateFileLink: function(resultModel, item) {
			var link = navigatorRenderer.createLink(null, 
					{Location: item.location}, 
					this.explorer.commandService, 
					this.explorer.contentTypeRegistry,
					this.explorer._openWithCommands, 
					{id:item.location + "_linkId"}, //$NON-NLS-1$
					null, 
					{holderDom: this._lastFileIconDom});
			return link;
	    },
	    /**
    	 * @description Creates the details link
    	 * @function
    	 * @param {Object} item The file object to create details for
    	 * @returns {Object} A new detail link object
    	 */
    	generateDetailLink: function(item) {
			return generateBookmarksLink(this.explorer, item);
		},
	});
	
	return {
		BookmarksExplorer: BookmarksExplorer
	};
});
