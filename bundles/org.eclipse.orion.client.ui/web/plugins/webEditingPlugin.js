/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define*/
define([
	'orion/plugin',
	'orion/editor/cssContentAssist',
	'orion/editor/htmlContentAssist',
	'orion/editor/htmlGrammar',
	'orion/editor/jsTemplateContentAssist',
	'orion/editor/keywords',
	'orion/editor/templates'
], function(PluginProvider, cssContentAssist, htmlContentAssist, htmlGrammar, jsTemplateContentAssist, keywords, templates) {
	var headers = {
		name: "Orion Web Editing Plugin",
		version: "1.0",
		description: "This plugin provides editor link support for the navigator and provides default editing capabilities for HTML, JavaScript, and CSS."
	};

	var provider = new PluginProvider(headers);

	provider.registerService("orion.core.contenttype", {}, {
		contentTypes:
			// Text types
			[{	id: "text/plain",
				name: "Text",
				extension: ["txt"],
				imageClass: "file-sprite-text modelDecorationSprite"
			},
			{	id: "text/html",
				"extends": "text/plain",
				name: "HTML",
				extension: ["html", "htm"],
				imageClass: "file-sprite-html modelDecorationSprite"
			},
			{	id: "text/css",
				"extends": "text/plain",
				name: "CSS",
				extension: ["css"],
				imageClass: "file-sprite-css modelDecorationSprite"
			},
			{	id: "application/json",
				"extends": "text/plain",
				name: "JSON",
				extension: ["json"],
				imageClass: "file-sprite-text modelDecorationSprite"
			},
			{	id: "application/xml",
				"extends": "text/plain",
				name: "XML",
				extension: ["xml"],
				imageClass: "file-sprite-xml"
			},
			{	id: "text/x-java-source",
				"extends": "text/plain",
				name: "Java",
				extension: ["java"]
			},
			{	id: "text/x-markdown",
				"extends": "text/plain",
				name: "Markdown",
				extension: ["md"]
			},
			{	id: "text/x-yaml",
				"extends": "text/plain",
				name: "YAML",
				extension: ["yaml", "yml"]
			},
			{	id: "text/conf",
				"extends": "text/plain",
				name: "Conf",
				extension: ["conf"]
			},
			{	id: "text/sh",
				"extends": "text/plain",
				name: "sh",
				extension: ["sh"]
			},
			// Image types
			{	id: "image/gif",
				name: "GIF",
				extension: ["gif"],
				imageClass: "file-sprite-image modelDecorationSprite"
			},
			{	id: "image/jpeg",
				name: "JPG",
				extension: ["jpg", "jpeg", "jpe"],
				imageClass: "file-sprite-image modelDecorationSprite"
			},
			{	id: "image/ico",
				name: "ICO",
				extension: ["ico"],
				imageClass: "file-sprite-image modelDecorationSprite"
			},
			{	id: "image/png",
				name: "PNG",
				extension: ["png"],
				imageClass: "file-sprite-image modelDecorationSprite"
			},
			{	id: "image/tiff",
				name: "TIFF",
				extension: ["tif", "tiff"],
				imageClass: "file-sprite-image modelDecorationSprite"
			},
			{	id: "image/svg",
				name: "SVG",
				extension: ["svg"],
				imageClass: "file-sprite-image modelDecorationSprite"
			}]
		});

	provider.registerService("orion.edit.editor", {}, {
		id: "orion.editor",
		nameKey: "Orion Editor",
		nls: "orion/nls/messages",
		uriTemplate: "../edit/edit.html#{,Location,params*}",
		orionTemplate: "../edit/edit.html#{,Location,params*}"});

	// only providing excludedContentTypes for orion.editor because we want 
	// to attempt to open files with unknown content types with it for now
	// e.g. A text file with no extension is currently of an unknown content
	// type, we want to use the orion.editor to open it
	provider.registerService("orion.navigate.openWith", {}, {
		editor: "orion.editor",
		excludedContentTypes: ["image/*"]});
			
	provider.registerService("orion.navigate.openWith.default", {}, {
			editor: "orion.editor"});

	provider.registerService("orion.edit.editor", {}, {
		id: "orion.markdownViewer",
		nameKey: "Orion Markdown Viewer",
		nls: "orion/nls/messages",
		uriTemplate: "../edit/edit.html#{,Location,params*},editor=orion.markdownViewer"});
		
	provider.registerService("orion.navigate.openWith", {}, {
			editor: "orion.markdownViewer",
			contentType: ["text/x-markdown"]});
		
	provider.registerService("orion.edit.editor", {}, {
		id: "orion.imageViewer",
		nameKey: "Orion Image Viewer",
		nls: "orion/nls/messages",
		contentUriTemplate: "../edit/content/imageViewer.html#{,Location,params*}",
		uriTemplate: "../edit/edit.html#{,Location,params*},editor=orion.imageViewer"});

	provider.registerService("orion.navigate.openWith", {}, {
			editor: "orion.imageViewer",
			contentType: ["image/gif", "image/jpeg", "image/ico", "image/png", "image/tiff", "image/svg"]});

	// open file with browser, no associated orion.navigate.openWith command means that any content type is valid
	provider.registerService("orion.edit.editor", {}, {
		id: "orion.view.raw",
		nameKey: "Browser",
		nls: "orion/nls/messages",
		uriTemplate:  "{+Location}",
		validationProperties: [{
			source: "!Projects" // Filter out workspace; Raw only applies to regular files and folders.
		}]
	});
	
	// Register content assist providers
	provider.registerService("orion.edit.contentassist",
		new cssContentAssist.CssContentAssistProvider(),
		{	name: "CSS content assist",
			contentType: ["text/css"]
		});
	provider.registerService("orion.edit.contentassist",
		new jsTemplateContentAssist.JSTemplateContentAssistProvider(),
		{	name: "JavaScript content assist",
			contentType: ["application/javascript"]
		});
	provider.registerService("orion.edit.contentassist",
		new htmlContentAssist.HTMLContentAssistProvider(),
		{	name: "HTML content assist",
			contentType: ["text/html"]
		});

	// Register syntax highlighting (TextMate-based)
//	provider.registerService("orion.edit.highlighter", {},
//		{	type: "grammar",
//			contentType: ["text/html"],
//			grammar: new htmlGrammar.HtmlGrammar()
//		});

	// Register syntax highlighting (Orion)
	provider.registerServiceProvider("orion.edit.highlighter", {
		// purely declarative, no service methods
    }, {
        id: "orion.patterns",
		patterns: [
			{
				id: "brace_open",
				match: "{",
				name: "orion.enclosure.brace.start"
			}, {
				id: "brace_close",
				match: "}",
				name: "orion.enclosure.brace.end"
			}, {
				id: "bracket_open",
				match: "\\[",
				name: "orion.enclosure.bracket.start"
			}, {
				id: "bracket_close",
				match: "\\]",
				name: "orion.enclosure.bracket.end"
			}, {
				id: "parenthesis_open",
				match: "\\(",
				name: "orion.enclosure.parenthesis.start"
			}, {
				id: "parenthesis_close",
				match: "\\)",
				name: "orion.enclosure.parenthesis.end"
			}, {
				id: "comment_singleline",
				begin: "//",
				end: "\\n",
				name: "SINGLELINE_COMMENT",
				patterns: [
					{
						match: "(\\b)(TODO)(\\s|$)(.*)",
						name: "orion.annotation.todo",
						captures: {
							2: {name: "DOC_TAG"},
							4: {name: "SINGLELINE_COMMENT"}
						}
					}
				]
			}, {
				id: "comment_multiline",
				begin: "/\\*",
				end: "(?:\\*/|$)",
				name: "MULTILINE_COMMENT",
				patterns: [
					{
						match: "@\\S*",
						name: "DOC_TAG"
					}, {
						match: "\\<\\S*\\>?",
						name: "DOC_COMMENT"
					}, {
						match: "(\\b)(TODO)(\\s|$)(.*)",
						name: "orion.annotation.todo",
						captures: {
							2: {name: "DOC_TAG"},
							4: {name: "MULTILINE_COMMENT"}
						}
					}
				]
			}, {
				id: "string_singleline",
				match: "\"(?:\\\\.|[^\"])*(?:\"|$)",
				name: "STRING"
			}, {
				id: "string_singleQuote",
				match: "'(?:\\\\.|[^'])*(?:'|$)",
				name: "STRING"
			}, {
				id: "number_decimal",
				match: "\\b-?(?:\\.\\d+|\\d+\\.?\\d*)(?:e[+-]?\\d+)?\\b",
				name: "NUMBER"
			}, {
				id: "number_hex",
				match: "\\b0x[0-9A-Fa-f]+\\b",
				name: "NUMBER"
			}
		]
	});

	provider.registerServiceProvider("orion.edit.highlighter", {
		// purely declarative, no service methods
    }, {
        id: "orion.js",
		contentTypes: ["application/javascript"],
		patterns: [
			{
				include: "orion.patterns"
			}, {
				match: "\\b(?:" + keywords.JSKeywords.join("|") + ")\\b",
				name: "KEYWORD"
			}, {
				begin: "'[^'\\n]*\\\\\n",
				end: "(?:[^'\\n]*\\\\\\n)*[^'\\n]*'?",
				name: "MULTILINE_STRING"
			}, {
				begin: "\"[^\"\\n]*\\\\\n",
				end: "(?:[^\"\\n]*\\\\\\n)*[^\"\\n]*\"?",
				name: "MULTILINE_STRING"
			}
		]
	});
	provider.registerServiceProvider("orion.edit.highlighter", {
		// purely declarative, no service methods
    }, {
        id: "orion.java",
		contentTypes: ["text/x-java-source"],
		patterns: [
			{
				include: "orion.patterns"
			}, {
				id: keywords,
				match: "\\b(?:" + keywords.JAVAKeywords.join("|") + ")\\b",
				name: "KEYWORD"
			}, {
				/* override orion.patterns#string_singleQuote */
				id: "string_singleQuote"
			}
		]
	});

	provider.registerServiceProvider("orion.edit.highlighter", {
		// purely declarative, no service methods
    }, {
        id: "orion.json",
		contentTypes: ["application/json"],
		patterns: [
			{
				include: "orion.patterns"
			}, {
				id: keywords,
				match: "\\b(?:true|false|null)\\b",
				name: "KEYWORD"
			}, {
				/* override orion.patterns#comment_singleline */
				id: "comment_singleline"
			}, {
				/* override orion.patterns#comment_multiline */
				id: "comment_multiline"
			}
		]
	});
	provider.registerServiceProvider("orion.edit.highlighter", {
		// purely declarative, no service methods
    }, {
        id: "orion.json.schema",
		contentTypes: ["application/schema+json"],
		patterns: [
			{
				include: "orion.json"
			}, {
				id: keywords,
				match: "(?:\\$schema|(?:\\b(?:id|multipleOf|maximum|exclusiveMaximum|minimum|exclusiveMinimum|\
					maxLength|minLength|pattern|additionalItems|maxItems|minItems|uniqueItems|\
					maxProperties|minProperties|required|additionalProperties|properties|patternProperties|\
					dependencies|enum|type|allOf|anyOf|oneOf|not|definitions|title|description|default|format)))\\b",
				name: "KEYWORD"
			}
		]
	});

	provider.registerServiceProvider("orion.edit.highlighter", {
		// purely declarative, no service methods
    }, {
        id: "orion.css",
		contentTypes: ["text/css"],
		patterns: [
			{
				include: "orion.patterns"
			}, {
				match: "(?:-webkit-|-moz-|-ms-|\\b)(?:" + keywords.CSSKeywords.join("|") + ")\\b",
				name: "KEYWORD"
			}, {
				match: "'.*?(?:'|$)",
				name: "STRING"
			}, {
				match: "\\b-?(?:\\.\\d+|\\d+\\.?\\d*)(?:%|em|ex|ch|rem|vw|vh|vmin|vmax|in|cm|mm|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?\\b",
				name: "NUMBER"
			}, {
				match: "#[0-9A-Fa-f]+\\b",
				name: "NUMBER"
			}, {
				/* override orion.patterns#comment_singleline */
				id: "comment_singleline"
			}, {
				/* override orion.patterns#string_singleQuote */
				id: "string_singleQuote"
			}
		]
	});
	
	provider.registerServiceProvider("orion.edit.highlighter", {
		// purely declarative, no service methods
    }, {
        id: "orion.html",
        contentTypes: ["text/html"],
		patterns: [
			{
				begin: "(<!(?:doctype|DOCTYPE))",
				end: "(>)",
				captures: {
					1: {name: "HTML_MARKUP"},
				}
			}, {
				begin: "(<script)([^>]*)(>)",
				end: "(</script>|$)",
				captures: {
					1: {name: "HTML_MARKUP"},
					3: {name: "HTML_MARKUP"}
				},
				patterns: [
					{
						include: "orion.js"
					}
				]
			}, {
				begin: "(<style)([^>]*)(>)",
				end: "(</style>|$)",
				captures: {
					1: {name: "HTML_MARKUP"},
					3: {name: "HTML_MARKUP"}
				},
				patterns: [
					{
						include: "orion.css"
					}
				]
			}, {
				begin: "<!--",
				end: "-->|$",
				name: "MULTILINE_COMMENT"
			}, {
				begin: "(</?[A-Za-z0-9]+)",
				end: "(/?>)",
				captures: {
					1: {name: "HTML_MARKUP"},
				},
				patterns: [
					{
						include: "#comment"
					}, {
						include: "orion.patterns#string"
					}, {
						include: "orion.patterns#string_singleQuote"
					}
				]
			}
		]
	});

	provider.connect();
});
