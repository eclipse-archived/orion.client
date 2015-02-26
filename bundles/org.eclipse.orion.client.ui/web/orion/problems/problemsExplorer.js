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
	'orion/explorers/navigationUtils',
	'orion/explorers/fileDetailRenderer',
	'orion/uiUtils',
	'orion/URL-shim'
], function(messages, sharedMessages, Deferred, mExplorer, lib, mSearchCrawler, extensionCommands, mCommands, navigatorRenderer, objects, mSyntaxchecker, mTextModel, mNavUtils, mFileDetailRenderer, mUiUtils) {
    var DEBUG = false;
    function _place(ndoeToPlace, parent, position) {
        var parentNode = lib.node(parent);
        if (parentNode) {
            if (position === "only") { //$NON-NLS-0$
                lib.empty(parentNode);
            }
            parentNode.appendChild(ndoeToPlace);
        }
    }

    function _createElement(elementTag, classNames, id, parent) {
        var element = document.createElement(elementTag);
        if (classNames) {
            if (Array.isArray(classNames)) {
                for (var i = 0; i < classNames.length; i++) {
                    element.classList.add(classNames[i]);
                }
            } else if (typeof classNames === "string") { //$NON-NLS-0$
                element.className = classNames;
            }
        }
        if (id) {
            element.id = id;
        }
        var parentNode = lib.node(parent);
        if (parentNode) {
            parentNode.appendChild(element);
        }
        return element;
    }

    function _createSpan(classNames, id, parent, spanName) {
        var span = _createElement('span', classNames, id, parent); //$NON-NLS-0$
        if (spanName) {
            span.appendChild(document.createTextNode(spanName));
        }
        return span;
    }

	function getDetailDecoratorIcon(holderDiv, isError, additionalCss){
		var icon = document.createElement("div"); //$NON-NLS-0$
		
		icon.classList.add("problemsDecorator"); //$NON-NLS-0$
		if(additionalCss) {
			icon.classList.add(additionalCss); //$NON-NLS-0$
		}
		if(isError) {
			icon.classList.add("problemsError"); //$NON-NLS-0$
		} else {
			icon.classList.add("problemsWarning"); //$NON-NLS-0$
		}
		holderDiv.appendChild(icon);
	}
	function getDetailLineNumber(holderDiv, isError){
		var icon = document.createElement("div"); //$NON-NLS-0$
		
		icon.classList.add("problemsDecorator"); //$NON-NLS-0$
		if(isError) {
			icon.classList.add("problemsError"); //$NON-NLS-0$
		} else {
			icon.classList.add("problemsWarning"); //$NON-NLS-0$
		}
		holderDiv.appendChild(icon);
	}
	function generateProblemsLink(explorer, item, showName) {
		var params = {start: item.start, end: item.end};
		var name = item.description;
		var location = item.fileLocation;
		var link = navigatorRenderer.createLink(null, 
			{Location: location, Name: showName ? name : null}, 
			explorer.commandService, 
			explorer.contentTypeRegistry,
			explorer._openWithCommands, 
			{id:item.location + "_linkId"}, //$NON-NLS-0$
			params, 
			{});
		return link;
	}
	function processTotalProblems(fileItem, problemsInFile, totalProblems) {
		problemsInFile.forEach(function(child) {
			child.type = "problem"; //$NON-NLS-0$
			child.fileName = fileItem.name;
			child.filePath = fileItem.path;
			child.fileLocation = fileItem.location;
			child.location = fileItem.location + child.description + child.start + child.end;
			totalProblems.push(child);
		});
	}
	function processProblemsByType(totalProblems) {
		var errorsParent = {children: [], type: "category", location: "category_errors_id", name: messages["Errors"]}, 
		warningsParent = {children: [], type: "category", location: "category_warnings_id", name: messages["Warnings"]};
		totalProblems.forEach(function(child) {
			if(child.severity === "warning") { //$NON-NLS-0$
				child.parent = warningsParent;
				warningsParent.children.push(child);
			} else {
				child.parent = errorsParent;
				errorsParent.children.push(child);
			}
		});
		return [errorsParent, warningsParent];
	}
	function processProblemsByFiles(totalFiles, totalProblems) {
		var problemsByFile = [];
		totalFiles.forEach(function(file) {
			var newProblems = totalProblems.filter(function(problem){
				return problem.fileLocation === file.location;
			});
			if(newProblems && newProblems.length > 0) {
				problemsByFile.push(file);
				file.children = newProblems;
				newProblems.forEach(function(problem) {
					problem.parent = file;
				});
			}
		});
		return problemsByFile;
	}
	function recalculateOffset(textContent, problems) {
		var textModel = null;
		problems.forEach(function(problem) {
			//TODO: We may want to ask the validator always return line number later
			if(!textModel) {//lazy creation of textModel
				textModel = new mTextModel.TextModel(textContent);
			}
			if(typeof problem.line === "number") { //$NON-NLS-0$
				var lineIndex = problem.line - 1;
				var lineStart = textModel.getLineStart(lineIndex);
				problem.start = lineStart + problem.start - 1;
				problem.end = lineStart + problem.end - 1;
			} else {
				problem.line = textModel.getLineAtOffset(problem.start) + 1;
			}
		});
	}
	function ProblemsModel(options) {
		this.problems = options.problems;
		this.registry = options.registry;
		this.progressService = options.progressService;
	}
	ProblemsModel.prototype = Object.create(mExplorer.ExplorerModel.prototype);
	objects.mixin(ProblemsModel.prototype, /** @lends orion.propertyPanel.ProblemsModel.prototype */ {
		destroy: function(){
		},
		getListRoot: function() {
			return false;
		},
		getRoot: function(onItem){
			onItem(this.problems || (this.root || (this.root = {Type: "Root"}))); //$NON-NLS-0$
		},
		getChildren: function(parentItem, onComplete){
			if (parentItem.children) {
				onComplete(parentItem.children);
			} else {
				onComplete(parentItem);
			}
		},
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
	
	function ProblemsFileModel(options) {
		ProblemsModel.call(this, options);
	}
	ProblemsFileModel.prototype = Object.create(ProblemsModel.prototype);
	objects.mixin(ProblemsFileModel.prototype, /** @lends orion.propertyPanel.ProblemsFileModel.prototype */ {
		getFileName: function(item) {
			return item.name;
		},
	    getScopingParams: function(item) {
	        return {
	            name: mUiUtils.path2FolderName(item.path, item.name)
	        };
	    },
	    getDetailInfo: function(item) {
			return {lineString: item.description, lineNumber: item.line - 1, matches:[], matchNumber: 0};
	    }
	});
	/**
	 * @class orion.propertyPanel.ProblemsExplorer
	 * @extends orion.explorers.Explorer
	 */
	function ProblemsExplorer(options) {
		this.totalProblems = [];
		this.totalFiles = [];
		this._ProblemsRendererByType = new ProblemsRenderer({
			registry: options.serviceRegistry,
			commandService: options.commandRegistry,
			actionScopeId: options.actionScopeId,
			checkbox: false}, this);
		this._ProblemsRendererByFile = new ProblemsFileRenderer({
			registry: options.serviceRegistry,
			commandService: options.commandRegistry,
			actionScopeId: options.actionScopeId,
			checkbox: false}, this);
		mExplorer.Explorer.call(this, options.serviceRegistry, options.selection, this._ProblemsRendererByType, options.commandRegistry);	
		this.fileClient = options.fileClient,
		this.contentTypeRegistry = options.contentTypeRegistry;
		this.preferences = options.preferences;
		this.parentId = options.parentId;
		this.actionScopeId = options.actionScopeId;
		this.location = options.location;
		this.progressService = options.progressService;
    	mFileDetailRenderer.getFullPathPref(this.preferences, "/problemsView", ["showFullPath", "viewByFile"]).then(function(properties){ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
    		this._shouldShowFullPath = (properties ? properties[0] : false);
    		this._viewByFile = (properties ? properties[1] : false);
    		this.declareCommands();
     	}.bind(this));
	}
	ProblemsExplorer.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(ProblemsExplorer.prototype, /** @lends orion.propertyPanel.ProblemsExplorer.prototype */ {
	    /* one-time setup of commands */
	    declareCommands: function() {
	        // actions for the renderer
			var switchViewCommand = new mCommands.Command({
				tooltip : messages["viewByTypesTooltip"],
				name: messages["viewByTypes"],
				imageClass : "problems-sprite-view-mode", //$NON-NLS-0$
	            id: "orion.problemsView.switchView", //$NON-NLS-0$
	            groupId: "orion.problemsViewGroup", //$NON-NLS-0$
				type: "switch", //$NON-NLS-0$
				checked: this._viewByFile,
				visibleWhen: function(/*item*/) {
					switchViewCommand.checked = this._viewByFile;
					switchViewCommand.name = this._viewByFile ? messages["viewByTypes"] : messages["viewByFiles"];
					switchViewCommand.tooltip = this._viewByFile ? messages["viewByTypesTooltip"] : messages["viewByFilesTooltip"];
					return this.getItemCount() > 0;
				}.bind(this),
				callback : function(data) {
					this.switchViewMode();
			}.bind(this)});
	        var nextResultCommand = new mCommands.Command({
	            tooltip: sharedMessages["Next result"],
	            imageClass: "core-sprite-move-down", //$NON-NLS-0$
	            id: "orion.problemsView.nextResult", //$NON-NLS-0$
	            groupId: "orion.problemsViewGroup", //$NON-NLS-0$
	            visibleWhen: function(/*item*/) {
	                return this.getItemCount() > 0;
	            }.bind(this),
	            callback: function() {
	                this.gotoNext(true, true);
	            }.bind(this)
	        });
	        var prevResultCommand = new mCommands.Command({
	            tooltip: sharedMessages["Previous result"],
	            imageClass: "core-sprite-move-up", //$NON-NLS-0$
	            id: "orion.problemsView.prevResult", //$NON-NLS-0$
	            groupId: "orion.problemsViewGroup", //$NON-NLS-0$
	            visibleWhen: function(/*item*/) {
	                return this.getItemCount() > 0;
	            }.bind(this),
	            callback: function() {
	                this.gotoNext(false, true);
	            }.bind(this)
	        });
	        
	        var switchFullPathCommand = new mCommands.Command({
	        	name: sharedMessages["fullPath"], //$NON-NLS-0$
	            tooltip: sharedMessages["switchFullPath"], //$NON-NLS-0$
	            imageClass : "sprite-switch-full-path", //$NON-NLS-0$
	            id: "orion.problemsView.switchFullPath", //$NON-NLS-0$
	            groupId: "orion.problemsViewGroup", //$NON-NLS-0$
	            type: "switch", //$NON-NLS-0$
	            checked: this._shouldShowFullPath,
	            visibleWhen: function(/*item*/) {
	                return this._viewByFile && this.getItemCount() > 0;
	            }.bind(this),
	            callback: function() {
	                this.switchFullPath();
	            }.bind(this)
	        });
	        
	        this.commandService.addCommand(switchViewCommand);
	        this.commandService.addCommand(nextResultCommand);
	        this.commandService.addCommand(prevResultCommand);
	        this.commandService.addCommand(switchFullPathCommand);
	        
	        this.commandService.addCommandGroup("problemsViewActions", "orion.problemsViewActions.unlabeled", 200); //$NON-NLS-1$ //$NON-NLS-0$
	        
	        mExplorer.createExplorerCommands(this.commandService, function(/*item*/) {
	        	return this.getItemCount() > 0;
	        }.bind(this), "orion.explorer.problems.expandAll", "orion.explorer.problems.collapseAll"); //$NON-NLS-1$ //$NON-NLS-0$
	        
	        this.commandService.registerCommandContribution("problemsViewActions", "orion.problemsView.switchView", 1); //$NON-NLS-1$ //$NON-NLS-0$
	        this.commandService.registerCommandContribution("problemsViewActions", "orion.explorer.problems.expandAll", 2); //$NON-NLS-1$ //$NON-NLS-0$
	        this.commandService.registerCommandContribution("problemsViewActions", "orion.explorer.problems.collapseAll", 3); //$NON-NLS-1$ //$NON-NLS-0$
	        this.commandService.registerCommandContribution("problemsViewActions", "orion.problemsView.nextResult", 4); //$NON-NLS-1$ //$NON-NLS-0$
	        this.commandService.registerCommandContribution("problemsViewActions", "orion.problemsView.prevResult", 5); //$NON-NLS-1$ //$NON-NLS-0$
	        this.commandService.registerCommandContribution("problemsViewActions", "orion.problemsView.switchFullPath", 6); //$NON-NLS-1$ //$NON-NLS-0$
	    },
	    refreshCommands:function() {
	        this.commandService.destroy("problemsViewActionsContainer"); //$NON-NLS-0$
	        this.commandService.renderCommands("problemsViewActions", "problemsViewActionsContainer", this, this, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	    },
	    getItemCount: function() {
			return this.totalProblems.length;
	    },
	    gotoNext: function(next, forceExpand) {
	        this.getNavHandler().iterate(next, forceExpand, true);
	    },
	    switchViewMode: function() {
	    	mFileDetailRenderer.switchFullPathPref(this.preferences, "/problemsView", ["viewByFile"]).then(function(properties){ //$NON-NLS-1$ //$NON-NLS-0$
	    		this._viewByFile = (properties ? properties[0] : false);
				this._generateProblemsModel(this.currentFlatProblems);
				this.incrementalRender(true);
	     	}.bind(this));
	    },
	    switchFullPath: function() {
	    	mFileDetailRenderer.switchFullPathPref(this.preferences, "/problemsView", ["showFullPath"]).then(function(properties){ //$NON-NLS-1$ //$NON-NLS-0$
	    		this._shouldShowFullPath = (properties ? properties[0] : false);
	       		mFileDetailRenderer.showFullPath(lib.node(this.parentId), this._shouldShowFullPath);
	     	}.bind(this));
	    },
		validate: function(location, postValidate) {
			this._postValidate = postValidate;
			this._initSpinner();
			var crawler = new mSearchCrawler.SearchCrawler(this.registry, this.fileClient, null, 
				{location: location,
				cancelMessage: messages["computeCancelled"],
				visitSingleFile: this._visitFile.bind(this)});
			crawler.search(function(jsonData, incremental) {
				this._renderProblems(jsonData, incremental);
			}.bind(this));
			
		},
		_generateProblemsModel: function(totalProblems) {
			this.currentFlatProblems = totalProblems;
			if(this._viewByFile) {
				this.filteredProblems = processProblemsByFiles(this.totalFiles, totalProblems);
			} else {
				this.filteredProblems = processProblemsByType(totalProblems);
			}
		},
		_initSpinner: function() {
			var parentNode = lib.node(this.parentId);
			lib.empty(parentNode);
			var spinner = document.createElement("span"); //$NON-NLS-0$
			spinner.classList.add("modelDecorationSprite"); //$NON-NLS-0$
			spinner.classList.add("core-sprite-progress"); //$NON-NLS-0$
			parentNode.appendChild(spinner);
			var span = document.createElement("span"); //$NON-NLS-0$
			span.appendChild(document.createTextNode(messages["computingProblems"])); //$NON-NLS-0$
			span.classList.add("problemsProgressSpan"); //$NON-NLS-0$
			parentNode.appendChild(span);
		},
		filterProblems: function (filterStr) {
			var modifiedFilter = null;
			
			if (filterStr) {
				var filterFlags = "i"; // case insensitive by default //$NON-NLS-0$
				modifiedFilter = filterStr.replace(/([.+^=!:${}()|\[\]\/\\])/g, "\\$1"); //add start of line character and escape all special characters except * and ? //$NON-NLS-1$ //$NON-NLS-0$
				modifiedFilter = modifiedFilter.replace(/([*?])/g, ".$1");	//convert user input * and ? to .* and .? //$NON-NLS-0$
				
				if (/[A-Z]/.test(modifiedFilter)) {
					//filter contains uppercase letters, perform case sensitive search
					filterFlags = "";	
				}
				modifiedFilter = new RegExp(modifiedFilter, filterFlags);
				this._filterOn(modifiedFilter);
			} else {
				//filter was emptied, expand all
				this._generateProblemsModel(this.totalProblems);
			}
			this.incrementalRender(true);
		},
		_filterSingle: function(item, modifiedFilter) { 
			return (-1 !== item.description.search(modifiedFilter) || -1 !== item.fileName.search(modifiedFilter) || (this._viewByFile && this._shouldShowFullPath && -1 !== item.filePath.search(modifiedFilter)));
		},
		_filterOn: function(modifiedFilter) {
			var newProblems = this.totalProblems.filter(function(problem){
				return this._filterSingle(problem, modifiedFilter);
			}.bind(this));
			this._generateProblemsModel(newProblems);
		},
		_visitFile: function(crawler, fileObj, contentType){
			crawler.addTotalCounter();
			var self = this;
			if(crawler.isCancelled()){
				return;
			}
			return mSyntaxchecker.getValidators(this.registry, contentType, fileObj.Location).then(function(validators) {
				if(validators && validators.length > 0) {
					return (self.progressService ? self.progressService.progress(self.fileClient.read(fileObj.Location), "Reading file " + fileObj.Location) : self.fileClient.read(fileObj.Location)).then(function(jsonData) { //$NON-NLS-0$
						return self._findProblems(jsonData, fileObj, contentType).then(function(problems) {
							if(!problems || problems.length === 0) {
								return;
							}
							fileObj.problems = problems;
							recalculateOffset(jsonData, problems);
							if(DEBUG) {
								console.log("File that has problems: " + fileObj.Name); //$NON-NLS-0$
								console.log(problems); //$NON-NLS-0$
							}
							crawler.incrementalReport(fileObj);
						});
					},
					function(error) {
						if(error && error.message && error.message.toLowerCase() !== "cancel") { //$NON-NLS-0$
							console.error("Error loading file content: " + error.message); //$NON-NLS-0$
						}
					});
				} else {
					if(DEBUG) {
						console.log("File that are not read at all: " + fileObj.Name); //$NON-NLS-0$
					}
				}
			});
		},
	
		_findProblems: function( fileContentText, fileObj, cType){
			var syntaxChecker = new mSyntaxchecker.SyntaxChecker(this.registry, new mTextModel.TextModel(fileContentText));
			var that = this;
			var editorContextObj = {
				getFileMetadata: function(){
					return {
						contentType: cType,
						location: fileObj.Location
					};
				},
				getText: function(){return fileContentText;}
			};
			return syntaxChecker.checkSyntax(cType, fileObj.Location, null, fileContentText, editorContextObj);
		},
		_renderProblems: function(jsonData, incremental) {
			if(incremental) {
				return;
			}
			var resultLocation = [];
			lib.empty(lib.node(this.parentId));
			this.totalProblems = [];
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
						var fileItem = {location: loc, path: path, type: "file", name: hit.Name, lastModified: hit.LastModified};
						if(incremental) {
							resultLocation.push(fileItem);
						} else {
							this.totalFiles.push(fileItem);
							processTotalProblems(fileItem, hit.problems, this.totalProblems);
						}
					}
				}.bind(this));
			}
        	mFileDetailRenderer.showFullPath(lib.node(this.parentId), this._shouldShowFullPath);
			if(incremental) {
				this.filteredProblems = resultLocation;
			} else {
				this._generateProblemsModel(this.totalProblems);
			}
			if(incremental){
				this.incrementalRender();
			} else {
				this.incrementalRender(true);
        		this.registry.getService("orion.page.message").setProgressMessage(""); //$NON-NLS-0$
        		if(typeof this._postValidate === "function") {
        			this._postValidate();
        		}
			}
		},
		getParent: function() {
			return lib.node(this.parentId);
		},
		destroy: function() {
			if (this._selectionListener) {
				this.selection.removeEventListener("selectionChanged", this._selectionListener); //$NON-NLS-0$
				this._selectionListener = null;
			}
			mExplorer.Explorer.prototype.destroy.call(this);
		},
	    _incrementalRender: function(expandAll) {
			this.refreshCommands();
	    	var model;
	    	if(this._viewByFile) {
				model =  new ProblemsFileModel({
					registry: this.registry,
					problems: this.filteredProblems,
					progressService: this.progressService,
				});
				this.setRenderer(this._ProblemsRendererByFile);
	    	} else {
				model =  new ProblemsModel({
					registry: this.registry,
					problems: this.filteredProblems,
					progressService: this.progressService,
				});
				this.setRenderer(this._ProblemsRendererByType);
	    	}
	        this.createTree(this.parentId, model, {
	            selectionPolicy: "singleSelection", //$NON-NLS-0$
	            //getChildrenFunc: function(model) {return this.model.getFilteredChildren(model);}.bind(this),
	            indent: 18,
	            setFocus: false
	        });
	        if(expandAll) {
	        	this.expandAll();
	        }
	        if(this.filteredProblems.length > 0) {
        		this.getNavHandler().cursorOn(this.filteredProblems[0], true, null, true);
        	}
	    },
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
		isRowSelectable: function(/*modelItem*/) {
			return true;
		}
	});
	
	function ProblemsRenderer(options, explorer) {
		mExplorer.SelectionRenderer.call(this, options, explorer);
	}
	ProblemsRenderer.prototype = Object.create(mExplorer.SelectionRenderer.prototype);
	objects.mixin(ProblemsRenderer.prototype, {
	    renderProblemsElement: function(item, spanHolder) {
			var link = generateProblemsLink(this.explorer, item, true);
       		mNavUtils.addNavGrid(this.explorer.getNavDict(), item, link);
	        spanHolder.appendChild(link);
	    },
	    renderDetailLineNumber: function(item, spanHolder) {
	        _place(document.createTextNode(item.line + ":"), spanHolder, "last"); //$NON-NLS-1$ //$NON-NLS-0$
	    },
		getCellElement: function(col_no, item, tableRow){
			var div, td, itemLabel;
			switch (col_no) {
				case 0:
					td = document.createElement("td"); //$NON-NLS-0$
					div = document.createElement("div"); //$NON-NLS-0$
					td.appendChild(div);
					if (item.type === "category") { //$NON-NLS-0$
						td.classList.add("problemsDecoratorTDTitle"); //$NON-NLS-0$
						this.getExpandImage(tableRow, div);
						getDetailDecoratorIcon(div, item.location === "category_errors_id");
					} else if (item.type === "problem") { //$NON-NLS-0$
 						td.classList.add("problemsDecoratorTD"); //$NON-NLS-0$
						getDetailDecoratorIcon(div, item.severity === "error");
 					}
					return td;
				case 1:
					td = document.createElement("td"); //$NON-NLS-0$
					if (item.type === "category") { //$NON-NLS-0$
						div = document.createElement("div"); //$NON-NLS-0$
						td.appendChild(div);
						itemLabel = document.createElement("span"); //$NON-NLS-0$
						itemLabel.textContent = item.name + " (" + item.children.length + " items)";
						itemLabel.id = item.name + "CategoryItemId"; //$NON-NLS-0$
						div.appendChild(itemLabel);
					}else if (item.type === "file") { //$NON-NLS-0$
						div = document.createElement("div"); //$NON-NLS-0$
						td.appendChild(div);
						itemLabel = document.createElement("span"); //$NON-NLS-0$
						itemLabel.textContent = item.name;
						itemLabel.id = item.location + "FileItemId"; //$NON-NLS-0$
						div.appendChild(itemLabel);
					} else if (item.type === "problem") { //$NON-NLS-0$
                    	this.renderProblemsElement(item, td);
 					}
					return td;
				case 2:
					td = document.createElement("td"); //$NON-NLS-0$
					if (item.type === "problem") { //$NON-NLS-0$
						div = document.createElement("div"); //$NON-NLS-0$
						td.appendChild(div);
						//this.getExpandImage(tableRow, div);
						itemLabel = document.createElement("span"); //$NON-NLS-0$
						itemLabel.textContent = item.fileName;
						div.appendChild(itemLabel);
					} 
					return td;
			}
		}
	});
	
    //Renderer to render the model
    function ProblemsFileRenderer(options, explorer) {
		mFileDetailRenderer.FileDetailRenderer.call(this, options, explorer);
    }
	ProblemsFileRenderer.prototype = Object.create(mFileDetailRenderer.FileDetailRenderer.prototype);
    
    /*
     * APIs that the subclass of fileDetailRenderer has to override
     */
	objects.mixin(ProblemsFileRenderer.prototype, {
	    generateFileLink: function(resultModel, item) {
			var link = navigatorRenderer.createLink(null, 
					{Location: item.location}, 
					this.explorer.commandService, 
					this.explorer.contentTypeRegistry,
					this.explorer._openWithCommands, 
					{id:item.location + "_linkId"}, //$NON-NLS-0$
					null, 
					{holderDom: this._lastFileIconDom});
			return link;
	    },
	    generateDetailLink: function(item) {
			return generateProblemsLink(this.explorer, item);
		},
	    generateDetailDecorator: function(item, spanHolder) {
//			var div = document.createElement("div"); //$NON-NLS-0$
//			col.appendChild(div);
			getDetailDecoratorIcon(spanHolder, item.severity === "error", "problemsDecoratorLessMargin"); //$NON-NLS-0$
	    }
	});
	
	return {
		ProblemsExplorer: ProblemsExplorer
	};
});
