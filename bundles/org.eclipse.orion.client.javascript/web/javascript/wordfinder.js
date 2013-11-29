/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define*/
define([
], function() {

	var WordFinder = {
		
		punc: '\n\t\r (){}[]:;,.+=-*^&@!%~`\'\"\/\\',
		
		/**
		 * @name findWord
		 * @description Finds the word from the start position
		 * @function
		 * @public
		 * @memberof javascript.Wordfinder
		 * @param {String} text The text of the source to find the word in
		 * @param {Number} start The current start position of the carat
		 * @returns {String} Returns the computed word from the given string and offset or <code>null</code>
		 */
		findWord: function(text, start) {
			if(text && start) {
				var ispunc = this.punc.indexOf(text.charAt(start)) > -1;
				var pos = ispunc ? start-1 : start;
				while(pos >= 0) {
					if(this.punc.indexOf(text.charAt(pos)) > -1) {
						break;
					}
					pos--;
				}
				var s = pos;
				pos = start;
				while(pos <= text.length) {
					if(this.punc.indexOf(text.charAt(pos)) > -1) {
						break;
					}
					pos++;
				}
				if((s === start || (ispunc && (s === start-1))) && pos === start) {
					return null;
				}
				else if(s === start) {
					return text.substring(s, pos);
				}
				else {
					return text.substring(s+1, pos);
				}
			}
			return null;
		}
	};

	return WordFinder;
});
		