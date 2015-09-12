/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 *******************************************************************************/
define (function() { /* BDL */
	
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
	
	var bidiEnabledStorgae = '/orion/preferences/bidi/bidiEnabled'; //$NON-NLS-0$
	var bidiLayoutStorage = '/orion/preferences/bidi/bidiLayout'; //$NON-NLS-0$	
	var LRE = '\u202A';	//$NON-NLS-0$
	var PDF = '\u202C'; //$NON-NLS-0$
	var RLE = '\u202B'; //$NON-NLS-0$
	
	var isBidiEnabled = isBidiEnabled();
	var bidiLayout = getBidiLayout();

	/**
	 * checks if directionality should be applied in Orion.
	 * @returns {Boolean} true if globalization settings exist and bidi is enabled.
	 */		
	function isBidiEnabled() {
		var bidiEnabled = localStorage.getItem(bidiEnabledStorgae);
		if (bidiEnabled && bidiEnabled == 'true') {		//$NON-NLS-0$
			return true;
		}
		else {
			return false;
		}
	}
	
	/**
	 * returns bidiLayout value set in globalization settings.
	 * @returns {String} text direction.
	 */	
	function getBidiLayout() {
		var bidiLayout = localStorage.getItem(bidiLayoutStorage);
		if (bidiLayout && (bidiLayout == 'rtl' || bidiLayout == 'ltr' || bidiLayout == 'auto')) {	//$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$
			return bidiLayout;
		}
		else {
			return 'ltr';	//$NON-NLS-0$
		}
	}
	
	/**
	 * returns text direction.
	 * this method is used for handling direction by adding a dir attribute in an HTML element.
	 * if bidiLayout is set to ltr > return ltr
	 * if bidiLayout is set to rtl > return rtl
	 * if bidiLayout is set to auto > check for first strong character in text and return ltr or rtl accordingly.
	 * @param {String} the text on which to set directionality
	 * @returns {String} text direction. rtl or ltr.
	 */	
	function getTextDirection(text) {
		if (bidiLayout == 'auto') {	//$NON-NLS-0$
			return checkContextual(text);
		}
		else {
			return bidiLayout;
		}
	}	
	
	/**
	 * Wraps text by UCC (Unicode control characters) according to text direction
	 * In some cases defining the dir attribute in a different direction than the GUI orientation, 
	 * changes the alignment of the text and/or adjacent elements such as icons.
	 * This doesn't follow the bidi standards (static text should be aligned following GUI direction).
	 * Therefore the only solution is to use UCC (Unicode control characters) to display the text in a correct orientation.
	 * (the text is changed for display purposes only. The original text in the repository remains unchanged)
	 * @param {String} the text to be wrapped
	 * @returns {String} text after adding ucc characters.
	 */		
	function enforceTextDirWithUcc ( text ) {
		if (text.trim()) {
			var dir = bidiLayout == 'auto' ? checkContextual( text ) : bidiLayout;	//$NON-NLS-0$
			return ( dir == 'ltr' ? LRE : RLE ) + text + PDF;	//$NON-NLS-0$
		}
		else {
			return text;	
		}
	};
	
	/**
	 * Finds the first strong (directional) character.
	 * If it is Latin, return ltr. If it is bidi, return rtl. Otherwise, return ltr as default. 
	 * @param {String} the text to be examined
	 * @returns {String} text direction. rtl or ltr.
	 */			
	function checkContextual ( text ) {
		// look for strong (directional) characters
		var fdc = /[A-Za-z\u05d0-\u065f\u066a-\u06ef\u06fa-\u07ff\ufb1d-\ufdff\ufe70-\ufefc]/.exec( text );
		// if found, return the direction that defined by the character, else return ltr as defult.
		return fdc ? ( fdc[0] <= 'z' ? 'ltr' : 'rtl' ) : 'ltr';	//$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
	};	
		
	return {
		isBidiEnabled: isBidiEnabled,
		getTextDirection: getTextDirection,
		enforceTextDirWithUcc: enforceTextDirWithUcc
	};
});