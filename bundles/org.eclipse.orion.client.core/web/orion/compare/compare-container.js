/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

define(['dojo', 'orion/compare/diff-parser', 'orion/compare/rulers', 'orion/compare/compare-model', 'orion/compare/compare-m-model', 'orion/editor/contentAssist',
        'orion/editorCommands','orion/editor/editor','orion/editor/editorFeatures','orion/globalCommands', 'orion/breadcrumbs', 'orion/compare/gap-model' , 'orion/commands',
        'orion/textview/textModel','orion/textview/textView','examples/textview/textStyler'], 
		function(dojo, mDiffParser, mRulers, mCompareModel, mCompareMergeModel, mContentAssist, mEditorCommands, mEditor, mEditorFeatures, mGlobalCommands, mBreadcrumbs,
				mGapModel , mCommands, mTextModel, mTextView, mTextStyler) {

var exports = {};

exports.CompareContainer = (function() {
	function CompareContainer (diffProvider) {
		this._diffParser = new mDiffParser.DiffParser();
		this._diff = null;
		this._input = null;
	}
	CompareContainer.prototype = {
		_getLineDelim: function(input , diff){	
			var delim = "\n";
			return delim;
		},
		
		setDiffProvider: function(diffProvider){
			this._diffProvider = diffProvider;
		},
		
		getFileDiff: function(diffURI , uiCallBack , errorCallBack  ,onsave){
			var self = this;
			this._diffProvider.getDiffContent(diffURI, 
										   function(jsonData, secondArg) {
											  if(self._conflict){
												  self._diff = jsonData.split("diff --git")[1];
											  }	else {
												  self._diff = jsonData;
											  }
											  if(onsave)
												  self.setEditor(this._input , self._diff ,onsave);
											  else
												  self.getFileURI(diffURI , uiCallBack , errorCallBack);
										   },
										   errorCallBack);
		},
		
		getFileURI: function(diffURI , uiCallBack , errorCallBack ){
			var self = this;
			this._diffProvider.getDiffFileURI(diffURI, 
										   function(jsonData, secondArg) {
											  self._oldFileURI = jsonData.Git.Old;
											  self._newFileURI = jsonData.Git.New;
											  self.getFileContent(jsonData.Git.Old , errorCallBack);
											  if(uiCallBack)
												  uiCallBack(jsonData.Git.New , jsonData.Git.Old);
										   },
										   errorCallBack);
		},
		
		getFileContent: function(fileURI , errorCallBack ){
			var self = this;
			self._registry.getService("orion.core.file").then(
					function(service) {
						service.read(fileURI).then( 
											  function(contents) {
												  this._input = contents;
												  self.setEditor(contents , self._diff );					  
											  },
											  function(error ,ioArgs) {
												  if(error.status === 404){
													  this._input = "";
													  self.setEditor("" , self._diff );	
												  } else if(errorCallBack){
													  errorCallBack(error ,ioArgs);
												  }
													  
											  });
					});
		},
		
		parseMapper: function(input , diff , detectConflicts ,doNotBuildNewFile){
			var delim = this._getLineDelim(input , diff);
			this._diffParser.setLineDelim(delim);
			var result = this._diffParser.parse(input ,diff, detectConflicts ,doNotBuildNewFile);
			var output = result.outPutFile;
			var mapper = result.mapper;
			var diffArray = this._diffParser.getDiffArray();
			return {delim:delim , mapper:result.mapper , output:result.outPutFile ,diffArray:diffArray};
		},
		
		resolveDiff: function(hash , callBack , errorCallBack , onsave){
			var diffURI = hash;
			var params = hash.split("?");
			if(params.length === 2){
				diffURI = params[0];
				var subParams = params[1].split("=");
				if(subParams.length === 2 && subParams[0] === "conflict" && subParams[1] === "true" )
					this._conflict = true;
			} 
			this._diffURI = diffURI;
			this.getFileDiff(diffURI , callBack , errorCallBack , onsave );
		},
				
		resolveDiffonSave: function(){
			this.getFileDiff(this._diffURI , null , null , true );
		},
				
		_initDiffPosition: function(textView){
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
		}
		
	};
	return CompareContainer;
}());

exports.SBSCompareContainer = (function() {
	/** @private */
	function SBSCompareContainer(resgistry ,leftEditorDivId , rightEditorDivId) {
		this._textViewLeft = null;
		this._textViewRight = null;
		this._registry = resgistry;
		this._leftEditorDivId = leftEditorDivId;
		this._rightEditorDivId = rightEditorDivId;
	}
	SBSCompareContainer.prototype = new exports.CompareContainer();
	SBSCompareContainer.prototype.setEditor = function(input , diff){	
		var result = this.parseMapper(input , diff);
		if(this._textViewLeft && this._textViewRight){
			if(result.delim === this._textViewLeft.getModel().getLineDelimiter() ){
				this._textViewLeft.getModel().init(result.mapper);
				this._textViewLeft.setText(result.output);
				this._textViewRight.getModel().init(result.mapper);
				this._textViewRight.setText(input);
				this._initDiffPosition(this._textViewLeft);
				return;
			}
		}
				
		var modelLeft = new mTextModel.TextModel(result.output, result.delim);
		var compareModelLeft = new mCompareModel.CompareTextModel(modelLeft, {mapper:result.mapper , columnIndex:0} , new mGapModel.GapLineFeeder( result.delim));
		var modelRight = new mTextModel.TextModel(input, result.delim);
		var compareModelRight = new mCompareModel.CompareTextModel(modelRight, {mapper:result.mapper , columnIndex:1} , new mGapModel.GapLineFeeder( result.delim));
		
		var optionsRight = {
			parent: this._rightEditorDivId,
			model: compareModelRight,
			readonly: true,
			stylesheet: "/orion/compare/editor.css" 
		};
		this._textViewRight = new mTextView.TextView(optionsRight);
		this._textViewRight.addRuler(new mRulers.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"}));
				
		var optionsLeft = {
			parent: this._leftEditorDivId,
			model: compareModelLeft,
			readonly: true,
			stylesheet: "/orion/compare/editor.css" 
		};
		this._textViewLeft = new mTextView.TextView(optionsLeft);
		this._textViewLeft.addRuler(new mRulers.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"}));
		
		var self = this;
		this._textViewLeft.addEventListener("LineStyle", window, function(lineStyleEvent) {
			var lineIndex = lineStyleEvent.lineIndex;
			var lineStart = lineStyleEvent.lineStart;
			var lineType =  self._editorLeft.getModel().getLineType(lineIndex);
			//lineStyleEvent.ranges = [];
			//lineStyleEvent.ranges.push ({start: lineStart, end: lineStart + 3, style: {style: {backgroundColor: "blue"} }});
			if(lineType === "added") {
				lineStyleEvent.style = {style: {backgroundColor: "#99EE99"}};
			} else if (lineType === "changed"){
				lineStyleEvent.style = {style: {backgroundColor: "#FFDD88"}};
			} else if (lineType === "removed" || lineType === "changed_gap"){
				lineStyleEvent.style = {style: {backgroundColor: "#DDDDDD"}};
			} 
		}); 

		this._textViewLeft.addEventListener("Scroll", window, function(scrollEvent) {
			self._editorRight.setTopPixel(self._editorLeft.getTopPixel());
		}); 
				
		this._textViewLeft.redrawRange();
		
		this._textViewRight.addEventListener("LineStyle", window, function(lineStyleEvent) {
			var lineIndex = lineStyleEvent.lineIndex;
			var lineStart = lineStyleEvent.lineStart;
			var lineType =  self._editorRight.getModel().getLineType(lineIndex);
			if(lineType === "removed") {
				lineStyleEvent.style = {style: {backgroundColor: "#EE9999"}};
			} else if (lineType === "changed"){
				lineStyleEvent.style = {style: {backgroundColor: "#FFDD88"}};
			} else if (lineType === "added" || lineType === "changed_gap"){
				lineStyleEvent.style = {style: {backgroundColor: "#DDDDDD"}};
			} 
		}); 

		this._textViewRight.addEventListener("Scroll", window, function(scrollEvent) {
			self._editorLeft.setTopPixel(self._editorRight.getTopPixel());
		}); 
				
		var overview  = new exports.CompareOverviewRuler("right", {styleClass: "ruler_overview"});
		this._textViewRight.addRuler(overview);
				
		this._initDiffPosition(this._textViewLeft);
		this._textViewRight.redrawRange();
	};
	return SBSCompareContainer;
}());

//temporary text ssyntax styler , we will need to change it later to some thing else
exports.CompareSyntaxHighlighter = (function() {
	function CompareSyntaxHighlighter(){
		this.styler = null;
	}	
	CompareSyntaxHighlighter.prototype = {
			highlight: function(fileName, editorWidget) {
				if (this.styler) {
					this.styler.destroy();
					this.styler = null;
				}
				if (fileName) {
					var splits = fileName.split(".");
					if (splits.length > 0) {
						var extension = splits.pop().toLowerCase();
						switch(extension) {
							case "js":
								this.styler = new mTextStyler.TextStyler(editorWidget, "js");
								break;
							case "java":
								this.styler = new mTextStyler.TextStyler(editorWidget, "java");
								break;
							case "html":
								//TODO
								break;
							case "xml":
								//TODO
								break;
							case "css":
								this.styler = new mTextStyler.TextStyler(editorWidget, "css");
								break;
						}
					}
				}
			}
	};
	return CompareSyntaxHighlighter;
}());

//Diff block styler , this will always be called after the text styler
exports.DiffStyler = (function() {
	function DiffStyler(compareMatchRenderer, textView){
		this._compareMatchRenderer = compareMatchRenderer;
		this._textView = textView;
	}	
	DiffStyler.prototype = {
		highlight: function(textView) {
			if (this._textView) {
				this._textView.removeEventListener("LineStyle", this, this._onLineStyle);
			}
			if(textView)
				this._textView = textView;
			if(this._textView && !this._textView.getModel().isMapperEmpty())
				this._textView.addEventListener("LineStyle", this, this._onLineStyle);
		},
		
		_onLineStyle: function(lineStyleEvent){
			var textView = this._textView;
			var lineIndex = lineStyleEvent.lineIndex;
			var lineTypeWrapper =  textView.getModel().getLineType(lineIndex);
			var lineType = lineTypeWrapper.type;
			var annotationIndex = textView.getModel().getAnnotationIndexByMapper(lineTypeWrapper.mapperIndex);
			var conflict = textView.getModel().isMapperConflict(lineTypeWrapper.mapperIndex);
			//https://bugs.eclipse.org/bugs/show_bug.cgi?id=349227 : we were using border style as the line below.Changing to back ground color and image.
			//lineStyleEvent.style = {style: {backgroundColor: "#EEEEEE" , borderTop: "1px #AAAAAA solid" , borderLeft: borderStyle , borderRight: borderStyle}};
			var backgroundColor = conflict ? "#EEB4B4" : "#DDDDDD";
			var backgroundImg = "url('/images/compare/diff-border.png')";
			
			if(annotationIndex === this._compareMatchRenderer.getCurrentAnnotationIndex()){
				backgroundColor = conflict ? "#F08080" : "#BBBBBB";
				backgroundImg = "url('/images/compare/diff-border-sel.png')";
			}
			if(lineType === "top-only") {
				lineStyleEvent.style = {style: {backgroundImage: backgroundImg, backgroundRepeat:"repeat-x"}};
			} else if (lineType !== "unchanged"){
				lineStyleEvent.style = {style: {backgroundColor: backgroundColor }};
			}
		}
	};
	return DiffStyler;
}());

//the wrapper to order the text and diff styler so that we can always have diff highlighted on top of text syntax
exports.CompareMergeStyler = (function() {
	function CompareMergeStyler(compareMatchRenderer){
		this._syntaxHighlither = new exports.CompareSyntaxHighlighter();
		this._diffHighlither = new exports.DiffStyler(compareMatchRenderer);
	}	
	CompareMergeStyler.prototype = {
		highlight: function(fileName, editorWidget) {
			this._syntaxHighlither.highlight(fileName, editorWidget);
			this._diffHighlither.highlight(editorWidget);
		}
	};
	return CompareMergeStyler;
}());

exports.CompareMergeContainer = (function() {
	/** @private */
	function CompareMergeContainer(readonly , diffProvider , resgistry , commandService , fileClient,uiFactory) {
		this.setDiffProvider(diffProvider);
		this._uiFactory = uiFactory;
		this.readonly = readonly;
		this._registry = resgistry;
		this._commandService = commandService;
		this._leftEditorDivId = this._uiFactory.getEditorParentDivId(true);
		this._fileClient = fileClient;
		this._rightEditorDivId = this._uiFactory.getEditorParentDivId(false);
		this.initCommands();
		var self = this;
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
			setInput: function(fileURI, editor) {
				fileClient.read(fileURI, true).then(
					dojo.hitch(this, function(metadata) {
						this._fileMetadata = metadata;
						this.setTitle(metadata.Location);
					}),
					dojo.hitch(this, function(error) {
						console.error("Error loading file metadata: " + error.message);
						this.setTitle(fileURI);
					})
				);
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
				if (location) {
					dojo.empty(location);
					new mBreadcrumbs.BreadCrumbs({container: "location", resource: this._fileMetadata});
					if (title.charAt(0) === '*') {
						var dirty = dojo.create('b', null, location, "last");
						dirty.innerHTML = '*';
					}
				}
			},
			afterSave: function(){
				self.resolveDiffonSave();
			}
		};
		this._compareMatchRenderer = new mRulers.CompareMatchRenderer(document.getElementById(this._uiFactory.getDiffCanvasDivId()));
		this._highlighter = [];
		this._highlighter.push( new exports.CompareMergeStyler(this._compareMatchRenderer));//left side styler
		this._highlighter.push( new exports.CompareMergeStyler(this._compareMatchRenderer));//right side styler
		this.initEditorContainers("\n" , "fetching..." , "fetching..." , []);
	}
	CompareMergeContainer.prototype = new exports.CompareContainer();
	CompareMergeContainer.prototype.initEditorContainers = function(delim , leftContent , rightContent , mapper, createLineStyler , fileURILeft , fileURIRight){	
		this._editorLeft = this.createEditorContainer(leftContent , delim , mapper, 0 , this._leftEditorDivId , this._uiFactory.getStatusDivId(true) ,this.readonly ,createLineStyler , fileURILeft);
		mGlobalCommands.generateDomCommandsInBanner(this._commandService, this._editorLeft , "pageActions",true);
		this._textViewLeft = this._editorLeft.getTextView();
		this._editorRight = this.createEditorContainer(rightContent , delim , mapper ,1 , this._rightEditorDivId , this._uiFactory.getStatusDivId(false) ,true, createLineStyler , fileURIRight);
		this._textViewRight = this._editorRight.getTextView();
		var overview  = new mRulers.CompareMergeOverviewRuler(this._compareMatchRenderer ,"right", {styleClass: "ruler_overview"});
		this._textViewRight.addRuler(overview);
		this._compareMatchRenderer.setOverviewRuler(overview);
		var self = this;
		window.onbeforeunload = function() {
			if (self._editorLeft.isDirty()) {
				return "There are unsaved changes.";
			}
		};
		
	};
	
	CompareMergeContainer.prototype.initCommands = function(){	
		var self = this;
		var nextDiffCommand = new mCommands.Command({
			name : "Next Diff",
			image : "/images/compare/next-diff.gif",
			id: "orion.compare.nextDiff",
			groupId: "orion.compareGroup",
			callback : function() {
				self.nextDiff();
		}});
		var prevDiffCommand = new mCommands.Command({
			name : "Previous Diff",
			image : "/images/compare/prev-diff.gif",
			id: "orion.compare.prevDiff",
			groupId: "orion.compareGroup",
			callback : function() {
				self.prevDiff();
		}});
		var copyToLeftCommand = new mCommands.Command({
			name : "Copy Current Change From Right to left",
			image : "/images/compare/copy-to-left.gif",
			id: "orion.compare.copyToLeft",
			groupId: "orion.compareGroup",
			callback : function() {
				self.copyToLeft();;
			}});
		this._commandService.addCommand(prevDiffCommand, "dom");
		this._commandService.addCommand(nextDiffCommand, "dom");
		this._commandService.addCommand(copyToLeftCommand, "dom");
			
		// Register command contributions
		this._commandService.registerCommandContribution("orion.compare.prevDiff", 3, "pageActions");
		this._commandService.registerCommandContribution("orion.compare.nextDiff", 2, "pageActions");
		if(!this.readonly)
			this._commandService.registerCommandContribution("orion.compare.copyToLeft", 1, "pageActions");
	};
	
	CompareMergeContainer.prototype.nextDiff = function(){	
		this._compareMatchRenderer.nextDiff();
	};
	
	CompareMergeContainer.prototype.prevDiff = function(){	
		this._compareMatchRenderer.prevDiff();
	};
	
	CompareMergeContainer.prototype.copyToLeft = function(){	
		this._compareMatchRenderer.copyToLeft();
	};
	
	CompareMergeContainer.prototype.createEditorContainer = function(content , delim , mapper , columnIndex , parentDivId , statusDivId ,readOnly , createLineStyler , fileURI){
		var editorContainerDomNode = dojo.byId(parentDivId);
		var self = this;
		
		var model = new mTextModel.TextModel(content , delim);
		var compareModel = new mCompareMergeModel.CompareMergeModel(model, {mapper:mapper, columnIndex:columnIndex } );
		var textViewFactory = function() {
			return new mTextView.TextView({
				parent: editorContainerDomNode,
				model: compareModel,
				readonly: readOnly,
				stylesheet: "/orion/compare/editor.css" ,
				tabSize: 4
			});
		};
			
		var contentAssistFactory = function(editor) {
			return new mContentAssist.ContentAssist(editor, "contentassist");
		};
			
		var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
			// Create keybindings for generic editing
			if(readOnly)
				return;
			
			var commandGenerator = new mEditorCommands.EditorCommandFactory(self._registry, self._commandService,self._fileClient , self._inputManager, "pageActions");
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
		var undoStackFactory = readOnly ? new mEditorFeatures.UndoFactory() : new mEditorCommands.UndoCommandFactory(self._registry, self._commandService, "pageActions");
		var editor = new mEditor.Editor({
			textViewFactory: textViewFactory,
			undoStackFactory: undoStackFactory,
			//annotationFactory: annotationFactory,
			//lineNumberRulerFactory: new exports.LineNumberRulerFactory(),
			contentAssistFactory: contentAssistFactory,
			keyBindingFactory: keyBindingFactory, 
			statusReporter: statusReporter,
			domNode: editorContainerDomNode
		});
				
		editor.installTextView();
		if(!readOnly){
			inputManager = this._inputManager;
			dojo.connect(editor, "onDirtyChange", inputManager, inputManager.setDirty);
		}
			
		var textView = editor.getTextView();
		if(createLineStyler && fileURI){
			var fileName = fileURI.split("?")[0];
			editor.onInputChange(fileName);
			this._highlighter[columnIndex].highlight(fileName , editor);
		}
			
		textView.addRuler(new mRulers.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"}));

		if(columnIndex === 0){
			textView.getModel().addListener(self._compareMatchRenderer);
			textView.addEventListener("Scroll", window, function(scrollEvent) {
				if(self._compareMatchRenderer){
					self._compareMatchRenderer.matchPositionFrom(true);
					self._compareMatchRenderer.render();
				}
			}); 
		} else {
			textView.addEventListener("Scroll", window, function(scrollEvent) {
				if(self._compareMatchRenderer){
					self._compareMatchRenderer.render();
				}
			}); 
		}
		return editor;
	};

	CompareMergeContainer.prototype.setEditor = function(input , diff, onsave){	
		var result = this.parseMapper(input , diff , this._conflict, onsave);
		var self = this;
		if(!this._editorLeft){
			this.initEditorContainers(result.delim , result.output , input ,  result.mapper , true , this._newFileURI , this._oldFileURI);
		} else if (onsave) {
			this._textViewLeft.getModel().init(result.mapper);
			this._textViewRight.getModel().init(result.mapper);
			this._textViewLeft.redrawRange();
			this._textViewRight.redrawRange();
		}else {
			this._inputManager.filePath = this._newFileURI;
			this._textViewLeft.getModel().init(result.mapper);
			this._textViewRight.getModel().init(result.mapper);
			
			var fileNameR = this._oldFileURI.split("?")[0];
			this._editorRight.onInputChange(fileNameR, null, input);
			this._highlighter[1].highlight(fileNameR , this._textViewRight);
			
			var fileNameL = this._newFileURI.split("?")[0];
			this._editorLeft.onInputChange(fileNameL, null, result.output);
			this._highlighter[0].highlight(fileNameL , this._textViewLeft);
			if(!this.readonly)
				this._inputManager.setInput(fileNameL , this._editorLeft);
		}
		this._compareMatchRenderer.init(result.mapper ,this._textViewLeft , this._textViewRight);
		this._compareMatchRenderer.matchPositionFromAnnotation(-1);
	};
	return CompareMergeContainer;
}());

exports.InlineCompareContainer = (function() {
	/** @private */
	function InlineCompareContainer(diffProvider ,resgistry , editorDivId ) {
		this.setDiffProvider(diffProvider);
		this._registry = resgistry;
		this._editorDivId = editorDivId;
		this.initEditorContainers("" , "\n" , [],[]);
	}
	InlineCompareContainer.prototype = new exports.CompareContainer();
	
	InlineCompareContainer.prototype.addRulers = function(){
		if(this._textView && !this._hasRuler){
			this._textView.addRuler(this._rulerOrigin);
			this._textView.addRuler(this._rulerNew);
			this._textView.addRuler(this._overview);
			this._hasRuler = true;
		}
	};
	
	InlineCompareContainer.prototype.removeRulers = function(){
		if(this._textView && this._hasRuler){
			this._textView.removeRuler(this._rulerOrigin);
			this._textView.removeRuler(this._rulerNew);
			this._textView.removeRuler(this._overview);
			this._hasRuler = false;
		}
	};

	InlineCompareContainer.prototype.destroyEditor = function(){
		if(this._textView){
			this._textView.getModel().init([],[]);
			this._textView.setText("");
			this.removeRulers();
		}
	};

	InlineCompareContainer.prototype.createEditorContainer = function(content , delim , mapper , diffArray ,createLineStyler , fileURI){
		var editorContainerDomNode = dojo.byId(this._editorDivId);
		var self = this;
		
		var model = new mTextModel.TextModel(content, delim);
		var compareModel = new mCompareModel.CompareTextModel(model, {mapper:mapper , columnIndex:0} , new mCompareModel.DiffLineFeeder(diffArray ,delim));

		var textViewFactory = function() {
			return new mTextView.TextView({
				parent: editorContainerDomNode,
				model: compareModel,
				readonly: true,
				stylesheet: "/orion/compare/editor.css" ,
				tabSize: 4
			});
		};
			
		var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
				return;
		};

		var statusReporter = function(message, isError) {
			return;
		};
		var undoStackFactory =  new mEditorFeatures.UndoFactory();
		var editor = new mEditor.Editor({
			textViewFactory: textViewFactory,
			undoStackFactory: undoStackFactory,
			//annotationFactory: annotationFactory,
			//lineNumberRulerFactory: new exports.LineNumberRulerFactory(),
			//contentAssistFactory: contentAssistFactory,
			keyBindingFactory: keyBindingFactory, 
			statusReporter: statusReporter,
			domNode: editorContainerDomNode
		});
				
		editor.installTextView();
		if(createLineStyler && fileURI)
			editor.onInputChange(fileURI.split("?")[0]);
			
		var textView = editor.getTextView();
			
		this._rulerOrigin = new mRulers.LineNumberCompareRuler(1,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"});
		this._rulerNew = new mRulers.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"});
		this._overview  = new mRulers.CompareOverviewRuler("right", {styleClass: "ruler_overview"});
		textView.addEventListener("LineStyle", this, this._onLineStyle);
		return editor;
	};

	InlineCompareContainer.prototype.initEditorContainers = function(delim , content , mapper, createLineStyler , fileURI){	
		this._editor = this.createEditorContainer(content , delim , mapper, createLineStyler , fileURI);
		this._textView = this._editor.getTextView();
	};
	
	InlineCompareContainer.prototype._onLineStyle = function(lineStyleEvent){
		var lineIndex = lineStyleEvent.lineIndex;
		var lineStart = lineStyleEvent.lineStart;
		var lineType = this._textView.getModel().getLineType(lineIndex);
		if(lineType === "added") {
			lineStyleEvent.style = {style: {backgroundColor: "#99EE99"}};
		} else if (lineType === "removed"){
			lineStyleEvent.style = {style: {backgroundColor: "#EE9999"}};
		} 
	};
	
	InlineCompareContainer.prototype.setEditor = function(input , diff){
		var result = this.parseMapper(input , diff , false , true);
		var self = this;
		if(!this._textView){
			this.initEditorContainers(result.delim , input ,  result.mapper , result.diffArray , true , this._newFileURI);
		}else {
			this.addRulers();
			this._textView.getModel().init([],[]);
			this._textView.setText("");
			
			this._textView.getModel().init(result.mapper , result.diffArray);
			this._textView.setText(input);
		}
		this._initDiffPosition(this._textView);
	};
	return InlineCompareContainer;
}());

return exports;
});