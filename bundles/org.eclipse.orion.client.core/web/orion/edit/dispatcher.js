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
	 * @param {orion.file.ContentType} contentType
	 */
	function Dispatcher(serviceRegistry, editor, contentType) {
		this.serviceRegistry = serviceRegistry;
		this.editor = editor;
		this.contentType = contentType;
		this.contentTypeService = serviceRegistry.getService("orion.file.contenttypes");
		if (this.editor.getTextView()) {
			this._wire();
		} else {
			var self = this;
			this.editor.addEventListener("TextViewInstalled", function() {
				self._wire();
			});
		}
	}
	Dispatcher.prototype = /** @lends orion.edit.Dispatcher.prototype */ {
		_wire: function() {
			// Find registered services that are interested in this contenttype
			var listeners = this.serviceRegistry.getServiceReferences("orion.edit.model");
			for (var i=0; i < listeners.length; i++) {
				var listener = listeners[i], listenerContentType = listener.getProperty("contentType");
				if (typeof listenerContentType !== undefined && listenerContentType !== null) {
					var self = this;
					this.contentTypeService.isSomeExtensionOf(this.contentType, listenerContentType).then(
						function(isSupported) {
							if (isSupported) {
								self._wireService(listener, self.serviceRegistry.getService(listener));
							}
						});
				 }
			}
		},
		_wireService: function(serviceReference, service) {
			var types = serviceReference.getProperty("types");
			var textView = this.editor.getTextView();
			if (!types) { return; }
			for (var i=0; i < types.length; i++) {
				var type = types[i];
				var method = service["on" + type];
				if (method) {
					this._wireServiceMethod(service, method, textView, type);
				}
			}
		},
		_wireServiceMethod: function(service, serviceMethod, textView, type) {
			//console.debug("Connect " + type + " -> " + ("on" + type));
			textView.addEventListener(type, function(event) {
				serviceMethod(event).then(/*No return value*/);
			}, false);
		}
	};
	return {Dispatcher: Dispatcher};
});