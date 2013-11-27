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
				image: "../images/file.png"
			},
			{	id: "text/html",
				"extends": "text/plain",
				name: "HTML",
				extension: ["html", "htm"],
				image: "../images/html.png"
			},
			{	id: "text/css",
				"extends": "text/plain",
				name: "CSS",
				extension: ["css"],
				image: "../images/css.png"
			},
			{	id: "application/json",
				"extends": "text/plain",
				name: "JSON",
				extension: ["json"],
				image: "../images/file.png"
			},
			{	id: "application/xml",
				"extends": "text/plain",
				name: "XML",
				extension: ["xml"],
				image: "../images/xmlfile.png"
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
				image: "../images/wtp/image.gif"
			},
			{	id: "image/jpeg",
				name: "JPG",
				extension: ["jpg", "jpeg", "jpe"],
				image: "../images/wtp/image.gif"
			},
			{	id: "image/ico",
				name: "ICO",
				extension: ["ico"],
				image: "../images/wtp/image.gif"
			},
			{	id: "image/png",
				name: "PNG",
				extension: ["png"],
				image: "../images/wtp/image.gif"
			},
			{	id: "image/tiff",
				name: "TIFF",
				extension: ["tif", "tiff"],
				image: "../images/wtp/image.gif"
			},
			{	id: "image/svg",
				name: "SVG",
				extension: ["svg"],
				image: "../images/wtp/image.gif"
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
			contentType: ["text/plain", "text/html", "text/css", "application/javascript", "application/json", "application/xml", "text/x-java-source"]});

	provider.registerService("orion.navigate.openWith.default", {}, {
			editor: "orion.editor"});

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
        keywords: keywords.JSKeywords,
//        extends: "orion.text",
		delimiters: "[-`~!@#%^&*()=+[\\]{}|;:'\",.<>/?\\s]",
		contentType: ["application/javascript" /*, "text/x-java-source"*/],
		patterns: [
			{
//				match: " ",
//				name: "WHITE_SPACE"
//			}, {
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
//				match: "\t",
//				name: "WHITE_TAB"		
//			}, {
				match: "//.*",
				name: "SINGLELINE_COMMENT"
			}, {
				match: "'.*?('|$)",
				name: "STRING"
			}, {
				match: "\".*?(\"|$)",
				name: "STRING"
			}, {
				match: "-?(\\.\\d+|\\d+\\.?\\d*)(e[+-]?\\d+)?",
				name: "NUMBER"
			}, {
				match: "0x[0-9A-Fa-f]+",
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
						match: "TODO",
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
        keywords: keywords.JAVAKeywords,
//        extends: "orion.text",
		delimiters: "[-`~!@#%^&*()=+[\\]{}|;:'\",.<>/?\\s]",
		contentType: ["text/x-java-source"],
		patterns: [
			{
//				match: " ",
//				name: "WHITE_SPACE"
//			}, {
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
//				match: "\t",
//				name: "WHITE_TAB"		
//			}, {
				match: "//.*",
				name: "SINGLELINE_COMMENT"
			}, {
				match: "\".*?(\"|$)",
				name: "STRING"
			}, {
				match: "-?(\\.\\d+|\\d+\\.?\\d*)(e[+-]?\\d+)?",
				name: "NUMBER"
			}, {
				match: "0x[0-9A-Fa-f]+",
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
						match: "TODO",
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
//        extends: "orion.text",
		delimiters: "[-`~!@#%^&*()=+[\\]{}|;:'\",.<>/?\\s]",
		contentType: ["application/json"],
		patterns: [
			{
//				match: " ",
//				name: "WHITE_SPACE"
//			}, {
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
//				match: "\t",
//				name: "WHITE_TAB"
//			}, {
				match: "'.*?('|$)",
				name: "STRING"
			}, {
				match: "\".*?(\"|$)",
				name: "STRING"
			}, {
				match: "-?(\\.\\d+|\\d+\\.?\\d*)(e[+-]?\\d+)?",
				name: "NUMBER"
			}, {
				match: "0x[0-9A-Fa-f]+",
				name: "NUMBER"
			}
		]
	});
	provider.registerServiceProvider("orion.edit.highlighter", {
		// purely declarative, no service methods
    }, {
        id: "orion.schema.json",
        keywords: ["$schema", "id", "multipleOf", "maximum", "exclusiveMaximum", "minimum", "exclusiveMinimum",
            "maxLength", "minLength", "pattern", "additionalItems", "maxItems", "minItems", "uniqueItems",
            "maxProperties", "minProperties", "required", "additionalProperties", "properties", "patternProperties",
            "dependencies", "enum", "type", "allOf", "anyOf", "oneOf", "not", "definitions", "title", "description",
            "default", "format"],
//        extends: "orion.json",
		delimiters: "[-`~!@#%^&*()=+[\\]{}|;:'\",.<>/?\\s]",
		contentType: ["application/schema+json"],
		patterns: [
			{
//				match: " ",
//				name: "WHITE_SPACE"
//			}, {
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
//				match: "\t",
//				name: "WHITE_TAB"		
//			}, {
				match: "'.*?('|$)",
				name: "STRING"		
			}, {
				match: "\".*?(\"|$)",
				name: "STRING"		
			}, {
				match: "-?(\\.\\d+|\\d+\\.?\\d*)(e[+-]?\\d+)?",
				name: "NUMBER"
			}, {
				match: "0x[0-9A-Fa-f]+",
				name: "NUMBER"	
			}
		]
	});
	
	provider.registerServiceProvider("orion.edit.highlighter", {
		// purely declarative, no service methods
    }, {
        id: "orion.css",
        keywords: keywords.CSSKeywords,
//        extends: "orion.text",
		delimiters: "[-`~!@#%^&*()=+[\\]{}|;:'\",.<>/?\\s]",
		contentType: ["text/css"],
		patterns: [
			{
//				match: " ",
//				name: "WHITE_SPACE"
//			}, {
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
//				match: "\t",
//				name: "WHITE_TAB"		
//			}, {
				match: "'.*?'",
				name: "STRING"		
			}, {
				match: "\".*?\"",
				name: "STRING"		
			}, {
				match: "-?(\\.\\d+|\\d+\\.?\\d*)(%|em|ex|ch|rem|vw|vh|vmin|vmax|in|cm|mm|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
				name: "NUMBER"
			}, {
				match: "#[0-9A-Fa-f]+",
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