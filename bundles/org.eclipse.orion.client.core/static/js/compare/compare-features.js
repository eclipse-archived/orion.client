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
			this._addToContainer(editorParentDiv , containerDivId);
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
			this._addToContainer(canvasContainer , containerDivId);
			return canvasContainer;
		},
		
		_addToContainer:function(div,containerDivId ,doLayout){
			if(containerDivId){
				var node = dijit.byId(containerDivId);
				node.addChild(div);
				if(doLayout){
					//node.startup();
					node.layout();
				}
			}
		},
			
		_createTileDiv: function(titleDivId ,containerDivId) {
			var table = this._createNoWrapTextDiv(titleDivId , "Compare...");
			var titleContainer = new dijit.layout.ContentPane({region: "top", style:"width:100%;height:30px;overflow: hidden;"});
			titleContainer.attr('content', table);
			this._addToContainer(titleContainer , containerDivId);
			return titleContainer;
		},
		
		_createStatusDiv: function(statusDivId , containerDivId) {
			var table = this._createNoWrapTextDiv(statusDivId , "Line Status" , "center");
			var statusContainer = new dijit.layout.ContentPane({region: "bottom", style:"width:100%;height:30px;overflow: hidden;"});
			statusContainer.attr('content', table);
			this._addToContainer(statusContainer , containerDivId);
			return statusContainer;
		},
		
		_createLeftEditorParentDiv: function(editorParentDivId ,containerDivId) {
			return this._createEditorParentDiv(editorParentDivId ,containerDivId);
		},
		
		_createRightEditorParentDiv: function(editorParentDivId ,canvasId , containerDivId) {
			var bc = new dijit.layout.BorderContainer({region:"center" ,gutters:false ,design:"headline", liveSplitters:false, persist:false , splitter:false});
			bc.addChild(this._createCompareCanvasDiv(canvasId));
			bc.addChild(this._createEditorParentDiv(editorParentDivId));
			bc.startup();
			this._addToContainer(bc , containerDivId);
			return bc;
		},
		
		_createLeftBorder:function(containerDivId){
			var bc = new dijit.layout.BorderContainer({region:"leading" ,gutters:false ,design:"headline", liveSplitters:true, persist:false , splitter:true , style:"width: 50%;"});
			if(this._showTitle){
				this._leftTitleDivId = this._parentDivID + "_left_title_id";
				bc.addChild(this._createTileDiv(this._leftTitleDivId));
			}
			this._leftEditorParentDivId = this._parentDivID + "_left_editor_id";
			bc.addChild(this._createLeftEditorParentDiv(this._leftEditorParentDivId));

			if(this._showLineStatus){
				this._leftStatusDivId = this._parentDivID + "_left_status_id";
				bc.addChild(this._createStatusDiv(this._leftStatusDivId));
			}

			bc.startup();
			this._addToContainer(bc , containerDivId);
			return bc;
		},
		
		_createRightBorder:function(containerDivId){
			var bc = new dijit.layout.BorderContainer({region:"center" ,gutters:false ,design:"headline", liveSplitters:false, persist:false , splitter:false});
			
			if(this._showTitle){
				this._rightTitleDivId = this._parentDivID + "_right_title_id";
				bc.addChild(this._createTileDiv(this._rightTitleDivId));
			}
			
			this._rightEditorParentDivId = this._parentDivID + "_right_editor_id";
			this._diffCanvasDivId = this._parentDivID + "_diff_canvas_id";
			bc.addChild(this._createRightEditorParentDiv(this._rightEditorParentDivId , this._diffCanvasDivId));

			if(this._showLineStatus){
				this._rightStatusDivId = this._parentDivID + "_right_status_id";
				bc.addChild(this._createStatusDiv(this._rightStatusDivId));
			}

			bc.startup();
			this._addToContainer(bc , containerDivId);
			return bc;
		},
		
		buildUI:function(){
			this._createLeftBorder(this._parentDivID);
			this._createRightBorder(this._parentDivID);
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

