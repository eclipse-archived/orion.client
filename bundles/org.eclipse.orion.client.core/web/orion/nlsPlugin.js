/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define */
define(function() {
	return {
		load: function(name, parentRequire, onLoad, config) {
			if (parentRequire.defined(name)) {
				onLoad(parentRequire(name));
			}
			parentRequire(['orion/bootstrap'], function(bootstrap) {
				bootstrap.startup().then(function(core) {
					var serviceRegistry = core.serviceRegistry;
					var nlsReferences = serviceRegistry.getServiceReferences("orion.18n.bundle");
					var bang = name.indexOf("!");
					if (bang === -1) {
						// create language entries				
						var locales = {};
						nlsReferences.forEach(function(reference) {
							if (name === reference.getProperty("name")) {
								var locale = reference.getProperty("locale");
								if (locale) {
									locales[locale] = true;
									var bundleName = name.replace("nls", "nls" + "/" + locale);
									if (!parentRequire.specified(bundleName)) {
										define(bundleName, ['orion/nlsPlugin!' + locale + '!' + name], function(bundle) {
											return bundle;
										});
									}
								}
							}
						});
						if (!parentRequire.specified(name)) {
							define(name, [], locales);
						}
						onLoad(locales);
					} else {
						var locale = name.substring(0, bang);
						name = name.substring(bang + 1);
						var found = nlsReferences.some(function(reference) {
							if (name === reference.getProperty("name") && locale === reference.getProperty("locale")) {
								serviceRegistry.getService(reference).getMessageBundle().then(function(bundle) {
									onLoad(bundle || {});
								}, function() {
									onLoad({});
								});
								return true;
							}
							return false;
						});
						if (!found) {
							onLoad({});
						}
					}
				});
			});

		}
	};
});