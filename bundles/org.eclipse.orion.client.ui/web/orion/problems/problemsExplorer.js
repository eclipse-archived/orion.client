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

define([
	'i18n!orion/problems/nls/messages',
	'orion/Deferred',
	'orion/explorers/explorer',
	'orion/webui/littlelib',
	'orion/crawler/searchCrawler',
	'orion/extensionCommands',
	'orion/explorers/navigatorRenderer',
	'orion/objects',
	'orion/syntaxchecker',
	'orion/editor/textModel',
	'orion/explorers/navigationUtils',
	'orion/explorers/fileDetailRenderer'
], function(messages, Deferred, mExplorer, lib, mSearchCrawler, extensionCommands, navigatorRenderer, objects, mSyntaxchecker, mTextModel, mNavUtils, mFileDetailRenderer) {
    var DEBUG = false;
	function generateProblemsLink(explorer, item) {
		var params = {start: item.start, end: item.end};
		var name = item.description;
		var location = item.fileLocation;
		var link = navigatorRenderer.createLink(null, 
			{Location: location, Name: name}, 
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
	function recalculateOffset(textContent, problems) {
		//TODO: We also need line number here
		var textModel = null;
		problems.forEach(function(problem) {
			if(typeof problem.line === "number") { //$NON-NLS-0$
				if(!textModel) {//lazy creation of textModel
					textModel = new mTextModel.TextModel(textContent);
				}
				var lineIndex = problem.line - 1;
				var lineStart = textModel.getLineStart(lineIndex);
				problem.start = lineStart + problem.start - 1;
				problem.end = lineStart + problem.end - 1;
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
	
	/**
	 * @class orion.propertyPanel.ProblemsExplorer
	 * @extends orion.explorers.Explorer
	 */
	function ProblemsExplorer(options) {
		var renderer = new ProblemsRenderer({
			noRowHighlighting: true,
			registry: options.serviceRegistry,
			commandService: options.commandRegistry,
			actionScopeId: options.actionScopeId,
			checkbox: false}, this);
		mExplorer.Explorer.call(this, options.serviceRegistry, options.selection, renderer, options.commandRegistry);	
		this.fileClient = options.fileClient,
		this.contentTypeRegistry = options.contentTypeRegistry;
		this.parentId = options.parentId ? options.parentId : "orion.PropertyPanel.container";
		this.actionScopeId = options.actionScopeId;
		this.location = options.location;
		this.progressService = options.progressService;
		this.explorerSelectionScope = "explorerSelection";  //$NON-NLS-0$
		this.explorerSelectionStatus = "explorerSelectionStatus";  //$NON-NLS-0$
		//this.createCommands();
	}
	ProblemsExplorer.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(ProblemsExplorer.prototype, /** @lends orion.propertyPanel.ProblemsExplorer.prototype */ {
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
		filterProblems: function (filterStr, onFileName) {
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
				this._filterOn(modifiedFilter, onFileName);
			} else {
				//filter was emptied, expand all
				this.filteredProblems = processProblemsByType(this.totalProblems);
			}
			this.incrementalRender(true);
		},
		_filterSingle: function(item, modifiedFilter, onFileName) {
			//TODO: we need to return true if either file name or description hit the search
			var strToTest = item.description;
			if(onFileName) {
				strToTest = item.fileName;
			}
			return (-1 !== strToTest.search(modifiedFilter));
		},
		_filterOn: function(modifiedFilter, onFileName) {
			var newProblems = this.totalProblems.filter(function(problem){
				return this._filterSingle(problem, modifiedFilter, onFileName);
			}.bind(this));
			this.filteredProblems = processProblemsByType(newProblems);
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
			return syntaxChecker.checkSyntax(cType, fileObj.Location, null, fileContentText, {getText: function(){return fileContentText;}});
		},
		_renderProblems: function(jsonData, incremental) {
			if(incremental) {
				return;
			}
			var resultLocation = [];
			lib.empty(lib.node(this.parentId));
			this.totalProblems = [];
			
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
							processTotalProblems(fileItem, hit.problems, this.totalProblems);
						}
					}
				}.bind(this));
			}
			if(incremental) {
				this.filteredProblems = resultLocation;
			} else {
				this.filteredProblems = processProblemsByType(this.totalProblems);
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
			var model =  new ProblemsModel({
				registry: this.registry,
				problems: this.filteredProblems,
				progressService: this.progressService,
			});
	        this.createTree(this.parentId, model, {
	            selectionPolicy: "singleSelection", //$NON-NLS-0$
	            //getChildrenFunc: function(model) {return this.model.getFilteredChildren(model);}.bind(this),
	            indent: 18,
	            setFocus: false
	        });
	        if(expandAll) {
	        	this.expandAll();
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
		},
		updateCommands: function() {
			mExplorer.createExplorerCommands(this.commandService);
		},
		refreshSelection: function() {
			//Do nothing
		}
	});
	
	function ProblemsRenderer(explorer) {
		mExplorer.SelectionRenderer.apply(this, arguments);
		this.explorer = explorer;
	}
	ProblemsRenderer.prototype = Object.create(mExplorer.SelectionRenderer.prototype);
	objects.mixin(ProblemsRenderer.prototype, {
	    renderProblemsElement: function(item, spanHolder) {
			var link = generateProblemsLink(this.explorer, item);
       		mNavUtils.addNavGrid(this.explorer.getNavDict(), item, link);
	        spanHolder.appendChild(link);
	    },
		_getDecoratorIcon: function(holderDiv, isError){
			var icon = document.createElement("div"); //$NON-NLS-0$
			
			icon.classList.add("problemsDecorator"); //$NON-NLS-0$
			if(isError) {
				icon.classList.add("problemsError"); //$NON-NLS-0$
			} else {
				icon.classList.add("problemsWarning"); //$NON-NLS-0$
			}
			holderDiv.appendChild(icon);
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
						this._getDecoratorIcon(div, item.location === "category_errors_id");
					} else if (item.type === "problem") { //$NON-NLS-0$
 						td.classList.add("problemsDecoratorTD"); //$NON-NLS-0$
						this._getDecoratorIcon(div, item.severity === "error");
 					}
					return td;
				case 1:
					td = document.createElement("td"); //$NON-NLS-0$
					if (item.type === "category") { //$NON-NLS-0$
						div = document.createElement("div"); //$NON-NLS-0$
						td.appendChild(div);
						//this.getExpandImage(tableRow, div);
						//this._getDecoratorIcon(div, item.location === "category_errors_id");
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
		},
	});
	
    //Renderer to render the model
    function ProblemsFileRenderer(explorer) {
        this.explorer = explorer;
    }
	ProblemsFileRenderer.prototype = Object.create(mFileDetailRenderer.FileDetailRenderer.prototype);
    
    /*
     * APIs that the subclass of fileDetailRenderer has to override
     */
    ProblemsFileRenderer.prototype.generateFileLink = function(resultModel, item) {
		var link = navigatorRenderer.createLink(null, 
				{Location: item.location}, 
				this.explorer._commandService, 
				this.explorer._contentTypeService,
				this.explorer._openWithCommands, 
				{id:item.location + "_linkId"}, //$NON-NLS-0$
				null, 
				{holderDom: this._lastFileIconDom});
		return link;
    };
    
    ProblemsFileRenderer.prototype.generateDetailLink = function(item) {
		return generateProblemsLink(this.explorer, item);
	};
	
	return {
		ProblemsExplorer: ProblemsExplorer
	};
});
