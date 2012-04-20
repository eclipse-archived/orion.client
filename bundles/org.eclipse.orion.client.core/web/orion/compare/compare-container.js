/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define window dijit */
/*jslint browser:true devel:true */
define(['require', 'dojo', 'orion/compare/diff-parser', 'orion/compare/compare-rulers', 'orion/editor/contentAssist',
        'orion/editorCommands','orion/editor/editor','orion/editor/editorFeatures','orion/globalCommands', 'orion/breadcrumbs', 'orion/commands',
        'orion/textview/textModel','orion/textview/textView', 'orion/compare/compareUtils', 'orion/compare/diff-provider', 'orion/compare/jsdiffAdapter', 'orion/highlight', 'orion/compare/diffTreeNavigator'], 
		function(require, dojo, mDiffParser, mCompareRulers, mContentAssist, mEditorCommands, mEditor, mEditorFeatures, mGlobalCommands, mBreadcrumbs,
				mCommands, mTextModel, mTextView, mCompareUtils, mDiffProvider, mJSDiffAdapter, Highlight, mDiffTreeNavigator) {

var exports = {};

exports.DefaultDiffProvider = (function() {
	function DefaultDiffProvider(serviceRegistry){
		this.serviceRegistry = serviceRegistry;
		this._diffProvider = new mDiffProvider.DiffProvider(serviceRegistry);
	}	
	DefaultDiffProvider.prototype = {
		_resolveComplexDiff: function(complexURL, onlyDiff, errorCallback) {
			if(!this._diffProvider){
				console.log("A diff provider is needed for compound diff URL");
				return;
			}
			var that = this;
			that._diffProvider.getDiffContent(complexURL).then(function(jsonData, secondArg) {
				if (that._hasConflicts) {
					that._diffContent = jsonData.split("diff --git")[1];
				} else {
					that._diffContent = jsonData;
				}
				if (onlyDiff){
					that.callBack({ 
			 			diff: that._diffContent
					 });
				} else {
					that._resolveComplexFileURL(complexURL);
				}
			}, errorCallback);
		},
		
		//temporary
		//TODO : get the file name from file service
		_resolveFileName: function(fileURL){
			var fileName = fileURL.split("?")[0];
			return fileName;
		},
		
		_getContentType: function(fileURL){
			var filename = this._resolveFileName(fileURL);
			return this.serviceRegistry.getService("orion.core.contenttypes").getFilenameContentType(filename);
		},
		
		_resolveComplexFileURL: function(complexURL, errorCallback) {
			var that = this;
			this._diffProvider.getDiffFileURI(complexURL).then(function(jsonData, secondArg) {
				var dl = new dojo.DeferredList([ that._getContentType(jsonData.Old), that._getContentType(jsonData.New) ]);
				dl.then(function(results) {
					var baseFileContentType = results[0][1];
					var newFileContentType = results[1][1];
					that.callBack({ baseFile:{URL: jsonData.Old, Name: that._resolveFileName(jsonData.Old), Type: baseFileContentType},
					 			newFile:{URL: jsonData.New, Name: that._resolveFileName(jsonData.New), Type: newFileContentType},
					 			diff: that._diffContent
							 });
				}, errorCallback);
			}, errorCallback);
		},
		
		provide: function(complexURL, onlyDiff, hasConflicts,callBack, errorCallBack) {
			this.callBack = callBack;
			this._hasConflicts = hasConflicts;
			this._resolveComplexDiff(complexURL, onlyDiff, errorCallBack);
		}
	};
	return DefaultDiffProvider;
}());

exports.CompareStyler = (function() {
	function CompareStyler(registry){
		this._syntaxHighlither = new Highlight.SyntaxHighlighter(registry);
	}	
	CompareStyler.prototype = {
		highlight: function(fileName, contentType, editorWidget) {
			this._syntaxHighlither.setup(contentType, editorWidget, 
										 null, //passing an AnnotationModel allows the styler to use it to annotate tasks/comment folding/etc, but we do not really need this in compare editor
										 fileName);
		}
	};
	return CompareStyler;
}());

exports.CompareContainer = (function() {
	function CompareContainer () {
		this._diffParser = new mDiffParser.DiffParser();
	}
	CompareContainer.prototype = {
		_clearOptions: function(){
			this._readonly = undefined;
			this._charDiff = undefined;
			this._wordLevelNav = undefined;
			this._commandSpanId = undefined;
			this._hasConflicts = undefined;
			this._diffProvider = undefined;
			this._complexURL = undefined;
			this._baseFile = {URL:"", Name:"", Type:""};
			this._newFile = {URL:"", Name:"", Type:""};
			
			this._diffURL = undefined;
			this._diffContent = undefined;
			
			this._block = 1;
			this._change = 0;
			
			this._onSave = undefined;
			this._onSetTitle = undefined;
		},
			
		setOptions: function(options, clearExisting){
			if(clearExisting){
				this._clearOptions();
			}
			if(options){
				//mapper is purely internal option
				this._mapper = options.mapper ? options.mapper : this._mapper;
				
				this._commandSpanId = typeof(options.commandSpanId) === "string" ? options.commandSpanId : this._commandSpanId;
				this._readonly = (options.readonly !== undefined &&  options.readonly !== null) ? options.readonly : this._readonly;
				this._wordLevelNav = (options.wordLevelNav !== undefined &&  options.wordLevelNav !== null) ? options.wordLevelNav : this._wordLevelNav;
				this._charDiff = (options.charDiff !== undefined &&  options.charDiff !== null) ? options.charDiff : this._charDiff;
				this._hasConflicts = (options.hasConflicts !== undefined &&  options.hasConflicts !== null) ? options.hasConflicts : this._hasConflicts;
				this._diffProvider = options.diffProvider ? options.diffProvider : this._diffProvider;
				this._complexURL = options.complexURL ?  options.complexURL : this._complexURL;
				
				this._baseFile.URL = options.baseFileURL ? options.baseFileURL : this._baseFile.URL;
				this._baseFile.Name = typeof(options.baseFileName) === "string" ? options.baseFileName : this._baseFile.Name;
				this._baseFile.Type = options.baseFileType ? options.baseFileType : this._baseFile.Type;
				this._baseFile.Content =  typeof(options.baseFileContent) === "string" ? options.baseFileContent : this._baseFile.Content;
				this._newFile.URL = options.newFileURL ? options.newFileURL : this._newFile.URL;
				this._newFile.Name = typeof(options.newFileName) === "string" ? options.newFileName : this._newFile.Name;
				this._newFile.Type = options.newFileType ? options.newFileType : this._newFile.Type;
				this._newFile.Content = typeof(options.newFileContent) === "string" ? options.newFileContent : this._newFile.Content;
				
				
				this._diffURL = options.diffURL ? options.diffURL : this._diffURL;
				this._diffContent = options.diffContent ? options.diffContent : this._diffContent;
				
				this._block = options.block ? options.block : this._block;
				this._change = options.change ? options.change : this._change;

				this._onSave = options.onSave ? options.onSave : this._onSave;
				this._callback = options.callback ? options.callback : this._callback;
				this._errorCallback = options.errorCallback ? options.errorCallback : this._errorCallback;
				this._onSetTitle = options.onSetTitle ? options.onSetTitle : this._onSetTitle;
			}
		},
		
		initCommands: function(){	
			var commandSpanId = this._commandSpanId;
			if(!commandSpanId && this.getDefaultCommandSpanId){
				commandSpanId = this.getDefaultCommandSpanId();
			}
			if(!commandSpanId){
				return;
			}
			var that = this;
			var copyToLeftCommand = new mCommands.Command({
				tooltip : "Copy current change from right to left",
				imageClass : "core-sprite-leftarrow",
				id: "orion.compare.copyToLeft",
				groupId: "orion.compareGroup",
				callback : function(data) {
					data.items.copyToLeft();
			}});
			var generateLinkCommand = new mCommands.Command({
				tooltip : "Generate link of the current diff",
				name: "Generate Link",
				imageClass : "core-sprite-link",
				id: "orion.compare.generateLink",
				groupId: "orion.compareGroup",
				visibleWhen: function(item) {
					return item._complexURL;
				},
				callback : function(data) {
					data.items.generateLink();
			}});
			var nextDiffCommand = new mCommands.Command({
				tooltip : "Next diff block",
				imageClass : "core-sprite-move_down",
				id: "orion.compare.nextDiff",
				groupId: "orion.compareGroup",
				callback : function(data) {
					data.items.nextDiff();
			}});
			var prevDiffCommand = new mCommands.Command({
				tooltip : "Previous diff block",
				imageClass : "core-sprite-move_up",
				id: "orion.compare.prevDiff",
				groupId: "orion.compareGroup",
				callback : function(data) {
					data.items.prevDiff();
			}});
			var nextChangeCommand = new mCommands.Command({
				tooltip : "Next diff change",
				imageClass : "core-sprite-move_down",
				id: "orion.compare.nextChange",
				groupId: "orion.compareGroup",
				callback : function(data) {
					data.items.nextChange();
			}});
			var prevChangeCommand = new mCommands.Command({
				tooltip : "Previous diff change",
				imageClass : "core-sprite-move_up",
				id: "orion.compare.prevChange",
				groupId: "orion.compareGroup",
				callback : function(data) {
					data.items.prevChange(data);
			}});
			this._commandService.addCommand(copyToLeftCommand);
			this._commandService.addCommand(generateLinkCommand);
			this._commandService.addCommand(nextDiffCommand);
			this._commandService.addCommand(prevDiffCommand);
			if(this._wordLevelNav){
				this._commandService.addCommand(nextChangeCommand);
				this._commandService.addCommand(prevChangeCommand);
			}
				
			// Register command contributions
			this._commandService.registerCommandContribution(commandSpanId, "orion.compare.generateLink", 100);
			if (!this._readonly) {
				this._commandService.registerCommandContribution(commandSpanId, "orion.compare.copyToLeft", 101);
			}
			this._commandService.registerCommandContribution(commandSpanId, "orion.compare.nextDiff", 102);
			this._commandService.registerCommandContribution(commandSpanId, "orion.compare.prevDiff", 103);
			if(this._wordLevelNav){
				this._commandService.registerCommandContribution(commandSpanId, "orion.compare.nextChange", 104);
				this._commandService.registerCommandContribution(commandSpanId, "orion.compare.prevChange", 105);
			}
		},
		
		renderCommands: function(){
			var commandSpanId = this._commandSpanId;
			if(!commandSpanId && this.getDefaultCommandSpanId){
				commandSpanId = this.getDefaultCommandSpanId();
			}
			if(!commandSpanId){
				return;
			}
			dojo.empty(commandSpanId);
			this._commandService.renderCommands(commandSpanId, commandSpanId, this, this, "button");
		},
		
		generateLink: function(){	
			var diffPos = this._diffNavigator.getCurrentPosition();
			var href = mCompareUtils.generateCompareHref(this._complexURL, {
				readonly: this._readonly,
				conflict: this._conflict,
				block: diffPos.block ? diffPos.block : 1, 
				change: diffPos.change ? diffPos.change : 0 
			});
			prompt("Copy the link URL:", href);
		},
		
		nextDiff: function(){	
			this._diffNavigator.nextDiff();
		},
		
		prevDiff: function(){	
			this._diffNavigator.prevDiff();
		},
		
		nextChange: function(){	
			this._diffNavigator.nextChange();
		},
		
		prevChange: function(){	
			this._diffNavigator.prevChange();
		},
		
		clearContent: function(){
			if(this._baseFile){
				this._baseFile.Content = null;
			}
			if(this._newFile){
				this._newFile.Content = null;
			}
		},
		
		_getLineDelim: function(input , diff){	
			var delim = "\n";
			return delim;
		},

		resolveComplexDiff: function(onsave) {
			if(!this._diffProvider){
				console.log("A diff provider is needed for Complex diff URL");
				return;
			}
			var that = this;
			that._diffProvider.provide(that._complexURL, onsave, that._hasConflicts, function(diffParam){
				that._baseFile.URL = (diffParam.baseFile && typeof(diffParam.baseFile.URL) === "string") ? diffParam.baseFile.URL : that._baseFile.URL;
				that._baseFile.Name = (diffParam.baseFile && typeof(diffParam.baseFile.Name) === "string") ? diffParam.baseFile.Name : that._baseFile.Name;
				that._baseFile.Type = (diffParam.baseFile && typeof(diffParam.baseFile.Type) === "object") ? diffParam.baseFile.Type : that._baseFile.Type;
				that._baseFile.Content = (diffParam.baseFile && typeof(diffParam.baseFile.Content) === "string") ? diffParam.baseFile.Content : that._baseFile.Content;
				
				that._newFile.URL = (diffParam.newFile && typeof(diffParam.newFile.URL) === "string") ? diffParam.newFile.URL : that._newFile.URL;
				that._newFile.Name = (diffParam.newFile && typeof(diffParam.newFile.Name) === "string") ? diffParam.newFile.Name : that._newFile.Name;
				that._newFile.Type = (diffParam.newFile && typeof(diffParam.newFile.Type) === "object") ? diffParam.newFile.Type : that._newFile.Type;
				that._newFile.Content = (diffParam.newFile && typeof(diffParam.newFile.Content) === "string") ? diffParam.newFile.Content : that._newFile.Content;
				
				that._diffContent = typeof(diffParam.diff) === "string" ? diffParam.diff : that._diffContent;
				if (onsave || typeof(that._baseFile.Content) === "string"){
					that.setEditor(onsave);
				} else {
					if(that._callback)
						that._callback(that._baseFile.Name, that._newFile.Name);
					that.getFileContent([that._baseFile/*, that._newFile*/], 0);
				}
			}, that._errorCallback);
		},
		
		resolveDiffByContents: function(onsave) {
			if (typeof(this._baseFile.Content) === "string" && typeof(this._newFile.Content) === "string"){
				if(!this._diffContent && !this._mapper){
					this._diffContent = "";//SomeDiffEngine.createPatch(this._baseFile.Name, this._baseFile.Content, this._newFile.Content, "", "") ;
				}
				this.setEditor(onsave);
				return true;
			} else {
				return false;
			}
		},
		
		getFileContent: function(files, currentIndex) {
			if(!this._fileClient){
				console.log("A file client is needed for getting file content");
				return;
			}
			var that = this;
			that._fileClient.read(files[currentIndex].URL).then(function(contents) {
				files[currentIndex].Content = contents;
				if(currentIndex < (files.length - 1)){
					that.getFileContent(files, currentIndex+1);
				} else {
					that.setEditor();
					if(that._onLoadContents){
						that._onLoadContents();
					}
				}
			}, function(error, ioArgs) {
				if (error.status === 404) {
					files[currentIndex].Content = "";
					if(currentIndex < (files.length - 1)){
						that.getFileContent(files, currentIndex+1);
					} else {
						that.setEditor();
						if(that._onLoadContents){
							that._onLoadContents();
						}
					}
				} else if (that.errorCallback) {
					that.errorCallback(error, ioArgs);
				}
			});
		},
		
		parseMapper: function(input, output, diff , detectConflicts ,doNotBuildNewFile){
			var delim = this._getLineDelim(input , diff);
			if(this._mapper){
				return {delim:delim , mapper:this._mapper, output: output, diffArray:output};
			}
			if(output){
				var adapter = new mJSDiffAdapter.JSDiffAdapter();
				var maps = adapter.adapt(input, output);
				return {delim:delim , mapper:maps.mapper, output: output, diffArray:maps.changContents};
			} else {
				this._diffParser.setLineDelim(delim);
				var result = this._diffParser.parse(input, diff, detectConflicts ,doNotBuildNewFile);
				var diffArray = this._diffParser.getDiffArray();
				return {delim:delim , mapper:result.mapper, output: result.outPutFile, diffArray:diffArray};
			}
		},
		
		startup: function(onsave, onLoadContents){
			this._onLoadContents = onLoadContents;
			if(this._complexURL){
				this.resolveComplexDiff(onsave);
			} else if(!this.resolveDiffByContents(onsave)){
				//resolve from mapper
			}
		}
	};
	return CompareContainer;
}());

exports.TwoWayCompareContainer = (function() {
	/**
	 * Constructs a new side by side compare container. 
	 */
	function TwoWayCompareContainer(serviceRegistry, uiFactory, options) {
		this._diffNavigator = new mDiffTreeNavigator.DiffTreeNavigator("word");
		this._registry = serviceRegistry;
		this._commandService = this._registry.getService("orion.page.command");
		this._fileClient = this._registry.getService("orion.core.file");
		this._uiFactory = uiFactory;
		this._viewLoadedCounter = 0;
		
		this.setOptions(options, true);
		
		var that = this;
		if(!this._callback){
			this._callback = function(baseFileName, newFileName) {
				if (that._uiFactory.getTitleDivId(true) && that._uiFactory.getTitleDivId(false)) {
					dojo.place(document.createTextNode(newFileName), that._uiFactory.getTitleDivId(true), "only");
					dojo.place(document.createTextNode(baseFileName), that._uiFactory.getTitleDivId(false), "only");
				}
			};
		}

		if(!this._errorCallback){
			this._errorCallback = function(errorResponse, ioArgs) {
				if (that._uiFactory.getTitleDivId(true) && that._uiFactory.getTitleDivId(false)) {
					var message = typeof (errorResponse.message) === "string" ? errorResponse.message : ioArgs.xhr.statusText;
					dojo.place(document.createTextNode(message), that._uiFactory.getTitleDivId(true), "only");
					dojo.place(document.createTextNode(message), that._uiFactory.getTitleDivId(false), "only");
					dojo.style(uiFactory.getTitleDivId(true), "color", "red");
					dojo.style(uiFactory.getTitleDivId(false), "color", "red");
				}
			};
		}
		
		this._leftEditorDivId = this._uiFactory.getEditorParentDivId(true);
		this._rightEditorDivId = this._uiFactory.getEditorParentDivId(false);
		
		this.initCommands();
		var that = this;
		this._inputManager = {
			filePath: "",
			getInput: function() {
				return this.filePath;
			},
			setDirty: function(dirty) {
				if (dirty) {
					if (this._lastTitle && this._lastTitle.charAt(0) !== '*') {
						this.setTitle('*'+ this._lastTitle);
					}
				} else {
					if (this._lastTitle && this._lastTitle.charAt(0) === '*') {
						this.setTitle(this._lastTitle.substring(1));
					}
				}
			},
			
			getFileMetadata: function() {
				return this._fileMetadata;
			},
			
			setInput: function(fileURI, editor) {
				if(this.onSetTitle){
					this.onSetTitle(fileURI,
							dojo.hitch(this, function(title) {
								this.setTitle(title);
							}),
							dojo.hitch(this, function(error) {
								console.error("Error loading file metadata: " + error.message);
								this.setTitle(fileURI);
							})
					);
				} else {
					that._fileClient.read(fileURI, true).then(
						dojo.hitch(this, function(metadata) {
							this._fileMetadata = metadata;
							this.setTitle(metadata.Location);
						}),
						dojo.hitch(this, function(error) {
							console.error("Error loading file metadata: " + error.message);
							this.setTitle(fileURI);
						})
					);
				}
				this.lastFilePath = fileURI;
			},
			
			setTitle : function(title) {
				var indexOfSlash = title.lastIndexOf("/");
				var shortTitle = title;
				if (indexOfSlash !== -1) {
					shortTitle = "Compare " + shortTitle.substring(indexOfSlash + 1);
					if (title.charAt(0) === '*') {
						shortTitle = '*' + shortTitle;
					}
				}
				this._lastTitle = shortTitle;
				window.document.title = shortTitle;
				var location = dojo.byId("location");
				if (location && this._fileMetadata) {
					dojo.empty(location);
					new mBreadcrumbs.BreadCrumbs({container: "location", resource: this._fileMetadata});
					if (title.charAt(0) === '*') {
						var dirty = dojo.create('b', null, location, "last");
						dirty.innerHTML = '*';
					}
				}
			},
			afterSave: function(){
				that.startup(true);
			}
		};
		
		if(this._onSave){
			this._inputManager.onSave = this._onSave;	
		}
		
		if(this._onSetTitle){
			this._inputManager.onSetTitle = this._onSetTitle;	
		}
		
		this._curveRuler = new mCompareRulers.CompareCurveRuler(document.getElementById(this._uiFactory.getDiffCanvasDivId()));
		this._highlighter = [];
		this._highlighter.push( new exports.CompareStyler(this._registry));//left side styler
		this._highlighter.push( new exports.CompareStyler(this._registry));//right side styler
		this.initEditorContainers("\n" , "fetching..." , "fetching..." , []);
	}
	TwoWayCompareContainer.prototype = new exports.CompareContainer();
	
	TwoWayCompareContainer.prototype.initEditorContainers = function(delim , leftContent , rightContent , mapper, createLineStyler){	
		this._leftEditor = this.createEditorContainer(leftContent , delim , mapper, 0 , this._leftEditorDivId , this._uiFactory.getStatusDivId(true) ,this._readonly ,createLineStyler , this._newFile);
		mGlobalCommands.generateDomCommandsInBanner(this._commandService, this._leftEditor , null, null, null, true);
		this._leftTextView = this._leftEditor.getTextView();
		this._rightEditor = this.createEditorContainer(rightContent , delim , mapper ,1 , this._rightEditorDivId , this._uiFactory.getStatusDivId(false) ,true, createLineStyler , this._baseFile);
		this._rightTextView = this._rightEditor.getTextView();
		var that = this;
		this._overviewRuler  = new mCompareRulers.CompareOverviewRuler("right", {styleClass: "ruler overview"} , null,
				                    function(lineIndex, ruler){that._diffNavigator.matchPositionFromOverview(lineIndex);});
		this._rightTextView.addRuler(this._overviewRuler);
		var that = this;
		window.onbeforeunload = function() {
			if (that._leftEditor.isDirty()) {
				return "There are unsaved changes.";
			}
		};
		
	};
	
	TwoWayCompareContainer.prototype.getDefaultCommandSpanId = function(){
		return this._uiFactory.getCommandSpanId();
	};
	
	TwoWayCompareContainer.prototype.gotoMatch = function(lineNumber, match, newMatch, defaultGap, onScroll, onLoad){	
		if(!this.onScroll){
			this.onScroll = onScroll;
		}
		if(!this.onLoad){
			this.onLoad = onLoad;
		}
		//var offsetRight = this._rightTextView.getModel().getLineStart(lineNumber) + match.startIndex;
		//this._rightEditor.moveSelection(offsetRight, offsetRight + (match.length ? match.length : defaultGap));
		var offsetLeft = this._leftTextView.getModel().getLineStart(lineNumber) + newMatch.startIndex;
		this._leftEditor.moveSelection(offsetLeft, offsetLeft/* + (newMatch.length ? newMatch.length : defaultGap)*/);
	};
	
	TwoWayCompareContainer.prototype.copyToLeft = function(){	
		this._curveRuler.copyToLeft();
	};
	
	TwoWayCompareContainer.prototype.createEditorContainer = function(content , delim , mapper , columnIndex , parentDivId , statusDivId ,readOnly , createLineStyler , fileObj){
		var editorContainerDomNode = dojo.byId(parentDivId);
		var editorContainer = dijit.byId(parentDivId);
		var that = this;
		
		var textModel = new mTextModel.TextModel(content , delim);
		var textViewFactory = function() {
			var view = new mTextView.TextView({
				parent: editorContainerDomNode,
				model: textModel,
				readonly: readOnly,
				tabSize: 4
			});
			that._viewLoadedCounter++;
			if(that._viewLoadedCounter === 2){				
				that._diffNavigator.matchPositionFromOverview(-1);
			}
			if(that.onLoad){
				that.onLoad();
			}
			dojo.connect(editorContainer, "resize", dojo.hitch(this, function (e){
				view.resize();
			}));
			return view;
		};
			
		var contentAssistFactory = {
			createContentAssistMode: function(editor) {
				var contentAssist = new mContentAssist.ContentAssist(editor.getTextView());
				var widget = new mContentAssist.ContentAssistWidget(contentAssist, "contentassist");
				return new mContentAssist.ContentAssistMode(contentAssist, widget);
			}
		};
			
		var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
			// Create keybindings for generic editing
			if(readOnly){//In readonly mode we need to somehow initialize the pageAction
				that._commandService.addCommandGroup("pageActions", "orion.editorActions.unlabeled", 200);
				return;
			}
			var commandGenerator = new mEditorCommands.EditorCommandFactory(that._registry, that._commandService,that._fileClient , that._inputManager, "pageActions");
			commandGenerator.generateEditorCommands(editor);
			var genericBindings = new mEditorFeatures.TextActions(editor, undoStack);
			keyModeStack.push(genericBindings);
				
			// create keybindings for source editing
			var codeBindings = new mEditorFeatures.SourceCodeActions(editor, undoStack, contentAssist);
			keyModeStack.push(codeBindings);
				
		};

		var dirtyIndicator = "";
		var status = "";
		var statusReporter = function(message, isError) {
			if(!statusDivId)
				return;
			if (isError) {
				status =  "ERROR: " + message;
			} else {
				status = message;
			}
			dojo.byId(statusDivId).innerHTML = dirtyIndicator +  status;
		};
		var undoStackFactory = readOnly ? new mEditorFeatures.UndoFactory() : new mEditorCommands.UndoCommandFactory(that._registry, that._commandService, "pageActions");
		var annotationFactory = new mEditorFeatures.AnnotationFactory();
		var editor = new mEditor.Editor({
			textViewFactory: textViewFactory,
			undoStackFactory: undoStackFactory,
			annotationFactory: annotationFactory,
			//lineNumberRulerFactory: new exports.LineNumberRulerFactory(),
			contentAssistFactory: contentAssistFactory,
			keyBindingFactory: keyBindingFactory, 
			statusReporter: statusReporter,
			domNode: editorContainerDomNode
		});
				
		editor.installTextView();
		editor.setOverviewRulerVisible(false);
		if(!readOnly){
			var inputManager = this._inputManager;
			editor.addEventListener("DirtyChanged", function(evt) {
				inputManager.setDirty(editor.isDirty());
			});
		}
			
		var textView = editor.getTextView();
		if(createLineStyler && fileObj && typeof(fileObj.Name) === "string"  && typeof(fileObj.Type) === "string"){
			editor.setInput(fileObj.Name);
			this._highlighter[columnIndex].highlight(fileObj.Name , fileObj.Type, editor);
		}
			
		textView.addRuler(new mCompareRulers.LineNumberCompareRuler(this._diffNavigator, 0, "left", {styleClass: "ruler lines"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"}));

		textView.addEventListener("Selection", function(evt) {
			if(evt.newValue){
				if(evt.newValue.start !== evt.newValue.end){
					return;
				}
			}
			if(that._diffNavigator.autoSelecting || !that._diffNavigator.editorWrapper[0].diffFeeder){
				return;
			}
			var caretPos = textView.getCaretOffset();
			that._diffNavigator.gotoDiff(caretPos, textView);
		}); 
		
		if(columnIndex === 0){
			textView.getModel().addEventListener("Changed", function(e) {
				that._curveRuler.onChanged(e);
			});
			textView.addEventListener("Scroll", function(scrollEvent) {
				if(that._curveRuler){
					that._curveRuler.matchPositionFrom(true);
					that._curveRuler.render();
				}
				if(that.onScroll){
					that.onScroll();
				}
			}); 
		} else {
			textView.addEventListener("Scroll", function(scrollEvent) {
				if(that._curveRuler){
					that._curveRuler.render();
				}
			}); 
		}
		return editor;
	};

	TwoWayCompareContainer.prototype.setEditor = function(onsave){	
		var input = this._baseFile.Content;
		var output = this._newFile.Content;
		var diff = this._diffContent;
		
		var result;
		if(output) {
			result = this.parseMapper(input , output, diff , this._hasConflicts, true);
		} else {
			result = this.parseMapper(input , output, diff , this._hasConflicts, onsave);
			output = result.output;
		}
		var that = this;
		if(!this._leftEditor){
			this.initEditorContainers(result.delim , output , input ,  result.mapper , true);
		} else if (onsave) {
			this._diffNavigator.initMapper(result.mapper);
			this._curveRuler.init(result.mapper ,this._leftEditor , this._rightEditor, this._diffNavigator);
			this.renderCommands();
			this._leftTextView.redrawRange();
			this._rightTextView.redrawRange();
		}else {
			var rFeeder = new mDiffTreeNavigator.TwoWayDiffBlockFeeder(this._rightTextView.getModel(), result.mapper, 1);
			var lFeeder = new mDiffTreeNavigator.TwoWayDiffBlockFeeder(this._leftTextView.getModel(), result.mapper, 0);
			this._diffNavigator.initAll(this._charDiff ? "char" : "word", this._rightEditor, this._leftEditor, rFeeder, lFeeder, this._overviewRuler, this._curveRuler);
			this._curveRuler.init(result.mapper ,this._leftEditor , this._rightEditor, this._diffNavigator);
			this._inputManager.filePath = this._newFile.URL;
			this._rightEditor.setInput(this._baseFile.Name, null, input);
			this._highlighter[1].highlight(this._baseFile.Name, this._baseFile.Type, this._rightTextView);
			this._rightEditor.highlightAnnotations();
			this._rightEditor.setAnnotationRulerVisible(false);
			this._leftEditor.setInput(this._newFile.Name, null, output);
			this._highlighter[0].highlight(this._newFile.Name, this._newFile.Type, this._leftTextView);
			this._leftEditor.highlightAnnotations();
			this._leftEditor.setAnnotationRulerVisible(false);
			this.renderCommands();
			if(!this._readonly)
				this._inputManager.setInput(this._newFile.URL , this._leftEditor);
		}
		this._diffNavigator.renderAnnotations();
		if(this._viewLoadedCounter > 1){
			this._diffNavigator.gotoBlock(this._block-1, this._change-1);
		}
	};
	return TwoWayCompareContainer;
}());

exports.InlineCompareContainer = (function() {
	function InlineCompareContainer(serviceRegistry, editorDivId, options ) {
		this._diffNavigator = new mDiffTreeNavigator.DiffTreeNavigator("word");
		this._registry = serviceRegistry;
		this._commandService = this._registry.getService("orion.page.command");
		this._fileClient = this._registry.getService("orion.core.file");
		this._statusService = this._registry.getService("orion.page.message");
		this.setOptions(options, true);
		this.setOptions({readonly: true});

		var that = this;
		if(!this._callback){
			this._callback = function(baseFileName, newFileName) {
				dojo.place(document.createTextNode(that._diffTitle), "fileNameInViewer", "only");
				dojo.style("fileNameInViewer", "color", "#6d6d6d");
				that._statusService.setProgressMessage("");
			};
		}
		
		if(!this._errorCallback){
			this._errorCallback = function(errorResponse, ioArgs) {
				var display = [];
				display.Severity = "Error";
				display.HTML = false;
				
				try{
					var resp = JSON.parse(errorResponse.responseText);
					display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
				}catch(Exception){
					display.Message =  typeof(errorResponse.message) === "string" ? errorResponse.message : ioArgs.xhr.statusText;
				}
				
				this._statusService.setProgressResult(display);
			};
		}
		
		this.initCommands();
		this._highlighter = [];
		this._highlighter.push( new exports.CompareStyler(this._registry));
		this._editorDivId = editorDivId;
		this.initEditorContainers("" , "\n" , [],[]);
		this.hasContent = false;
	}
	InlineCompareContainer.prototype = new exports.CompareContainer();
	
	InlineCompareContainer.prototype.addRulers = function(){
		if(this._textView && !this._hasRuler){
			this._textView.addRuler(this._rulerOrigin);
			this._textView.addRuler(this._rulerNew);
			this._textView.addRuler(this._overviewRuler);
			this._hasRuler = true;
		}
	};
	
	InlineCompareContainer.prototype.removeRulers = function(){
		if(this._textView && this._hasRuler){
			this._textView.removeRuler(this._rulerOrigin);
			this._textView.removeRuler(this._rulerNew);
			this._textView.removeRuler(this._overviewRuler);
			this._hasRuler = false;
		}
	};

	InlineCompareContainer.prototype.destroyEditor = function(){
		if(this._textView){
			this._diffNavigator.destroy();
			this._textView.setText("");
			this.removeRulers();
		}
		this.hasContent = false;
	};

	InlineCompareContainer.prototype.createEditorContainer = function(content , delim , mapper , diffArray ,createLineStyler , fileObj){
		var editorContainerDomNode = dojo.byId(this._editorDivId);
		var editorContainer = dijit.byId(this._editorDivId);
		var that = this;
		
		var model = new mTextModel.TextModel(content, delim);

		var textViewFactory = function() {
			var textView = new mTextView.TextView({
				parent: editorContainerDomNode,
				model: model,
				readonly: true,
				tabSize: 4
			});
			dojo.connect(editorContainer, "resize", dojo.hitch(this, function (e){
				textView.resize();
			}));
			return textView;
		};
			
		var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
				return;
		};

		var statusReporter = function(message, isError) {
			return;
		};
		var undoStackFactory =  new mEditorFeatures.UndoFactory();
		var annotationFactory = new mEditorFeatures.AnnotationFactory();
		var editor = new mEditor.Editor({
			textViewFactory: textViewFactory,
			undoStackFactory: undoStackFactory,
			annotationFactory: annotationFactory,
			keyBindingFactory: keyBindingFactory, 
			statusReporter: statusReporter,
			domNode: editorContainerDomNode
		});
				
		editor.installTextView();
		editor.setOverviewRulerVisible(false);
		editor.setAnnotationRulerVisible(false);
		if(createLineStyler && fileObj)
			editor.setInput(fileObj.Name);
			
		var textView = editor.getTextView();
			
		this._rulerOrigin = new mCompareRulers.LineNumberCompareRuler(this._diffNavigator, 1,"left", {styleClass: "ruler lines"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"});
		this._rulerNew = new mCompareRulers.LineNumberCompareRuler(this._diffNavigator, 0,"left", {styleClass: "ruler lines"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"});
		var that = this;
		this._overviewRuler  = new mCompareRulers.CompareOverviewRuler("right", {styleClass: "ruler overview"} , null,
                function(lineIndex, ruler){that._diffNavigator.matchPositionFromOverview(lineIndex);});
		
		textView.addEventListener("Selection", function(evt) {
			if(evt.newValue){
				if(evt.newValue.start !== evt.newValue.end){
					return;
				}
			}
			if(that._diffNavigator.autoSelecting || !that._diffNavigator.editorWrapper[0].diffFeeder){
				return;
			}
			var caretPos = textView.getCaretOffset();
			that._diffNavigator.gotoDiff(caretPos, textView);
		}); 
		
		return editor;
	};

	InlineCompareContainer.prototype.initEditorContainers = function(delim , content , mapper, createLineStyler){	
		this._editor = this.createEditorContainer(content , delim , mapper, createLineStyler , this._newFile);
		this._textView = this._editor.getTextView();
	};
	
	InlineCompareContainer.prototype._initDiffPosition = function(textView){
		var model = textView.getModel();
		if(model && model.getAnnotations){
			var annotations = model.getAnnotations();
			if(annotations.length > 0) {
				var lineIndex = annotations[0][0];
				var lineHeight = textView.getLineHeight();
				var clientArea = textView.getClientArea();
				var lines = Math.floor(clientArea.height / lineHeight/3);
				textView.setTopIndex((lineIndex - lines) > 0 ? lineIndex - lines : 0);
			}
		}
	};
	
	InlineCompareContainer.prototype.setDiffTitle =  function(title){
		this._diffTitle = title;
	};
	
	InlineCompareContainer.prototype.setEditor = function(){
		var input = this._baseFile.Content;
		var output = this._newFile.Content;
		var diff = this._diffContent;

		this.hasContent = true;
		var result = this.parseMapper(input, output, diff, this._hasConflicts, output);
		if(!output){
			output = result.output;
		}
		var that = this;
		if(!this._textView){
			this.initEditorContainers(result.delim , input ,  result.mapper , result.diffArray , true);
		}else {
			this._textView.getModel().setText(input);
			//Merge the text with diff 
			var rFeeder = new mDiffTreeNavigator.inlineDiffBlockFeeder(result.mapper, 1);
			var lFeeder = new mDiffTreeNavigator.inlineDiffBlockFeeder(result.mapper, 0);
			mCompareUtils.mergeDiffBlocks(this._textView.getModel(), lFeeder.getDiffBlocks(), result.mapper, result.diffArray.array, result.diffArray.index, this._diffParser._lineDelimiter);
			rFeeder.setModel(this._textView.getModel());
			lFeeder.setModel(this._textView.getModel());
			this._diffNavigator.initAll(this._charDiff ? "char" : "word", this._editor, this._editor, rFeeder, lFeeder, this._overviewRuler);
			this._highlighter[0].highlight(this._baseFile.Name, this._baseFile.Type, this._textView);
			this._editor.highlightAnnotations();
			this.renderCommands();
			this._diffNavigator.renderAnnotations();
			this.addRulers();
			var drawLine = this._textView.getTopIndex() ;
			this._textView.redrawLines(drawLine , drawLine+  1 , this._overviewRuler);
			this._textView.redrawLines(drawLine , drawLine+  1 , this._rulerOrigin);
			this._textView.redrawLines(drawLine , drawLine+  1 , this._rulerNew);
			this._diffNavigator.gotoBlock(this._block-1, this._change-1);
		}
	};
	
	InlineCompareContainer.prototype.setConflicting =  function(conflicting){	
		this._conflcit = conflicting;
	};
	
	return InlineCompareContainer;
}());

return exports;
});
