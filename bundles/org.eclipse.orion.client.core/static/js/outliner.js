/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 /*global eclipse:true dojo document window*/
 var eclipse = eclipse || {};
 
 /**
 * Constructs a new Outliner with the given options.
 * @name eclipse.Outliner
 * @class An Outliner provides an itemized overview of a resource and acts as a selection
 * provider on that resource.
 * @param {Object} options The options object which must specify the parent, serviceRegistry, and an optional selectionService.
 *	specifying a selectionService indicates that the selection service should be notified on outline selection rather than using
 *	anchor tag hrefs.
 */
eclipse.Outliner = function(options) {
	this._init(options);	
};
	
eclipse.Outliner.prototype = {
	_init: function(options) {
		var parent = options.parent;
		if (typeof(parent) === "string") {
			parent = dojo.byId(parent);
		}
		if (!parent) { throw "no parent"; }
		if (!options.serviceRegistry) {throw "no service registry"; }
		this._parent = parent;
		this._selectionService = options.selectionService;
		var outliner = this;
		options.serviceRegistry.getService("orion.edit.outline").then(function(service) {
			service.addEventListener("resourceChanged", function(resource) {
				outliner.render(resource);
			});
		});
		
	},
	
	_createLink: function(name, href, parentNode) {
		var link = dojo.create("a", null, parentNode, "last");
		// if there is no selection service, we rely on normal link following
		if (!this._selectionService) {
			link.href = href;
		} else {
			dojo.style(link, "cursor", "pointer");
		}
		dojo.addClass(link, "navlinkonpage");
		dojo.place(document.createTextNode(name), link);
		dojo.create("br", null, parentNode, "last");
		// if a selection service has been specified, we will use it for link selection.
		// Otherwise we assume following the href in the anchor tag is enough.
		if (this._selectionService) {
			var selectionService = this._selectionService;
			var url = href;
			dojo.connect(link, "onclick", link, function(event) {
				if (eclipse.util.openInNewWindow(event)) {
					eclipse.util.followLink(url, event);
				} else {
					selectionService.setSelections(url);
				}
			});
		}
	},
	// this is closely tied to the jslint format right now
	render: function(resource) {
		if (resource.title && resource.title.indexOf(".js") === resource.title.length - 3) {
			var items = dojo.create("div");
			var functions = resource.data.functions;
			for (var k in functions) {
				var f = functions[k];
				var pLength = f.param ? f.param.length : 0;
				var name = f.name;
				var isAnonymousFunction = false;
				if (name[0]==='"') {
					isAnonymousFunction = true;
					f.name = name = name.substring(1, name.length-1);
					// name = "<i>" + name;
					name = name;
				}
				name += "(";
				if (f.param) {
					var first = true;
					for (var l in f.param) {
						if (first) {
							first = false;
						} else {
							name += ",";
						}
						name += f.param[l];
					}
				}
				name += ")";
				if (isAnonymousFunction) {
					// name += "</i>";
				}
				var nonHash = window.location.href.split('#')[0];
				var href = nonHash +  eclipse.util.hashFromPosition(resource.title, null, null, f.line, null, null, f.name);
				this._createLink(name, href, items);
			}
			dojo.place(items, this._parent, "only");
		} else if (resource.title.indexOf(".html") === resource.title.length - 5) {
			var items = dojo.create("div");
			var pattern = /id=['"]\S*["']/gi; // experimental: |<head[^>]*|<body[^>]*|<script[^>]*/gi;
			var result;
			while ((result = pattern.exec(resource.contents)) !== null) {
				var start, end, name;
				start = result.index;
				name = result[0];
				if (name[0]==='<') {
					name = "&lt;" + name.substring(1) + "&gt;";
					start += 1;
					end = start + name.length;
				} else {
					start += 4;
					name = name.substring(4, name.length-1);
					end = start+name.length;
				}
				var nonHash = window.location.href.split('#')[0];
				var href = nonHash +  eclipse.util.hashFromPosition(resource.title, start, end);
				this._createLink(name, href, items);
			}
			dojo.place(items, this._parent, "only");
		}
	}	
};

eclipse.OutlineService = function(serviceRegistry) {
	this._serviceRegistry = serviceRegistry;
	this._serviceRegistration = serviceRegistry.registerService("orion.edit.outline", this);
};

eclipse.OutlineService.prototype = {
	// provider
	_setItems: function(resource) {
		this.resource = resource;
		this._serviceRegistration.dispatchEvent("resourceChanged", resource);
		
	}      
};
 

