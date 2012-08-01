/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define setTimeout*/
define(['orion/assert', 'orion/Deferred', 'orion/testHelpers', 'orion/config', 'orion/serviceregistry', 'orion/pluginregistry'],
		function(assert, Deferred, testHelpers, config, mServiceRegistry, mPluginRegistry) {
	var ConfigAdminFactory = config.ConfigurationAdminFactory;
	var MANAGED_SERVICE = 'orion.cm.managedservice';

	function MockPrefsService() {
		function PrefNode() {
			this.map = {};
		}
		PrefNode.prototype = {
			clear: function() {
				this.map = {};
			},
			keys: function() {
				return Object.keys(this.map);
			},
			get: function(key) {
				var value = this.map[key];
				return typeof value === 'object' ? JSON.parse(value) : undefined;
			},
			put: function(key, value) {
				this.map[key] = JSON.stringify(value);
			},
			remove: function(key) {
				delete this.map[key];
			}
		};
		this.getPreferences = function(name, scope) {
			var d = new Deferred();
			setTimeout(function() {
				var prefNode = new PrefNode();
				d.resolve(prefNode);
			}, 100);
			return d;
		};
	}

	var serviceRegistry, pluginRegistry, pluginStorage, configAdmin;
	var setUp = function(storage) {
		serviceRegistry = new mServiceRegistry.ServiceRegistry();
		configAdmin = new ConfigAdminFactory(serviceRegistry, new MockPrefsService()).getConfigurationAdmin();
		pluginStorage = arguments.length ? storage : {};
		pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry, pluginStorage);
	},
	tearDown = function() {
		serviceRegistry = null;
		pluginRegistry = null;
		pluginStorage = null;
		configAdmin = null;
	},
	makeTest = function(body) {
		return testHelpers.makeTest(setUp, tearDown, body);
	};

	var tests = {};
	tests['test ConfigurationAdmin.getConfiguration()'] = makeTest(function() {
		var pid = 'test.pid';
		return configAdmin.getConfiguration(pid).then(function(configuration) {
			assert.strictEqual(configuration.getPid(), pid);
		});
	});

	tests['test ConfigurationAdmin.listConfigurations()'] = makeTest(function() {
		var configPromises = [];
		for (var i=0; i < 10; i++) {
			configPromises.push( configAdmin.getConfiguration('orion.test.pid' + (i+1)) );
		}
		Deferred.all(configPromises, function(configs) {
			configAdmin.listConfigurations().forEach(function(config) {
				assert.ok(configs.some(function(config2) {
					return config2.getPid() === config.getPid();
				}), 'Configuration with pid ' + config.getPid() + ' was found');
			});
		});
	});

	tests['test Configuration.update(), .getProperties()'] = makeTest(function() {
		var pid = 'test.pid';
		return configAdmin.getConfiguration(pid).then(function(configuration) {
			var properties = configuration.getProperties();
			assert.strictEqual(configuration.getPid(), pid);
			assert.strictEqual(properties, null);
			configuration.update({
				str: 'blort',
				num: 42,
				nil: null
			});
			properties = configuration.getProperties();
			assert.ok(properties);
			assert.strictEqual(properties.pid, pid);
			assert.strictEqual(properties.str, 'blort');
			assert.strictEqual(properties.num, 42);
			assert.strictEqual(properties.nil, null);
		});
	});

	tests['test Configuration.remove()'] = makeTest(function() {
		var pid = 'test.pid';
		return configAdmin.getConfiguration(pid).then(function(configuration) {
			configuration.update({
				str: 'blort'
			});
			var properties = configuration.getProperties();
			assert.ok(properties);
			assert.strictEqual(properties.pid, pid);
			assert.strictEqual(properties.str, 'blort');
			configuration.remove();
			return configAdmin.getConfiguration(pid).then(function(configuration) {
				assert.strictEqual(configuration.getProperties(), null);
			});
		});
	});

	tests['test ManagedService.updated() called after registering ManagedService'] = makeTest(function() {
		var pid = 'test.pid';
		return configAdmin.getConfiguration(pid).then(function(configuration) {
			var d = new Deferred();
			configuration.update({
				str: 'zot',
				num: 42,
				nil: null
			});
			// this registration should cause a call to updated(props)
			serviceRegistry.registerService(MANAGED_SERVICE, 
				{	updated: function(properties) {
						try {
							assert.strictEqual(properties.pid, pid);
							assert.strictEqual(properties.str, 'zot');
							assert.strictEqual(properties.num, 42);
							assert.strictEqual(properties.nil, null);
							d.resolve();
						} catch (e) {
							d.reject(e);
						}
					}
				},
				{	pid: pid
				});
			return d;
		});
	});

	tests['test ManagedService.updated(null) called for nonexistent config'] = makeTest(function() {
		var d = new Deferred();
		serviceRegistry.registerService(MANAGED_SERVICE, 
			{	updated: function(properties) {
					if (properties === null) {
						d.resolve();
					} else {
						d.reject();
					}
				}
			},
			{	pid: 'test.pid'
			});
		return d;
	});

	tests['test ManagedService.updated() gets updated props after a Configuration.update()'] = makeTest(function() {
		var d = new Deferred();
		var pid = 'orion.test.pid';
		var count = 0;
		// 1st call happens right after registration
		serviceRegistry.registerService(MANAGED_SERVICE, 
			{	updated: function(properties) {
					if (++count === 2) {
						try {
							assert.strictEqual(properties.test, 'whee');
							d.resolve();
						} catch (e) {
							d.reject(e);
						}
					}
				}
			},
			{	pid: pid
			});
		configAdmin.getConfiguration(pid).then(function(config) {
			// 2nd call happens after this:
			config.update({
				'test': 'whee'
			});
		});
		return d;
	});

	tests['test ManagedService.updated(null) called after removing config'] = makeTest(function() {
		var d = new Deferred();
		var pid = 'orion.test.pid';
		var count = 0;
		// 1st call happens right after registration
		serviceRegistry.registerService(MANAGED_SERVICE, 
			{	updated: function(properties) {
					if (++count === 3) {
						try {
							assert.strictEqual(properties, null);
							d.resolve();
						} catch (e) {
							d.reject(e);
						}
					}
				}
			},
			{	pid: pid
			});
		configAdmin.getConfiguration(pid).then(function(config) {
			// 2nd call updated(..) happens after this:
			config.update({
				'test': 'whee'
			});
			// 3rd call happens after this
			config.remove();
		});
		return d;
	});

	tests['test plugin load calls its ManagedServices\' updated() first'] = makeTest(function() {
		return pluginRegistry.installPlugin('testManagedServicePlugin.html').then(function(plugin) {
			// Destroy the plugin's iframe
			pluginRegistry.shutdown();
			// Create a new PluginRegistry (using the same storage as the old one so it gets our plugin data),
			// and new ServiceRegistry, ConfigAdmin, etc.
			setUp(pluginStorage);
			// This loads the plugin's data from the storage
			return pluginRegistry.startup(['testManagedServicePlugin.html']).then(function() {
				// At this point our plugin's data is in the registry, but the plugin is not loaded.
				// Lazy-load it by invoking a service method
				var testService = serviceRegistry.getService('test.bogus');
				return testService.test().then(function() {
					return testService.getCallOrder().then(function(callOrder) {
						assert.deepEqual(callOrder, ['orion.cm.managedservice', 'test.bogus']);
					});
				});
			});
		});
	});

return tests;
});