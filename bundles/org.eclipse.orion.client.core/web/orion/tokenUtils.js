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
/*global define Math */
define(['orion/Deferred'], function(Deferred){
	
	var exports = {
		
		/**
	     * Generates a random URL-friendly string token.
	     * @param {Number} [length=256] Token length, defaults to 256.
	     * @private
	     */
		_getRandomToken : function(length){
			length = length || 256;
			var characters = '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM',
				token = '';
			
			while(length-->0){
				/* append random character */
				var idx = Math.floor(Math.random() * characters.length);
				token += characters[idx];
			}
			
			return token;
		},
		
		/**
		 * Returns a CSRF security token used to authenticate Orion in communication with various plugin providers.
		 * @param {orion.preferences.PreferencesService} preferenceService The preference service used to cache the generated token
		 */
		getCSRFToken : function(preferenceService){
			var deferred = new Deferred();
			
			preferenceService.getPreferences('/plugins/csrf', preferenceService.LOCAL_SCOPE).then(function(pref){
				var csrfToken = pref.get('token');
				if(csrfToken){ deferred.resolve(csrfToken); }
				else {
					/* generate and cache a new token */
					var randomToken = exports._getRandomToken();
					pref.put('token', randomToken);
					return randomToken;
				}
			});
			
			return deferred;
		}
	};
	
	return exports;
});