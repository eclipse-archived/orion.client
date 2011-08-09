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
define([], function() {

var orion = orion || {};

orion.OrionTextSearchAdaptor = (function() {
	function OrionTextSearchAdaptor(editor, textView){
		this.setEditor(editor, textView);
	}	
	OrionTextSearchAdaptor.prototype = {
		setEditor: function(editor, textView){
			this._editor = editor;
			this._textView = textView;
		},
		
		getText: function() {
			return this._textView.getText();
		},
		
		getSearchStartIndex: function(reverse, flag) {
			var currentCaretPos = this._textView.getCaretOffset();
			if(reverse) {
				var selection = this._textView.getSelection();
				var selectionSize = (selection.end > selection.start) ? selection.end - selection.start : 0;
				if(!flag){
					return (currentCaretPos- selectionSize - 1) > 0 ? (currentCaretPos- selectionSize - 1) : 0 ;
				}
				return selection.end > 0 ? selection.end : 0;
			}
			return currentCaretPos > 0 ? currentCaretPos : 0 ;
		},
		
		adaptCloseToolBar: function(){
			this._textView.focus();
		},
		
		adaptReplaceAll: function(succeed){
			if(succeed)
				this._editor.reportStatus("", false);
		},
		
		adaptFind: function(startIndex, endIndex, reverse, callBack) {
			if(startIndex === -1)
				this._editor.reportStatus("not found", true);
			else {
				this._editor.reportStatus("", false);
				this._editor.moveSelection(this._textView, startIndex, endIndex, callBack);
			}
		},
		
		adaptReplace: function(newStr, startIndex, endIndex) {
			var selection = this._textView.getSelection();
			this._textView.setText(newStr, selection.start, selection.end);
			this._textView.setSelection(selection.start , selection.start + newStr.length, true);
		}
	};
	return OrionTextSearchAdaptor;
}());

return orion;
});