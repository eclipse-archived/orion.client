/******************************************************************************* 
 * @license
 * Copyright (c) 2014 Pivotal Software Inc. and others
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Pivotal Software Inc. - initial API and implementation 
 ******************************************************************************/

/*global define window */

define([
	'orion/Deferred',
	'orion/edit/liveEditorContext'
], function(Deferred, LiveEditorContext) {
	

var resource;
var services = [];
var previousEditSession;

var LiveEditSession = (function () {
	/**
	 * @name orion.LiveEditSession
	 * @class Provides access to validation services registered with the service registry.
	 * @description Provides access to validation services registered with the service registry.
	 */
	function LiveEditSession(serviceRegistry, editor) {
		this.registry = serviceRegistry;
		this.editor = editor;
	}

	LiveEditSession.prototype = /** @lends orion.LiveEditSession.prototype */ {
		/**
		 * Looks up applicable live edit sessions, calls them to pass editor context to services.
		 */
		start: function (contentType, title, contents) {
			function getLiveEditors(registry, contentType) {
				var contentTypeService = registry.getService("orion.core.contentTypeRegistry"); //$NON-NLS-0$
				function getFilteredLiveEditSession(registry, liveEditSession, contentType) {
					var contentTypeIds = liveEditSession.getProperty("contentType"); //$NON-NLS-0$
					return contentTypeService.isSomeExtensionOf(contentType, contentTypeIds).then(function(result) {
						return result ? liveEditSession : null;
					});
				}
				var liveEditSessions = registry.getServiceReferences("orion.edit.live"); //$NON-NLS-0$
				var filteredLiveEditSessions = [];
				for (var i=0; i < liveEditSessions.length; i++) {
					var serviceReference = liveEditSessions[i];
					var pattern = serviceReference.getProperty("pattern"); // backwards compatibility //$NON-NLS-0$
					if (serviceReference.getProperty("contentType")) { //$NON-NLS-0$
						filteredLiveEditSessions.push(getFilteredLiveEditSession(registry, serviceReference, contentType));
					} else if (pattern && new RegExp(pattern).test(title)) {
						var d = new Deferred();
						d.resolve(serviceReference);
						filteredLiveEditSessions.push(d);
					}
				}
				// Return a promise that gives the validators that aren't null
				return Deferred.all(filteredLiveEditSessions, function(error) {return {_error: error}; }).then(
					function(liveEditSessions) {
						var capableLiveEditSessions = [];
						for (var i=0; i < liveEditSessions.length; i++) {
							var liveEdit = liveEditSessions[i];
							if (liveEdit && !liveEdit._error) {
								capableLiveEditSessions.push(liveEdit);
							}
						}
						return capableLiveEditSessions;
					});
			}
			
			if (resource !== title) {
				if (services) {
					services.forEach(function(service) {
						service.endEdit(resource);
					});
				}
				services = [];
				resource = title;
				if (!contentType) {
					return;
				}
				var self = this;
				var serviceRegistry = this.registry;
				getLiveEditors(serviceRegistry, contentType).then(function(liveEditors) {
					var editSessionPromises = liveEditors.map(function(liveEditor) {
						var service = serviceRegistry.getService(liveEditor);
						var promise;
						if (service.startEdit) {
							var context = {
								contentType: contentType.id,
								title: title
							};
							services.push(service);
							var editorContext = LiveEditorContext.getEditorContext(serviceRegistry);
							return service.startEdit(editorContext, context);
						}
					});
						
					previousEditSession = Deferred.all(editSessionPromises, function(error) {return {_error: error}; });
				});
			}
		}
	};
	return LiveEditSession;
}());
return {LiveEditSession: LiveEditSession};
});
