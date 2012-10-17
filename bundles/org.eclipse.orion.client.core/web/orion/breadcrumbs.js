/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global window define document */

define(['require', 'dojo'], function(require, dojo) {

	/**
	 * Constructs a new BreadCrumb with the given options.
	 * @param {Object} options The options object which must specify the parent container
	 * @param options.container The parent container for the bread crumb presentation
	 * @param options.resource The current resource
	 * @param options.rootSegmentName The name to use for the root segment in lieu of the metadata name.  Optional.
	 * @param options.workspaceRootSegmentName The name to use for the workspace root. If not specified, the workspace root
	 * will not be shown.
	 * @param [options.makeHref] The call back function to make the href on a bread crumb item. If not defined "/navigate/table.html#" is used.
	 * @param [option.getFirstSegment] The call back function to make DOM node for the first segment in breadcrumb. 
	 * @class Bread crumbs show the current position within a resource tree and allow navigation
	 * to different places in the tree. Unlike the fairy tale, bread crumbs typically don't lead
	 * to a cottage made of gingerbread. Sorry!
	 * @name orion.breadcrumbs.BreadCrumbs
	 */
	function BreadCrumbs(options) {
		this._init(options);		
	}
	BreadCrumbs.prototype = /** @lends orion.breadcrumbs.BreadCrumbs.prototype */ {
		_init: function(options) {
			var container = options.container;
			if (typeof(container) === "string") { //$NON-NLS-0$
				container = dojo.byId(container);
			}
			if (!container) { throw "no parent container"; } //$NON-NLS-0$
			this._container = container;
			dojo.removeClass(container, "currentLocation"); //$NON-NLS-0$
			this._id = options.id || "eclipse.breadcrumbs"; //$NON-NLS-0$
			this._resource = options.resource|| null;
			this._rootSegmentName = options.rootSegmentName;
			this._workspaceRootSegmentName = options.workspaceRootSegmentName;
			this._makeHref = options.makeHref;
			this.path = "";
			this.render();
		},
		getNavigatorWorkspaceRootSegment: function(){
			if (this._workspaceRootSegmentName) {
				var seg;
				if (this._resource && this._resource.Parents) {
					seg = document.createElement('a'); //$NON-NLS-0$
					if(this._makeHref) {
						this._makeHref(seg , "");
					} else {
						seg.href = require.toUrl("navigate/table.html") + "#"; //$NON-NLS-1$ //$NON-NLS-0$
					}
				} else {
					seg = document.createElement('span'); //$NON-NLS-0$
				}
				dojo.place(document.createTextNode(this._workspaceRootSegmentName), seg, "only"); //$NON-NLS-0$
				return seg;
			}
			return null;
		},

		render: function() {
			var container = this._container;
			var crumbs = dojo.byId(this._id);
			if (crumbs) {
				dojo.empty(crumbs);
			} else {
				crumbs = document.createElement('span'); //$NON-NLS-0$
				crumbs.id = this._id;
				container.appendChild(crumbs);
			}
			var seg, slash;
			seg = this.getNavigatorWorkspaceRootSegment();
			if (seg) {
				dojo.addClass(seg, "breadcrumb"); //$NON-NLS-0$
				crumbs.appendChild(seg);
				if (this._resource && this._resource.Parents) {
					slash = document.createElement('span'); //$NON-NLS-0$
					dojo.place(document.createTextNode(' / '), slash, "only"); //$NON-NLS-1$ //$NON-NLS-0$
					this.path+="/"; //$NON-NLS-0$
					dojo.addClass(slash, "breadcrumbSeparator"); //$NON-NLS-0$
					crumbs.appendChild(slash);
				} else {
					// we are at the root.  Get rid of any href since we are already here
					seg.href = "";
					// don't need the breadcrumb style because we are here.
					dojo.removeClass(seg, "breadcrumb"); //$NON-NLS-0$
					dojo.addClass(seg, "currentLocation"); //$NON-NLS-0$
					return;
				}
			}
			var firstSegmentName = this._rootSegmentName;
			if (this._resource) {
				if (this._resource.Parents) {
				// walk up the parent chain and insert a crumb for each parent
					var parents = this._resource.Parents;
					for (var i = parents.length; --i >= 0 ;){
						seg = document.createElement('a'); //$NON-NLS-0$
						dojo.addClass(seg, "breadcrumb"); //$NON-NLS-0$
						if (firstSegmentName) {
							dojo.place(document.createTextNode(firstSegmentName), seg, "only"); //$NON-NLS-0$
							firstSegmentName = null;
						} else {
							dojo.place(document.createTextNode(parents[i].Name), seg, "only"); //$NON-NLS-0$
						}
						this.path += parents[i].Name; 
						if(this._makeHref) {
							this._makeHref(seg , parents[i].Location);
						}
						else {
							seg.href = require.toUrl("navigate/table.html") +"#" + parents[i].ChildrenLocation; //$NON-NLS-1$ //$NON-NLS-0$
						}
						crumbs.appendChild(seg);
						slash = document.createElement('span'); //$NON-NLS-0$
						dojo.place(document.createTextNode(' / '), slash, "only"); //$NON-NLS-1$ //$NON-NLS-0$
						this.path += '/'; //$NON-NLS-0$
						dojo.addClass(slash, "breadcrumbSeparator"); //$NON-NLS-0$
						crumbs.appendChild(slash);
					}
				}
				//add a final entry for the current location
				seg = document.createElement('span'); //$NON-NLS-0$
				if (firstSegmentName) {
					dojo.place(document.createTextNode(firstSegmentName), seg, "only"); //$NON-NLS-0$
					firstSegmentName = null;
				} else {
					dojo.place(document.createTextNode(this._resource.Name), seg, "only"); //$NON-NLS-0$
				}				
				dojo.addClass(seg, "currentLocation"); //$NON-NLS-0$
				this.path+=this._resource.Name;
				crumbs.appendChild(seg);
			} 
			// if we had no resource, or had no parents, we need some kind of current location in the breadcrumb
			if (crumbs.childNodes.length === 0) {
				seg = document.createElement('span'); //$NON-NLS-0$
				dojo.place(document.createTextNode(firstSegmentName || document.title), seg, "only"); //$NON-NLS-0$
				dojo.addClass(seg, "breadcrumb"); //$NON-NLS-0$
				dojo.addClass(seg, "currentLocation"); //$NON-NLS-0$
				crumbs.appendChild(seg);
			}
		}
	};
	BreadCrumbs.prototype.constructor = BreadCrumbs;
	//return the module exports
	return {BreadCrumbs: BreadCrumbs};
});