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
		this.fileContent = null;
		this.diffURI = null;
	}
	CompareContainer.prototype = {
		_getLineDelim: function(input , diff){	
			var delim = "\n";
			return delim;
		},
		
		getFileDiffGit: function(diffURI , callBack , errorCallBack){
			var self = this;
			if(diffURI === null || diffURI === undefined){
				self.setEditor("" ,self.fileContent);
				if(callBack)
					callBack();
				return;
			}
			dojo.xhrGet({
				url: diffURI , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "text",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					fileDiff = jsonData;
					self.setEditor(self.fileContent , fileDiff );
					if(callBack)
						callBack();
				},
				error: function(response, ioArgs) {
					if(errorCallBack)
						errorCallBack(response,ioArgs);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		getFileContent: function(diffURI ,fileURI , callBack, errorCallBack){
			var self = this;
			dojo.xhrGet({
				url: fileURI, 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "text",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					self.fileContent = jsonData;
					self.getFileDiffGit(diffURI , callBack , errorCallBack);
				},
				error: function(response, ioArgs) {
					if(errorCallBack)
						errorCallBack(response,ioArgs);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
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
		
		resolveDiff: function(diffURI ,fileURI , callBack , errorCallBack){
			this.getFileContent(diffURI ,fileURI , callBack , errorCallBack);
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
	function SBSCompareContainer(leftEditorDivId , rightEditorDivId) {
		this._editorLeft = null;
		this._editorRight = null;
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
	function CompareMergeContainer(leftEditorDivId , rightEditorDivId , canvas) {
		//this._editorcontainerLeft = leftEditorContainer;
		this._editorLeft = null;
		this._editorRight = null;
		this._leftEditorDivId = leftEditorDivId;
		this._rightEditorDivId = rightEditorDivId;
		this._compareMatchRenderer = new orion.CompareMatchRenderer(canvas);
	}
	CompareMergeContainer.prototype = new orion.CompareContainer();
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
	
	CompareMergeContainer.prototype.createLeftEditor = function(diffResult){
		var editorContainerDomNode = dojo.byId(this._leftEditorDivId);
		
		var modelLeft = new eclipse.TextModel(diffResult.output, diffResult.delim);
		var compareModelLeft = new orion.CompareMergeModel(modelLeft, {mapper:diffResult.mapper , columnIndex:0} );
		var editorFactory = function() {
			return new eclipse.Editor({
				parent: editorContainerDomNode,
				model: compareModelLeft,
				readonly: false,
				stylesheet: "/js/compare/editor.css" ,
				tabSize: 4
			});
		};
	
		
		var contentAssistFactory = function(editor) {
			return new eclipse.ContentAssist(editor, "contentassist");
		};
		
		var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
			
			// Create keybindings for generic editing
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
			dojo.byId("left-viewer-title").innerHTML = dirtyIndicator + status;
		};
		
		var editorContainer = new orion.EditorContainer({
			editorFactory: editorFactory,
			undoStackFactory: new orion.UndoFactory(),
			//annotationFactory: annotationFactory,
			//lineNumberRulerFactory: new orion.LineNumberRulerFactory(),
			contentAssistFactory: contentAssistFactory,
			keyBindingFactory: keyBindingFactory, 
			statusReporter: statusReporter,
			domNode: editorContainerDomNode
		});
			
		dojo.connect(editorContainer, "onDirtyChange", this, function(dirty) {
			if (dirty) {
				dirtyIndicator = "You have unsaved changes.  ";
			} else {
				dirtyIndicator = "";
			}
			dojo.byId("left-viewer-title").innerHTML = dirtyIndicator + status;
		});
		
		editorContainer.installEditor();
		
		this._editorLeft = editorContainer.getEditorWidget();
		this._editorLeft.addRuler(new orion.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"}));
		
		editorContainer.onInputChange("Content.js");
		var self = this;
		this._editorLeft.addEventListener("LineStyle", window, function(lineStyleEvent) {
			self.setStyle(lineStyleEvent , self._editorLeft);
		}); 

		this._editorLeft.getModel().addListener(self._compareMatchRenderer);
		this._editorLeft.addEventListener("Scroll", window, function(scrollEvent) {
			if(self._compareMatchRenderer){
				self._compareMatchRenderer.matchPositionFrom(true);
				self._compareMatchRenderer.render();
			}
		}); 
				
		
		
		window.onbeforeunload = function() {
			if (editorContainer.isDirty()) {
				 return "There are unsaved changes.";
			}
		};
	};

	CompareMergeContainer.prototype.setEditor = function(input , diff){	
		var result = this.parseMapper(input , diff);
		if(this._editorLeft && this._editorRight){
			if(result.delim === this._editorLeft.getModel().getLineDelimiter() ){
				this._editorLeft.getModel().init(result.mapper);
				this._editorLeft.setText(result.output);
				this._editorRight.getModel().init(result.mapper);
				this._editorRight.setText(input);
				this._compareMatchRenderer.init(result.mapper ,this._editorLeft , this._editorRight);
				this._initDiffPosition(this._editorRight);
				return;
			}
		}
				
		var modelRight = new eclipse.TextModel(input, result.delim);
		var compareModelRight = new orion.CompareMergeModel(modelRight, {mapper:result.mapper , columnIndex:1} );
		
		var optionsRight = {
			parent: this._rightEditorDivId,
			model: compareModelRight,
			readonly: true,
			stylesheet: "/js/compare/editor.css" 
		};
		this._editorRight = new eclipse.Editor(optionsRight);
		this._editorRight.addRuler(new orion.LineNumberCompareRuler(0,"right", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"}));
		this.createLeftEditor(result);
		var self = this;
		this._editorLeft.redrawRange();
		
		this._editorRight.addEventListener("LineStyle", window, function(lineStyleEvent) {
			self.setStyle(lineStyleEvent , self._editorRight);
		}); 

		this._editorRight.addEventListener("Scroll", window, function(scrollEvent) {
			if(self._compareMatchRenderer){
				//self._compareMatchRenderer.matchPositionFrom(false);
				self._compareMatchRenderer.render();
			}
		}); 
				
		var overview  = new orion.CompareMergeOverviewRuler(self._compareMatchRenderer ,"right", {styleClass: "ruler_overview"});
		this._editorRight.addRuler(overview);
		this._compareMatchRenderer.setOverviewRuler(overview);
				
		this._editorRight.redrawRange();
		this._compareMatchRenderer.init(result.mapper ,this._editorLeft , this._editorRight);
		this._compareMatchRenderer.matchPositionFromAnnotation(-1);
	};
	return CompareMergeContainer;
}());

orion.InlineCompareContainer = (function() {
	/** @private */
	function InlineCompareContainer(editorDivId ) {
		this._editor = null;
		this._editorDivId = editorDivId;
	}
	InlineCompareContainer.prototype = new orion.CompareContainer();
	
	InlineCompareContainer.prototype.destroyEditor = function(){
		if(this._editor)
			this._editor.destroy();
		this._editor = null;
	};

	InlineCompareContainer.prototype.setEditor = function(input , diff){	
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

