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
var orion = orion || {};
orion.CompareMergeUIFactory = (function() {
	function CompareMergeUIFactory(option){
		this._parentDivID = option.parentDivID;
		this._showTitle = option.showTitle;
		this._showLineStatus = option.showLineStatus;
	}	
	CompareMergeUIFactory.prototype = {
		_createNoWrapTextDiv:function(textDivId , defaultText , align){
			var table = document.createElement('table');
			table.width = "100%";
			var row = document.createElement('tr');
			table.appendChild(row);
			var td = document.createElement('td');
			td.noWrap = true;
			if(align)
				td.align = align;
			row.appendChild(td);
			var textDiv =  document.createElement('h2');
			textDiv.id = textDivId;
			dojo.place(document.createTextNode(defaultText), textDiv, "only");
			td.appendChild(textDiv);
			return table;
		},
		
		_createEditorParentDiv: function(editorParentDivId ,containerDivId) {
			var editorParentDiv = new dijit.layout.ContentPane({class:"paneScrolled" ,id :editorParentDivId ,region: "center", style:"width:100%;height: 100%;overflow: hidden;"});
			return editorParentDiv;
		},
		
		_createCompareCanvasDiv: function(canvasDivId ,containerDivId){
			var canvasContainer = new dijit.layout.ContentPane({ region: "leading", splitter: false ,style:"width:44px;height:100%;overflow: hidden;"});
			
			var canvas = document.createElement('canvas');
			canvas.id = canvasDivId;
			canvas.width = 46;
			canvas.height = 3000;
			dojo.toggleClass(canvas, "compareCanvas", true);
			canvasContainer.attr('content', canvas);
			canvasContainer.startup();
			return canvasContainer;
		},
		
		_appendDomNode:function(parent,child){
			child.placeAt(parent);
		},
		
		_createTileDiv: function(titleDivId) {
			var table = this._createNoWrapTextDiv(titleDivId , "Compare...");
			var titleContainer = new dijit.layout.ContentPane({region: "top", style:"width:100%;height:30px;overflow: hidden;"});
			titleContainer.attr('content', table);
			return titleContainer;
		},
		
		_createStatusDiv: function(statusDivId) {
			var table = this._createNoWrapTextDiv(statusDivId , "Line Status" , "center");
			var statusContainer = new dijit.layout.ContentPane({region: "bottom", style:"width:100%;height:30px;overflow: hidden;"});
			statusContainer.attr('content', table);
			return statusContainer;
		},
		
		_createLeftEditorParentDiv: function(editorParentDivId ,containerDivId) {
			return this._createEditorParentDiv(editorParentDivId ,containerDivId);
		},
		
		_createRightEditorParentDiv: function(editorParentDivId ,canvasId) {
			var bc = new dijit.layout.BorderContainer({region:"center" ,gutters:false ,design:"headline", style:"width:100%;height: 100%;" ,liveSplitters:false, persist:false , splitter:false});
			this._appendDomNode(bc,this._createCompareCanvasDiv(canvasId));
			this._appendDomNode(bc,this._createEditorParentDiv(editorParentDivId));
			bc.startup();
			return bc;
		},
		
		_createLeftBorder:function(){
			var bc = new dijit.layout.BorderContainer({region:"leading" ,gutters:false ,design:"headline", liveSplitters:true, persist:false , splitter:true , style:"width: 50%;height:100%;"});
			
			if(this._showTitle){
				this._leftTitleDivId = this._parentDivID + "_left_title_id";
				this._appendDomNode(bc , this._createTileDiv(this._leftTitleDivId));
			}
			this._leftEditorParentDivId = this._parentDivID + "_left_editor_id";
			this._appendDomNode(bc , this._createLeftEditorParentDiv(this._leftEditorParentDivId));

			if(this._showLineStatus){
				this._leftStatusDivId = this._parentDivID + "_left_status_id";
				this._appendDomNode(bc , this._createStatusDiv(this._leftStatusDivId));
			}
			
			bc.startup();
			return bc;
		},
		
		_createRightBorder:function(){
			var bc = new dijit.layout.BorderContainer({region:"center" ,gutters:false ,design:"headline", style:"height:100%;" ,liveSplitters:false, persist:false , splitter:false});
			
			if(this._showTitle){
				this._rightTitleDivId = this._parentDivID + "_right_title_id";
				this._appendDomNode(bc ,this._createTileDiv(this._rightTitleDivId));
			}
			
			this._rightEditorParentDivId = this._parentDivID + "_right_editor_id";
			this._diffCanvasDivId = this._parentDivID + "_diff_canvas_id";
			this._appendDomNode(bc , this._createRightEditorParentDiv(this._rightEditorParentDivId , this._diffCanvasDivId));

			if(this._showLineStatus){
				this._rightStatusDivId = this._parentDivID + "_right_status_id";
				this._appendDomNode(bc , this._createStatusDiv(this._rightStatusDivId));
			}
			
			bc.startup();
			return bc;
		},
		
		buildUI:function(){
			var leftB = this._createLeftBorder();
			var rightB = this._createRightBorder();
			/*
			var bc = new dijit.layout.BorderContainer({region:"center" ,gutters:false ,design:"headline", style:"background: #ffffff;width:100%;height: 100%;" , liveSplitters:false, persist:false , splitter:false});
			bc.addChild(leftB);
			bc.addChild(rightB);
			bc.startup();
			this._appendDomNode(this._parentDivID , bc);
			*/
			var parent = dijit.byId(this._parentDivID);
			parent.addChild(leftB);
			parent.addChild(rightB);
		},
		
		getEditorParentDivId: function(left){
			return (left ? this._leftEditorParentDivId : this._rightEditorParentDivId);
		},
		
		getTitleDivId: function(left){
			return (left ? this._leftTitleDivId : this._rightTitleDivId);
		},
		
		getStatusDivId: function(left){
			return (left ? this._leftStatusDivId : this._rightStatusDivId);
		},
		
		getDiffCanvasDivId: function(){
			return this._diffCanvasDivId;
		}

	};
	return CompareMergeUIFactory;
}());

