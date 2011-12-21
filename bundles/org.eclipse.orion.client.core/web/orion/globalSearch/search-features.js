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
			this._matchDivId = this._parentDivID + "_matches";
			this._compareDivId = this._parentDivID + "_compare";
			var topDiv = new dijit.layout.BorderContainer({id: this._matchDivId, region:"center", gutters:false ,design:"headline", liveSplitters:true, persist:false , splitter:true });
			var bottomDiv = new dijit.layout.BorderContainer({id:this._compareDivId, region:"bottom" ,gutters:false ,design:"headline", liveSplitters:true, persist:false , splitter:true });
			dojo.addClass(topDiv.domNode, 'topBorder');
			dojo.addClass(bottomDiv.domNode, 'bottomBorderReplace');
			
			var parent = dijit.byId(this._parentDivID);
			parent.addChild(topDiv);
			parent.addChild(bottomDiv);
			parent.startup();
		},
		
		getMatchDivID: function(){
			return this._matchDivId;
		},
		
		getCompareDivID: function(){
			return this._compareDivId;
		}

	};
	return SearchUIFactory;
}());

return orion;
});
