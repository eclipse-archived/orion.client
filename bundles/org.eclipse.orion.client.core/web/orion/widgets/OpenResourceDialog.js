/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*jslint browser:true*/
/*global define window dojo dijit*/

define(['dojo', 'dijit', 'dijit/Dialog', 'dijit/form/TextBox',
		'orion/widgets/_OrionDialogMixin', 'text!orion/widgets/templates/OpenResourceDialog.html'], function(dojo, dijit) {

/**
 * Usage: <code>new widgets.OpenResourceDialog(options).show();</code>
 * 
 * @name orion.widgets.OpenResourceDialog
 * @class A dialog that searches for files by name or wildcard.
 * @param {String} [options.title] Text to display in the dialog's titlebar.
 * @param {String} options.SearchLocation The URL to use for searching the workspace.
 * @param {orion.searchClient.Searcher} options.searcher The searcher to use for displaying results.
 */
var OpenResourceDialog = dojo.declare("orion.widgets.OpenResourceDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin],
		/** @lends orion.widgets.OpenResourceDialog.prototype */ {
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'widgets/templates/OpenResourceDialog.html'),
	
	SEARCH_DELAY: 500,
	timeoutId: null,
	time: null,
	options: null,
	searchLocation: null,
	searcher: null,
	
	/** @private */
	constructor : function() {
		this.inherited(arguments);
		this.timeoutId = null;
		this.time = 0;
		this.options = arguments[0];
		this.searchLocation = this.options && this.options.SearchLocation;
		this.searcher = this.options && this.options.searcher;
		if (!this.searchLocation) {
			throw new Error("Missing required argument: SearchLocation");
		}
		if (!this.searcher) {
			throw new Error("Missing required argument: searcher");
		}
	},
	
	/** @private */
	postMixInProperties : function() {
		this.options.title = this.options.title || "Open Resource";
		this.selectFile = "Type the name of a file to open (? = any character, * = any string):";
		this.searchPlaceHolder = "Search";
		this.inherited(arguments);
	},
	
	/** @private */
	postCreate: function() {
		this.inherited(arguments);
		dojo.connect(this.resourceName, "onChange", this, function(evt) {
			this.time = +new Date();
			clearTimeout(this.timeoutId);
			this.timeoutId = setTimeout(dojo.hitch(this, this.checkSearch), 0);
		});
		dojo.connect(this.resourceName, "onKeyPress", this, function(evt) {
			if (evt.keyCode === dojo.keys.ENTER && this.results) {
				var links = dojo.query("a", this.results);
				if (links.length > 0) {
					window.open(links[0].href);
					this.hide();
				}
			}
		});
		dojo.connect(this, "onMouseUp", function(e) {
			// WebKit focuses <body> after link is clicked; override that
			e.target.focus();
		});
	},
	
	/** @private */
	checkSearch: function() {
		clearTimeout(this.timeoutId);
		var now = new Date().getTime();
		if ((now - this.time) > this.SEARCH_DELAY) {
			this.time = now;
			this.doSearch();
		} else {
			this.timeoutId = setTimeout(dojo.hitch(this, "checkSearch"), 50);
		}
	},
	
	/** @private */
	doSearch: function() {
		var text = this.resourceName && this.resourceName.get("value");
		if (!text) {
			return;
		}
		dojo.place("<div>Searching&#x2026;</div>", this.results, "only");
		// Gives Webkit a chance to show the "Searching" message
		var that = this;
		setTimeout(function() {
			var query = that.searcher.createSearchQuery(that.searchLocation, null, text);
			that.searcher.search(that.results, query, false, false, dojo.hitch(that, that.decorateResult), true /*no highlight*/);
		}, 0);
	},
	
	/** @private */
	decorateResult: function(resultsDiv) {
		var widget = this;
		dojo.query("a", resultsDiv).forEach(function(link) {
			dojo.connect(link, "onmouseup", function(evt) {
				if (!dojo.mouseButtons.isMiddle(evt) && !dojo.isCopyKey(evt)) {
					widget.hide();
				}
			});
		});
	},
	
	/**
	 * Displays the dialog.
	 */
	show: function() {
		this.inherited(arguments);
		this.resourceName.focus();
	},
	
	/** @private */
	onHide: function() {
		clearTimeout(this.timeoutId);
		this.inherited(arguments);
	}
	
});
return OpenResourceDialog;
});