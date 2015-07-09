/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/* eslint-env amd */
define([

], function() {
	/* eslint-disable missing-nls */
	var attributes = Object.create(null);
	
	attributes.globals = [
			{
				name: "aria",
				url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA",
				doc: "Accessible Rich Internet Applications (ARIA) defines ways to make Web content and Web applications (especially those developed with Ajax and JavaScript) more accessible to people with disabilities. For example, ARIA enables accessible navigation landmarks, JavaScript widgets, form hints and error messages, live content updates, and more."
			},
			{
				name : "accesskey",
				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/accesskey",
				doc: "Provides a hint for generating a keyboard shortcut for the current element. This attribute consists of a space-separated list of characters. The browser should use the first one that exists on the computer keyboard layout."
			},
			{
 				name: "class",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/class",
 				doc: "Is a space-separated list of the classes of the element. Classes allows CSS and JavaScript to select and access specific elements via the class selectors or functions like the method Document.getElementsByClassName()."
 			},
 			{
 				name: "contenteditable",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable",
 				doc: "Is an enumerated attribute indicating if the element should be editable by the user. If so, the browser modifies its widget to allow editing. The attribute must take one of the following values:"
						+ "\n* true or the empty string, which indicates that the element must be editable"
						+ "\n* false, which indicates that the element must not be editable."
 			},
 			{
 				name: "contextmenu",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contextmenu",
 				doc: "Is the id of an <menu> to use as the contextual menu for this element."
 			},
 			{
 				name: "dataset",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*",
 				doc: "Forms a class of attributes, called custom data attributes, that allow proprietary information to be exchanged between the HTML and its DOM representation that may be used by scripts. All such custom data are available via the HTMLElement interface of the element the attribute is set on. The HTMLElement.dataset property gives access to them."
 			},
 			{
 				name: "dir",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir",
 				doc: "Is an enumerated attribute indicating the directionality of the element's text. It can have the following values:"
						+"\n* ltr, which means left to right and is to be used for languages that are written from the left to the right (like English)"
						+"\n* rtl, which means right to left and is to be used for languages that are written from the right to the left (like Arabic)"
						+"\n* auto, which let the user agent decides. It uses a basic algorithm as it parses the characters inside the element until it finds a character with a strong directionality, then apply that directionality to the whole element"
 			},
 			{
 				name: "draggable",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/draggable",
 				doc: "Is an enumerated attribute indicating whether the element can be dragged, using the Drag and Drop API. It can have the following values:"
						+"\n* true, which indicates that the element may be dragged"
						+"\n* false, which indicates that the element may not be dragged",
 				experimental: true
 			},
 			{
 				name: "dropzone",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dropzone",
 				doc: "Is an enumerated attribute indicating what types of content can be dropped on an element, using the Drag and Drop API. It can have the following values:"
						+"\n* copy, which indicates that dropping will create a copy of the element that was dragged"
						+"\n* move, which indicates that the element that was dragged will be moved to this new location"
						+"\n* link, will create a link to the dragged data",
 				experimental: true
 			},
 			{
 				name: "hidden",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden",
 				doc: "Is a Boolean attribute indicates that the element is not yet, or is no longer, relevant. For example, it can be used to hide elements of the page that can't be used until the login process has been completed. The browser won't render such elements. This attribute must not be used to hide content that could legitimately be shown."
 			},
 			{
 				name: "id",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id",
 				doc: "Defines a unique identifier (ID) which must be unique in the whole document. Its purpose is to identify the element when linking (using a fragment identifier), scripting, or styling (with CSS)."
 			},
 			{
 				name: "itemid",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemid",
 				doc: "This attribute is related to the WHATWG HTML Microdata feature.",
 				experimental: true
 			},
 			{
 				name: "itemprop",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemprop",
 				doc: "This attribute is related to the WHATWG HTML Microdata feature.",
 				experimental: true
 			},
 			{
 				name: "itemref",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemref",
 				doc: "This attribute is related to the WHATWG HTML Microdata feature.",
 				experimental: true
 			},
 			{
 				name: "itemscope",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemscope",
 				doc: "This attribute is related to the WHATWG HTML Microdata feature.",
 				experimental: true
 			},
 			{
 				name: "itemtype",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemtype",
 				doc: "This attribute is related to the WHATWG HTML Microdata feature.",
 				experimental: true
 			},
 			{
 				name: "lang",
 				url: "/en-US/docs/Web/HTML/Global_attributes/lang",
 				doc: "Participates in defining the language of the element, the language that non-editable elements are written in or the language that editable elements should be written in. The tag contains one single entry value in the format defines in the Tags for Identifying Languages (BCP47) IETF document. xml:lang has priority over it."
 			},
 			{
 				name: "spellcheck",
				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/spellcheck",
				doc: "Is an enumerated attribute defines whether the element may be checked for spelling errors. It may have the following values:"
	 					+ "\n* true, which indicates that the element should be, if possible, checked for spelling errors"
  						+ "\n* false, which indicates that the element should not be checked for spelling errors",
  				experimental: true
 			},
 			{
 				name: "style",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/style",
 				doc: "Contains CSS styling declarations to be applied to the element. Note that it is recommended for styles to be defined in a separate file or files. This attribute and the <style> element have mainly the purpose of allowing for quick styling, for example for testing purposes."
 			},
 			{
 				name: "tabindex",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex",
 				doc: "Is an integer attribute indicates if the element can take input focus (is focusable), if it should participate to sequential keyboard navigation, and if so, at what position. It can takes several values:"
						+"\n* a negative value means that the element should be focusable, but should not be reachable via sequential keyboard navigation"
						+"\n* 0 means that the element should be focusable and reachable via sequential keyboard navigation, but its relative order is defined by the platform convention"
						+"\n* a positive value which means should be focusable and reachable via sequential keyboard navigation; its relative order is defined by the value of the attribute: the sequential follow the increasing number of the tabindex. If several elements share the same tabindex, their relative order follows their relative position in the document)"
			},
			{
	 			name: "title",
	 			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/title",
	 			doc: "Contains a text representing advisory information related to the element it belongs to. Such information can typically, but not necessarily, be presented to the user as a tooltip."
 			},
 			{
 				name: "translate",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/translate",
 				doc: "Is an enumerated attribute that is used to specify whether an element's attribute values and the values of its Text node children are to be translated when the page is localized, or whether to leave them unchanged. It can have the following values:"
						+"\n* empty string and \"yes\", which indicates that the element will be translated"
						+"\n* \"no\", which indicates that the element will not be translated"
 			}
	];
	
	attributes.windowevents = [
		//Window events
		{
			name: "onafterprint",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onafterprint",
			doc: "The WindowEventHandlers.onafterprint property sets and returns the onafterprint EventHandler for the current window."
		},
		{
			name: "onbeforeprint",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers.onbeforeprint",
			doc: "The onbeforeprint property sets and returns the onbeforeprint event handler code for the current window."
		},
		{
			name: "onbeforeunload",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload",
			doc: "An event that fires when a window is about to unload its resources. The document is still visible and the event is still cancelable."
		},
		{
			name : "onerror",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror",
			doc: "An event handler for runtime script errors."
		},
		{
			name: "onhashchange",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onhashchange",
			doc: "The hashchange event fires when a window's hash changes (see location.hash)."
		},
		{
			name: "onload",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onload",
			doc: "An event handler for the load event of a window."
		},
		{
			name: "onmessage",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/onmessage",
			doc: "An event handler for message events"
		},
		{
			name: "onoffline",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/Document/onoffline",
			doc: "This event handler is called when an offline is fired on body and bubbles up, when navigator.onLine property changes and becomes false."
		},
		{
			name: "ononline",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/Document/ononline",
			doc: "\"online\" event is fired on the <body> of each page when the browser switches between online and offline mode. Additionally, the events bubble up from document.body, to document, ending at window. Both events are non-cancellable (you can't prevent the user from coming online, or going offline)."
		},
		{
			name: "onpagehide",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpagehide",
			doc: "Is an EventHandler representing the code to be called when the pagehide event is raised."
		},
		{
			name: "onpageshow",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpageshow",
			doc: "Is an EventHandler representing the code to be called when the pageshow event is raised."
		},
		{
			name: "onpopstate",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate",
			doc: "An event handler for the popstate event on the window."
		},
		{
			name: "onresize",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onresize",
			doc: "Is an EventHandler representing the code to be called when the resize event is raised."
		},
		{
			name: "onstorage",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onstorage",
			doc: "Is an EventHandler representing the code to be called when the storage event is raised."
		},
		{
			name: "onunload",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onunload",
			doc: "Is an EventHandler representing the code to be called when the unload event is raised."
		},
	];
	
	attributes.formevents = [
		//Form events
		{
			name: "onblur",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onblur",
			doc: "The onblur property returns the onBlur event handler code, if any, that exists on the current element."
		},
		{
			name: "onchange",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onchange",
			doc: "The onchange property sets and returns the event handler for the change event."
		},
		{
			name: "oncontextmenu",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/oncontextmenu",
			doc: "An event handler property for right-click events on the window. Unless the default behavior is prevented (see examples below on how to do this), the browser context menu will activate (though IE8 has a bug with this and will not activate the context menu if a contextmenu event handler is defined). Note that this event will occur with any non-disabled right-click event and does not depend on an element possessing the \"contextmenu\" attribute."
		},
		{
			name: "onfocus",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onfocus",
			doc: "The onfocus property returns the onFocus event handler code on the current element."
		},
		{
			name: "oninput",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/oninput",
			doc: "An event handler for the input event on the window. The input event is raised when an <input> element value changes. "
		},
		{
			name: "oninvalid",
			url: "",
			doc: "The oninvalid event occurs when a submittable <input> element is invalid."
		},
		{
			name: "onreset",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onreset",
			doc: "The GlobalEventHandlers.onreset property contains an EventHandler triggered when a reset event is received."
		},
		{
			name: "onsearch",
			url: "",
			doc: "The onsearch attribute fires when a user presses the \"ENTER\" key or clicks the \"x\" button in an <input> element with type=\"search\"."
		},
		{
			name: "onselect",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onselect",
			doc: "An event handler for the select event on the window."
		},
		{
			name: "onsubmit",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onsubmit",
			doc: "An event handler for the submit event on the window."
		}
	];

	attributes.keyboardevents = [
		//Keyboard events
		{
			name: "onkeydown",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onkeydown",
			doc: "The onkeydown property returns the onKeyDown event handler code on the current element."
		},
		{
			name: "onkeypress",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onkeypress",
			doc: "The onkeypress property sets and returns the onKeyPress event handler code for the current element."
		},
		{
			name: "onkeyup",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onkeyup",
			doc: "The onkeyup property returns the onKeyUp event handler code for the current element."
		},
	];
	attributes.mouseevents = [
		//Mouse events
		{
			name: "onclick",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onclick",
			doc: "The onclick property returns the click event handler code on the current element."
		},
		{
			name: "ondblclick",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/ondblclick",
			doc: "The ondblclick property returns the onDblClick event handler code on the current element."
		},
		{
			name: "ondrag",
			url: "http://www.w3schools.com/tags/ev_ondrag.asp",
			doc: "The ondrag attribute fires when an element or text selection is being dragged."
		},
		{
			name: "ondragend",
			url: "http://www.w3schools.com/tags/ev_ondragend.asp",
			doc: "The ondragend attribute fires when the user has finished dragging an element or text selection."
		},
		{
			name: "ondragenter",
			url: "http://www.w3schools.com/tags/ev_ondragenter.asp",
			doc: "The ondragenter attribute fires when a draggable element or text selection enters a valid drop target."
		},
		{
			name: "ondragleave",
			url: "http://www.w3schools.com/tags/ev_ondragleave.asp",
			doc: "The ondragleave attribute fires when a draggable element or text selection leaves a valid drop target."
		},
		{
			name: "ondragover",
			url: "http://www.w3schools.com/tags/ev_ondragover.asp",
			doc: "The ondragover attribute fires when a draggable element or text selection is being dragged over a valid drop target."
		},
		{
			name: "ondragstart",
			url: "http://www.w3schools.com/tags/ev_ondragstart.asp",
			doc: "The ondragstart attribute fires when the user starts to drag an element or text selection."
		},
		{
			name: "ondrop",
			url: "http://www.w3schools.com/tags/ev_ondrop.asp",
			doc: "The ondrop attribute fires when a draggable element or text selection is dropped on a valid drop target."
		},
		{
			name: "onmousedown",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onmousedown",
			doc: "The onmousedown property returns the onmousedown event handler code on the current element."
		},
		{
			name: "onmousemove",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onmousemove",
			doc: "The onmousemove property returns the mousemove event handler code on the current element."
		},
		{
			name: "onmouseout",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onmouseout",
			doc: "The onmouseout property returns the onMouseOut event handler code on the current element."
		},
		{
			name: "onmouseover",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onmouseover",
			doc: "The onmouseover property returns the onMouseOver event handler code on the current element."
		},
		{
			name: "onmouseup",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onmouseup",
			doc: "The onmouseup property returns the onMouseUp event handler code on the current element."
		},
		{
			name: "onmousewheel",
			url: "",
			doc: "Deprecated. Use the onwheel attribute instead"
		},
		{
			name: "onscroll",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onscroll",
			doc: "An event handler for scroll events on element."
		},
		{
			name: "onwheel",
			url: "http://www.w3schools.com/tags/ev_onwheel.asp",
			doc: "The onwheel attribute fires when the wheel of a pointing device is rolled up or down over an element."
		}
	];
	
	/**
	 * @description Returns the set of attributes that apply to the given DOM node
	 * @param {Object} node The DOM node to get attributes for
	 * @returns {Array.<Object>} The array of attributes for the given node or an empty array, never null
	 * @since 10.0
	 */
	function getAttributesForNode(node) {
		var attrs = [].concat(attributes.globals, attributes.windowevents, attributes.keyboardevents, attributes.formevents, attributes.mouseevents);
		//TODO add scoped attributes		
		return attrs;
	}
	
	return {
		getAttributesForNode: getAttributesForNode
	}
});