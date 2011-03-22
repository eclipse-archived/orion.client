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
		this._diffParser = new eclipse.DiffParser();
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
		var compareModelLeft = new eclipse.CompareTextModel(modelLeft, {mapper:result.mapper , columnIndex:0} , new eclipse.GapLineFeeder( result.delim));
		var modelRight = new eclipse.TextModel(input, result.delim);
		var compareModelRight = new eclipse.CompareTextModel(modelRight, {mapper:result.mapper , columnIndex:1} , new eclipse.GapLineFeeder( result.delim));
		
		var optionsRight = {
			parent: this._rightEditorDivId,
			model: compareModelRight,
			readonly: true,
			stylesheet: "/js/compare/editor.css" 
		};
		this._editorRight = new eclipse.Editor(optionsRight);
		this._editorRight.addRuler(new eclipse.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"}));
				
		var optionsLeft = {
			parent: this._leftEditorDivId,
			model: compareModelLeft,
			readonly: true,
			stylesheet: "/js/compare/editor.css" 
		};
		this._editorLeft = new eclipse.Editor(optionsLeft);
		this._editorLeft.addRuler(new eclipse.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"}));
		
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
				
		var overview  = new eclipse.CompareOverviewRuler("right", {styleClass: "ruler_overview"});
		this._editorRight.addRuler(overview);
				
		this._initDiffPosition(this._editorLeft);
		this._editorRight.redrawRange();
	};
	return SBSCompareContainer;
}());

orion.CompareMergeContainer = (function() {
	/** @private */
	function CompareMergeContainer(leftEditorDivId , rightEditorDivId , canvas) {
		this._editorLeft = null;
		this._editorRight = null;
		this._leftEditorDivId = leftEditorDivId;
		this._rightEditorDivId = rightEditorDivId;
		this._compareMatchRenderer = new eclipse.CompareMatchRenderer(canvas);
	}
	CompareMergeContainer.prototype = new orion.CompareContainer();
	CompareMergeContainer.prototype.setStyle = function(lineStyleEvent , lineType){	
		if(lineType === "top-only") {
			lineStyleEvent.style = {style: { borderTop: "1px #AAAAAA solid" }};
		} else if (lineType === "oneline"){
			lineStyleEvent.style = {style: {backgroundColor: "#EEEEEE" , border: "1px #AAAAAA solid" }};
		} else if (lineType === "top"){
			lineStyleEvent.style = {style: {backgroundColor: "#EEEEEE" , borderTop: "1px #AAAAAA solid" , borderLeft: "1px #AAAAAA solid" , borderRight: "1px #AAAAAA solid"}};
		} else if (lineType === "bottom"){
			lineStyleEvent.style = {style: {backgroundColor: "#EEEEEE" , borderBottom: "1px #AAAAAA solid" , borderLeft: "1px #AAAAAA solid" , borderRight: "1px #AAAAAA solid"}};
		} else if (lineType === "middle"){
			lineStyleEvent.style = {style: {backgroundColor: "#EEEEEE" , borderLeft: "1px #AAAAAA solid" , borderRight: "1px #AAAAAA solid"}};
		} 
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
				
		var modelLeft = new eclipse.TextModel(result.output, result.delim);
		var compareModelLeft = new eclipse.CompareMergeModel(modelLeft, {mapper:result.mapper , columnIndex:0} , new eclipse.GapLineFeeder( result.delim));
		var modelRight = new eclipse.TextModel(input, result.delim);
		var compareModelRight = new eclipse.CompareMergeModel(modelRight, {mapper:result.mapper , columnIndex:1} , new eclipse.GapLineFeeder( result.delim));
		
		var optionsRight = {
			parent: this._rightEditorDivId,
			model: compareModelRight,
			readonly: true,
			stylesheet: "/js/compare/editor.css" 
		};
		this._editorRight = new eclipse.Editor(optionsRight);
		this._editorRight.addRuler(new eclipse.LineNumberCompareRuler(0,"right", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"}));
				
		var optionsLeft = {
			parent: this._leftEditorDivId,
			model: compareModelLeft,
			readonly: false,
			stylesheet: "/js/compare/editor.css" 
		};
		this._editorLeft = new eclipse.Editor(optionsLeft);
		this._editorLeft.addRuler(new eclipse.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"}));
		
		var self = this;
		this._editorLeft.addEventListener("LineStyle", window, function(lineStyleEvent) {
			var lineIndex = lineStyleEvent.lineIndex;
			var lineType =  self._editorLeft.getModel().getLineType(lineIndex);
			self.setStyle(lineStyleEvent , lineType);
		}); 

		this._editorLeft.getModel().addListener(self._compareMatchRenderer);
		this._editorLeft.addEventListener("Scroll", window, function(scrollEvent) {
			//self._editorRight.setTopPixel(self._editorLeft.getTopPixel());
			self._compareMatchRenderer.render();
		}); 
				
		this._editorLeft.redrawRange();
		
		this._editorRight.addEventListener("LineStyle", window, function(lineStyleEvent) {
			var lineIndex = lineStyleEvent.lineIndex;
			var lineType =  self._editorRight.getModel().getLineType(lineIndex);
			self.setStyle(lineStyleEvent , lineType);
		}); 

		this._editorRight.addEventListener("Scroll", window, function(scrollEvent) {
			//self._editorLeft.setTopPixel(self._editorRight.getTopPixel());
			self._compareMatchRenderer.render();
		}); 
				
		var overview  = new eclipse.CompareMergeOverviewRuler(self._compareMatchRenderer ,"right", {styleClass: "ruler_overview"});
		this._editorRight.addRuler(overview);
				
		this._editorRight.redrawRange();
		this._compareMatchRenderer.init(result.mapper ,this._editorLeft , this._editorRight);
		this._compareMatchRenderer.matchPositionFromRight(-1);
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
		var compareModel = new eclipse.CompareTextModel(model, {mapper:result.mapper , columnIndex:0} , new eclipse.DiffLineFeeder(result.diffArray ,result.delim));
		
		var options = {
			parent: this._editorDivId,
			model: compareModel,
			readonly: true,
			stylesheet: "/js/compare/editor.css" 
		};
		this._editor = new eclipse.Editor(options);
		var rulerOrigin = new eclipse.LineNumberCompareRuler(1,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"});
		var rulerNew = new eclipse.LineNumberCompareRuler(0,"left", {styleClass: "ruler_lines"}, {styleClass: "ruler_lines_odd"}, {styleClass: "ruler_lines_even"});
		this._editor.addRuler(rulerOrigin);
		this._editor.addRuler(rulerNew);
		var overview  = new eclipse.CompareOverviewRuler("right", {styleClass: "ruler_overview"});
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

