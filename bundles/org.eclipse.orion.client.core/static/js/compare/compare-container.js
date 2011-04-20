/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
var orion = orion || {};

orion.CompareContainer = (function() {
	function CompareContainer () {
		this._diffParser = new orion.DiffParser();
		this._diff = null;
		this._input = null;
	}
	CompareContainer.prototype = {
		_getLineDelim: function(input , diff){	
			var delim = "\n";
			return delim;
		},
		
		getFileDiffGit: function(diffURI , uiCallBack , errorCallBack  ,onsave){
			var self = this;
			self._registry.getService("IGitService").then(
				function(service) {
					service.getDiffContent(diffURI, 
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
				});
		},
		
		getFileURI: function(diffURI , uiCallBack , errorCallBack ){
			var self = this;
			self._registry.getService("IGitService").then(
				function(service) {
					service.getDiffFileURI(diffURI, 
										   function(jsonData, secondArg) {
											  self._oldFileURI = jsonData.Git.Old;
											  self._newFileURI = jsonData.Git.New;
											  self.getFileContent(jsonData.Git.Old , errorCallBack);
											  if(uiCallBack)
												  uiCallBack(jsonData.Git.New , jsonData.Git.Old);
										   },
										   errorCallBack);
				});
		},
		
		getFileContent: function(fileURI , errorCallBack ){
			var self = this;
			self._registry.getService("IFileService").then(
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
		
		parseMapper: function(input , diff , doNotBuildNewFile){
			var delim = this._getLineDelim(input , diff);
			this._diffParser.setLineDelim(delim);
			var result = this._diffParser.parse(input ,diff, doNotBuildNewFile);
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
			this.getFileDiffGit(diffURI , callBack , errorCallBack , onsave );
		},
				
		resolveDiffonSave: function(){
			this.getFileDiffGit(this._diffURI , null , null , true );
		},
				
		_initDiffPosition: function(editor){
			var model = editor.getModel();
			if(model && model.getAnnotations){
				var annotations = model.getAnnotations();
				if(annotations.length > 0) {
					var lineIndex = annotations[0][0];
					var lineHeight = editor.getLineHeight();
					var clientArea = editor.getClientArea();
					var lines = Math.floor(clientArea.height / lineHeight/3);
					editor.setTopIndex((lineIndex - lines) > 0 ? lineIndex - lines : 0);
				}
			}
		}
		
	};
	return CompareContainer;
}());

orion.SBSCompareContainer = (function() {
	/** @private */
	function SBSCompareContainer(resgistry ,leftEditorDivId , rightEditorDivId) {
		this._editorLeft = null;
		this._editorRight = null;
		this._registry = resgistry;
		this._leftEditorDivId = leftEditorDivId;
		this._rightEditorDivId = rightEditorDivId;
	}
	SBSCompareContainer.prototype = new orion.CompareContainer();
	SBSCompareContainer.prototype.setEditor = function(input , diff){	
		var result = this.parseMapper(input , diff);
		if(this._editorLeft && this._editorRight){
			if(result.delim === this._editorLeft.getModel().getLineDelimiter() ){
				this._editorLeft.getModel().init(result.mapper);
				this._editorLeft.setText(result.output);
				this._editorRight.getModel().init(result.mapper);
				this._editorRight.setText(input);
				this._initDiffPosition(this._editorLeft);
				return;
			}
		}
				
		var modelLeft = new eclipse.TextModel(result.output, result.delim);
		var compareModelLeft = new orion.CompareTextModel(modelLeft, {mapper:result.mapper , columnIndex:0} , new orion.GapLineFeeder( result.delim));
		var modelRight = new eclipse.TextModel(input, result.delim);
		var compareModelRight = new orion.CompareTextModel(modelRight, {mapper:result.mapper , columnIndex:1} , new orion.GapLineFeeder( result.delim));
		
		var optionsRight = {
			parent: this._rightEditorDivId,
			model: compareModelRight,
			readonly: true,
			stylesheet: "/js/compare/editor.css" 
		};
		this._editorRight = new eclipse.Editor(optionsRight);
		this._editorRight.addRuler(new orion.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"}));
				
		var optionsLeft = {
			parent: this._leftEditorDivId,
			model: compareModelLeft,
			readonly: true,
			stylesheet: "/js/compare/editor.css" 
		};
		this._editorLeft = new eclipse.Editor(optionsLeft);
		this._editorLeft.addRuler(new orion.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"}));
		
		var self = this;
		this._editorLeft.addEventListener("LineStyle", window, function(lineStyleEvent) {
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

		this._editorLeft.addEventListener("Scroll", window, function(scrollEvent) {
			self._editorRight.setTopPixel(self._editorLeft.getTopPixel());
		}); 
				
		this._editorLeft.redrawRange();
		
		this._editorRight.addEventListener("LineStyle", window, function(lineStyleEvent) {
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

		this._editorRight.addEventListener("Scroll", window, function(scrollEvent) {
			self._editorLeft.setTopPixel(self._editorRight.getTopPixel());
		}); 
				
		var overview  = new orion.CompareOverviewRuler("right", {styleClass: "ruler_overview"});
		this._editorRight.addRuler(overview);
				
		this._initDiffPosition(this._editorLeft);
		this._editorRight.redrawRange();
	};
	return SBSCompareContainer;
}());

orion.CompareMergeContainer = (function() {
	/** @private */
	function CompareMergeContainer(readonly , resgistry , commandService , fileClient,leftEditorDivId , rightEditorDivId , canvas) {
		this.readonly = readonly;
		this._registry = resgistry;
		this._commandService = commandService;
		this._leftEditorDivId = leftEditorDivId;
		this._fileClient = fileClient;
		this._rightEditorDivId = rightEditorDivId;
		var self = this;
		this._inputManager = {
			filePath: "",
			getInput: function() {
				return this.filePath;
			},
			afterSave: function(){
				self.resolveDiffonSave();
			}
		};
		
		this._compareMatchRenderer = new orion.CompareMatchRenderer(canvas);
		this.initEditorContainers("\n" , "fetching..." , "fetching..." , []);
	}
	CompareMergeContainer.prototype = new orion.CompareContainer();
	CompareMergeContainer.prototype.initEditorContainers = function(delim , leftContent , rightContent , mapper, createLineStyler , fileURILeft , fileURIRight){	
		this._editorContainerLeft = this.createEditorContainer(leftContent , delim , mapper, 0 , this._leftEditorDivId , "left-viewer-status" ,this.readonly ,createLineStyler , fileURILeft);
		this._editorLeft = this._editorContainerLeft.getEditorWidget();
		this._editorContainerRight = this.createEditorContainer(rightContent , delim , mapper ,1 , this._rightEditorDivId , "right-viewer-status" ,true, createLineStyler , fileURIRight);
		this._editorRight = this._editorContainerRight.getEditorWidget();
		var overview  = new orion.CompareMergeOverviewRuler(this._compareMatchRenderer ,"right", {styleClass: "ruler_overview"});
		this._editorRight.addRuler(overview);
		this._compareMatchRenderer.setOverviewRuler(overview);
		var self = this;
		window.onbeforeunload = function() {
			if (self._editorContainerLeft.isDirty()) {
				return "There are unsaved changes.";
			}
		};
		
	};
	
	CompareMergeContainer.prototype.setStyle = function(lineStyleEvent , editor){	
		var lineIndex = lineStyleEvent.lineIndex;
		var lineTypeWrapper =  editor.getModel().getLineType(lineIndex);
		var lineType = lineTypeWrapper.type;
		var annotationIndex = editor.getModel().getAnnotationIndexByMapper(lineTypeWrapper.mapperIndex);
		var borderStyle = "1px #AAAAAA solid";
		if(annotationIndex === this._compareMatchRenderer.getCurrentAnnotationIndex())
			borderStyle = "1px #000000 solid";
		if(lineType === "top-only") {
			lineStyleEvent.style = {style: { borderTop: borderStyle }};
		} else if (lineType === "oneline"){
			lineStyleEvent.style = {style: {backgroundColor: "#EEEEEE" , border: borderStyle }};
		} else if (lineType === "top"){
			lineStyleEvent.style = {style: {backgroundColor: "#EEEEEE" , borderTop: borderStyle , borderLeft: borderStyle , borderRight: borderStyle}};
		} else if (lineType === "bottom"){
			lineStyleEvent.style = {style: {backgroundColor: "#EEEEEE" , borderBottom: borderStyle , borderLeft: borderStyle , borderRight: borderStyle}};
		} else if (lineType === "middle"){
			lineStyleEvent.style = {style: {backgroundColor: "#EEEEEE" , borderLeft: borderStyle , borderRight: borderStyle}};
		} 
	};
	
	CompareMergeContainer.prototype.nextDiff = function(){	
		this._compareMatchRenderer.nextDiff();
	};
	
	CompareMergeContainer.prototype.copyToLeft = function(){	
		this._compareMatchRenderer.copyToLeft();
	};
	
	CompareMergeContainer.prototype.createEditorContainer = function(content , delim , mapper , columnIndex , parentDivId , tiltleDivId ,readOnly , createLineStyler , fileURI){
		var editorContainerDomNode = dojo.byId(parentDivId);
		var self = this;
		
		var model = new eclipse.TextModel(content , delim);
		var compareModel = new orion.CompareMergeModel(model, {mapper:mapper, columnIndex:columnIndex } );
		var editorFactory = function() {
			return new eclipse.Editor({
				parent: editorContainerDomNode,
				model: compareModel,
				readonly: readOnly,
				stylesheet: "/js/compare/editor.css" ,
				tabSize: 4
			});
		};
			
		var contentAssistFactory = function(editor) {
			return new eclipse.ContentAssist(editor, "contentassist");
		};
			
		var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
			// Create keybindings for generic editing
			if(readOnly)
				return;
			
			var commandGenerator = new orion.EditorCommandFactory(self._registry, self._commandService,self._fileClient , self._inputManager, "pageActionsLeft");
			commandGenerator.generateEditorCommands(editor);
			var genericBindings = new orion.TextActions(editor, undoStack);
			keyModeStack.push(genericBindings);
				
			// create keybindings for source editing
			var codeBindings = new orion.SourceCodeActions(editor, undoStack, contentAssist);
			keyModeStack.push(codeBindings);
				
			// save binding
			editor.getEditorWidget().setKeyBinding(new eclipse.KeyBinding("s", true), "save");
			editor.getEditorWidget().setAction("save", function(){
				editor.onInputChange(null, null, null, true);
				var text = editor.getEditorWidget().getText();
				var problems = [];
				for (var i=0; i<text.length; i++) {
					if (text.charAt(i) === 'z') {
						var line = editor.getEditorWidget().getModel().getLineAtOffset(i) + 1;
						var character = i - editor.getEditorWidget().getModel().getLineStart(line);
						problems.push({character: character, line: line, reason: "I don't like the letter 'z'"});
					}
				}
				annotationFactory.showProblems(problems);
				return true;
			});
		};

		var dirtyIndicator = "";
		var status = "";
		var statusReporter = function(message, isError) {
			if (isError) {
				status =  "ERROR: " + message;
			} else {
				status = message;
			}
			dojo.byId(tiltleDivId).innerHTML = dirtyIndicator +  status;
		};
		var undoStackFactory = readOnly ? new orion.UndoFactory() : new orion.UndoCommandFactory(self._registry, self._commandService, "pageActionsLeft");
		var editorContainer = new orion.EditorContainer({
			editorFactory: editorFactory,
			undoStackFactory: undoStackFactory,
			//annotationFactory: annotationFactory,
			//lineNumberRulerFactory: new orion.LineNumberRulerFactory(),
			contentAssistFactory: contentAssistFactory,
			keyBindingFactory: keyBindingFactory, 
			statusReporter: statusReporter,
			domNode: editorContainerDomNode
		});
				
		editorContainer.installEditor();
		if(!readOnly){
			eclipse.globalCommandUtils.generateDomCommandsInBanner(this._commandService, editorContainer , "pageActionsLeft");
			dojo.connect(editorContainer, "onDirtyChange", this, function(dirty) {
				if (dirty) {
					dirtyIndicator = "You have unsaved changes.  ";
				} else {
					dirtyIndicator = "";
				}
				dojo.byId(tiltleDivId).innerHTML = dirtyIndicator + status;
			});
		}
			
		if(createLineStyler && fileURI)
			editorContainer.onInputChange(fileURI.split("?")[0]);
		var editor = editorContainer.getEditorWidget();
			
		editor.addRuler(new orion.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"}));
		if(createLineStyler && fileURI)
			editor.addEventListener("LineStyle", window, function(lineStyleEvent) {
				self.setStyle(lineStyleEvent , editor);
			}); 

		if(columnIndex === 0){
			editor.getModel().addListener(self._compareMatchRenderer);
			editor.addEventListener("Scroll", window, function(scrollEvent) {
				if(self._compareMatchRenderer){
					self._compareMatchRenderer.matchPositionFrom(true);
					self._compareMatchRenderer.render();
				}
			}); 
		} else {
			editor.addEventListener("Scroll", window, function(scrollEvent) {
				if(self._compareMatchRenderer){
					self._compareMatchRenderer.render();
				}
			}); 
		}
		return editorContainer;
	};

	CompareMergeContainer.prototype.setEditor = function(input , diff, onsave){	
		var result = this.parseMapper(input , diff , onsave);
		var self = this;
		if(!this._editorContainerLeft){
			this.initEditorContainers(result.delim , result.output , input ,  result.mapper , true , this._newFileURI , this._oldFileURI);
		} else if (onsave) {
			this._editorLeft.getModel().init(result.mapper);
			this._editorRight.getModel().init(result.mapper);
		}else {
			this._inputManager.filePath = this._newFileURI;
			this._editorLeft.getModel().init(result.mapper);
			this._editorRight.getModel().init(result.mapper);
			this._editorContainerRight.onInputChange(this._oldFileURI.split("?")[0], null, input);
			self._editorRight.addEventListener("LineStyle", window, function(lineStyleEvent) {
				self.setStyle(lineStyleEvent , self._editorRight);
			}); 
			this._editorContainerLeft.onInputChange(this._newFileURI.split("?")[0], null, result.output);
			self._editorLeft.addEventListener("LineStyle", window, function(lineStyleEvent) {
				self.setStyle(lineStyleEvent , self._editorLeft);
			}); 
		}
		this._compareMatchRenderer.init(result.mapper ,this._editorLeft , this._editorRight);
		this._compareMatchRenderer.matchPositionFromAnnotation(-1);
	};
	return CompareMergeContainer;
}());

orion.InlineCompareContainer = (function() {
	/** @private */
	function InlineCompareContainer(resgistry , editorDivId ) {
		this._registry = resgistry;
		this._editorDivId = editorDivId;
		//this.initEditorContainers("" , "\n" , [],[]);
	}
	InlineCompareContainer.prototype = new orion.CompareContainer();
	
	InlineCompareContainer.prototype.destroyEditor = function(){
		if(this._editor)
			this._editor.destroy();
		this._editor = null;
	};

	InlineCompareContainer.prototype.createEditorContainer = function(content , delim , mapper , diffArray ,createLineStyler , fileURI){
		var editorContainerDomNode = dojo.byId(this._editorDivId);
		var self = this;
		
		var model = new eclipse.TextModel(content, delim);
		var compareModel = new orion.CompareTextModel(model, {mapper:mapper , columnIndex:0} , new orion.DiffLineFeeder(diffArray ,delim));

		var editorFactory = function() {
			return new eclipse.Editor({
				parent: editorContainerDomNode,
				model: compareModel,
				readonly: true,
				stylesheet: "/js/compare/editor.css" ,
				tabSize: 4
			});
		};
			
		var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
				return;
		};

		var statusReporter = function(message, isError) {
			return;
		};
		//var undoStackFactory =  new orion.UndoFactory();
		var editorContainer = new orion.EditorContainer({
			editorFactory: editorFactory,
			//undoStackFactory: undoStackFactory,
			//annotationFactory: annotationFactory,
			//lineNumberRulerFactory: new orion.LineNumberRulerFactory(),
			//contentAssistFactory: contentAssistFactory,
			keyBindingFactory: keyBindingFactory, 
			statusReporter: statusReporter,
			domNode: editorContainerDomNode
		});
				
		editorContainer.installEditor();
		if(createLineStyler && fileURI)
			editorContainer.onInputChange(fileURI.split("?")[0]);
			
		var editor = editorContainer.getEditorWidget();
			
		var rulerOrigin = new orion.LineNumberCompareRuler(1,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"});
		var rulerNew = new orion.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"});
		editor.addRuler(rulerOrigin);
		editor.addRuler(rulerNew);
		var overview  = new orion.CompareOverviewRuler("right", {styleClass: "ruler_overview"});
		editor.addRuler(overview);
		if(createLineStyler && fileURI){
			editor.addEventListener("LineStyle", window, function(lineStyleEvent) {
				var lineIndex = lineStyleEvent.lineIndex;
				var lineStart = lineStyleEvent.lineStart;
				var lineType = self._editor.getModel().getLineType(lineIndex);
				if(lineType === "added") {
					lineStyleEvent.style = {style: {backgroundColor: "#99EE99"}};
				} else if (lineType === "removed"){
					lineStyleEvent.style = {style: {backgroundColor: "#EE9999"}};
				} 
			}); 
			
		}
		return editorContainer;
	};

	InlineCompareContainer.prototype.initEditorContainers = function(delim , content , mapper, createLineStyler , fileURI){	
		this._editorContainer = this.createEditorContainer(content , delim , mapper, createLineStyler , fileURI);
		this._editor = this._editorContainer.getEditorWidget();
	};
	
	InlineCompareContainer.prototype.setEditor = function(input , diff){
		/*
		var result = this.parseMapper(input , diff , true);
		var self = this;
		if(!this._editor){
			this.initEditorContainers(result.delim , input ,  result.mapper , result.diffArray , true , this._newFileURI);
		}else {
			this._editor.getModel().init(result.mapper , result.diffArray);
			//this._editor.setText(input);
			this._editorContainer.onInputChange(this._newFileURI.split("?")[0], null, input);
			var self = this;
			this._editor.addEventListener("LineStyle", window, function(lineStyleEvent) {
				var lineIndex = lineStyleEvent.lineIndex;
				var lineStart = lineStyleEvent.lineStart;
				var lineType = self._editor.getModel().getLineType(lineIndex);
				if(lineType === "added") {
					lineStyleEvent.style = {style: {backgroundColor: "#99EE99"}};
				} else if (lineType === "removed"){
					lineStyleEvent.style = {style: {backgroundColor: "#EE9999"}};
				} 
			}); 
		}
		this._initDiffPosition(this._editor);
		this._editor.redrawRange();
		*/
		
		var result = this.parseMapper(input , diff , true);
		if(this._editor){
			if(result.delim === this._editor.getModel().getLineDelimiter() ){
				this._editor.getModel().init(result.mapper , result.diffArray);
				this._editor.setText(input);
				this._initDiffPosition(this._editor);
				return;
			}
		}
				
		var model = new eclipse.TextModel(input, result.delim);
		var compareModel = new orion.CompareTextModel(model, {mapper:result.mapper , columnIndex:0} , new orion.DiffLineFeeder(result.diffArray ,result.delim));
		
		var options = {
			parent: this._editorDivId,
			model: compareModel,
			readonly: true,
			stylesheet: "/js/compare/editor.css" 
		};
		this._editor = new eclipse.Editor(options);
		var rulerOrigin = new orion.LineNumberCompareRuler(1,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"});
		var rulerNew = new orion.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"});
		this._editor.addRuler(rulerOrigin);
		this._editor.addRuler(rulerNew);
		var overview  = new orion.CompareOverviewRuler("right", {styleClass: "ruler_overview"});
		this._editor.addRuler(overview);
		var self = this;
		this._editor.addEventListener("LineStyle", window, function(lineStyleEvent) {
			var lineIndex = lineStyleEvent.lineIndex;
			var lineStart = lineStyleEvent.lineStart;
			var lineType = self._editor.getModel().getLineType(lineIndex);
			if(lineType === "added") {
				lineStyleEvent.style = {style: {backgroundColor: "#99EE99"}};
			} else if (lineType === "removed"){
				lineStyleEvent.style = {style: {backgroundColor: "#EE9999"}};
			} 
		}); 
				
		this._initDiffPosition(this._editor);
		this._editor.redrawRange();
		
	};
	return InlineCompareContainer;
}());

