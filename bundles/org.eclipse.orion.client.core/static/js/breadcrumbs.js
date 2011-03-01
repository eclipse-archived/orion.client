/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo window eclipse*/

/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

 /**
 * BreadCrumbs show the current position within a resource tree and allow navigation
 * to different places in the tree.
 * @name eclipse.BreadCrumbs
 */
eclipse.BreadCrumbs = (function() {
	/**
 	 * Constructs a new BreadCrumb with the given options.
	 * @param {Object} options The options object which must specify the parent container
	 * @param options.container The parent container for the bread crumb presentation
	 * @param options.resource The current resource
	 */
	function BreadCrumbs(options) {
		this._init(options);		
	}
	BreadCrumbs.prototype = /** @lends eclipse.BreadCrumbs.prototype */ {
		_init: function(options) {
			var container = options.container;
			if (typeof(container) === "string") {
				container = dojo.byId(container);
			}
			if (!container) { throw "no parent container"; }
			this._container = container;
			this._id = options.id || "eclipse.breadcrumbs";
			this._resource = options.resource|| null;
			this.render();
		},

		render: function() {
			var container = this._container;
			var crumbs = dojo.byId(this._id);
			if (crumbs) {
				dojo.empty(crumbs);
			} else {
				crumbs = document.createElement('span');
				crumbs.id = this._id;
				container.appendChild(crumbs);
			}
			//add the root location
			var seg = document.createElement('a');
			dojo.addClass(seg, "breadcrumb");
			dojo.place(document.createTextNode("root"), seg, "only");
			seg.href = "#";
			crumbs.appendChild(seg);

			// walk up the parent chain and insert a crumb for each parent
			if (this._resource && this._resource.Parents) {
				var slash = document.createElement('span');
				dojo.place(document.createTextNode('/'), slash, "only");
				dojo.addClass(slash, "breadcrumb");
				crumbs.appendChild(slash);
				var parents = this._resource.Parents;
				for (var i = parents.length; --i >= 0 ;){
					var seg = document.createElement('a');
					dojo.addClass(seg, "breadcrumb");
					dojo.place(document.createTextNode(parents[i].Name), seg, "only");
					seg.href = "#" + parents[i].ChildrenLocation;
					crumbs.appendChild(seg);
					var slash = document.createElement('span');
					dojo.place(document.createTextNode('/'), slash, "only");
					dojo.addClass(slash, "breadcrumb");
					crumbs.appendChild(slash);
				}
				//add a final entry for the current location
				if (this._resource) {
					var seg = document.createElement('a');
					dojo.place(document.createTextNode(this._resource.Name), seg, "only");
					dojo.addClass(seg, "breadcrumb");
					dojo.addClass(seg, "currentLocation");
					crumbs.appendChild(seg);
				}
			}
		}
	};
	return BreadCrumbs;
})();