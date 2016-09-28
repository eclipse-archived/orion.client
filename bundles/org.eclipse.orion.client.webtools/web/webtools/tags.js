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
	// The following tags were marked as void elements manually using http://w3c.github.io/html/syntax.html#writing-html-documents-elements
	// Void elements: area, base, br, col, embed, hr, img, input, link, menuitem, meta, param, source, track, wbr
	var voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'];
	
	var tagTemplates = Object.create(null);
	tagTemplates = [
	/*
	 * The following data was scraped from https://developer.mozilla.org/en-US/docs/Web/HTML/Element
	 * These tags were missing from the scraped data and added manually:
	 * 		a, aside, blockquote, font, marquee, noframes
	 */
		{
			name: "a",
			category: "Text content",
			doc: "The HTML Anchor Element (<a>) defines a hyperlink",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a"
		},
		{
			name: "abbr",
			category: "Inline text semantics",
			doc: "The HTML Abbreviation element (<abbr>) represents an abbreviation and optionally provides a full description for it. If present, the title attribute must contain this full description and nothing else.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr"
		},
		{
			name: "acronym",
			category: "Obsolete and deprecated elements",
			doc: "The HTML Acronym Element (<acronym>) allows authors to clearly indicate a sequence of characters that compose an acronym or abbreviation for a word.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/acronym"
		},
		{
			name: "address",
			category: "Content sectioning",
			doc: "The HTML Address Element (<address>) should be used by authors to supply contact information for its nearest <article> or <body> ancestor; in the latter case, it applies to the whole document.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address"
		},
		{
			name: "applet",
			category: "Obsolete and deprecated elements",
			doc: "The HTML Applet Element (<applet>) identifies the inclusion of a Java applet.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/applet"
		},
		{
			name: "area",
			category: "Image & multimedia",
			doc: "The HTML <area> element defines a hot-spot region on an image, and optionally associates it with a hypertext link. This element is used only within a <map> element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area"
		},
		
		{
			name: "article",
			category: "Content sectioning",
			doc: "The HTML Article Element (<article>) represents a self-contained composition in a document, page, application, or site, which is intended to be independently distributable or reusable, e.g., in syndication. This could be a forum post, a magazine or newspaper article, a blog entry, or any other independent item of content. Each <article> should be identified, typically by including a heading (h1-h6 element) as a child of the <article> element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article"
		},
		{
			name: "aside",
			category: "Text content",
			doc: "The HTML <aside> element represents a section of the page with content connected tangentially to the rest, which could be considered separate from that content.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside"
		},
		{
			name: "audio",
			category: "Image & multimedia",
			doc: "The HTML <audio> element is used to embed sound content in documents. It may contain several audio sources, represented using the src attribute or the <source> element; the browser will choose the most suitable one.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio"
		},
		{
			name: "b",
			category: "Inline text semantics",
			doc: "The HTML <b> Element represents a span of text stylistically different from normal text, without conveying any special importance or relevance. It is typically used for keywords in a summary, product names in a review, or other spans of text whose typical presentation would be boldfaced. Another example of its use is to mark the lead sentence of each paragraph of an article.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b"
		},
		{
			name: "base",
			category: "Document metadata",
			doc: "The HTML Base Element (<base>) specifies the base URL to use for all relative URLs contained within a document. There can be only one <base> element in a document.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base"
		},
		{
			name: "basefont",
			category: "Obsolete and deprecated elements",
			doc: "The HTML basefont element (<basefont>) establishes a default font size for a document. Font size then can be varied relative to the base font size using the <font> element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/basefont"
		},
		{
			name: "bdi",
			category: "Inline text semantics",
			doc: "The HTML <bdi> Element (or Bi-Directional Isolation Element) isolates a span of text that might be formatted in a different direction from other text outside it.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdi"
		},
		{
			name: "bdo",
			category: "Inline text semantics",
			doc: "The HTML <bdo> Element (or HTML bidirectional override element) is used to override the current directionality of text. It causes the directionality of the characters to be ignored in favor of the specified directionality.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdo"
		},
		{
			name: "big",
			category: "Obsolete and deprecated elements",
			doc: "The HTML Big Element (<big>) makes the text font size one size bigger (for example, from small to medium, or from large to x-large) up to the browser's maximum font size.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/big"
		},
		{
			name: "blink",
			category: "Obsolete and deprecated elements",
			doc: "The HTML Blink Element (<blink>) is a non-standard element causing the enclosed text to flash slowly.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blink"
		},
		{
			name: "blockquote",
			category: "Text content",
			doc: "The HTML <blockquote> Element (or HTML Block Quotation Element) indicates that the enclosed text is an extended quotation.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote"
		},
		{
			name: "body",
			category: "Content sectioning",
			doc: "The HTML Body Element (<body>) represents the content of an HTML document. There can be only one <body> element in a document.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body"
		},
		{
			name: "br",
			category: "Inline text semantics",
			doc: "The HTML <br> Element (or HTML Line Break Element) produces a line break in text (carriage-return). It is useful for writing a poem or an address, where the division of lines is significant.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br"
		},
		{
			name: "button",
			category: "Forms",
			doc: "The HTML <button> Element represents a clickable button.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button"
		},
		{
			name: "canvas",
			category: "Scripting",
			doc: "The HTML <canvas> Element can be used to draw graphics via scripting (usually JavaScript). For example, it can be used to draw graphs, make photo compositions or even perform animations. You may (and should) provide alternate content inside the <canvas> block. That content will be rendered both on older browsers that don't support canvas and in browsers with JavaScript disabled.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas"
		},
		{
			name: "caption",
			category: "Table content",
			doc: "The HTML <caption> Element (or HTML Table Caption Element) represents the title of a table. Though it is always the first descendant of a <table>, its styling, using CSS, may place it elsewhere, relative to the table.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption"
		},
		{
			name: "center",
			category: "Obsolete and deprecated elements",
			doc: "The HTML Center Element (<center>) is a block-level element that can contain paragraphs and other block-level and inline elements. The entire content of this element is centered horizontally within its containing element (typically, the <body>).",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/center"
		},
		{
			name: "cite",
			category: "Inline text semantics",
			doc: "The HTML Citation Element (<cite>) represents a reference to a creative work. It must include the title of a work or a URL reference, which may be in an abbreviated form according to the conventions used for the addition of citation metadata.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite"
		},
		{
			name: "code",
			category: "Inline text semantics",
			doc: "The HTML Code Element (<code>) represents a fragment of computer code. By default, it is displayed in the browser's default monospace font.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code"
		},
		{
			name: "col",
			category: "Table content",
			doc: "The HTML Table Column Element (<col>) defines a column within a table and is used for defining common semantics on all common cells. It is generally found within a <colgroup> element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col"
		},
		{
			name: "colgroup",
			category: "Table content",
			doc: "The HTML Table Column Group Element (<colgroup>) defines a group of columns within a table.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup"
		},
		{
			name: "content",
			category: "Web Components",
			doc: "The HTML <content> element is used inside of Shadow DOM as an insertion point. It is not intended to be used in ordinary HTML. It is used with Web Components.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/content"
		},
		{
			name: "data",
			category: "Inline text semantics",
			doc: "The HTML <data> Element links a given content with a machine-readable translation. If the content is time- or date-related, the <time> must be used.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data"
		},
		{
			name: "datalist",
			category: "Forms",
			doc: "The HTML Datalist Element (<datalist>) contains a set of <option> elements that represent the values available for other controls.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist"
		},
		{
			name: "dd",
			category: "Text content",
			doc: "The HTML Description Element (<dd>) indicates the description of a term in a description list (<dl>) element. This element can occur only as a child element of a definition list and it must follow a <dt> element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd"
		},
		{
			name: "del",
			category: "Edits",
			doc: "The HTML Deleted Text Element (<del>) represents a range of text that has been deleted from a document. This element is often (but need not be) rendered with strike-through text.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del"
		},
		{
			name: "details",
			category: "Interactive elements",
			doc: "The HTML Details Element (<details>) is used as a disclosure widget from which the user can retrieve additional information.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details"
		},
		{
			name: "dfn",
			category: "Inline text semantics",
			doc: "The HTML Definition Element (<dfn>) represents the defining instance of a term.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dfn"
		},
		{
			name: "dialog",
			category: "Interactive elements",
			doc: "The HTML <dialog> element represents a dialog box or other interactive component, such as an inspector or window. <form> elements can be integrated within a dialog by specifying them with the attribute method=\"dialog\". When such a form is submitted, the dialog is closed with a returnValue attribute set to the value of the submit button used.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog"
		},
		{
			name: "dir",
			category: "Obsolete and deprecated elements",
			doc: "The HTML directory element (<dir>) represents a directory, namely a collection of filenames.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dir"
		},
		{
			name: "div",
			category: "Text content",
			doc: "The HTML <div> element (or HTML Document Division Element) is the generic container for flow content, which does not inherently represent anything. It can be used to group elements for styling purposes (using the class or id attributes), or because they share attribute values, such as lang. It should be used only when no other semantic element (such as <article> or <nav>) is appropriate.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div"
		},
		{
			name: "dl",
			category: "Text content",
			doc: "The HTML <dl> Element (or HTML Description List Element) encloses a list of pairs of terms and descriptions. Common uses for this element are to implement a glossary or to display metadata (a list of key-value pairs).",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl"
		},
		{
			name: "dt",
			category: "Text content",
			doc: "The HTML <dt> element (or HTML Definition Term Element) identifies a term in a definition list. This element can occur only as a child element of a <dl>. It is usually followed by a <dd> element; however, multiple <dt> elements in a row indicate several terms that are all defined by the immediate next <dd> element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt"
		},
		{
			name: "element",
			category: "<decorator>",
			doc: "The HTML <element> element is used to define new custom DOM elements.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/element"
		},
		{
			name: "em",
			category: "Inline text semantics",
			doc: "The HTML Emphasis Element (<em>) marks text that has stress emphasis. The <em> element can be nested, with each level of nesting indicating a greater degree of emphasis.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em"
		},
		{
			name: "embed",
			category: "Embedded content",
			doc: "The HTML <embed> Element represents an integration point for an external application or interactive content (in other words, a plug-in).",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed"
		},
		{
			name: "fieldset",
			category: "Forms",
			doc: "The HTML <fieldset> element is used to group several controls as well as labels (<label>) within a web form.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset"
		},
		{
			name: "figcaption",
			category: "Text content",
			doc: "The HTML <figcaption> Element represents a caption or a legend associated with a figure or an illustration described by the rest of the data of the <figure> element which is its immediate ancestor which means <figcaption> can be the first or last element inside a <figure> block. Also, the HTML Figcaption Element is optional; if not provided, then the parent figure element will have no caption.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption"
		},
		{
			name: "figure",
			category: "Text content",
			doc: "The HTML <figure> Element represents self-contained content, frequently with a caption (<figcaption>), and is typically referenced as a single unit. While it is related to the main flow, its position is independent of the main flow. Usually this is an image, an illustration, a diagram, a code snippet, or a schema that is referenced in the main text, but that can be moved to another page or to an appendix without affecting the main flow.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure"
		},
		{
			name: "font",
			category: "Obsolete and deprecated elements",
			doc: "The HTML Font Element (<font>) defines the font size, color and face for its content.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/font"
		},
		{
			name: "footer",
			category: "Content sectioning",
			doc: "The HTML Footer Element (<footer>) represents a footer for its nearest sectioning content or sectioning root element. A footer typically contains information about the author of the section, copyright data or links to related documents.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer"
		},
		{
			name: "form",
			category: "Forms",
			doc: "The HTML <form> element represents a document section that contains interactive controls to submit information to a web server.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form"
		},
		{
			name: "frame",
			category: "Obsolete and deprecated elements",
			doc: "<frame> is an HTML element which defines a particular area in which another HTML document can be displayed. A frame should be used within a <frameset>.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frame"
		},
		{
			name: "frameset",
			category: "Obsolete and deprecated elements",
			doc: "<frameset> is an HTML element which is used to contain <frame> elements.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frameset"
		},
		{
			name: "h1",
			category: "Content sectioning",
			doc: "Heading elements implement six levels of document headings, <h1> is the most important and <h6> is the least. A heading element briefly describes the topic of the section it introduces. Heading information may be used by user agents, for example, to construct a table of contents for a document automatically.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h1"
		},
		{
			name: "h2",
			category: "Content sectioning",
			doc: "Heading elements implement six levels of document headings, <h1> is the most important and <h6> is the least. A heading element briefly describes the topic of the section it introduces. Heading information may be used by user agents, for example, to construct a table of contents for a document automatically.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h2"
		},
		{
			name: "h3",
			category: "Content sectioning",
			doc: "Heading elements implement six levels of document headings, <h1> is the most important and <h6> is the least. A heading element briefly describes the topic of the section it introduces. Heading information may be used by user agents, for example, to construct a table of contents for a document automatically.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h3"
		},
		{
			name: "h4",
			category: "Content sectioning",
			doc: "Heading elements implement six levels of document headings, <h1> is the most important and <h6> is the least. A heading element briefly describes the topic of the section it introduces. Heading information may be used by user agents, for example, to construct a table of contents for a document automatically.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h4"
		},
		{
			name: "h5",
			category: "Content sectioning",
			doc: "Heading elements implement six levels of document headings, <h1> is the most important and <h6> is the least. A heading element briefly describes the topic of the section it introduces. Heading information may be used by user agents, for example, to construct a table of contents for a document automatically.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h5"
		},
		{
			name: "h6",
			category: "Content sectioning",
			doc: "Heading elements implement six levels of document headings, <h1> is the most important and <h6> is the least. A heading element briefly describes the topic of the section it introduces. Heading information may be used by user agents, for example, to construct a table of contents for a document automatically.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h6"
		},
		{
			name: "head",
			category: "Document metadata",
			doc: "The HTML Head Element (<head>) provides general information (metadata) about the document, including its title and links to or definitions of scripts and style sheets",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head"
		},
		{
			name: "header",
			category: "Content sectioning",
			doc: "The HTML <header> Element represents a group of introductory or navigational aids. It may contain some heading elements but also other elements like a logo, wrapped section's header, a search form, and so on.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header"
		},
		{
			name: "hgroup",
			category: "Content sectioning",
			doc: "The HTML <hgroup> Element (HTML Headings Group Element) represents the heading of a section. It defines a single title that participates in the outline of the document as the heading of the implicit or explicit section that it belongs to.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup"
		},
		{
			name: "hr",
			category: "Text content",
			doc: "The HTML <hr> element represents a thematic break between paragraph-level elements (for example, a change of scene in a story, or a shift of topic with a section). In previous versions of HTML, it represented a horizontal rule. It may still be displayed as a horizontal rule in visual browsers, but is now defined in semantic terms, rather than presentational terms.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr"
		},
		{
			name: "html",
			category: "Basic elements",
			doc: "The HTML Root Element (<html>) represents the root of an HTML document. All other elements must be descendants of this element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html"
		},
		{
			name: "i",
			category: "Inline text semantics",
			doc: "The HTML <i> Element represents a range of text that is set off from the normal text for some reason, for example, technical terms, foreign language phrases, or fictional character thoughts. It is typically displayed in italic type.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i"
		},
		{
			name: "iframe",
			category: "Embedded content",
			doc: "The HTML Inline Frame Element (<iframe>) represents a nested browsing context, effectively embedding another HTML page into the current page. In HTML 4.01, a document may contain a head and a body or a head and a frame-set, but not both a body and a frame-set. However, an <iframe> can be used within a normal document body. Each browsing context has its own session history and active document. The browsing context that contains the embedded content is called the parent browsing context. The top-level browsing context (which has no parent) is typically the browser window.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe"
		},
		{
			name: "img",
			category: "Image & multimedia",
			doc: "The HTML Image Element (<img>) represents an image of the document.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img"
		},
		{
			name: "input",
			category: "Forms",
			doc: "The HTML <input> element is used to create interactive controls for web-based forms in order to accept data from the user. How an <input> works varies considerably depending on the value of its type attribute.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input"
		},
		{
			name: "ins",
			category: "Edits",
			doc: "The HTML <ins> Element (or HTML Inserted Text) HTML represents a range of text that has been added to a document.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins"
		},
		{
			name: "isindex",
			category: "Obsolete and deprecated elements",
			doc: "<isindex> is an HTML element which is used for putting a text field in the document for querying document. <isindex> is intented to use inside of <head> element by W3C, however browsers provide support wherever it is used in the document.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/isindex"
		},
		{
			name: "kbd",
			category: "Inline text semantics",
			doc: "The HTML Keyboard Input Element (<kbd>) represents user input and produces an inline element displayed in the browser's default monospace font.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd"
		},
		{
			name: "keygen",
			category: "Forms",
			doc: "The HTML <keygen> element exists to facilitate generation of key material, and submission of the public key as part of an HTML form. This mechanism is designed for use with Web-based certificate management systems. It is expected that the <keygen> element will be used in an HTML form along with other information needed to construct a certificate request, and that the result of the process will be a signed certificate.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/keygen"
		},
		{
			name: "label",
			category: "Forms",
			doc: "The HTML Label Element (<label>) represents a caption for an item in a user interface. It can be associated with a control either by placing the control element inside the <label> element, or by using the for attribute. Such a control is called the labeled control of the label element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label"
		},
		{
			name: "legend",
			category: "Forms",
			doc: "The HTML <legend> Element (or HTML Legend Field Element) represents a caption for the content of its parent <fieldset>.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend"
		},
		{
			name: "li",
			category: "Text content",
			doc: "The HTML List Item Element (<li>) is used to represent an item in a list. It must be contained in a parent element: an ordered list (<ol>), an unordered list (<ul>), or a menu (<menu>). In menus and unordered lists, list items are usually displayed using bullet points. In ordered lists, they are usually displayed with an ascending counter on the left, such as a number or letter.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li"
		},
		{
			name: "link",
			category: "Document metadata",
			doc: "The HTML Link Element (<link>) specifies relationships between the current document and an external resource. Possible uses for this element include defining a relational framework for navigation. This Element is most used to link to style sheets.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link"
		},
		{
			name: "listing",
			category: "Obsolete and deprecated elements",
			doc: "The HTML Listing Element (<listing>) renders text between the start and end tags without interpreting the HTML in between and using a monospaced font. The HTML 2 standard recommended that lines shouldn't be broken when not greater than 132 characters.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/listing"
		},
		{
			name: "main",
			category: "Text content",
			doc: "The HTML Main Element (<main>) can be used as a container for the dominant contents of another element. The main content area consists of content that is directly related to, or expands upon the central topic of a section or the central functionality of an application. This content should be unique to the document, excluding any content that is repeated across a set of documents such as sidebars, navigation links, copyright information, site logos, and search forms (unless, of course, the document's main function is as a search form). Unlike <article> and <section>, this element does not contribute to the document outline.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main"
		},
		{
			name: "map",
			category: "Image & multimedia",
			doc: "The HTML <map> element is used with <area> elements to define an image map (a clickable link area).",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map"
		},
		{
			name: "mark",
			category: "Inline text semantics",
			doc: "The HTML Mark Element (<mark>) represents highlighted text, i.e., a run of text marked for reference purpose, due to its relevance in a particular context. For example it can be used in a page showing search results to highlight every instance of the searched-for word.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark"
		},
				{
			name: "marquee",
			category: "Obsolete and deprecated elements",
			doc: "The HTML <marquee> element is used to insert a scrolling area of text.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/marquee"
		},
		{
			name: "menu",
			category: "Interactive elements",
			doc: "The HTML <menu> element represents a group of commands that a user can perform or activate. This includes both list menus, which might appear across the top of a screen, as well as context menus, such as those that might appear underneath a button after it has been clicked.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu"
		},
		{
			name: "menuitem",
			category: "Interactive elements",
			doc: "The HTML <menuitem> element represents a command that a user is able to invoke through a popup menu. This includes context menus, as well as menus that might be attached to a menu button.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menuitem"
		},
		{
			name: "meta",
			category: "Document metadata",
			doc: "The HTML Meta Element (<meta>) represents any metadata information that cannot be represented by one of the other HTML meta-related elements (<base>, <link>, <script>, <style> or <title>).",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta"
		},
		{
			name: "meter",
			category: "Forms",
			doc: "The HTML <meter> Element represents either a scalar value within a known range or a fractional value.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter"
		},
		{
			name: "nav",
			category: "Content sectioning",
			doc: "The HTML Navigation Element (<nav>) represents a section of a page that links to other pages or to parts within the page: a section with navigation links.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav"
		},
		{
			name: "noembed",
			category: "Obsolete and deprecated elements",
			doc: "The <noembed> element is a deprecated and non-standard way to provide alternative, or \"fallback\", content for browsers that do not support the <embed> element or do not support embedded content an author wishes to use.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noembed"
		},
		{
			name: "noframes",
			category: "Embedded content",
			doc: "<noframes> is an HTML element which is used to supporting browsers which are not able to support <frame> elements or configured to do so.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noframes"
		},
		{
			name: "noscript",
			category: "Scripting",
			doc: "The HTML <noscript> Element defines a section of html to be inserted if a script type on the page is unsupported or if scripting is currently turned off in the browser.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript"
		},
		{
			name: "object",
			category: "Embedded content",
			doc: "The HTML Embedded Object Element (<object>) represents an external resource, which can be treated as an image, a nested browsing context, or a resource to be handled by a plugin.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object"
		},
		{
			name: "ol",
			category: "Text content",
			doc: "The HTML <ol> Element (or HTML Ordered List Element) represents an ordered list of items. Typically, ordered-list items are displayed with a preceding numbering, which can be of any form, like numerals, letters or Romans numerals or even simple bullets. This numbered style is not defined in the HTML description of the page, but in its associated CSS, using the list-style-type property.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol"
		},
		{
			name: "optgroup",
			category: "Forms",
			doc: "In a Web form, the HTML <optgroup> element  creates a grouping of options within a <select> element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup"
		},
		{
			name: "option",
			category: "Forms",
			doc: "In a Web form, the HTML <option> element is used to create a control representing an item within a <select>, an <optgroup> or a <datalist> HTML5 element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option"
		},
		{
			name: "output",
			category: "Forms",
			doc: "The HTML <output> element represents the result of a calculation or user action.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output"
		},
		{
			name: "p",
			category: "Text content",
			doc: "The HTML <p> element (or HTML Paragraph Element) represents a paragraph of text.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p"
		},
		{
			name: "param",
			category: "Embedded content",
			doc: "The HTML <param> Element (or HTML Parameter Element) defines parameters for <object>.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/param"
		},
		{
			name: "plaintext",
			category: "Obsolete and deprecated elements",
			doc: "The HTML Plaintext Element (<plaintext>) renders everything following the start tag as raw text, without interpreting any HTML. There is no closing tag, since everything after it is considered raw text.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/plaintext"
		},
		{
			name: "pre",
			category: "Text content",
			doc: "The HTML Preformatted Text (<pre>) represents preformatted text. Text within this element is typically displayed in a non-proportional font exactly as it is laid out in the file. Whitespaces inside this element are displayed as typed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre"
		},
		{
			name: "progress",
			category: "Forms",
			doc: "The HTML <progress> Element is used to view the completion progress of a task. While the specifics of how it's displayed is left up to the browser developer, it's typically displayed as a progress bar. Javascript can be used to manipulate the value of progress bar.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress"
		},
		{
			name: "q",
			category: "Inline text semantics",
			doc: "The HTML Quote Element (<q>) indicates that the enclosed text is a short inline quotation. This element is intended for short quotations that don't require paragraph breaks; for long quotations use <blockquote> element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q"
		},
		{
			name: "rp",
			category: "Inline text semantics",
			doc: "The HTML <rp> element is used to provide fall-back parenthesis for browsers non-supporting ruby annotations. Ruby annotations are for showing pronounciation of East Asian characters, like using Japanese furigana or Taiwainese bopomofo characters. The <rp> element is used in the case of lack of <ruby> element support its content has what should be displayed in order to indicate the presence of a ruby annotation, usually parentheses.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rp"
		},
		{
			name: "rt",
			category: "Inline text semantics",
			doc: "Editorial review completed.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rt"
		},
		{
			name: "rtc",
			category: "Inline text semantics",
			doc: "The HTML <rtc> Element embraces semantic annotations of characters presented in a ruby of <rb> elements used inside of <ruby> element. <rb> elements can have both pronunciation (<rt> and semantic (<rtc>) annotations.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rtc"
		},
		{
			name: "ruby",
			category: "Inline text semantics",
			doc: "The HTML <ruby> Element represents a ruby annotation. Ruby annotations are for showing pronunciation of East Asian characters.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby"
		},
		{
			name: "s",
			category: "Inline text semantics",
			doc: "The HTML Strikethrough Element (<s>) renders text with a strikethrough, or a line through it. Use the <s> element to represent things that are no longer relevant or no longer accurate. However, <s> is not appropriate when indicating document edits; for that, use the <del> and <ins> elements, as appropriate.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s"
		},
		{
			name: "samp",
			category: "Inline text semantics",
			doc: "The HTML <samp> element is an element intended to identify sample output from a computer program. It is usually displayed in the browser's default monotype font (such as Lucida Console).",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/samp"
		},
		{
			name: "script",
			category: "Scripting",
			doc: "The HTML Script Element (<script>) is used to embed or reference an executable script within an HTML or XHTML document.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script"
		},
		{
			name: "section",
			category: "Content sectioning",
			doc: "The HTML Section Element (<section>) represents a generic section of a document, i.e., a thematic grouping of content, typically with a heading. Each <section> should be identified, typically by including a heading (<h1>-<h6> element) as a child of the <section> element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section"
		},
		{
			name: "select",
			category: "Forms",
			doc: "The HTML select (<select>) element represents a control that presents a menu of options. The options within the menu are represented by <option> elements, which can be grouped by <optgroup> elements. Options can be pre-selected for the user.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select"
		},
		{
			name: "shadow",
			category: "<decorator>",
			doc: "The HTML <shadow> element is used as a shadow DOM insertion point. You might use it if you have created multiple shadow roots under a shadow host. It is not useful in ordinary HTML. It is used with Web Components.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/shadow"
		},
		{
			name: "small",
			category: "Inline text semantics",
			doc: "The HTML Small Element (<small>) makes the text font size one size smaller (for example, from large to medium, or from small to x-small) down to the browser's minimum font size.  In HTML5, this element is repurposed to represent side-comments and small print, including copyright and legal text, independent of its styled presentation.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small"
		},
		{
			name: "source",
			category: "Embedded content",
			doc: "The HTML <source> element is used to specify multiple media resources for <picture>, <audio> and <video> elements. It is an empty element. It is commonly used to serve the same media in multiple formats supported by different browsers.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source"
		},
		{
			name: "spacer",
			category: "Obsolete and deprecated elements",
			doc: "<spacer> is an HTML element which is used for inserting white spaces to web pages. It was created by NetScape for achieving same effect as a single-pixel layout GIF image, which was something web designers used to use to add white spaces to web pages, without actually using a GIF. However <spacer> is not supported by any major browser and same effects can be created with various CSS rules. In Mozilla applications, support for this element was removed in Gecko 2.0. Therefore usage of <spacer> is unnecessary.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/spacer"
		},
		{
			name: "span",
			category: "Inline text semantics",
			doc: "The HTML <span> element is a generic inline container for phrasing content, which does not inherently represent anything. It can be used to group elements for styling purposes (using the class or id attributes), or because they share attribute values, such as lang. It should be used only when no other semantic element is appropriate. <span> is very much like a <div> element, but <div> is a block-level element whereas a <span> is an inline element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span"
		},
		{
			name: "strike",
			category: "Obsolete and deprecated elements",
			doc: "The HTML Strikethrough Element (<strike>) renders text with a strikethrough, or a line through it.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strike"
		},
		{
			name: "strong",
			category: "Inline text semantics",
			doc: "The HTML Strong Element (<strong>) gives text strong importance, and is typically displayed in bold.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong"
		},
		{
			name: "style",
			category: "Document metadata",
			doc: "The HTML Style Element (<style>) contains style information for a document, or part of a document. By default, the style instructions written inside that element are expected to be CSS.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style"
		},
		{
			name: "sub",
			category: "Inline text semantics",
			doc: "The HTML Subscript Element (<sub>) defines a span of text that should be displayed, for typographic reasons, lower, and often smaller, than the main span of text.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub"
		},
		{
			name: "summary",
			category: "Interactive elements",
			doc: "The HTML summary element (<summary>) is used as a summary, caption, or legend for the content of a <details> element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary"
		},
		{
			name: "sup",
			category: "Inline text semantics",
			doc: "The HTML Superscript Element (<sup>) defines a span of text that should be displayed, for typographic reasons, higher, and often smaller, than the main span of text.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup"
		},
		{
			name: "table",
			category: "Table content",
			doc: "The HTML Table Element (<table>) represents data in two dimensions or more.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table"
		},
		{
			name: "tbody",
			category: "Table content",
			doc: "The HTML Table Body Element (",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody"
		},
		{
			name: "td",
			category: "Table content",
			doc: "The Table cell HTML element (<td>) defines a cell of a table that contains data. It participates in the table model.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td"
		},
		{
			name: "template",
			category: "<decorator>",
			doc: "The HTML template element <template> is a mechanism for holding client-side content that is not to be rendered when a page is loaded but may subsequently be instantiated during runtime using JavaScript.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template"
		},
		{
			name: "textarea",
			category: "Forms",
			doc: "The HTML <textarea> element represents a multi-line plain-text editing control.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea"
		},
		{
			name: "tfoot",
			category: "Table content",
			doc: "The HTML Table Foot Element (<tfoot>) defines a set of rows summarizing the columns of the table.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot"
		},
		{
			name: "th",
			category: "Table content",
			doc: "The HTML Table Header Cell Element (<th>) defines a cell that is a header for a group of cells of a table. The group of cells that the header refers to is defined by the scope and headers attribute.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th"
		},
		{
			name: "thead",
			category: "Table content",
			doc: "The HTML Table Head Element (<thead>) defines a set of rows defining the head of the columns of the table.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead"
		},
		{
			name: "time",
			category: "Inline text semantics",
			doc: "The HTML <time> element represents either a time on a 24-hour clock or a precise date in the Gregorian calendar (with optional time and timezone information).",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time"
		},
		{
			name: "title",
			category: "Document metadata",
			doc: "The HTML Title Element (<title>) defines the title of the document, shown in a browser's title bar or on the page's tab. It can only contain text and any contained tags are not interpreted.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title"
		},
		{
			name: "tr",
			category: "Table content",
			doc: "The HTML Table Row Element (<tr>) defines a row of cells in a table. Those can be a mix of <td> and <th> elements.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr"
		},
		{
			name: "track",
			category: "Image & multimedia",
			doc: "The HTML <track> element is used as a child of the media elements—<audio> and <video>. It lets you specify timed text tracks (or time-based data), for example to automatically handle subtitles. The tracks are formatted in WebVTT format (.vtt files) — Web Video Text Tracks.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track"
		},
		{
			name: "tt",
			category: "Obsolete and deprecated elements",
			doc: "The HTML Teletype Text Element (<tt>) produces an inline element displayed in the browser's default monotype font. This element was intended to style text as it would display on a fixed width display, such as a teletype. It probably is more common to display fixed width type using the <code> element.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tt"
		},
		{
			name: "u",
			category: "Inline text semantics",
			doc: "The HTML Underline Element (<u>) renders text with an underline, a line under the baseline of its content.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u"
		},
		{
			name: "ul",
			category: "Text content",
			doc: "The HTML unordered list element (<ul>) represents an unordered list of items, namely a collection of items that do not have a numerical ordering, and their order in the list is meaningless. Typically, unordered-list items are displayed with a bullet, which can be of several forms, like a dot, a circle or a squared. The bullet style is not defined in the HTML description of the page, but in its associated CSS, using the list-style-type property.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul"
		},
		{
			name: "var",
			category: "Inline text semantics",
			doc: "The HTML Variable Element (<var>) represents a variable in a mathematical expression or a programming context.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var"
		},
		{
			name: "video",
			category: "Image & multimedia",
			doc: "The HTML <video> element is used to embed video content. It may contain several video sources, represented using the src attribute or the <source> element; the browser will choose the most suitable one.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video"
		},
		{
			name: "wbr",
			category: "Inline text semantics",
			doc: "The Word Break Opportunity (<wbr>) HTML element represents a position within text where the browser may optionally break a line, though its line-breaking rules would not otherwise create a break at that location.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/wbr"
		},
		{
			name: "xmp",
			category: "Obsolete and deprecated elements",
			doc: "The HTML Example Element (<xmp>) renders text between the start and end tags without interpreting the HTML in between and using a monospaced font. The HTML2 specification recommended that it should be rendered wide enough to allow 80 characters per line.",
			url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/xmp"
		}
	];
	
	return {
		tagTemplates: tagTemplates,
		voidElements: voidElements
	};
});