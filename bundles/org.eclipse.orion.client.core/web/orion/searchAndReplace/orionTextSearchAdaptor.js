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
 
 /*global define*/
 
define([], function() {

var orion = orion || {};

orion.OrionTextSearchAdaptor = (function() {
	function OrionTextSearchAdaptor(editor){
		this.setEditor(editor);
	}	
	OrionTextSearchAdaptor.prototype = {
		setEditor: function(editor){
			this._editor = editor;
		},
		
		getText: function() {
			return this._editor.getText();
		},
		
		getSearchStartIndex: function(reverse, flag) {
			var currentCaretPos = this._editor.getCaretOffset();
			if(reverse) {
				var selection = this._editor.getSelection();
				var selectionSize = (selection.end > selection.start) ? selection.end - selection.start : 0;
				if(!flag){
					return (currentCaretPos- selectionSize - 1) > 0 ? (currentCaretPos- selectionSize - 1) : 0 ;
				}
				return selection.end > 0 ? selection.end : 0;
			}
			return currentCaretPos > 0 ? currentCaretPos : 0 ;
		},
		
		adaptCloseToolBar: function(){
			this._editor.getTextView().focus();
			var annotationModel = this._editor.getAnnotationModel();
			if (annotationModel) {
				annotationModel.removeAnnotations("orion.annotation.search");
			}
		},
		
		adaptReplaceAllStart: function(){
			this._editor.reportStatus("");
			this._editor.reportStatus("Replacing all...", "progress");
		},
		
		adaptReplaceAllEnd: function(succeed, number){
			this._editor.reportStatus("", "progress");
			if(succeed) {
				this._editor.reportStatus("Replaced "+number+" matches");
			} else {
				this._editor.reportStatus("Nothing replaced", "error");
			}
		},
		
		adaptFind: function(startIndex, endIndex, reverse, callBack, noStatus) {
			if(startIndex === -1){
				if(!noStatus) {
					this._editor.reportStatus("Not found", "error");
				}
			}
			else {
				if(!noStatus) {
					this._editor.reportStatus("");
				}
				var annotationModel = this._editor.getAnnotationModel();
				if (annotationModel) {
					annotationModel.removeAnnotations("orion.annotation.search");
					annotationModel.addAnnotation({
						type: "orion.annotation.search",
						start: startIndex,
						end: endIndex,
						title: "Search",
						style: {styleClass: "annotation searchCurrent"},
						html: "<div class='annotationHTML searchCurrent'></div>",
						overviewStyle: {styleClass: "annotationOverview searchCurrent"},
						rangeStyle: {styleClass: "annotationRange searchCurrent"}
					});
				}
				this._editor.moveSelection(startIndex, endIndex, callBack, false);
			}
		},
		
		adaptReplace: function(newStr, startIndex, endIndex) {
			var selection = this._editor.getSelection();
			this._editor.setText(newStr, selection.start, selection.end);
			this._editor.setSelection(selection.start , selection.start + newStr.length, true);
		}
	};
	return OrionTextSearchAdaptor;
}());

return orion;
});