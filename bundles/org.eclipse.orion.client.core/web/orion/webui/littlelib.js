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
/*global window define document */

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
		var compare = parent.compareDocumentPosition(child);  // useful to break out for debugging
		return parent === child || Boolean(compare & 16);
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
	
	function empty(node) {
		while (node.hasChildNodes()) {
			var child = node.firstChild;
			node.removeChild(child);
		}
	}
	
	var variableRegEx = /\$\{([^\}]+)\}/;
	
	function processTextNodes(node, messages) {
		if (node.nodeType === 3) { // TEXT_NODE
			var matches = variableRegEx.exec(node.nodeValue);
			if (matches && matches.length > 1) {
				node.parentNode.replaceChild(document.createTextNode(messages[matches[1]]), node);
			}
		}
		if (node.hasChildNodes()) {
			for (var i=0; i<node.childNodes.length; i++) {
				processTextNodes(node.childNodes[i], messages);
			}
		}
	}
	
	var autoDismissNodes = [];
	
	function addAutoDismiss(excludeNodes, dismissFunction) {
		// auto dismissal.  Click anywhere else means close.
		// Hook listener only once
		if (autoDismissNodes.length === 0) {
			document.addEventListener("click", function(event) { //$NON-NLS-0$
				var stillInDocument = [];  // while we are going through the list, keep a list of the ones still connected to the document
				for (var i=0; i<autoDismissNodes.length; i++) {
					var exclusions = autoDismissNodes[i].excludeNodes;
					var dismiss = autoDismissNodes[i].dismiss;
					var inDocument = false;
					var shouldDismiss = true;
					for (var j=0; j<exclusions.length; j++) {
						inDocument = document.compareDocumentPosition(document, exclusions[j]) !== 1; // DOCUMENT_POSITION_DISCONNECTED = 0x01;
						if (inDocument && contains(exclusions[j], event.target)) {
							shouldDismiss = false;
							break;
						} 
					}
					if (shouldDismiss) {
						dismiss();
						// might have been removed as part of the dismiss processing
						inDocument = document.compareDocumentPosition(document, exclusions[j]) !== 1; // DOCUMENT_POSITION_DISCONNECTED = 0x01;
					}
					if (inDocument) {
						stillInDocument.push(autoDismissNodes[i]);
					}
				}
				autoDismissNodes = stillInDocument;
			}, true); //$NON-NLS-0$
		}
		autoDismissNodes.push({excludeNodes: excludeNodes, dismiss: dismissFunction});
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
		empty: empty,
		stop: stop,
		processTextNodes: processTextNodes,
		addAutoDismiss: addAutoDismiss,
		KEY: KEY
	};
});