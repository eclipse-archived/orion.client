/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 *******************************************************************************/
(function() { /* BDL */
	
	function setBrowserLangDirection() {
		
		var lang;
    	if (window.dojoConfig) {
      		lang = window.dojoConfig.locale;
    	}
    	if (!lang) {
      		lang = navigator.languages ? navigator.languages[0] : (navigator.language || navigator.userLanguage);
    	}
    	var isBidi = 'ar iw he'.indexOf((lang).substring(0, 2)) != - 1;
		
    	if (isBidi)
    	{
	    	var htmlElement = document.getElementsByTagName('html')[0];
	    	if (htmlElement){ //should be always true
	    		htmlElement.setAttribute ("dir", "rtl");
	    	}
    	}	
	}
	
	setBrowserLangDirection();
}());