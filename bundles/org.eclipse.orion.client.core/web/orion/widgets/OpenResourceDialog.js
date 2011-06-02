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
/*global window dojo dijit*/


define(['dojo', 'dijit', 'dijit/Dialog', 'dijit/form/TextBox', 'text!orion/widgets/templates/OpenResourceDialog.html'], function(dojo, dijit) {

//dojo.require("dijit.Dialog");
//dojo.require("dijit._Widget");
//dojo.require("dijit._Templated");

/**
 * Usage: new widgets.OpenResourceDialog(options).show();
 * 
 * @param options {{ SearchLocation: string,
 *                   searcher: {eclipse.Searcher} }}
 */
var OpenResourceDialog = dojo.declare("orion.widgets.OpenResourceDialog", [dijit._Widget, dijit._Templated], {
	widgetsInTemplate : true,
	templateString : dojo.cache(new dojo._Url("/orion/widgets/templates/OpenResourceDialog.html")),
	
	SEARCH_DELAY: 500,
	timeoutId: null,
	time: null,
	searchLocation: null,
	searcher: null,
	
	constructor : function() {
		this.inherited(arguments);
		this.timeoutId = null;
		this.time = 0;
		this.searchLocation = arguments[0] && arguments[0].SearchLocation;
		this.searcher = arguments[0] && arguments[0].searcher;
		if (!this.searchLocation) {
			throw new Error("Missing required argument: SearchLocation");
		}
		if (!this.searcher) {
			throw new Error("Missing required argument: searcher");
		}
	},
	
	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = "Open Resource";
		this.selectFile = "Type the name of a file to open (? = any character, * = any string):";
		this.searchPlaceHolder = "Search";
	},
	
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
					this.dialog.hide();
				}
			}
		});
		dojo.connect(this.dialog, "onMouseUp", function(e) {
			// WebKit focuses <body> after link is clicked; override that
			e.target.focus();
		});
		dojo.connect(this.dialog, "onHide", this, function() {
			this.onHide();
		});
		this.dialog.refocus = false; // Dojo 10654
	},
	
	checkSearch: function() {
		clearTimeout(this.timeoutId);
		var now = +new Date();
		if ((now - this.time) > this.SEARCH_DELAY) {
			this.time = now;
			this.doSearch();
		} else {
			this.timeoutId = setTimeout(dojo.hitch(this, arguments.callee), 50);
		}
	},
	
	doSearch: function() {
		var text = this.resourceName && this.resourceName.get("value");
		if (!text) {
			return;
		}
		dojo.place("<div>Searching&#x2026;</div>", this.results, "only");
		// Gives Webkit a chance to show the "Searching" message
		var that = this;
		setTimeout(function() {
			var formatted = text += (/\*$/.test(text) ? "" : "*");
			var query = that.searchLocation + "Name:" + formatted;
			that.searcher.search(that.results, query, false, false, dojo.hitch(that, that.decorateResult), true /*no highlight*/);
		}, 0);
	},
	
	decorateResult: function(resultsDiv) {
		var widget = this;
		dojo.query("a", resultsDiv).forEach(function(link) {
			dojo.connect(link, "onmouseup", function(evt) {
				if (!dojo.mouseButtons.isMiddle(evt) && !dojo.isCopyKey(evt)) {
					widget.dialog.hide();
				}
			});
		});
	},
	
	show: function() {
		this.dialog.show();
		this.resourceName.focus();
	},
	
	onHide: function() {
		clearTimeout(this.timeoutId);
		setTimeout(dojo.hitch(this, function() {
			this.dialog.destroyRecursive();
			this.destroyRecursive(); // doesn't destroy child widgets from our template (dojo bug?)
		}), this.dialog.duration);
	}
	
});
return OpenResourceDialog;
});