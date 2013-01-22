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

define(['text!orion/globalSearch/search-features.html', 'orion/webui/littlelib'], function(FeatureTemplate, lib) {


var orion = orion || {};
orion.SearchUIFactory = (function() {
	function SearchUIFactory(option){
		this._parentDivID = option.parentDivID;
	}	
	SearchUIFactory.prototype = {
		
		buildUI:function(){
			lib.node(this._parentDivID).innerHTML = FeatureTemplate;
		},
		
		destroy: function(){
		},
		
		getMatchDivID: function(){
			return "replaceTop"; //$NON-NLS-2$
		},
		
		getCompareDivID: function(){
			return "replaceBottom"; //$NON-NLS-2$
		}

	};
	return SearchUIFactory;
}());

return orion;
});
