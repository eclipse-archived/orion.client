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
	function CompareMergeUIFactory(containerDivId){
		this._containerDivId = containerDivId;
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
			var canvasContainer = new dijit.layout.ContentPane({class:"paneScrolled" , region: "leading", splitter: false ,style:"width:44px;height:100%;overflow: hidden;"});
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
					//node.layout();
				}
			}
		},
			
		createTileDiv: function(titleDivId ,containerDivId) {
			var table = this._createNoWrapTextDiv(titleDivId , "Compare...");
			var titleContainer = new dijit.layout.ContentPane({region: "top", style:"width:100%;height:30px;overflow: hidden;"});
			titleContainer.attr('content', table);
			this._addToContainer(titleContainer , containerDivId);
		},
		
		createStatusDiv: function(statusDivId , containerDivId) {
			var table = this._createNoWrapTextDiv(statusDivId , "Line Status" , "center");
			var statusContainer = new dijit.layout.ContentPane({region: "bottom", style:"width:100%;height:30px;overflow: hidden;"});
			statusContainer.attr('content', table);
			this._addToContainer(statusContainer , containerDivId);
		},
		
		createLeftEditorParentDiv: function(editorParentDivId ,containerDivId) {
			return this._createEditorParentDiv(editorParentDivId ,containerDivId);
		},
		
		createRightEditorParentDiv: function(editorParentDivId ,canvasId , containerDivId) {
			var bc = new dijit.layout.BorderContainer({region:"center" ,design:"headline", liveSplitters:false, persist:false , splitter:false});
			bc.attr('gutters', false);
			bc.addChild(this._createCompareCanvasDiv(canvasId));
			bc.addChild(this._createEditorParentDiv(editorParentDivId));
			bc.startup();
			//bc.layout();
			this._addToContainer(bc , containerDivId,true);
		}
		
	};
	return CompareMergeUIFactory;
}());

