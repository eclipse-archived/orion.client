/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global define*/
define(['require' ,'orion/Deferred'], function(require, Deferred) {

	function getMessageBundle(name){
		var d = new Deferred();
		require(['orion/nlsPlugin!' + name], function() {
			require(['i18n!' + name], function(bundle) {
				d.resolve(bundle);
			});
		});
		return d;
	}
	return {
		getMessageBundle: getMessageBundle
	};
});