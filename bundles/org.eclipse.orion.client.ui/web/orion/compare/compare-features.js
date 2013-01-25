/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

define(['i18n!orion/compare/nls/messages', 'orion/compare/compareUtils', 'orion/webui/littlelib', 'orion/webui/splitter', 'text!orion/compare/compare-features.html'], 
function(messages, mCompareUtils, lib, mSplitter, FeatureTemplate) {

var orion = orion || {};
orion.TwoWayCompareUIFactory = (function() {
	function TwoWayCompareUIFactory(option){
		this._parentDivID = option.parentDivID;
		this._commandSpanId = option.commandSpanId;
		this._showTitle = option.showTitle;
		this._leftTitle = option.leftTitle;
		this._rightTitle = option.rightTitle;
		this._showLineStatus = option.showLineStatus;
	}	
	TwoWayCompareUIFactory.prototype = {
		_init: function(){
			//Have to add prefix to the local dome node ids inside the widget, to support multiple widgets by the same template. 
			var prefix = this._parentDivID + "_";
			
			this._topWidgetDiv = lib.node("topWidget_id");
			this._topWidgetDiv.id = prefix + "topWidget_id";
			
			this._leftEditorParentDiv = lib.node("left_editor_id");
			this._leftEditorParentDiv.id = prefix + "left_editor_id";
			this._rightEditorParentDiv = lib.node("right_editor_id");
			this._rightEditorParentDiv.id = prefix + "right_editor_id";
			this._rightEditorWrapperDiv = lib.node("right_editor_wrapper_id");
			this._rightEditorWrapperDiv.id = prefix + "right_editor_wrapper_id";
			
			this._leftTitleDiv = lib.node("left_title_id");
			this._leftTitleDiv.id = prefix + "left_title_id";
			this._rightTitleDiv = lib.node("right_title_id");
			this._rightTitleDiv.id = prefix + "right_title_id";
			
			this._leftStatusDiv = lib.node("left_status_id");
			this._leftStatusDiv.id = prefix + "left_status_id";
			this._rightStatusDiv = lib.node("right_status_id");
			this._rightStatusDiv.id = prefix + "right_status_id";

			this._diffCanvasDiv = lib.node("diff_canvas_id");
			this._diffCanvasDiv.id = prefix + "diff_canvas_id";
			
			this._splitterId = prefix+"orion_splitter";
			
			if(!this._showTitle){
				this._leftEditorParentDiv.style.top = "0px";
				this._rightEditorWrapperDiv.style.top = "0px";
				this._leftTitleDiv.style.height = "0px";
				this._rightTitleDiv.style.height = "0px";
			}
			if(!this._showLineStatus){
				this._leftEditorParentDiv.style.marginBottom = "0px";
				this._rightEditorWrapperDiv.style.marginBottom = "0px";
				this._leftStatusDiv.style.height = "0px";
				this._rightStatusDiv.style.height = "0px";
			}
		},
		
		_createSplitter: function(){
			var splitNode = lib.$(".split", this._topWidgetDiv); //$NON-NLS-0$
			splitNode.id = this._splitterId;
			var leftPane = lib.$(".leftPanelLayout", this._topWidgetDiv); //$NON-NLS-0$
			var rightPane = lib.$(".rightPanelLayout", this._topWidgetDiv); //$NON-NLS-0$
			if (splitNode && leftPane && rightPane) {
				this._splitter = new mSplitter.Splitter({node: splitNode, sidePanel: leftPane, mainPanel: rightPane});
			}
		},
				
		buildUI:function(){
			lib.node(this._parentDivID).innerHTML = FeatureTemplate;//appendChild(topNode);
			this._init();
			this._createSplitter();
		},
		
		destroy: function(){
		},
		
		getSplitter: function(){
			return this._splitter;
		},
		
		isLeftPane: function(node){
			var leftPane = lib.$(".leftPanelLayout", this._topWidgetDiv); //$NON-NLS-0$
			return leftPane === node;
		},
		
		getEditorParentDiv: function(left){
			return (left ? this._leftEditorParentDiv : this._rightEditorParentDiv);
		},
		
		getTitleDiv: function(left){
			return (left ? this._leftTitleDiv : this._rightTitleDiv);
		},
		
		getStatusDiv: function(left){
			return (left ? this._leftStatusDiv : this._rightStatusDiv);
		},
		
		getCommandSpanId: function(){
			return this._commandSpanId;
		},
		
		getDiffCanvasDiv: function(){
			return this._diffCanvasDiv;
		}

	};
	return TwoWayCompareUIFactory;
}());

return orion;
});
