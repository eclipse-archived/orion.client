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
/*global define */
define(['orion/edit/dispatcher'], function() {
	/**
	 * @name orion.edit.Dispatcher
	 * @class Forwards events from an {@link orion.editor.Editor} to interested services.
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry 
	 * @param {orion.editor.Editor} editor
	 */
	function Dispatcher(serviceRegistry, editor) {
		this.serviceRegistry = serviceRegistry;
		this.editor = editor;
	}
	Dispatcher.prototype = /** @lends orion.edit.Dispatcher.prototype */ {
		wire: function() {
			var listeners = this.serviceRegistry.getServiceReferences("orion.edit.model");
			for (var i=0; i < listeners.length; i++) {
				var listener = listeners[i];
				this._wireService(listener, this.serviceRegistry.getService(listener));
			}
		},
		_wireService: function(serviceReference, service) {
			var types = serviceReference.getProperty("types");
			if (!types) { return; }
			for (var i=0; i < types.length; i++) {
				var type = types[i];
				var method = service["on" + type];	// bad convention
				if (method) {
					this._wireServiceMethod(service, method, type);
				}
			}
		},
		_wireServiceMethod: function(service, serviceMethod, type) {
			//console.debug("Connect " + type + " -> " + ("on" + type));
			this.editor.getTextView().addEventListener(type, function(event) {
				serviceMethod(event).then(/*No return value*/);
			}, false);
		}
	};
	return {Dispatcher: Dispatcher};
});