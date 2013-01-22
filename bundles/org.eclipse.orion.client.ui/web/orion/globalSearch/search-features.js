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
/*global window define */

define(['orion/webui/littlelib', 'orion/webui/splitter', 'text!orion/globalSearch/search-features.html'], function(lib, splitter, FeatureTemplate) {


var orion = orion || {};
orion.SearchUIFactory = (function() {
	function SearchUIFactory(option){
		this._parentDivID = option.parentDivID;
	}	
	SearchUIFactory.prototype = {
		
		buildUI:function(){
			var parent = lib.node(this._parentDivID);
			parent.innerHTML = FeatureTemplate;
			var top = lib.$("#replaceTop", parent); //$NON-NLS-0$
			var bottom = lib.$("#replaceBottom", parent); //$NON-NLS-0$
			var splitNode = lib.$(".replaceSplitLayout", parent); //$NON-NLS-0$
			splitNode.id = "replaceSplitter"; //$NON-NLS-0$
			var split = new splitter.Splitter({node: splitNode, sidePanel: top, mainPanel: bottom, vertical: true});
			// TODO attach a resize listener here that will resize the compare widgets
		},
		
		destroy: function(){
		},
		
		getMatchDivID: function(){
			return "replaceTop"; //$NON-NLS-0$
		},
		
		getCompareDivID: function(){
			return "replaceBottom"; //$NON-NLS-0$
		}

	};
	return SearchUIFactory;
}());

return orion;
});
