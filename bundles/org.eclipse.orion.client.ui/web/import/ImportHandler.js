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

	function getHref(location) {
		var NAVIGATE_TO_TEMPLATE = new URITemplate('{OrionHome}/navigate/table.html#{NavigatorLocation}?depth=1'); //$NON-NLS-0$
		return decodeURIComponent(NAVIGATE_TO_TEMPLATE.expand({
			OrionHome: new URL(require.toUrl('.'), window.location.href).href.slice(0,-1),  //$NON-NLS-0$
			NavigatorLocation: location
		}));
	}

	function debug(msg) { console.log('Orion: ' + msg); }
	function logError(msg) { console.log(msg); }

	/**
	 * @name orion.importer.ImportHandler
	 * @class Monitors services that are capable of providing data to be imported. When such a service indicates it wants to 
	 * import data, the data is passed to the <code>injector</code>.
	 * @param {orion.importer.Injector} injector
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 */
	function ImportHandler(injector, serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
		this.injector = injector;
		this.tracker = null;
	}
	/**
	 * @name orion.importer.ImportHandler#connect
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
				debug('Expected import data to be an object');
				return;
			}
			debug('ImportHandler got a message: ' + JSON.stringify(data));
			debug('ImportHandler got zip: ' + data.zip + ' ' + data.zip.size + ' bytes');
			injector.inject(data.createUser, data.userInfo, data.zip, data.projectName).then(function(project) {
				if (typeof service.onresponse !== 'function') {
					logError('Expected ' + AUTOIMPORT_SERVICE_NAME + ' service to provide an "onresponse" method');
				}
				service.onresponse({
					type: 'success', //$NON-NLS-0$
					href: getHref(project.Location),
					project: project
				});
			}, function(error) {
				logError(error);
				service.onresponse({
					type: 'error', //$NON-NLS-0$
					error: error
				});
			});
		};
		tracker.onServiceAdded = function(serviceRef, service) {
			if (typeof service.addEventListener !== 'function') { //$NON-NLS-0$
				logError('Expected ' + AUTOIMPORT_SERVICE_NAME + ' service to have an "addEventListener" method');
				return;
			}
			var listener = listeners[serviceRef.getProperty('service.id')] = serviceListener.bind(service);
			service.addEventListener('import', listener);
		};
		tracker.removedService = function(serviceRef, service) {
			if (typeof service.removeEventListener !== 'function') { //$NON-NLS-0$
				logError('Expected ' + AUTOIMPORT_SERVICE_NAME + ' service to have a "removeEventListener" method');
			}
			var listener = listeners[serviceRef.getProperty('service.id')];
			delete listeners[serviceRef.getProperty('service.id')];
			service.removeEventListener('import', listener); //$NON-NLS-1$ //$NON-NLS-0$
		};

		tracker.open();
	};
	/**
	 * @name orion.importer.ImportHandler#disconnect
	 * @function
	 */
	ImportHandler.prototype.disconnect = function() {
		if (this.tracker) {
			this.tracker.close();
		}
	};
	return ImportHandler;
});