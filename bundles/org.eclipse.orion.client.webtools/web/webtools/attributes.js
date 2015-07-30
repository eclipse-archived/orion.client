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
	/*
	 * ADDED MISSING TAGS
	 * - xmlns
	 */
	attributes.globals = [
			{
				name: "aria",
				category: "Global attribute",
				url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA",
				doc: "Accessible Rich Internet Applications (ARIA) defines ways to make Web content and Web applications (especially those developed with Ajax and JavaScript) more accessible to people with disabilities. For example, ARIA enables accessible navigation landmarks, JavaScript widgets, form hints and error messages, live content updates, and more."
			},
			{
				name : "accesskey",
				category: "Global attribute",
				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/accesskey",
				doc: "Provides a hint for generating a keyboard shortcut for the current element. This attribute consists of a space-separated list of characters. The browser should use the first one that exists on the computer keyboard layout."
			},
			{
 				name: "class",
 				category: "Global attribute",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/class",
 				doc: "Is a space-separated list of the classes of the element. Classes allows CSS and JavaScript to select and access specific elements via the class selectors or functions like the method Document.getElementsByClassName()."
 			},
 			{
 				name: "contenteditable",
 				category: "Global attribute",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable",
 				doc: "Is an enumerated attribute indicating if the element should be editable by the user. If so, the browser modifies its widget to allow editing. The attribute must take one of the following values:"
						+ "\n* true or the empty string, which indicates that the element must be editable"
						+ "\n* false, which indicates that the element must not be editable."
 			},
 			{
 				name: "contextmenu",
 				category: "Global attribute",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contextmenu",
 				doc: "Is the id of an <menu> to use as the contextual menu for this element."
 			},
 			{
 				name: "dataset",
 				category: "Global attribute",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*",
 				doc: "Forms a class of attributes, called custom data attributes, that allow proprietary information to be exchanged between the HTML and its DOM representation that may be used by scripts. All such custom data are available via the HTMLElement interface of the element the attribute is set on. The HTMLElement.dataset property gives access to them."
 			},
 			{
 				name: "dir",
 				category: "Global attribute",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir",
 				doc: "Is an enumerated attribute indicating the directionality of the element's text. It can have the following values:"
						+"\n* ltr, which means left to right and is to be used for languages that are written from the left to the right (like English)"
						+"\n* rtl, which means right to left and is to be used for languages that are written from the right to the left (like Arabic)"
						+"\n* auto, which let the user agent decides. It uses a basic algorithm as it parses the characters inside the element until it finds a character with a strong directionality, then apply that directionality to the whole element"
 			},
 			{
 				name: "draggable",
 				category: "Global attribute",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/draggable",
 				doc: "Is an enumerated attribute indicating whether the element can be dragged, using the Drag and Drop API. It can have the following values:"
						+"\n* true, which indicates that the element may be dragged"
						+"\n* false, which indicates that the element may not be dragged",
 				experimental: true
 			},
 			{
 				name: "dropzone",
 				category: "Global attribute",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dropzone",
 				doc: "Is an enumerated attribute indicating what types of content can be dropped on an element, using the Drag and Drop API. It can have the following values:"
						+"\n* copy, which indicates that dropping will create a copy of the element that was dragged"
						+"\n* move, which indicates that the element that was dragged will be moved to this new location"
						+"\n* link, will create a link to the dragged data",
 				experimental: true
 			},
 			{
 				name: "hidden",
 				category: "Global attribute",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden",
 				doc: "Is a Boolean attribute indicates that the element is not yet, or is no longer, relevant. For example, it can be used to hide elements of the page that can't be used until the login process has been completed. The browser won't render such elements. This attribute must not be used to hide content that could legitimately be shown."
 			},
 			{
 				name: "id",
 				category: "Global attribute",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id",
 				doc: "Defines a unique identifier (ID) which must be unique in the whole document. Its purpose is to identify the element when linking (using a fragment identifier), scripting, or styling (with CSS)."
 			},
// 			{
// 				name: "itemid",
// 				category: "Global attribute",
// 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemid",
// 				doc: "This attribute is related to the WHATWG HTML Microdata feature.",
// 				experimental: true
// 			},
// 			{
// 				name: "itemprop",
// 				category: "Global attribute",
// 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemprop",
// 				doc: "This attribute is related to the WHATWG HTML Microdata feature.",
// 				experimental: true
// 			},
// 			{
// 				name: "itemref",
// 				category: "Global attribute",
// 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemref",
// 				doc: "This attribute is related to the WHATWG HTML Microdata feature.",
// 				experimental: true
// 			},
// 			{
// 				name: "itemscope",
// 				category: "Global attribute",
// 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemscope",
// 				doc: "This attribute is related to the WHATWG HTML Microdata feature.",
// 				experimental: true
// 			},
// 			{
// 				name: "itemtype",
// 				category: "Global attribute",
// 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemtype",
// 				doc: "This attribute is related to the WHATWG HTML Microdata feature.",
// 				experimental: true
// 			},
 			{
 				name: "lang",
 				category: "Global attribute",
 				url: "/en-US/docs/Web/HTML/Global_attributes/lang",
 				doc: "Participates in defining the language of the element, the language that non-editable elements are written in or the language that editable elements should be written in. The tag contains one single entry value in the format defines in the Tags for Identifying Languages (BCP47) IETF document. xml:lang has priority over it."
 			},
 			{
 				name: "spellcheck",
 				category: "Global attribute",
				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/spellcheck",
				doc: "Is an enumerated attribute defines whether the element may be checked for spelling errors. It may have the following values:"
	 					+ "\n* true, which indicates that the element should be, if possible, checked for spelling errors"
  						+ "\n* false, which indicates that the element should not be checked for spelling errors",
  				experimental: true
 			},
 			{
 				name: "style",
 				category: "Global attribute",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/style",
 				doc: "Contains CSS styling declarations to be applied to the element. Note that it is recommended for styles to be defined in a separate file or files. This attribute and the <style> element have mainly the purpose of allowing for quick styling, for example for testing purposes."
 			},
 			{
 				name: "tabindex",
 				category: "Global attribute",
 				url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex",
 				doc: "Is an integer attribute indicates if the element can take input focus (is focusable), if it should participate to sequential keyboard navigation, and if so, at what position. It can takes several values:"
						+"\n* a negative value means that the element should be focusable, but should not be reachable via sequential keyboard navigation"
						+"\n* 0 means that the element should be focusable and reachable via sequential keyboard navigation, but its relative order is defined by the platform convention"
						+"\n* a positive value which means should be focusable and reachable via sequential keyboard navigation; its relative order is defined by the value of the attribute: the sequential follow the increasing number of the tabindex. If several elements share the same tabindex, their relative order follows their relative position in the document)"
			},
			{
	 			name: "title",
 				category: "Global attribute",
	 			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/title",
	 			doc: "Contains a text representing advisory information related to the element it belongs to. Such information can typically, but not necessarily, be presented to the user as a tooltip."
 			},
 			{
 				name: "translate",
 				category: "Global attribute",
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
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onafterprint",
			doc: "The WindowEventHandlers.onafterprint property sets and returns the onafterprint EventHandler for the current window."
		},
		{
			name: "onbeforeprint",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers.onbeforeprint",
			doc: "The onbeforeprint property sets and returns the onbeforeprint event handler code for the current window."
		},
		{
			name: "onbeforeunload",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload",
			doc: "An event that fires when a window is about to unload its resources. The document is still visible and the event is still cancelable."
		},
		{
			name : "onerror",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror",
			doc: "An event handler for runtime script errors."
		},
		{
			name: "onhashchange",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onhashchange",
			doc: "The hashchange event fires when a window's hash changes (see location.hash)."
		},
		{
			name: "onload",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onload",
			doc: "An event handler for the load event of a window."
		},
		{
			name: "onmessage",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/onmessage",
			doc: "An event handler for message events"
		},
		{
			name: "onoffline",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/Document/onoffline",
			doc: "This event handler is called when an offline is fired on body and bubbles up, when navigator.onLine property changes and becomes false."
		},
		{
			name: "ononline",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/Document/ononline",
			doc: "\"online\" event is fired on the <body> of each page when the browser switches between online and offline mode. Additionally, the events bubble up from document.body, to document, ending at window. Both events are non-cancellable (you can't prevent the user from coming online, or going offline)."
		},
		{
			name: "onpagehide",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpagehide",
			doc: "Is an EventHandler representing the code to be called when the pagehide event is raised."
		},
		{
			name: "onpageshow",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpageshow",
			doc: "Is an EventHandler representing the code to be called when the pageshow event is raised."
		},
		{
			name: "onpopstate",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate",
			doc: "An event handler for the popstate event on the window."
		},
		{
			name: "onresize",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onresize",
			doc: "Is an EventHandler representing the code to be called when the resize event is raised."
		},
		{
			name: "onstorage",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onstorage",
			doc: "Is an EventHandler representing the code to be called when the storage event is raised."
		},
		{
			name: "onunload",
 			category: "Window event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onunload",
			doc: "Is an EventHandler representing the code to be called when the unload event is raised."
		},
	];
	
	attributes.formevents = [
		//Form events
		{
			name: "onblur",
 			category: "Form event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onblur",
			doc: "The onblur property returns the onBlur event handler code, if any, that exists on the current element."
		},
		{
			name: "onchange",
 			category: "Form event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onchange",
			doc: "The onchange property sets and returns the event handler for the change event."
		},
		{
			name: "oncontextmenu",
 			category: "Form event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/oncontextmenu",
			doc: "An event handler property for right-click events on the window. Unless the default behavior is prevented (see examples below on how to do this), the browser context menu will activate (though IE8 has a bug with this and will not activate the context menu if a contextmenu event handler is defined). Note that this event will occur with any non-disabled right-click event and does not depend on an element possessing the \"contextmenu\" attribute."
		},
		{
			name: "onfocus",
 			category: "Form event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onfocus",
			doc: "The onfocus property returns the onFocus event handler code on the current element."
		},
		{
			name: "oninput",
 			category: "Form event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/oninput",
			doc: "An event handler for the input event on the window. The input event is raised when an <input> element value changes. "
		},
		{
			name: "oninvalid",
 			category: "Form event",
			url: "",
			doc: "The oninvalid event occurs when a submittable <input> element is invalid."
		},
		{
			name: "onreset",
 			category: "Form event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onreset",
			doc: "The GlobalEventHandlers.onreset property contains an EventHandler triggered when a reset event is received."
		},
		{
			name: "onsearch",
 			category: "Form event",
			url: "",
			doc: "The onsearch attribute fires when a user presses the \"ENTER\" key or clicks the \"x\" button in an <input> element with type=\"search\"."
		},
		{
			name: "onselect",
 			category: "Form event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onselect",
			doc: "An event handler for the select event on the window."
		},
		{
			name: "onsubmit",
 			category: "Form event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onsubmit",
			doc: "An event handler for the submit event on the window."
		}
	];

	attributes.keyboardevents = [
		//Keyboard events
		{
			name: "onkeydown",
 			category: "Keyboard event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onkeydown",
			doc: "The onkeydown property returns the onKeyDown event handler code on the current element."
		},
		{
			name: "onkeypress",
 			category: "Keyboard event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onkeypress",
			doc: "The onkeypress property sets and returns the onKeyPress event handler code for the current element."
		},
		{
			name: "onkeyup",
 			category: "Keyboard event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onkeyup",
			doc: "The onkeyup property returns the onKeyUp event handler code for the current element."
		},
	];
	attributes.mouseevents = [
		//Mouse events
		{
			name: "onclick",
 			category: "Mouse event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onclick",
			doc: "The onclick property returns the click event handler code on the current element."
		},
		{
			name: "ondblclick",
 			category: "Mouse event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/ondblclick",
			doc: "The ondblclick property returns the onDblClick event handler code on the current element."
		},
		{
			name: "ondrag",
 			category: "Mouse event",
			url: "http://www.w3schools.com/tags/ev_ondrag.asp",
			doc: "The ondrag attribute fires when an element or text selection is being dragged."
		},
		{
			name: "ondragend",
 			category: "Mouse event",
			url: "http://www.w3schools.com/tags/ev_ondragend.asp",
			doc: "The ondragend attribute fires when the user has finished dragging an element or text selection."
		},
		{
			name: "ondragenter",
 			category: "Mouse event",
			url: "http://www.w3schools.com/tags/ev_ondragenter.asp",
			doc: "The ondragenter attribute fires when a draggable element or text selection enters a valid drop target."
		},
		{
			name: "ondragleave",
 			category: "Mouse event",
			url: "http://www.w3schools.com/tags/ev_ondragleave.asp",
			doc: "The ondragleave attribute fires when a draggable element or text selection leaves a valid drop target."
		},
		{
			name: "ondragover",
 			category: "Mouse event",
			url: "http://www.w3schools.com/tags/ev_ondragover.asp",
			doc: "The ondragover attribute fires when a draggable element or text selection is being dragged over a valid drop target."
		},
		{
			name: "ondragstart",
 			category: "Mouse event",
			url: "http://www.w3schools.com/tags/ev_ondragstart.asp",
			doc: "The ondragstart attribute fires when the user starts to drag an element or text selection."
		},
		{
			name: "ondrop",
 			category: "Mouse event",
			url: "http://www.w3schools.com/tags/ev_ondrop.asp",
			doc: "The ondrop attribute fires when a draggable element or text selection is dropped on a valid drop target."
		},
		{
			name: "onmousedown",
 			category: "Mouse event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onmousedown",
			doc: "The onmousedown property returns the onmousedown event handler code on the current element."
		},
		{
			name: "onmousemove",
 			category: "Mouse event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onmousemove",
			doc: "The onmousemove property returns the mousemove event handler code on the current element."
		},
		{
			name: "onmouseout",
 			category: "Mouse event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onmouseout",
			doc: "The onmouseout property returns the onMouseOut event handler code on the current element."
		},
		{
			name: "onmouseover",
 			category: "Mouse event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onmouseover",
			doc: "The onmouseover property returns the onMouseOver event handler code on the current element."
		},
		{
			name: "onmouseup",
 			category: "Mouse event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onmouseup",
			doc: "The onmouseup property returns the onMouseUp event handler code on the current element."
		},
		{
			name: "onmousewheel",
 			category: "Mouse event",
			url: "",
			doc: "Deprecated. Use the onwheel attribute instead"
		},
		{
			name: "onscroll",
 			category: "Mouse event",
			url: "https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onscroll",
			doc: "An event handler for scroll events on element."
		},
		{
			name: "onwheel",
 			category: "Mouse event",
			url: "http://www.w3schools.com/tags/ev_onwheel.asp",
			doc: "The onwheel attribute fires when the wheel of a pointing device is rolled up or down over an element."
		}
	];
	
	attributes.tags = Object.create(null);
	attributes.tags.a = [
		{
			name: "download",
			category: "<a> attribute",
			doc: "This attribute, if present, indicates that the author intends the hyperlink to be used for downloading a resource so that when the user clicks on the link they will be prompted to save it as a local file. If the attribute has a value, the value will be used as the pre-filled file name in the Save prompt that opens when the user clicks on the link (the user can change the name before actually saving the file of course). There are no restrictions on allowed values (though / and \ will be converted to underscores, preventing specific path hints), but you should consider that most file systems have limitations with regard to what punctuation is supported in file names, and browsers are likely to adjust file names accordingly.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-download"
		},
		{
			name: "href",
			category: "<a> attribute",
			doc: "This was the single required attribute for anchors defining a hypertext source link, but is no longer required in HTML5. Omitting this attribute creates a placeholder link. The href attribute indicates the link target, either a URL or a URL fragment. A URL fragment is a name preceded by a hash mark (#), which specifies an internal target location (an ID) within the current document. URLs are not restricted to Web (HTTP)-based documents. URLs might use any protocol supported by the browser. For example, file, ftp, and mailto work in most user agents.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-href"
		},
		{
			name: "hreflang",
			category: "<a> attribute",
			doc: "This attribute indicates the language of the linked resource. It is purely advisory. Allowed values are determined by BCP47 for HTML5 and by RFC1766 for HTML4. Use this attribute only if the href attribute is present.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-hreflang"
		},
		{
			name: "media",
			category: "<a> attribute",
			doc: "This attribute specifies the media which the linked resource applies to. Its value must be a media query. This attribute is mainly useful when linking to external stylesheets by allowing the user agent to pick the best adapted one for the device it runs on.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-media"
		},
		{
			name: "ping",
			category: "<a> attribute",
			doc: "The 'ping' attribute, if present, sends the URLs of the resources a notification/ping if the user follows the hyperlink.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-ping"
		},
		{
			name: "rel",
			category: "<a> attribute",
			doc: "For anchors containing the href attribute, this attribute specifies the relationship of the target object to the link object. The value is a comma-separated list of link types values. The values and their semantics will be registered by some authority that might have meaning to the document author. The default relationship, if no other is given, is void. Use this attribute only if the href attribute is present.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-rel"
		},
		{
			name: "shape",
			category: "<a> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-shape"
		},
		{
			name: "target",
			category: "<a> attribute",
			doc: "This attribute specifies where to display the linked resource. In HTML4, this is the name of, or a keyword for, a frame. In HTML5, it is a name of, or keyword for, a browsing context (for example, tab, window, or inline frame). The following keywords have special meanings:"
					+"* _self: Load the response into the same HTML4 frame (or HTML5 browsing context) as the current one. This value is the default if the attribute is not specified"
					+"* _blank: Load the response into a new unnamed HTML4 window or HTML5 browsing context"
					+"* _parent: Load the response into the HTML4 frameset parent of the current frame or HTML5 parent browsing context of the current one. If there is no parent, this option behaves the same way as _self"
					+"* _top: In HTML4: Load the response into the full, original window, canceling all other frames. In HTML5: Load the response into the top-level browsing context (that is, the browsing context that is an ancestor of the current one, and has no parent). If there is no parent, this option behaves the same way as _self",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-target"
		},
		{
			name: "type",
			category: "<a> attribute",
			doc: "This attribute specifies the media type in the form of a MIME type for the link target. Generally, this is provided strictly as advisory information; however, in the future a browser might add a small icon for multimedia types. For example, a browser might add a small speaker icon when type is set to audio/wav. For a complete list of recognized MIME types, see http://www.w3.org/TR/html4/references.html#ref-MIMETYPES. Use this attribute only if the href attribute is present.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-type"
		}
		// Obsolete attributes
//		{
//			name: "charset",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Obsolete",
//			doc: "This attribute defines the character encoding of the linked resource. The value is a space- and/or comma-delimited list of character sets as defined in RFC 2045. The default value is ISO-8859-1.",
//			obsolete: "HTML 5"
//		},
//		{
//			name: "coords",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Obsolete",
//			doc: "For use with object shapes, this attribute uses a comma-separated list of numbers to define the coordinates of the object on the page.",
//			obsolete: "HTML 5"
//		},
//		{
//			name: "name",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Obsolete",
//			doc: "This attribute is required in an anchor defining a target location within a page. A value for name is similar to a value for the id core attribute and should be an alphanumeric identifier unique to the document. Under the HTML 4.01 specification, id and name both can be used with the <a> element as long as they have identical values.",
//			obsolete: "HTML 5"
//		},
//		{
//			name: "rev",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Obsolete",
//			doc: "This attribute specifies a reverse link, the inverse relationship of the rel attribute. It is useful for indicating where an object came from, such as the author of a document.",
//			obsolete: "HTML 5"
//		},
//		{
//			name: "shape",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Obsolete",
//			doc: "This attribute is used to define a selectable region for hypertext source links associated with a figure to create an image map. The values for the attribute are circle, default, polygon, and rect. The format of the coords attribute depends on the value of shape. For circle, the value is x,y,r where x and y are the pixel coordinates for the center of the circle and r is the radius value in pixels. For rect, the coords attribute should be x,y,w,h. The x,y values define the upper-left-hand corner of the rectangle, while w and h define the width and height respectively. A value of polygon for shape requires x1,y1,x2,y2,... values for coords. Each of the x,y pairs defines a point in the polygon, with successive points being joined by straight lines and the last point joined to the first. The value default for shape requires that the entire enclosed area, typically an image, be used.",
//			obsolete: "HTML 5"
//		}
	];

	attributes.tags.applet = [
		{
			name: "align",
			category: "<applet> attribute",
			doc: "Specifies the horizontal alignment of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/applet#attr-align"
		},
		{
			name: "code",
			category: "<applet> attribute",
			doc: "Specifies the URL of the applet's class file to be loaded and executed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/applet#attr-code"
		},
		{
			name: "codebase",
			category: "<applet> attribute",
			doc: "This attribute gives the absolute or relative URL of the directory where applets' .class files referenced by the code attribute are stored.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/applet#attr-codebase"
		}
	];

	attributes.tags.area = [
		{
			name: "coords",
			category: "<area> attribute",
			doc: "A set of values specifying the coordinates of the hot-spot region.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#attr-coords"
		},
		{
			name: "download",
			category: "<area> attribute",
			doc: "Indicates that the hyperlink is to be used for downloading a resource.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#attr-download"
		},
		{
			name: "href",
			category: "<area> attribute",
			doc: "The URL of a linked resource.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#attr-href"
		},
		{
			name: "hreflang",
			category: "<area> attribute",
			doc: "Specifies the language of the linked resource.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#attr-hreflang"
		},
		{
			name: "media",
			category: "<area> attribute",
			doc: "Specifies a hint of the media for which the linked resource was designed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#attr-media"
		},
		{
			name: "ping",
			category: "<area> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#attr-ping"
		},
		{
			name: "rel",
			category: "<area> attribute",
			doc: "Specifies the relationship of the target object to the link object.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#attr-rel"
		},
		{
			name: "shape",
			category: "<area> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#attr-shape"
		},
		{
			name: "target",
			category: "<area> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#attr-target"
		}
	];

	attributes.tags.audio = [
		{
			name: "autoplay",
			category: "<audio> attribute",
			doc: "The audio or video should play as soon as possible.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-autoplay"
		},
		{
			name: "buffered",
			category: "<audio> attribute",
			doc: "Contains the time range of already buffered media.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-buffered"
		},
		{
			name: "controls",
			category: "<audio> attribute",
			doc: "Indicates whether the browser should show playback controls to the user.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-controls"
		},
		{
			name: "loop",
			category: "<audio> attribute",
			doc: "Indicates whether the media should start playing from the start when it's finished.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-loop"
		},
		{
			name: "preload",
			category: "<audio> attribute",
			doc: "Indicates whether the whole resource, parts of it or nothing should be preloaded.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-preload"
		},
		{
			name: "src",
			category: "<audio> attribute",
			doc: "The URL of the embeddable content.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-src"
		}
	];

	attributes.tags.base = [
		{
			name: "href",
			category: "<base> attribute",
			doc: "The URL of a linked resource.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base#attr-href"
		},
		{
			name: "target",
			category: "<base> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base#attr-target"
		}
	];

	attributes.tags.basefont = [
		{
			name: "color",
			category: "<basefont> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/basefont#attr-color"
		}
	];

	attributes.tags.bgsound = [
		{
			name: "loop",
			category: "<bgsound> attribute",
			doc: "Indicates whether the media should start playing from the start when it's finished.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bgsound#attr-loop"
		}
	];

	attributes.tags.blockquote = [
		{
			name: "cite",
			category: "<blockquote> attribute",
			doc: "Contains a URI which points to the source of the quote or change.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote#attr-cite"
		}
	];

	attributes.tags.body = [
		{
			name: "bgcolor",
			category: "<body> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#attr-bgcolor"
		}
		// Obsolete attributes
//		{
//			name: "alink",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
//			doc: "Color of text for hyperlinks when selected. This method is non-conforming, use CSS color property in conjunction with the :active pseudo-class instead.",
//			obsolete: true
//		},
//		{
//			name: "background",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
//			doc: "URI of a image to use as a background. This method is non-conforming, use CSS background property on the element instead.",
//			obsolete: true
//		},
//		{
//			name: "bgcolor",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
//			doc: "Background color for the document. This method is non-conforming, use CSS background-color property on the element instead.",
//			obsolete: true
//		},
//		{
//			name: "bottommargin",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
//			doc: "The margin of the bottom of the body. This method is non-conforming, use CSS margin-bottom property on the element instead.",
//			obsolete: true
//		},
//		{
//			name: "leftmargin",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
//			doc: "The margin of the left of the body. This method is non-conforming, use CSS margin-left property on the element instead.",
//			obsolete: true
//		},
//		{
//			name: "link",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
//			doc: "Color of text for unvisited hypertext links. This method is non-conforming, use CSS color property in conjunction with the :link pseudo-class instead.",
//			obsolete: true
//		},
//		{
//			name: "rightmargin",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
//			doc: "The margin of the right of the body. This method is non-conforming, use CSS margin-right property on the element instead.",
//			obsolete: true
//		},
//		{
//			name: "text",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
//			doc: "Foreground color of text. This method is non-conforming, use CSS color property on the element instead.",
//			obsolete: true
//		},
//		{
//			name: "topmargin",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
//			doc: "The margin of the top of the body. This method is non-conforming, use CSS margin-top property on the element instead.",
//			obsolete: true
//		},
//		{
//			name: "vlink",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
//			doc: "Color of text for visited hypertext links. This method is non-conforming, use CSS color property in conjunction with the :visited pseudo-class instead.",
//			obsolete: true
//		}
	];
	
	// Obsolete tags
//	attributes.tags.br = [
//		{
//			name: "clear",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br#Attributes",
//			doc: "Indicates where to begin the next line after the break.",
//			obsolete: "HTML 5"
//		}
//	];

	attributes.tags.button = [
		{
			name: "autofocus",
			category: "<button> attribute",
			doc: "The element should be automatically focused after the page loaded.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attr-autofocus"
		},
		{
			name: "disabled",
			category: "<button> attribute",
			doc: "Indicates whether the user can interact with the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attr-disabled"
		},
		{
			name: "form",
			category: "<button> attribute",
			doc: "Indicates the form that is the owner of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attr-form"
		},
		{
			name: "formaction",
			category: "<button> attribute",
			doc: "Indicates the action of the element, overriding the action defined in the <form>.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attr-formaction"
		},
		{
			name: "name",
			category: "<button> attribute",
			doc: "Name of the element. For example used by the server to identify the fields in form submits.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attr-name"
		},
		{
			name: "type",
			category: "<button> attribute",
			doc: "Defines the type of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attr-type"
		},
		{
			name: "value",
			category: "<button> attribute",
			doc: "Defines a default value which will be displayed in the element on page load.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attr-value"
		}
	];

	attributes.tags.canvas = [
		{
			name: "height",
			category: "<canvas> attribute",
			doc: "Note: In some instances, such as <div>, this is a legacy attribute, in which case the CSS height property should be used instead. In other cases, such as <canvas>, the height must be specified with this attribute.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#attr-height"
		},
		{
			name: "width",
			category: "<canvas> attribute",
			doc: "Note: In some instances, such as <div>, this is a legacy attribute, in which case the CSS width property should be used instead. In other cases, such as <canvas>, the width must be specified with this attribute.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#attr-width"
		}
	];

	attributes.tags.caption = [
		{
			name: "align",
			category: "<caption> attribute",
			doc: "Specifies the horizontal alignment of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption#attr-align"
		}
	];

	attributes.tags.col = [
		{
			name: "align",
			category: "<col> attribute",
			doc: "Specifies the horizontal alignment of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col#attr-align"
		},
		{
			name: "bgcolor",
			category: "<col> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col#attr-bgcolor"
		},
		{
			name: "span",
			category: "<col> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col#attr-span"
		}
	];

	attributes.tags.colgroup = [
		{
			name: "align",
			category: "<colgroup> attribute",
			doc: "Specifies the horizontal alignment of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup#attr-align"
		},
		{
			name: "bgcolor",
			category: "<colgroup> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup#attr-bgcolor"
		},
		{
			name: "span",
			category: "<colgroup> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup#attr-span"
		}
	];

	attributes.tags.command = [
		{
			name: "checked",
			category: "<command> attribute",
			doc: "Indicates whether the element should be checked on page load.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/command#attr-checked"
		},
		{
			name: "disabled",
			category: "<command> attribute",
			doc: "Indicates whether the user can interact with the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/command#attr-disabled"
		},
		{
			name: "icon",
			category: "<command> attribute",
			doc: "Specifies a picture which represents the command.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/command#attr-icon"
		},
		{
			name: "radiogroup",
			category: "<command> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/command#attr-radiogroup"
		},
		{
			name: "type",
			category: "<command> attribute",
			doc: "Defines the type of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/command#attr-type"
		}
	];

	attributes.tags.del = [
		{
			name: "cite",
			category: "<del> attribute",
			doc: "Contains a URI which points to the source of the quote or change.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del#attr-cite"
		},
		{
			name: "datetime",
			category: "<del> attribute",
			doc: "Indicates the date and time associated with the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del#attr-datetime"
		}
	];

	attributes.tags.details = [
		{
			name: "open",
			category: "<details> attribute",
			doc: "Indicates whether the details will be shown on page load.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details#attr-open"
		}
	];

	attributes.tags.embed = [
		{
			name: "height",
			category: "<embed> attribute",
			doc: "Note: In some instances, such as <div>, this is a legacy attribute, in which case the CSS height property should be used instead. In other cases, such as <canvas>, the height must be specified with this attribute.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed#attr-height"
		},
		{
			name: "src",
			category: "<embed> attribute",
			doc: "The URL of the embeddable content.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed#attr-src"
		},
		{
			name: "type",
			category: "<embed> attribute",
			doc: "Defines the type of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed#attr-type"
		},
		{
			name: "width",
			category: "<embed> attribute",
			doc: "Note: In some instances, such as <div>, this is a legacy attribute, in which case the CSS width property should be used instead. In other cases, such as <canvas>, the width must be specified with this attribute.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed#attr-width"
		}
	];

	attributes.tags.fieldset = [
		{
			name: "disabled",
			category: "<fieldset> attribute",
			doc: "Indicates whether the user can interact with the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset#attr-disabled"
		},
		{
			name: "form",
			category: "<fieldset> attribute",
			doc: "Indicates the form that is the owner of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset#attr-form"
		},
		{
			name: "name",
			category: "<fieldset> attribute",
			doc: "Name of the element. For example used by the server to identify the fields in form submits.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset#attr-name"
		}
	];

	attributes.tags.font = [
		{
			name: "color",
			category: "<font> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/font#attr-color"
		}
	];

	attributes.tags.form = [
		{
			name: "accept",
			category: "<form> attribute",
			doc: "List of types the server accepts, typically a file type.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-accept"
		},
		{
			name: "accept-charset",
			category: "<form> attribute",
			doc: "List of supported charsets.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-accept-charset"
		},
		{
			name: "action",
			category: "<form> attribute",
			doc: "The URI of a program that processes the information submitted via the form.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-action"
		},
		{
			name: "autocomplete",
			category: "<form> attribute",
			doc: "Indicates whether controls in this form can by default have their values automatically completed by the browser.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-autocomplete"
		},
		{
			name: "enctype",
			category: "<form> attribute",
			doc: "Defines the content type of the form date when the method is POST.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-enctype"
		},
		{
			name: "method",
			category: "<form> attribute",
			doc: "Defines which HTTP method to use when submitting the form. Can be GET (default) or POST.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-method"
		},
		{
			name: "name",
			category: "<form> attribute",
			doc: "Name of the element. For example used by the server to identify the fields in form submits.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-name"
		},
		{
			name: "novalidate",
			category: "<form> attribute",
			doc: "This attribute indicates that the form shouldn't be validated when submitted.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-novalidate"
		},
		{
			name: "target",
			category: "<form> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-target"
		}
	];

	attributes.tags.hr = [
		{
			name: "align",
			category: "<hr> attribute",
			doc: "Specifies the horizontal alignment of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr#attr-align"
		},
		{
			name: "color",
			category: "<hr> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr#attr-color"
		},
		{
			name: "align",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr#Attributes",
			doc: "Sets the alignment of the rule on the page. If no value is specified, the default value is left.",
			deprecated: "HTML 4.01",
			obsolete: "HTML 5"
		}
		// Obsolete tags
//		{
//			name: "noshade",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr#Attributes",
//			doc: "Sets the rule to have no shading.",
//			deprecated: "HTML 4.01",
//			obsolete: "HTML 5"
//		},
//		{
//			name: "size",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr#Attributes",
//			doc: "Sets the height, in pixels, of the rule.",
//			deprecated: "HTML 4.01",
//			obsolete: "HTML 5"
//		},
//		{
//			name: "width",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr#Attributes",
//			doc: "Sets the length of the rule on the page through a pixel or percentage value.",
//			deprecated: "HTML 4.01",
//			obsolete: "HTML 5"
//		}
	];

	attributes.tags.html = [
		{
			name: "manifest",
			category: "<html> attribute",
			doc: "Specifies the URI of a resource manifest indicating resources that should be cached locally. See Using the application cache for details.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html#attr-manifest"
		},
		// Deprecated attributes
//		{
//			name: "version",
//			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html#Attributes",
//			doc: "Specifies the version of the HTML Document Type Definition that governs the current document. This attribute is not needed, because it is redundant with the version information in the document type declaration.",
//			deprecated: "HTML 4.01"
//		},
		{
			name: "xmlns",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html#attr-xmlns",
			doc: "Specifies the XML Namespace of the document. Default value is http://www.w3.org/1999/xhtml. This is required in XHTML, and optional in HTML5."
		}
	];

	attributes.tags.iframe = [
		{
			name: "align",
			category: "<iframe> attribute",
			doc: "The alignment of this element with respect to the surrounding context.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-align"
		},
		{
			name: "height",
			category: "<iframe> attribute",
			doc: "Indicates the height of the frame HTML5 in CSS pixels, or HTML 4.01 in pixels or as a percentage.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-height"
		},
		{
			name: "name",
			category: "<iframe> attribute",
			doc: "A name for the embedded browsing context (or frame). This can be used as the value of the target attribute of an <a> or <form> element, or the formtarget attribute of an <input> or <button> element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-name"
		},
		{
			name: "sandbox",
			category: "<iframe> attribute",
			doc: "If specified as an empty string, this attribute enables extra restrictions on the content that can appear in the inline frame. The value of the attribute can either be an empty string (all the restrictions are applied), or a space-separated list of tokens that lift particular restrictions. Valid tokens are:"
					+"* allow-same-origin: Allows the content to be treated as being from its normal origin. If this keyword is not used, the embedded content is treated as being from a unique origin"
					+"* allow-top-navigation: Allows the embedded browsing context to navigate (load) content to the top-level browsing context. If this keyword is not used, this operation is not allowed"
					+"* allow-forms: Allows the embedded browsing context to submit forms. If this keyword is not used, this operation is not allowed"
					+"* allow-popups: Allows popups (like from window.open, target=\"_blank\", showModalDialog). If this keyword is not used, that functionality will silently fail"
					+"* allow-scripts: Allows the embedded browsing context to run scripts (but not create pop-up windows). If this keyword is not used, this operation is not allowed"
					+"* allow-pointer-lock: Allows the embedded browsing context to use the Pointer Lock API"
					+"* allow-unsandboxed-auxiliary: (Chrome only) Allows a sandboxed document to open new windows without forcing the sandboxing flags upon them. This will allow, for example, a third-party advertisement to be safely sandboxed without forcing the same restrictions upon a landing page",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox"
		},
		{
			name: "seamless",
			category: "<iframe> attribute",
			doc: "This Boolean attribute indicates that the browser should render the inline frame in a way that makes it appear to be part of the containing document, for example by applying CSS styles that apply to the <iframe> to the contained document before styles specified in that document, and by opening links in the contained documents in the parent browsing context (unless another setting prevents this). In XHTML, attribute minimization is forbidden, and the seamless attribute must be defined as <iframe seamless=\"seamless\">.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-seamless"
		},
		{
			name: "src",
			category: "<iframe> attribute",
			doc: "The URL of the embeddable content.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-src"
		},
		{
			name: "srcdoc",
			category: "<iframe> attribute",
			doc:  "The content of the page that the embedded context is to contain. This attribute is expected to be used together with the sandbox and seamless attributes. If a browser supports the srcdoc attribute, it will override the content specified in the src attribute (if present). If a browser does NOT support the srcdoc attribute, it will show the file specified in the src attribute instead (if present).",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-srcdoc"
		},
		{
			name: "width",
			category: "<iframe> attribute",
			doc: "Indicates the width of the frame HTML5 in CSS pixels, or HTML 4.01 in pixels or as a percentage.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-width"
		}
	];

	attributes.tags.img = [
		{
			name: "align",
			category: "<img> attribute",
			doc: "The alignment of the image with respect to its surrounding context.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-align"
		},
		{
			name: "alt",
			category: "<img> attribute",
			doc: "This attribute defines the alternative text describing the image. Users will see this displayed if the image URL is wrong, the image is not in one of the supported formats, or if the image is not yet downloaded.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-alt"
		},
		{
			name: "border",
			category: "<img> attribute",
			doc: "The width of a border around the image.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-border"
		},
		{
			name: "height",
			category: "<img> attribute",
			doc: "The intrinsic height of the image in HTML5 CSS pixels, or HTML 4 in pixels or as a percentage.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-height"
		},
		{
			name: "ismap",
			category: "<img> attribute",
			doc: "This Boolean attribute indicates that the image is part of a server-side map. If so, the precise coordinates of a click are sent to the server.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-ismap"
		},
		{
			name: "src",
			category: "<img> attribute",
			doc: "The image URL. This attribute is mandatory for the <img> element. On browsers supporting srcset, src is treated like a candidate image with a pixel density descriptor 1x unless an image with this pixel density descriptor is already defined in srcset or srcset contains 'w' descriptors.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-src"
		},
		{
			name: "srcset",
			category: "<img> attribute",
			doc: "A list of one or more strings separated by commas indicating a set of possible image sources for the user agent to use. Each string is composed of:"
					+"* a URL to an image"
					+"* optionally, whitespace followed by one of:"
					+"** a width descriptor, that is a positive integer directly followed by 'w'. The width descriptor is divided by the source size given in the sizes attribute to calculate the effective pixel density"
					+"** a pixel density descriptor, that is a positive floating point number directly followed by 'x'"
					+"If no descriptor is specified, the source is assigned the default descriptor: 1x.\n"
					+"It is invalid to mix width descriptors and pixel density descriptors in the same srcset attribute. Duplicate descriptors (for instance, two sources in the same srcset which are both described with '2x') are invalid, too."
					+"User agents are given discretion to choose any one of the available sources. This provides them with significant leeway to tailor their selection based on things like user preferences or bandwidth conditions.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-srcset"
		},
		{
			name: "usemap",
			category: "<img> attribute",
			doc: "The partial URL (starting with '#') of an image map associated with the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-usemap"
		},
		{
			name: "width",
			category: "<img> attribute",
			doc: "The intrinsic width of the image in HTML5 CSS pixels, or HTML 4 in pixels or as a percentage.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-width"
		}
	];

	attributes.tags.input = [
		{
			name: "accept",
			category: "<input> attribute",
			doc: "List of types the server accepts, typically a file type.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-accept"
		},
		{
			name: "autocomplete",
			category: "<input> attribute",
			doc: "Indicates whether controls in this form can by default have their values automatically completed by the browser.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-autocomplete"
		},
		{
			name: "autofocus",
			category: "<input> attribute",
			doc: "The element should be automatically focused after the page loaded.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-autofocus"
		},
		{
			name: "autosave",
			category: "<input> attribute",
			doc: "Previous values should persist dropdowns of selectable values across page loads.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-autosave"
		},
		{
			name: "checked",
			category: "<input> attribute",
			doc: "Indicates whether the element should be checked on page load.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-checked"
		},
		{
			name: "dirname",
			category: "<input> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-dirname"
		},
		{
			name: "disabled",
			category: "<input> attribute",
			doc: "Indicates whether the user can interact with the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-disabled"
		},
		{
			name: "form",
			category: "<input> attribute",
			doc: "Indicates the form that is the owner of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-form"
		},
		{
			name: "formaction",
			category: "<input> attribute",
			doc: "Indicates the action of the element, overriding the action defined in the <form>.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-formaction"
		},
		{
			name: "height",
			category: "<input> attribute",
			doc: "Note: In some instances, such as <div>, this is a legacy attribute, in which case the CSS height property should be used instead. In other cases, such as <canvas>, the height must be specified with this attribute.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-height"
		},
		{
			name: "list",
			category: "<input> attribute",
			doc: "Identifies a list of pre-defined options to suggest to the user.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-list"
		},
		{
			name: "max",
			category: "<input> attribute",
			doc: "Indicates the maximum value allowed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-max"
		},
		{
			name: "maxlength",
			category: "<input> attribute",
			doc: "Defines the maximum number of characters allowed in the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-maxlength"
		},
		{
			name: "min",
			category: "<input> attribute",
			doc: "Indicates the minimum value allowed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-min"
		},
		{
			name: "multiple",
			category: "<input> attribute",
			doc: "Indicates whether multiple values can be entered in an input of the type email or file.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-multiple"
		},
		{
			name: "name",
			category: "<input> attribute",
			doc: "Name of the element. For example used by the server to identify the fields in form submits.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-name"
		},
		{
			name: "pattern",
			category: "<input> attribute",
			doc: "Defines a regular expression which the element's value will be validated against.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-pattern"
		},
		{
			name: "placeholder",
			category: "<input> attribute",
			doc: "Provides a hint to the user of what can be entered in the field.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-placeholder"
		},
		{
			name: "readonly",
			category: "<input> attribute",
			doc: "Indicates whether the element can be edited.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-readonly"
		},
		{
			name: "required",
			category: "<input> attribute",
			doc: "Indicates whether this element is required to fill out or not.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-required"
		},
		{
			name: "size",
			category: "<input> attribute",
			doc: "Defines the width of the element (in pixels). If the element's type attribute is text or password then it's the number of characters.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-size"
		},
		{
			name: "src",
			category: "<input> attribute",
			doc: "The URL of the embeddable content.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-src"
		},
		{
			name: "step",
			category: "<input> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-step"
		},
		{
			name: "type",
			category: "<input> attribute",
			doc: "Defines the type of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-type"
		},
		{
			name: "usemap",
			category: "<input> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-usemap"
		},
		{
			name: "value",
			category: "<input> attribute",
			doc: "Defines a default value which will be displayed in the element on page load.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-value"
		},
		{
			name: "width",
			category: "<input> attribute",
			doc: "Note: In some instances, such as <div>, this is a legacy attribute, in which case the CSS width property should be used instead. In other cases, such as <canvas>, the width must be specified with this attribute.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-width"
		}
	];

	attributes.tags.ins = [
		{
			name: "cite",
			category: "<ins> attribute",
			doc: "Contains a URI which points to the source of the quote or change.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins#attr-cite"
		},
		{
			name: "datetime",
			category: "<ins> attribute",
			doc: "Indicates the date and time associated with the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins#attr-datetime"
		}
	];

	attributes.tags.keygen = [
		{
			name: "autofocus",
			category: "<keygen> attribute",
			doc: "The element should be automatically focused after the page loaded.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/keygen#attr-autofocus"
		},
		{
			name: "challenge",
			category: "<keygen> attribute",
			doc: "A challenge string that is submitted along with the public key.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/keygen#attr-challenge"
		},
		{
			name: "disabled",
			category: "<keygen> attribute",
			doc: "Indicates whether the user can interact with the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/keygen#attr-disabled"
		},
		{
			name: "form",
			category: "<keygen> attribute",
			doc: "Indicates the form that is the owner of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/keygen#attr-form"
		},
		{
			name: "keytype",
			category: "<keygen> attribute",
			doc: "Specifies the type of key generated.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/keygen#attr-keytype"
		},
		{
			name: "name",
			category: "<keygen> attribute",
			doc: "Name of the element. For example used by the server to identify the fields in form submits.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/keygen#attr-name"
		}
	];

	attributes.tags.label = [
		{
			name: "for",
			category: "<label> attribute",
			doc: "Describes elements which belongs to this one.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label#attr-for"
		},
		{
			name: "form",
			category: "<label> attribute",
			doc: "Indicates the form that is the owner of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label#attr-form"
		}
	];

	attributes.tags.li = [
		{
			name: "value",
			category: "<li> attribute",
			doc: "Defines a default value which will be displayed in the element on page load.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li#attr-value"
		}
	];

	attributes.tags.link = [
		{
			name: "href",
			category: "<link> attribute",
			doc: "The URL of a linked resource.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#attr-href"
		},
		{
			name: "hreflang",
			category: "<link> attribute",
			doc: "Specifies the language of the linked resource.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#attr-hreflang"
		},
		{
			name: "media",
			category: "<link> attribute",
			doc: "Specifies a hint of the media for which the linked resource was designed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#attr-media"
		},
		{
			name: "rel",
			category: "<link> attribute",
			doc: "Specifies the relationship of the target object to the link object.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#attr-rel"
		},
		{
			name: "sizes",
			category: "<link> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#attr-sizes"
		}
	];

	attributes.tags.map = [
		{
			name: "name",
			category: "<map> attribute",
			doc: "Name of the element. For example used by the server to identify the fields in form submits.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map#attr-name"
		}
	];

	attributes.tags.marquee = [
		{
			name: "bgcolor",
			category: "<marquee> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/marquee#attr-bgcolor"
		},
		{
			name: "loop",
			category: "<marquee> attribute",
			doc: "Indicates whether the media should start playing from the start when it's finished.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/marquee#attr-loop"
		}
	];

	attributes.tags.menu = [
		{
			name: "type",
			category: "<menu> attribute",
			doc: "Defines the type of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu#attr-type"
		}
	];

	attributes.tags.meta = [
		{
			name: "charset",
			category: "<meta> attribute",
			doc: "Declares the character encoding of the page or script.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-charset"
		},
		{
			name: "content",
			category: "<meta> attribute",
			doc: "A value associated with http-equiv or name depending on the context.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-content"
		},
		{
			name: "http-equiv",
			category: "<meta> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-http-equiv"
		},
		{
			name: "name",
			category: "<meta> attribute",
			doc: "Name of the element. For example used by the server to identify the fields in form submits.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-name"
		}
	];

	attributes.tags.meter = [
		{
			name: "form",
			category: "<meter> attribute",
			doc: "Indicates the form that is the owner of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter#attr-form"
		},
		{
			name: "high",
			category: "<meter> attribute",
			doc: "Indicates the lower bound of the upper range.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter#attr-high"
		},
		{
			name: "low",
			category: "<meter> attribute",
			doc: "Indicates the upper bound of the lower range.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter#attr-low"
		},
		{
			name: "max",
			category: "<meter> attribute",
			doc: "Indicates the maximum value allowed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter#attr-max"
		},
		{
			name: "min",
			category: "<meter> attribute",
			doc: "Indicates the minimum value allowed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter#attr-min"
		},
		{
			name: "optimum",
			category: "<meter> attribute",
			doc: "Indicates the optimal numeric value.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter#attr-optimum"
		},
		{
			name: "value",
			category: "<meter> attribute",
			doc: "Defines a default value which will be displayed in the element on page load.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter#attr-value"
		}
	];

	attributes.tags.object = [
		{
			name: "border",
			category: "<object> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object#attr-border"
		},
		{
			name: "form",
			category: "<object> attribute",
			doc: "Indicates the form that is the owner of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object#attr-form"
		},
		{
			name: "height",
			category: "<object> attribute",
			doc: "Note: In some instances, such as <div>, this is a legacy attribute, in which case the CSS height property should be used instead. In other cases, such as <canvas>, the height must be specified with this attribute.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object#attr-height"
		},
		{
			name: "name",
			category: "<object> attribute",
			doc: "Name of the element. For example used by the server to identify the fields in form submits.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object#attr-name"
		},
		{
			name: "type",
			category: "<object> attribute",
			doc: "Defines the type of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object#attr-type"
		},
		{
			name: "usemap",
			category: "<object> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object#attr-usemap"
		},
		{
			name: "width",
			category: "<object> attribute",
			doc: "Note: In some instances, such as <div>, this is a legacy attribute, in which case the CSS width property should be used instead. In other cases, such as <canvas>, the width must be specified with this attribute.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object#attr-width"
		}
	];

	attributes.tags.ol = [
		{
			name: "reversed",
			category: "<ol> attribute",
			doc: "Indicates whether the list should be displayed in a descending order instead of a ascending.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol#attr-reversed"
		},
		{
			name: "start",
			category: "<ol> attribute",
			doc: "Defines the first number if other than 1.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol#attr-start"
		}
	];

	attributes.tags.optgroup = [
		{
			name: "disabled",
			category: "<optgroup> attribute",
			doc: "Indicates whether the user can interact with the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup#attr-disabled"
		}
	];

	attributes.tags.option = [
		{
			name: "disabled",
			category: "<option> attribute",
			doc: "Indicates whether the user can interact with the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option#attr-disabled"
		},
		{
			name: "selected",
			category: "<option> attribute",
			doc: "Defines a value which will be selected on page load.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option#attr-selected"
		},
		{
			name: "value",
			category: "<option> attribute",
			doc: "Defines a default value which will be displayed in the element on page load.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option#attr-value"
		}
	];

	attributes.tags.output = [
		{
			name: "for",
			category: "<output> attribute",
			doc: "Describes elements which belongs to this one.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output#attr-for"
		},
		{
			name: "form",
			category: "<output> attribute",
			doc: "Indicates the form that is the owner of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output#attr-form"
		},
		{
			name: "name",
			category: "<output> attribute",
			doc: "Name of the element. For example used by the server to identify the fields in form submits.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output#attr-name"
		}
	];

	attributes.tags.param = [
		{
			name: "name",
			category: "<param> attribute",
			doc: "Name of the element. For example used by the server to identify the fields in form submits.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/param#attr-name"
		},
		{
			name: "value",
			category: "<param> attribute",
			doc: "Defines a default value which will be displayed in the element on page load.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/param#attr-value"
		}
	];

	attributes.tags.progress = [
		{
			name: "form",
			category: "<progress> attribute",
			doc: "Indicates the form that is the owner of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress#attr-form"
		},
		{
			name: "max",
			category: "<progress> attribute",
			doc: "Indicates the maximum value allowed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress#attr-max"
		},
		{
			name: "value",
			category: "<progress> attribute",
			doc: "Defines a default value which will be displayed in the element on page load.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress#attr-value"
		}
	];

	attributes.tags.q = [
		{
			name: "cite",
			category: "<q> attribute",
			doc: "Contains a URI which points to the source of the quote or change.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q#attr-cite"
		}
	];

	attributes.tags.script = [
		{
			name: "async",
			category: "<script> attribute",
			doc: "Indicates that the script should be executed asynchronously.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-async"
		},
		{
			name: "charset",
			category: "<script> attribute",
			doc: "Declares the character encoding of the page or script.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-charset"
		},
		{
			name: "defer",
			category: "<script> attribute",
			doc: "Indicates that the script should be executed after the page has been parsed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-defer"
		},
		{
			name: "language",
			category: "<script> attribute",
			doc: "Defines the script language used in the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-language"
		},
		{
			name: "src",
			category: "<script> attribute",
			doc: "The URL of the embeddable content.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-src"
		},
		{
			name: "type",
			category: "<script> attribute",
			doc: "Defines the type of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-type"
		}
	];

	attributes.tags.select = [
		{
			name: "autofocus",
			category: "<select> attribute",
			doc: "The element should be automatically focused after the page loaded.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select#attr-autofocus"
		},
		{
			name: "disabled",
			category: "<select> attribute",
			doc: "Indicates whether the user can interact with the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select#attr-disabled"
		},
		{
			name: "form",
			category: "<select> attribute",
			doc: "Indicates the form that is the owner of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select#attr-form"
		},
		{
			name: "multiple",
			category: "<select> attribute",
			doc: "Indicates whether multiple values can be entered in an input of the type email or file.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select#attr-multiple"
		},
		{
			name: "name",
			category: "<select> attribute",
			doc: "Name of the element. For example used by the server to identify the fields in form submits.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select#attr-name"
		},
		{
			name: "required",
			category: "<select> attribute",
			doc: "Indicates whether this element is required to fill out or not.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select#attr-required"
		},
		{
			name: "size",
			category: "<select> attribute",
			doc: "Defines the width of the element (in pixels). If the element's type attribute is text or password then it's the number of characters.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select#attr-size"
		}
	];

	attributes.tags.source = [
		{
			name: "media",
			category: "<source> attribute",
			doc: "Specifies a hint of the media for which the linked resource was designed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-media"
		},
		{
			name: "src",
			category: "<source> attribute",
			doc: "The URL of the embeddable content.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-src"
		},
		{
			name: "type",
			category: "<source> attribute",
			doc: "Defines the type of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-type"
		}
	];

	attributes.tags.style = [
		{
			name: "media",
			category: "<style> attribute",
			doc: "Specifies a hint of the media for which the linked resource was designed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style#attr-media"
		},
		{
			name: "scoped",
			category: "<style> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style#attr-scoped"
		},
		{
			name: "type",
			category: "<style> attribute",
			doc: "Defines the type of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style#attr-type"
		}
	];

	attributes.tags.table = [
		{
			name: "align",
			category: "<table> attribute",
			doc: "Specifies the horizontal alignment of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table#attr-align"
		},
		{
			name: "bgcolor",
			category: "<table> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table#attr-bgcolor"
		},
		{
			name: "border",
			category: "<table> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table#attr-border"
		},
		{
			name: "summary",
			category: "<table> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table#attr-summary"
		}
	];

	attributes.tags.tbody = [
		{
			name: "align",
			category: "<tbody> attribute",
			doc: "Specifies the horizontal alignment of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody#attr-align"
		},
		{
			name: "bgcolor",
			category: "<tbody> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody#attr-bgcolor"
		}
	];

	attributes.tags.td = [
		{
			name: "align",
			category: "<td> attribute",
			doc: "Specifies the horizontal alignment of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#attr-align"
		},
		{
			name: "bgcolor",
			category: "<td> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#attr-bgcolor"
		},
		{
			name: "colspan",
			category: "<td> attribute",
			doc: "The colspan attribute defines the number of columns a cell should span.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#attr-colspan"
		},
		{
			name: "headers",
			category: "<td> attribute",
			doc: "IDs of the <th> elements which applies to this element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#attr-headers"
		},
		{
			name: "rowspan",
			category: "<td> attribute",
			doc: "Defines the number of rows a table cell should span over.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#attr-rowspan"
		}
	];

	attributes.tags.textarea = [
		{
			name: "autofocus",
			category: "<textarea> attribute",
			doc: "The element should be automatically focused after the page loaded.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#attr-autofocus"
		},
		{
			name: "cols",
			category: "<textarea> attribute",
			doc: "Defines the number of columns in a textarea.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#attr-cols"
		},
		{
			name: "dirname",
			category: "<textarea> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#attr-dirname"
		},
		{
			name: "disabled",
			category: "<textarea> attribute",
			doc: "Indicates whether the user can interact with the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#attr-disabled"
		},
		{
			name: "form",
			category: "<textarea> attribute",
			doc: "Indicates the form that is the owner of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#attr-form"
		},
		{
			name: "maxlength",
			category: "<textarea> attribute",
			doc: "Defines the maximum number of characters allowed in the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#attr-maxlength"
		},
		{
			name: "name",
			category: "<textarea> attribute",
			doc: "Name of the element. For example used by the server to identify the fields in form submits.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#attr-name"
		},
		{
			name: "placeholder",
			category: "<textarea> attribute",
			doc: "Provides a hint to the user of what can be entered in the field.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#attr-placeholder"
		},
		{
			name: "readonly",
			category: "<textarea> attribute",
			doc: "Indicates whether the element can be edited.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#attr-readonly"
		},
		{
			name: "required",
			category: "<textarea> attribute",
			doc: "Indicates whether this element is required to fill out or not.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#attr-required"
		},
		{
			name: "rows",
			category: "<textarea> attribute",
			doc: "Defines the number of rows in a textarea.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#attr-rows"
		},
		{
			name: "wrap",
			category: "<textarea> attribute",
			doc: "Indicates whether the text should be wrapped.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#attr-wrap"
		}
	];

	attributes.tags.tfoot = [
		{
			name: "align",
			category: "<tfoot> attribute",
			doc: "Specifies the horizontal alignment of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot#attr-align"
		},
		{
			name: "bgcolor",
			category: "<tfoot> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot#attr-bgcolor"
		}
	];

	attributes.tags.th = [
		{
			name: "align",
			category: "<th> attribute",
			doc: "Specifies the horizontal alignment of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#attr-align"
		},
		{
			name: "bgcolor",
			category: "<th> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#attr-bgcolor"
		},
		{
			name: "colspan",
			category: "<th> attribute",
			doc: "The colspan attribute defines the number of columns a cell should span.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#attr-colspan"
		},
		{
			name: "headers",
			category: "<th> attribute",
			doc: "IDs of the <th> elements which applies to this element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#attr-headers"
		},
		{
			name: "rowspan",
			category: "<th> attribute",
			doc: "Defines the number of rows a table cell should span over.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#attr-rowspan"
		},
		{
			name: "scope",
			category: "<th> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#attr-scope"
		}
	];

	attributes.tags.thead = [
		{
			name: "align",
			category: "<thead> attribute",
			doc: "Specifies the horizontal alignment of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead#attr-align"
		}
	];

	attributes.tags.time = [
		{
			name: "datetime",
			category: "<time> attribute",
			doc: "Indicates the date and time associated with the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time#attr-datetime"
		},
		{
			name: "pubdate",
			category: "<time> attribute",
			doc: "Indicates whether this date and time is the date of the nearest <article> ancestor element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time#attr-pubdate"
		}
	];

	attributes.tags.tr = [
		{
			name: "align",
			category: "<tr> attribute",
			doc: "Specifies the horizontal alignment of the element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr#attr-align"
		},
		{
			name: "bgcolor",
			category: "<tr> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr#attr-bgcolor"
		}
	];

	attributes.tags.track = [
		{
			name: "default",
			category: "<track> attribute",
			doc: "Indicates that the track should be enabled unless the user's preferences indicate something different.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#attr-default"
		},
		{
			name: "kind",
			category: "<track> attribute",
			doc: "Specifies the kind of text track.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#attr-kind"
		},
		{
			name: "label",
			category: "<track> attribute",
			doc: "Specifies a user-readable title of the text track.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#attr-label"
		},
		{
			name: "src",
			category: "<track> attribute",
			doc: "The URL of the embeddable content.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#attr-src"
		},
		{
			name: "srclang",
			category: "<track> attribute",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#attr-srclang"
		}
	];

	attributes.tags.video = [
		{
			name: "autoplay",
			category: "<video> attribute",
			doc: "A Boolean attribute; if specified, the video will automatically begin to play back as soon as it can do so without stopping to finish loading the data.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-autoplay"
		},
		{
			name: "buffered",
			category: "<video> attribute",
			doc: "An attribute you can read to determine which time ranges of the media have been buffered. This attribute contains a TimeRanges object.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-buffered"
		},
		{
			name: "controls",
			category: "<video> attribute",
			doc: "If this attribute is present, Gecko will offer controls to allow the user to control video playback, including volume, seeking, and pause/resume playback.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-controls"
		},
		{
			name: "height",
			category: "<video> attribute",
			doc: "The height of the video's display area, in CSS pixels.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-height"
		},
		{
			name: "loop",
			category: "<video> attribute",
			doc: "A Boolean attribute; if specified, we will, upon reaching the end of the video, automatically seek back to the start.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-loop"
		},
		{
			name: "poster",
			category: "<video> attribute",
			doc: "A URL indicating a poster frame to show until the user plays or seeks. If this attribute isn't specified, nothing is displayed until the first frame is available; then the first frame is displayed as the poster frame.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-poster"
		},
		{
			name: "preload",
			category: "<video> attribute",
			doc: "This enumerated attribute is intended to provide a hint to the browser about what the author thinks will lead to the best user experience. It may have one of the following values:"
					+"* none: hints that either the author thinks that the user won't need to consult that video or that the server wants to minimize its traffic; in others terms this hint indicates that the video should not be cached"
					+"* metadata: hints that though the author thinks that the user won't need to consult that video, fetching the metadata (e.g. length) is reasonable"
					+"* auto: hints that the user needs have priority; in others terms this hint indicated that, if needed, the whole video could be downloaded, even if the user is not expected to use it"
					+"* the empty string: which is a synonym of the auto value",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-preload"
		},
		{
			name: "src",
			category: "<video> attribute",
			doc: "The URL of the video to embed. This is optional; you may instead use the <source> element within the video block to specify the video to embed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-src"
		},
		{
			name: "width",
			category: "<video> attribute",
			doc: "The width of the video's display area, in CSS pixels.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-width"
		}
	];
	
	/**
	 * @description Returns the set of attributes that apply to the given DOM node
	 * @param {Object} node The DOM node to get attributes for
	 * @returns {Array.<Object>} The array of attributes for the given node or an empty array, never null
	 * @since 10.0
	 */
	function getAttributesForNode(node) {
		var ret = Object.create(null);
		var attrs = [].concat(attributes.globals);
		if(node && node.type === 'tag') {
			var tags = attributes.tags[node.name];
			if(Array.isArray(tags) && tags.length > 0) {
				return [].concat(attrs, tags);
			}
		}
		ret.global = attrs;
		ret.formevents = attributes.formevents.slice(0);
		ret.keyboardevents = attributes.keyboardevents.slice(0);
		ret.mouseevents = attributes.mouseevents.slice(0);
		ret.windowevents = attributes.windowevents.slice(0);
		return ret;
	}
	
	return {
		getAttributesForNode: getAttributesForNode
	};
});