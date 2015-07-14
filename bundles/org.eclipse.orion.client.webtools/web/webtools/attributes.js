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
	
	attributes.tags = Object.create(null);
	attributes.tags.a = [
		{
			name: "download",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Attributes",
			doc: "This attribute, if present, indicates that the author intends the hyperlink to be used for downloading a resource so that when the user clicks on the link they will be prompted to save it as a local file. If the attribute has a value, the value will be used as the pre-filled file name in the Save prompt that opens when the user clicks on the link (the user can change the name before actually saving the file of course). There are no restrictions on allowed values (though / and \ will be converted to underscores, preventing specific path hints), but you should consider that most file systems have limitations with regard to what punctuation is supported in file names, and browsers are likely to adjust file names accordingly."
		},
		{
			name: "href",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Attributes",
			doc: "This was the single required attribute for anchors defining a hypertext source link, but is no longer required in HTML5. Omitting this attribute creates a placeholder link. The href attribute indicates the link target, either a URL or a URL fragment. A URL fragment is a name preceded by a hash mark (#), which specifies an internal target location (an ID) within the current document. URLs are not restricted to Web (HTTP)-based documents. URLs might use any protocol supported by the browser. For example, file, ftp, and mailto work in most user agents."
		},
		{
			name: "hreflang",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Attributes",
			doc: "This attribute indicates the language of the linked resource. It is purely advisory. Allowed values are determined by BCP47 for HTML5 and by RFC1766 for HTML4. Use this attribute only if the href attribute is present."
		},
		{
			name: "media",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Attributes",
			doc: "This attribute specifies the media which the linked resource applies to. Its value must be a media query. This attribute is mainly useful when linking to external stylesheets by allowing the user agent to pick the best adapted one for the device it runs on."
		},
		{
			name: "ping",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Attributes",
			doc: "The 'ping' attribute, if present, sends the URLs of the resources a notification/ping if the user follows the hyperlink."
		},
		{
			name: "rel",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Attributes",
			doc: "For anchors containing the href attribute, this attribute specifies the relationship of the target object to the link object. The value is a comma-separated list of link types values. The values and their semantics will be registered by some authority that might have meaning to the document author. The default relationship, if no other is given, is void. Use this attribute only if the href attribute is present."
		},
		{
			name: "target",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Attributes",
			doc: "This attribute specifies where to display the linked resource. In HTML4, this is the name of, or a keyword for, a frame. In HTML5, it is a name of, or keyword for, a browsing context (for example, tab, window, or inline frame). The following keywords have special meanings:"
					+"* _self: Load the response into the same HTML4 frame (or HTML5 browsing context) as the current one. This value is the default if the attribute is not specified"
					+"* _blank: Load the response into a new unnamed HTML4 window or HTML5 browsing context"
					+"* _parent: Load the response into the HTML4 frameset parent of the current frame or HTML5 parent browsing context of the current one. If there is no parent, this option behaves the same way as _self"
					+"* _top: In HTML4: Load the response into the full, original window, canceling all other frames. In HTML5: Load the response into the top-level browsing context (that is, the browsing context that is an ancestor of the current one, and has no parent). If there is no parent, this option behaves the same way as _self"
		},
		{
			name: "type",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Attributes",
			doc: "This attribute specifies the media type in the form of a MIME type for the link target. Generally, this is provided strictly as advisory information; however, in the future a browser might add a small icon for multimedia types. For example, a browser might add a small speaker icon when type is set to audio/wav. For a complete list of recognized MIME types, see http://www.w3.org/TR/html4/references.html#ref-MIMETYPES. Use this attribute only if the href attribute is present."
		},
		{
			name: "charset",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Obsolete",
			doc: "This attribute defines the character encoding of the linked resource. The value is a space- and/or comma-delimited list of character sets as defined in RFC 2045. The default value is ISO-8859-1.",
			obsolete: "HTML 5"
		},
		{
			name: "coords",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Obsolete",
			doc: "For use with object shapes, this attribute uses a comma-separated list of numbers to define the coordinates of the object on the page.",
			obsolete: "HTML 5"
		},
		{
			name: "name",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Obsolete",
			doc: "This attribute is required in an anchor defining a target location within a page. A value for name is similar to a value for the id core attribute and should be an alphanumeric identifier unique to the document. Under the HTML 4.01 specification, id and name both can be used with the <a> element as long as they have identical values.",
			obsolete: "HTML 5"
		},
		{
			name: "rev",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Obsolete",
			doc: "This attribute specifies a reverse link, the inverse relationship of the rel attribute. It is useful for indicating where an object came from, such as the author of a document.",
			obsolete: "HTML 5"
		},
		{
			name: "shape",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Obsolete",
			doc: "This attribute is used to define a selectable region for hypertext source links associated with a figure to create an image map. The values for the attribute are circle, default, polygon, and rect. The format of the coords attribute depends on the value of shape. For circle, the value is x,y,r where x and y are the pixel coordinates for the center of the circle and r is the radius value in pixels. For rect, the coords attribute should be x,y,w,h. The x,y values define the upper-left-hand corner of the rectangle, while w and h define the width and height respectively. A value of polygon for shape requires x1,y1,x2,y2,... values for coords. Each of the x,y pairs defines a point in the polygon, with successive points being joined by straight lines and the last point joined to the first. The value default for shape requires that the entire enclosed area, typically an image, be used.",
			obsolete: "HTML 5"
		}
	];
	
	attributes.tags.applet = [ //obsolete
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.area = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.audio = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.base = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.basefont = [ //obsolete
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.body = [
		{
			name: "alink",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
			doc: "Color of text for hyperlinks when selected. This method is non-conforming, use CSS color property in conjunction with the :active pseudo-class instead.",
			obsolete: true
		},
		{
			name: "background",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
			doc: "URI of a image to use as a background. This method is non-conforming, use CSS background property on the element instead.",
			obsolete: true
		},
		{
			name: "bgcolor",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
			doc: "Background color for the document. This method is non-conforming, use CSS background-color property on the element instead.",
			obsolete: true
		},
		{
			name: "bottommargin",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
			doc: "The margin of the bottom of the body. This method is non-conforming, use CSS margin-bottom property on the element instead.",
			obsolete: true
		},
		{
			name: "leftmargin",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
			doc: "The margin of the left of the body. This method is non-conforming, use CSS margin-left property on the element instead.",
			obsolete: true
		},
		{
			name: "link",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
			doc: "Color of text for unvisited hypertext links. This method is non-conforming, use CSS color property in conjunction with the :link pseudo-class instead.",
			obsolete: true
		},
		{
			name: "rightmargin",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
			doc: "The margin of the right of the body. This method is non-conforming, use CSS margin-right property on the element instead.",
			obsolete: true
		},
		{
			name: "text",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
			doc: "Foreground color of text. This method is non-conforming, use CSS color property on the element instead.",
			obsolete: true
		},
		{
			name: "topmargin",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
			doc: "The margin of the top of the body. This method is non-conforming, use CSS margin-top property on the element instead.",
			obsolete: true
		},
		{
			name: "vlink",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body#Attributes",
			doc: "Color of text for visited hypertext links. This method is non-conforming, use CSS color property in conjunction with the :visited pseudo-class instead.",
			obsolete: true
		}
	];
	
	attributes.tags.br = [
		{
			name: "clear",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br#Attributes",
			doc: "Indicates where to begin the next line after the break.",
			obsolete: "HTML 5"
		}
	];
	
	attributes.tags.button = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.canvas = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.caption = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.col = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.colgroup = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.content = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.data = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.del = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.details = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.dialog = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.dir = [ //obsolete
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.embed = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.fieldset = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.form = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.frame = [ //deprecated
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.frameset = [ //deprecated
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.hr = [
		{
			name: "align",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr#Attributes",
			doc: "Sets the alignment of the rule on the page. If no value is specified, the default value is left.",
			deprecated: "HTML 4.01",
			obsolete: "HTML 5"
		},
		{
			name: "noshade",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr#Attributes",
			doc: "Sets the rule to have no shading.",
			deprecated: "HTML 4.01",
			obsolete: "HTML 5"
		},
		{
			name: "size",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr#Attributes",
			doc: "Sets the height, in pixels, of the rule.",
			deprecated: "HTML 4.01",
			obsolete: "HTML 5"
		},
		{
			name: "width",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr#Attributes",
			doc: "Sets the length of the rule on the page through a pixel or percentage value.",
			deprecated: "HTML 4.01",
			obsolete: "HTML 5"
		}
	];
	
	attributes.tags.html = [
		{
			name: "manifest",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html#Attributes",
			doc: "Specifies the URI of a resource manifest indicating resources that should be cached locally. See Using the application cache for details."
		},
		{
			name: "version",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html#Attributes",
			doc: "Specifies the version of the HTML Document Type Definition that governs the current document. This attribute is not needed, because it is redundant with the version information in the document type declaration.",
			deprecated: "HTML 4.01"
		},
		{
			name: "xmlns",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html#Attributes",
			doc: "Specifies the XML Namespace of the document. Default value is \"http://www.w3.org/1999/xhtml\". This is required in XHTML, and optional in HTML5."
		}
	];

	attributes.tags.iframe = [
		{
			name: "align",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "The alignment of this element with respect to the surrounding context.",
			deprecated: "HTML 4.01",
			obsolete: "HTML 5"
		},
		{
			name: "allowfullscreen",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "This attribute can be set to true if the frame is allowed to be placed into full screen mode by calling its element.mozRequestFullScreen() method. If this isn't set, the element can't be placed into full screen mode."
		},
		{
			name: "frameborder",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "The value 1 (the default) tells the browser to draw a border between this frame and every other frame. The value 0 tells the browser not to draw a border between this frame and other frames.",
			only: "HTML 4"
		},
		{
			name: "height",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "Indicates the height of the frame HTML5 in CSS pixels, or HTML 4.01 in pixels or as a percentage."
		},
		{
			name: "longdesc",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "A URI of a long description of the frame. Due to widespread misuse, this is not helpful for non-visual browsers.",
			only: "HTML 4"
		},
		{
			name: "marginheight",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "The amount of space in pixels between the frame's content and its top and bottom margins.",
			only: "HTML 4"
		},
		{
			name: "marginwidth",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "The amount of space in pixels between the frame's content and its left and right margins.",
			only: "HTML 4"
		},
		{
			name: "name",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "A name for the embedded browsing context (or frame). This can be used as the value of the target attribute of an <a> or <form> element, or the formtarget attribute of an <input> or <button> element."
		},
		{
			name: "scrolling",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "Enumerated attribute indicating when the browser should provide a scroll bar (or other scrolling device) for the frame:"
					+"* auto: Only when needed"
					+"* yes: Always provide a scroll bar"
					+"* no: Never provide a scoll bar",
			only: "HTML 4"
		},
		{
			name: "sandbox",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "If specified as an empty string, this attribute enables extra restrictions on the content that can appear in the inline frame. The value of the attribute can either be an empty string (all the restrictions are applied), or a space-separated list of tokens that lift particular restrictions. Valid tokens are:"
					+"* allow-same-origin: Allows the content to be treated as being from its normal origin. If this keyword is not used, the embedded content is treated as being from a unique origin"
					+"* allow-top-navigation: Allows the embedded browsing context to navigate (load) content to the top-level browsing context. If this keyword is not used, this operation is not allowed"
					+"* allow-forms: Allows the embedded browsing context to submit forms. If this keyword is not used, this operation is not allowed"
					+"* allow-popups: Allows popups (like from window.open, target=\"_blank\", showModalDialog). If this keyword is not used, that functionality will silently fail"
					+"* allow-scripts: Allows the embedded browsing context to run scripts (but not create pop-up windows). If this keyword is not used, this operation is not allowed"
					+"* allow-pointer-lock: Allows the embedded browsing context to use the Pointer Lock API"
					+"* allow-unsandboxed-auxiliary: (Chrome only) Allows a sandboxed document to open new windows without forcing the sandboxing flags upon them. This will allow, for example, a third-party advertisement to be safely sandboxed without forcing the same restrictions upon a landing page",
			only: "HTML 5"
		},
		{
			name: "seamless",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "This Boolean attribute indicates that the browser should render the inline frame in a way that makes it appear to be part of the containing document, for example by applying CSS styles that apply to the <iframe> to the contained document before styles specified in that document, and by opening links in the contained documents in the parent browsing context (unless another setting prevents this). In XHTML, attribute minimization is forbidden, and the seamless attribute must be defined as <iframe seamless=\"seamless\">.",
			only: "HTML 5"
		},
		{
			name: "src",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "The URL of the page to embed."
		},
		{
			name: "srcdoc",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "The content of the page that the embedded context is to contain. This attribute is expected to be used together with the sandbox and seamless attributes. If a browser supports the srcdoc attribute, it will override the content specified in the src attribute (if present). If a browser does NOT support the srcdoc attribute, it will show the file specified in the src attribute instead (if present).",
			only: "HTML 5"
		},
		{
			name: "width",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#Attributes",
			doc: "Indicates the width of the frame HTML5 in CSS pixels, or HTML 4.01 in pixels or as a percentage."
		}
	];

	attributes.tags.img = [
		{
			name: "align",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "The alignment of the image with respect to its surrounding context.",
			deprecated: "HTML 4.01",
			obsolete: "HTML 5"
		},
		{
			name: "alt",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "This attribute defines the alternative text describing the image. Users will see this displayed if the image URL is wrong, the image is not in one of the supported formats, or if the image is not yet downloaded."
		},
		{
			name: "border",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "The width of a border around the image.",
			deprecated: "HTML 4.01",
			obsolete: "HTML 5"
		},
		{
			name: "crossorigin",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "This enumerated attribute indicates if the fetching of the related image must be done using CORS or not. CORS-enabled images can be reused in the <canvas> element without being tainted. The allowed values are:"
					+"* anonymous - A cross-origin request (i.e., with Origin: HTTP header) is performed. But no credential is sent (i.e., no cookie, no X.509 certificate, and no HTTP Basic authentication is sent). If the server does not give credentials to the origin site (by not setting the Access-Control-Allow-Origin: HTTP header), the image will be tainted and its usage restricted"
					+"* use-credentials - A cross-origin request (i.e., with Origin: HTTP header) performed with credential is sent (i.e., a cookie, a certificate, and HTTP Basic authentication is performed). If the server does not give credentials to the origin site (through Access-Control-Allow-Credentials: HTTP header), the image will be tainted and its usage restricted",
			only: "HTML 5"
		},
		{
			name: "height",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "The intrinsic height of the image in HTML5 CSS pixels, or HTML 4 in pixels or as a percentage."
		},
		{
			name: "hspace",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "The number of pixels of white space to insert to the left and right of the image.",
			deprecated: "HTML 4.01",
			obsolete: "HTML 5"
		},
		{
			name: "ismap",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "This Boolean attribute indicates that the image is part of a server-side map. If so, the precise coordinates of a click are sent to the server."
		},
		{
			name: "longdesc",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "The URL of a description of the image to be displayed, which supplements the alt text."
		},
		{
			name: "name",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "A name for the element. It is supported in HTML 4 only for backward compatibility. Use the id attribute instead.",
			deprecated: "HTML 4.01",
			obsolete: "HTML 5"
		},
		{
			name: "sizes",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "A list of one or more strings separated by commas indicating a set of source sizes. Each source size consists of:"
					+"* a media condition. This must be omitted for the last item"
					+"* a source size value"
					+"Source size values specify the intended display size of the image. User agents use the current source size to select one of the sources supplied by the srcset attribute, when those sources are described using width ('w') descriptors. The selected source size affects the intrinsic size of the image (the image’s display size if no CSS styling is applied). If the srcset attribute is absent, or contains no values with a width descriptor, then the sizes attribute has no effect.",
			only: "HTML 5"
		},
		{
			name: "src",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "The image URL. This attribute is mandatory for the <img> element. On browsers supporting srcset, src is treated like a candidate image with a pixel density descriptor 1x unless an image with this pixel density descriptor is already defined in srcset or srcset contains 'w' descriptors."
		},
		{
			name: "srcset",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "A list of one or more strings separated by commas indicating a set of possible image sources for the user agent to use. Each string is composed of:"
					+"* a URL to an image"
					+"* optionally, whitespace followed by one of:"
					+"** a width descriptor, that is a positive integer directly followed by 'w'. The width descriptor is divided by the source size given in the sizes attribute to calculate the effective pixel density"
					+"** a pixel density descriptor, that is a positive floating point number directly followed by 'x'"
					+"If no descriptor is specified, the source is assigned the default descriptor: 1x.\n"
					+"It is invalid to mix width descriptors and pixel density descriptors in the same srcset attribute. Duplicate descriptors (for instance, two sources in the same srcset which are both described with '2x') are invalid, too."
					+"User agents are given discretion to choose any one of the available sources. This provides them with significant leeway to tailor their selection based on things like user preferences or bandwidth conditions.",
			only: "HTML 5"
		},
		{
			name: "width",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "The intrinsic width of the image in HTML5 CSS pixels, or HTML 4 in pixels or as a percentage."
		},
		{
			name: "usemap",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "The partial URL (starting with '#') of an image map associated with the element."
		},
		{
			name: "vspace",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes",
			doc: "The number of pixels of white space to insert above and below the image.",
			deprecated: "HTML 4.01",
			obsolete: "HTML 5"
		}
	];

	attributes.tags.input = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];

	attributes.tags.ins = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];

	attributes.tags.isindex = [ //deprecated
		{
			name: "",
			url: "",
			doc: ""
		}
	];

	attributes.tags.keygen = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];

	attributes.tags.label = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];

	attributes.tags.li = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.link = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.map = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.menu = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.menuitem = [
	{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.meta = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.meter = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.object = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.ol = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.optgroup = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.option = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.output = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.p = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];

	attributes.tags.progress = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];

	attributes.tags.param = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];

	attributes.tags.pre = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];

	attributes.tags.q = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.script = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.select = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.source = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.spacer = [ //obsolete
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.style = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.table = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.tbody = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.td = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.textarea = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.thead = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.time = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.tr = [
		{
			name: "",
			url: "",
			doc: ""
		}
	];
	
	attributes.tags.track = [
		{
			name: "",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#Attributes",
			doc: ""
		},
		{
			name: "",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#Attributes",
			doc: ""
		},
		{
			name: "",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#Attributes",
			doc: ""
		},
		{
			name: "",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#Attributes",
			doc: ""
		},
		{
			name: "",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#Attributes",
			doc: ""
		}
	];
	
	attributes.tags.ul = [
		{
			name: "compact",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul#Attributes",
			doc: "This Boolean attribute hints that the list should be rendered in a compact style. The interpretation of this attribute depends on the user agent and it doesn't work in all browsers.",
			deprecated: true
		},
		{
			name: "type",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul#Attributes",
			doc: "Used to set the bullet style for the list. The values defined under HTML3.2 and the transitional version of HTML 4.0/4.01 are:"
					+"* circle"
					+"* disc"
					+"* square",
			deprecated: true
		}
	];
	
	attributes.tags.video = [
		{
			name: "autoplay",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes",
			doc: "A Boolean attribute; if specified, the video will automatically begin to play back as soon as it can do so without stopping to finish loading the data."
		},
		{
			name: "buffered",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes",
			doc: "An attribute you can read to determine which time ranges of the media have been buffered. This attribute contains a TimeRanges object."
		},
		{
			name: "controls",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes",
			doc: "If this attribute is present, Gecko will offer controls to allow the user to control video playback, including volume, seeking, and pause/resume playback."
		},
		{
			name: "crossorigin",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes",
			doc: "This enumerated attribute indicates if the fetching of the related image must be done using CORS or not. CORS-enabled resources can be reused in the <canvas> element without being tainted. The allowed values are:"
					+"* anonymous - A cross-origin request (i.e. with Origin: HTTP header) is performed. But no credential is sent (i.e. no cookie, no X.509 certificate and no HTTP Basic authentication is sent). If the server does not give credentials to the origin site (by not setting the Access-Control-Allow-Origin: HTTP header), the image will be tainted and its usage restricted"
					+"* use-credentials - A cross-origin request (i.e. with Origin: HTTP header) is performed with credential is sent (i.e. a cookie, a certificate and HTTP Basic authentication is performed). If the server does not give credentials to the origin site (through Access-Control-Allow-Credentials: HTTP header), the image will be tainted and its usage restricted"
		},
		{
			name: "height",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes",
			doc: "The height of the video's display area, in CSS pixels."
		},
		{
			name: "loop",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes",
			doc: "A Boolean attribute; if specified, we will, upon reaching the end of the video, automatically seek back to the start."
		},
		{
			name: "muted",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes",
			doc: "A Boolean attribute which indicates the default setting of the audio contained in the video. If set, the audio will be initially silenced. Its default value is false, meaning that the audio will be played when the video is played."
		},
		{
			name: "played",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes",
			doc: "A TimeRanges object indicating all the ranges of the video that have been played."
		},
		{
			name: "preload",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes",
			doc: "This enumerated attribute is intended to provide a hint to the browser about what the author thinks will lead to the best user experience. It may have one of the following values:"
					+"* none: hints that either the author thinks that the user won't need to consult that video or that the server wants to minimize its traffic; in others terms this hint indicates that the video should not be cached"
					+"* metadata: hints that though the author thinks that the user won't need to consult that video, fetching the metadata (e.g. length) is reasonable"
					+"* auto: hints that the user needs have priority; in others terms this hint indicated that, if needed, the whole video could be downloaded, even if the user is not expected to use it"
					+"* the empty string: which is a synonym of the auto value"
		},
		{
			name: "poster",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes",
			doc: "A URL indicating a poster frame to show until the user plays or seeks. If this attribute isn't specified, nothing is displayed until the first frame is available; then the first frame is displayed as the poster frame."
		},
		{
			name: "src",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes",
			doc: "The URL of the video to embed. This is optional; you may instead use the <source> element within the video block to specify the video to embed."
		},
		{
			name: "width",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#Attributes",
			doc: "The width of the video's display area, in CSS pixels."
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
		if(node && node.type === 'tag') {
			var tags = attributes.tags[node.name];
			if(Array.isArray(tags) && tags.length > 0) {
				return [].concat(attrs, tags);
			}
		}
		return attrs;
	}
	
	return {
		getAttributesForNode: getAttributesForNode
	};
});