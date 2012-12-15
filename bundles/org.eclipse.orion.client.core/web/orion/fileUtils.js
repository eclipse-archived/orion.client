/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define window document navigator*/

define(['i18n!orion/nls/messages'], function(messages) {
                
	/**
	 * This class contains static utility methods. It is not intended to be instantiated.
	 * @class This class contains static utility methods.
	 * @name orion.fileUtils
	 */

	function makeRelative(location) {
		if (!location) {
			return location;
		}
		var hostName = window.location.protocol + "//" + window.location.host; //$NON-NLS-0$
		if (location.indexOf(hostName) === 0) {
			return location.substring(hostName.length);
		}
		return location;
	}
	
	/**
	 * Determines if the path represents the workspace root
	 * @name orion.util#isAtRoot
	 * @function
	 */
	function isAtRoot(path) {
		var relative = this.makeRelative(path);
		// TODO better way?
		// I thought it should be the line below but is actually the root of all workspaces
		//  return relative == '/file/';
		return relative.indexOf('/workspace') === 0; //$NON-NLS-0$
	}
	
	//return module exports
	return {
		makeRelative: makeRelative,
		isAtRoot: isAtRoot
	};
});
