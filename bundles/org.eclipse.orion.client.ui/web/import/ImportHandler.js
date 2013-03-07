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
/*global console define URL window*/
define(['require', 'orion/URITemplate', 'orion/URL-shim', 'orion/serviceTracker'], function(require, URITemplate, _, ServiceTracker) {
	var AUTOIMPORT_SERVICE_NAME = 'orion.core.autoimport'; //$NON-NLS-0$
	var NAVIGATE_TO_TEMPLATE = new URITemplate("{OrionHome}/navigate/table.html#{NavigatorLocation}?depth=1"); //$NON-NLS-0$

	function getHref(location) {
		return decodeURIComponent(NAVIGATE_TO_TEMPLATE.expand({
			OrionHome: new URL(require.toUrl('.'), window.location.href).href.slice(0,-1),
			NavigatorLocation: location
		}));
	}

	/**
	 * @name orion.importer.Connector
	 * @class Connects to external services providing data for auto-import.
	 * @param {orion.importer.Injector} injector
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 */
	function ImportHandler(injector, serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
		this.injector = injector;
		this.tracker = null;
	}
	/**
	 * @name orion.importer.Connector#connect
	 * @function
	 */
	ImportHandler.prototype.connect = function() {
		var injector = this.injector;
		var serviceRegistry = this.serviceRegistry;
		var tracker = this.tracker = new ServiceTracker(serviceRegistry, AUTOIMPORT_SERVICE_NAME);
		var listeners = {};
		var serviceListener = function(data) {
			var service = this;
			if (!data || typeof data !== 'object') { //$NON-NLS-0$
				console.log('Expected import data to be an object');
				return;
			}
			console.log('connector got a message: ' + JSON.stringify(data));
			console.log('connector got zip: ' + data.zip + ' ' + data.zip.size + ' bytes');
	
			var user = data.user;
			var projectZipData = data.zip;
			injector.inject(user, projectZipData).then(function(project) {
				if (typeof service.onresponse !== 'function') {
					console.log('Expected ' + AUTOIMPORT_SERVICE_NAME + ' service to provide an "onresponse" method');
				}
				service.onresponse({
					type: 'success', //$NON-NLS-0$
					href: getHref(project.Location)
				});
			}, function(error) {
				console.log(error);
				service.onResponse({
					type: 'error', //$NON-NLS-0$
					error: error
				});
			});
		};
		tracker.onServiceAdded = function(serviceRef, service) {
			if (typeof service.addEventListener !== 'function') { //$NON-NLS-0$
				console.log('Expected ' + AUTOIMPORT_SERVICE_NAME + ' service to have an "addEventListener" method');
				return;
			}
			var listener = listeners[serviceRef.getProperty('service.id')] = serviceListener.bind(service);
			service.addEventListener('import', listener);
		};
		tracker.removedService = function(serviceRef, service) {
			if (typeof service.removeEventListener !== 'function') { //$NON-NLS-0$
				console.log('Expected ' + AUTOIMPORT_SERVICE_NAME + ' service to have a "removeEventListener" method');
			}
			var listener = listeners[serviceRef.getProperty('service.id')];
			delete listeners[serviceRef.getProperty('service.id')];
			service.removeEventListener('import', listener); //$NON-NLS-1$ //$NON-NLS-0$
		};

		tracker.open();
	};
	/**
	 * @name orion.importer.Connector#disconnect
	 * @function
	 */
	ImportHandler.prototype.disconnect = function() {
		if (this.tracker) {
			this.tracker.close();
		}
	};
	return ImportHandler;
});