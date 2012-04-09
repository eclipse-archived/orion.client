/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define(['orion/treeModelIterator', 'orion/compare/compareUtils', 'orion/textview/annotations', 'orion/compare/jsdiffAdapter'], function(mTreeModelIterator, mCompareUtils, mAnnotations, mJSDiffAdapter){

var exports = {};

var DiffAnnoTypes = {};

exports.DiffTreeNavigator = (function() {
	/**
	 * Creates a new diff tree model.
	 * A diff tree model represents a tree structure of diffs. 
	 * The top level children represents all the diff blocks based on lines, where each diff block contains a list of word level diffs.
	 *
	 * @name orion.DiffTreeNavigator.DiffTreeNavigator
	 * @class A tree model based iterator component.
	 * @param {list} firstLevelChildren The first level children of the tree root, each item has children and parent property recursively.
	 * @param {Object} options The options object which provides iterate patterns and all call back functions when iteration happens.
	 */
	function DiffTreeNavigator(charOrWordDiff, oldEditor, newEditor, oldDiffBlockFeeder, newDiffBlockFeeder, curveRuler) {
		this._root = {type: "root", children: []};
		this._initialized = false;
		this.initAll(charOrWordDiff, oldEditor, newEditor, oldDiffBlockFeeder, newDiffBlockFeeder, curveRuler);
	}
	
	/**
	 * Annotation type for the block diff 
	 */
	DiffAnnoTypes.ANNO_DIFF_ADDED_BLOCK = "orion.annotation.diff.addedBlock";
	
	/**
	 * Annotation type for the current block diff
	 */
	DiffAnnoTypes.ANNO_DIFF_CURRENT_ADDED_BLOCK = "orion.annotation.diff.currentAddedBlock";
	
	/**
	 * Annotation type for the block diff 
	 */
	DiffAnnoTypes.ANNO_DIFF_DELETED_BLOCK = "orion.annotation.diff.deletedBlock";
	
	/**
	 * Annotation type for the current block diff
	 */
	DiffAnnoTypes.ANNO_DIFF_CURRENT_DELETED_BLOCK = "orion.annotation.diff.currentDeletedBlock";
	
	/**
	 * Annotation type for the block diff, top only 
	 */
	DiffAnnoTypes.ANNO_DIFF_BLOCK_TOPONLY = "orion.annotation.diff.blockTop";
	
	/**
	 * Annotation type for the current block diff, top only 
	 */
	DiffAnnoTypes.ANNO_DIFF_CURRENT_BLOCK_TOPONLY = "orion.annotation.diff.currentBlockTop";
	
	/**
	 * Annotation type for the block diff, conflicting 
	 */
	DiffAnnoTypes.ANNO_DIFF_BLOCK_CONFLICT = "orion.annotation.diff.blockConflict";
	
	/**
	 * Annotation type for the current block diff, conflicting 
	 */
	DiffAnnoTypes.ANNO_DIFF_CURRENT_BLOCK_CONFLICT = "orion.annotation.diff.currentBlockConflict";
	
	/**
	 * Annotation type for an added word 
	 */
	DiffAnnoTypes.ANNO_DIFF_ADDED_WORD = "orion.annotation.diff.addedWord";
	
	/**
	 * Annotation type for the current added word 
	 */
	DiffAnnoTypes.ANNO_DIFF_CURRENT_ADDED_WORD = "orion.annotation.diff.currentAddedWord";
	
	/**
	 * Annotation type for a deleted word 
	 */
	DiffAnnoTypes.ANNO_DIFF_DELETED_WORD = "orion.annotation.diff.deletedWord";
	
	/**
	 * Annotation type for the current deleted word 
	 */
	DiffAnnoTypes.ANNO_DIFF_CURRENT_DELETED_WORD = "orion.annotation.diff.currentDeletedWord";
	
	/**
	 * Annotation type for an empty word annotation, putting on the left side of character, e.g (start: 123, end: 123)
	 */
	DiffAnnoTypes.ANNO_DIFF_EMPTY_DELETED_WORD_LEFT = "orion.annotation.diff.emptyDeletedWordLeft";

	/**
	 * Annotation type for an empty word annotation, putting on the right side of character, e.g (start: 123, end: 123)
	 */
	DiffAnnoTypes.ANNO_DIFF_EMPTY_DELETED_WORD_RIGHT = "orion.annotation.diff.emptyDeletedWordRight";
	
	/**
	 * Annotation type for an empty word annotation, putting on the left side of character, e.g (start: 123, end: 123)
	 */
	DiffAnnoTypes.ANNO_DIFF_EMPTY_ADDED_WORD_LEFT = "orion.annotation.diff.emptyAddedWordLeft";

	/**
	 * Annotation type for an empty word annotation, putting on the right side of character, e.g (start: 123, end: 123)
	 */
	DiffAnnoTypes.ANNO_DIFF_EMPTY_ADDED_WORD_RIGHT = "orion.annotation.diff.emptyAddedWordRight";

	/*** registration of all the diff block annotation types ***/
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_ADDED_BLOCK, {
		title: "",
		html: "",
		lineStyle: {styleClass: "annotationLine addedBlockDiff"}
	});
	
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_CURRENT_ADDED_BLOCK, {
		title: "",
		html: "",
		lineStyle: {styleClass: "annotationLine currentAddedBlockDiff"}
	});
	
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_DELETED_BLOCK, {
		title: "",
		html: "",
		lineStyle: {styleClass: "annotationLine deletedBlockDiff"}
	});
	
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_CURRENT_DELETED_BLOCK, {
		title: "",
		html: "",
		lineStyle: {styleClass: "annotationLine currentDeletedBlockDiff"}
	});
	
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_BLOCK_TOPONLY, {
		title: "",
		html: "",
		lineStyle: {styleClass: "annotationLine blockDiffTopOnly"}
	});
	
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_CURRENT_BLOCK_TOPONLY, {
		title: "",
		html: "",
		lineStyle: {styleClass: "annotationLine currentBlockDiffTopOnly"}
	});
	
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_BLOCK_CONFLICT, {
		title: "",
		html: "",
		lineStyle: {styleClass: "annotationLine blockDiffConflict"}
	});
	
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_CURRENT_BLOCK_CONFLICT, {
		title: "",
		html: "",
		lineStyle: {styleClass: "annotationLine currentBlockDiffConflict"}
	});
	
	/*** registration of all the diff word annotation types ***/
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_ADDED_WORD, {
		title: "word added",
		html: "",
		rangeStyle: {styleClass: "annotationRange addedWordDiff"}
	});
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_CURRENT_ADDED_WORD, {
		title: "",
		html: "",
		rangeStyle: {styleClass: "annotationRange currentAddedWordDiff"}
	});
	
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_DELETED_WORD, {
		title: "word deleted",
		html: "",
		rangeStyle: {styleClass: "annotationRange deletedWordDiff"}
	});
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_CURRENT_DELETED_WORD, {
		title: "",
		html: "",
		rangeStyle: {styleClass: "annotationRange currentDeletedWordDiff"}
	});
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_EMPTY_DELETED_WORD_LEFT, {
		title: "",
		html: "",
		rangeStyle: {styleClass: "annotationRange emptyDeletedWordDiffLeft"}
	});
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_EMPTY_DELETED_WORD_RIGHT, {
		title: "",
		html: "",
		rangeStyle: {styleClass: "annotationRange emptyDeletedWordDiffRight"}
	});
	
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_EMPTY_ADDED_WORD_LEFT, {
		title: "",
		html: "",
		rangeStyle: {styleClass: "annotationRange emptyAddedWordDiffLeft"}
	});
	mAnnotations.AnnotationType.registerType(DiffAnnoTypes.ANNO_DIFF_EMPTY_ADDED_WORD_RIGHT, {
		title: "",
		html: "",
		rangeStyle: {styleClass: "annotationRange emptyAddedWordDiffRight"}
	});
	
	DiffTreeNavigator.prototype = /** @lends orion.DiffTreeNavigator.DiffTreeNavigator.prototype */ {
		
		initAll: function(charOrWordDiff, oldEditor, newEditor, oldDiffBlockFeeder, newDiffBlockFeeder, overviewRuler, curveRuler){
			if(!charOrWordDiff){
				this._charOrWordDiff = "word";
			} else {
				this._charOrWordDiff = charOrWordDiff;
			}
			if(oldEditor){
				this._initialized = true;
			}
			this.editorWrapper = [{editor: oldEditor, diffFeeder: oldDiffBlockFeeder},
			                      {editor: newEditor, diffFeeder: newDiffBlockFeeder}];
			this._curveRuler = curveRuler;
			this._overviewRuler = overviewRuler;
			if(this._overviewRuler){
				this._overviewRuler._diffNavigator = this;
			}
		},
			
		initMapper: function(mapper){
			if(mapper){
				for(var i = 0; i < this.editorWrapper.length; i++){
					this.editorWrapper[i].diffFeeder.init(this.editorWrapper[i].editor.getTextView().getModel(), mapper);
				}
			}
		},
		
		renderAnnotations: function(){
			for(var i = 0; i < this.editorWrapper.length; i++){
				this.editorWrapper[i].annoTypes = [];
				this.editorWrapper[i].diffFeeder.getBlockAnnoTypes(this.editorWrapper[i].annoTypes);
				this.editorWrapper[i].diffFeeder.getWordAnnoTypes(this.editorWrapper[i].annoTypes);
				for(var j = 0; j < this.editorWrapper[i].annoTypes.length; j++){
					if(this.editorWrapper[i].annoTypes[j].current){
						this.editorWrapper[i].editor.getAnnotationStyler().addAnnotationType(this.editorWrapper[i].annoTypes[j].current);
					}
					if(this.editorWrapper[i].annoTypes[j].normal){
						this.editorWrapper[i].editor.getAnnotationStyler().addAnnotationType(this.editorWrapper[i].annoTypes[j].normal);
					}
				}
			}
			
			this._root.children = [];
			var oldDiffBlocks = this.editorWrapper[0].diffFeeder.getDiffBlocks();
			if(!oldDiffBlocks || oldDiffBlocks.length === 0){
				this.replaceAllAnnotations(0, "block", false, []);
				this.replaceAllAnnotations(1, "block", false, []);
				this.replaceAllAnnotations(0, "word", false, []);
				this.replaceAllAnnotations(1, "word", false, []);
				this.replaceAllAnnotations(0, "block", true, []);
				this.replaceAllAnnotations(1, "block", true, []);
				this.replaceAllAnnotations(0, "word", true, []);
				this.replaceAllAnnotations(1, "word", true, []);
				return;
			}
			var adapter = new mJSDiffAdapter.JSDiffAdapter();
			for(var i = 0; i < oldDiffBlocks.length; i++){
				var diffBlockModel = this.generatePairBlockAnnotations(this._root, i);
				this._root.children.push(diffBlockModel);
				var children = this.generatePairWordAnnotations(diffBlockModel, i, adapter);
				if(children){
					diffBlockModel.children = children;
				}
			}
			this.replaceAllAnnotations(0, "block", true);
			this.replaceAllAnnotations(1, "block", true);
			this.replaceAllAnnotations(0, "word", true);
			this.replaceAllAnnotations(1, "word", true);
			this.iterator = new mTreeModelIterator.TreeModelIterator(this._root.children);
		},
		
		replaceAllAnnotations: function(wrapperIndex, wordOrBlock, normal, replacingList){
			for(var i = 0; i < this.editorWrapper[wrapperIndex].annoTypes.length; i++){
				if(this.editorWrapper[wrapperIndex].annoTypes[i].type === wordOrBlock){
					this.replaceDiffAnnotations(this.editorWrapper[wrapperIndex].editor, replacingList ? replacingList : this.editorWrapper[wrapperIndex].annoTypes[i].list, 
												normal ? this.editorWrapper[wrapperIndex].annoTypes[i].normal : this.editorWrapper[wrapperIndex].annoTypes[i].current);
				}
			}
		},
		
		getMapper: function(){
			return this.editorWrapper[0].diffFeeder.getMapper();
		},
		
		getFeeder: function(left){
			return left ? this.editorWrapper[1].diffFeeder : this.editorWrapper[0].diffFeeder;
		},
		
		iterateOnBlock: function(forward, roundTrip){
			if(!this.iterator){
				return;
			}
			this.iterator.iterateOnTop(forward, roundTrip);
			this.updateCurrentAnnotation(true);
		},
			
		iterateOnChange: function(forward){
			if(!this.iterator){
				return;
			}
			this.iterator.iterate(forward);
			var cursor = this.iterator.cursor();
			if(cursor.type === "block" && cursor.children && cursor.children.length > 0){
				this.iterator.iterate(forward);
			}
			this.updateCurrentAnnotation(true);
		},
		
		gotoBlock: function(blockIndex){
			if(!this.iterator){
				return;
			}
			if(blockIndex < 0 || blockIndex >= this._root.children.length || this._root.children.length === 0){
				blockIndex = 0;
			}
			this.iterator.setCursor(this._root.children[blockIndex]);
			this.updateCurrentAnnotation(false);
		},
		
		_hitDiffAnnotation: function(wrapperIndex, caretPosition, textView){
			if(textView !== this.editorWrapper[wrapperIndex].editor.getTextView()){
				return;
			}
			for(var i = 0; i < this._root.children.length; i++){
				var block = this._root.children[i];
				var blockAnno  = wrapperIndex===0 ? block.oldA : block.newA;
				if(caretPosition >= blockAnno.start && caretPosition <= blockAnno.end){
					var currentHit = block;
					if(block.children && block.children.length > 0){
						for(var j = 0; j < block.children.length; j++){
							var word = block.children[j];
							var wordAnno  = wrapperIndex===0 ? word.oldA : word.newA;
							if(caretPosition >= wordAnno.start && caretPosition <= wordAnno.end){
								currentHit = word;
								break;
							}
						}
					}
					return currentHit;
				}
			}
			return null;
		},
		
		gotoChange: function(caretPosition, textView){
			for(var i = 0; i < this.editorWrapper.length; i++){
				var hit = this._hitDiffAnnotation(i, caretPosition, textView);
				if(hit){
					this.iterator.setCursor(hit);
					this.updateCurrentAnnotation(false, textView);
					return true;
				}
			}
			return false;
		},
		
		getCurrentBlockIndex: function(){
			if(!this.iterator){
				return -1;
			}
			var cursor = this.iterator.cursor();
			if(cursor.type === "block"){
				return cursor.index;
			} else {
				return cursor.parent.index;
			}
		},
		
		getCurrentMapperIndex: function(){
			var blockIndex = this.getCurrentBlockIndex();
			if(blockIndex < 0){
				blockIndex = 0;
			}
			return this.getFeeder().getDiffBlocks().length === 0 ? -1 : this.getFeeder().getDiffBlocks()[blockIndex][1];
		},
		
		replaceDiffAnnotations: function(editor, overallAnnotations, type){
			if(!overallAnnotations || !type){
				return;
			}
			var annotationModel = editor.getAnnotationModel();
			if(!annotationModel){
				return;
			}
			var iter = annotationModel.getAnnotations(0, annotationModel.getTextModel().getCharCount());
			var remove = [];
			while (iter.hasNext()) {
				var annotation = iter.next();
				if (annotation.type === type) {
					remove.push(annotation);
				}
			}
			annotationModel.replaceAnnotations(remove, overallAnnotations);
		},
		
		updateCurrentAnnotation: function(moveSelection, textView){
			this.replaceAllAnnotations(0, "block", false, []);
			this.replaceAllAnnotations(1, "block", false, []);
			this.replaceAllAnnotations(0, "word", false, []);
			this.replaceAllAnnotations(1, "word", false, []);
			if(!this.iterator){
				return;
			}
			var cursor = this.iterator.cursor();
			var annoType0, annoType1;
			var annoPosOld = {start: cursor.oldA.start, end: cursor.oldA.end};
			var annoPosNew = {start: cursor.newA.start, end: cursor.newA.end};
			if(cursor.type === "word"){
				annoType0 = this.editorWrapper[0].diffFeeder.getCurrentWordAnnoType(annoPosOld, this.editorWrapper[0].editor.getTextView().getModel());
				annoType1 = this.editorWrapper[1].diffFeeder.getCurrentWordAnnoType(annoPosNew, this.editorWrapper[1].editor.getTextView().getModel());
			} else {
				annoType0 = this.editorWrapper[0].diffFeeder.getCurrentBlockAnnoType(cursor.index);
				annoType1 = this.editorWrapper[1].diffFeeder.getCurrentBlockAnnoType(cursor.index);
			}
			this.replaceDiffAnnotations(this.editorWrapper[0].editor, [new (mAnnotations.AnnotationType.getType(annoType0.current))(annoPosOld.start, annoPosOld.end)], annoType0);
			this.replaceDiffAnnotations(this.editorWrapper[1].editor, [new (mAnnotations.AnnotationType.getType(annoType1.current))(annoPosNew.start, annoPosNew.end)], annoType1);
			if(moveSelection){
				this.autoSelecting = true;
				this.editorWrapper[0].editor.setSelection(cursor.oldA.start, cursor.oldA.end, true);
				this.editorWrapper[1].editor.setSelection(cursor.newA.start, cursor.newA.end, true);
				this.autoSelecting = false;
			} else if(textView) {
				this.autoSelecting = true;
				if(textView !== this.editorWrapper[0].editor.getTextView()){
					this.editorWrapper[0].editor.setSelection(cursor.oldA.start, cursor.oldA.end, true);
				}
				if(textView !== this.editorWrapper[1].editor.getTextView()){
					this.editorWrapper[1].editor.setSelection(cursor.newA.start, cursor.newA.end, true);
				}
				this.autoSelecting = false;
			}
		},
			
		generatePairBlockAnnotations: function(parentObj, diffBlockIndex){
			var oldBlockAnno = this.generateBlockDiffAnnotations(0, diffBlockIndex);
			var newBlockAnno = this.generateBlockDiffAnnotations(1, diffBlockIndex);
			return {parent: parentObj, index: diffBlockIndex, type: "block", oldA: oldBlockAnno, newA: newBlockAnno};
		},
		
		generatePairWordAnnotations: function(parentObj, diffBlockIndex, jsDiffAdapter){
			var textOld = this.editorWrapper[0].diffFeeder.getTextOnBlock(diffBlockIndex);
			var textNew = this.editorWrapper[1].diffFeeder.getTextOnBlock(diffBlockIndex);
			var charDiffMap = null;
			var startOld = 0;
			var startNew = 0;
			if(textOld && textNew){
				charDiffMap = jsDiffAdapter.adaptCharDiff(textOld.text, textNew.text, this._charOrWordDiff === "word");
				startNew = textNew.start;
				startOld = textOld.start;
			} else {
				return null;
			}
			var oldAnnotations = [];
			var newAnnotations = [];
			this.generateWordDiffAnnotations(0, oldAnnotations, startOld, charDiffMap, 2, 3);
			this.generateWordDiffAnnotations(1, newAnnotations, startNew, charDiffMap, 0, 1);
			var pairAnnotations = [];
			for(var i = 0; i < oldAnnotations.length; i++){
				pairAnnotations.push({parent: parentObj, type: "word", oldA: oldAnnotations[i], newA: newAnnotations[i]});
			} 
			return pairAnnotations;
		},
		
		getAnnoModelList: function(wrapperIndex, wordOrBlock, annoType){
			for(var i = 0; i < this.editorWrapper[wrapperIndex].annoTypes.length; i++){
				if(this.editorWrapper[wrapperIndex].annoTypes[i].type === wordOrBlock &&
				   this.editorWrapper[wrapperIndex].annoTypes[i].normal === annoType){
					return this.editorWrapper[wrapperIndex].annoTypes[i].list;
				}
			}
			return null;
		},
		
		generateBlockDiffAnnotations: function(wrapperIndex, diffBlockIndex){
			var type = this.editorWrapper[wrapperIndex].diffFeeder.getCurrentBlockAnnoType(diffBlockIndex);
			var annoList = this.getAnnoModelList(wrapperIndex, "block", type.normal);
			var range = this.editorWrapper[wrapperIndex].diffFeeder.getCharRange(diffBlockIndex);
			var annotation = mAnnotations.AnnotationType.createAnnotation(type.normal, range.start, range.end);
			if(annoList){
				annoList.push(annotation);
			}
			return annotation;
		},
		
		generateWordDiffAnnotations: function(wrapperIndex, diffBlockAnnotaionArray, startIndex, charDiffMap, startColumn, endColumn){
			if(charDiffMap){
				var type = this.editorWrapper[wrapperIndex].diffFeeder.getCurrentWordAnnoType({start: -1, end: -1});
				var annoList = this.getAnnoModelList(wrapperIndex, "word", type.normal);
				for(var i = 0; i < charDiffMap.length; i++){
					var start = charDiffMap[i][startColumn] + startIndex;
					var end = charDiffMap[i][endColumn] + startIndex;
					var annotation = mAnnotations.AnnotationType.createAnnotation(type.normal, start, end);
					annoList.push(annotation);
					diffBlockAnnotaionArray.push(annotation);
				}
			}
		},
		
		/* Navigation APIs */
		_updateOverviewRuler: function(){
			if(this._overviewRuler){
				var drawLine = this.editorWrapper[0].editor.getTextView().getTopIndex() ;
				this.editorWrapper[0].editor.getTextView().redrawLines(drawLine , drawLine+  1 , this._overviewRuler);
			}
		},
		
		_updateCurveRuler: function(){
			if(this._curveRuler){
				this._curveRuler.render();
			}
		},
		
		_setTextViewPosition: function (textView , lineIndex){
			var lineHeight = textView.getLineHeight();
			var clientArea = textView.getClientArea();
			var lines = Math.floor(clientArea.height / lineHeight/3);
			textView.setTopIndex((lineIndex - lines) > 0 ? lineIndex - lines : 0);
		},

		_positionDiffBlock: function(){
			var blockIndex = this.getCurrentBlockIndex();
			var diffBlocks = this.getFeeder().getDiffBlocks();
			if(diffBlocks.length === 0)
				return;
			this._setTextViewPosition(this.editorWrapper[0].editor.getTextView() , diffBlocks[blockIndex][0]);
			if(this.editorWrapper[0].editor !== this.editorWrapper[1].editor){
				var lineIndexL = mCompareUtils.lookUpLineIndex(this.getMapper(), 0, diffBlocks[blockIndex][1]);
				this._setTextViewPosition(this.editorWrapper[1].editor.getTextView() , lineIndexL);
			}
			this._updateOverviewRuler();
			this._updateCurveRuler();
		},
		
		matchPositionFromOverview: function(lineIndex){
			if(!this._initialized){
				return;
			}
			var diffblockIndex;
			if(lineIndex < 0){
				diffblockIndex = 0;
			} else {
				diffblockIndex = mCompareUtils.getAnnotationIndex(this.getFeeder().getDiffBlocks(), lineIndex);
			}
			this.gotoBlock(diffblockIndex);
			this._positionDiffBlock();
		},
		
		gotoDiff: function(caretPosition, textView){
			if(this.gotoChange(caretPosition, textView)){
				this._updateOverviewRuler();
				this._updateCurveRuler();
			}
		},

		nextDiff: function(){
			this.iterateOnBlock(true, true);
			this._positionDiffBlock();
		},
		
		prevDiff: function(){
			this.iterateOnBlock(false, true);
			this._positionDiffBlock();
		},
		
		nextChange: function(){
			this.iterateOnChange(true);
			this._positionDiffBlock();
		},
		
		prevChange: function(){
			this.iterateOnChange(false);
			this._positionDiffBlock();
		}
	};
	return DiffTreeNavigator;
}());

exports.TwoWayDiffBlockFeeder = (function() {
	/**
	 * Creates a new diff block feeder of one side of the two way compare widget.
	 * Each item in the feeder is represented by a pair of number [lineIndexOfTheTextModel, correspondingMapperIndex]. 
	 *
	 * @name orion.DiffTreeNavigator.TwoWayDiffBlockFeeder
	 * @class A feeder to feed all the diff blocks based on the line index and mapper index.
	 * @param {orion.textview.TextModel} The text model of the whole text.
	 * @param {array} The mapper generated from the unified diff.
	 * @param {integer} The column index where the line index can be calculated.
	 */
	function TwoWayDiffBlockFeeder(model, mapper, mapperColumnIndex) {
	    this._mapperColumnIndex = mapperColumnIndex;
	    this.init(model, mapper);
	}
	
	TwoWayDiffBlockFeeder.prototype = /** @lends orion.DiffTreeNavigator.TwoWayDiffBlockFeeder.prototype */ {
		
		init: function(model, mapper){
		    this._textModel = model;
			this._initing = true;
			this._diffBlocks = undefined;
			if(mapper){
				this._mapper = mapper;
				this._diffBlocks = [];
				var curLineindex = 0;//zero based
				for (var i = 0 ; i < this._mapper.length ; i++){
					if((this._mapper[i][2] !== 0)){
						this._diffBlocks.push([curLineindex , i]);
					}
					curLineindex += this._mapper[i][this._mapperColumnIndex];
				}
			}
		},
		
		getBlockAnnoTypes: function(result){
			if(this._mapperColumnIndex === 0){
				result.push({type: "block", normal: DiffAnnoTypes.ANNO_DIFF_ADDED_BLOCK, current: DiffAnnoTypes.ANNO_DIFF_CURRENT_ADDED_BLOCK, list: []});
			} else {
				result.push({type: "block", normal: DiffAnnoTypes.ANNO_DIFF_DELETED_BLOCK, current: DiffAnnoTypes.ANNO_DIFF_CURRENT_DELETED_BLOCK, list: []});
			}
			result.push({type: "block", normal: DiffAnnoTypes.ANNO_DIFF_BLOCK_TOPONLY, current: DiffAnnoTypes.ANNO_DIFF_CURRENT_BLOCK_TOPONLY, list: []});
			result.push({type: "block", normal: DiffAnnoTypes.ANNO_DIFF_BLOCK_CONFLICT, current: DiffAnnoTypes.ANNO_DIFF_CURRENT_BLOCK_CONFLICT, list: []});
		},
		
		getWordAnnoTypes: function(result){
			if(this._mapperColumnIndex === 0){
				result.push({type: "word", current: DiffAnnoTypes.ANNO_DIFF_CURRENT_ADDED_WORD, normal: DiffAnnoTypes.ANNO_DIFF_ADDED_WORD, list: []});
			} else {
				result.push({type: "word", current: DiffAnnoTypes.ANNO_DIFF_CURRENT_DELETED_WORD, normal: DiffAnnoTypes.ANNO_DIFF_DELETED_WORD, list: []});
			}
			result.push({type: "word", current: DiffAnnoTypes.ANNO_DIFF_EMPTY_DELETED_WORD_LEFT});
			result.push({type: "word", current: DiffAnnoTypes.ANNO_DIFF_EMPTY_DELETED_WORD_RIGHT});
			result.push({type: "word", current: DiffAnnoTypes.ANNO_DIFF_EMPTY_ADDED_WORD_LEFT});
			result.push({type: "word", current: DiffAnnoTypes.ANNO_DIFF_EMPTY_ADDED_WORD_RIGHT});
		},
 
		getCurrentBlockAnnoType: function(diffBlockIndex){
			var mapperIndex = this._diffBlocks[diffBlockIndex][1];
			if(this._mapper[mapperIndex][this._mapperColumnIndex] === 0){
				return {normal: DiffAnnoTypes.ANNO_DIFF_BLOCK_TOPONLY, current: DiffAnnoTypes.ANNO_DIFF_CURRENT_BLOCK_TOPONLY};
			} else if(mCompareUtils.isMapperConflict(this.getMapper(), mapperIndex)){
				return {normal: DiffAnnoTypes.ANNO_DIFF_BLOCK_CONFLICT, current: DiffAnnoTypes.ANNO_DIFF_CURRENT_BLOCK_CONFLICT};
			} else if(this._mapperColumnIndex === 0){
				return {type: "block", normal: DiffAnnoTypes.ANNO_DIFF_ADDED_BLOCK, current: DiffAnnoTypes.ANNO_DIFF_CURRENT_ADDED_BLOCK, list: []};
			} 
			return {type: "block", normal: DiffAnnoTypes.ANNO_DIFF_DELETED_BLOCK, current: DiffAnnoTypes.ANNO_DIFF_CURRENT_DELETED_BLOCK, list: []};
		},
		
		_repositionEmptyWord: function(annoPosition, textModel){
			var lineIndex = textModel.getLineAtOffset(annoPosition.start);
			var lineStart = textModel.getLineStart(lineIndex);
			var lineEnd = textModel.getLineEnd(lineIndex);
			if(lineStart !== lineEnd){
				if(annoPosition.start == lineEnd){
					annoPosition.start--;
					return this._mapperColumnIndex === 0 ? DiffAnnoTypes.ANNO_DIFF_EMPTY_ADDED_WORD_RIGHT : DiffAnnoTypes.ANNO_DIFF_EMPTY_DELETED_WORD_RIGHT;
				}
				annoPosition.end++;
				return this._mapperColumnIndex === 0 ? DiffAnnoTypes.ANNO_DIFF_EMPTY_ADDED_WORD_LEFT : DiffAnnoTypes.ANNO_DIFF_EMPTY_DELETED_WORD_LEFT;
			} else if (lineIndex > 0){
				lineIndex--;
				lineStart = textModel.getLineStart(lineIndex);
				lineEnd = textModel.getLineEnd(lineIndex);
				if(lineStart !== lineEnd){
					annoPosition.start = lineEnd -1;
					annoPosition.end = lineEnd;
					return this._mapperColumnIndex === 0 ? DiffAnnoTypes.ANNO_DIFF_EMPTY_ADDED_WORD_RIGHT : DiffAnnoTypes.ANNO_DIFF_EMPTY_DELETED_WORD_RIGHT;
				}
			}
			return this._mapperColumnIndex === 0 ? DiffAnnoTypes.ANNO_DIFF_EMPTY_ADDED_WORD_LEFT : DiffAnnoTypes.ANNO_DIFF_EMPTY_DELETED_WORD_LEFT;
		},
		
		getCurrentWordAnnoType: function(annoPosition, textModel){
			if(annoPosition.start === annoPosition.end && textModel){
				if(this._mapperColumnIndex === 0){
					return {current: this._repositionEmptyWord(annoPosition, textModel), normal: DiffAnnoTypes.ANNO_DIFF_ADDED_WORD};
				} else {
					return {current: this._repositionEmptyWord(annoPosition, textModel), normal: DiffAnnoTypes.ANNO_DIFF_DELETED_WORD};
				}
			} else {
				if(this._mapperColumnIndex === 0){
					return {current: DiffAnnoTypes.ANNO_DIFF_CURRENT_ADDED_WORD, normal: DiffAnnoTypes.ANNO_DIFF_ADDED_WORD};
				} else {
					return {current: DiffAnnoTypes.ANNO_DIFF_CURRENT_DELETED_WORD, normal: DiffAnnoTypes.ANNO_DIFF_DELETED_WORD};
				}
			}
		},
		
		getMapper: function(){
			return this._mapper;
		},
		
		getDiffBlocks: function(){
			return this._diffBlocks;
		},
		
		getDiffBlockH: function(diffBlockIndex){
			if(!this._diffBlocks){
				return -1;
			}
			var mapperIndex = this._diffBlocks[diffBlockIndex][1];
			return 	(mapperIndex === -1) ? 0 :this._mapper[mapperIndex][this._mapperColumnIndex];
		},
		
		getAnnotationLineCount: function(){
			return 	this._textModel.getLineCount();
		},
		
		getCharRange: function(blockIndex){
			var mapperIndex = this._diffBlocks[blockIndex][1];
			var startLine = this._diffBlocks[blockIndex][0];
			var endLine = startLine + this._mapper[mapperIndex][this._mapperColumnIndex] -1;
			var startIndex = this._textModel.getLineStart(startLine);
			if(endLine < startLine){
				return {start: startIndex, end: startIndex};
			}
			var endIndex = this._textModel.getLineEnd(endLine, true);
			return {start: startIndex, end: endIndex};
		},
		
		getTextOnBlock: function(blockIndex){
			var mapperIndex = this._diffBlocks[blockIndex][1];
			if(this._mapper[mapperIndex][0] === 0 || this._mapper[mapperIndex][1] === 0 || this._mapper[mapperIndex][2] === 0){
				//return null;
			}
			var charRange = this.getCharRange(blockIndex);
			return {start: charRange.start, text: this._textModel.getText(charRange.start, charRange.end)};
		},

		//To get the line type from a zero based line index  
		getLineType: function(lineIndex){
			var mapItem = mCompareUtils.lookUpMapper(this._mapper , this._mapperColumnIndex , lineIndex);
			if(mapItem.mapperIndex > -1){
				if(this._mapper[mapItem.mapperIndex][2] !== 0){
					var mapperLength = this._mapper[mapItem.mapperIndex][this._mapperColumnIndex];
					if(mapperLength === 0)
						return {type:"top-only" , mapperIndex:mapItem.mapperIndex};
					if(mapperLength === 1)
						return {type:"oneline" , mapperIndex:mapItem.mapperIndex};
					if(lineIndex === mapItem.startFrom)
						return {type:"top" , mapperIndex:mapItem.mapperIndex};
					if(lineIndex === mapItem.startFrom + mapperLength -1)
						return {type:"bottom" , mapperIndex:mapItem.mapperIndex};
					return {type:"middle" , mapperIndex:mapItem.mapperIndex};
				}
			}
			return {type:"unchanged" , mapperIndex:mapItem.mapperIndex};
		},
			
		isMapperEmpty: function(){
			return this._mapper.length === 0;
		}
	};
	return TwoWayDiffBlockFeeder;
}());

return exports;
});
