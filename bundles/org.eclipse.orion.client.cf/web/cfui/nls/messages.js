/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
 /*global define*/
 
define(['orion/i18n!cfui/nls/messages', 'cfui/nls/root/messages'], function(bundle, root) {
	var result = {
			root:root
	};
	Object.keys(bundle).forEach(function(key) {
		if (typeof result[key] === 'undefined') {
			result[key] = bundle[key];
		}
	});
	return result;
});