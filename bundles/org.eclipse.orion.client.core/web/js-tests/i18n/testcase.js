/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define console setTimeout*/


define(["require", "orion/Deferred", "orion/bootstrap", "orion/assert", "orion/nlsutil", "orion/nlsPlugin"], function(require, Deferred, bootstrap, assert, nlsutil) {

	var NLS_PLUGIN = "orion/nlsPlugin";
	var tests = {};

	tests.testI18n = function() {
		var name = "test/i18n/nls/message1";
		define(name, [], {
			root: {
				test: "test"
			}
		});
		var d = new Deferred();
		require(["i18n!" + name], function(messages) {
			d.resolve(messages);
		});

		return d.then(function(messages) {
			assert.ok(messages.test === "test");
		});
	};

	tests.testI18nPlugin = function() {
		var name = "test/i18n/nls/message2";
		define(name, [NLS_PLUGIN + "!" + name], function(bundle) {
			var result = {
				root: {
					test: "test"
				}
			};
			Object.keys(bundle).forEach(function(key) {
				if (typeof result[key] === 'undefined') {
					result[key] = bundle[key];
				}
			});
			return result;
		});

		var d = new Deferred();
		require(["i18n!" + name], function(messages) {
			d.resolve(messages);
		});

		return d.then(function(messages) {
			assert.ok(messages.test === "test");
		});
	};

	tests.testI18nService = function() {
		var name = "test/i18n/nls/message3";
		var serviceName = "test/i18n/nls/en/message3";

		var d = new Deferred();
		bootstrap.startup().then(function(core) {
			core.serviceRegistry.registerService("orion.i18n.message", {
				getMessageBundle: function() {
					return {
						test: "test-en"
					};
				}
			}, {
				name: serviceName
			});

			define(name, [NLS_PLUGIN + "!" + name], function(bundle) {
				var result = {
					root: {
						test: "test"
					}
				};
				Object.keys(bundle).forEach(function(key) {
					if (typeof result[key] === 'undefined') {
						result[key] = bundle[key];
					}
				});
				return result;
			});

			require(["i18n!" + name], function(messages) {
				d.resolve(messages);
			});
		});
		return d.then(function(messages) {
			assert.equal(messages.test, "test-en");
		});
	};

	tests.testI18nMasterService = function() {
		var name = "test/i18n/nls/message4";

		var d = new Deferred();
		bootstrap.startup().then(function(core) {
			core.serviceRegistry.registerService("orion.i18n.message", {
				getMessageBundle: function() {
					return {
						root: {
							test: "test"
						}
					};
				}
			}, {
				name: name
			});

			nlsutil.getMessageBundle(name).then(function(messages) {
				d.resolve(messages);
			});
		});
		return d.then(function(messages) {
			assert.equal(messages.test, "test");
		});
	};

	tests.testI18nMasterAndAdditionalService = function() {
		var name = "test/i18n/nls/message5";
		var serviceName = "test/i18n/nls/en/message5";

		var d = new Deferred();
		bootstrap.startup().then(function(core) {
			core.serviceRegistry.registerService("orion.i18n.message", {
				getMessageBundle: function() {
					return {
						root: {
							test: "test"
						}
					};
				}
			}, {
				name: name
			});

			core.serviceRegistry.registerService("orion.i18n.message", {
				getMessageBundle: function() {
					return {
						test: "test-en"
					};
				}
			}, {
				name: serviceName
			});

			nlsutil.getMessageBundle(name).then(function(messages) {
				d.resolve(messages);
			});
		});
		return d.then(function(messages) {
			assert.equal(messages.test, "test-en");
		});
	};


	return tests;
});