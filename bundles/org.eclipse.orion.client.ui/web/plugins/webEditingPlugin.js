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

	provider.registerService("orion.navigate.command", {}, {
		id: "orion.view.raw",
		nameKey: "Raw",
		nls: "orion/nls/messages",
		tooltipKey: "Open the raw file or folder in the browser",
		uriTemplate:  "{+Location}",
		forceSingleItem: true,
		validationProperties: [{
			source: "!Projects" // Filter out workspace; Raw only applies to regular files and folders.
		}]
	});

	provider.registerService("orion.edit.editor", {}, {
		id: "orion.editor",
		nameKey: "Orion Editor",
		nls: "orion/nls/messages",
		uriTemplate: "../edit/edit.html#{,Location,params*}",
		orionTemplate: "../edit/edit.html#{,Location,params*}"});

	provider.registerService("orion.navigate.openWith", {}, {
			editor: "orion.editor",
			contentType: ["text/plain", "text/html", "text/css", "application/javascript", "application/json", "application/xml", "text/x-java-source", "text/x-markdown"]});

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
	provider.registerService("orion.edit.highlighter", {},
		{	type: "grammar",
			contentType: ["text/html"],
			grammar: new htmlGrammar.HtmlGrammar()
		});

	// Register syntax highlighting (Orion)
	provider.registerServiceProvider("orion.edit.highlighter", {
		// purely declarative, no service methods
    }, {
        id: "orion.js",
		contentTypes: ["application/javascript"],
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
				id: "backet_open",
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
				match: "\\b(" + keywords.JSKeywords.join("|") + ")\\b",
				name: "KEYWORD"
			}, {
				id: "comment_single",
				begin: "//",
				end: "[^\\n]*",
				name: "SINGLELINE_COMMENT",
				patterns: [
					{
						match: "\\bTODO(\\s|$).*",
						name: "TASK_TAG"
					}
				]
			}, {
				match: "'.*?('|$)",
				name: "STRING"
			}, {
				id: "string",
				match: "\"(\\\\.|[^\"])*(\"|$)",
				name: "STRING"
			}, {
				id: "number",
				match: "\\b-?(\\.\\d+|\\d+\\.?\\d*)(e[+-]?\\d+)?\\b",
				name: "NUMBER"
			}, {
				id: "number_hex",
				match: "\\b0x[0-9A-Fa-f]+\\b",
				name: "NUMBER"
			}, {
				id: "comment_multi",
				begin: "/\\*",
				end: "(\\*/|$)",
				name: "MULTILINE_COMMENT",
				patterns: [
					{
						match: "@\\S*",
						name: "DOC_TAG"
					}, {
						match: "\\<\\S*\\>?",
						name: "DOC_COMMENT"
					}, {
						match: "\\bTODO(\\s(\\*[^/]|[^*\\n])*|$)",
						name: "TASK_TAG"
					}
				]
			}, {
				begin: "\"[^\"\\n]*\\\\\n",
				end: "([^\"\\n]*\\\\\\n)*[^\"\\n]*\"?",
				name: "MULTILINE_STRING"
			}, {
				begin: "'[^'\\n]*\\\\\n",
				end: "([^'\\n]*\\\\\\n)*[^'\\n]*'?",
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
				match: "{",
				name: "orion.enclosure.brace.start"
			}, {
				match: "}",
				name: "orion.enclosure.brace.end"
			}, {
				match: "\\[",
				name: "orion.enclosure.bracket.start"
			}, {
				match: "\\]",
				name: "orion.enclosure.bracket.end"
			}, {
				match: "\\(",
				name: "orion.enclosure.parenthesis.start"
			}, {
				match: "\\)",
				name: "orion.enclosure.parenthesis.end"
			}, {
				match: "\\b(" + keywords.JAVAKeywords.join("|") + ")\\b",
				name: "KEYWORD"
			}, {
				begin: "//",
				end: "[^\\n]*",
				name: "SINGLELINE_COMMENT",
				patterns: [
					{
						match: "\\bTODO(\\s|$).*",
						name: "TASK_TAG"
					}
				]
			}, {
				match: "\"(\\\\.|[^\"])*(\"|$)",
				name: "STRING"
			}, {
				match: "\\b-?(\\.\\d+|\\d+\\.?\\d*)(e[+-]?\\d+)?\\b",
				name: "NUMBER"
			}, {
				match: "\\b0x[0-9A-Fa-f]+\\b",
				name: "NUMBER"
			}, {
				begin: "/\\*",
				end: "(\\*/|$)",
				name: "MULTILINE_COMMENT",
				patterns: [
					{
						match: "@\\S*",
						name: "DOC_TAG"
					}, {
						match: "\\<\\S*\\>?",
						name: "DOC_COMMENT"
					}, {
						match: "\\bTODO(\\s(\\*[^/]|[^*\\n])*|$)",
						name: "TASK_TAG"
					}
				]
			// TODO
//			}, {
//				begin: "\"[^\"\\n]*\\\\\n",
//				end: "([^\"\\n]*\\\\\\n)*[^\"\\n]*\"?",
//				name: "MULTILINE_STRING"
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
				match: "{",
				name: "orion.enclosure.brace.start"
			}, {
				match: "}",
				name: "orion.enclosure.brace.end"
			}, {
				match: "\\[",
				name: "orion.enclosure.bracket.start"
			}, {
				match: "\\]",
				name: "orion.enclosure.bracket.end"
			}, {
				match: "\\(",
				name: "orion.enclosure.parenthesis.start"
			}, {
				match: "\\)",
				name: "orion.enclosure.parenthesis.end"
			}, {
				match: "'.*?('|$)",
				name: "STRING"
			}, {
				match: "\"(\\\\.|[^\"])*(\"|$)",
				name: "STRING"
			}, {
				match: "\\b-?(\\.\\d+|\\d+\\.?\\d*)(e[+-]?\\d+)?\\b",
				name: "NUMBER"
			}, {
				match: "\\b0x[0-9A-Fa-f]+\\b",
				name: "NUMBER"
			}
		]
	});
	provider.registerServiceProvider("orion.edit.highlighter", {
		// purely declarative, no service methods
    }, {
        id: "orion.schema.json",
		contentTypes: ["application/schema+json"],
		patterns: [
			{
				match: "{",
				name: "orion.enclosure.brace.start"
			}, {
				match: "}",
				name: "orion.enclosure.brace.end"
			}, {
				match: "\\[",
				name: "orion.enclosure.bracket.start"
			}, {
				match: "\\]",
				name: "orion.enclosure.bracket.end"
			}, {
				match: "\\(",
				name: "orion.enclosure.parenthesis.start"
			}, {
				match: "\\)",
				name: "orion.enclosure.parenthesis.end"
			}, {
				match: "(\\$schema|(\\b(id|multipleOf|maximum|exclusiveMaximum|minimum|exclusiveMinimum|\
					maxLength|minLength|pattern|additionalItems|maxItems|minItems|uniqueItems|\
					maxProperties|minProperties|required|additionalProperties|properties|patternProperties|\
					dependencies|enum|type|allOf|anyOf|oneOf|not|definitions|title|description|default|format)))\\b",
				name: "KEYWORD"
			}, {
				match: "'.*?('|$)",
				name: "STRING"
			}, {
				match: "\"(\\\\.|[^\"])*(\"|$)",
				name: "STRING"
			}, {
				match: "\\b-?(\\.\\d+|\\d+\\.?\\d*)(e[+-]?\\d+)?\\b",
				name: "NUMBER"
			}, {
				match: "\\b0x[0-9A-Fa-f]+\\b",
				name: "NUMBER"
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
				match: "{",
				name: "orion.enclosure.brace.start"
			}, {
				match: "}",
				name: "orion.enclosure.brace.end"
			}, {
				match: "\\[",
				name: "orion.enclosure.bracket.start"
			}, {
				match: "\\]",
				name: "orion.enclosure.bracket.end"
			}, {
				match: "\\(",
				name: "orion.enclosure.parenthesis.start"
			}, {
				match: "\\)",
				name: "orion.enclosure.parenthesis.end"
			}, {
				match: "\\b(" + keywords.CSSKeywords.join("|") + ")\\b",
				name: "KEYWORD"
			}, {
				match: "'.*?'",
				name: "STRING"
			}, {
				match: "\"(\\\\.|[^\"])*(\"|$)",
				name: "STRING"
			}, {
				match: "\\b-?(\\.\\d+|\\d+\\.?\\d*)(%|em|ex|ch|rem|vw|vh|vmin|vmax|in|cm|mm|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?\\b",
				name: "NUMBER"
			}, {
				match: "#[0-9A-Fa-f]+\\b",
				name: "NUMBER"
			}, {
				begin: "/\\*",
				end: "(\\*/|$)",
				name: "MULTILINE_COMMENT"
			}
		]
	});

	provider.connect();
});
