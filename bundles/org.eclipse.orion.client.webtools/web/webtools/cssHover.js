 /*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
/* global doctrine */
define([
'orion/objects'
], function(Objects) {
	
	/**
	 * @name webtools.CSSHover
	 * @description creates a new instance of the hover support
	 * @constructor
	 * @public
	 * @since 8.0
	 */
	function CSSHover() {
	}
	
	Objects.mixin(CSSHover.prototype, /** @lends webtools.CSSHover.prototype*/ {
		
		colorValues: [
			"black", //$NON-NLS-0$
			"white", //$NON-NLS-0$
			"red", //$NON-NLS-0$
			"green", //$NON-NLS-0$
			"blue", //$NON-NLS-0$
			"magenta", //$NON-NLS-0$
			"yellow", //$NON-NLS-0$
			"cyan", //$NON-NLS-0$
			"grey", //$NON-NLS-0$
			"darkred", //$NON-NLS-0$
			"darkgreen", //$NON-NLS-0$
			"darkblue", //$NON-NLS-0$
			"darkmagenta", //$NON-NLS-0$
			"darkcyan", //$NON-NLS-0$
			"darkyellow", //$NON-NLS-0$
			"darkgray", //$NON-NLS-0$
			"lightgray" //$NON-NLS-0$
		],
		
		
		/**
		 * @name computeHover
		 * @description Callback from the editor to compute the hover
		 * @function
		 * @public 
		 * @memberof webtools.CSSHover.prototype
		 * @param {Object} editorContext The current editor context
		 * @param {Object} ctxt The current selection context
		 */
		computeHoverInfo: function computeHover(editorContext, ctxt) {
			var that = this;
			var result = editorContext.getText().then(function(text){
				var token = that._getToken(text, ctxt.offset);
				if (token){
					if (that.colorValues.indexOf(token) > -1){
						return that._getColorHover(token);
					}
					if (/\#[0-9A-Fa-f]{1,6}/.test(token)){
						return that._getColorHover(token);	
					}
				}
				return null;
			});
			return result;
		},

		_getToken: function _getToken(text, offset){
			var start = offset;
			var regex = /[0-9A-Za-z\-\@\.\#]/;
			while (start && regex.test(text.charAt(start-1))) {
				start--;
			}
			
			var end = offset;
			while (end < text.length && regex.test(text.charAt(end))) {
				end++;
			}
			
			if (end - start){
				return text.substring(start, end);
			}
			return null;
		},
		
		_getColorHover: function _getColorHover(colorID){
			var html = '<html><body style=\"background-color: ' + colorID + ';\"></html>'; //$NON-NLS-0$  //$NON-NLS-1$
			return {type: "html", content: html, width: "50px", height: "25px"};  //$NON-NLS-0$  //$NON-NLS-1$  //$NON-NLS-2$
		}
		
	});

	CSSHover.prototype.contructor = CSSHover;
	
	return {
		CSSHover: CSSHover
	};
});
