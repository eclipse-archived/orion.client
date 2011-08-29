/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 /*global define document window*/
 
define(['dojo', 'orion/util'], function(dojo, mUtil) {

	/**
	 * Constructs a new Outliner with the given options.
	 * @name orion.outliner.Outliner
	 * @class An Outliner is a visual component that renders an itemized overview of a resource and acts as 
	 * a selection provider on that resource. The itemized overview is obtained from the {@link orion.outliner.OutlineService}.
	 * @param {Object} options The options object
	 * @param {Object} options.parent The parent DOM element to put this outliner inside
	 * @param {Service of type orion.outliner.OutlineService} options.outlineService The outline service to use.
	 * @param {orion.selection.Selection} [options.selectionService] If provided, the 
	 * selection service will be notified on outline selection rather than using anchor tag hrefs.
	 */
	function Outliner(options) {
		this._init(options);
	}
	Outliner.prototype = /** @lends orion.outliner.Outliner.prototype */ {
		_init: function(options) {
			var parent = options.parent;
			if (typeof(parent) === "string") {
				parent = dojo.byId(parent);
			}
			if (!parent) { throw "no parent"; }
			if (!options.outlineService) {throw "no outline service"; }
			this._parent = parent;
			this._outlineService = options.outlineService;
			this._selectionService = options.selectionService;
			var outliner = this;
			dojo.when(this._outlineService, function(service) {
				service.addEventListener("resourceChanged", function() {
					outliner.render.apply(outliner, arguments);
				});
			});
		},
		/** @returns {DOMNode} */
		_createLink: function(text, href, parentNode) {
			var link = dojo.create("a", null, parentNode, "last");
			// if there is no selection service, we rely on normal link following
			if (!this._selectionService) {
				link.href = href;
			} else {
				dojo.style(link, "cursor", "pointer");
			}
			dojo.addClass(link, "navlinkonpage");
			dojo.place(document.createTextNode(text), link);
			// if a selection service has been specified, we will use it for link selection.
			// Otherwise we assume following the href in the anchor tag is enough.
			if (this._selectionService) {
				var selectionService = this._selectionService;
				var url = href;
				dojo.connect(link, "onclick", link, function(event) {
					if (mUtil.openInNewWindow(event)) {
						mUtil.followLink(url, event);
					} else {
						selectionService.setSelections(url);
					}
				});
			}
			return link;
		},
		render: function(outlineModel, title) {
			outlineModel = outlineModel instanceof Array ? outlineModel : [outlineModel];
			if (outlineModel) {
				var topNode = dojo.create("ul", {className: "outline"});
				for (var i=0; i < outlineModel.length; i++) {
					this._renderElement(topNode, outlineModel[i], title);
				}
				dojo.place(topNode, this._parent, "only");
			}
		},
		_renderElement: function(parentNode, element, title) {
			if (!element) {
				return;
			}
			var elementNode = dojo.create("li", null, parentNode, "last");
			if (element.className) {
				dojo.addClass(elementNode, element.className);
			}
			if (element.href) {
				this._createLink(element.label, element.href, elementNode);
			} else if (element.line || element.column || element.start) {
				var start = element.start || null,
				    end = element.end || null,
				    line = element.line || null,
				    offset = element.column || null,
				    text = element.text || null,
				    href = mUtil.hashFromPosition(title, start, end, line, offset, null, text);
				this._createLink(element.label, href, elementNode);
			} else if (element.label) {
				dojo.place(document.createTextNode(element.label), elementNode, "only");
			}
			var children = element.children;
			if (children) {
				var newParent = dojo.create("ul", null, elementNode, "last");
				for (var i = 0; i < children.length; i++) {
					this._renderElement(newParent, children[i], title);
				}
			}
		}
	};
	Outliner.prototype.constructor = Outliner;
	
	/**
	 * Constructs a new outline service. Clients should obtain an outline service by requesting 
	 * the service <tt>orion.edit.outline</tt> from the service registry. This service constructor 
	 * is only intended to be used by page service registry initialization code.
	 * @name orion.outliner.OutlineService
	 * @class <code>OutlineService</code> dispatches an event when an outline for a resource is available.
	 * Clients may listen to the service's <code>resourceChanged</code> event to receive notification when this occurs.
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry The service registry to
	 * use for services required by this outline service.
	 */
	function OutlineService(serviceRegistry) {
		this._serviceRegistry = serviceRegistry;
		this._serviceRegistration = serviceRegistry.registerService("orion.edit.outline", this);
	}
	OutlineService.prototype = /** @lends orion.outliner.OutlineService.prototype */ {
		setOutline: function(outline, title) {
			this.outline = outline;
			this._serviceRegistration.dispatchEvent("resourceChanged", outline, title);
		}
	};
	OutlineService.prototype.constructor = OutlineService;
	
	//return module exports
	return {
		Outliner: Outliner,
		OutlineService: OutlineService
	};
});

