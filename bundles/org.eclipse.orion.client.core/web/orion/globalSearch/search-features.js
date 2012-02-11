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

define(['dojo', 'dijit', 'dijit/layout/ContentPane', 'dijit/layout/BorderContainer'], function(dojo, dijit) {


var orion = orion || {};
orion.SearchUIFactory = (function() {
	function SearchUIFactory(option){
		this._parentDivID = option.parentDivID;
	}	
	SearchUIFactory.prototype = {
		
		buildUI:function(){
			this._topWidgetId = this._parentDivID + "_topWidget";
			this._matchWidgetId = this._parentDivID + "_matches";
			this._compareWidgetId = this._parentDivID + "_compare";
			var topWidget = dijit.byId(this._topWidgetId);
			if(topWidget){
				topWidget.destroyRecursive();
			}
			
			var marginBox = dojo.marginBox(this._parentDivID);

			topWidget = new dijit.layout.BorderContainer({id: this._topWidgetId, width: marginBox.w, height: marginBox.h, region:"center", gutters:false ,design:"headline", liveSplitters:true, persist:false , splitter:true });
			var matchWidget = new dijit.layout.BorderContainer({id: this._matchWidgetId, region:"center", gutters:false ,design:"headline", liveSplitters:true, persist:false , splitter:true });
			var compareWidget = new dijit.layout.BorderContainer({id:this._compareWidgetId, region:"bottom" ,gutters:false ,design:"headline", liveSplitters:true, persist:false , splitter:true });
			dojo.addClass(matchWidget.domNode, 'topBorder');
			dojo.addClass(compareWidget.domNode, 'bottomBorderReplace');
			
			topWidget.placeAt(this._parentDivID);
			topWidget.addChild(matchWidget);
			topWidget.addChild(compareWidget);
			topWidget.startup();
		},
		
		destroy: function(){
			this._topWidgetId = this._parentDivID + "_topWidget";
			var topWidget = dijit.byId(this._topWidgetId);
			if(topWidget){
				topWidget.destroyRecursive();
			}
		},
		
		getMatchDivID: function(){
			return this._matchWidgetId;
		},
		
		getCompareDivID: function(){
			return this._compareWidgetId;
		}

	};
	return SearchUIFactory;
}());

return orion;
});
