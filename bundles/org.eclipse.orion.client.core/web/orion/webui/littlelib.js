/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global window document */

define(['require'], function(require) {

	function $(selector, node) {
		if (!node) {
			node = document;
		}
		return node.querySelector(selector);
	}
	
	function $$(selector, node) {
		if (!node) {
			node = document;
		}
		return node.querySelectorAll(selector);
	}
	
	function $$array(selector, node) {
		return Array.prototype.slice.call($$(selector,node));
	}
		
	function node(either) {
		var theNode = either;
		if (typeof(either) === "string") { //$NON-NLS-0$
			theNode = document.getElementById(either);
		}	
		return theNode;
	}
	
	function contains(parent, child) {
		return parent === child || Boolean(parent.compareDocumentPosition(child) & 16);
	}
	
	function bounds(node) {
		var clientRect = node.getBoundingClientRect();
		return { 
			left: clientRect.left + document.body.scrollLeft,
			top: clientRect.top + document.body.scrollTop,
			width: clientRect.width,
			height: clientRect.height
		};
	}
	
	// TODO check IE10 to see if necessary
	function stop(event) {
		if (window.document.all) { 
			event.keyCode = 0;
		} else { 
			event.preventDefault();
			event.stopPropagation();
		}
	}
	
	var KEY = {
		ENTER: 13,
		ESCAPE: 27,
		SPACE: 32,
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40
	};
		
	//return module exports
	return {
		$: $,
		$$: $$,
		$$array: $$array,
		node: node,
		contains: contains,
		bounds: bounds,
		stop: stop,
		KEY: KEY
	};
});